import mongoose from 'mongoose';
import Document from '../../models/document.model.js';
import Topic from '../../models/topic.model.js';
import { incrementVersion } from '../../services/version/versionUtils.js';
import { createVersionRecord, computeVersionDiff } from '../../services/version/versionDiff.service.js';
import * as logger from '../../utils/logger.js';

/**
 * Builds version chain for document re-ingestion
 * Handles parent_document_id linking, version increment, and archival of old topics
 * @param {string} documentId - Logical document ID (e.g., doc_xxxxx)
 * @param {string} newContentHash - SHA256 hash of new content
 * @returns {Promise<{isUpdate: boolean, documentVersion: number, parentDocumentId: string|null, previousTopics: Array}>}
 */
export async function buildVersionChain(documentId, newContentHash) {
  if (!documentId) {
    // First ingestion - no version chain needed
    return {
      isUpdate: false,
      documentVersion: 1,
      parentDocumentId: null,
      previousTopics: []
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the latest version of this document
    const latestDoc = await Document.findOne({
      'document_metadata.document_id': documentId,
      'document_metadata.is_latest': true
    }).session(session).lean();

    if (!latestDoc) {
      // First ingestion with provided documentId - start at version 1
      await session.abortTransaction();
      return {
        isUpdate: false,
        documentVersion: 1,
        parentDocumentId: null,
        previousTopics: []
      };
    }

    // Check if content actually changed (hash comparison)
    if (latestDoc.document_metadata.content_hash === newContentHash) {
      // Content identical - should have been caught by duplicate check
      await session.abortTransaction();
      return {
        isUpdate: false,
        documentVersion: latestDoc.document_metadata.document_version || 1,
        parentDocumentId: latestDoc._id.toString(),
        previousTopics: []
      };
    }

    // Content changed - create new version
    const newVersion = incrementVersion(latestDoc.document_metadata.document_version);
    
    // Get all topics from the previous version (flat field in topic model)
    const previousTopics = await Topic.find({
      document_id: documentId,
      is_latest: true
    }).select('_id slug').session(session).lean();

    // Mark previous document as not latest (nested path)
    await Document.findByIdAndUpdate(
      latestDoc._id,
      { 
        $set: { 
          'document_metadata.is_latest': false,
          updated_at: new Date()
        }
      },
      { session }
    );

    logger.info(
      { 
        documentId, 
        oldVersion: latestDoc.document_metadata.document_version, 
        newVersion,
        topicsToArchive: previousTopics.length 
      },
      'Version chain created - topics will be archived by persistIngestion'
    );

    await session.commitTransaction();

    // Note: Version record creation and topic archival moved to persistIngestion
    // to ensure atomic transaction with all other writes

    return {
      isUpdate: true,
      documentVersion: newVersion,
      parentDocumentId: latestDoc._id.toString(),
      previousTopics: previousTopics.map(t => ({ _id: t._id, slug: t.slug }))
    };

  } catch (error) {
    await session.abortTransaction();
    logger.error({ err: error }, 'Failed to build version chain');
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Archives topics from previous document version
 * Called after new version is successfully persisted
 * @param {Array} previousTopics - Array of topic IDs from previous version
 * @param {string} documentId - Logical document ID
 */
export async function archivePreviousTopics(previousTopics, documentId) {
  if (!previousTopics || previousTopics.length === 0) {
    return { archived: 0 };
  }

  const topicIds = previousTopics.map(t => t._id);

  // Soft-delete topics by setting is_archived flag (topic model has flat is_latest field)
  const result = await Topic.updateMany(
    { 
      _id: { $in: topicIds },
      document_id: documentId
    },
    {
      $set: { 
        is_archived: true,
        is_latest: false,
        archived_at: new Date()
      }
    }
  );

  logger.info(
    { documentId, archivedCount: result.modifiedCount },
    'Previous version topics archived'
  );

  return { archived: result.modifiedCount };
}

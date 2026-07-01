import mongoose from 'mongoose';
import Version from '../../models/version.model.js';
import Topic from '../../models/topic.model.js';
import * as logger from '../../utils/logger.js';

/**
 * Computes diff between two document versions
 * @param {string} oldDocId - _id of previous document version
 * @param {string} newDocId - _id of new document version
 * @returns {Promise<{added_topics: Array, removed_topics: Array, changed_topics: Array}>}
 */
export async function computeVersionDiff(oldDocId, newDocId) {
  if (!oldDocId || !newDocId) {
    return {
      added_topics: [],
      removed_topics: [],
      changed_topics: [],
      content_delta: {}
    };
  }

  try {
    // Get topics from old version (archived)
    const oldTopics = await Topic.find({
      document_id: { $exists: true },
      is_archived: true
    }).select('topic_id slug title').lean();

    // Get topics from new version (not archived)
    const newTopics = await Topic.find({
      document_id: { $exists: true },
      is_archived: { $ne: true }
    }).select('topic_id slug title').lean();

    const oldTopicMap = new Map(oldTopics.map(t => [t.topic_id, t]));
    const newTopicMap = new Map(newTopics.map(t => [t.topic_id, t]));

    const added_topics = [];
    const removed_topics = [];
    const changed_topics = [];

    // Find added and changed topics
    for (const newTopic of newTopics) {
      const oldTopic = oldTopicMap.get(newTopic.topic_id);
      if (!oldTopic) {
        added_topics.push({
          topic_id: newTopic.topic_id,
          slug: newTopic.slug,
          title: newTopic.title
        });
      } else if (oldTopic.slug !== newTopic.slug || oldTopic.title !== newTopic.title) {
        changed_topics.push({
          topic_id: newTopic.topic_id,
          changes: {
            slug: oldTopic.slug !== newTopic.slug ? { from: oldTopic.slug, to: newTopic.slug } : undefined,
            title: oldTopic.title !== newTopic.title ? { from: oldTopic.title, to: newTopic.title } : undefined
          }
        });
      }
    }

    // Find removed topics
    for (const oldTopic of oldTopics) {
      if (!newTopicMap.has(oldTopic.topic_id)) {
        removed_topics.push({
          topic_id: oldTopic.topic_id,
          slug: oldTopic.slug,
          title: oldTopic.title
        });
      }
    }

    const diff = {
      added_topics,
      removed_topics,
      changed_topics,
      summary: {
        added_count: added_topics.length,
        removed_count: removed_topics.length,
        changed_count: changed_topics.length
      }
    };

    logger.info(
      { oldDocId, newDocId, ...diff.summary },
      'Version diff computed'
    );

    return diff;

  } catch (error) {
    logger.error({ err: error }, 'Failed to compute version diff');
    throw error;
  }
}

/**
 * Creates a version record in the database
 * @param {object} params - Version parameters
 * @param {string} params.document_id - Logical document ID
 * @param {number} params.version_number - Version number (e.g., 2)
 * @param {string} params.previous_version_id - _id of previous version
 * @param {object} params.diff_summary - Diff summary object
 * @returns {Promise<object>} Created version record
 */
export async function createVersionRecord({ document_id, version_number, previous_version_id, diff_summary }) {
  try {
    // Convert diff_summary to string as per schema requirement
    const diffSummaryString = typeof diff_summary === 'string' 
      ? diff_summary 
      : JSON.stringify(diff_summary, null, 2);

    const versionRecord = await Version.create({
      scope: 'document',
      entity_id: document_id,
      document_id,
      version: String(version_number),
      parent_version_id: previous_version_id,
      diff_summary: diffSummaryString,
      snapshot_ref: '',
      timestamp: new Date()
    });

    logger.info(
      { document_id, version_number, versionRecordId: versionRecord._id },
      'Version record created'
    );

    return versionRecord;

  } catch (error) {
    logger.error({ err: error }, 'Failed to create version record');
    throw error;
  }
}

import mongoose from 'mongoose';
import * as logger from '../../utils/logger.js';
import { incrementStats } from '../stats/platformStats.service.js';
import { archivePreviousTopics } from './buildVersionChain.service.js';
import { registerSlugRedirect } from '../slug/slugRedirect.service.js';
import { computeVersionDiff, createVersionRecord } from '../version/versionDiff.service.js';

// Dynamically import Mongoose models to comply with project structural layouts safely
import Document from '../../models/document.model.js';
import Topic from '../../models/topic.model.js';
import TopicContent from '../../models/topicContent.model.js';
import TopicAsset from '../../models/topicAsset.model.js';
import TopicAssessment from '../../models/topicAssessment.model.js';
import SlugRegistry from '../../models/slugRegistry.model.js';

let AssetRegistry;
try {
    // Graceful initialization check in case asset_registry model variations exist across implementations
    const mod = await import('../../models/assetRegistry.model.js');
    AssetRegistry = mod.default;
} catch (e) {
    logger.warn('assetRegistry model file was not resolved. Proceeding with embedded normalization fallbacks.');
}

/**
 * Bulk replacement helper function to group operations in batches of 1000
 */
async function bulkReplace(Model, items, filterKey = '_id', session = null) {
    if (!items || items.length === 0) return;
    
    const BATCH_SIZE = 1000;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const chunk = items.slice(i, i + BATCH_SIZE);
        const operations = chunk.map(item => ({
            replaceOne: {
                filter: { [filterKey]: item[filterKey] },
                replacement: item,
                upsert: true
            }
        }));
        
        await Model.bulkWrite(operations, { session, ordered: false });
    }
}

/**
 * Handles atomic orchestration writes via transactions, falling back to ordered writes if needed.
 */
export async function persistIngestion({ documentRecord, bundles, versionInfo }) {
    console.log('persistIngestion received documentRecord:', JSON.stringify(documentRecord, null, 2));
    const isUpdate = versionInfo?.isUpdate || false;
    const previousTopics = versionInfo?.previousTopics || [];
    
    try {
        // Try with transaction first
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            logger.info({ document_id: documentRecord._id }, 'Transaction initialized for structural ingestion tree execution.');

            // RE-INGESTION: Archive previous topics BEFORE writing new ones (inside transaction)
            if (isUpdate && previousTopics.length > 0) {
                logger.info({ count: previousTopics.length }, 'Archiving previous version topics inside transaction...');
                const topicIds = previousTopics.map(t => t._id);
                
                // Archive old topics by setting is_latest=false and is_archived=true
                await Topic.updateMany(
                    { 
                        _id: { $in: topicIds },
                        document_id: documentRecord.document_metadata.document_id
                    },
                    {
                        $set: { 
                            is_latest: false,
                            is_archived: true,
                            archived_at: new Date()
                        }
                    },
                    { session }
                );
                logger.info({ archivedCount: previousTopics.length }, 'Previous topics archived successfully');
            }

            // 1. Store Master Document Architecture Record
            const existingDoc = await Document.findById(documentRecord._id).session(session);
            let savedDoc;
            if (existingDoc) {
                Object.assign(existingDoc, documentRecord);
                savedDoc = await existingDoc.save({ session });
            } else {
                const newDoc = new Document(documentRecord);
                savedDoc = await newDoc.save({ session });
            }

            // 2. Write split collections sequentially
            if (bundles.normalizedTopics.length > 0) {
                await bulkReplace(Topic, bundles.normalizedTopics, '_id', session);
                await bulkReplace(TopicContent, bundles.normalizedTopicContents, '_id', session);
                await bulkReplace(TopicAsset, bundles.normalizedTopicAssets, '_id', session);
                await bulkReplace(TopicAssessment, bundles.normalizedTopicAssessments, '_id', session);
            }

            // 3. Populate Decentralized Global Slug Registries
            await bulkReplace(SlugRegistry, bundles.slugRegistryRecords, '_id', session);

            // 4. Safely evaluate and save Asset Records if the module configuration exists
            if (AssetRegistry && bundles.assetRegistryRecords.length > 0) {
                await bulkReplace(AssetRegistry, bundles.assetRegistryRecords, 'local_path', session);
            }

            await session.commitTransaction();
            logger.info({ document_id: documentRecord._id }, 'All relational collections successfully committed to database.');

            // Fire-and-forget: increment platform stats after successful persist
            const documentType = documentRecord.document_metadata?.document_type || 'unknown';
            const topicCount = bundles.normalizedTopics.length;
            
            // Count formulas, mcqs, assets from bundles
            let formulaCount = 0;
            let mcqCount = 0;
            let assetCount = bundles.assetRegistryRecords.length;
            
            // Count formulas and mcqs from topic assessments
            if (Array.isArray(bundles.normalizedTopicAssessments)) {
                bundles.normalizedTopicAssessments.forEach(assessment => {
                    if (!assessment) return;
                    if (assessment && Array.isArray(assessment.mcqs)) {
                        mcqCount += assessment.mcqs.length;
                    }
                });
            }
            
            // Count formulas from topic contents
            if (Array.isArray(bundles.normalizedTopicContents)) {
                bundles.normalizedTopicContents.forEach(content => {
                    if (content && Array.isArray(content.content_blocks)) {
                        formulaCount += content.content_blocks.filter(b => b && b.type === 'formula').length;
                    }
                });
            }

            incrementStats({
                document_type: documentType,
                topicCount,
                formulaCount,
                mcqCount,
                assetCount,
                documentRecord
            }).catch(err => logger.error({ err }, 'Stats increment failed silently'));

            // FIX 3: Version Record Integration - Create version record after successful persist
            if (isUpdate) {
                // Re-ingestion: compute diff and create version record
                try {
                    const previousDocId = documentRecord.document_metadata?.parent_document_id;
                    const newDocId = documentRecord._id;
                    
                    if (previousDocId) {
                        // Compute version diff (fire-and-forget)
                        computeVersionDiff(previousDocId, newDocId)
                            .then(diff => {
                                // Create version record with diff summary
                                return createVersionRecord({
                                    document_id: documentRecord.document_metadata?.document_id || documentRecord._id,
                                    version_number: documentRecord.document_metadata?.document_version || '1.0.0',
                                    previous_version_id: previousDocId,
                                    diff_summary: diff.summary
                                });
                            })
                            .catch(versionErr => {
                                logger.warn({ error: versionErr.message }, 'Version record creation failed silently');
                            });
                    }
                } catch (versionError) {
                    logger.warn({ error: versionError.message }, 'Version diff computation failed silently');
                }
            } else {
                // First-time ingestion: create initial version record
                try {
                    createVersionRecord({
                        document_id: documentRecord.document_metadata?.document_id || documentRecord._id,
                        version_number: documentRecord.document_metadata?.document_version || '1.0.0',
                        previous_version_id: null,
                        diff_summary: 'Initial ingestion'
                    }).catch(versionErr => {
                        logger.warn({ error: versionErr.message }, 'Initial version record creation failed silently');
                    });
                } catch (versionError) {
                    logger.warn({ error: versionError.message }, 'Initial version record creation failed silently');
                }
            }

            // FIX 2: Slug Redirect Integration - Register redirects for changed slugs
            if (isUpdate && previousTopics.length > 0) {
                try {
                    // Compare old slugs with new slugs and register redirects
                    const newTopicsMap = new Map(bundles.normalizedTopics.map(t => [t.topic_id, t]));
                    
                    for (const prevTopic of previousTopics) {
                        const newTopic = newTopicsMap.get(prevTopic.topic_id);
                        if (newTopic && prevTopic.slug !== newTopic.slug) {
                            // Slug changed - register redirect (fire-and-forget)
                            registerSlugRedirect({
                                entity_id: prevTopic.topic_id,
                                old_slug: prevTopic.slug,
                                new_slug: newTopic.slug,
                                old_url_path: prevTopic.url_path,
                                new_url_path: newTopic.url_path,
                                entity_type: 'topic',
                                redirect_type: '301'
                            }).catch(redirectErr => {
                                logger.warn({ error: redirectErr.message }, 'Slug redirect registration failed silently');
                            });
                        }
                    }
                } catch (redirectError) {
                    logger.warn({ error: redirectError.message }, 'Slug redirect comparison failed silently');
                }
            }

            return {
                document_id: documentRecord._id,
                topic_count: bundles.normalizedTopics.length,
                slug_registry_count: bundles.slugRegistryRecords.length,
                asset_registry_count: bundles.assetRegistryRecords.length,
                status: 'persisted'
            };
        } catch (transactionError) {
            await session.abortTransaction();
            logger.warn({ error: transactionError.message }, 'Transaction failed, falling back to non-transactional writes.');
            throw transactionError; // Re-throw to trigger fallback
        } finally {
            session.endSession();
        }
    } catch (error) {
        // Fallback: non-transactional writes
        logger.info({ document_id: documentRecord._id }, 'Executing non-transactional fallback writes.');

        // RE-INGESTION: Archive previous topics in fallback mode too
        if (isUpdate && previousTopics.length > 0) {
            logger.info({ count: previousTopics.length }, 'Archiving previous version topics (fallback mode)...');
            const topicIds = previousTopics.map(t => t._id);
            
            await Topic.updateMany(
                { 
                    _id: { $in: topicIds },
                    document_id: documentRecord.document_metadata.document_id
                },
                {
                    $set: { 
                        is_latest: false,
                        is_archived: true,
                        archived_at: new Date()
                    }
                }
            );
            logger.info({ archivedCount: previousTopics.length }, 'Previous topics archived successfully (fallback)');
        }

        // 1. Store Master Document Architecture Record
        const existingDoc = await Document.findById(documentRecord._id);
        if (existingDoc) {
            Object.assign(existingDoc, documentRecord);
            await existingDoc.save();
        } else {
            const newDoc = new Document(documentRecord);
            await newDoc.save();
        }

        // 2. Write split collections sequentially
        if (bundles.normalizedTopics.length > 0) {
            await bulkReplace(Topic, bundles.normalizedTopics, '_id');
            await bulkReplace(TopicContent, bundles.normalizedTopicContents, '_id');
            await bulkReplace(TopicAsset, bundles.normalizedTopicAssets, '_id');
            await bulkReplace(TopicAssessment, bundles.normalizedTopicAssessments, '_id');
        }

        // 3. Populate Decentralized Global Slug Registries
        await bulkReplace(SlugRegistry, bundles.slugRegistryRecords, '_id');

        // 4. Safely evaluate and save Asset Records if the module configuration exists
        if (AssetRegistry && bundles.assetRegistryRecords.length > 0) {
            await bulkReplace(AssetRegistry, bundles.assetRegistryRecords, 'local_path');
        }

        logger.info({ document_id: documentRecord._id }, 'All relational collections successfully persisted (non-transactional fallback).');

        // Fire-and-forget: increment platform stats after successful persist
        const documentType = documentRecord.document_metadata?.document_type || 'unknown';
        const topicCount = bundles.normalizedTopics.length;
        
        // Count formulas, mcqs, assets from bundles
        let formulaCount = 0;
        let mcqCount = 0;
        let assetCount = bundles.assetRegistryRecords.length;
        
        // Count formulas and mcqs from topic assessments
            if (Array.isArray(bundles.normalizedTopicAssessments)) {
                bundles.normalizedTopicAssessments.forEach(assessment => {
                    if (!assessment) return;
                    if (assessment && Array.isArray(assessment.mcqs)) {
                        mcqCount += assessment.mcqs.length;
                    }
                });
            }
            
            // Count formulas from topic contents
            if (Array.isArray(bundles.normalizedTopicContents)) {
                bundles.normalizedTopicContents.forEach(content => {
                    if (!content) return;
                    if (content && Array.isArray(content.content_blocks)) {
                        formulaCount += content.content_blocks.filter(b => b && b.type === 'formula').length;
                    }
                });
            }

        incrementStats({
            document_type: documentType,
            topicCount,
            formulaCount,
            mcqCount,
            assetCount,
            documentRecord
        }).catch(err => logger.error({ err }, 'Stats increment failed silently'));

        // FIX 3: Version Record Integration - Create version record after successful persist (fallback mode)
        if (isUpdate) {
            try {
                const previousDocId = documentRecord.document_metadata?.parent_document_id;
                const newDocId = documentRecord._id;
                
                if (previousDocId) {
                    computeVersionDiff(previousDocId, newDocId)
                        .then(diff => createVersionRecord({
                            document_id: documentRecord.document_metadata?.document_id || documentRecord._id,
                            version_number: documentRecord.document_metadata?.document_version || '1.0.0',
                            previous_version_id: previousDocId,
                            diff_summary: diff.summary
                        }))
                        .catch(versionErr => {
                            logger.warn({ error: versionErr.message }, 'Version record creation failed silently (fallback)');
                        });
                }
            } catch (versionError) {
                logger.warn({ error: versionError.message }, 'Version diff computation failed silently (fallback)');
            }
        } else {
            try {
                createVersionRecord({
                    document_id: documentRecord.document_metadata?.document_id || documentRecord._id,
                    version_number: documentRecord.document_metadata?.document_version || '1.0.0',
                    previous_version_id: null,
                    diff_summary: 'Initial ingestion'
                }).catch(versionErr => {
                    logger.warn({ error: versionErr.message }, 'Initial version record creation failed silently (fallback)');
                });
            } catch (versionError) {
                logger.warn({ error: versionError.message }, 'Initial version record creation failed silently (fallback)');
            }
        }

        // FIX 2: Slug Redirect Integration - Register redirects for changed slugs (fallback mode)
        if (isUpdate && previousTopics.length > 0) {
            try {
                const newTopicsMap = new Map(bundles.normalizedTopics.map(t => [t.topic_id, t]));
                
                for (const prevTopic of previousTopics) {
                    const newTopic = newTopicsMap.get(prevTopic.topic_id);
                    if (newTopic && prevTopic.slug !== newTopic.slug) {
                        registerSlugRedirect({
                            entity_id: prevTopic.topic_id,
                            old_slug: prevTopic.slug,
                            new_slug: newTopic.slug,
                            old_url_path: prevTopic.url_path,
                            new_url_path: newTopic.url_path,
                            entity_type: 'topic',
                            redirect_type: '301'
                        }).catch(redirectErr => {
                            logger.warn({ error: redirectErr.message }, 'Slug redirect registration failed silently (fallback)');
                        });
                    }
                }
            } catch (redirectError) {
                logger.warn({ error: redirectError.message }, 'Slug redirect comparison failed silently (fallback)');
            }
        }

        return {
            document_id: documentRecord._id,
            topic_count: bundles.normalizedTopics.length,
            slug_registry_count: bundles.slugRegistryRecords.length,
            asset_registry_count: bundles.assetRegistryRecords.length,
            status: 'persisted'
        };
    }
}

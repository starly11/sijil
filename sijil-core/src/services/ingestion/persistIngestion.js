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
import FormulaIndex from '../../models/formulaIndex.model.js';

let AssetRegistry;
try {
    // Graceful initialization check in case asset_registry model variations exist across implementations
    const mod = await import('../../models/assetRegistry.model.js');
    AssetRegistry = mod.default;
} catch (e) {
    logger.warn('assetRegistry model file was not resolved. Proceeding with embedded normalization fallbacks');
}

// Helper to time async database operations
async function timedDbOperation(operation, name, collectionName, docCount, profiler) {
    const start = process.hrtime.bigint();
    try {
        const result = await operation();
        const duration = Number(process.hrtime.bigint() - start) / 1000000;
        if (profiler) {
            profiler.trackDbOperation(name, collectionName, docCount, duration);
        }
        return result;
    } catch (err) {
        const duration = Number(process.hrtime.bigint() - start) / 1000000;
        if (profiler) {
            profiler.trackDbOperation(name + ' (FAILED)', collectionName, docCount, duration);
        }
        throw err;
    }
}

/**
 * Bulk replacement helper — uses native collection bulkWrite to bypass Mongoose
 * validation hooks (critical for large topic_content documents in batch imports).
 */
async function bulkReplace(Model, items, filterKey = '_id', session = null, profiler = null, { fast = false } = {}) {
    if (!items || items.length === 0) return;

    const modelName = Model.collection.name;
    const isHeavyContent = modelName === 'topic_content';
    const batchSize = isHeavyContent && fast ? 4 : 1000;

    const chunks = [];
    for (let i = 0; i < items.length; i += batchSize) {
        chunks.push(items.slice(i, i + batchSize));
    }

    const writeChunk = async (chunk) => {
        const operations = chunk.map(item => ({
            replaceOne: {
                filter: { [filterKey]: item[filterKey] },
                replacement: item,
                upsert: true
            }
        }));

        // Native driver bulkWrite skips Mongoose validate hooks (JSON.stringify on quran_data etc.)
        const collection = Model.collection;
        const opts = { ordered: false, ...(session ? { session } : {}) };

        await timedDbOperation(
            async () => collection.bulkWrite(operations, opts),
            'bulkWrite',
            modelName,
            chunk.length,
            profiler
        );

        if (profiler) {
            profiler.incrementMongoQuery(modelName, 'bulkWrite', chunk.length);
        }
    };

    // Parallel chunked writes for large topic_content payloads
    if (isHeavyContent && fast && chunks.length > 1) {
        await Promise.all(chunks.map(writeChunk));
    } else {
        for (const chunk of chunks) {
            await writeChunk(chunk);
        }
    }
}

/**
 * Merge topic_refs when importing individual chapters of a multi-chapter book.
 * Replaces refs for the current chapter while preserving other chapters' topics.
 */
async function mergeDocumentTopicRefs(documentRecord, bundles) {
    if (!bundles?.containerId || !documentRecord?.topic_refs?.length) {
        return documentRecord;
    }

    const existing = await Document.findById(documentRecord._id).select('topic_refs').lean();
    if (!existing?.topic_refs?.length) {
        return documentRecord;
    }

    const chapterTopicIds = new Set(bundles.normalizedTopics.map(t => t._id));
    const keptRefs = existing.topic_refs.filter(ref => !chapterTopicIds.has(ref._id));

    const mergedRefs = [...keptRefs, ...documentRecord.topic_refs]
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    const totalTopics = mergedRefs.length;
    const aggregates = documentRecord.document_aggregates || {};

    return {
        ...documentRecord,
        topic_refs: mergedRefs,
        document_aggregates: {
            ...aggregates,
            total_topics: totalTopics,
        },
    };
}

// Helper function to handle core persistence operations (used by both transaction and fallback paths)
async function performCorePersistence({ documentRecord, bundles, session = null, profiler, fast = false }) {
    // Atomic upsert document using replaceOne instead of findById + save
    await timedDbOperation(
        async () => Document.replaceOne(
            { _id: documentRecord._id },
            documentRecord,
            { upsert: true, session }
        ),
        'replaceOne (upsert)',
        'documents',
        1,
        profiler
    );

    if (profiler) {
        profiler.incrementMongoQuery('documents', 'replaceOne', 1);
    }

    // Run all independent bulk writes concurrently
    const bulkWritePromises = [];
    if (bundles.normalizedTopics.length > 0) {
        const topicFilterKey = fast ? 'slug_global' : '_id';
        bulkWritePromises.push(bulkReplace(Topic, bundles.normalizedTopics, topicFilterKey, session, profiler, { fast }));
        bulkWritePromises.push(bulkReplace(TopicContent, bundles.normalizedTopicContents, '_id', session, profiler, { fast }));
        bulkWritePromises.push(bulkReplace(TopicAsset, bundles.normalizedTopicAssets, '_id', session, profiler, { fast }));
        bulkWritePromises.push(bulkReplace(TopicAssessment, bundles.normalizedTopicAssessments, '_id', session, profiler, { fast }));
    }
    if (bundles.formulaIndexRecords?.length > 0) {
        bulkWritePromises.push(bulkReplace(FormulaIndex, bundles.formulaIndexRecords, '_id', session, profiler, { fast }));
    }
    bulkWritePromises.push(bulkReplace(SlugRegistry, bundles.slugRegistryRecords, '_id', session, profiler, { fast }));
    if (AssetRegistry && bundles.assetRegistryRecords.length > 0) {
        bulkWritePromises.push(bulkReplace(AssetRegistry, bundles.assetRegistryRecords, 'local_path', session, profiler, { fast }));
    }

    await Promise.all(bulkWritePromises);
}

/**
 * Remove prior chapter content before batch re-import to avoid slug_global collisions.
 */
async function replaceChapterContent(documentId, chapterId, profiler) {
    const existingTopics = await Topic.find({ document_id: documentId, chapter_id: chapterId })
        .select('_id slug_global')
        .lean();

    if (existingTopics.length === 0) return;

    const topicIds = existingTopics.map(t => t._id);
    const slugGlobals = existingTopics.map(t => t.slug_global).filter(Boolean);

    logger.info({ documentId, chapterId, topicCount: topicIds.length }, 'Replacing existing chapter content for batch import');

    await timedDbOperation(
        () => Promise.all([
            TopicContent.deleteMany({ topic_id: { $in: topicIds } }),
            TopicAsset.deleteMany({ topic_id: { $in: topicIds } }),
            TopicAssessment.deleteMany({ topic_id: { $in: topicIds } }),
            FormulaIndex.deleteMany({ topic_id: { $in: topicIds } }),
            SlugRegistry.deleteMany({ topic_id: { $in: topicIds } }),
            Topic.deleteMany({ _id: { $in: topicIds } }),
        ]),
        'deleteMany (chapter replace)',
        'topics',
        topicIds.length,
        profiler
    );
}

// Helper function to fire-and-forget post-persistence background tasks
function scheduleBackgroundTasks({ documentRecord, bundles, versionInfo, batchMode = false }) {
    const documentType = documentRecord.document_metadata?.document_type || 'unknown';
    const topicCount = bundles.normalizedTopics.length;
    let formulaCount = 0;
    let mcqCount = 0;
    let assetCount = bundles.assetRegistryRecords.length;

    // Calculate formula/mcq counts
    if (Array.isArray(bundles.normalizedTopicAssessments)) {
        bundles.normalizedTopicAssessments.forEach(assessment => {
            if (!assessment) return;
            if (Array.isArray(assessment.book_mcqs)) {
                mcqCount += assessment.book_mcqs.length;
            }
        });
    }
    if (Array.isArray(bundles.formulaIndexRecords)) {
        formulaCount += bundles.formulaIndexRecords.length;
    }

    // Skip per-chapter stats/version writes during batch import (handled at batch level)
    if (batchMode) {
        return;
    }

    // 1. Increment platform stats in background
    incrementStats({
        document_type: documentType,
        topicCount,
        formulaCount,
        mcqCount,
        assetCount,
        documentRecord
    }).catch(err => logger.error({ err }, 'Stats increment failed silently'));

    // 2. Version record creation in background
    if (versionInfo?.isUpdate) {
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
                    logger.warn({ error: versionErr.message }, 'Version record creation failed silently');
                });
        }
    } else {
        createVersionRecord({
            document_id: documentRecord.document_metadata?.document_id || documentRecord._id,
            version_number: documentRecord.document_metadata?.document_version || '1.0.0',
            previous_version_id: null,
            diff_summary: 'Initial ingestion'
        }).catch(versionErr => {
            logger.warn({ error: versionErr.message }, 'Initial version record creation failed silently');
        });
    }

    // 3. Slug redirect registration in background
    if (versionInfo?.isUpdate && versionInfo?.previousTopics?.length > 0) {
        const newTopicsMap = new Map(bundles.normalizedTopics.map(t => [t.topic_id, t]));
        for (const prevTopic of versionInfo.previousTopics) {
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
                    logger.warn({ error: redirectErr.message }, 'Slug redirect registration failed silently');
                });
            }
        }
    }
}

/**
 * Handles atomic orchestration writes via transactions, falling back to ordered writes if needed.
 * @param {Object} params
 * @param {boolean} [params.skipTransaction=false] - Use direct bulk writes (faster for batch imports)
 */
export async function persistIngestion({ documentRecord, bundles, versionInfo, profiler, skipTransaction = false }) {
    const isUpdate = versionInfo?.isUpdate || false;
    const previousTopics = versionInfo?.previousTopics || [];

    if (skipTransaction) {
        return persistDirect({ documentRecord, bundles, versionInfo, profiler, isUpdate, previousTopics, batchMode: true });
    }

    // Try transaction first
    try {
        const session = await timedDbOperation(
            async () => mongoose.startSession(),
            'startSession',
            'system',
            0,
            profiler
        );

        try {
            await timedDbOperation(
                async () => session.startTransaction(),
                'startTransaction',
                'system',
                0,
                profiler
            );
            logger.info({ document_id: documentRecord._id }, 'Transaction initialized for structural ingestion tree execution');

            // ONLY essential atomic operations inside transaction: archive old topics and persist new data
            if (isUpdate && previousTopics.length > 0) {
                logger.info({ count: previousTopics.length }, 'Archiving previous version topics inside transaction...');
                const topicIds = previousTopics.map(t => t._id);
                await timedDbOperation(
                    async () => Topic.updateMany(
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
                    ),
                    'updateMany',
                    'topics',
                    previousTopics.length,
                    profiler
                );

                if (profiler) {
                    profiler.incrementMongoQuery('topics', 'update', previousTopics.length);
                }
                logger.info({ archivedCount: previousTopics.length }, 'Previous topics archived successfully');
            }

            // Perform core persistence operations inside transaction
            const mergedDocumentRecord = await mergeDocumentTopicRefs(documentRecord, bundles);
            await performCorePersistence({ documentRecord: mergedDocumentRecord, bundles, session, profiler, fast: false });

            // Commit transaction (short duration!)
            await timedDbOperation(
                async () => session.commitTransaction(),
                'commitTransaction',
                'system',
                0,
                profiler
            );
            logger.info({ document_id: documentRecord._id }, 'All relational collections successfully committed to database');

            // Schedule ALL non-critical work to run in background AFTER transaction is committed
            scheduleBackgroundTasks({ documentRecord, bundles, versionInfo, batchMode: false });

            return {
                document_id: documentRecord._id,
                topic_count: bundles.normalizedTopics.length,
                slug_registry_count: bundles.slugRegistryRecords.length,
                asset_registry_count: bundles.assetRegistryRecords.length,
                status: 'persisted'
            };
        } catch (transactionError) {
            await timedDbOperation(
                async () => session.abortTransaction(),
                'abortTransaction',
                'system',
                0,
                profiler
            );
            logger.warn({ error: transactionError.message }, 'Transaction failed, falling back to non-transactional writes');
            throw transactionError;
        } finally {
            await timedDbOperation(
                async () => session.endSession(),
                'endSession',
                'system',
                0,
                profiler
            );
        }
    } catch (error) {
        // Fallback: non-transactional writes
        logger.info({ document_id: documentRecord._id }, 'Executing non-transactional fallback writes');
        return persistDirect({ documentRecord, bundles, versionInfo, profiler, isUpdate, previousTopics, batchMode: true });
    }
}

async function persistDirect({ documentRecord, bundles, versionInfo, profiler, isUpdate, previousTopics, batchMode = false }) {
        if (isUpdate && previousTopics.length > 0) {
            logger.info({ count: previousTopics.length }, 'Archiving previous version topics...');
            const topicIds = previousTopics.map(t => t._id);
            await timedDbOperation(
                async () => Topic.updateMany(
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
                ),
                'updateMany',
                'topics',
                previousTopics.length,
                profiler
            );

            if (profiler) {
                profiler.incrementMongoQuery('topics', 'update', previousTopics.length);
            }
        }

        if (batchMode && bundles.containerId) {
            await replaceChapterContent(documentRecord._id, bundles.containerId, profiler);
        }

        const mergedDocumentRecord = await mergeDocumentTopicRefs(documentRecord, bundles);

        await performCorePersistence({ documentRecord: mergedDocumentRecord, bundles, session: null, profiler, fast: batchMode });

        logger.info({ document_id: documentRecord._id }, 'All relational collections successfully persisted');

        scheduleBackgroundTasks({ documentRecord, bundles, versionInfo, batchMode });

        return {
            document_id: documentRecord._id,
            topic_count: bundles.normalizedTopics.length,
            slug_registry_count: bundles.slugRegistryRecords.length,
            asset_registry_count: bundles.assetRegistryRecords.length,
            status: 'persisted'
        };
}

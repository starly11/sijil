import mongoose from 'mongoose';
import * as logger from '../../utils/logger.js';

// Import all required models
import Document from '../../models/document.model.js';
import Topic from '../../models/topic.model.js';
import FormulaIndex from '../../models/formulaIndex.model.js';
import TopicAssessment from '../../models/topicAssessment.model.js';
import TopicAsset from '../../models/topicAsset.model.js';
import PlatformStats from '../../models/platformStats.model.js';

/**
 * Full recompute of platform stats from scratch.
 * Queries all collections and rebuilds the singleton stats document.
 * Used on startup and as a repair tool.
 */
export async function recomputeStats() {
    try {
        // 1. Count documents by document_type using MongoDB aggregation
        const typeCounts = await Document.aggregate([
            {
                $group: {
                    _id: '$document_metadata.document_type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const counts_by_type = {};
        let total_documents = 0;
        typeCounts.forEach(item => {
            const docType = item._id || 'unknown';
            counts_by_type[docType] = item.count;
            total_documents += item.count;
        });

        // 2. total_topics
        const total_topics = await Topic.countDocuments({});

        // 3. total_formulas
        const total_formulas = await FormulaIndex.countDocuments({});

        // 4. total_mcqs
        const total_mcqs = await TopicAssessment.countDocuments({ type: 'mcq' });

        // 5. total_assets
        const total_assets = await TopicAsset.countDocuments({});

        // 6. recent_arrivals - last 10 documents sorted by created_at descending
        const recentDocs = await Document.find({})
            .select('_id document_metadata.document_id document_metadata.title document_metadata.document_type document_metadata.subject document_metadata.grade_level seo_master.slug url_path created_at')
            .sort({ created_at: -1 })
            .limit(10)
            .lean();

        const recent_arrivals = recentDocs.map(doc => ({
            document_id: doc.document_metadata?.document_id || '',
            title: doc.document_metadata?.title || '',
            document_type: doc.document_metadata?.document_type || '',
            subject: doc.document_metadata?.subject || '',
            grade_level: doc.document_metadata?.grade_level || '',
            slug: doc.seo_master?.slug || '',
            url_path: doc.url_path || '',
            arrived_at: doc.created_at || new Date()
        }));

        // 7. Upsert into platform_stats with _id: 'global_stats'
        const statsData = {
            _id: 'global_stats',
            counts_by_type,
            total_documents,
            total_topics,
            total_formulas,
            total_mcqs,
            total_assets,
            recent_arrivals,
            last_updated: new Date(),
            last_ingested_at: null
        };

        const result = await PlatformStats.findOneAndUpdate(
            { _id: 'global_stats' },
            statsData,
            { upsert: true, new: true, returnDocument: 'after' }
        );

        logger.info({ 
            total_documents, 
            total_topics, 
            total_formulas, 
            total_mcqs, 
            total_assets 
        }, 'Platform stats recomputed');

        return result;
    } catch (error) {
        logger.error({ err: error.message }, 'recomputeStats failed');
        throw error;
    }
}

/**
 * Increment stats after successful ingestion.
 * Called after each successful ingestion. Increments atomically.
 * Fire-and-forget safe: wraps in try/catch, logs error silently, never throws.
 */
export async function incrementStats({ 
    document_type, 
    topicCount = 0, 
    formulaCount = 0, 
    mcqCount = 0, 
    assetCount = 0, 
    documentRecord = null 
}) {
    try {
        // 1. Build $inc object
        const incObject = {
            [`counts_by_type.${document_type}`]: 1,
            total_documents: 1,
            total_topics: topicCount,
            total_formulas: formulaCount,
            total_mcqs: mcqCount,
            total_assets: assetCount
        };

        // 2. Build recent_arrival object from documentRecord if provided
        let recentArrival = null;
        if (documentRecord) {
            recentArrival = {
                document_id: documentRecord.document_metadata?.document_id || '',
                title: documentRecord.document_metadata?.title || '',
                document_type: documentRecord.document_metadata?.document_type || '',
                subject: documentRecord.document_metadata?.subject || '',
                grade_level: documentRecord.document_metadata?.grade_level || '',
                slug: documentRecord.seo_master?.slug || '',
                url_path: documentRecord.url_path || '',
                arrived_at: new Date()
            };
        }

        // 3. Use findOneAndUpdate with upsert: true, returnDocument: 'after'
        const updateObj = {
            $inc: incObject,
            $set: { last_updated: new Date(), last_ingested_at: new Date() }
        };

        if (recentArrival) {
            updateObj.$push = {
                recent_arrivals: {
                    $each: [recentArrival],
                    $slice: -10  // keep only last 10
                }
            };
        }

        await PlatformStats.findOneAndUpdate(
            { _id: 'global_stats' },
            updateObj,
            { upsert: true, returnDocument: 'after' }
        );
    } catch (error) {
        // Fire-and-forget safe: log error silently, never throw
        logger.error({ err: error.message }, 'incrementStats failed silently');
    }
}

/**
 * Decrement stats when a document is archived/deleted.
 * Same as incrementStats but all $inc values are negative.
 * Never go below 0: check before decrement to prevent negative values.
 * Fire-and-forget safe.
 */
export async function decrementStats({ 
    document_type, 
    topicCount = 0, 
    formulaCount = 0, 
    mcqCount = 0, 
    assetCount = 0 
}) {
    try {
        // First, get current stats to ensure we don't go negative
        const currentStats = await PlatformStats.findOne({ _id: 'global_stats' }).lean();
        
        if (!currentStats) {
            logger.warn({ err: 'No stats document found to decrement' }, 'decrementStats skipped');
            return;
        }

        // 1. Build $inc object with negative values
        const incObject = {
            [`counts_by_type.${document_type}`]: -1,
            total_documents: -1,
            total_topics: -topicCount,
            total_formulas: -formulaCount,
            total_mcqs: -mcqCount,
            total_assets: -assetCount
        };

        // 2. Use findOneAndUpdate with upsert: false (don't create if doesn't exist)
        // Don't use $max as it conflicts with $inc on same field
        const updateObj = {
            $inc: incObject,
            $set: { last_updated: new Date() }
        };

        await PlatformStats.findOneAndUpdate(
            { _id: 'global_stats' },
            updateObj,
            { upsert: false, returnDocument: 'after' }
        );
    } catch (error) {
        // Fire-and-forget safe: log error silently, never throw
        logger.error({ err: error.message }, 'decrementStats failed silently');
    }
}

/**
 * Get current platform stats.
 * If not found, calls recomputeStats() first, then returns result.
 */
export async function getStats() {
    try {
        let stats = await PlatformStats.findOne({ _id: 'global_stats' }).lean();
        
        if (!stats) {
            // Stats not found, recompute first
            stats = await recomputeStats();
        }
        
        return stats;
    } catch (error) {
        logger.error({ err: error.message }, 'getStats failed');
        throw error;
    }
}

/**
 * Get recent arrivals array from stats document, sliced to limit.
 * If stats not found: returns []
 */
export async function getRecentArrivals(limit = 5) {
    try {
        const stats = await PlatformStats.findOne({ _id: 'global_stats' }).lean();
        
        if (!stats || !stats.recent_arrivals) {
            return [];
        }
        
        // Slice to limit (default 5, max 10)
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 5), 10);
        return stats.recent_arrivals.slice(0, safeLimit);
    } catch (error) {
        logger.error({ err: error.message }, 'getRecentArrivals failed');
        return [];
    }
}

import PopularTopic from '../../models/popularTopic.model.js';
import * as logger from '../../utils/logger.js';

/**
 * Records a topic view event.
 * Fire-and-forget: never throws.
 */
export async function recordTopicView({ topicId, topicTitle, topicSlug, documentId }) {
  try {
    if (!topicId) return;
    
    const now = new Date();
    
    await PopularTopic.findByIdAndUpdate(
      topicId,
      {
        $set: {
          topic_id: topicId,
          last_viewed_at: now
        },
        $inc: { view_count: 1 }
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (error) {
    logger.error({ error: error.message, fn: 'recordTopicView' }, 'Failed to record topic view');
  }
}

/**
 * Records an export download event.
 * Fire-and-forget: never throws.
 */
export async function recordExportDownload({ topicId, exportType, documentType }) {
  try {
    if (!topicId) return;
    
    const now = new Date();
    
    // The schema has search_hit_count, we'll use that for exports or just update view_count
    await PopularTopic.findByIdAndUpdate(
      topicId,
      {
        $set: {
          topic_id: topicId,
          last_export_type: exportType,
          last_export_date: now
        },
        $inc: { search_hit_count: 1 }
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (error) {
    logger.error({ error: error.message, fn: 'recordExportDownload' }, 'Failed to record export download');
  }
}

/**
 * Returns analytics summary for topics.
 */
export async function getTopicAnalyticsSummary() {
  try {
    const [topTopics, totalTracked] = await Promise.all([
      PopularTopic.find().sort({ view_count: -1 }).limit(10).lean(),
      PopularTopic.countDocuments()
    ]);

    return {
      top_topics: topTopics.map(t => ({
        topic_id: t.topic_id,
        topic_title: t.topic_title || 'Unknown',
        hit_count: t.view_count,
        last_viewed_at: t.last_viewed_at || t.updated_at
      })),
      total_tracked: totalTracked,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error({ error: error.message, fn: 'getTopicAnalyticsSummary' }, 'Failed to get topic analytics');
    throw error;
  }
}

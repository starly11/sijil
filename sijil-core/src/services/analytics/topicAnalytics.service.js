import PopularTopic from '../../models/popularTopic.model.js';
import Document from '../../models/document.model.js';
import Topic from '../../models/topic.model.js';
import TopicAssessment from '../../models/topicAssessment.model.js';
import ImportBatch from '../../models/importBatch.model.js';
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
          topic_title: topicTitle,
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
    
    await PopularTopic.findByIdAndUpdate(
      topicId,
      {
        $set: {
          topic_id: topicId,
          topic_title: topicId,
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
    const [totalDocs, totalTopics, totalAssessments, importBatches] = await Promise.all([
      Document.countDocuments(),
      Topic.countDocuments(),
      TopicAssessment.countDocuments(),
      ImportBatch.find().sort({ created_at: -1 }).limit(5).lean(),
    ]);
    
    const successCount = importBatches.filter(b => b.status === 'completed').length;
    const totalCount = importBatches.length;
    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

    const recentActivity = importBatches.map(batch => ({
      type: batch.status === 'completed' ? 'Import' : 'Import Attempt',
      message: `Processed ${batch.processed_files || 0} files (${batch.success_count || 0} succeeded, ${batch.failure_count || 0} failed)`,
      timestamp: batch.created_at
    }));

    return {
      total_topics: totalTopics,
      total_documents: totalDocs,
      total_assessments: totalAssessments,
      total_imports: totalCount,
      import_success_rate: successRate,
      recent_activity: recentActivity,
      platform_stats: {
        documents_count: totalDocs,
        topics_count: totalTopics,
        subjects_count: 0,
        grades_count: 0
      }
    };
  } catch (error) {
    logger.error({ error: error.message, fn: 'getTopicAnalyticsSummary' }, 'Failed to get topic analytics');
    throw error;
  }
}

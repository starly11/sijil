import mongoose from 'mongoose';
import PopularSearch from '../../models/popularSearch.model.js';
import FailedSearch from '../../models/failedSearch.model.js';
import * as logger from '../../utils/logger.js';

/**
 * Records a successful search event.
 * Fire-and-forget: never throws.
 */
export async function recordSuccessfulSearch({ query, resultsCount, topicIds = [], documentIds = [] }) {
  try {
    if (!query || typeof query !== 'string') return;
    
    const normalizedQuery = query.toLowerCase().trim();
    const now = new Date();
    
    await PopularSearch.findByIdAndUpdate(
      normalizedQuery,
      {
        $set: {
          query: query,
          last_searched: now,
          top_result_id: topicIds[0] || null
        },
        $inc: { count: 1 }
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (error) {
    logger.error({ error: error.message, fn: 'recordSuccessfulSearch' }, 'Failed to record successful search');
  }
}

/**
 * Records a failed search event (zero results).
 * Fire-and-forget: never throws.
 */
export async function recordFailedSearch({ query, reason = 'no_results' }) {
  try {
    if (!query || typeof query !== 'string') return;
    
    const normalizedQuery = query.toLowerCase().trim();
    const now = new Date();
    
    await FailedSearch.findByIdAndUpdate(
      normalizedQuery,
      {
        $set: {
          query: query,
          last_searched: now
        },
        $inc: { count: 1 }
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (error) {
    logger.error({ error: error.message, fn: 'recordFailedSearch' }, 'Failed to record failed search');
  }
}

/**
 * Returns analytics summary for searches.
 */
export async function getSearchAnalyticsSummary() {
  try {
    const [topSearches, failedSearches, totalSuccessful, totalFailed] = await Promise.all([
      PopularSearch.find().sort({ count: -1 }).limit(10).lean(),
      FailedSearch.find().sort({ count: -1 }).limit(10).lean(),
      PopularSearch.countDocuments(),
      FailedSearch.countDocuments()
    ]);

    return {
      top_searches: topSearches.map(s => ({
        query: s.query,
        hit_count: s.count,
        last_searched_at: s.last_searched
      })),
      failed_searches: failedSearches.map(f => ({
        query: f.query,
        count: f.count,
        reason: 'no_results'
      })),
      total_successful: totalSuccessful,
      total_failed: totalFailed,
      generated_at: new Date().toISOString()
    };
  } catch (error) {
    logger.error({ error: error.message, fn: 'getSearchAnalyticsSummary' }, 'Failed to get search analytics');
    throw error;
  }
}

/**
 * Clears old failed searches.
 */
export async function clearOldFailedSearches(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await FailedSearch.deleteMany({
      created_at: { $lt: cutoffDate }
    });
    
    return { deleted: result.deletedCount || 0 };
  } catch (error) {
    logger.error({ error: error.message, fn: 'clearOldFailedSearches' }, 'Failed to clear old failed searches');
    throw error;
  }
}

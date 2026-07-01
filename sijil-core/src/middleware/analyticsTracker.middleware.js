/**
 * Analytics Tracker Middleware
 * Fire-and-forget tracking for topic views and search queries
 * Never blocks requests - all DB ops are async and non-awaited
 */

import PopularTopic from '../models/popularTopic.model.js';
import PopularSearch from '../models/popularSearch.model.js';
import * as logger from '../utils/logger.js';

/**
 * Express middleware to track analytics events
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function analyticsTrackerMiddleware(req, res, next) {
  // Track topic views on GET /api/topics/:topicId (exact match only)
  if (req.method === 'GET') {
    const topicMatch = req.path.match(/^\/api\/topics\/([a-fA-F0-9]{24})$/);
    if (topicMatch && topicMatch[1]) {
      const topicId = topicMatch[1];
      
      // Fire-and-forget: never await, never block
      setImmediate(() => {
        try {
          PopularTopic.findByIdAndUpdate(
            topicId,
            {
              $set: { topic_id: topicId },
              $inc: { view_count: 1 }
            },
            { upsert: true }
          ).catch(err => {
            logger.error({ error: err.message, fn: 'analyticsTrackerMiddleware' }, 'Failed to track topic view');
          });
        } catch (error) {
          logger.error({ error: error.message, fn: 'analyticsTrackerMiddleware' }, 'Failed to track topic view');
        }
      });
    }
    
    // Track search queries on GET /api/search with q parameter
    if (req.path === '/api/search' && req.query && req.query.q) {
      const query = req.query.q.trim().toLowerCase();
      
      if (query.length > 0) {
        // Fire-and-forget: never await, never block
        setImmediate(() => {
          try {
            PopularSearch.findByIdAndUpdate(
              query,
              {
                $set: { 
                  query: req.query.q,
                  last_searched: new Date()
                },
                $inc: { count: 1 }
              },
              { upsert: true }
            ).catch(err => {
              logger.error({ error: err.message, fn: 'analyticsTrackerMiddleware' }, 'Failed to track search query');
            });
          } catch (error) {
            logger.error({ error: error.message, fn: 'analyticsTrackerMiddleware' }, 'Failed to track search query');
          }
        });
      }
    }
  }
  
  // Always call next immediately - never block the request
  next();
}

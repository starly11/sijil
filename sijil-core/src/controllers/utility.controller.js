import { fetchPopularTopics, fetchFailedSearches, fetchSitemapSeed } from '../services/api/utility.service.js';
import { getSearchAnalyticsSummary, clearOldFailedSearches } from '../services/analytics/searchAnalytics.service.js';
import { getTopicAnalyticsSummary } from '../services/analytics/topicAnalytics.service.js';
import { getStats, getRecentArrivals, recomputeStats } from '../services/stats/platformStats.service.js';
import { slugResolverQueue } from '../queues/index.js';

export async function getPopularTopics(req, res, next) {
    try {
        const list = await fetchPopularTopics(req.query.limit);
        return res.status(200).json({ success: true, data: list });
    } catch (error) {
        next(error);
    }
}

export async function getFailedSearches(req, res, next) {
    try {
        const report = await fetchFailedSearches(req.query.page, req.query.limit);
        return res.status(200).json({ success: true, data: report });
    } catch (error) {
        next(error);
    }
}

export async function getSitemapSeed(req, res, next) {
    try {
        const seeds = await fetchSitemapSeed(req.query.limit);
        return res.status(200).json({ success: true, data: seeds });
    } catch (error) {
        next(error);
    }
}

export async function getSearchAnalytics(req, res, next) {
    try {
        const summary = await getSearchAnalyticsSummary();
        return res.status(200).json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
}

export async function getTopicAnalytics(req, res, next) {
    try {
        const summary = await getTopicAnalyticsSummary();
        return res.status(200).json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
}

// Platform Stats controllers
export async function getPlatformStats(req, res, next) {
    try {
        const stats = await getStats();
        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
}

export async function getRecentArrivalsController(req, res, next) {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const arrivals = await getRecentArrivals(Math.min(limit, 10));
        return res.status(200).json({ success: true, data: arrivals });
    } catch (error) {
        next(error);
    }
}

export async function recomputePlatformStats(req, res, next) {
    try {
        const stats = await recomputeStats();
        return res.status(200).json({ success: true, data: stats, message: 'Stats recomputed' });
    } catch (error) {
        next(error);
    }
}

// Slug redirect controllers
import { resolveSlugRedirect, getSlugRedirectStats } from '../services/slug/slugRedirect.service.js';

export async function resolveRedirect(req, res, next) {
  try {
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({ success: false, error: 'slug is required' });
    }

    const result = await resolveSlugRedirect(slug);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getRedirectStats(req, res, next) {
  try {
    const stats = await getSlugRedirectStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function triggerSlugResolver(req, res, next) {
  try {
    // Add a job to the slug resolver queue manually
    await slugResolverQueue.add('slug-resolution', { type: 'manual_trigger', triggered_by: 'api' });
    
    return res.status(200).json({ success: true, message: 'Slug resolution job queued' });
  } catch (error) {
    return res.status(503).json({ success: false, error: 'Queue unavailable' });
  }
}

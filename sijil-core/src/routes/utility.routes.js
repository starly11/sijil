import { Router } from 'express';
import { 
    getPopularTopics, 
    getFailedSearches, 
    getSitemapSeed, 
    getSearchAnalytics, 
    getTopicAnalytics, 
    resolveRedirect, 
    getRedirectStats,
    getPlatformStats,
    getRecentArrivalsController,
    recomputePlatformStats,
    triggerSlugResolver
} from '../controllers/utility.controller.js';

const router = Router();
router.get('/utility/popular-topics', getPopularTopics);
router.get('/utility/failed-searches', getFailedSearches);
router.get('/utility/sitemap-seed', getSitemapSeed);
router.get('/utility/analytics/search', getSearchAnalytics);
router.get('/utility/analytics/topics', getTopicAnalytics);
router.get('/utility/slug/resolve', resolveRedirect);
router.get('/utility/slug/redirects/stats', getRedirectStats);
router.get('/utility/platform-stats', getPlatformStats);
router.get('/utility/recent-arrivals', getRecentArrivalsController);
router.post('/utility/platform-stats/recompute', recomputePlatformStats);
router.post('/utility/resolve-slugs', triggerSlugResolver);

export default router;
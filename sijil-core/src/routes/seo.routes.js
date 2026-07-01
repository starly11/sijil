import { Router } from 'express';
import { 
  getTopicJsonLd, 
  getDocumentJsonLd, 
  getSitemapIndex, 
  getSitemapPage, 
  getStaticSitemap, 
  getSitemapStatsController,
  getTopicAnswerHub,
  getDocumentAnswerHub,
  getTopicAeoScore
} from '../controllers/seo.controller.js';

const router = Router();

// JSON-LD routes
router.get('/seo/topic/:topicId/jsonld', getTopicJsonLd);
router.get('/seo/document/:documentId/jsonld', getDocumentJsonLd);

// Sitemap routes - static must be before dynamic :page
router.get('/seo/sitemap-static.xml', getStaticSitemap);
router.get('/seo/sitemap-index.xml', getSitemapIndex);
router.get('/seo/sitemap-:page.xml', getSitemapPage);
router.get('/seo/sitemap/stats', getSitemapStatsController);

// AEO Answer Hub routes
router.get('/seo/topic/:topicId/aeo', getTopicAnswerHub);
router.get('/seo/document/:documentId/aeo', getDocumentAnswerHub);
router.get('/seo/topic/:topicId/aeo/score', getTopicAeoScore);

export default router;

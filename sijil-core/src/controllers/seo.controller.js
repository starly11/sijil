import { generateTopicJsonLdBundle, generateBookJsonLd } from '../services/seo/jsonld.service.js';
import { generateSitemapIndex, generateSitemapPage, generateStaticSitemap, getSitemapStats } from '../services/seo/sitemap.service.js';
import { generateTopicAnswerHub, generateDocumentAnswerHub, getAeoReadinessScore } from '../services/seo/aeo.service.js';
import Document from '../models/document.model.js';

/**
 * Get JSON-LD bundle for a topic
 */
async function getTopicJsonLd(req, res, next) {
  try {
    const { topicId } = req.params;
    const bundle = await generateTopicJsonLdBundle(topicId);
    return res.status(200).json({ success: true, data: bundle });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get JSON-LD for a document
 */
async function getDocumentJsonLd(req, res, next) {
  try {
    const { documentId } = req.params;
    
    const document = await Document.findOne({ 'document_metadata.document_id': documentId }).lean();
    
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    
    const jsonld = generateBookJsonLd(document);
    return res.status(200).json({ success: true, data: jsonld });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get sitemap index XML
 */
async function getSitemapIndex(req, res, next) {
  try {
    const xml = await generateSitemapIndex();
    res.set('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (error) {
    return next(error);
  }
}

/**
 * Get paginated sitemap XML
 */
async function getSitemapPage(req, res, next) {
  try {
    const page = parseInt(req.params.page) || 1;
    const xml = await generateSitemapPage(page);
    res.set('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (error) {
    return next(error);
  }
}

/**
 * Get static sitemap XML
 */
async function getStaticSitemap(req, res, next) {
  try {
    const xml = await generateStaticSitemap();
    res.set('Content-Type', 'application/xml');
    return res.send(xml);
  } catch (error) {
    return next(error);
  }
}

/**
 * Get sitemap statistics
 */
async function getSitemapStatsController(req, res, next) {
  try {
    const stats = await getSitemapStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return next(error);
  }
}

/**
 * Get Topic Answer Hub (AEO)
 */
async function getTopicAnswerHub(req, res, next) {
  try {
    const { topicId } = req.params;
    const hub = await generateTopicAnswerHub(topicId);
    return res.status(200).json({ success: true, data: hub });
  } catch (error) {
    if (error.message.includes('Topic not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return next(error);
  }
}

/**
 * Get Document Answer Hub (AEO)
 */
async function getDocumentAnswerHub(req, res, next) {
  try {
    const { documentId } = req.params;
    const hub = await generateDocumentAnswerHub(documentId);
    return res.status(200).json({ success: true, data: hub });
  } catch (error) {
    if (error.message.includes('Document not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    return next(error);
  }
}

/**
 * Get Topic AEO Readiness Score
 */
async function getTopicAeoScore(req, res, next) {
  try {
    const { topicId } = req.params;
    const score = await getAeoReadinessScore(topicId);
    return res.status(200).json({ success: true, data: score });
  } catch (error) {
    return next(error);
  }
}

export { 
  getTopicJsonLd, 
  getDocumentJsonLd, 
  getSitemapIndex, 
  getSitemapPage, 
  getStaticSitemap, 
  getSitemapStatsController,
  getTopicAnswerHub,
  getDocumentAnswerHub,
  getTopicAeoScore
};

import { fetchTopicById, fetchTopicBySlugGlobal, fetchTopicContent, fetchTopicAssets, fetchTopicAssessments, fetchTopicPage } from '../services/api/topicQuery.service.js';
import { recordTopicView } from '../services/analytics/topicAnalytics.service.js';

export async function getTopicById(req, res, next) {
  try {
    const data = await fetchTopicById(req.params.topicId);
    if (!data) return res.status(404).json({ success: false, error: 'Target Topic graph mapping not resolved.' });

    // Fire-and-forget analytics
    recordTopicView({
      topicId: data._id || data.topic_id,
      topicTitle: data.title,
      topicSlug: data.slug,
      documentId: data.document_id
    }).catch(() => {});

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getTopicBySlugGlobal(req, res, next) {
  try {
    let globalPath;
    if (Array.isArray(req.params.slug)) {
      globalPath = req.params.slug.join('/');
    } else {
      globalPath = req.params.slug || req.params[0] || req.params.slugGlobal;
    }
    const data = await fetchTopicBySlugGlobal(globalPath);
    if (!data) return res.status(404).json({ success: false, error: `Topic matching slug paths ("${globalPath}") not found.` });

    // Fire-and-forget analytics
    recordTopicView({
      topicId: data._id || data.topic_id,
      topicTitle: data.title,
      topicSlug: data.slug,
      documentId: data.document_id
    }).catch(() => {});

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getTopicContent(req, res, next) {
  try {
    const data = await fetchTopicContent(req.params.topicId);
    if (!data) return res.status(404).json({ success: false, error: 'Topic content not found.' });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getTopicAssets(req, res, next) {
  try {
    const data = await fetchTopicAssets(req.params.topicId);
    return res.status(200).json({ success: true, data: data || null });
  } catch (error) {
    next(error);
  }
}

export async function getTopicAssessments(req, res, next) {
  try {
    const data = await fetchTopicAssessments(req.params.topicId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getTopicPage(req, res, next) {
  try {
    const data = await fetchTopicPage(req.params.topicId);
    if (!data) return res.status(404).json({ success: false, error: 'Topic not found.' });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

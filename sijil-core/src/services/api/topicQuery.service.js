import Topic from '../../models/topic.model.js';
import TopicContent from '../../models/topicContent.model.js';
import TopicAsset from '../../models/topicAsset.model.js';
import TopicAssessment from '../../models/topicAssessment.model.js';
import { enrichFiguresWithUrls, enrichTables } from './assetUrl.service.js';

async function mergeTopicFragments(topicMeta) {
  if (!topicMeta) return null;
  const topicId = topicMeta._id;

  const [content, assets, assessments] = await Promise.all([
    TopicContent.findOne({ topic_id: topicId }).lean(),
    TopicAsset.findOne({ topic_id: topicId }).lean(),
    TopicAssessment.findOne({ topic_id: topicId }).lean()
  ]);

  // Enrich assets with computed URLs at read-time
  const enrichedFigures = enrichFiguresWithUrls(assets?.figures || assets?.assets || []);
  const enrichedTables = enrichTables(assets?.tables || []);

  // Build related_topics from resolved cross_concept_links
  const relatedTopics = (content?.entity_extraction?.cross_concept_links || [])
    .filter(link => link.resolved === true)
    .map(link => ({
      target_entity: link.target_entity,
      resolved_url: link.resolved_url,
      relationship_type: link.relationship_type,
      context: link.context
    }));

  return {
    meta: {
      _id: topicMeta._id,
      title: topicMeta.title,
      slug_global: topicMeta.slug_global,
      slug: topicMeta.slug,
      url_path: topicMeta.url_path,
      document_id: topicMeta.document_id,
      chapter_id: topicMeta.chapter_id,
      display_order: topicMeta.display_order,
      topic_type: topicMeta.topic_type,
      difficulty: topicMeta.difficulty,
      subject: topicMeta.subject,
      grade_numeric: topicMeta.grade_numeric,
      language: topicMeta.language,
      locale: topicMeta.locale,
      publishing_status: topicMeta.publishing_status,
      keywords: topicMeta.keywords || [],
      key_terms_preview: topicMeta.key_terms_preview || []
    },
    content_blocks: content?.content_blocks || [],
    figures: enrichedFigures,
    tables: enrichedTables,
    assessments: {
      mcqs: assessments?.mcqs || [],
      flashcards: assessments?.flashcards || [],
      short_questions: assessments?.short_questions || []
    },
    related_topics: relatedTopics
  };
}

export async function fetchTopicById(topicId) {
  const meta = await Topic.findById(topicId).lean();
  return mergeTopicFragments(meta);
}

export async function fetchTopicBySlugGlobal(slugGlobal) {
  const meta = await Topic.findOne({ slug_global: slugGlobal }).lean();
  return mergeTopicFragments(meta);
}

/**
 * Fetch topic content by topic ID
 * @param {string} topicId
 * @returns {Promise<Object|null>} TopicContent document or null
 */
export async function fetchTopicContent(topicId) {
  const content = await TopicContent.findOne({ topic_id: topicId }).lean();
  return content || null;
}

/**
 * Fetch topic assets by topic ID with enriched URLs
 * @param {string} topicId
 * @returns {Promise<Object|null>} Enriched TopicAsset document or null
 */
export async function fetchTopicAssets(topicId) {
  const assets = await TopicAsset.findOne({ topic_id: topicId }).lean();
  if (!assets) return null;
  
  const enrichedFigures = enrichFiguresWithUrls(assets.figures || []);
  const enrichedTables = enrichTables(assets.tables || []);
  
  return {
    ...assets,
    figures: enrichedFigures,
    tables: enrichedTables
  };
}

/**
 * Fetch topic assessments by topic ID
 * @param {string} topicId
 * @returns {Promise<Object>} TopicAssessment document or empty structure
 */
export async function fetchTopicAssessments(topicId) {
  const assessments = await TopicAssessment.findOne({ topic_id: topicId }).lean();
  if (!assessments) {
    return {
      mcqs: [],
      short_questions: [],
      long_questions: [],
      numerical_problems: [],
      flashcards: []
    };
  }
  
  // Map schema fields to expected response shape
  return {
    mcqs: assessments.book_mcqs || [],
    short_questions: assessments.book_short_questions || [],
    long_questions: assessments.book_problems || [],
    numerical_problems: assessments.book_problems || [],
    flashcards: assessments.flashcards || [],
    activities: assessments.activities || []
  };
}

/**
 * Fetch topic page with navigation and counts
 * @param {string} topicId
 * @returns {Promise<Object>} Topic page data with navigation and counts
 */
export async function fetchTopicPage(topicId) {
  // Fetch topic metadata
  const topic = await Topic.findById(topicId).lean();
  if (!topic) return null;
  
  // Fetch sibling topics in same document for navigation
  const [chapterTopics, contentCheck, formulasCount, assessmentsCount, assetsCount] = await Promise.all([
    Topic.find({ document_id: topic.document_id })
      .select('_id title slug display_order url_path')
      .sort({ display_order: 1 })
      .lean(),
    TopicContent.findOne({ topic_id: topicId }).select('topic_id').lean(),
    import('../../models/formulaIndex.model.js').then(m => m.default.countDocuments({ document_id: topic.document_id })).catch(() => 0),
    TopicAssessment.countDocuments({ topic_id: topicId }),
    TopicAsset.countDocuments({ topic_id: topicId })
  ]);
  
  // Find current topic position and determine prev/next
  const currentIndex = chapterTopics.findIndex(t => t._id === topicId);
  const prev = currentIndex > 0 ? chapterTopics[currentIndex - 1] : null;
  const next = currentIndex < chapterTopics.length - 1 ? chapterTopics[currentIndex + 1] : null;
  
  return {
    topic: {
      _id: topic._id,
      title: topic.title,
      slug_global: topic.slug_global,
      slug: topic.slug,
      url_path: topic.url_path,
      document_id: topic.document_id,
      chapter_id: topic.chapter_id,
      display_order: topic.display_order,
      topic_type: topic.topic_type,
      subject: topic.subject,
      grade_numeric: topic.grade_numeric
    },
    navigation: {
      prev: prev ? { _id: prev._id, title: prev.title, slug: prev.slug, url_path: prev.url_path } : null,
      next: next ? { _id: next._id, title: next.title, slug: next.slug, url_path: next.url_path } : null,
      chapter_topics: chapterTopics.map(t => ({
        _id: t._id,
        title: t.title,
        slug: t.slug,
        display_order: t.display_order,
        url_path: t.url_path
      }))
    },
    counts: {
      has_content: !!contentCheck,
      formulas: formulasCount,
      assessments: assessmentsCount,
      assets: assetsCount
    }
  };
}

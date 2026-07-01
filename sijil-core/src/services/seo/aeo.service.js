import mongoose from 'mongoose';
import Topic from '../../models/topic.model.js';
import TopicContent from '../../models/topicContent.model.js';
import TopicAssessment from '../../models/topicAssessment.model.js';
import FormulaIndex from '../../models/formulaIndex.model.js';
import Document from '../../models/document.model.js';
import { info as loggerInfo } from '../../utils/logger.js';

const BASE_URL = process.env.BASE_URL || 'https://sijil.app';
const MAX_ANSWER_LENGTH = 300;
const MAX_FAQ_PAIRS = 10;
const MAX_FORMULA_SNIPPETS = 5;
const MAX_DEFINITIONS = 8;
const MAX_KEY_FACTS = 10;

/**
 * Extract featured snippet from topic
 */
function extractFeaturedSnippet(topic, contentBlocks) {
  // Priority 1: SEO meta description if present and long enough
  if (topic.seo?.meta_description && topic.seo.meta_description.length > 50) {
    return topic.seo.meta_description;
  }

  // Priority 2: First paragraph content block
  const paragraphBlock = contentBlocks.find(
    block => block.block_type === 'paragraph' && block.content
  );
  if (paragraphBlock?.content) {
    const text = paragraphBlock.content;
    if (text.length > MAX_ANSWER_LENGTH) {
      return text.substring(0, MAX_ANSWER_LENGTH - 3) + '...';
    }
    return text;
  }

  // Fallback
  const subject = topic.subject || 'this subject';
  return `${topic.title} is a topic in ${subject}.`;
}

/**
 * Extract definitions from key_terms
 */
function extractDefinitions(topic) {
  if (!topic.key_terms || !Array.isArray(topic.key_terms)) {
    return [];
  }
  
  // Handle both string array and object array formats
  const definitions = topic.key_terms.map(term => {
    if (typeof term === 'string') {
      return { term, definition: '' };
    }
    if (typeof term === 'object' && term !== null) {
      return {
        term: term.term || term.name || '',
        definition: term.definition || term.description || ''
      };
    }
    return { term: '', definition: '' };
  }).filter(d => d.term);

  return definitions.slice(0, MAX_DEFINITIONS);
}

/**
 * Extract FAQ pairs from assessments
 */
function extractFaqPairs(assessments) {
  const faqPairs = [];

  // Source 1: short_question with model_answer
  const shortQuestions = assessments
    .filter(a => a.type === 'short_question' && a.model_answer)
    .map(a => ({
      question: a.question,
      answer: a.model_answer,
      source: 'short_question'
    }));

  // Source 2: MCQ with explanation
  const mcqWithExplanation = assessments
    .filter(a => a.type === 'mcq' && a.explanation)
    .map(a => ({
      question: a.question,
      answer: a.explanation,
      source: 'mcq'
    }));

  faqPairs.push(...shortQuestions, ...mcqWithExplanation);
  return faqPairs.slice(0, MAX_FAQ_PAIRS);
}

/**
 * Extract formula snippets
 */
function extractFormulaSnippets(formulas) {
  if (!formulas || formulas.length === 0) {
    return [];
  }

  return formulas.slice(0, MAX_FORMULA_SNIPPETS).map(f => ({
    label: f.label || '',
    latex: f.latex || '',
    text: f.text || '',
    variables: f.variables || []
  }));
}

/**
 * Extract key facts from content blocks or learning objectives
 */
function extractKeyFacts(contentBlocks, topic) {
  const factTypes = ['key_point', 'fact', 'highlight'];
  
  let facts = contentBlocks
    .filter(block => factTypes.includes(block.block_type) && block.content)
    .map(block => {
      const text = block.content;
      // Trim to reasonable length
      if (text.length > 200) {
        return text.substring(0, 197) + '...';
      }
      return text;
    });

  // Fallback to learning objectives if no facts found
  if (facts.length === 0 && topic.learning_objectives && Array.isArray(topic.learning_objectives)) {
    facts = topic.learning_objectives
      .filter(obj => typeof obj === 'string' || obj.text)
      .map(obj => typeof obj === 'string' ? obj : obj.text)
      .slice(0, MAX_KEY_FACTS);
  }

  return facts.slice(0, MAX_KEY_FACTS);
}

/**
 * Generate GEO summary
 */
function generateGeoSummary(title, featuredSnippet, keyFacts) {
  const topFacts = keyFacts.slice(0, 3).join(' ');
  let summary = `${title}. ${featuredSnippet}`;
  
  if (topFacts) {
    summary += ` ${topFacts}`;
  }

  if (summary.length > 500) {
    summary = summary.substring(0, 497) + '...';
  }

  return summary;
}

/**
 * Extract entities from tags
 */
function extractEntities(topic) {
  if (!topic.tags || !Array.isArray(topic.tags)) {
    return [];
  }

  return topic.tags
    .filter(tag => typeof tag === 'string' && tag.trim())
    .map(tag => ({
      name: tag,
      type: 'concept'
    }))
    .slice(0, 15);
}

/**
 * Main function: Generate Topic Answer Hub
 */
export async function generateTopicAnswerHub(topicId) {
  // 1. Query Topic
  const topic = await Topic.findById(topicId).lean();
  if (!topic) {
    throw new Error(`Topic not found: ${topicId}`);
  }

  // 2. Query TopicContent
  const contentBlocks = await TopicContent.find({ topic_id: topicId })
    .sort({ display_order: 1 })
    .lean();

  // 3. Query TopicAssessment
  const assessments = await TopicAssessment.find({ topic_id: topicId }).lean();

  // 4. Query FormulaIndex
  const formulas = await FormulaIndex.find({ topic_id: topicId }).lean();

  // 5. Build payload
  const featuredSnippet = extractFeaturedSnippet(topic, contentBlocks);
  const definitions = extractDefinitions(topic);
  const faqPairs = extractFaqPairs(assessments);
  const formulaSnippets = extractFormulaSnippets(formulas);
  const keyFacts = extractKeyFacts(contentBlocks, topic);
  const geoSummary = generateGeoSummary(topic.title, featuredSnippet, keyFacts);
  const entities = extractEntities(topic);

  return {
    topic_id: topicId,
    title: topic.title,
    url: BASE_URL + topic.url_path,
    canonical_url: BASE_URL + topic.url_path,
    generated_at: new Date().toISOString(),
    featured_snippet: featuredSnippet,
    definitions: definitions,
    faq_pairs: faqPairs,
    formula_snippets: formulaSnippets,
    key_facts: keyFacts,
    geo_summary: geoSummary,
    entities: entities,
    stats: {
      total_content_blocks: contentBlocks.length,
      total_assessments: assessments.length,
      total_formulas: formulas.length,
      has_featured_snippet: !!featuredSnippet,
      faq_count: faqPairs.length,
      formula_count: formulaSnippets.length
    }
  };
}

/**
 * Generate Document Answer Hub
 */
export async function generateDocumentAnswerHub(documentId) {
  // 1. Query Document by human-readable document_id
  const document = await Document.findOne({ 
    'document_metadata.document_id': documentId 
  }).lean();

  if (!document) {
    throw new Error(`Document not found: ${documentId}`);
  }

  // 2. Query all Topics for this document
  const topics = await Topic.find({ document_id: document._id })
    .select('_id title slug url_path seo')
    .lean();

  // Build featured snippet
  let featuredSnippet = document.seo_master?.meta_description;
  if (!featuredSnippet) {
    const docType = document.document_type || 'document';
    const subject = document.document_metadata?.subject || 'a subject';
    const grade = document.document_metadata?.grade_level || 'students';
    featuredSnippet = `${document.document_metadata?.title || 'This document'} is a ${docType} covering ${subject} for ${grade}.`;
  }

  // Build topic index
  const topicIndex = topics.map(t => ({
    title: t.title,
    url: BASE_URL + (t.url_path || ''),
    description: t.seo?.meta_description || t.title
  }));

  // Build entities
  const entities = [
    { name: document.document_metadata?.subject, type: 'subject' },
    { name: document.document_metadata?.publisher, type: 'organization' },
    { name: document.document_metadata?.board_or_authority, type: 'organization' },
    { name: document.document_metadata?.curriculum_standard, type: 'curriculum' }
  ].filter(e => e.name);

  // Generate GEO summary
  let geoSummary = `${document.document_metadata?.title || 'Document'}. ${featuredSnippet}`;
  if (geoSummary.length > 400) {
    geoSummary = geoSummary.substring(0, 397) + '...';
  }

  return {
    document_id: documentId,
    title: document.document_metadata?.title || '',
    url: BASE_URL + '/docs/' + documentId,
    generated_at: new Date().toISOString(),
    featured_snippet: featuredSnippet,
    topic_index: topicIndex,
    entities: entities,
    geo_summary: geoSummary,
    stats: {
      total_topics: topics.length,
      document_type: document.document_type || '',
      subject: document.document_metadata?.subject || '',
      grade_level: document.document_metadata?.grade_level || ''
    }
  };
}

/**
 * Batch generate answer hubs
 */
export async function batchGenerateAnswerHubs(topicIds) {
  const results = await Promise.allSettled(
    topicIds.map(id => generateTopicAnswerHub(id))
  );

  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failCount = results.filter(r => r.status === 'rejected').length;

  loggerInfo(`Batch AEO generation: ${successCount} succeeded, ${failCount} failed`);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        topicId: topicIds[index],
        success: true,
        data: result.value
      };
    } else {
      return {
        topicId: topicIds[index],
        success: false,
        error: result.reason?.message || 'Unknown error'
      };
    }
  });
}

/**
 * Get AEO Readiness Score
 */
export async function getAeoReadinessScore(topicId) {
  try {
    const hub = await generateTopicAnswerHub(topicId);

    // Calculate scores
    const criteria = {
      featured_snippet: {
        score: hub.featured_snippet.length > 100 ? 20 : 0,
        present: hub.featured_snippet.length > 0
      },
      definitions: {
        score: hub.definitions.length >= 3 ? 15 : 0,
        count: hub.definitions.length
      },
      faq_pairs: {
        score: hub.faq_pairs.length >= 3 ? 20 : 0,
        count: hub.faq_pairs.length
      },
      formula_snippets: {
        score: hub.formula_snippets.length >= 1 ? 10 : 0,
        count: hub.formula_snippets.length
      },
      key_facts: {
        score: hub.key_facts.length >= 3 ? 15 : 0,
        count: hub.key_facts.length
      },
      geo_summary: {
        score: hub.geo_summary.length > 100 ? 10 : 0,
        present: hub.geo_summary.length > 0
      },
      entities: {
        score: hub.entities.length >= 2 ? 10 : 0,
        count: hub.entities.length
      }
    };

    const totalScore = Object.values(criteria).reduce((sum, c) => sum + c.score, 0);

    // Determine grade
    let grade;
    if (totalScore >= 80) grade = 'A';
    else if (totalScore >= 60) grade = 'B';
    else if (totalScore >= 40) grade = 'C';
    else if (totalScore >= 20) grade = 'D';
    else grade = 'F';

    // Generate recommendations
    const recommendations = [];
    if (criteria.featured_snippet.score === 0) {
      recommendations.push('Expand featured snippet to at least 100 characters');
    }
    if (criteria.definitions.score === 0) {
      recommendations.push('Add at least 3 key term definitions');
    }
    if (criteria.faq_pairs.score === 0) {
      recommendations.push('Add at least 3 FAQ pairs to improve AI citability');
    }
    if (criteria.formula_snippets.score === 0) {
      recommendations.push('Include relevant formulas for this topic');
    }
    if (criteria.key_facts.score === 0) {
      recommendations.push('Add at least 3 key facts or highlights');
    }
    if (criteria.geo_summary.score === 0) {
      recommendations.push('Expand GEO summary to at least 100 characters');
    }
    if (criteria.entities.score === 0) {
      recommendations.push('Add at least 2 entity tags');
    }

    return {
      topic_id: topicId,
      score: totalScore,
      grade,
      criteria,
      recommendations
    };
  } catch (error) {
    return {
      topic_id: topicId,
      score: 0,
      error: error.message
    };
  }
}

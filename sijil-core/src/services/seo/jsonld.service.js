import { info } from '../../utils/logger.js';
import Topic from '../../models/topic.model.js';
import Document from '../../models/document.model.js';
import TopicAssessment from '../../models/topicAssessment.model.js';

const BASE_URL = process.env.BASE_URL || 'https://sijil.app';

/**
 * Generate schema.org Book JSON-LD
 */
export function generateBookJsonLd(document) {
  if (!document) return null;

  const docMeta = document.document_metadata || {};
  const seo = document.seo_master || {};
  const authors = document.authors || [];
  const publisher = document.publisher;

  const book = {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${BASE_URL}/docs/${docMeta.document_id}`,
    "name": document.title,
    "author": authors.length > 0 ? authors.map(a => ({ "@type": "Person", "name": a })) : undefined,
    "publisher": publisher ? { "@type": "Organization", "name": publisher } : undefined,
    "inLanguage": document.language,
    "educationalLevel": docMeta.grade_level,
    "about": docMeta.subject ? { "@type": "Thing", "name": docMeta.subject } : undefined,
    "genre": document.document_type,
    "datePublished": docMeta.edition_year ? String(docMeta.edition_year) : undefined,
    "url": seo.canonical_url
  };

  return book;
}

/**
 * Generate schema.org Article JSON-LD
 */
export function generateArticleJsonLd(topic, document) {
  if (!topic || !document) return null;

  const docMeta = document.document_metadata || {};
  const topicSeo = topic.seo || {};

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${BASE_URL}${topic.url_path}`,
    "headline": topic.title,
    "description": topicSeo.meta_description,
    "keywords": topicSeo.focus_keyword,
    "inLanguage": document.language,
    "isPartOf": {
      "@type": "Book",
      "name": document.title,
      "@id": `${BASE_URL}/docs/${docMeta.document_id}`
    },
    "educationalLevel": docMeta.grade_level,
    "about": { "@type": "Thing", "name": topic.title },
    "dateModified": topic.updated_at ? topic.updated_at.toISOString() : new Date().toISOString()
  };
}

/**
 * Generate schema.org FAQPage JSON-LD
 */
export function generateFaqJsonLd(topic, assessments) {
  if (!assessments || assessments.length === 0) return null;

  const pairs = [];

  // Process short questions
  const shortQuestions = assessments.filter(a => a.type === 'short_question' && a.model_answer);
  shortQuestions.forEach(sq => {
    pairs.push({
      "@type": "Question",
      "name": sq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": sq.model_answer
      }
    });
  });

  // Process MCQs with explanations
  const mcqs = assessments.filter(a => a.type === 'mcq' && a.explanation);
  mcqs.forEach(mcq => {
    pairs.push({
      "@type": "Question",
      "name": mcq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": mcq.explanation
      }
    });
  });

  if (pairs.length === 0) return null;

  // Cap at 10
  const limitedPairs = pairs.slice(0, 10);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": limitedPairs
  };
}

/**
 * Generate schema.org Quiz JSON-LD
 */
export function generateQuizJsonLd(topic, mcqs) {
  if (!mcqs || mcqs.length === 0) return null;

  const hasPart = mcqs.slice(0, 5).map(mcq => {
    const options = mcq.options || {};
    const correctOptionText = options[mcq.correct_answer] || '';

    const suggestedAnswers = ['a', 'b', 'c', 'd'].map(key => ({
      "@type": "Answer",
      "text": options[key] || '',
      "position": key
    }));

    return {
      "@type": "Question",
      "name": mcq.question,
      "suggestedAnswer": suggestedAnswers,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": correctOptionText
      }
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": `${topic.title} — MCQ Practice`,
    "about": { "@type": "Thing", "name": topic.title },
    "educationalAlignment": {
      "@type": "AlignmentObject",
      "educationalFramework": "Bloom's Taxonomy",
      "targetName": topic.bloom_level
    },
    "hasPart": hasPart
  };
}

/**
 * Generate schema.org BreadcrumbList JSON-LD
 */
export function generateBreadcrumbJsonLd(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
}

/**
 * Generate schema.org Course JSON-LD
 */
export function generateCourseJsonLd(document) {
  if (!document || document.document_type !== 'course') return null;

  const docMeta = document.document_metadata || {};
  const courseMeta = document.type_specific_data?.course_metadata || {};
  const seo = document.seo_master || {};

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": document.title,
    "description": seo.meta_description,
    "provider": { "@type": "Organization", "name": "Sijil" },
    "inLanguage": document.language,
    "educationalLevel": courseMeta.difficulty,
    "url": seo.canonical_url
  };
}

/**
 * Main API function: Generate full bundle for a topic
 */
export async function generateTopicJsonLdBundle(topicId) {
  const topic = await Topic.findOne({ _id: topicId }).lean();
  if (!topic) {
    throw new Error(`Topic not found: ${topicId}`);
  }

  const document = await Document.findOne({ 'document_metadata.document_id': topic.document_id }).lean();
  if (!document) {
    throw new Error('Document not found');
  }

  const assessments = await TopicAssessment.find({ topic_id: topicId, type: { $in: ['mcq', 'short_question'] } }).lean();

  const article = generateArticleJsonLd(topic, document);
  
  const faq = generateFaqJsonLd(topic, assessments);
  
  const mcqs = assessments.filter(a => a.type === 'mcq');
  const quiz = generateQuizJsonLd(topic, mcqs);

  const docMeta = document.document_metadata || {};
  const breadcrumb = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${BASE_URL}` },
    { name: docMeta.subject || 'Subject', url: `${BASE_URL}/subjects/${docMeta.subject_slug || 'unknown'}` },
    { name: document.title, url: `${BASE_URL}/docs/${docMeta.document_id}` },
    { name: topic.title, url: `${BASE_URL}${topic.url_path}` }
  ]);

  return { article, faq, quiz, breadcrumb };
}

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { generateBookJsonLd, generateArticleJsonLd, generateFaqJsonLd, generateQuizJsonLd, generateBreadcrumbJsonLd, generateTopicJsonLdBundle } from '../services/seo/jsonld.service.js';
import Topic from '../models/topic.model.js';
import Document from '../models/document.model.js';

let passed = 0;
let failed = 0;

function logTest(name, condition, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${name} - ${details}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== PHASE 9 STEP 3: JSON-LD Structured Data Generator ===\n');

  // Connect to DB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
  } catch (err) {
    console.log('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // Get real data for tests
  const topic = await Topic.findOne().lean();
  const document = await Document.findOne().lean();

  if (!topic || !document) {
    console.log('NO TOPICS OR DOCUMENTS IN DATABASE — seed data first');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Using topic: ${topic.title} (${topic._id})`);
  console.log(`Using document: ${document.title} (${document.document_metadata.document_id})\n`);

  // Test 1: generateBookJsonLd
  try {
    const result = generateBookJsonLd(document);
    logTest(
      'generateBookJsonLd',
      result && result['@type'] === 'Book' && typeof result.name === 'string' && result.name.length > 0,
      `Got @type: ${result?.['@type']}, name: ${result?.name}`
    );
  } catch (err) {
    logTest('generateBookJsonLd', false, err.message);
  }

  // Test 2: generateArticleJsonLd
  try {
    const result = generateArticleJsonLd(topic, document);
    logTest(
      'generateArticleJsonLd',
      result && result['@type'] === 'Article' && result.headline === topic.title,
      `Got @type: ${result?.['@type']}, headline: ${result?.headline}`
    );
  } catch (err) {
    logTest('generateArticleJsonLd', false, err.message);
  }

  // Test 3: generateFaqJsonLd with empty assessments
  try {
    const result = generateFaqJsonLd(topic, []);
    logTest(
      'generateFaqJsonLd (empty)',
      result === null,
      `Expected null, got: ${JSON.stringify(result)}`
    );
  } catch (err) {
    logTest('generateFaqJsonLd (empty)', false, err.message);
  }

  // Test 4: generateFaqJsonLd with mock short_question
  try {
    const mockAssessments = [
      { type: 'short_question', question: 'What is force?', model_answer: 'A push or pull.' }
    ];
    const result = generateFaqJsonLd(topic, mockAssessments);
    logTest(
      'generateFaqJsonLd (with data)',
      result && result['@type'] === 'FAQPage' && result.mainEntity.length === 1,
      `Got @type: ${result?.['@type']}, count: ${result?.mainEntity?.length}`
    );
  } catch (err) {
    logTest('generateFaqJsonLd (with data)', false, err.message);
  }

  // Test 5: generateQuizJsonLd with empty mcqs
  try {
    const result = generateQuizJsonLd(topic, []);
    logTest(
      'generateQuizJsonLd (empty)',
      result === null,
      `Expected null, got: ${JSON.stringify(result)}`
    );
  } catch (err) {
    logTest('generateQuizJsonLd (empty)', false, err.message);
  }

  // Test 6: generateQuizJsonLd with mock MCQs
  try {
    const mockMcqs = [
      { question: 'Q1', options: { a: 'A', b: 'B', c: 'C', d: 'D' }, correct_answer: 'a', explanation: 'Because A.' },
      { question: 'Q2', options: { a: 'W', b: 'X', c: 'Y', d: 'Z' }, correct_answer: 'c', explanation: 'Because Y.' },
      { question: 'Q3', options: { a: '1', b: '2', c: '3', d: '4' }, correct_answer: 'b', explanation: 'Because 2.' }
    ];
    const result = generateQuizJsonLd(topic, mockMcqs);
    logTest(
      'generateQuizJsonLd (with data)',
      result && result['@type'] === 'Quiz' && result.hasPart.length === 3,
      `Got @type: ${result?.['@type']}, count: ${result?.hasPart?.length}`
    );
  } catch (err) {
    logTest('generateQuizJsonLd (with data)', false, err.message);
  }

  // Test 7: generateBreadcrumbJsonLd
  try {
    const breadcrumbs = [
      { name: 'Home', url: 'https://sijil.app' },
      { name: 'Physics', url: 'https://sijil.app/subjects/physics' }
    ];
    const result = generateBreadcrumbJsonLd(breadcrumbs);
    logTest(
      'generateBreadcrumbJsonLd',
      result && result['@type'] === 'BreadcrumbList' && result.itemListElement.length === 2,
      `Got @type: ${result?.['@type']}, count: ${result?.itemListElement?.length}`
    );
  } catch (err) {
    logTest('generateBreadcrumbJsonLd', false, err.message);
  }

  // Test 8: generateTopicJsonLdBundle with real topic
  try {
    const result = await generateTopicJsonLdBundle(topic._id);
    logTest(
      'generateTopicJsonLdBundle (real)',
      result && 
      result.article && 
      result.article['@type'] === 'Article' &&
      result.hasOwnProperty('faq') &&
      result.hasOwnProperty('quiz') &&
      result.hasOwnProperty('breadcrumb'),
      `Got article: ${!!result.article}, faq: ${!!result.faq}, quiz: ${!!result.quiz}, breadcrumb: ${!!result.breadcrumb}`
    );
  } catch (err) {
    logTest('generateTopicJsonLdBundle (real)', false, err.message);
  }

  // Test 9: generateTopicJsonLdBundle with nonexistent ID
  try {
    await generateTopicJsonLdBundle('nonexistent_id');
    logTest('generateTopicJsonLdBundle (nonexistent)', false, 'Should have thrown error');
  } catch (err) {
    logTest(
      'generateTopicJsonLdBundle (nonexistent)',
      err.message.includes('Topic not found'),
      `Got error: ${err.message}`
    );
  }

  // Test 10: HTTP GET /seo/topic/:topicId/jsonld
  try {
    const response = await fetch(`http://localhost:4000/api/seo/topic/${topic._id}/jsonld`);
    if (response.ok) {
      const data = await response.json();
      logTest(
        'HTTP GET /seo/topic/:topicId/jsonld',
        data.success === true && data.data && data.data.article,
        `Got success: ${data.success}, has article: ${!!data.data?.article}`
      );
    } else {
      logTest('HTTP GET /seo/topic/:topicId/jsonld', false, `Status: ${response.status}`);
    }
  } catch (err) {
    console.log('⚠️  SKIP: HTTP test - server not running or unreachable');
  }

  await mongoose.disconnect();

  console.log('\n===========================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('=== PHASE 9 STEP 3 COMPLETE ===');
  } else {
    console.log('Some tests failed. Please review.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});

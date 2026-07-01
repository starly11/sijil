import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { info as loggerInfo, error as loggerError } from '../utils/logger.js';
import Topic from '../models/topic.model.js';
import Document from '../models/document.model.js';
import { 
  generateTopicAnswerHub, 
  generateDocumentAnswerHub, 
  batchGenerateAnswerHubs,
  getAeoReadinessScore 
} from '../services/seo/aeo.service.js';

// Config is already loaded by env.js, just use it
const PORT = config.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

let realTopicId = null;
let realDocumentId = null; // human-readable document_id
let topicCount = 0;
let documentCount = 0;

const tests = [];
let passed = 0;
let failed = 0;
let skipped = 0;

function logTest(name, condition, details = '') {
  const status = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);
  
  tests.push({ name, passed: condition });
  if (condition) passed++;
  else failed++;
}

function logSkip(name, reason) {
  console.log(`⚠️  SKIP: ${name} - ${reason}`);
  tests.push({ name, skipped: true });
  skipped++;
}

async function setup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    loggerInfo('Connected to MongoDB for testing');

    // Find a real topic
    const topic = await Topic.findOne().lean();
    if (topic) {
      realTopicId = topic._id.toString();
      topicCount = await Topic.countDocuments();
      loggerInfo(`Found ${topicCount} topics, using: ${realTopicId}`);
    } else {
      loggerInfo('No topics found in database');
    }

    // Find a real document and get its human-readable document_id
    const doc = await Document.findOne().lean();
    if (doc && doc.document_metadata?.document_id) {
      realDocumentId = doc.document_metadata.document_id;
      documentCount = await Document.countDocuments();
      loggerInfo(`Found ${documentCount} documents, using document_id: ${realDocumentId}`);
    } else {
      loggerInfo('No documents found in database');
    }

  } catch (error) {
    loggerError('Setup failed:', error.message);
  }
}

async function teardown() {
  await mongoose.connection.close();
  loggerInfo('MongoDB connection closed');
}

// ─── TESTS ───

async function test1() {
  const testName = 'generateTopicAnswerHub(realTopicId)';
  if (!realTopicId) {
    logSkip(testName, 'No topic in database');
    return;
  }

  try {
    const result = await generateTopicAnswerHub(realTopicId);
    
    const hasAllKeys = 
      result.topic_id &&
      result.title &&
      result.url &&
      result.featured_snippet !== undefined &&
      Array.isArray(result.definitions) &&
      Array.isArray(result.faq_pairs) &&
      Array.isArray(result.formula_snippets) &&
      Array.isArray(result.key_facts) &&
      result.geo_summary !== undefined &&
      Array.isArray(result.entities) &&
      result.stats;

    logTest(
      testName,
      hasAllKeys,
      `featured_snippet: "${result.featured_snippet?.substring(0, 80)}..." | stats: ${JSON.stringify(result.stats)}`
    );
  } catch (error) {
    logTest(testName, false, `Error: ${error.message}`);
  }
}

async function test2() {
  const testName = 'generateTopicAnswerHub(nonexistent)';
  
  try {
    await generateTopicAnswerHub('nonexistent_id_99999');
    logTest(testName, false, 'Should have thrown an error');
  } catch (error) {
    const isCorrect = error.message.includes('Topic not found');
    logTest(testName, isCorrect, `Error message: ${error.message}`);
  }
}

async function test3() {
  const testName = 'generateDocumentAnswerHub(realDocumentId)';
  if (!realDocumentId) {
    logSkip(testName, 'No document in database');
    return;
  }

  try {
    const result = await generateDocumentAnswerHub(realDocumentId);
    
    const hasAllKeys = 
      result.document_id &&
      result.title &&
      result.url &&
      result.featured_snippet !== undefined &&
      Array.isArray(result.topic_index) &&
      Array.isArray(result.entities) &&
      result.geo_summary !== undefined &&
      result.stats;

    logTest(
      testName,
      hasAllKeys,
      `stats: ${JSON.stringify(result.stats)}`
    );
  } catch (error) {
    logTest(testName, false, `Error: ${error.message}`);
  }
}

async function test4() {
  const testName = 'generateDocumentAnswerHub(nonexistent-doc)';
  
  try {
    await generateDocumentAnswerHub('nonexistent-doc-99999');
    logTest(testName, false, 'Should have thrown an error');
  } catch (error) {
    const isCorrect = error.message.includes('Document not found');
    logTest(testName, isCorrect, `Error message: ${error.message}`);
  }
}

async function test5() {
  const testName = 'batchGenerateAnswerHubs([realTopicId, fake_id])';
  if (!realTopicId) {
    logSkip(testName, 'No topic in database');
    return;
  }

  try {
    const results = await batchGenerateAnswerHubs([realTopicId, 'fake_id_999']);
    
    const isArray = Array.isArray(results) && results.length === 2;
    const firstSuccess = results[0]?.success === true;
    const secondFail = results[1]?.success === false && results[1]?.error;
    
    logTest(
      testName,
      isArray && firstSuccess && secondFail,
      `Results: [${results[0]?.success ? '✓' : '✗'}, ${results[1]?.success ? '✓' : '✗'}]`
    );
  } catch (error) {
    logTest(testName, false, `Error: ${error.message}`);
  }
}

async function test6() {
  const testName = 'getAeoReadinessScore(realTopicId)';
  if (!realTopicId) {
    logSkip(testName, 'No topic in database');
    return;
  }

  try {
    const result = await getAeoReadinessScore(realTopicId);
    
    const hasStructure = 
      result.topic_id &&
      typeof result.score === 'number' &&
      result.score >= 0 &&
      result.score <= 100 &&
      ['A', 'B', 'C', 'D', 'F'].includes(result.grade) &&
      result.criteria &&
      Array.isArray(result.recommendations);

    logTest(
      testName,
      hasStructure,
      `Score: ${result.score}/100 (Grade: ${result.grade}) | Recommendations: ${result.recommendations.length}`
    );
  } catch (error) {
    logTest(testName, false, `Error: ${error.message}`);
  }
}

async function test7() {
  const testName = 'HTTP GET /api/seo/topic/:topicId/aeo';
  if (!realTopicId) {
    logSkip(testName, 'No topic in database');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/seo/topic/${realTopicId}/aeo`);
    const data = await response.json();
    
    const isSuccess = response.ok && data.success === true && data.data?.featured_snippet;
    logTest(
      testName,
      isSuccess,
      `Status: ${response.status} | featured_snippet present: ${!!data.data?.featured_snippet}`
    );
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      logSkip(testName, 'Server not running');
    } else {
      logTest(testName, false, `Error: ${error.message}`);
    }
  }
}

async function test8() {
  const testName = 'HTTP GET /api/seo/document/:documentId/aeo';
  if (!realDocumentId) {
    logSkip(testName, 'No document in database');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/seo/document/${realDocumentId}/aeo`);
    const data = await response.json();
    
    const isSuccess = response.ok && data.success === true && Array.isArray(data.data?.topic_index);
    logTest(
      testName,
      isSuccess,
      `Status: ${response.status} | topic_index count: ${data.data?.topic_index?.length || 0}`
    );
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      logSkip(testName, 'Server not running');
    } else {
      logTest(testName, false, `Error: ${error.message}`);
    }
  }
}

async function test9() {
  const testName = 'HTTP GET /api/seo/topic/:topicId/aeo/score';
  if (!realTopicId) {
    logSkip(testName, 'No topic in database');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/seo/topic/${realTopicId}/aeo/score`);
    const data = await response.json();
    
    const isSuccess = response.ok && data.success === true && typeof data.data?.score === 'number';
    logTest(
      testName,
      isSuccess,
      `Status: ${response.status} | Score: ${data.data?.score}`
    );
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      logSkip(testName, 'Server not running');
    } else {
      logTest(testName, false, `Error: ${error.message}`);
    }
  }
}

// ─── MAIN ───

async function runTests() {
  console.log('\n=== PHASE 9 STEP 5: AEO Answer Hub Tests ===\n');
  
  await setup();
  
  if (!realTopicId && !realDocumentId) {
    console.log('NO TOPICS OR DOCUMENTS IN DATABASE — seed data first');
    await teardown();
    return;
  }

  console.log(`Database: ${topicCount} topics, ${documentCount} documents\n`);

  await test1();
  await test2();
  await test3();
  await test4();
  await test5();
  await test6();
  await test7();
  await test8();
  await test9();

  await teardown();

  // Summary
  console.log('\n--- SUMMARY ---');
  console.log(`Total: ${tests.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
  
  if (failed === 0) {
    console.log('\n=== PHASE 9 STEP 5 COMPLETE ===');
  } else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
  }
}

runTests().catch(error => {
  loggerError('Test suite failed:', error);
  process.exit(1);
});

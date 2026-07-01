import mongoose from 'mongoose';
import { config } from '../config/env.js';
import * as logger from '../utils/logger.js';

// Import all Phase 9 services
import { isExportAllowed, getAllPolicies } from '../services/export/exportPolicy.service.js';
import { aggregateForExport } from '../services/export/contentAggregator.service.js';
import { generateTopicJsonLdBundle } from '../services/seo/jsonld.service.js';
import { generateSitemapIndex, generateSitemapPage, getSitemapStats } from '../services/seo/sitemap.service.js';
import { generateTopicAnswerHub, getAeoReadinessScore } from '../services/seo/aeo.service.js';
import { resolveTheme, renderKatexCdn, renderFormulaHtml, renderMcqHtml, renderPageShell } from '../services/export/renderers/shared/renderUtils.js';
import { renderFormulaPack } from '../services/export/renderers/formulaPack.renderer.js';
import { renderMcqPack } from '../services/export/renderers/mcqPack.renderer.js';
import { buildOfflinePackage } from '../services/export/packageBuilder.service.js';
import { recordSuccessfulSearch, getSearchAnalyticsSummary, clearOldFailedSearches } from '../services/analytics/searchAnalytics.service.js';
import { recordTopicView, getTopicAnalyticsSummary } from '../services/analytics/topicAnalytics.service.js';

import Topic from '../models/topic.model.js';
import Document from '../models/document.model.js';
import PopularSearch from '../models/popularSearch.model.js';

let realTopicId = null;
let realDocumentId = null;

const results = {
  step1: { passed: 0, total: 3 },
  step2: { passed: 0, total: 3 },
  step3: { passed: 0, total: 2 },
  step4: { passed: 0, total: 3 },
  step5: { passed: 0, total: 2 },
  step6: { passed: 0, total: 3 },
  step7: { passed: 0, total: 2 },
  step8: { passed: 0, total: 4 }
};

async function runTests() {
  console.log('=== PHASE 9 INTEGRATION TEST ===\n');

  // Connect to MongoDB
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('✅ MongoDB connected for integration tests');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // Get real data
  const topic = await Topic.findOne().lean();
  const doc = await Document.findOne().lean();

  if (topic) {
    realTopicId = topic._id;
    console.log(`Using topic: ${topic.title} (${realTopicId})`);
  } else {
    console.warn('⚠️  No topics found in database');
  }

  if (doc) {
    realDocumentId = doc.document_metadata?.document_id || doc._id;
    console.log(`Using document: ${doc.document_metadata?.title || 'N/A'} (${realDocumentId})`);
  } else {
    console.warn('⚠️  No documents found in database');
  }

  console.log('\n--- STEP 1: Export Policy ---');
  
  // 1a
  try {
    const r1a = await isExportAllowed('textbook', 'formula_pack');
    if (r1a.allowed === true) {
      console.log('✅ 1a PASS - textbook formula_pack allowed');
      results.step1.passed++;
    } else {
      console.log('❌ 1a FAIL - expected allowed=true');
    }
  } catch (e) {
    console.log('❌ 1a FAIL -', e.message);
  }

  // 1b
  try {
    const r1b = await isExportAllowed('textbook', 'full_book');
    if (r1b.allowed === false) {
      console.log('✅ 1b PASS - full_book blocked');
      results.step1.passed++;
    } else {
      console.log('❌ 1b FAIL - expected allowed=false');
    }
  } catch (e) {
    console.log('❌ 1b FAIL -', e.message);
  }

  // 1c
  try {
    const r1c = await getAllPolicies();
    if (Array.isArray(r1c) && r1c.length === 10) {
      console.log('✅ 1c PASS - 10 policies returned');
      results.step1.passed++;
    } else {
      console.log(`❌ 1c FAIL - expected 10 policies, got ${r1c?.length}`);
    }
  } catch (e) {
    console.log('❌ 1c FAIL -', e.message);
  }

  console.log('\n--- STEP 2: Content Aggregation ---');

  if (realTopicId) {
    // 2a
    try {
      const r2a = await aggregateForExport({ topicId: realTopicId, exportType: 'formula_pack', documentType: 'textbook' });
      if (r2a.export_type && r2a.metadata && Array.isArray(r2a.formulas)) {
        console.log('✅ 2a PASS - formula_pack aggregated');
        results.step2.passed++;
      } else {
        console.log('❌ 2a FAIL - missing keys');
      }
    } catch (e) {
      console.log('❌ 2a FAIL -', e.message);
    }

    // 2b
    try {
      const r2b = await aggregateForExport({ topicId: realTopicId, exportType: 'mcq_pack', documentType: 'textbook' });
      if (r2b.assessments && Array.isArray(r2b.assessments.mcqs) && Array.isArray(r2b.assessments.short_questions)) {
        console.log('✅ 2b PASS - mcq_pack aggregated');
        results.step2.passed++;
      } else {
        console.log('❌ 2b FAIL - missing assessments structure');
      }
    } catch (e) {
      console.log('❌ 2b FAIL -', e.message);
    }
  } else {
    console.log('⚠️  SKIP 2a, 2b - no topic');
  }

  // 2c
  try {
    await aggregateForExport({ topicId: 'fake', exportType: 'full_book', documentType: 'textbook' });
    console.log('❌ 2c FAIL - should have thrown');
  } catch (e) {
    if (e.message.includes('not permitted') || e.message.includes('Unknown') || e.message.includes('permanently disabled')) {
      console.log('✅ 2c PASS - full_book rejected');
      results.step2.passed++;
    } else {
      console.log('❌ 2c FAIL - wrong error:', e.message);
    }
  }

  console.log('\n--- STEP 3: JSON-LD ---');

  if (realTopicId) {
    try {
      const r3a = await generateTopicJsonLdBundle(realTopicId);
      if (r3a.article && r3a.breadcrumb) {
        console.log('✅ 3a PASS - bundle has article and breadcrumb');
        results.step3.passed++;
      } else {
        console.log('❌ 3a FAIL - missing keys');
      }
    } catch (e) {
      console.log('❌ 3a FAIL -', e.message);
    }

    try {
      const r3b = await generateTopicJsonLdBundle(realTopicId);
      if (r3b.article && r3b.article['@type'] === 'Article') {
        console.log('✅ 3b PASS - article @type correct');
        results.step3.passed++;
      } else {
        console.log('❌ 3b FAIL - wrong @type');
      }
    } catch (e) {
      console.log('❌ 3b FAIL -', e.message);
    }
  } else {
    console.log('⚠️  SKIP Step 3 - no topic');
  }

  console.log('\n--- STEP 4: Sitemap ---');

  try {
    const r4a = await generateSitemapIndex();
    if (typeof r4a === 'string' && r4a.startsWith('<?xml')) {
      console.log('✅ 4a PASS - sitemap index valid XML');
      results.step4.passed++;
    } else {
      console.log('❌ 4a FAIL - invalid XML');
    }
  } catch (e) {
    console.log('❌ 4a FAIL -', e.message);
  }

  try {
    const r4b = await generateSitemapPage(1);
    if (typeof r4b === 'string' && r4b.includes('<urlset')) {
      console.log('✅ 4b PASS - sitemap page valid');
      results.step4.passed++;
    } else {
      console.log('❌ 4b FAIL - invalid');
    }
  } catch (e) {
    console.log('❌ 4b FAIL -', e.message);
  }

  try {
    const r4c = await getSitemapStats();
    if (typeof r4c.total_urls === 'number') {
      console.log('✅ 4c PASS - stats has total_urls');
      results.step4.passed++;
    } else {
      console.log('❌ 4c FAIL - missing total_urls');
    }
  } catch (e) {
    console.log('❌ 4c FAIL -', e.message);
  }

  console.log('\n--- STEP 5: AEO ---');

  if (realTopicId) {
    try {
      const r5a = await generateTopicAnswerHub(realTopicId);
      if (typeof r5a.featured_snippet === 'string' && r5a.featured_snippet.length > 0) {
        console.log('✅ 5a PASS - featured_snippet present');
        results.step5.passed++;
      } else {
        console.log('❌ 5a FAIL - empty snippet');
      }
    } catch (e) {
      console.log('❌ 5a FAIL -', e.message);
    }

    try {
      const r5b = await getAeoReadinessScore(realTopicId);
      if (typeof r5b.score === 'number' && r5b.score >= 0 && r5b.score <= 100 && ['A','B','C','D','F'].includes(r5b.grade)) {
        console.log(`✅ 5b PASS - score=${r5b.score}, grade=${r5b.grade}`);
        results.step5.passed++;
      } else {
        console.log('❌ 5b FAIL - invalid score/grade');
      }
    } catch (e) {
      console.log('❌ 5b FAIL -', e.message);
    }
  } else {
    console.log('⚠️  SKIP Step 5 - no topic');
  }

  console.log('\n--- STEP 6: Renderers ---');

  // Mock payload for renderer tests
  const mockPayload = {
    metadata: { title: 'Test Topic', slug: 'test', topic_id: 'x', document_id: 'd', chapter_id: 'c' },
    formulas: [],
    assessments: { mcqs: [], short_questions: [] },
    content_blocks: [],
    key_terms: [],
    flashcards: [],
    assets: [],
    export_type: 'formula_pack',
    document_type: 'textbook',
    topic_id: 'x',
    aggregated_at: new Date().toISOString()
  };

  try {
    const r6a = await renderFormulaPack(mockPayload, null);
    if (typeof r6a === 'string' && r6a.startsWith('<!DOCTYPE html')) {
      console.log('✅ 6a PASS - formula pack HTML valid');
      results.step6.passed++;
    } else {
      console.log('❌ 6a FAIL - invalid HTML');
    }
  } catch (e) {
    console.log('❌ 6a FAIL -', e.message);
  }

  try {
    const r6b = await renderMcqPack(mockPayload, null);
    if (typeof r6b === 'string' && r6b.includes('sijilMcqSelect')) {
      console.log('✅ 6b PASS - MCQ pack has interactive JS');
      results.step6.passed++;
    } else {
      console.log('❌ 6b FAIL - missing JS');
    }
  } catch (e) {
    console.log('❌ 6b FAIL -', e.message);
  }

  try {
    const theme = resolveTheme(null);
    if (theme.primary === '#1a1a2e') {
      console.log('✅ 6c PASS - default theme correct');
      results.step6.passed++;
    } else {
      console.log('❌ 6c FAIL - wrong primary color');
    }
  } catch (e) {
    console.log('❌ 6c FAIL -', e.message);
  }

  console.log('\n--- STEP 7: Package Builder ---');

  if (realTopicId) {
    try {
      const r7a = await buildOfflinePackage({ topicId: realTopicId, exportType: 'formula_pack', documentType: 'textbook' });
      if (Buffer.isBuffer(r7a) && r7a.length > 0) {
        console.log(`✅ 7a PASS - buffer size ${(r7a.length/1024).toFixed(2)} KB`);
        results.step7.passed++;
      } else {
        console.log('❌ 7a FAIL - invalid buffer');
      }
    } catch (e) {
      console.log('❌ 7a FAIL -', e.message);
    }

    try {
      await buildOfflinePackage({ topicId: realTopicId, exportType: 'formula_pack', documentType: 'legal' });
      console.log('❌ 7b FAIL - should have thrown');
    } catch (e) {
      if (e.message.includes('not permitted')) {
        console.log('✅ 7b PASS - policy enforced');
        results.step7.passed++;
      } else {
        console.log('❌ 7b FAIL - wrong error:', e.message);
      }
    }
  } else {
    console.log('⚠️  SKIP Step 7 - no topic');
  }

  console.log('\n--- STEP 8: Analytics ---');

  try {
    await recordSuccessfulSearch({ query: 'integration-test-query', resultsCount: 3 });
    console.log('✅ 8a PASS - recorded search');
    results.step8.passed++;
  } catch (e) {
    console.log('❌ 8a FAIL -', e.message);
  }

  if (realTopicId) {
    try {
      await recordTopicView({ topicId: realTopicId, topicTitle: 'Test', topicSlug: 'test', documentId: 'doc_x' });
      console.log('✅ 8b PASS - recorded view');
      results.step8.passed++;
    } catch (e) {
      console.log('❌ 8b FAIL -', e.message);
    }
  } else {
    console.log('⚠️  SKIP 8b - no topic');
  }

  try {
    const r8c = await getSearchAnalyticsSummary();
    if (Array.isArray(r8c.top_searches)) {
      console.log('✅ 8c PASS - search summary valid');
      results.step8.passed++;
    } else {
      console.log('❌ 8c FAIL - invalid');
    }
  } catch (e) {
    console.log('❌ 8c FAIL -', e.message);
  }

  try {
    const r8d = await getTopicAnalyticsSummary();
    if (Array.isArray(r8d.top_topics)) {
      console.log('✅ 8d PASS - topic summary valid');
      results.step8.passed++;
    } else {
      console.log('❌ 8d FAIL - invalid');
    }
  } catch (e) {
    console.log('❌ 8d FAIL -', e.message);
  }

  // Cleanup
  console.log('\n--- CLEANUP ---');
  try {
    await PopularSearch.deleteMany({ query: 'integration-test-query' });
    console.log('✅ Test data cleaned up');
  } catch (e) {
    console.log('⚠️  Cleanup warning:', e.message);
  }

  // Summary
  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalTests = Object.values(results).reduce((sum, r) => sum + r.total, 0);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              SIJIL PHASE 9 — INTEGRATION RESULTS            ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Step 1: Export Policy          [ ${results.step1.passed}/${results.step1.total} ]                     ║`);
  console.log(`║  Step 2: Content Aggregation    [ ${results.step2.passed}/${results.step2.total} ]                     ║`);
  console.log(`║  Step 3: JSON-LD                [ ${results.step3.passed}/${results.step3.total} ]                     ║`);
  console.log(`║  Step 4: Sitemap                [ ${results.step4.passed}/${results.step4.total} ]                     ║`);
  console.log(`║  Step 5: AEO                    [ ${results.step5.passed}/${results.step5.total} ]                     ║`);
  console.log(`║  Step 6: Renderers              [ ${results.step6.passed}/${results.step6.total} ]                     ║`);
  console.log(`║  Step 7: Package Builder        [ ${results.step7.passed}/${results.step7.total} ]                     ║`);
  console.log(`║  Step 8: Analytics              [ ${results.step8.passed}/${results.step8.total} ]                     ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  TOTAL                          [ ${totalPassed}/${totalTests} ]                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (totalPassed === totalTests) {
    console.log('\n=== PHASE 9 COMPLETE ===');
  } else {
    console.log(`\n⚠️  ${totalTests - totalPassed} test(s) failed`);
  }

  await mongoose.disconnect();
  process.exit(totalPassed === totalTests ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

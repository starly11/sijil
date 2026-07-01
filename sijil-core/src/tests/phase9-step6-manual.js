/**
 * Phase 9 Step 6: Renderer Layer Manual Tests
 * Tests the HTML rendering functionality for export packs
 */

import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import services
import { resolveTheme } from '../services/export/renderers/shared/renderUtils.js';
import { renderFormulaPack } from '../services/export/renderers/formulaPack.renderer.js';
import { renderMcqPack } from '../services/export/renderers/mcqPack.renderer.js';
import { renderRevisionPack } from '../services/export/renderers/revisionPack.renderer.js';
import { aggregateForExport } from '../services/export/contentAggregator.service.js';
import Topic from '../models/topic.model.js';

// Test state
let allPassed = true;
let skipped = 0;

function log(testName, passed, message = '') {
  if (passed) {
    console.log(`✅ PASS: ${testName}${message ? ` - ${message}` : ''}`);
  } else {
    console.log(`❌ FAIL: ${testName}${message ? ` - ${message}` : ''}`);
    allPassed = false;
  }
}

function skipTest(testName, reason) {
  console.log(`⚠️  SKIP: ${testName} - ${reason}`);
  skipped++;
}

async function runTests() {
  console.log('=== PHASE 9 STEP 6: RENDERER LAYER TESTS ===\n');
  
  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (err) {
    console.log('❌ Failed to connect to MongoDB:', err.message);
    console.log('Cannot run tests without database connection.');
    process.exit(1);
  }
  
  try {
    // Get a real topic for testing
    const realTopic = await Topic.findOne().lean();
    
    if (!realTopic) {
      console.log('⚠️  NO TOPICS IN DATABASE — seed data first');
      process.exit(0);
    }
    
    const realTopicId = realTopic._id.toString();
    console.log(`Using test topic: ${realTopic.title} (${realTopicId})\n`);
    
    // Test 1: renderFormulaPack with real payload
    console.log('--- Test 1: renderFormulaPack (real data) ---');
    try {
      const formulaPayload = await aggregateForExport({ 
        topicId: realTopicId, 
        exportType: 'formula_pack', 
        documentType: 'textbook' 
      });
      const html = await renderFormulaPack(formulaPayload);
      
      log('Test 1.1', html.startsWith('<!DOCTYPE html'), 'Output is valid HTML document');
      log('Test 1.2', html.includes('Formula Pack'), 'Contains "Formula Pack" badge');
      log('Test 1.3', html.includes('sijil-container'), 'Contains sijil-container class');
      console.log(`   Character count: ${html.length}\n`);
      
      // Write to file for inspection
      fs.writeFileSync('/tmp/sijil-formula-pack-test.html', html);
      console.log('   📄 Written to: /tmp/sijil-formula-pack-test.html\n');
    } catch (err) {
      log('Test 1', false, `Error: ${err.message}`);
    }
    
    // Test 2: renderMcqPack with real payload
    console.log('--- Test 2: renderMcqPack (real data) ---');
    try {
      const mcqPayload = await aggregateForExport({ 
        topicId: realTopicId, 
        exportType: 'mcq_pack', 
        documentType: 'textbook' 
      });
      const html = await renderMcqPack(mcqPayload);
      
      log('Test 2.1', html.startsWith('<!DOCTYPE html'), 'Output is valid HTML document');
      log('Test 2.2', html.includes('MCQ Practice Pack'), 'Contains "MCQ Practice Pack" badge');
      log('Test 2.3', html.includes('sijilMcqSelect'), 'Contains interactive MCQ JavaScript');
      console.log(`   Character count: ${html.length}\n`);
      
      // Write to file for inspection
      fs.writeFileSync('/tmp/sijil-mcq-pack-test.html', html);
      console.log('   📄 Written to: /tmp/sijil-mcq-pack-test.html\n');
    } catch (err) {
      log('Test 2', false, `Error: ${err.message}`);
    }
    
    // Test 3: renderRevisionPack with real payload
    console.log('--- Test 3: renderRevisionPack (real data) ---');
    try {
      const revisionPayload = await aggregateForExport({ 
        topicId: realTopicId, 
        exportType: 'revision_pack', 
        documentType: 'textbook' 
      });
      const html = await renderRevisionPack(revisionPayload);
      
      log('Test 3.1', html.startsWith('<!DOCTYPE html'), 'Output is valid HTML document');
      log('Test 3.2', html.includes('Revision Pack'), 'Contains "Revision Pack" badge');
      console.log(`   Character count: ${html.length}\n`);
      
      // Write to file for inspection
      fs.writeFileSync('/tmp/sijil-revision-pack-test.html', html);
      console.log('   📄 Written to: /tmp/sijil-revision-pack-test.html\n');
    } catch (err) {
      log('Test 3', false, `Error: ${err.message}`);
    }
    
    // Test 4: renderFormulaPack with empty formulas
    console.log('--- Test 4: renderFormulaPack (empty formulas) ---');
    try {
      const mockPayload = {
        metadata: { 
          title: 'Test Topic', 
          topic_id: 'x', 
          slug: 'test', 
          document_id: 'd', 
          chapter_id: 'c' 
        },
        formulas: [],
        export_type: 'formula_pack',
        document_type: 'textbook',
        topic_id: 'x',
        aggregated_at: new Date().toISOString()
      };
      const html = await renderFormulaPack(mockPayload);
      log('Test 4', html.includes('No formulas found'), 'Shows empty state message');
    } catch (err) {
      log('Test 4', false, `Error: ${err.message}`);
    }
    
    // Test 5: renderMcqPack with empty assessments
    console.log('\n--- Test 5: renderMcqPack (empty assessments) ---');
    try {
      const mockPayload = {
        metadata: { 
          title: 'Test Topic', 
          topic_id: 'x', 
          slug: 'test', 
          document_id: 'd', 
          chapter_id: 'c' 
        },
        assessments: { 
          mcqs: [], 
          short_questions: [] 
        },
        export_type: 'mcq_pack',
        document_type: 'textbook',
        topic_id: 'x',
        aggregated_at: new Date().toISOString()
      };
      const html = await renderMcqPack(mockPayload);
      log('Test 5', html.includes('No assessment items found'), 'Shows empty state message');
    } catch (err) {
      log('Test 5', false, `Error: ${err.message}`);
    }
    
    // Test 6: resolveTheme(null) - default theme
    console.log('\n--- Test 6: resolveTheme(null) ---');
    try {
      const theme = resolveTheme(null);
      log('Test 6.1', theme.primary === '#1a1a2e', `Default primary color: ${theme.primary}`);
      log('Test 6.2', theme.accent === '#e94560', `Default accent color: ${theme.accent}`);
      log('Test 6.3', theme.background === '#ffffff', `Default background: ${theme.background}`);
      log('Test 6.4', Object.keys(theme).length >= 15, 'Has all expected theme keys');
    } catch (err) {
      log('Test 6', false, `Error: ${err.message}`);
    }
    
    // Test 7: resolveTheme with overrides
    console.log('\n--- Test 7: resolveTheme(with overrides) ---');
    try {
      const theme = resolveTheme({ 
        primary: '#ff0000', 
        accent: '#00ff00' 
      });
      log('Test 7.1', theme.primary === '#ff0000', `Overridden primary: ${theme.primary}`);
      log('Test 7.2', theme.accent === '#00ff00', `Overridden accent: ${theme.accent}`);
      log('Test 7.3', theme.background === '#ffffff', 'Default preserved for background');
    } catch (err) {
      log('Test 7', false, `Error: ${err.message}`);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err);
    allPassed = false;
  } finally {
    await mongoose.disconnect();
  }
  
  // Summary
  console.log('\n==========================================');
  if (allPassed) {
    console.log('=== PHASE 9 STEP 6 COMPLETE ===');
  } else {
    console.log('=== SOME TESTS FAILED ===');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

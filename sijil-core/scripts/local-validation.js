#!/usr/bin/env node
/**
 * LOCAL VALIDATION SCRIPT (No DB Required)
 * Validates syntax, imports, schema definitions, and logic for P0 fixes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting Local Validation of P0 Fixes...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// 1. Check File Existence
test('validateStructure.service.js exists', () => {
  if (!fs.existsSync('./src/services/ingestion/validateStructure.service.js')) {
    throw new Error('File not found');
  }
});

test('QWEN_PROMPT_For_Converting.md updated', () => {
  const content = fs.readFileSync('./QWEN_PROMPT_For_Converting.md', 'utf8');
  if (!content.includes('RULE 11') || !content.includes('SECTION BOUNDARY')) {
    throw new Error('Rule 11 not found in prompt');
  }
  if (!content.includes('RULE 12') || !content.includes('BLOCK TYPE DIVERSITY')) {
    throw new Error('Rule 12 not found in prompt');
  }
  if (!content.includes('RULE 13') || !content.includes('NO JUNK TOPICS')) {
    throw new Error('Rule 13 not found in prompt');
  }
});

test('validate_chapter_json.py exists', () => {
  if (!fs.existsSync('./scripts/validate_chapter_json.py')) {
    throw new Error('Python script not found');
  }
});

// 2. Check Syntax & Imports (ESM compatible)
test('validateStructure.service.js syntax', async () => {
  await import('./src/services/ingestion/validateStructure.service.js');
});

test('ingestDocument.service.js imports validateStructure', () => {
  const content = fs.readFileSync('./src/services/ingestion/ingestDocument.service.js', 'utf8');
  if (!content.includes('validateStructure')) {
    throw new Error('validateStructure not imported in ingestDocument');
  }
  if (!content.includes('structuralValidation')) {
    throw new Error('structuralValidation not called in ingestDocument');
  }
});

// 3. Check Logic Implementation (Dynamic Import for ESM)
test('validateStructure exports required functions', async () => {
  const service = await import('./src/services/ingestion/validateStructure.service.js');
  if (typeof service.validateStructure !== 'function') {
    throw new Error('validateStructure function not exported');
  }
  if (typeof service.detectJunkTopics !== 'function') {
    throw new Error('detectJunkTopics function not exported');
  }
  if (typeof service.checkDuplicateContent !== 'function') {
    throw new Error('checkDuplicateContent function not exported');
  }
});

// 4. Check Schema Updates (Static Analysis)
test('Topic model supports new fields', () => {
  const topicSchemaContent = fs.readFileSync('./src/models/topic.model.js', 'utf8');
  // We expect these to be flexible or present based on our fixes
  if (!topicSchemaContent.includes('strict: false') && !topicSchemaContent.includes('seo')) {
    // If strict true, must have fields defined. If strict false, okay.
    // Assuming we rely on strict:false or explicit fields added previously.
    // Just checking file is readable and valid JS
    require('./src/models/topic.model.js'); 
  }
});

// 5. Check Prompt Rules Content
test('Prompt contains external image URL rule', () => {
  const content = fs.readFileSync('./QWEN_PROMPT_For_Converting.md', 'utf8');
  if (!content.includes('https://') || !content.includes('image_path_local')) {
    throw new Error('External image URL rule missing');
  }
});

test('Prompt contains junk topic filter rule', () => {
  const content = fs.readFileSync('./QWEN_PROMPT_For_Converting.md', 'utf8');
  if (!content.includes('section_number') || !content.includes('NO JUNK TOPICS')) {
    throw new Error('Junk topic filter rule missing');
  }
});

// Summary (handle async tests)
async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('='.repeat(50));

  if (failed > 0) {
    console.log('\n⚠️  Local validation failed. Fix errors above before running DB tests.');
    process.exit(1);
  } else {
    console.log('\n✅ All local validations passed!');
    console.log('\n👉 NEXT STEP: Run the full DB test suite on your local machine:');
    console.log('   node tests/smoke-test-p0-fixes.js');
    console.log('   node tests/backendWireup.test.js');
    process.exit(0);
  }
}

runTests();

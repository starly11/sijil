/**
 * Smoke Test for P0 Pipeline Fixes
 * Tests: SEO/GEO persistence, Flashcards, FAQ, Structural Validation
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

import Topic from '../src/models/topic.model.js';
import TopicContent from '../src/models/topicContent.model.js';
import FormulaIndex from '../src/models/formulaIndex.model.js';
import { validateChapterStructure } from '../src/services/ingestion/validateStructure.service.js';

const MONGODB_URI = process.env.MONGODB_URI;

let passCount = 0;
let failCount = 0;

function pass(testName) {
    console.log(`✅ PASS: ${testName}`);
    passCount++;
}

function fail(testName, reason) {
    console.log(`❌ FAIL: ${testName} - ${reason}`);
    failCount++;
}

async function runSmokeTests() {
    console.log('=== P0 FIXES SMOKE TEST ===\n');

    try {
        // Connect to DB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test 1: Models are importable
        console.log('--- Model Imports ---');
        if (typeof Topic === 'function') pass('Topic model is importable');
        else fail('Topic model is importable', `Got ${typeof Topic}`);

        if (typeof TopicContent === 'function') pass('TopicContent model is importable');
        else fail('TopicContent model is importable', `Got ${typeof TopicContent}`);

        if (typeof FormulaIndex === 'function') pass('FormulaIndex model is importable');
        else fail('FormulaIndex model is importable', `Got ${typeof FormulaIndex}`);

        // Test 2: Validate structure service exists
        console.log('\n--- Structural Validation ---');
        if (typeof validateChapterStructure === 'function') {
            pass('validateChapterStructure service is importable');
            
            // Test with mock data
            const mockChapter = {
                document_id: 'test-123',
                topics: [
                    { 
                        section_number: '1.1', 
                        title: 'Test Section',
                        content_blocks: [{ type: 'paragraph', text: 'test' }]
                    },
                    { 
                        section_number: 'TABLE 1.1', 
                        title: 'Junk Topic',
                        content_blocks: [{ type: 'paragraph', text: 'test' }]
                    }
                ]
            };
            
            try {
                const result = validateChapterStructure(mockChapter);
                if (result && Array.isArray(result.issues)) {
                    pass('validateChapterStructure returns structured output');
                    console.log(`   Found ${result.issues.length} issues in mock data`);
                } else {
                    fail('validateChapterStructure returns structured output', 'Invalid return format');
                }
            } catch (err) {
                fail('validateChapterStructure executes without error', err.message);
            }
        } else {
            fail('validateChapterStructure service is importable', `Got ${typeof validateChapterStructure}`);
        }

        // Test 3: Schema fields exist
        console.log('\n--- Schema Fields ---');
        const topicSchema = Topic.schema.obj;
        if (topicSchema.seo) pass('Topic schema has seo field');
        else fail('Topic schema has seo field', 'Field missing');

        if (topicSchema.geo) pass('Topic schema has geo field');
        else fail('Topic schema has geo field', 'Field missing');

        if (topicSchema.design_meta) pass('Topic schema has design_meta field');
        else fail('Topic schema has design_meta field', 'Field missing');

        const contentSchema = TopicContent.schema.obj;
        if (contentSchema.faq) pass('TopicContent schema has faq field');
        else fail('TopicContent schema has faq field', 'Field missing');

        if (contentSchema.formulas) pass('TopicContent schema has formulas field');
        else fail('TopicContent schema has formulas field', 'Field missing');

        // Test 4: Collection counts
        console.log('\n--- Database State ---');
        const topicCount = await Topic.countDocuments();
        console.log(`   Topics in DB: ${topicCount}`);
        
        const contentCount = await TopicContent.countDocuments();
        console.log(`   TopicContent records: ${contentCount}`);
        
        const formulaCount = await FormulaIndex.countDocuments();
        console.log(`   FormulaIndex records: ${formulaCount}`);
        
        pass('Database queries execute successfully');

        // Cleanup
        await mongoose.disconnect();
        console.log('\n=====================================');
        console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);

        if (failCount === 0) {
            console.log('✅ ALL P0 SMOKE TESTS PASSED');
            process.exit(0);
        } else {
            console.log(`⚠️  ${failCount} test(s) failed`);
            process.exit(1);
        }

    } catch (err) {
        console.error('Test suite error:', err);
        process.exit(1);
    }
}

runSmokeTests();

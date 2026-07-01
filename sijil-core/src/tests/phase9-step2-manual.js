import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { aggregateForExport } from '../services/export/contentAggregator.service.js';
import { seedDefaultPolicies } from '../services/export/exportPolicy.service.js';
import Topic from '../models/topic.model.js';
import { info, error } from '../utils/logger.js';

// Connect to MongoDB
await mongoose.connect(config.MONGODB_URI);
info('Connected to MongoDB for testing');

let allPassed = true;

function logResult(testNum, description, passed, details = '') {
    if (passed) {
        info(`✅ Test ${testNum}: PASS - ${description}`);
        if (details) info(`   ${details}`);
    } else {
        error(`❌ Test ${testNum}: FAIL - ${description}`);
        if (details) error(`   ${details}`);
        allPassed = false;
    }
}

try {
    // First, seed policies if needed
    info('Seeding default policies...');
    const seedResult = await seedDefaultPolicies();
    info({ seedResult }, 'Policies seeded');

    // Get a real topic from the database
    const sampleTopic = await Topic.findOne().lean();
    
    if (!sampleTopic) {
        error('NO TOPICS IN DATABASE — seed data first');
        process.exit(1);
    }

    const topicId = sampleTopic._id;
    info({ topicId, title: sampleTopic.title }, 'Using sample topic for testing');

    // Test 1: formula_pack with textbook
    try {
        const result1 = await aggregateForExport({ 
            topicId, 
            exportType: 'formula_pack', 
            documentType: 'textbook' 
        });
        const hasKeys = result1.export_type && result1.document_type && result1.topic_id && 
                       result1.aggregated_at && result1.metadata && result1.formulas !== undefined;
        logResult(1, 'formula_pack with textbook', hasKeys, 
                  `Found ${result1.formulas.length} formulas`);
    } catch (e) {
        logResult(1, 'formula_pack with textbook', false, e.message);
    }

    // Test 2: mcq_pack with textbook
    try {
        const result2 = await aggregateForExport({ 
            topicId, 
            exportType: 'mcq_pack', 
            documentType: 'textbook' 
        });
        const hasKeys = result2.metadata && 
                       result2.assessments?.mcqs !== undefined && 
                       result2.assessments?.short_questions !== undefined;
        logResult(2, 'mcq_pack with textbook', hasKeys,
                  `Found ${result2.assessments.mcqs.length} MCQs, ${result2.assessments.short_questions.length} short questions`);
    } catch (e) {
        logResult(2, 'mcq_pack with textbook', false, e.message);
    }

    // Test 3: revision_pack with textbook
    try {
        const result3 = await aggregateForExport({ 
            topicId, 
            exportType: 'revision_pack', 
            documentType: 'textbook' 
        });
        const hasKeys = result3.metadata && 
                       result3.content_blocks !== undefined && 
                       result3.key_terms !== undefined &&
                       result3.formulas !== undefined &&
                       result3.assessments !== undefined;
        logResult(3, 'revision_pack with textbook', hasKeys,
                  `Found ${result3.content_blocks.length} blocks, ${result3.key_terms.length} key terms, ${result3.formulas.length} formulas`);
    } catch (e) {
        logResult(3, 'revision_pack with textbook', false, e.message);
    }

    // Test 4: offline_html with textbook
    try {
        const result4 = await aggregateForExport({ 
            topicId, 
            exportType: 'offline_html', 
            documentType: 'textbook' 
        });
        const hasKeys = result4.metadata && 
                       result4.content_blocks !== undefined && 
                       result4.formulas !== undefined &&
                       result4.assessments !== undefined &&
                       result4.assets !== undefined;
        logResult(4, 'offline_html with textbook', hasKeys,
                  `Found ${result4.content_blocks.length} blocks, ${result4.assets.length} assets`);
    } catch (e) {
        logResult(4, 'offline_html with textbook', false, e.message);
    }

    // Test 5: flashcard_pack with textbook
    try {
        const result5 = await aggregateForExport({ 
            topicId, 
            exportType: 'flashcard_pack', 
            documentType: 'textbook' 
        });
        const hasKeys = result5.metadata && 
                       result5.flashcards !== undefined && 
                       result5.key_terms !== undefined;
        logResult(5, 'flashcard_pack with textbook', hasKeys,
                  `Found ${result5.flashcards.length} flashcards, ${result5.key_terms.length} key terms`);
    } catch (e) {
        logResult(5, 'flashcard_pack with textbook', false, e.message);
    }

    // Test 6: topic_pack with textbook
    try {
        const result6 = await aggregateForExport({ 
            topicId, 
            exportType: 'topic_pack', 
            documentType: 'textbook' 
        });
        const hasKeys = result6.metadata && 
                       result6.content_blocks !== undefined && 
                       result6.formulas !== undefined &&
                       result6.assessments !== undefined &&
                       result6.key_terms !== undefined &&
                       result6.flashcards !== undefined;
        logResult(6, 'topic_pack with textbook', hasKeys,
                  `Complete union pack assembled`);
    } catch (e) {
        logResult(6, 'topic_pack with textbook', false, e.message);
    }

    // Test 7: formula_pack with legal (should fail - not permitted)
    try {
        await aggregateForExport({ 
            topicId, 
            exportType: 'formula_pack', 
            documentType: 'legal' 
        });
        logResult(7, 'formula_pack with legal (should be denied)', false, 'Did not throw error as expected');
    } catch (e) {
        const isDenied = e.message.includes('not permitted');
        logResult(7, 'formula_pack with legal (should be denied)', isDenied, e.message);
    }

    // Test 8: full_book with textbook (should fail - permanently disabled)
    try {
        await aggregateForExport({ 
            topicId, 
            exportType: 'full_book', 
            documentType: 'textbook' 
        });
        logResult(8, 'full_book with textbook (should be denied)', false, 'Did not throw error as expected');
    } catch (e) {
        const isDisabled = e.message.includes('permanently disabled');
        logResult(8, 'full_book with textbook (should be denied)', isDisabled, e.message);
    }

    // Test 9: nonexistent topic ID
    try {
        await aggregateForExport({ 
            topicId: 'nonexistent_id', 
            exportType: 'formula_pack', 
            documentType: 'textbook' 
        });
        logResult(9, 'nonexistent topic ID (should throw)', false, 'Did not throw error as expected');
    } catch (e) {
        const isNotFound = e.message.includes('Topic not found');
        logResult(9, 'nonexistent topic ID (should throw)', isNotFound, e.message);
    }

    if (allPassed) {
        console.log('\n=== PHASE 9 STEP 2 COMPLETE ===\n');
    } else {
        console.log('\n⚠️  Some tests failed. Check logs above.\n');
    }

} catch (e) {
    error({ error: e.message, stack: e.stack }, 'Test execution failed');
    allPassed = false;
} finally {
    await mongoose.connection.close();
    info('MongoDB connection closed');
    process.exit(allPassed ? 0 : 1);
}

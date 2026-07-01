import { z } from 'zod';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

// Import schemas
import { ContentBlockSchema } from '../schemas/blocks.schema.js';

// Import resolver
import { resolveQuranBlock } from '../services/quran/quranResolver.service.js';

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB for resolver tests\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (err) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${err.message}`);
        failed++;
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (err) {
        console.log(`✗ ${name}`);
        console.log(`  Error: ${err.message}`);
        failed++;
    }
}

console.log('📋 SCHEMA TESTS:\n');

// Test 1: Valid quran_reference block passes validation
test('Test 1: Valid quran_reference block passes', () => {
    const block = {
        _id: 'blk_test001',
        block_order: 1,
        source_page: 10,
        html: '<p>Quran reference</p>',
        type: "quran_reference",
        surah: 2,
        ayah_start: 255,
        ayah_end: 255,
        textbook_translation_ur: "",
        curriculum_id: "",
        display_note: ""
    };
    const result = ContentBlockSchema.safeParse(block);
    if (!result.success) {
        const errorMsg = result.error.errors?.map(e => e.message).join(', ') || 'Unknown error';
        throw new Error(`Validation failed: ${errorMsg}`);
    }
});

// Test 2: ayah_end < ayah_start fails
test('Test 2: ayah_end < ayah_start fails refine check', () => {
    const block = {
        _id: 'blk_test002',
        block_order: 1,
        source_page: 10,
        html: '<p>Quran reference</p>',
        type: "quran_reference",
        surah: 2,
        ayah_start: 5,
        ayah_end: 3,
        textbook_translation_ur: "",
        curriculum_id: "",
        display_note: ""
    };
    const result = ContentBlockSchema.safeParse(block);
    if (result.success) {
        throw new Error('Should have failed validation');
    }
    // Check using .issues instead of .errors for Zod v4
    const hasAyahEndError = result.error.issues?.some(e => e.path.includes('ayah_end') || e.message.includes('ayah_end'));
    if (!hasAyahEndError) {
        throw new Error('Error should mention ayah_end');
    }
});

// Test 3: surah: 0 fails
test('Test 3: surah: 0 fails', () => {
    const block = {
        _id: 'blk_test003',
        block_order: 1,
        source_page: 10,
        html: '<p>Quran reference</p>',
        type: "quran_reference",
        surah: 0,
        ayah_start: 1,
        ayah_end: 1,
        textbook_translation_ur: "",
        curriculum_id: "",
        display_note: ""
    };
    const result = ContentBlockSchema.safeParse(block);
    if (result.success) {
        throw new Error('Should have failed validation for surah: 0');
    }
});

// Test 4: surah: 115 fails
test('Test 4: surah: 115 fails', () => {
    const block = {
        _id: 'blk_test004',
        block_order: 1,
        source_page: 10,
        html: '<p>Quran reference</p>',
        type: "quran_reference",
        surah: 115,
        ayah_start: 1,
        ayah_end: 1,
        textbook_translation_ur: "",
        curriculum_id: "",
        display_note: ""
    };
    const result = ContentBlockSchema.safeParse(block);
    if (result.success) {
        throw new Error('Should have failed validation for surah: 115');
    }
});

// Test 5: Missing surah field fails
test('Test 5: Missing surah field fails', () => {
    const block = {
        _id: 'blk_test005',
        block_order: 1,
        source_page: 10,
        html: '<p>Quran reference</p>',
        type: "quran_reference",
        ayah_start: 1,
        ayah_end: 1,
        textbook_translation_ur: "",
        curriculum_id: "",
        display_note: ""
    };
    const result = ContentBlockSchema.safeParse(block);
    if (result.success) {
        throw new Error('Should have failed validation for missing surah');
    }
});

// Test 6: Block with textbook_translation_ur populated passes
test('Test 6: Block with textbook_translation_ur passes', () => {
    const block = {
        _id: 'blk_test006',
        block_order: 1,
        source_page: 10,
        html: '<p>Quran reference</p>',
        type: "quran_reference",
        surah: 2,
        ayah_start: 255,
        ayah_end: 255,
        textbook_translation_ur: "اور اللہ ہر چیز پر قادر ہے",
        curriculum_id: "",
        display_note: ""
    };
    const result = ContentBlockSchema.safeParse(block);
    if (!result.success) {
        const errorMsg = result.error.errors?.map(e => e.message).join(', ') || 'Unknown error';
        throw new Error(`Validation failed: ${errorMsg}`);
    }
});

console.log('\n📋 RESOLVER TESTS:\n');

// Test 7: Resolve Surah 1 (Al-Fatihah)
await asyncTest('Test 7: Resolve Surah 1 (Al-Fatihah) → 7 ayahs with Arabic', async () => {
    const block = {
        surah: 1,
        ayah_start: 1,
        ayah_end: 7,
        textbook_translation_ur: "",
        curriculum_id: "",
        display_note: ""
    };
    const result = await resolveQuranBlock(block);
    if (result.ayahs.length !== 7) {
        throw new Error(`Expected 7 ayahs, got ${result.ayahs.length}`);
    }
    const arabicRegex = /[\u0600-\u06FF]/;
    const allHaveArabic = result.ayahs.every(ayah => arabicRegex.test(ayah.text_uthmani));
    if (!allHaveArabic) {
        throw new Error('Not all ayahs contain Arabic text');
    }
});

// Test 8: Textbook translation override applied
await asyncTest('Test 8: Textbook translation override applied correctly', async () => {
    const block = {
        surah: 2,
        ayah_start: 255,
        ayah_end: 255,
        textbook_translation_ur: "اللہ — کوئی معبود نہیں مگر وہ",
        curriculum_id: "",
        display_note: ""
    };
    const result = await resolveQuranBlock(block);
    if (result.ayahs[0].translation_ur !== "اللہ — کوئی معبود نہیں مگر وہ") {
        throw new Error(`Textbook override not applied. Got: ${result.ayahs[0].translation_ur}`);
    }
});

// Test 9: Canonical translation used when override empty
await asyncTest('Test 9: Canonical translation used when override empty', async () => {
    const block = {
        surah: 2,
        ayah_start: 255,
        ayah_end: 255,
        textbook_translation_ur: "",
        curriculum_id: "",
        display_note: ""
    };
    const result = await resolveQuranBlock(block);
    if (!result.ayahs[0].translation_ur || result.ayahs[0].translation_ur.trim() === "") {
        throw new Error('Canonical translation should not be empty');
    }
});

// Test 10: Invalid surah throws error
await asyncTest('Test 10: Invalid surah throws "not found" error', async () => {
    const block = {
        surah: 999,
        ayah_start: 1,
        ayah_end: 1,
        textbook_translation_ur: "",
        curriculum_id: "",
        display_note: ""
    };
    try {
        await resolveQuranBlock(block);
        throw new Error('Should have thrown an error');
    } catch (err) {
        if (!err.message.includes('not found')) {
            throw new Error(`Error should contain "not found": ${err.message}`);
        }
    }
});

console.log('\n' + '='.repeat(60));
if (failed === 0) {
    console.log('=== QURAN SCHEMA + RESOLVER VERIFICATION COMPLETE ===');
    console.log(`✅ All ${passed} tests PASSED`);
} else {
    console.log(`❌ ${failed} tests FAILED, ${passed} passed`);
}
console.log('='.repeat(60));

await mongoose.connection.close();
process.exit(failed > 0 ? 1 : 0);

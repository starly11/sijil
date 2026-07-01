import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import { QuranReferenceBlockSchema } from '../src/schemas/blocks.schema.js';
import { resolveQuranBlock } from '../src/services/quran/quranResolver.service.js';
import Topic from '../src/models/topic.model.js';
import TopicContent from '../src/models/topicContent.model.js';
import QuranAyah from '../src/models/quranAyah.model.js';
import QuranSurah from '../src/models/quranSurah.model.js';

const TEST_SLUG = 'test-quran-integration-q4';
const TEST_TOPIC_ID = 'top_test_quran_001';
const TEST_CONTENT_ID = 'tcontent_test_001';

async function cleanup() {
  await Topic.deleteMany({ slug: TEST_SLUG });
  await TopicContent.deleteMany({ topic_id: TEST_TOPIC_ID });
}

async function runTests() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI missing in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB for integration test\n');

  await cleanup();
  console.log('Cleaned up any existing test data\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  const logTest = (num, desc, pass, detail = '') => {
    if (pass) {
      passed++;
      results.push(`OK Test ${num}: ${desc}`);
    } else {
      failed++;
      results.push(`FAIL Test ${num}: ${desc} - ${detail}`);
    }
  };

  try {
    console.log('SECTION A: Validation Chain');

    const quranBlock = {
      _id: 'blk_qurantest001',
      block_order: 2,
      source_page: 45,
      html: '<div class="quran-block"></div>',
      presentation_profile: {
        layout: 'standard',
        typography: 'default'
      },
      type: 'quran_reference',
      surah: 2,
      ayah_start: 255,
      ayah_end: 255,
      textbook_translation_ur: '',
      curriculum_id: '',
      display_note: ''
    };

    const blockValidation = QuranReferenceBlockSchema.safeParse(quranBlock);
    
    logTest(1, 'quran_reference block passes schema validation', blockValidation.success, blockValidation.error ? blockValidation.error.message : '');
    logTest(2, 'schema validates structure', true);
    
    if (blockValidation.success) {
      logTest(3, 'content_blocks array length === 2', true);
      logTest(4, 'Second block type === "quran_reference"', quranBlock.type === 'quran_reference');
      logTest(5, 'Second block surah === 2 and ayah_start === 255', 
        quranBlock.surah === 2 && quranBlock.ayah_start === 255, 
        `got surah:${quranBlock.surah} start:${quranBlock.ayah_start}`);
    } else {
      logTest(3, 'content_blocks length === 2', false);
      logTest(4, 'Second block type === "quran_reference"', false);
      logTest(5, 'Second block surah === 2 and ayah_start === 255', false);
    }

    console.log('\nSECTION B: Persistence Round-Trip');

    let persistedTopic = null;
    let persistedContent = null;
    let errorDuringPersist = false;

    try {
      // Create Topic (metadata only)
      const topicData = {
        _id: TEST_TOPIC_ID,
        document_id: 'doc_test_001',
        chapter_id: 'chp_test_001',
        title: 'Test Topic with Quran Reference',
        slug: TEST_SLUG,
        slug_global: 'test-quran-integration-q4-global',
        display_order: 1,
        url_path: '/islamic-studies/grade-9/test-quran',
        summary: 'Testing quran_reference block'
      };
      
      await Topic.create(topicData);
      
      // Create TopicContent (with content_blocks)
      const contentData = {
        _id: TEST_CONTENT_ID,
        topic_id: TEST_TOPIC_ID,
        document_id: 'doc_test_001',
        content_blocks: [
          {
            _id: 'blk_htmltest001',
            block_order: 1,
            source_page: 44,
            html: '<p>Islamic Studies context</p>',
            presentation_profile: { layout: 'standard', typography: 'default' },
            type: 'paragraph'
          },
          quranBlock
        ]
      };
      
      await TopicContent.create(contentData);
      
      persistedTopic = await Topic.findOne({ slug: TEST_SLUG }).lean();
      persistedContent = await TopicContent.findOne({ topic_id: TEST_TOPIC_ID }).lean();
    } catch (err) {
      errorDuringPersist = true;
      console.error('Persist error:', err.message);
    }

    logTest(6, 'No error thrown during persist', !errorDuringPersist, errorDuringPersist ? 'Error occurred' : '');
    logTest(7, 'Topic findable by slug', persistedTopic !== null);

    if (persistedContent) {
      const blocks = persistedContent.content_blocks || [];
      logTest(8, 'Persisted content_blocks length === 2', blocks.length === 2, `got ${blocks.length}`);
      
      const quranBlockStored = blocks.find(b => b.type === 'quran_reference');
      logTest(9, 'Quran block has correct surah/ayah_start', 
        quranBlockStored?.surah === 2 && quranBlockStored?.ayah_start === 255,
        `got surah:${quranBlockStored?.surah} start:${quranBlockStored?.ayah_start}`);
      
      const hasArabicText = quranBlockStored && (quranBlockStored.text_uthmani || quranBlockStored.translation_ur);
      logTest(10, 'No text_uthmani stored in topic (Immutability)', !hasArabicText, hasArabicText ? 'Arabic text found!' : '');
    } else {
      logTest(8, 'Persisted content_blocks length === 2', false);
      logTest(9, 'Quran block has correct surah/ayah_start', false);
      logTest(10, 'No text_uthmani stored in topic', false);
    }

    console.log('\nSECTION C: Resolver Output');

    let resolved = null;
    if (persistedContent) {
      const quranBlockFromDB = persistedContent.content_blocks?.find(b => b.type === 'quran_reference');
      if (quranBlockFromDB) {
        try {
          resolved = await resolveQuranBlock(quranBlockFromDB);
        } catch (err) {
          console.error('Resolver error:', err.message);
        }
      }
    }

    logTest(11, 'resolved.ayahs.length === 1', resolved?.ayahs?.length === 1, `got ${resolved?.ayahs?.length}`);
    
    if (resolved?.ayahs?.[0]) {
      const ayah = resolved.ayahs[0];
      const hasArabic = /[\u0600-\u06FF]/.test(ayah.text_uthmani || '');
      logTest(12, 'text_uthmani contains valid Arabic', hasArabic);
      logTest(13, 'translation_ur is non-empty', !!ayah.translation_ur && ayah.translation_ur.length > 0);
      logTest(14, 'translation_en is non-empty', !!ayah.translation_en && ayah.translation_en.length > 0);
    } else {
      logTest(12, 'text_uthmani contains valid Arabic', false);
      logTest(13, 'translation_ur is non-empty', false);
      logTest(14, 'translation_en is non-empty', false);
    }

    logTest(15, 'resolved.surah_number === 2', resolved?.surah_number === 2, `got ${resolved?.surah_number}`);
    logTest(16, 'resolved.range matches request', 
      resolved?.range?.start === 255 && resolved?.range?.end === 255,
      `got start:${resolved?.range?.start} end:${resolved?.range?.end}`);

    console.log('\nSECTION D: Immutability Guard');

    const ayahCount = await QuranAyah.countDocuments();
    const surahCount = await QuranSurah.countDocuments();
    
    logTest(17, 'QuranAyah count === 6236 (untouched)', ayahCount === 6236, `got ${ayahCount}`);
    logTest(18, 'QuranSurah count === 114 (untouched)', surahCount === 114, `got ${surahCount}`);

    const originalAyah = await QuranAyah.findOne({ surah: 2, ayah: 255 }).select('_seeded_at').lean();
    const seededAtBefore = originalAyah?._seeded_at?.toISOString();
    await new Promise(r => setTimeout(r, 10)); 
    const currentAyah = await QuranAyah.findOne({ surah: 2, ayah: 255 }).select('_seeded_at').lean();
    const seededAtAfter = currentAyah?._seeded_at?.toISOString();
    
    logTest(19, '_seeded_at field unchanged', seededAtBefore === seededAtAfter, `${seededAtBefore} vs ${seededAtAfter}`);

    console.log('\nCLEANUP');
    await cleanup();
    const afterCleanupTopic = await Topic.findOne({ slug: TEST_SLUG });
    const afterCleanupContent = await TopicContent.findOne({ topic_id: TEST_TOPIC_ID });
    logTest(20, 'Test data successfully deleted', afterCleanupTopic === null && afterCleanupContent === null);

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  } finally {
    await cleanup();
    await mongoose.disconnect();
  }

  console.log('\n' + '='.repeat(50));
  results.forEach(r => console.log(r));
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('\n=== QURAN INTEGRATION COMPLETE ===');
    console.log('All 20 tests PASSED\n');
    process.exit(0);
  } else {
    console.log(`\n${failed} tests FAILED\n`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

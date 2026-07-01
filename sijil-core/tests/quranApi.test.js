import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import QuranSurah from '../src/models/quranSurah.model.js';
import QuranAyah from '../src/models/quranAyah.model.js';

const BASE = 'http://localhost:' + (process.env.PORT || 4000) + '/api';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function get(path) {
  const url = BASE + path;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function runTests() {
  console.log('=== CONNECTING TO MONGODB ===');
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!\n');

  let passed = 0;
  let failed = 0;

  function log(testNum, desc, condition) {
    if (condition) {
      console.log(`✓ Test ${testNum}: ${desc}`);
      passed++;
    } else {
      console.log(`✗ Test ${testNum}: ${desc}`);
      failed++;
    }
  }

  console.log('GET /api/quran/surah/1');
  
  // Test 1-5: Surah 1
  const surah1Res = await get('/quran/surah/1');
  log(1, 'Status 200', surah1Res.status === 200);
  
  const surahNameOk = surah1Res.data?.data?.surah?.name_english?.includes('Fatihah');
  log(2, 'name_english contains "Fatihah"', !!surahNameOk);
  
  const ayahsLenOk = Array.isArray(surah1Res.data?.data?.ayahs) && surah1Res.data.data.ayahs.length === 7;
  log(3, 'ayahs array length === 7', ayahsLenOk);
  
  const allHaveArabic = surah1Res.data?.data?.ayahs?.every(
    a => a.text_uthmani && /[\u0600-\u06FF]/.test(a.text_uthmani)
  );
  log(4, 'All ayahs contain Arabic characters', !!allHaveArabic);
  
  const noInternalFields = surah1Res.data?.data?.ayahs?.every(
    a => a._seeded_at === undefined && a._source === undefined && a.__v === undefined
  );
  log(5, 'No internal fields (_seeded_at, _source) exposed', !!noInternalFields);

  console.log('\nGET /api/quran/ayah/2/255');
  
  // Test 6-9: Ayat al-Kursi
  const ayah255Res = await get('/quran/ayah/2/255');
  log(6, 'Status 200', ayah255Res.status === 200);
  
  const hasTextUthmani = ayah255Res.data?.data?.text_uthmani && ayah255Res.data.data.text_uthmani.length > 0;
  log(7, 'text_uthmani is non-empty', !!hasTextUthmani);
  
  const hasUrdu = ayah255Res.data?.data?.translation_ur && ayah255Res.data.data.translation_ur.length > 0;
  log(8, 'translation_ur is non-empty', !!hasUrdu);
  
  const hasEnglishNoHtml = ayah255Res.data?.data?.translation_en && 
                           ayah255Res.data.data.translation_en.length > 0 && 
                           !ayah255Res.data.data.translation_en.includes('<');
  log(9, 'translation_en is non-empty and has no HTML tags', !!hasEnglishNoHtml);

  console.log('\nGET /api/quran/range/2/1/7');
  
  // Test 10-13: Range
  const rangeRes = await get('/quran/range/2/1/7');
  log(10, 'Status 200', rangeRes.status === 200);
  
  const countOk = rangeRes.data?.data?.count === 7;
  log(11, 'count === 7', !!countOk);
  
  const rangeLenOk = Array.isArray(rangeRes.data?.data?.ayahs) && rangeRes.data.data.ayahs.length === 7;
  log(12, 'ayahs array length === 7', !!rangeLenOk);
  
  const allSurah2 = rangeRes.data?.data?.ayahs?.every(a => a.surah === 2);
  log(13, 'All ayahs have surah-consistent data', !!allSurah2);

  console.log('\nInvalid inputs:');
  
  // Test 14-18: Invalid inputs
  const surah0Res = await get('/quran/surah/0');
  log(14, 'GET /api/quran/surah/0 → 400', surah0Res.status === 400);
  
  const surah115Res = await get('/quran/surah/115');
  log(15, 'GET /api/quran/surah/115 → 400', surah115Res.status === 400);
  
  const ayah999Res = await get('/quran/ayah/1/999');
  log(16, 'GET /api/quran/ayah/1/999 → 404', ayah999Res.status === 404);
  
  const rangeLargeRes = await get('/quran/range/1/1/100');
  log(17, 'GET /api/quran/range/1/1/100 → 400 (range > 50)', rangeLargeRes.status === 400);
  
  const rangeBadRes = await get('/quran/range/1/5/3');
  log(18, 'GET /api/quran/range/1/5/3 → 400 (end < start)', rangeBadRes.status === 400);

  await mongoose.disconnect();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           QURAN API VERIFICATION RESULTS                     ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  TOTAL                              [ ${passed}/${passed+failed} ]                ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (failed === 0) {
    console.log('\n=== QURAN API VERIFICATION COMPLETE ===');
  } else {
    console.log(`\n❌ ${failed} test(s) failed`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});

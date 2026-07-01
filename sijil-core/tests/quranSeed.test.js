import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import QuranSurah from '../src/models/quranSurah.model.js';
import QuranAyah from '../src/models/quranAyah.model.js';

async function verifyQuranSeed() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const results = [];
    const failedChecks = [];

    // Test 1: Surah count === 114
    const surahCount = await QuranSurah.countDocuments();
    const test1 = surahCount === 114;
    results.push({ num: 1, desc: 'QuranSurah.countDocuments() === 114', pass: test1, actual: surahCount });
    if (!test1) failedChecks.push(`Test 1: Expected 114, got ${surahCount}`);

    // Test 2: Ayah count === 6236
    const ayahCount = await QuranAyah.countDocuments();
    const test2 = ayahCount === 6236;
    results.push({ num: 2, desc: 'QuranAyah.countDocuments() === 6236', pass: test2, actual: ayahCount });
    if (!test2) failedChecks.push(`Test 2: Expected 6236, got ${ayahCount}`);

    // Test 3: Surah 1 (Al-Fatihah) has exactly 7 ayahs
    const surah1Count = await QuranAyah.countDocuments({ surah: 1 });
    const test3 = surah1Count === 7;
    results.push({ num: 3, desc: 'Surah 1 has exactly 7 ayahs', pass: test3, actual: surah1Count });
    if (!test3) failedChecks.push(`Test 3: Expected 7, got ${surah1Count}`);

    // Test 4: Surah 2 (Al-Baqarah) has exactly 286 ayahs
    const surah2Count = await QuranAyah.countDocuments({ surah: 2 });
    const test4 = surah2Count === 286;
    results.push({ num: 4, desc: 'Surah 2 has exactly 286 ayahs', pass: test4, actual: surah2Count });
    if (!test4) failedChecks.push(`Test 4: Expected 286, got ${surah2Count}`);

    // Test 5: Ayah 2:255 (Ayat al-Kursi) — text_uthmani contains Arabic
    const ayatAlKursi = await QuranAyah.findOne({ surah: 2, ayah: 255 });
    const hasArabic = ayatAlKursi && /[\u0600-\u06FF]/.test(ayatAlKursi.text_uthmani);
    const test5 = !!ayatAlKursi && hasArabic;
    results.push({ num: 5, desc: 'Ayah 2:255 text_uthmani contains Arabic', pass: test5, actual: hasArabic });
    if (!test5) failedChecks.push('Test 5: Ayat al-Kursi text_uthmani missing or no Arabic characters');

    // Test 6: Ayah 2:255 — translation_ur is not empty
    const test6 = !!ayatAlKursi && ayatAlKursi.translation_ur && ayatAlKursi.translation_ur.length > 0;
    results.push({ num: 6, desc: 'Ayah 2:255 translation_ur is not empty', pass: test6, actual: test6 });
    if (!test6) failedChecks.push('Test 6: Ayat al-Kursi Urdu translation is empty');

    // Test 7: Ayah 2:255 — translation_en has no HTML tags
    const enHasNoHtml = ayatAlKursi && !ayatAlKursi.translation_en.includes('<');
    const test7 = !!ayatAlKursi && enHasNoHtml && ayatAlKursi.translation_en.length > 0;
    results.push({ num: 7, desc: 'Ayah 2:255 translation_en has no HTML tags', pass: test7, actual: test7 });
    if (!test7) failedChecks.push('Test 7: Ayat al-Kursi English translation has HTML or is empty');

    // Test 8: Every ayah has surah and ayah fields
    const missingFields = await QuranAyah.countDocuments({
      $or: [
        { surah: { $exists: false } },
        { ayah: { $exists: false } }
      ]
    });
    const test8 = missingFields === 0;
    results.push({ num: 8, desc: 'All ayahs have surah and ayah fields', pass: test8, actual: missingFields });
    if (!test8) failedChecks.push(`Test 8: ${missingFields} ayahs missing surah or ayah fields`);

    // Test 9: No duplicate { surah, ayah } pairs
    const dupCheck = await QuranAyah.aggregate([
      { $group: { _id: { surah: '$surah', ayah: '$ayah' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    const test9 = dupCheck.length === 0;
    results.push({ num: 9, desc: 'No duplicate { surah, ayah } pairs', pass: test9, actual: dupCheck.length });
    if (!test9) failedChecks.push(`Test 9: Found ${dupCheck.length} duplicate pairs`);

    // Test 10: Surah 114 (An-Nas) exists with 6 ayahs
    const surah114 = await QuranSurah.findOne({ surah_number: 114 });
    const surah114AyahCount = await QuranAyah.countDocuments({ surah: 114 });
    const test10 = !!surah114 && surah114.total_ayahs === 6 && surah114AyahCount === 6;
    results.push({ num: 10, desc: 'Surah 114 exists with 6 ayahs', pass: test10, actual: surah114AyahCount });
    if (!test10) failedChecks.push(`Test 10: Surah 114 issue (found ${surah114AyahCount} ayahs)`);

    // Print results
    console.log('📋 VERIFICATION RESULTS:\n');
    results.forEach(r => {
      const icon = r.pass ? '✓' : '✗';
      console.log(`${icon} Test ${r.num}: ${r.desc}`);
      if (!r.pass) {
        console.log(`   Actual: ${r.actual}`);
      }
    });

    console.log('\n' + '='.repeat(50));
    if (failedChecks.length === 0) {
      console.log('=== QURAN SEED VERIFICATION COMPLETE ===');
      console.log('✅ All 10 tests PASSED');
    } else {
      console.log('❌ VERIFICATION FAILED');
      console.log('\nFailed checks:');
      failedChecks.forEach(fc => console.log(`  - ${fc}`));
    }
    console.log('='.repeat(50));

    process.exit(failedChecks.length > 0 ? 1 : 0);

  } catch (err) {
    console.error('❌ Verification Error:', err);
    process.exit(1);
  }
}

verifyQuranSeed();

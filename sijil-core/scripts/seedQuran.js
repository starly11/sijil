import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import QuranSurah from '../src/models/quranSurah.model.js';
import QuranAyah from '../src/models/quranAyah.model.js';

const BASE_URL = 'https://api.quran.com/api/v4';

// Helper to strip HTML tags from translations
function stripHtmlTags(text) {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '');
}

// Sleep helper for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedQuran() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const failedSurahs = [];

    // STEP 1: Fetch and seed quran_surahs
    console.log('\n📖 STEP 1: Fetching chapter metadata...');
    
    // Fetch English names
    const chaptersRes = await axios.get(`${BASE_URL}/chapters`);
    const chapters = chaptersRes.data.chapters;

    // Fetch Urdu names (language=ur)
    const urduRes = await axios.get(`${BASE_URL}/chapters?language=ur`);
    const urduChapters = urduRes.data.chapters;
    const urduMap = {};
    urduChapters.forEach(ch => {
      urduMap[ch.id] = ch.translated_name?.name || '';
    });

    // Map and upsert each surah
    for (const chapter of chapters) {
      const surahData = {
        surah_number: chapter.id,
        name_arabic: chapter.name_arabic,
        name_english: chapter.name_simple,
        name_urdu: urduMap[chapter.id] || '',
        name_transliteration: chapter.name_simple, // Use name_simple as transliteration fallback
        total_ayahs: chapter.verses_count,
        revelation_type: chapter.revelation_place === 'mecca' ? 'Meccan' : 'Medinan',
        juz_start: chapter.juz_start || undefined
      };

      await QuranSurah.findOneAndUpdate(
        { surah_number: chapter.id },
        surahData,
        { upsert: true, new: true }
      );
      
      if (chapter.id <= 5 || chapter.id >= 110 || chapter.id % 20 === 0) {
        console.log(`   ✓ Surah ${chapter.id} (${surahData.name_english}) seeded`);
      }
    }
    console.log(`   ✅ All 114 surahs metadata seeded`);

    // STEP 2: Fetch and seed quran_ayahs for each surah
    console.log('\n📜 STEP 2: Fetching ayahs for each surah...');

    for (let surahNum = 1; surahNum <= 114; surahNum++) {
      // Check if already seeded
      const existingAyahCount = await QuranAyah.countDocuments({ surah: surahNum });
      const surahMeta = await QuranSurah.findOne({ surah_number: surahNum });
      
      if (surahMeta && existingAyahCount === surahMeta.total_ayahs) {
        console.log(`   ✓ Surah ${surahNum} already seeded (${existingAyahCount} ayahs)`);
        continue;
      }

      try {
        // Fetch 3 parallel requests
        const [versesRes, urduTransRes, enTransRes] = await Promise.all([
          axios.get(`${BASE_URL}/verses/by_chapter/${surahNum}`, {
            params: {
              fields: 'text_uthmani,juz_number,page_number,hizb_number,ruku_number',
              per_page: 300
            }
          }),
          axios.get(`${BASE_URL}/verses/by_chapter/${surahNum}`, {
            params: {
              translations: 234, // Fatah Muhammad Jalandhari (Urdu)
              per_page: 300
            }
          }),
          axios.get(`${BASE_URL}/verses/by_chapter/${surahNum}`, {
            params: {
              translations: 85, // M.A.S. Abdel Haleem (English)
              per_page: 300
            }
          })
        ]);

        const verses = versesRes.data.verses;
        const urduTranslations = urduTransRes.data.verses;
        const enTranslations = enTransRes.data.verses;

        // Create maps for quick lookup
        const urduMapByVerse = {};
        urduTranslations.forEach(v => {
          urduMapByVerse[v.verse_number] = v.translations?.[0]?.text || '';
        });

        const enMapByVerse = {};
        enTranslations.forEach(v => {
          enMapByVerse[v.verse_number] = v.translations?.[0]?.text || '';
        });

        // Upsert each ayah
        const ayahPromises = verses.map(async (verse) => {
          const ayahNum = verse.verse_number;
          const ayahData = {
            surah: surahNum,
            ayah: ayahNum,
            text_uthmani: verse.text_uthmani || '',
            translation_ur: stripHtmlTags(urduMapByVerse[ayahNum]),
            translation_en: stripHtmlTags(enMapByVerse[ayahNum]),
            juz: verse.juz_number,
            page: verse.page_number,
            hizb: verse.hizb_number,
            ruku: verse.ruku_number
          };

          await QuranAyah.findOneAndUpdate(
            { surah: surahNum, ayah: ayahNum },
            ayahData,
            { upsert: true, new: true }
          );
        });

        await Promise.all(ayahPromises);
        console.log(`   ✓ Surah ${surahNum} seeded (${verses.length} ayahs)`);

      } catch (err) {
        console.error(`   ❌ Failed to seed Surah ${surahNum}: ${err.message}`);
        failedSurahs.push(surahNum);
      }

      // Rate limiting: 300ms delay between surahs
      await sleep(300);
    }

    // STEP 3: Final counts
    console.log('\n📊 STEP 3: Final verification...');
    const totalSurahs = await QuranSurah.countDocuments();
    const totalAyahs = await QuranAyah.countDocuments();

    console.log(`   Total Surahs: ${totalSurahs}`);
    console.log(`   Total Ayahs: ${totalAyahs}`);

    if (failedSurahs.length > 0) {
      console.log(`\n⚠️  Failed to seed surahs: ${failedSurahs.join(', ')}`);
      console.log('   Re-run the script to retry failed surahs.');
    } else {
      console.log('\n✅ QURAN SEED COMPLETE!');
      console.log('   Expected: 114 surahs, 6236 ayahs');
    }

    process.exit(failedSurahs.length > 0 ? 1 : 0);

  } catch (err) {
    console.error('❌ Seed Error:', err);
    process.exit(1);
  }
}

seedQuran();

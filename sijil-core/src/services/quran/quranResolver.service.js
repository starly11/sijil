import mongoose from 'mongoose';
import QuranAyah from '../../models/quranAyah.model.js';

/**
 * Resolves a quran_reference content block to actual Quran data.
 * Fetches directly from quran_ayahs collection (no HTTP call).
 * 
 * @param {Object} block - Validated quran_reference block
 * @returns {Promise<Object>} Resolved Quran data with ayahs
 * @throws {Error} If no ayahs found for the range
 */
export async function resolveQuranBlock(block) {
    const { surah, ayah_start, ayah_end, textbook_translation_ur, curriculum_id, display_note } = block;

    // Fetch ayahs from database
    const ayahs = await QuranAyah.find({
        surah: surah,
        ayah: { $gte: ayah_start, $lte: ayah_end }
    })
    .sort({ ayah: 1 })
    .lean();

    if (!ayahs || ayahs.length === 0) {
        throw new Error(`Quran reference not found: surah ${surah} ayah ${ayah_start}-${ayah_end}`);
    }

    // Map ayahs to response format
    const resolvedAyahs = ayahs.map(ayah => ({
        ayah: ayah.ayah,
        text_uthmani: ayah.text_uthmani,
        translation_ur: textbook_translation_ur || ayah.translation_ur,
        translation_en: ayah.translation_en,
        juz: ayah.juz,
        page: ayah.page
    }));

    return {
        surah_number: surah,
        range: { start: ayah_start, end: ayah_end },
        count: resolvedAyahs.length,
        ayahs: resolvedAyahs,
        display_note: display_note,
        curriculum_id: curriculum_id
    };
}

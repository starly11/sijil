import QuranSurah from '../models/quranSurah.model.js';
import QuranAyah from '../models/quranAyah.model.js';

export async function getSurah(req, res, next) {
  try {
    const surahNumber = parseInt(req.params.surahNumber, 10);
    
    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return res.status(400).json({ success: false, error: 'Invalid surah number. Must be between 1 and 114.' });
    }
    
    const surah = await QuranSurah.findOne({ surah_number: surahNumber }).lean();
    if (!surah) {
      return res.status(404).json({ success: false, error: 'Surah not found.' });
    }
    
    const ayahs = await QuranAyah.find({ surah: surahNumber })
      .sort({ ayah: 1 })
      .lean();
    
    // Strip internal fields from response
    const cleanAyahs = ayahs.map(({ _id, _seeded_at, _source, __v, ...rest }) => rest);
    const cleanSurah = { 
      surah_number: surah.surah_number,
      name_arabic: surah.name_arabic,
      name_english: surah.name_english,
      name_urdu: surah.name_urdu,
      name_transliteration: surah.name_transliteration,
      total_ayahs: surah.total_ayahs,
      revelation_type: surah.revelation_type,
      juz_start: surah.juz_start
    };
    
    return res.status(200).json({ success: true, data: { surah: cleanSurah, ayahs: cleanAyahs } });
  } catch (error) {
    next(error);
  }
}

export async function getAyah(req, res, next) {
  try {
    const surahNumber = parseInt(req.params.surahNumber, 10);
    const ayahNumber = parseInt(req.params.ayahNumber, 10);
    
    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return res.status(400).json({ success: false, error: 'Invalid surah number. Must be between 1 and 114.' });
    }
    
    if (isNaN(ayahNumber) || ayahNumber < 1) {
      return res.status(400).json({ success: false, error: 'Invalid ayah number. Must be >= 1.' });
    }
    
    const ayah = await QuranAyah.findOne({ surah: surahNumber, ayah: ayahNumber }).lean();
    if (!ayah) {
      return res.status(404).json({ success: false, error: 'Ayah not found.' });
    }
    
    // Strip internal fields
    const { _id, _seeded_at, _source, __v, ...cleanAyah } = ayah;
    
    return res.status(200).json({ success: true, data: cleanAyah });
  } catch (error) {
    next(error);
  }
}

export async function getRange(req, res, next) {
  try {
    const surahNumber = parseInt(req.params.surahNumber, 10);
    const start = parseInt(req.params.start, 10);
    const end = parseInt(req.params.end, 10);
    
    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return res.status(400).json({ success: false, error: 'Invalid surah number. Must be between 1 and 114.' });
    }
    
    if (isNaN(start) || start < 1) {
      return res.status(400).json({ success: false, error: 'Invalid start. Must be >= 1.' });
    }
    
    if (isNaN(end) || end < start) {
      return res.status(400).json({ success: false, error: 'Invalid range. End must be >= start.' });
    }
    
    const rangeSize = end - start + 1;
    if (rangeSize > 50) {
      return res.status(400).json({ success: false, error: 'Range too large. Maximum 50 ayahs allowed.' });
    }
    
    const ayahs = await QuranAyah.find({ 
      surah: surahNumber, 
      ayah: { $gte: start, $lte: end } 
    })
      .sort({ ayah: 1 })
      .lean();
    
    if (ayahs.length === 0) {
      return res.status(404).json({ success: false, error: 'No ayahs found in that range.' });
    }
    
    // Strip internal fields
    const cleanAyahs = ayahs.map(({ _id, _seeded_at, _source, __v, ...rest }) => rest);
    
    return res.status(200).json({ 
      success: true, 
      data: { 
        surah_number: surahNumber,
        range: { start, end },
        count: ayahs.length,
        ayahs: cleanAyahs 
      } 
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllSurahs(req, res, next) {
  try {
    const surahs = await QuranSurah.find({})
      .sort({ surah_number: 1 })
      .lean();
    
    // Clean fields to match what the spec needs
    const cleanSurahs = surahs.map(({ 
      _id, _seeded_at, _source, __v, name_urdu, juz_start, ...rest 
    }) => ({
      id: rest.surah_number,
      number: rest.surah_number,
      name: rest.name_arabic,
      englishName: rest.name_english,
      englishNameTranslation: rest.name_transliteration,
      revelationType: rest.revelation_type,
      numberOfAyahs: rest.total_ayahs
    }));
    
    return res.status(200).json({ success: true, data: cleanSurahs });
  } catch (error) {
    next(error);
  }
}

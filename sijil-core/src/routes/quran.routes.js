import { Router } from 'express';
import { getSurah, getAyah, getRange, getAllSurahs } from '../controllers/quran.controller.js';

const router = Router();

router.get('/surahs', getAllSurahs);
router.get('/surah/:surahNumber', getSurah);
router.get('/ayah/:surahNumber/:ayahNumber', getAyah);
router.get('/range/:surahNumber/:start/:end', getRange);

export default router;

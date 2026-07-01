import { Router } from 'express';
import {
    searchTopicsHandler,
    searchFormulasHandler,
    getSuggestionsHandler,
    getTrendingHandler
} from '../controllers/search.controller.js';

const router = Router();

router.get('/search', searchTopicsHandler);
router.get('/search/formulas', searchFormulasHandler);
router.get('/search/suggest', getSuggestionsHandler);
router.get('/search/trending', getTrendingHandler);

export default router;
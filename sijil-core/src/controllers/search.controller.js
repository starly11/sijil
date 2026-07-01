import { searchTopics, trackPopularSearch, trackFailedSearch } from '../services/api/search.service.js';
import { searchFormulas } from '../services/api/formulaSearch.service.js';
import { getSuggestions, getTrendingSearches } from '../services/api/suggest.service.js';
import { recordSuccessfulSearch, recordFailedSearch } from '../services/analytics/searchAnalytics.service.js';

/**
 * GET /api/search
 * Search topics with optional filters
 * Query params: q (required), subject, grade, difficulty, topicType, limit
 */
export const searchTopicsHandler = async (req, res, next) => {
    try {
        const { q, subject, grade, difficulty, topicType, limit } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Search query parameter "q" is required'
            });
        }

        const results = await searchTopics({
            query: q,
            subject,
            grade,
            difficulty,
            topicType,
            limit: limit ? parseInt(limit, 10) : 20
        });

        // Track as popular search if results found
        if (results.length > 0) {
            const topResultId = results[0]?._id || results[0]?.id;
            await trackPopularSearch(q, topResultId);
            // Fire-and-forget analytics
            recordSuccessfulSearch({ query: q, resultsCount: results.length, topicIds: [topResultId] }).catch(() => {});
        } else {
            // Track as failed search if no results
            await trackFailedSearch(q);
            // Fire-and-forget analytics
            recordFailedSearch({ query: q }).catch(() => {});
        }

        res.json({
            success: true,
            data: {
                query: q,
                count: results.length,
                results
            }
        });
    } catch (error) {
        console.error('[SearchController] Error:', error.message);
        
        // Handle Atlas Search index not configured
        if (error.message.includes('index') || error.message.includes('Atlas')) {
            return res.status(503).json({
                success: false,
                error: 'Search service temporarily unavailable'
            });
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Search failed'
        });
    }
};

/**
 * GET /api/search/formulas
 * Search LaTeX formulas
 * Query params: q (required), subject, grade, limit
 */
export const searchFormulasHandler = async (req, res, next) => {
    try {
        const { q, subject, grade, limit } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Formula search query parameter "q" is required'
            });
        }

        const results = await searchFormulas({
            query: q,
            subject,
            grade,
            limit: limit ? parseInt(limit, 10) : 20
        });

        res.json({
            success: true,
            data: {
                query: q,
                count: results.length,
                results
            }
        });
    } catch (error) {
        console.error('[SearchController] Formula search error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Formula search failed'
        });
    }
};

/**
 * GET /api/search/suggest
 * Get autocomplete suggestions
 * Query params: prefix (required), limit
 */
export const getSuggestionsHandler = async (req, res, next) => {
    try {
        const { prefix, limit } = req.query;

        if (!prefix) {
            return res.status(400).json({
                success: false,
                error: 'Suggestion prefix parameter "prefix" is required'
            });
        }

        const suggestions = await getSuggestions({
            prefix,
            limit: limit ? parseInt(limit, 10) : 10
        });

        res.json({
            success: true,
            data: {
                prefix,
                suggestions
            }
        });
    } catch (error) {
        console.error('[SearchController] Suggest error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Suggestions failed'
        });
    }
};

/**
 * GET /api/search/trending
 * Get trending/popular searches
 * Query params: limit
 */
export const getTrendingHandler = async (req, res, next) => {
    try {
        const { limit } = req.query;

        const trending = await getTrendingSearches({
            limit: limit ? parseInt(limit, 10) : 10
        });

        res.json({
            success: true,
            data: {
                trending
            }
        });
    } catch (error) {
        console.error('[SearchController] Trending error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message || 'Trending searches failed'
        });
    }
};

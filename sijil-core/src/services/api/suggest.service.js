import mongoose from 'mongoose';

/**
 * Phase 8 Suggest Service - Autocomplete for search
 * Returns popular searches and topic titles matching prefix
 */

/**
 * Escape regex special characters in a string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get search suggestions based on query prefix
 * Combines popular searches + topic title matches
 */
export async function getSuggestions({ prefix, limit = 10 }) {
    const PopularSearch = mongoose.model('PopularSearch');
    const Topic = mongoose.model('Topic');
    
    if (!prefix || prefix.trim() === '') {
        return [];
    }

    const normalizedPrefix = prefix.toLowerCase().trim();
    const escapedPrefix = escapeRegex(normalizedPrefix);

    // Get popular searches starting with prefix
    const popularSearches = await PopularSearch.find({
        query: { $regex: `^${escapedPrefix}`, $options: 'i' }
    })
    .sort({ count: -1 })
    .limit(limit)
    .lean();

    // Get topic titles starting with prefix
    const topicTitles = await Topic.find({
        title: { $regex: `^${escapedPrefix}`, $options: 'i' }
    })
    .select('title slug_global')
    .limit(limit)
    .lean();

    // Combine and deduplicate
    const suggestions = new Set();
    
    popularSearches.forEach(s => {
        if (s.query && s.query.length >= 2) {
            suggestions.add(s.query);
        }
    });

    topicTitles.forEach(t => {
        if (t.title && t.title.length >= 2) {
            suggestions.add(t.title);
        }
    });

    return Array.from(suggestions).slice(0, limit);
}

/**
 * Get trending searches (most searched in recent period)
 */
export async function getTrendingSearches({ limit = 10 }) {
    const PopularSearch = mongoose.model('PopularSearch');
    
    const results = await PopularSearch.find()
        .sort({ count: -1, last_searched: -1 })
        .limit(limit)
        .lean();

    return results.map(s => ({
        query: s.query,
        count: s.count,
        last_searched: s.last_searched
    }));
}

import Topic from '../../models/topic.model.js';
import SlugRegistry from '../../models/slugRegistry.model.js';
import mongoose from 'mongoose';

export async function fetchPopularTopics(limit = 10) {
    const PopularTopic = mongoose.models.PopularTopic || mongoose.model('PopularTopic', new mongoose.Schema({}, { strict: false }), 'popular_topics');
    return await PopularTopic.find({}).sort({ hit_count: -1, count: -1 }).limit(Math.min(50, parseInt(limit))).lean();
}

export async function fetchFailedSearches(page = 1, limit = 20) {
    const FailedSearch = mongoose.models.FailedSearch || mongoose.model('FailedSearch', new mongoose.Schema({}, { strict: false }), 'failed_searches');
    const skip = (Math.max(1, parseInt(page)) - 1) * Math.max(1, parseInt(limit));
    const parsedLimit = Math.max(1, parseInt(limit));

    const [items, total] = await Promise.all([
        FailedSearch.find({}).sort({ timestamp: -1, created_at: -1 }).skip(skip).limit(parsedLimit).lean(),
        FailedSearch.countDocuments({})
    ]);

    return { items, total };
}

export async function fetchSitemapSeed(limit = 1000) {
    return await SlugRegistry.find({})
        .select('slug_global url_path entity_type updated_at')
        .limit(Math.min(5000, parseInt(limit)))
        .lean();
}
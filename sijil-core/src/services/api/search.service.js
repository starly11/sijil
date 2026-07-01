import mongoose from 'mongoose';
import { generateId } from '../id.service.js';

/**
 * Phase 8 Search Service - MongoDB Atlas Search implementation
 * Scopes search to topics collection only (metadata-only search)
 */

const ATLAS_SEARCH_INDEX_NAME = 'topics_search';

/**
 * Build Atlas Search pipeline for topic search
 * Uses compound query with fuzzy matching on title/keywords/key_terms_preview
 */
export async function searchTopics({
    query,
    subject,
    grade,
    difficulty,
    topicType,
    limit = 20
}) {
    const Topic = mongoose.model('Topic');
    
    if (!query || query.trim() === '') {
        throw new Error('Search query is required');
    }

    const searchPipeline = [];

    // Atlas $search stage
    const searchStage = {
        $search: {
            index: ATLAS_SEARCH_INDEX_NAME,
            compound: {
                must: [{
                    text: {
                        query: query,
                        path: ['title', 'keywords', 'key_terms_preview'],
                        fuzzy: { maxEdits: 1 }
                    }
                }]
            }
        }
    };

    // Add filters if provided
    const filterExpressions = [];
    
    if (subject) {
        filterExpressions.push({ text: { query: subject, path: 'subject' } });
    }
    
    if (grade !== undefined && grade !== null) {
        filterExpressions.push({ equals: { value: Number(grade), path: 'grade_numeric' } });
    }
    
    if (difficulty) {
        filterExpressions.push({ text: { query: difficulty, path: 'difficulty' } });
    }
    
    if (topicType) {
        filterExpressions.push({ text: { query: topicType, path: 'topic_type' } });
    }

    if (filterExpressions.length > 0) {
        searchStage.$search.compound.filter = filterExpressions;
    }

    searchPipeline.push(searchStage);

    // Add score metadata
    searchPipeline.push({
        $addFields: {
            searchScore: { $meta: 'searchScore' },
            searchHighlights: { $meta: 'searchHighlights' }
        }
    });

    // Apply limit
    searchPipeline.push({ $limit: limit });

    // Execute search
    const results = await Topic.aggregate(searchPipeline).exec();

    return results.map(topic => ({
        _id: topic._id,
        id: topic._id,
        title: topic.title,
        slug_global: topic.slug_global,
        subject: topic.subject,
        grade_numeric: topic.grade_numeric,
        difficulty: topic.difficulty,
        topic_type: topic.topic_type,
        document_id: topic.document_id,
        keywords: topic.keywords,
        key_terms_preview: topic.key_terms_preview,
        searchScore: topic.searchScore,
        searchHighlights: topic.searchHighlights
    }));
}

/**
 * Track a successful search in popular_searches
 */
export async function trackPopularSearch(query, topResultId = null) {
    const PopularSearch = mongoose.model('PopularSearch');
    
    try {
        const normalizedQuery = query.toLowerCase().trim();
        
        await PopularSearch.findByIdAndUpdate(
            normalizedQuery,
            {
                $set: { 
                    query: normalizedQuery,
                    last_searched: new Date()
                },
                $inc: { count: 1 },
                $setOnInsert: {
                    _id: normalizedQuery,
                    created_at: new Date()
                }
            },
            { 
                upsert: true, 
                new: true 
            }
        );

        // Update top_result_id if provided
        if (topResultId) {
            await PopularSearch.findByIdAndUpdate(normalizedQuery, {
                top_result_id: topResultId
            });
        }
    } catch (error) {
        console.error('[SearchService] Error tracking popular search:', error.message);
    }
}

/**
 * Track a failed search (zero results) in failed_searches
 */
export async function trackFailedSearch(query) {
    const FailedSearch = mongoose.model('FailedSearch');
    
    try {
        const normalizedQuery = query.toLowerCase().trim();
        
        await FailedSearch.findByIdAndUpdate(
            normalizedQuery,
            {
                $set: { 
                    query: normalizedQuery,
                    last_searched: new Date()
                },
                $inc: { count: 1 },
                $setOnInsert: {
                    _id: normalizedQuery,
                    created_at: new Date()
                }
            },
            { 
                upsert: true, 
                new: true 
            }
        );
    } catch (error) {
        console.error('[SearchService] Error tracking failed search:', error.message);
    }
}

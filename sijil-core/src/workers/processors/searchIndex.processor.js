import mongoose from 'mongoose';
import * as logger from '../../utils/logger.js';
import Topic from '../../models/topic.model.js';
import Document from '../../models/document.model.js';

/**
 * Search Index Processor - Verifies Atlas Search indexing after ingestion
 * @param {import('bullmq').Job} job
 */
export default async function processSearchIndex(job) {
    const { document_id } = job.data;
    
    logger.info({ 
        queue: 'search-index', 
        jobId: job.id, 
        document_id,
        event: 'processor_start' 
    }, `Starting search index verification for document: ${document_id}`);

    try {
        // Step 1: Fetch all topics belonging to this document_id
        await job.updateProgress(25);
        
        const topics = await Topic.find({ document_id }).select(
            '_id title keywords key_terms_preview subject grade_numeric difficulty topic_type'
        ).lean();
        
        logger.info({ 
            document_id, 
            topicsFound: topics.length 
        }, `Found ${topics.length} topics for document`);

        if (topics.length === 0) {
            return {
                document_id,
                topics_checked: 0,
                search_verified: false,
                note: 'No topics found for this document_id'
            };
        }

        // Step 2: Verify document exists and is not archived
        const document = await Document.findOne({ 
            'document_metadata.document_id': document_id 
        }).lean();
        
        const isDocumentActive = document && 
            (document.document_metadata?.is_latest !== false || 
             !document.document_metadata?.is_archived);
        
        if (!isDocumentActive) {
            logger.warn({ document_id }, 'Document is archived or not latest version');
        }

        // Step 3: Verify topics are findable via Atlas Search
        await job.updateProgress(75);
        
        let searchVerified = false;
        let searchNote = '';
        
        try {
            // Run a simple $search query against the topics_search index
            // Use the document title keywords or first topic title as search query
            const searchQuery = document?.document_metadata?.title?.split(' ').slice(0, 3).join(' ') 
                || topics[0]?.title?.split(' ').slice(0, 3).join(' ');
            
            const searchPipeline = [
                {
                    $search: {
                        index: 'topics_search',
                        text: {
                            query: searchQuery,
                            path: ['title', 'keywords', 'key_terms_preview'],
                            fuzzy: { maxEdits: 1 }
                        }
                    }
                },
                {
                    $match: {
                        document_id: document_id
                    }
                },
                {
                    $limit: 1
                }
            ];
            
            const searchResults = await Topic.aggregate(searchPipeline).exec();
            
            if (searchResults && searchResults.length > 0) {
                searchVerified = true;
                searchNote = `Atlas Search verified - found ${searchResults.length} matching topic(s)`;
                logger.info({ document_id, searchResultsCount: searchResults.length }, 'Atlas Search verification successful');
            } else {
                searchVerified = false;
                searchNote = 'Atlas Search returned no results for document keywords - index may be stale or not configured';
                logger.warn({ document_id }, 'Atlas Search returned no results');
            }
        } catch (atlasError) {
            // Handle Atlas Search index not found error gracefully
            if (atlasError.message.includes('index') || 
                atlasError.message.includes('Atlas') ||
                atlasError.message.includes('not found')) {
                searchVerified = false;
                searchNote = `Atlas Search index not configured: ${atlasError.message}`;
                logger.warn({ 
                    document_id, 
                    error: atlasError.message 
                }, 'Atlas Search index not found - using fallback MongoDB text search');
            } else {
                throw atlasError;
            }
        }

        await job.updateProgress(100);
        
        return {
            document_id,
            topics_checked: topics.length,
            search_verified: searchVerified,
            document_active: isDocumentActive,
            note: searchNote
        };
        
    } catch (error) {
        logger.error({ 
            document_id, 
            error: error.message,
            stack: error.stack 
        }, 'Search index processing failed');
        
        throw error;
    }
}
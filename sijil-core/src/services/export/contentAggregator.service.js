import mongoose from 'mongoose';
import { isExportAllowed } from './exportPolicy.service.js';
import Topic from '../../models/topic.model.js';
import TopicContent from '../../models/topicContent.model.js';
import TopicAssessment from '../../models/topicAssessment.model.js';
import FormulaIndex from '../../models/formulaIndex.model.js';
import TopicAsset from '../../models/topicAsset.model.js';
import { buildAssetUrl, enrichFiguresWithUrls } from '../api/assetUrl.service.js';
import { info, error } from '../../utils/logger.js';

/**
 * Fetches topic metadata from the Topic collection.
 * @param {string} topicId - The topic _id
 * @returns {Promise<{ topic_id: string, title: string, slug: string, document_id: string, chapter_id: string }>}
 * @throws {Error} If topic not found
 */
async function fetchTopicMetadata(topicId) {
    const topic = await Topic.findOne({ _id: topicId }).lean();
    
    if (!topic) {
        throw new Error(`Topic not found: ${topicId}`);
    }
    
    return {
        topic_id: topic._id,
        title: topic.title,
        slug: topic.slug,
        document_id: topic.document_id,
        chapter_id: topic.chapter_id
    };
}

/**
 * Aggregates formula pack data for a topic.
 * @param {string} topicId - The topic _id
 * @returns {Promise<{ metadata: object, formulas: Array }>}
 */
async function aggregateFormulaPack(topicId) {
    const metadata = await fetchTopicMetadata(topicId);
    
    const formulas = await FormulaIndex.find({ topic_id: topicId })
        .select('_id latex text label formula_type source_page variables')
        .lean();
    
    info({ topicId, count: formulas.length }, 'aggregateFormulaPack: formulas found');
    
    return {
        metadata,
        formulas
    };
}

/**
 * Aggregates MCQ pack data for a topic.
 * @param {string} topicId - The topic _id
 * @returns {Promise<{ metadata: object, assessments: { mcqs: Array, short_questions: Array } }>}
 */
async function aggregateMcqPack(topicId) {
    const metadata = await fetchTopicMetadata(topicId);
    
    const assessment = await TopicAssessment.findOne({ topic_id: topicId }).lean();
    
    const mcqs = assessment?.book_mcqs || [];
    const shortQuestions = assessment?.book_short_questions || [];
    
    info({ topicId, mcqCount: mcqs.length, shortQuestionCount: shortQuestions.length }, 'aggregateMcqPack: assessments found');
    
    return {
        metadata,
        assessments: {
            mcqs,
            short_questions: shortQuestions
        }
    };
}

/**
 * Aggregates revision pack data for a topic.
 * @param {string} topicId - The topic _id
 * @returns {Promise<{ metadata: object, content_blocks: Array, key_terms: Array, formulas: Array, assessments: object }>}
 */
async function aggregateRevisionPack(topicId) {
    const metadata = await fetchTopicMetadata(topicId);
    
    // Get content blocks (exclude mcq type)
    const contentDoc = await TopicContent.findOne({ topic_id: topicId }).lean();
    const allBlocks = contentDoc?.content_blocks || [];
    const contentBlocks = allBlocks
        .filter(block => block.block_type !== 'mcq')
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    // Get key terms from topic content
    const keyTerms = contentDoc?.key_terms || [];
    
    // Get formulas
    const formulas = await FormulaIndex.find({ topic_id: topicId })
        .select('_id latex text label formula_type source_page variables')
        .lean();
    
    // Get assessments
    const assessment = await TopicAssessment.findOne({ topic_id: topicId }).lean();
    const mcqs = assessment?.book_mcqs || [];
    const shortQuestions = assessment?.book_short_questions || [];
    
    info({ 
        topicId, 
        blockCount: contentBlocks.length, 
        keyTermCount: keyTerms.length,
        formulaCount: formulas.length,
        mcqCount: mcqs.length,
        shortQuestionCount: shortQuestions.length 
    }, 'aggregateRevisionPack: data found');
    
    return {
        metadata,
        content_blocks: contentBlocks,
        key_terms: keyTerms,
        formulas,
        assessments: {
            mcqs,
            short_questions: shortQuestions
        }
    };
}

/**
 * Aggregates offline HTML pack data for a topic.
 * @param {string} topicId - The topic _id
 * @returns {Promise<{ metadata: object, content_blocks: Array, formulas: Array, assessments: object, assets: Array, key_terms: Array, flashcards: Array }>}
 */
async function aggregateOfflineHtml(topicId) {
    const metadata = await fetchTopicMetadata(topicId);
    
    // Get all content blocks (including mcq)
    const contentDoc = await TopicContent.findOne({ topic_id: topicId }).lean();
    const allBlocks = contentDoc?.content_blocks || [];
    const contentBlocks = allBlocks.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    // Get key terms
    const keyTerms = contentDoc?.key_terms || [];
    
    // Get formulas
    const formulas = await FormulaIndex.find({ topic_id: topicId })
        .select('_id latex text label formula_type source_page variables')
        .lean();
    
    // Get assessments (all types)
    const assessment = await TopicAssessment.findOne({ topic_id: topicId }).lean();
    const mcqs = assessment?.book_mcqs || [];
    const shortQuestions = assessment?.book_short_questions || [];
    const longQuestions = assessment?.book_problems || [];
    
    // Get assets and resolve URLs
    const assetDoc = await TopicAsset.findOne({ topic_id: topicId }).lean();
    const figures = assetDoc?.figures || [];
    const tables = assetDoc?.tables || [];
    const enrichedFigures = enrichFiguresWithUrls(figures);
    
    const assets = [
        ...enrichedFigures.map(fig => ({
            _id: fig._id,
            asset_type: 'figure',
            original_url: fig.image_path_local,
            resolved_url: fig.image_url,
            alt_text: fig.alt,
            caption: fig.caption
        })),
        ...tables.map(tbl => ({
            _id: tbl._id,
            asset_type: 'table',
            caption: tbl.caption,
            headers: tbl.headers,
            rows: tbl.rows
        }))
    ];
    
    // Get flashcards from topic document
    const topic = await Topic.findOne({ _id: topicId }).lean();
    const flashcards = topic?.flashcards || [];
    
    info({ 
        topicId, 
        blockCount: contentBlocks.length, 
        formulaCount: formulas.length,
        mcqCount: mcqs.length,
        shortQuestionCount: shortQuestions.length,
        longQuestionCount: longQuestions.length,
        assetCount: assets.length,
        flashcardCount: flashcards.length
    }, 'aggregateOfflineHtml: data found');
    
    return {
        metadata,
        content_blocks: contentBlocks,
        formulas,
        assessments: {
            mcqs,
            short_questions: shortQuestions,
            long_questions: longQuestions
        },
        assets,
        key_terms: keyTerms,
        flashcards
    };
}

/**
 * Aggregates flashcard pack data for a topic.
 * @param {string} topicId - The topic _id
 * @returns {Promise<{ metadata: object, flashcards: Array, key_terms: Array }>}
 */
async function aggregateFlashcardPack(topicId) {
    const metadata = await fetchTopicMetadata(topicId);
    
    // Get flashcards from TopicAssessment
    const assessment = await TopicAssessment.findOne({ topic_id: topicId }).lean();
    const assessmentFlashcards = assessment?.flashcards || [];
    
    // Get key terms from TopicContent
    const contentDoc = await TopicContent.findOne({ topic_id: topicId }).lean();
    const keyTerms = contentDoc?.key_terms || [];
    
    info({ 
        topicId, 
        flashcardCount: assessmentFlashcards.length,
        keyTermCount: keyTerms.length 
    }, 'aggregateFlashcardPack: data found');
    
    return {
        metadata,
        flashcards: assessmentFlashcards,
        key_terms: keyTerms
    };
}

/**
 * Aggregates topic pack data (union of revision_pack + flashcard_pack).
 * @param {string} topicId - The topic _id
 * @returns {Promise<{ metadata: object, content_blocks: Array, formulas: Array, assessments: object, key_terms: Array, flashcards: Array, assets: Array }>}
 */
async function aggregateTopicPack(topicId) {
    const metadata = await fetchTopicMetadata(topicId);
    
    // Get content blocks
    const contentDoc = await TopicContent.findOne({ topic_id: topicId }).lean();
    const allBlocks = contentDoc?.content_blocks || [];
    const contentBlocks = allBlocks
        .filter(block => block.block_type !== 'mcq')
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    // Get key terms
    const keyTerms = contentDoc?.key_terms || [];
    
    // Get formulas
    const formulas = await FormulaIndex.find({ topic_id: topicId })
        .select('_id latex text label formula_type source_page variables')
        .lean();
    
    // Get assessments
    const assessment = await TopicAssessment.findOne({ topic_id: topicId }).lean();
    const mcqs = assessment?.book_mcqs || [];
    const shortQuestions = assessment?.book_short_questions || [];
    const longQuestions = assessment?.book_problems || [];
    
    // Get flashcards
    const assessmentFlashcards = assessment?.flashcards || [];
    
    // Get assets
    const assetDoc = await TopicAsset.findOne({ topic_id: topicId }).lean();
    const figures = assetDoc?.figures || [];
    const tables = assetDoc?.tables || [];
    const enrichedFigures = enrichFiguresWithUrls(figures);
    
    const assets = [
        ...enrichedFigures.map(fig => ({
            _id: fig._id,
            asset_type: 'figure',
            original_url: fig.image_path_local,
            resolved_url: fig.image_url,
            alt_text: fig.alt,
            caption: fig.caption
        })),
        ...tables.map(tbl => ({
            _id: tbl._id,
            asset_type: 'table',
            caption: tbl.caption,
            headers: tbl.headers,
            rows: tbl.rows
        }))
    ];
    
    info({ 
        topicId, 
        blockCount: contentBlocks.length, 
        formulaCount: formulas.length,
        mcqCount: mcqs.length,
        shortQuestionCount: shortQuestions.length,
        longQuestionCount: longQuestions.length,
        flashcardCount: assessmentFlashcards.length,
        assetCount: assets.length
    }, 'aggregateTopicPack: data found');
    
    return {
        metadata,
        content_blocks: contentBlocks,
        formulas,
        assessments: {
            mcqs,
            short_questions: shortQuestions,
            long_questions: longQuestions
        },
        key_terms: keyTerms,
        flashcards: assessmentFlashcards,
        assets
    };
}

/**
 * Main entry point for content aggregation.
 * Takes a topicId and exportType, queries all relevant collections, and returns a single normalized payload.
 * @param {object} params - Parameters object
 * @param {string} params.topicId - The topic _id
 * @param {string} params.exportType - The export type (formula_pack, mcq_pack, revision_pack, offline_html, flashcard_pack, topic_pack)
 * @param {string} params.documentType - The document type for policy check
 * @returns {Promise<object>} Complete aggregated payload with metadata
 * @throws {Error} If export not allowed or topic not found
 */
export async function aggregateForExport({ topicId, exportType, documentType }) {
    // Step 1: Check export policy
    const policyCheck = await isExportAllowed(documentType, exportType);
    if (!policyCheck.allowed) {
        throw new Error(policyCheck.reason);
    }
    
    // Step 2: Call appropriate aggregator
    let aggregatorResult;
    
    switch (exportType) {
        case 'formula_pack':
            aggregatorResult = await aggregateFormulaPack(topicId);
            break;
        case 'mcq_pack':
            aggregatorResult = await aggregateMcqPack(topicId);
            break;
        case 'revision_pack':
            aggregatorResult = await aggregateRevisionPack(topicId);
            break;
        case 'offline_html':
            aggregatorResult = await aggregateOfflineHtml(topicId);
            break;
        case 'flashcard_pack':
            aggregatorResult = await aggregateFlashcardPack(topicId);
            break;
        case 'topic_pack':
            aggregatorResult = await aggregateTopicPack(topicId);
            break;
        default:
            throw new Error(`Unknown export type: ${exportType}`);
    }
    
    // Step 3: Attach metadata
    const result = {
        export_type: exportType,
        document_type: documentType,
        topic_id: topicId,
        aggregated_at: new Date().toISOString(),
        ...aggregatorResult
    };
    
    // Step 4: Return complete payload
    return result;
}

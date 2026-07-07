import { generateEntityId } from '../id.service.js';
import { generateSlug } from '../slug.service.js';
import { detectQuranReferences, resolveQuranBlocks } from '../quran/quranReferenceExtractor.service.js';
import { populateGeoFields } from './populateGeoFields.service.js';
import * as logger from '../../utils/logger.js';

/**
 * Transforms validated input payload trees into relational decoupled database models.
 * @param {Object} validatedData - Clean output emitted by validateQwenOutput().
 * @returns {Promise<Object>} Bundled normalized structural mappings ready for database insertion.
 */
export async function normalizeDocumentPayload(validatedData) {
    // Handle both old flat structure and new validated schema structure
    const docMeta = validatedData.document_metadata || validatedData;
    const container = validatedData.container || {};
    let topics = validatedData.topics || container.topics || [];
    // Ensure topics is always an array
    if (!Array.isArray(topics)) {
        topics = [];
    }
    
    const documentId = docMeta.document_id || docMeta._id || generateEntityId('document');
    const documentSlug = docMeta.subject_slug || validatedData.slug || documentId;

    // Extract container/chapter details safely
    const containerId = container._id || container.id || generateEntityId('chapter');
    const containerSlug = container.slug || generateSlug(container.title || 'Chapter');

    const normalizedTopics = [];
    const normalizedTopicContents = [];
    const normalizedTopicAssets = [];
    const normalizedTopicAssessments = [];
    const slugRegistryRecords = [];
    const assetRegistryRecords = [];

    // Register parent document slug tracking record
    slugRegistryRecords.push({
        _id: generateEntityId('slug'),
        slug: documentSlug,
        slug_global: documentSlug,
        document_id: documentId,
        topic_id: null,
        entity_type: 'document',
        url_path: `/${documentSlug}`,
        title_normalized: docMeta.title?.trim()
    });

    // Register structural chapter/container level tracking record
    slugRegistryRecords.push({
        _id: generateEntityId('slug'),
        slug: containerSlug,
        slug_global: `${documentSlug}/${containerSlug}`,
        document_id: documentId,
        topic_id: null,
        entity_type: 'chapter',
        url_path: `/${documentSlug}/${containerSlug}`,
        title_normalized: (container.title || 'Chapter').trim()
    });

    const topicRefs = [];

    if (Array.isArray(topics)) {
        for (let topic of topics) {
            const index = topics.indexOf(topic);
            const topicId = topic._id || topic.topic_id || generateEntityId('topic');
            const topicSlug = topic.slug || topic.topic_slug || generateSlug(topic.title);
            const globalTopicSlug = `${documentSlug}/${containerSlug}/${topicSlug}`;
            const topicUrlPath = `/${globalTopicSlug}`;

            topicRefs.push({
                topic_id: topicId,
                title: topic.title,
                slug: topicSlug,
                order_index: index
            });

            // 1. Core Topic Definition Record
            normalizedTopics.push({
                _id: topicId,
                document_id: documentId,
                chapter_id: containerId,
                title: topic.title,
                slug_local: topicSlug,
                slug_global: globalTopicSlug,
                url_path: topicUrlPath,
                order_index: index,
                summary_counters: {
                    total_blocks: Array.isArray(topic.content_blocks) ? topic.content_blocks.length : 0,
                    total_formulas: countBlocksByType(topic.content_blocks, 'formula'),
                    total_images: countBlocksByType(topic.content_blocks, 'figure'),
                    total_tables: countBlocksByType(topic.content_blocks, 'table'),
                    total_mcqs: Array.isArray(topic.assessments?.mcqs) ? topic.assessments.mcqs.length : 0,
                    total_flashcards: Array.isArray(topic.assessments?.flashcards) ? topic.assessments.flashcards.length : 0,
                }
            });

            // Process Quran references in content blocks (after Zod validation, before persist)
            let processedContentBlocks = topic.content_blocks || [];
            try {
                const annotated = detectQuranReferences(processedContentBlocks);
                processedContentBlocks = await resolveQuranBlocks(annotated);
            } catch (quranError) {
                logger.error({ 
                    error: quranError.message, 
                    topic_id: topicId 
                }, 'Quran reference extraction failed - using original blocks');
                // Continue with original blocks - never crash ingestion
            }

            // Populate GEO fields (after Quran extraction, before persist)
            try {
                const topicWithGeo = await populateGeoFields(
                    { ...topic, content_blocks: processedContentBlocks },
                    docMeta
                );
                topic = topicWithGeo;
                processedContentBlocks = topicWithGeo.content_blocks || processedContentBlocks;
            } catch (geoError) {
                logger.error({ 
                    error: geoError.message, 
                    topic_id: topicId 
                }, 'GEO field population failed - continuing with existing data');
                // Continue with existing data - never crash ingestion
            }

            // 2. Content Blocks Split Record
            normalizedTopicContents.push({
                _id: generateEntityId('tcon'),
                topic_id: topicId,
                document_id: documentId,
                content_blocks: processedContentBlocks.map((block, idx) => ({
                    ...block,
                    block_id: block.block_id || block._id || generateEntityId('block'),
                    order_index: idx
                }))
            });

            // 3. Asset Extraction Split Record
            const topicFigures = (topic.content_blocks || []).filter(b => b.type === 'figure');
            normalizedTopicAssets.push({
                _id: generateEntityId('tast'),
                topic_id: topicId,
                document_id: documentId,
                figures: topicFigures.map(fig => ({
                    _id: generateEntityId('figure'),
                    caption: fig.caption || '',
                    alt: fig.alt || '',
                    figure_number: fig.figure_number || '',
                    source_page: fig.source_page || null,
                    image_path_local: fig.image_path_local || fig.url || '',
                    render_strategy: fig.render_strategy || 'image',
                    svg_code: fig.svg_code || '',
                    animation_type: fig.animation_type || '',
                    has_labels: fig.has_labels || false,
                    label_descriptions: fig.label_descriptions || [],
                    unsplash_search_query: fig.unsplash_search_query || '',
                    embedded_text_ocr: fig.embedded_text_ocr || { detected_languages: [], extracted_strings: [] }
                })),
                tables: (topic.content_blocks || []).filter(b => b.type === 'table').map(tbl => ({
                    _id: generateEntityId('table'),
                    table_number: tbl.table_number || '',
                    caption: tbl.caption || '',
                    headers: tbl.headers || [],
                    rows: tbl.rows || [],
                    source_page: tbl.source_page || null,
                    table_type: tbl.table_type || 'styled-table',
                    render_as: tbl.render_as || 'styled-table'
                }))
            });

            // Cascade structural items straight into centralized tracking repositories
            if (Array.isArray(topicFigures)) {
                topicFigures.forEach(fig => {
                    const path = fig.image_path_local || fig.url;
                    if (path) {
                        assetRegistryRecords.push({
                            _id: generateEntityId('areg'),
                            type: 'figure',
                            topic_id: topicId,
                            document_id: documentId,
                            local_path: path,
                            uploaded_at: new Date()
                        });
                    }
                });
            }

            // 4. Assessments Extraction Split Record
            normalizedTopicAssessments.push({
                _id: generateEntityId('tasm'),
                topic_id: topicId,
                document_id: documentId,
                mcqs: (topic.assessments?.mcqs || []).map(m => ({ ...m, mcq_id: m.mcq_id || m._id || generateEntityId('mcq') })),
                flashcards: (topic.assessments?.flashcards || []).map(f => ({ ...f, flashcard_id: f.flashcard_id || f._id || generateEntityId('flc') })),
                short_questions: (topic.assessments?.short_questions || []).map(q => ({ ...q, question_id: q.question_id || q._id || generateEntityId('sqn') }))
            });

            // 5. Populate Slug Registry
            slugRegistryRecords.push({
                _id: generateEntityId('slug'),
                slug: topicSlug,
                slug_global: globalTopicSlug,
                document_id: documentId,
                topic_id: topicId,
                entity_type: 'topic',
                url_path: topicUrlPath,
                title_normalized: topic.title?.trim()
            });
        }
    }

    return {
        documentId,
        documentSlug,
        containerId,
        topicRefs,
        normalizedTopics,
        normalizedTopicContents,
        normalizedTopicAssets,
        normalizedTopicAssessments,
        slugRegistryRecords,
        assetRegistryRecords
    };
}

function countBlocksByType(blocks, type) {
    if (!Array.isArray(blocks)) return 0;
    return blocks.filter(b => b.type === type).length;
}
import { generateEntityId } from '../id.service.js';
import { generateSlug, dedupeSlug } from '../slug.service.js';
import { detectQuranReferences, resolveQuranBlocks } from '../quran/quranReferenceExtractor.service.js';
import { populateGeoFields } from './populateGeoFields.service.js';
import { buildFormulaIndexRecords } from './formulaIndexer.service.js';
import * as logger from '../../utils/logger.js';
import { getCurrentProfiler } from '../../utils/performanceProfiler.js';

/**
 * Resolve assessments from both SIJIL top-level arrays and legacy assessments wrapper.
 * @param {Object} topic
 * @returns {Object}
 */
function resolveAssessments(topic) {
    const wrapped = topic.assessments || {};
    return {
        book_mcqs: topic.book_mcqs || wrapped.mcqs || [],
        flashcards: topic.flashcards || wrapped.flashcards || [],
        book_short_questions: topic.book_short_questions || wrapped.short_questions || [],
        book_problems: topic.book_problems || wrapped.problems || wrapped.book_problems || [],
        activities: topic.activities || wrapped.activities || [],
    };
}

/**
 * Build search keywords from topic metadata and extracted entities.
 * @param {Object} topic
 * @returns {string[]}
 */
function buildSearchKeywords(topic) {
    const kw = new Set([
        ...(topic.keywords || []),
        ...(topic.seo?.keywords || []),
        ...(topic.seo?.focus_keyword ? [topic.seo.focus_keyword] : []),
    ]);

    for (const kt of topic.key_terms || []) {
        if (typeof kt === 'string') kw.add(kt);
        else if (kt?.term) kw.add(kt.term);
    }

    for (const concept of topic.entity_extraction?.core_concepts || []) {
        if (concept) kw.add(concept);
    }

    for (const formula of topic.formulas || []) {
        if (formula?.name) kw.add(formula.name);
    }

    if (topic.subject) kw.add(topic.subject);

    return [...kw].filter(Boolean).slice(0, 40);
}

/**
 * Build key_terms_preview for Atlas Search from key_terms array.
 * @param {Array} keyTerms
 * @returns {string[]}
 */
function buildKeyTermsPreview(keyTerms) {
    if (!Array.isArray(keyTerms)) return [];
    return keyTerms
        .map(kt => (typeof kt === 'string' ? kt : kt?.term))
        .filter(Boolean)
        .slice(0, 20);
}

/**
 * Merge topic-level formulas with formula/equation blocks for topic_content.formulas.
 * @param {Array} topicFormulas
 * @param {Array} contentBlocks
 * @returns {Array}
 */
function mergeFormulas(topicFormulas, contentBlocks) {
    const merged = [];
    const seen = new Set();

    const add = (entry) => {
        const id = entry._id || entry.formula_id || generateEntityId('formula');
        if (seen.has(id)) return;
        seen.add(id);
        merged.push({
            _id: id,
            formula_id: entry.formula_id || id,
            name: entry.name || '',
            latex: entry.latex || '',
            text: entry.text || '',
            variables: entry.variables || [],
            formula_type: entry.formula_type || '',
            subject_area: entry.subject_area || '',
            source_page: entry.source_page ?? null,
            block_order_ref: entry.block_order_ref ?? entry.block_order ?? null,
        });
    };

    for (const formula of topicFormulas || []) add(formula);
    for (const block of contentBlocks || []) {
        if (block?.type !== 'formula' && block?.type !== 'equation') continue;
        add(block);
    }

    return merged;
}

/**
 * Transforms validated input payload trees into relational decoupled database models.
 * @param {Object} validatedData - Clean output emitted by validateQwenOutput().
 * @returns {Promise<Object>} Bundled normalized structural mappings ready for database insertion.
 */
export async function normalizeDocumentPayload(validatedData) {
    const profiler = getCurrentProfiler();

    const docMeta = validatedData.document_metadata || validatedData;
    const container = validatedData.container || {};
    let topics = validatedData.topics || container.topics || [];
    if (!Array.isArray(topics)) {
        topics = [];
    }

    const documentId = docMeta.document_id || docMeta._id || generateEntityId('document');
    const documentSlug = docMeta.subject_slug || validatedData.slug || documentId;

    const containerId = container._id || container.id || generateEntityId('chapter');
    const containerSlug = container.slug || generateSlug(container.title || 'Chapter');

    if (profiler) {
        profiler.incrementRepeatedWork('slugGenerations');
    }

    const normalizedTopics = [];
    const normalizedTopicContents = [];
    const normalizedTopicAssets = [];
    const normalizedTopicAssessments = [];
    const slugRegistryRecords = [];
    const assetRegistryRecords = [];
    const formulaIndexRecords = [];

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
    const usedTopicSlugsInChapter = new Set();
    const usedGlobalSlugs = new Set();

    if (Array.isArray(topics)) {
        for (let topic of topics) {
            const index = topics.indexOf(topic);
            const topicId = topic._id || topic.topic_id || generateEntityId('topic');

            let topicSlug = topic.slug || topic.topic_slug || generateSlug(topic.title || `topic-${index + 1}`);
            let slugSuffix = 2;
            while (usedTopicSlugsInChapter.has(topicSlug)) {
                topicSlug = dedupeSlug(topicSlug, slugSuffix++);
            }
            usedTopicSlugsInChapter.add(topicSlug);

            let globalTopicSlug = `${documentSlug}/${containerSlug}/${topicSlug}`;
            let globalSuffix = 2;
            while (usedGlobalSlugs.has(globalTopicSlug)) {
                globalTopicSlug = `${documentSlug}/${containerSlug}/${dedupeSlug(topicSlug, globalSuffix++)}`;
            }
            usedGlobalSlugs.add(globalTopicSlug);

            const topicUrlPath = `/${globalTopicSlug}`;

            if (profiler) {
                profiler.incrementRepeatedWork('slugGenerations');
            }

            topicRefs.push({
                topic_id: topicId,
                title: topic.title,
                slug: topicSlug,
                order_index: topic.display_order ?? index
            });

            let processedContentBlocks = topic.content_blocks || [];
            try {
                const annotated = detectQuranReferences(processedContentBlocks);
                processedContentBlocks = await resolveQuranBlocks(annotated);
            } catch (quranError) {
                logger.error({
                    error: quranError.message,
                    topic_id: topicId
                }, 'Quran reference extraction failed - using original blocks');
            }

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
            }

            const assessments = resolveAssessments(topic);
            const mergedFormulas = mergeFormulas(topic.formulas, processedContentBlocks);
            const keyTermsPreview = buildKeyTermsPreview(topic.key_terms);
            const formulaBlockCount = countBlocksByType(processedContentBlocks, 'formula')
                + countBlocksByType(processedContentBlocks, 'equation');
            const figureBlockCount = countBlocksByType(processedContentBlocks, 'figure');
            const tableBlockCount = countBlocksByType(processedContentBlocks, 'table');
            const mcqBlockCount = countBlocksByType(processedContentBlocks, 'mcq');
            const totalFormulas = mergedFormulas.length || formulaBlockCount;
            const totalMcqs = assessments.book_mcqs.length + mcqBlockCount;
            const totalFlashcards = assessments.flashcards.length;
            const subject = topic.subject || docMeta.subject_slug || docMeta.subject || '';
            const gradeNumeric = topic.grade_numeric ?? docMeta.grade_numeric ?? null;

            normalizedTopics.push({
                _id: topicId,
                document_id: documentId,
                chapter_id: containerId,
                title: topic.title,
                title_vernacular: topic.title_vernacular || '',
                slug: topicSlug,
                slug_global: globalTopicSlug,
                url_path: topicUrlPath,
                section_number: topic.section_number || '',
                display_order: topic.display_order ?? index,
                topic_type: topic.topic_type || 'content',
                difficulty: topic.difficulty || 'medium',
                difficulty_score: topic.difficulty_score ?? null,
                estimated_read_time_minutes: topic.estimated_read_time_minutes ?? null,
                bloom_level: topic.bloom_level || '',
                subject,
                grade_numeric: gradeNumeric,
                language: topic.language || docMeta.language || 'english',
                locale: topic.locale || 'en',
                publishing_status: 'published',
                keywords: buildSearchKeywords(topic),
                key_terms_preview: keyTermsPreview,
                formula_count: totalFormulas,
                figure_count: figureBlockCount,
                mcq_count: totalMcqs,
                has_interactive: totalMcqs > 0 || totalFlashcards > 0,
                source_page_start: topic.source_page_start ?? null,
                source_page_end: topic.source_page_end ?? null,
                word_count: topic.word_count ?? 0,
                seo: topic.seo || {},
                geo: topic.geo || {},
                design_meta: topic.design_meta || {},
                internal_links_suggested: topic.internal_links_suggested || [],
                summary_counters: {
                    total_blocks: processedContentBlocks.length,
                    total_formulas: totalFormulas,
                    total_images: figureBlockCount,
                    total_tables: tableBlockCount,
                    total_mcqs: totalMcqs,
                    total_flashcards: totalFlashcards,
                }
            });

            normalizedTopicContents.push({
                _id: generateEntityId('tcon'),
                topic_id: topicId,
                document_id: documentId,
                raw_text: topic.raw_text || '',
                clean_html: topic.clean_html || '',
                content_blocks: processedContentBlocks.map((block, idx) => ({
                    ...block,
                    block_id: block.block_id || block._id || generateEntityId('block'),
                    order_index: idx
                })),
                formulas: mergedFormulas,
                key_terms: topic.key_terms || [],
                examples: topic.examples || [],
                callouts: topic.callouts || [],
                ai_answer_hub: topic.ai_answer_hub || [],
                faq: (topic.faq || []).map(f => ({
                    ...f,
                    _id: f._id || generateEntityId('faq')
                })),
                entity_extraction: topic.entity_extraction || {},
                downloadable_outputs: topic.downloadable_outputs || {},
                source_citations: topic.source_citations || topic.geo?.source_citations || [],
                quran_data: topic.quran_data ?? null,
            });

            const topicFigures = processedContentBlocks.filter(b => b.type === 'figure');
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
                    url: fig.url || fig.image_path_local || '',
                    render_strategy: fig.render_strategy || 'image',
                    svg_code: fig.svg_code || '',
                    animation_type: fig.animation_type || '',
                    has_labels: fig.has_labels || false,
                    label_descriptions: fig.label_descriptions || [],
                    unsplash_search_query: fig.unsplash_search_query || '',
                    embedded_text_ocr: fig.embedded_text_ocr || { detected_languages: [], extracted_strings: [] }
                })),
                tables: processedContentBlocks.filter(b => b.type === 'table').map(tbl => ({
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
                            remote_url: path.startsWith('http') ? path : null,
                            uploaded_at: new Date()
                        });
                    }
                });
            }

            normalizedTopicAssessments.push({
                _id: generateEntityId('tasm'),
                topic_id: topicId,
                document_id: documentId,
                book_mcqs: assessments.book_mcqs.map(m => ({
                    ...m,
                    _id: m._id || m.mcq_id || generateEntityId('mcq')
                })),
                flashcards: assessments.flashcards.map(f => ({
                    ...f,
                    _id: f._id || f.flashcard_id || generateEntityId('flc')
                })),
                book_short_questions: assessments.book_short_questions.map(q => ({
                    ...q,
                    _id: q._id || q.question_id || generateEntityId('sqn')
                })),
                book_problems: assessments.book_problems.map(p => ({
                    ...p,
                    _id: p._id || p.problem_id || generateEntityId('sqn')
                })),
                activities: assessments.activities.map(a => ({
                    ...a,
                    _id: a._id || generateEntityId('block')
                })),
            });

            formulaIndexRecords.push(
                ...buildFormulaIndexRecords({
                    topicId,
                    documentId,
                    subject,
                    gradeNumeric,
                    topicFormulas: mergedFormulas,
                    contentBlocks: processedContentBlocks,
                })
            );

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
        assetRegistryRecords,
        formulaIndexRecords,
    };
}

function countBlocksByType(blocks, type) {
    if (!Array.isArray(blocks)) return 0;
    return blocks.filter(b => b.type === type).length;
}

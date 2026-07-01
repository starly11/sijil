import { z } from 'zod';
import { ContentBlockSchema } from './blocks.schema.js';
import { FormulaSchema } from './formula.schema.js';
import { MCQSchema } from './mcq.schema.js';
import { idSchema, SlugSchema } from './common.schema.js';

/** Validates secondary formula reference metadata within topic structures. */
export const LenientFormulaSchema = FormulaSchema.partial({ latex: true, text: true });

/** Validates academic and textbook key vocabulary terminology mappings. */
export const KeyTermSchema = z.object({
    term: z.string().min(1),
    definition: z.string().min(1),
    term_type: z.string().optional(),
    first_occurrence_page: z.number().int().optional(),
    related_terms: z.array(z.string()).default([])
});

/** Validates contextual evaluation examples nested within historical topic data. */
export const TopicContentExampleSchema = z.object({
    _id: idSchema('ex').optional(),
    example_number: z.string(),
    title: z.string(),
    problem_text: z.string().min(1),
    solution_steps: z.array(z.string()).default([]),
    final_answer: z.string(),
    formula_used: z.string().optional(),
    source_page: z.number().int().optional()
});

/** Validates persistent container highlights or information callouts. */
export const TopicContentCalloutSchema = z.object({
    _id: idSchema('cb').optional(),
    variant: z.string(),
    title: z.string(),
    text: z.string().min(1),
    source_page: z.number().int().optional(),
    block_order_ref: z.number().int().optional()
});

/** Validates localized query response items designed for synthetic AI indexing. */
export const AIAnswerHubEntrySchema = z.object({
    question_intent: z.string().min(1),
    answer_markdown: z.string().min(1),
    answer_plain: z.string().min(1),
    answer_type: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    citation: z.string().optional()
});

/** Validates structured microdata schema FAQ entry representations. */
export const FAQEntrySchema = z.object({
    _id: idSchema('faq').optional(),
    question: z.string().min(1),
    answer: z.string().min(1),
    schema_type: z.string().default("FAQPage"),
    source_page: z.number().int().optional()
});

/** Validates analytical tracking references routing internal cross-entity pathways. */
export const CrossConceptLinkSchema = z.object({
    target_entity: z.string().min(1),
    target_entity_id: z.string().nullable().default(null),
    slug_ref: z.string().min(1),
    fallback_anchor_text: z.string().optional(),
    relationship_type: z.string().optional(),
    resolved: z.boolean().default(false),
    resolved_url: z.string().nullable().default(null),
    context: z.string().optional()
});

/** Validates cross-referenced analytical entity matrices harvested by parsing runs. */
export const EntityExtractionSchema = z.object({
    core_concepts: z.array(z.string()).default([]),
    scientific_laws: z.array(z.string()).default([]),
    historical_figures: z.array(z.string()).default([]),
    units_and_standards: z.array(z.string()).default([]),
    instruments_mentioned: z.array(z.string()).default([]),
    cross_concept_links: z.array(CrossConceptLinkSchema).default([])
});

/** Validates print production reference collections and study summary bundles. */
export const DownloadableOutputsSchema = z.object({
    formula_pack: z.array(z.string()).default([]),
    cheat_sheet_summary: z.string().default(""),
    exam_hot_spots: z.array(z.string()).default([]),
    revision_notes_markdown: z.string().default("")
});

/** Validates word-for-word layout source page text extraction citations. */
export const SourceCitationSchema = z.object({
    verbatim_quote: z.string().min(1),
    page_number: z.number().int(),
    context: z.string().optional()
});

/** Validates script protection filters ensuring no raw Arabic glyph patterns pollute storage fields. */
export const QuranDataSchema = z.object({
    surah: z.number().int().min(1).max(114),
    ayah_start: z.number().int().positive(),
    ayah_end: z.number().int().positive(),
    surah_name_english: z.string(),
    juz: z.number().int().optional(),
    manzil: z.number().int().optional(),
    textbook_urdu_translation: z.string().min(1),
    word_alignments: z.array(z.object({
        position: z.number().int(),
        urdu_meaning: z.string(),
        grammar_note: z.string().nullable()
    })).default([]),
    tafsir_snippet: z.string().default("")
}).superRefine((data, ctx) => {
    const dataString = JSON.stringify(data);
    const arabicGlyphsRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

    if (arabicGlyphsRegex.test(dataString)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "quran_data must not contain Arabic glyphs — Urdu only, position-based mapping required"
        });
    }
});

/** Validates rich diagram structural items embedded down within core topic payloads. */
export const TopicAssetFigureSchema = z.object({
    _id: idSchema('fig'),
    figure_number: z.string(),
    caption: z.string().min(1),
    alt: z.string().min(1),
    source_page: z.number().int().optional(),
    image_path_local: z.string().min(1),
    render_strategy: z.enum(["image", "svg", "animation", "3d"]).default("image"),
    svg_code: z.string().default(""),
    animation_type: z.string().default(""),
    has_labels: z.boolean().default(false),
    label_descriptions: z.array(z.string()).default([]),
    unsplash_search_query: z.string().default(""),
    embedded_text_ocr: z.object({
        detected_languages: z.array(z.string()).default([]),
        extracted_strings: z.array(z.string()).default([])
    }).default({})
});

/** Validates structured tabular data items embedded down within core topic payloads. */
export const TopicAssetTableSchema = z.object({
    _id: idSchema('tbl'),
    table_number: z.string(),
    caption: z.string(),
    headers: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())),
    source_page: z.number().int().optional(),
    table_type: z.string().optional(),
    render_as: z.enum(["styled-table", "chart", "infographic"]).default("styled-table")
});

/** Validates explicitly tracked textbook diagnostic multiple choice items. */
export const BookMCQSchema = MCQSchema.extend({
    mcq_id: idSchema('mcq')
});

/** Validates academic workbook short answer evaluation questions. */
export const ShortQuestionSchema = z.object({
    _id: idSchema('sq'),
    question_number: z.string(),
    question_text: z.string().min(1),
    model_answer: z.string().min(1),
    marks: z.number().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    source_page: z.number().int().optional()
});

/** Validates physics/math word problems requiring analytical breakdown parameters. */
export const NumericalProblemSchema = z.object({
    _id: idSchema('num'),
    problem_number: z.string(),
    problem_text: z.string().min(1),
    given: z.record(z.string(), z.string()).default({}),
    required: z.string().optional(),
    solution_steps: z.array(z.string()).default([]),
    final_answer: z.string().min(1),
    formula_used: z.string().optional(),
    diagram_required: z.boolean().default(false),
    marks: z.number().optional(),
    difficulty: z.string().optional(),
    source_page: z.number().int().optional()
});

/** Validates structural step-by-step laboratory experiment guides. */
export const ActivitySchema = z.object({
    _id: idSchema('act'),
    title: z.string().min(1),
    activity_type: z.string().optional(),
    apparatus: z.array(z.string()).default([]),
    procedure_steps: z.array(z.string()).default([]),
    precautions: z.array(z.string()).default([]),
    expected_result: z.string().default(""),
    source_page: z.number().int().optional()
});

/** Validates target memorization flashcards used by retrieval sub-systems. */
export const FlashcardSchema = z.object({
    _id: idSchema('fc'),
    front: z.string().min(1),
    back: z.string().min(1),
    cloze: z.string().optional(),
    difficulty: z.string().optional()
});

/** Validates full educational topic structure payloads during ingestion. */
export const TopicIngestSchema = z.object({
    _id: idSchema('top'),
    document_id: z.string().min(1),
    chapter_id: z.string().min(1),
    title: z.string().min(1),
    title_vernacular: z.string().default(""),
    slug: SlugSchema,
    slug_global: z.string().optional(),
    url_path: z.string().optional(),
    section_number: z.string().optional(),
    display_order: z.number().int().min(0),
    topic_type: z.enum(["content", "exercise", "intro", "summary", "quran"]).default("content"),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
    difficulty_score: z.number().min(0).max(1).optional(),
    estimated_read_time_minutes: z.number().optional(),
    bloom_level: z.string().optional(),
    subject: z.string().optional(),
    grade_numeric: z.number().optional(),
    language: z.string().default("english"),
    keywords: z.array(z.string()).default([]),
    key_terms_preview: z.array(z.string()).default([]),
    source_page_start: z.number().int().optional(),
    source_page_end: z.number().int().optional(),
    design_meta: z.object({
        primary_color_theme: z.string().optional().default(''),
        icon_suggestion: z.string().optional().default(''),
        layout_template: z.enum([
            "standard",
            "two-col",
            "formula-heavy",
            "image-heavy",
            "comparison"
        ]).default("standard"),
        animation_complexity: z.string().optional().default('')
    }).default(() => ({
        primary_color_theme: '',
        icon_suggestion: '',
        layout_template: 'standard',
        animation_complexity: ''
    })),
    word_count: z.number().int().nonnegative().optional(),
    seo: z.object({
        meta_title: z.string().default(""),
        meta_description: z.string().default(""),
        canonical_url: z.string().default(""),
        focus_keyword: z.string().default(""),
        keywords: z.array(z.string()).default([]),
        breadcrumb: z.array(z.string()).default([]),
        json_ld_types: z.array(z.string()).default([])
    }).default({}),
    geo: z.object({
        llm_summary: z.string().default(""),
        authoritative_source: z.string().default(""),
        citation_format: z.string().default(""),
        entity_name: z.string().default(""),
        entity_type: z.string().default(""),
        trustworthiness_signals: z.array(z.string()).default([]),
        source_citations: z.array(z.object({
            verbatim_quote: z.string().default(""),
            page_number: z.number().nullable().default(null),
            context: z.string().default("")
        })).default([])
    }).default({}),
    raw_text: z.string().default(""),
    clean_html: z.string().default(""),
    content_blocks: z.array(ContentBlockSchema).min(1, "content_blocks must not be empty"),
    formulas: z.array(LenientFormulaSchema).default([]),
    key_terms: z.array(KeyTermSchema).default([]),
    examples: z.array(TopicContentExampleSchema).default([]),
    callouts: z.array(TopicContentCalloutSchema).default([]),
    ai_answer_hub: z.array(AIAnswerHubEntrySchema).default([]),
    faq: z.array(FAQEntrySchema).default([]),
    entity_extraction: EntityExtractionSchema.default({}),
    internal_links_suggested: z.array(z.object({
        slug: z.string().default(''),
        title: z.string().default(''),
        url_path: z.string().default(''),
        relevance: z.string().default('')
    })).default([]),
    downloadable_outputs: DownloadableOutputsSchema.default({}),
    source_citations: z.array(SourceCitationSchema).default([]),
    quran_data: QuranDataSchema.nullable().default(null),
    figures: z.array(TopicAssetFigureSchema).default([]),
    tables: z.array(TopicAssetTableSchema).default([]),
    book_mcqs: z.array(BookMCQSchema).default([]),
    book_short_questions: z.array(ShortQuestionSchema).default([]),
    book_problems: z.array(NumericalProblemSchema).default([]),
    activities: z.array(ActivitySchema).default([]),
    flashcards: z.array(FlashcardSchema).default([])
});
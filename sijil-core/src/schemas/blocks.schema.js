import { z } from 'zod';
import { BaseBlockFields, idSchema, SlugSchema } from './common.schema.js';
import { FormulaSchema } from './formula.schema.js';
import { MCQSchema } from './mcq.schema.js';

/** Validates structural layout headings mapping to table of content landmarks. */
export const HeadingBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("heading"),
    level: z.number().int().min(1).max(6),
    text: z.string().min(1),
    slug_anchor: SlugSchema
});

/** Validates narrative prose components, formula tracking indicators, and raw entity matrices. */
export const ParagraphBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("paragraph"),
    text: z.string().min(1),
    contains_formula: z.boolean().default(false),
    key_terms_in_text: z.array(z.string()).default([])
});

/** Validates standalone math/science formulation components requiring explicit entity identifiers. */
export const FormulaBlockSchema = z.object({
    ...BaseBlockFields,
    ...FormulaSchema.shape,
    type: z.literal("formula"),
    formula_id: idSchema('frm')
});

/** Validates spatial asset metadata layouts, localization file paths, and image vector markup strings. */
export const FigureBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("figure"),
    figure_id: idSchema('fig'),
    figure_number: z.string(),
    caption: z.string().min(1),
    alt: z.string().min(1).describe("Descriptive alt text for accessibility - must be at least 20 words describing the image content in detail"),
    image_path_local: z.string().min(1),
    render_strategy: z.enum(["image", "svg", "animation"]).default("image"),
    svg_code: z.string().default(""),
    source_page: z.number().int().positive().optional(),
    has_labels: z.boolean().default(false),
    label_descriptions: z.array(z.string()).default([]),
    unsplash_search_query: z.string().default(""),
    embedded_text_ocr: z.object({
        detected_languages: z.array(z.string()).default([]),
        extracted_strings: z.array(z.string()).default([])
    }).optional()
}).superRefine((data, ctx) => {
    // Enforce descriptive alt text - minimum 20 words for accessibility
    const wordCount = data.alt.trim().split(/\s+/).length;
    if (wordCount < 20) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Alt text must be at least 20 words for accessibility. Current count: ${wordCount}. Example: "A detailed diagram of a plant cell showing the nucleus, chloroplasts, cell wall, and large central vacuole with labeled parts."`,
            path: ["alt"]
        });
    }
});

/** Validates multi-dimensional tabular matrix values, headers layout structures, and presentation strategies. */
export const TableBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("table"),
    table_id: z.string(),
    table_number: z.string(),
    caption: z.string(),
    headers: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())),
    table_type: z.string().optional(),
    render_as: z.enum(["styled-table", "chart", "infographic"]).default("styled-table")
});

/** Validates system contextual notes, layout highlight items, and structural warning wrappers. */
export const CalloutBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("callout"),
    callout_id: z.string(),
    variant: z.string(),
    title: z.string(),
    text: z.string().min(1),
    icon: z.string().optional()
});

/** Validates diagnostic evaluation elements needing explicit entity tracking indicators. */
export const MCQBlockSchema = z.object({
    ...BaseBlockFields,
    ...MCQSchema.shape,
    type: z.literal("mcq"),
    mcq_id: idSchema('mcq')
});

/** Validates step-by-step math or science academic problem execution examples. */
export const ExampleBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("example"),
    example_id: z.string(),
    example_number: z.string(),
    title: z.string(),
    problem_text: z.string().min(1),
    solution_steps: z.array(z.string()).min(1),
    final_answer: z.string().min(1)
});

/** Validates standard enumeration layout list sets and sequential list arrays. */
export const ListBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("list"),
    list_type: z.enum(["ordered", "unordered"]),
    items: z.array(z.string()).min(1)
});

/** Validates bold conceptual dictionary definitions and academic lexicon mappings. */
export const DefinitionBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("definition"),
    term: z.string().min(1),
    definition_text: z.string().min(1)
});

/** Validates academic targets, learning benchmarks, and chapter scope statements. */
export const LearningOutcomesBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("learning_outcomes"),
    outcomes: z.array(z.string()).min(1)
});

/** Validates item property matrices, contrast views, and side-by-side taxonomy displays. */
export const ComparisonViewBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("comparison_view"),
    caption: z.string(),
    headers: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())),
    design_hint: z.string().optional()
});

/** Validates Quran data properties enforcing position alignments while preventing Arabic string storage. */
export const QuranVerseBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("quran_verse"),
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().positive(),
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
            message: "quran_verse block must not contain Arabic glyphs — Urdu only, position-based mapping required"
        });
    }
});

/** Validates Quran reference blocks for textbook content - stores position only, resolves at render time. */
export const QuranReferenceBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("quran_reference"),
    surah: z.number().int().min(1).max(114),
    ayah_start: z.number().int().min(1),
    ayah_end: z.number().int().min(1),
    textbook_translation_ur: z.string().default(""),
    curriculum_id: z.string().default(""),
    display_note: z.string().default("")
}).refine(
    data => data.ayah_end >= data.ayah_start,
    { message: "ayah_end must be >= ayah_start", path: ["ayah_end"] }
);

/** Validates dynamic experimental tracking records, tools lists, and procedure instructions. */
export const ActivityBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("activity"),
    title: z.string().min(1),
    activity_type: z.string().optional(),
    apparatus: z.array(z.string()).default([]),
    procedure_steps: z.array(z.string()).default([]),
    precautions: z.array(z.string()).default([]),
    expected_result: z.string().default("")
});

/** Validates inline chemical formulas or isolated raw mathematical statements. */
export const EquationBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("equation"),
    latex: z.string().min(1),
    text: z.string().min(1)
});

/** Validates quantitative numerical items, problem conditions metadata, and final execution metrics. */
export const NumericalBlockSchema = z.object({
    ...BaseBlockFields,
    type: z.literal("numerical"),
    problem_text: z.string().min(1),
    given: z.record(z.string(), z.string()).default({}),
    required: z.string().optional(),
    solution_steps: z.array(z.string()).default([]),
    final_answer: z.string().min(1)
});

/** Structural collection mapping polymorphic variations through their explicit content types. */
export const ContentBlockSchema = z.discriminatedUnion("type", [
    HeadingBlockSchema,
    ParagraphBlockSchema,
    FormulaBlockSchema,
    FigureBlockSchema,
    TableBlockSchema,
    CalloutBlockSchema,
    MCQBlockSchema,
    ExampleBlockSchema,
    ListBlockSchema,
    DefinitionBlockSchema,
    LearningOutcomesBlockSchema,
    ComparisonViewBlockSchema,
    QuranVerseBlockSchema,
    QuranReferenceBlockSchema,
    ActivityBlockSchema,
    EquationBlockSchema,
    NumericalBlockSchema
]);
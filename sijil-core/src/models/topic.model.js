import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Stores localization layout schemas, indexing definitions, and telemetry mapping points for sub-chapters.
 */
const topicSchema = new Schema({
    _id: { type: String, required: true },
    document_id: { type: String, required: true, index: true },
    chapter_id: { type: String, required: true },
    parent_topic_id: { type: String, default: null },
    title: { type: String, required: true },
    title_vernacular: { type: String, default: "" },
    slug: { type: String, required: true },
    slug_global: { type: String, required: true, unique: true, index: true },
    design_theme: {
        _id: false,
        type: new Schema({
            is_hardcoded: { type: Boolean, default: false },
            palette: {
                _id: false,
                type: new Schema({
                    primary: { type: String, default: "var(--fallback-primary)" },
                    secondary: { type: String, default: "var(--fallback-secondary)" },
                    accent: { type: String, default: "var(--fallback-accent)" },
                    surface: { type: String, default: "var(--fallback-surface)" }
                })
            }
        })
    },
    url_path: { type: String, required: true },
    section_number: String,
    display_order: { type: Number, default: 0 },
    topic_type: { type: String, enum: ["content", "exercise", "intro", "summary", "quran"], default: "content", index: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    difficulty_score: { type: Number, min: 0, max: 1 },
    estimated_read_time_minutes: Number,
    bloom_level: String,
    subject: { type: String, index: true },
    grade_numeric: { type: Number, index: true },
    language: { type: String, default: "english" },
    locale: { type: String, default: "en", index: true },
    publishing_status: { type: String, enum: ["draft", "processing", "published"], default: "draft", index: true },
    keywords: [String],
    key_terms_preview: [String],
    formula_count: { type: Number, default: 0 },
    figure_count: { type: Number, default: 0 },
    mcq_count: { type: Number, default: 0 },
    has_interactive: { type: Boolean, default: false },
    source_page_start: Number,
    source_page_end: Number,
    seo: {
        _id: false,
        type: new Schema({
            meta_title: { type: String, default: "" },
            meta_description: { type: String, default: "" },
            canonical_url: { type: String, default: "" },
            focus_keyword: { type: String, default: "" },
            keywords: [String],
            breadcrumb: [String],
            json_ld_types: [String]
        })
    },
    geo: {
        _id: false,
        type: new Schema({
            llm_summary: { type: String, default: "" },
            authoritative_source: { type: String, default: "" },
            citation_format: { type: String, default: "" },
            entity_name: { type: String, default: "" },
            entity_type: { type: String, default: "" },
            trustworthiness_signals: [String],
            source_citations: [{
                verbatim_quote: { type: String, default: "" },
                page_number: { type: Number, default: null },
                context: { type: String, default: "" }
            }]
        })
    },
    design_meta: {
        _id: false,
        type: new Schema({
            primary_color_theme: String,
            icon_suggestion: String,
            layout_template: { type: String, enum: ["standard", "two-col", "formula-heavy", "image-heavy", "comparison"], default: "standard" },
            animation_complexity: String
        })
    },
    word_count: { type: Number, default: 0 },
    internal_links_suggested: [{
        slug: { type: String, default: '' },
        title: { type: String, default: '' },
        url_path: { type: String, default: '' },
        relevance: { type: String, default: '' }
    }],
    version: { type: String, default: "1.0.0" },
    is_latest: { type: Boolean, default: true, index: true },
    is_archived: { type: Boolean, default: false, index: true },
    archived_at: { type: Date, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

topicSchema.index({ subject: 1, grade_numeric: 1 });
topicSchema.index({ difficulty_score: 1 });
topicSchema.index({ document_id: 1, is_latest: -1 });
topicSchema.index({ document_id: 1, is_archived: 1 });

export default mongoose.model('Topic', topicSchema, 'topics');
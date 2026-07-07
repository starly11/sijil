import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Stores structural source textbooks, curriculum frameworks, and publication-level manifest catalogs.
 */
const documentSchema = new Schema({
    _id: { type: String, required: true },
    title: { type: String },
    slug: { type: String },
    schema_version: { type: String, default: "2.0.0" },
    schema_type: { type: String, required: true },

    ingest_metadata: {
        _id: false,
        type: new Schema({
            ingest_id: { type: String, required: true },
            engine: String,
            model_version: String,
            prompt_version: String,
            ingest_timestamp: Date,
            processing_time_seconds: Number,
            source_file_name: String,
            source_file_sha256: { type: String, index: true },
            source_file_size_bytes: Number,
            page_count: Number,
            image_count: Number,
            token_count_input: Number,
            token_count_output: Number,
            confidence_score: { type: Number, min: 0, max: 1 },
            warnings: [String],
            status: { type: String, enum: ["pending", "processing", "complete", "error"], default: "pending" },
            zod_validation_passed: { type: Boolean, default: false },
            zod_errors: [Schema.Types.Mixed]
        })
    },

    document_metadata: {
        _id: false,
        type: new Schema({
            _id: { type: String, required: true },
            document_id: { type: String, required: true, index: true },
            title: { type: String, required: true },
            title_vernacular: { type: String, default: "" },
            subtitle: { type: String, default: "" },
            document_type: String,
            subject: { type: String, index: true },
            subject_slug: { type: String, index: true },
            grade_level: String,
            grade_numeric: { type: Number, index: true },
            language: { type: String, default: "english" },
            script_direction: { type: String, enum: ["ltr", "rtl"], default: "ltr" },
            secondary_language: { type: String, default: "" },
            edition_year: Number,
            edition_number: String,
            isbn: { type: String, default: "" },
            publisher: String,
            board_or_authority: String,
            country: String,
            curriculum_standard: String,
            authors: [String],
            editors: [String],
            reviewers: [String],
            category: String,
            sub_category: String,
            tags: [String],
            rights_status: String,
            cover_image_url: { type: String, default: "" },
            thumbnail_url: { type: String, default: "" },
            content_hash: String,
            document_version: { type: String, default: "1.0.0" },
            parent_document_id: { type: String, default: null },
            is_latest: { type: Boolean, default: true },
            access_control: {
                _id: false,
                type: new Schema({
                    is_premium: { type: Boolean, default: false },
                    preview_percentage: { type: Number, default: 100, min: 0, max: 100 },
                    paywall_trigger_elements: [String],
                    allowed_roles: { type: [String], default: ["anonymous"] }
                })
            }
        })
    },

    container: {
        _id: false,
        type: new Schema({
            _id: { type: String, required: true },
            container_type: { type: String, default: "chapter" },
            number: { type: Number, required: true },
            display_label: String,
            title: { type: String, required: true },
            title_vernacular: { type: String, default: "" },
            slug: { type: String, required: true },
            page_range: {
                _id: false,
                type: new Schema({ start: Number, end: Number })
            },
            total_pages: Number,
            global_objectives: [String],
            chapter_summary_verbatim: { type: String, default: "" },
            opening_quote: { type: String, default: "" },
            opening_image_description: { type: String, default: "" }
        })
    },

    topic_refs: [
        new Schema({
            _id: { type: String, required: true },
            slug: { type: String, required: true },
            slug_global: { type: String, required: true, index: true },
            title: { type: String, required: true },
            display_order: { type: Number, default: 0 },
            url_path: { type: String, required: true }
        }, { _id: false })
    ],

    document_aggregates: {
        _id: false,
        type: new Schema({
            total_topics: { type: Number, default: 0 },
            total_blocks: { type: Number, default: 0 },
            total_formulas: { type: Number, default: 0 },
            total_images: { type: Number, default: 0 },
            total_tables: { type: Number, default: 0 },
            total_mcqs: { type: Number, default: 0 },
            total_short_questions: { type: Number, default: 0 },
            total_numerical_problems: { type: Number, default: 0 },
            total_key_terms: { type: Number, default: 0 },
            total_flashcards: { type: Number, default: 0 },
            all_key_terms: [String],
            all_formulas: [String],
            all_figures: [String],
            difficulty_distribution: {
                _id: false,
                type: new Schema({
                    easy: { type: Number, default: 0 },
                    medium: { type: Number, default: 0 },
                    hard: { type: Number, default: 0 }
                })
            }
        })
    },

    seo_master: {
        _id: false,
        type: new Schema({
            meta_title: { type: String, default: "" },
            meta_description: { type: String, default: "" },
            canonical_url: { type: String, default: "" },
            og_title: { type: String, default: "" },
            og_description: { type: String, default: "" },
            og_image: { type: String, default: "" },
            og_type: { type: String, default: "article" },
            twitter_card: { type: String, default: "summary_large_image" },
            keywords: [String],
            focus_keyword: { type: String, default: "" },
            robots: { type: String, default: "index, follow" },
            sitemap_priority: { type: Number, default: 0.5 },
            sitemap_changefreq: { type: String, default: "monthly" },
            json_ld_schemas: [String],
            aeo: {
                _id: false,
                type: new Schema({
                    primary_question: { type: String, default: "" },
                    featured_snippet_block: { type: String, default: "" },
                    answer_type: { type: String, default: "definition" },
                    entity_type: { type: String, default: "Concept" },
                    faq_count: { type: Number, default: 0 }
                })
            },
            geo: {
                _id: false,
                type: new Schema({
                    entity_name: { type: String, default: "" },
                    entity_type: { type: String, default: "EducationalTopic" },
                    authoritative_source: { type: String, default: "" },
                    citation_format: { type: String, default: "" },
                    trustworthiness_signals: [String],
                    llm_summary: { type: String, default: "" }
                })
            }
        })
    },

    publishing: {
        _id: false,
        type: new Schema({
            status: { type: String, enum: ["draft", "processing", "published"], default: "draft", index: true },
            published_at: { type: Date, default: null },
            updated_at: { type: Date, default: null },
            url_path: { type: String, default: "" },
            export_manifest: {
                _id: false,
                type: new Schema({
                    web: { type: String, default: "not_published" },
                    json_raw: { type: String, default: "not_generated" },
                    pdf_formatted: { type: String, default: "not_generated" },
                    epub: { type: String, default: "not_generated" },
                    lms_scorm: { type: String, default: "not_generated" },
                    flashcard_deck: { type: String, default: "not_generated" },
                    formula_pack_pdf: { type: String, default: "not_generated" }
                })
            },
            syndication_targets: [String]
        })
    },

    version_control: {
        _id: false,
        type: new Schema({
            document_version: { type: String, default: "1.0.0" },
            schema_version: { type: String, default: "2.0.0" },
            prompt_version: String,
            commit_timestamp: Date,
            commit_hash: { type: String, default: "" },
            change_log: { type: String, default: "" },
            previous_version_id: { type: String, default: null },
            is_latest: { type: Boolean, default: true }
        })
    },
    is_archived: { type: Boolean, default: false },
    archived_at: { type: Date, default: null },

    type_specific_data: { type: Schema.Types.Mixed, default: {} }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

documentSchema.index({ 'document_metadata.subject': 1, 'document_metadata.grade_numeric': 1 });
documentSchema.index({ is_archived: 1 });

export default mongoose.model('Document', documentSchema, 'documents');
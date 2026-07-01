import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Stores structural content blocks, rich markup layers, entities, and verified Quran tracking matrices.
 */
const topicContentSchema = new Schema({
    _id: { type: String, required: true },
    topic_id: { type: String, required: true, index: true },
    document_id: { type: String, required: true, index: true },
    raw_text: String,
    clean_html: String,
    content_blocks: { type: [Schema.Types.Mixed], default: [] },

    formulas: [
        new Schema({
            _id: { type: String, required: true },
            formula_id: String,
            name: String,
            latex: String,
            text: String,
            variables: [
                new Schema({ symbol: String, name: String, unit: String, description: String }, { _id: false })
            ],
            formula_type: String,
            subject_area: String,
            source_page: Number,
            block_order_ref: Number
        }, { _id: false })
    ],

    key_terms: [
        new Schema({
            term: String,
            definition: String,
            term_type: String,
            first_occurrence_page: Number,
            related_terms: [String]
        }, { _id: false })
    ],

    examples: [
        new Schema({
            _id: { type: String, required: true },
            example_number: String,
            title: String,
            problem_text: String,
            solution_steps: [String],
            final_answer: String,
            formula_used: String,
            source_page: Number
        }, { _id: false })
    ],

    callouts: [
        new Schema({
            _id: { type: String, required: true },
            variant: String,
            title: String,
            text: String,
            source_page: Number,
            block_order_ref: Number
        }, { _id: false })
    ],

    ai_answer_hub: [
        new Schema({
            question_intent: String,
            answer_markdown: String,
            answer_plain: String,
            answer_type: String,
            confidence: Number,
            citation: String
        }, { _id: false })
    ],

    faq: [
        new Schema({
            _id: { type: String, required: true },
            question: String,
            answer: String,
            schema_type: String,
            source_page: Number
        }, { _id: false })
    ],

    entity_extraction: new Schema({
        core_concepts: [String],
        scientific_laws: [String],
        historical_figures: [String],
        units_and_standards: [String],
        instruments_mentioned: [String],
        cross_concept_links: [
            new Schema({
                target_entity: String,
                target_entity_id: { type: String, default: null },
                slug_ref: String,
                fallback_anchor_text: String,
                relationship_type: String,
                resolved: { type: Boolean, default: false, index: true },
                resolved_url: { type: String, default: null },
                context: String
            }, { _id: false })
        ]
    }, { _id: false }),

    downloadable_outputs: new Schema({
        formula_pack: [String],
        cheat_sheet_summary: { type: String, default: "" },
        exam_hot_spots: [String],
        revision_notes_markdown: { type: String, default: "" }
    }, { _id: false }),

    source_citations: [
        new Schema({ verbatim_quote: String, page_number: Number, context: String }, { _id: false })
    ],

    quran_data: { type: Schema.Types.Mixed, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Quran structural validation safety guard hook implementation
topicContentSchema.pre('validate', function() {
    if (this.quran_data !== null && this.quran_data !== undefined) {
        const dataString = JSON.stringify(this.quran_data);
        const arabicGlyphsRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

        if (arabicGlyphsRegex.test(dataString)) {
            throw new Error('quran_data must not contain Arabic glyphs — Urdu translation only, position-based mapping required');
        }
    }
});

export default mongoose.model('TopicContent', topicContentSchema, 'topic_content');

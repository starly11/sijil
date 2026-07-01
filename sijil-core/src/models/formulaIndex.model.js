import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores flat index tables of LaTeX formulas for lightning-fast cross-document math lookups.
 */
const formulaIndexSchema = new Schema({
    _id: { type: String, required: true },
    name: { type: String },
    latex: { type: String },
    text: { type: String },
    // Additive fields for Phase 8 search capabilities
    latex_normalized: { type: String }, // Whitespace/brace-stripped for fuzzy matching
    variables: [{ type: String }],      // Extracted variables for variable-based lookup
    topic_id: { type: String, required: true, index: true },
    document_id: { type: String, index: true },
    subject: { type: String, index: true },
    grade: { type: Number },
    created_at: { type: Date, default: Date.now }
});

export default mongoose.model('FormulaIndex', formulaIndexSchema, 'formula_index');
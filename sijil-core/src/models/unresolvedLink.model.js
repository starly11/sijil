import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores isolated, broken cross-links waiting for human audit and dynamic path adjustments.
 */
const unresolvedLinkSchema = new Schema({
    slug_ref: { type: String, required: true },
    source_topic_id: { type: String, required: true, index: true },
    reviewed: { type: Boolean, default: false, index: true },
    reviewed_at: { type: Date, default: null },
    notes: { type: String, default: "" },
    created_at: { type: Date, default: Date.now }
});

export default mongoose.model('UnresolvedLink', unresolvedLinkSchema, 'unresolved_links');
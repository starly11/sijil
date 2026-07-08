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

// Compound unique index for idempotency (prevents duplicate entries for same slug_ref + source_topic_id)
unresolvedLinkSchema.index({ slug_ref: 1, source_topic_id: 1 }, { unique: true });

export default mongoose.model('UnresolvedLink', unresolvedLinkSchema, 'unresolved_links');
import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores structural tracking versions and historical code correction snapshots.
 */
const versionSchema = new Schema({
    scope: { type: String, enum: ["document", "topic"], required: true },
    entity_id: { type: String, required: true, index: true },
    document_id: { type: String, required: true, index: true },
    version: { type: String, required: true },
    parent_version_id: { type: String, default: null },
    diff_summary: { type: String, default: "" },
    snapshot_ref: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Version', versionSchema, 'versions');
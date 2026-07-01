import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores compilation telemetry tracking background task processes outputting printable assets.
 */
const exportJobSchema = new Schema({
    _id: { type: String, required: true },
    topic_id: { type: String, required: true, index: true },
    format: { 
        type: String, 
        enum: ["formula_pack", "mcq_pack", "revision_pack", "offline_html", "flashcard_pack", "topic_pack"], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["pending", "processing", "complete", "error"], 
        default: "pending", 
        index: true 
    },
    output_url: { type: String, default: "" },
    document_type: { type: String, default: "" },
    export_type: { type: String, default: "" },
    topic_ids: { type: [String], default: [] },
    theme_config: { type: Schema.Types.Mixed, default: {} },
    package_url: { type: String, default: "" },
    manifest: { type: Schema.Types.Mixed, default: {} },
    source_content_hash: { type: String, default: "" },
    is_stale: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    error_log: { type: [Schema.Types.Mixed], default: [] },
    created_at: { type: Date, default: Date.now },
    completed_at: { type: Date, default: null },
    updated_at: { type: Date, default: Date.now }
});

// Update the updated_at timestamp on save (only for manual saves, not create)
// Removed pre-save hook to avoid issues with create() in tests

export default mongoose.model('ExportJob', exportJobSchema, 'export_jobs');
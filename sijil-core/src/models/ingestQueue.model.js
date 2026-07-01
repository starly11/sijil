import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores raw ingest metadata files, process states, and tracking keys for parsing runs.
 */
const ingestQueueSchema = new Schema({
    _id: { type: String, required: true },
    source_file_name: { type: String, required: true },
    source_file_sha256: { type: String, required: true, unique: true, index: true },
    document_id: { type: String, index: true },
    bullmq_job_id: { type: String },
    status: { type: String, enum: ["pending", "processing", "complete", "error", "duplicate"], default: "pending", index: true },
    attempts: { type: Number, default: 0 },
    source: { type: String },
    processing_summary: { type: Schema.Types.Mixed },
    error_log: { type: [Schema.Types.Mixed], default: [] },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    completed_at: { type: Date, default: null },
    processing_time_seconds: { type: Number }
});

export default mongoose.model('IngestQueue', ingestQueueSchema, 'ingest_queue');
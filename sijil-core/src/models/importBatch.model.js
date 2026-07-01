import mongoose from 'mongoose';

/**
 * ImportBatch Model
 * Tracks batch imports from GitHub repositories
 */
const importBatchSchema = new mongoose.Schema({
    // Batch identification
    batch_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Repository information
    repo_url: {
        type: String,
        required: true
    },
    repo_owner: {
        type: String,
        required: true
    },
    repo_name: {
        type: String,
        required: true
    },
    commit_sha: {
        type: String,
        required: true
    },
    source_type: {
        type: String,
        enum: ['book', 'textbook', 'sop', 'manual', 'research_paper'],
        default: 'book'
    },

    // Status tracking
    status: {
        type: String,
        enum: [
            'PENDING',
            'SCANNING',
            'VALIDATING',
            'READY',
            'IMPORTING',
            'COMPLETED',
            'FAILED',
            'PARTIAL_SUCCESS'
        ],
        default: 'PENDING',
        index: true
    },

    // Document counts
    total_documents: {
        type: Number,
        default: 0
    },
    total_topics: {
        type: Number,
        default: 0
    },
    total_assets: {
        type: Number,
        default: 0
    },
    total_assessments: {
        type: Number,
        default: 0
    },

    // Imported counts
    imported_documents: {
        type: Number,
        default: 0
    },
    imported_topics: {
        type: Number,
        default: 0
    },
    imported_assets: {
        type: Number,
        default: 0
    },
    imported_assessments: {
        type: Number,
        default: 0
    },

    // Failed counts
    failed_documents: {
        type: Number,
        default: 0
    },
    failed_topics: {
        type: Number,
        default: 0
    },
    failed_assets: {
        type: Number,
        default: 0
    },
    failed_assessments: {
        type: Number,
        default: 0
    },

    // Tracking arrays for resumable imports
    successful_files: [{
        file_path: String,
        document_id: String,
        ingested_at: Date
    }],
    failed_files: [{
        file_path: String,
        error: String,
        failed_at: Date,
        retry_count: {
            type: Number,
            default: 0
        }
    }],

    // Warnings and errors
    warnings: [{
        type: {
            type: String,
            enum: ['missing_alt', 'missing_formula', 'missing_mcq', 'duplicate_id', 'schema_warning']
        },
        message: String,
        file_path: String,
        topic_id: String
    }],
    errors: [{
        type: {
            type: String,
            enum: ['schema_error', 'missing_required', 'invalid_reference', 'ingestion_failed']
        },
        message: String,
        file_path: String,
        details: mongoose.Mixed
    }],

    // Final report
    report: {
        type: mongoose.Mixed,
        default: null
    },

    // Timing
    started_at: {
        type: Date,
        default: null
    },
    completed_at: {
        type: Date,
        default: null
    },

    // Progress tracking per stage
    progress: {
        scanning: {
            status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
            percentage: { type: Number, default: 0 }
        },
        validating: {
            status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
            percentage: { type: Number, default: 0 }
        },
        importing: {
            status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
            percentage: { type: Number, default: 0 },
            documents: { type: Number, default: 0 },
            topics: { type: Number, default: 0 },
            assets: { type: Number, default: 0 },
            assessments: { type: Number, default: 0 }
        },
        indexing: {
            status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
            percentage: { type: Number, default: 0 }
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
importBatchSchema.index({ repo_owner: 1, repo_name: 1 });
importBatchSchema.index({ status: 1, createdAt: -1 });
importBatchSchema.index({ commit_sha: 1 });

const ImportBatch = mongoose.model('ImportBatch', importBatchSchema);

export default ImportBatch;

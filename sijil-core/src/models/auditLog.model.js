import mongoose from 'mongoose';

/**
 * AuditLog Model
 * Tracks all admin actions for audit trail
 */
const auditLogSchema = new mongoose.Schema({
    // Action identification
    action: {
        type: String,
        required: true,
        enum: [
            'IMPORT_PREVIEW',
            'IMPORT_START',
            'IMPORT_CANCEL',
            'IMPORT_RETRY',
            'INGEST_JSON',
            'INGEST_CANCEL',
            'INGEST_RETRY'
        ],
        index: true
    },

    // Actor information (for future auth integration)
    admin_id: {
        type: String,
        default: 'bootstrap_admin'
    },
    admin_email: {
        type: String,
        default: null
    },

    // Related entities
    batch_id: {
        type: String,
        index: true,
        default: null
    },
    ingest_id: {
        type: String,
        default: null
    },
    document_id: {
        type: String,
        default: null
    },

    // Request context
    ip_address: {
        type: String,
        default: null
    },
    user_agent: {
        type: String,
        default: null
    },

    // Action details
    input_data: {
        type: mongoose.Mixed,
        default: null
    },
    result: {
        type: String,
        enum: ['success', 'failure', 'partial'],
        required: true
    },
    error_message: {
        type: String,
        default: null
    },
    metadata: {
        type: mongoose.Mixed,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ batch_id: 1, createdAt: -1 });
auditLogSchema.index({ admin_id: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

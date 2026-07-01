import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Export policy model that defines what export types are allowed per document type.
 * Collection: 'export_policies'
 */
const exportPolicySchema = new Schema({
    _id: { 
        type: String, 
        required: true 
    },
    document_type: { 
        type: String, 
        required: true, 
        enum: [
            'textbook',
            'course',
            'sop',
            'legal',
            'kyc_onboarding',
            'research_paper',
            'manual',
            'finance',
            'curriculum',
            'reference'
        ],
        unique: true,
        index: true
    },
    allowed_export_types: { 
        type: [String], 
        enum: [
            'formula_pack',
            'mcq_pack',
            'revision_pack',
            'offline_html',
            'flashcard_pack',
            'topic_pack'
        ],
        default: []
    },
    disallow_full_book: { 
        type: Boolean, 
        default: true, 
        immutable: true 
    },
    max_topics_per_export: { 
        type: Number, 
        default: 5 
    },
    notes: { 
        type: String, 
        default: '' 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    }
});

// Update the updated_at timestamp on save
exportPolicySchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

export default mongoose.model('ExportPolicy', exportPolicySchema, 'export_policies');

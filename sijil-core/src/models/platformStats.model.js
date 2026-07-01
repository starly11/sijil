import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Singleton platform-wide statistics document.
 * Collection name: 'platform_stats'
 * Always has exactly ONE document with _id: 'global_stats'
 */
const platformStatsSchema = new Schema({
    _id: { type: String, default: 'global_stats' },

    // Per document_type counts
    counts_by_type: {
        type: Schema.Types.Mixed,
        default: {}
    },
    // Structure: { textbook: 12, sop: 3, course: 5, legal: 1, ... }

    // Totals
    total_documents: { type: Number, default: 0 },
    total_topics: { type: Number, default: 0 },
    total_formulas: { type: Number, default: 0 },
    total_mcqs: { type: Number, default: 0 },
    total_assets: { type: Number, default: 0 },

    // Recent arrivals (last 10, for "new arrival" notifications)
    recent_arrivals: [{
        document_id: String,
        title: String,
        document_type: String,
        subject: String,
        grade_level: String,
        slug: String,
        url_path: String,
        arrived_at: Date
    }],

    last_updated: { type: Date, default: Date.now },
    last_ingested_at: { type: Date, default: null }
}, {
    timestamps: false
});

export default mongoose.model('PlatformStats', platformStatsSchema, 'platform_stats');

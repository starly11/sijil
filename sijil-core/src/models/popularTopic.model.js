import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores raw traffic tracking analytics metrics used to surface popular educational nodes.
 */
const popularTopicSchema = new Schema({
    _id: { type: String, required: true },
    topic_id: { type: String, required: true, index: true },
    view_count: { type: Number, default: 0 },
    search_hit_count: { type: Number, default: 0 },
    last_30_days_views: { type: Number, default: 0 }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('PopularTopic', popularTopicSchema, 'popular_topics');
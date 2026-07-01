import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores successful user query telemetry metrics to power search auto-suggestions.
 */
const popularSearchSchema = new Schema({
    _id: { type: String, required: true },
    query: { type: String, required: true },
    count: { type: Number, default: 0 },
    last_searched: { type: Date, default: Date.now },
    top_result_id: { type: String, default: null }
});

export default mongoose.model('PopularSearch', popularSearchSchema, 'popular_searches');
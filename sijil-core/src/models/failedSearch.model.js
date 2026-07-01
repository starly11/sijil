import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores queries that returned zero results, used to track content coverage gaps.
 */
const failedSearchSchema = new Schema({
    _id: { type: String, required: true },
    query: { type: String, required: true },
    count: { type: Number, default: 0 },
    last_searched: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
});

export default mongoose.model('FailedSearch', failedSearchSchema, 'failed_searches');
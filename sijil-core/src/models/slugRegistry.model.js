import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores canonical lookups, structural routing paths, and matching telemetry targets for all slugs.
 */
const slugRegistrySchema = new Schema({
    _id: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    slug_global: { type: String, index: true },
    document_id: { type: String, index: true },
    topic_id: { type: String, default: null },
    entity_type: { type: String, enum: ["document", "chapter", "topic"], required: true },
    url_path: { type: String, required: true },
    title_normalized: { type: String, required: true, index: true }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('SlugRegistry', slugRegistrySchema, 'slug_registry');
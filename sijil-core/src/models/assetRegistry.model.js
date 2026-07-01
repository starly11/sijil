import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores local file system references mapping assets to prevent storage lock-in.
 */
const assetRegistrySchema = new Schema({
    _id: { type: String, required: true },
    type: { type: String, enum: ["figure", "table_export", "document_cover", "thumbnail", "export_output", "other"], required: true },
    topic_id: { type: String, default: null, index: true },
    document_id: { type: String, index: true },
    local_path: { type: String, required: true, unique: true, index: true },
    render_strategy: { type: String, default: "image" },
    sha256: { type: String, index: true },
    file_size_bytes: { type: Number },
    uploaded_at: { type: Date, default: Date.now }
});

export default mongoose.model('AssetRegistry', assetRegistrySchema, 'asset_registry');
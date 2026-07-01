import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Stores historical ledger logs tracking safe URL redirections when entity slugs are altered.
 */
const slugRedirectSchema = new Schema({
    entity_id: { type: String, required: true, index: true },
    old_slug: { type: String, required: true },
    new_slug: { type: String, required: true },
    old_url_path: { type: String, required: true },
    new_url_path: { type: String, required: true },
    redirect_type: { type: String, default: "301" },
    created_at: { type: Date, default: Date.now }
});

export default mongoose.model('SlugRedirect', slugRedirectSchema, 'slug_redirects');
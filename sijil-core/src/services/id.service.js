import { customAlphabet } from 'nanoid';

/** An object mapping entity type names to their immutable trailing-underscore prefix strings. */
const ID_PREFIXES = Object.freeze({
    document: "doc_",
    chapter: "ch_",
    topic: "top_",
    block: "blk_",
    formula: "frm_",
    figure: "fig_",
    mcq: "mcq_",
    faq: "faq_",
    ingest: "ing_",
    export: "exp_",
    slug: "slug_",
    areg: "areg_",
    tcon: "tcon_",
    tast: "tast_",
    tasm: "tasm_",
    flc: "flc_",
    sqn: "sqn_"
});

const ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const generateRandomPart = customAlphabet(ID_ALPHABET, 12);

/**
 * Generates a permanent, immutable prefixed ID for an entity that is set once and never regenerated.
 * @param {string} type - The entity type lookup key from ID_PREFIXES
 * @returns {string} The formatted entity identity string
 */
function generateId(type) {
    const prefix = ID_PREFIXES[type];
    if (!prefix) {
        throw new Error(`Unknown ID type: ${type}. Must be one of: ${Object.keys(ID_PREFIXES).join(', ')}`);
    }
    return `${prefix}${generateRandomPart()}`;
}

// Alias for generateId to match common usage in the codebase
const generateEntityId = generateId;

/**
 * Returns an array of count unique pre-generated IDs of the given type, executing defensive duplicate validation.
 * @param {string} type - The entity type lookup key from ID_PREFIXES
 * @param {number} count - The total number of unique IDs requested
 * @returns {string[]} An array containing unique entity identity strings
 */
function generateBatchIds(type, count) {
    if (!Number.isInteger(count) || count <= 0) {
        throw new Error('Count must be a positive integer');
    }

    const batch = new Set();
    while (batch.size < count) {
        batch.add(generateId(type));
    }
    return Array.from(batch);
}

export {
    ID_PREFIXES,
    generateId,
    generateEntityId,
    generateBatchIds
};

export default {
    ID_PREFIXES,
    generateId,
    generateEntityId,
    generateBatchIds
};
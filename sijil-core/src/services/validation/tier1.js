import { CURRENT_SCHEMA_VERSION } from '../../schemas/documentIngest.schema.js';

/**
 * Executes rapid structure presence evaluations across unverified payloads.
 * @param {any} rawParsed - The raw, unfixed object matrix directly from JSON parsing layers.
 * @returns {{ passed: boolean, errors: Array<{ message: string }> }}
 */
export function checkTier1(rawParsed) {
    const errors = [];

    if (!rawParsed) {
        return { passed: false, errors: [{ message: "Payload missing or null" }] };
    }

    // Reject outdated schema versions (must be 2.0.0 or CURRENT_SCHEMA_VERSION)
    if (rawParsed.schema_version !== CURRENT_SCHEMA_VERSION && rawParsed.schema_version !== "2.0.0") {
        errors.push({ message: `Invalid schema version target. Expected: "${CURRENT_SCHEMA_VERSION}"` });
    }

    const topics = rawParsed.topics || rawParsed.container?.topics;
    if (!Array.isArray(topics) || topics.length === 0) {
        errors.push({ message: "topics array must not be empty" });
    } else {
        const essentialKeys = ["title", "slug"]; // slug is required for Tier 1 validation
        topics.forEach((topic, idx) => {
            if (!topic || typeof topic !== 'object') {
                errors.push({ message: `Topic at index ${idx} is not a valid object container` });
                return;
            }

            essentialKeys.forEach(field => {
                const val = topic[field];
                if (val === undefined || val === null || val === "") {
                    errors.push({ message: `Topic at index ${idx} is missing required field: ${field}` });
                }
            });
        });
    }

    return {
        passed: errors.length === 0,
        errors
    };
}

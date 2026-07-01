import { DocumentIngestSchema } from '../../schemas/documentIngest.schema.js';
import { TopicIngestSchema } from '../../schemas/topicIngest.schema.js';
import { checkTier1 } from './tier1.js';
import { applyTier2AutoFixes } from './tier2.js';
import { checkTier3Flags } from './tier3.js';

/**
 * Orchestrates the validation pipeline across incoming AI parsing runs.
 * @param {string} rawJsonString - Raw, unparsed JSON string content received from ingestion endpoints.
 * @returns {Promise<{ valid: boolean, tier?: number, errors?: any[], data?: any, autoFixLog?: any[], flags?: any[], note?: string }>}
 */
export async function validateQwenOutput(rawJsonStringOrObject) {
    let rawParsed;

    // 1. Structural Parse Guard (accept either string or pre-parsed object)
    if (typeof rawJsonStringOrObject === 'string') {
        try {
            rawParsed = JSON.parse(rawJsonStringOrObject);
        } catch (err) {
            return {
                valid: false,
                tier: 1,
                errors: [{ message: `Invalid JSON payload structure: ${err.message}` }]
            };
        }
    } else {
        rawParsed = rawJsonStringOrObject;
    }

    // 2. Tier 1 Execution Gate
    const tier1Result = checkTier1(rawParsed);
    if (!tier1Result.passed) {
        return {
            valid: false,
            tier: 1,
            errors: tier1Result.errors
        };
    }

    // 3. Tier 2 Repair Executions
    const { repaired, autoFixLog } = applyTier2AutoFixes(rawParsed);

    // 4. Tier 3 Data Quality Flag Evaluation
    const topicLevel = repaired.topics?.[0];
    const documentLevel = repaired.ingest_metadata;
    const flags = checkTier3Flags(topicLevel, topicLevel, documentLevel);

    return {
        valid: true,
        data: repaired,
        autoFixLog,
        flags
    };
}

export { DocumentIngestSchema, TopicIngestSchema };
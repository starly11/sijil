import { z } from 'zod';
import { DocumentIngestSchema } from '../../schemas/documentIngest.schema.js';
import { TopicIngestSchema } from '../../schemas/topicIngest.schema.js';
import { checkTier1 } from './tier1.js';
import { applyTier2AutoFixes } from './tier2.js';
import { checkAllTier3Flags } from './tier3.js';
import { checkStructuralQuality } from './structuralQuality.js';

/**
 * Orchestrates the validation pipeline across incoming AI parsing runs.
 * @param {string} rawJsonString - Raw, unparsed JSON string content received from ingestion endpoints.
 * @param {Object} options - Validation options
 * @param {boolean} options.lenient - If true, skip strict Zod validation (for bulk imports)
 * @param {boolean} options.skipStructural - If true, skip structural quality gate (emergency override)
 * @returns {Promise<{ valid: boolean, tier?: number, errors?: any[], data?: any, autoFixLog?: any[], flags?: any[], structuralWarnings?: any[], note?: string }>}
 */
export async function validateQwenOutput(rawJsonStringOrObject, options = {}) {
    const { lenient = false, skipStructural = false } = options;
    let rawParsed;

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

    const tier1Result = checkTier1(rawParsed);
    if (!tier1Result.passed) {
        return {
            valid: false,
            tier: 1,
            errors: tier1Result.errors
        };
    }

    const { repaired, autoFixLog } = applyTier2AutoFixes(rawParsed);

    // Structural quality gate — ALWAYS runs (batch + single ingest)
    let structuralWarnings = [];
    if (!skipStructural) {
        const structural = checkStructuralQuality(repaired);
        structuralWarnings = structural.warnings || [];

        if (!structural.passed) {
            return {
                valid: false,
                tier: 'structural',
                errors: structural.errors,
                structuralWarnings,
                structuralStats: structural.stats,
            };
        }
    }

    if (!lenient) {
        try {
            await DocumentIngestSchema.parseAsync(repaired);
        } catch (err) {
            if (err instanceof z.ZodError) {
                const formattedErrors = err.errors.map(e => ({
                    message: `${e.path.join('.')}: ${e.message}`,
                    code: e.code,
                    path: e.path
                }));
                return {
                    valid: false,
                    tier: 2,
                    errors: formattedErrors
                };
            }
            throw err;
        }
    }

    const flags = checkAllTier3Flags(repaired);

    return {
        valid: true,
        data: repaired,
        autoFixLog,
        flags,
        structuralWarnings,
    };
}

export { DocumentIngestSchema, TopicIngestSchema };

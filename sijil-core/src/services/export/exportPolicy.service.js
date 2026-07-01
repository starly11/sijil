import { generateId } from '../id.service.js';
import ExportPolicy from '../../models/exportPolicy.model.js';
import { info } from '../../utils/logger.js';

/**
 * Default export policies per document type.
 */
const DEFAULT_POLICIES = {
    textbook: ['formula_pack', 'mcq_pack', 'revision_pack', 'offline_html', 'flashcard_pack', 'topic_pack'],
    course: ['revision_pack', 'mcq_pack', 'offline_html', 'flashcard_pack', 'topic_pack'],
    sop: ['revision_pack', 'topic_pack', 'offline_html'],
    legal: ['revision_pack', 'topic_pack'],
    kyc_onboarding: ['revision_pack'],
    research_paper: ['revision_pack', 'formula_pack', 'topic_pack'],
    manual: ['revision_pack', 'topic_pack', 'offline_html'],
    finance: ['revision_pack', 'topic_pack'],
    curriculum: ['revision_pack', 'mcq_pack', 'topic_pack'],
    reference: ['revision_pack', 'formula_pack', 'topic_pack']
};

/**
 * Seeds one policy record per document_type if it does not already exist.
 * Uses bulkWrite with upsert: true so it is safe to re-run.
 * @returns {Promise<{ inserted: number, skipped: number }>}
 */
export async function seedDefaultPolicies() {
    const operations = [];
    const documentTypes = Object.keys(DEFAULT_POLICIES);

    for (const docType of documentTypes) {
        const policyId = generateId('export');
        operations.push({
            updateOne: {
                filter: { document_type: docType },
                update: {
                    $setOnInsert: {
                        _id: policyId,
                        document_type: docType,
                        allowed_export_types: DEFAULT_POLICIES[docType],
                        disallow_full_book: true,
                        max_topics_per_export: 5,
                        notes: '',
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                },
                upsert: true
            }
        });
    }

    const result = await ExportPolicy.bulkWrite(operations);

    // Calculate inserted vs skipped
    // Note: bulkWrite doesn't directly tell us which were inserts vs updates
    // We need to check existing records to determine this accurately
    const existingCount = await ExportPolicy.countDocuments({
        document_type: { $in: documentTypes }
    });

    const inserted = result.upsertedCount || 0;
    const skipped = documentTypes.length - inserted;

    info({ inserted, skipped }, 'seedDefaultPolicies completed');

    return { inserted, skipped };
}

/**
 * Finds the policy for the given document_type.
 * @param {string} document_type - The document type to look up
 * @returns {Promise<object>} The policy document (lean)
 * @throws {Error} If policy not found
 */
export async function getPolicyForDocumentType(document_type) {
    const policy = await ExportPolicy.findOne({ document_type }).lean();

    if (!policy) {
        throw new Error(`No export policy found for document type: ${document_type}`);
    }

    return policy;
}

/**
 * Checks if an export type is allowed for a given document type.
 * @param {string} document_type - The document type
 * @param {string} export_type - The export type to check
 * @returns {Promise<{ allowed: boolean, reason: string }>}
 */
export async function isExportAllowed(document_type, export_type) {
    // full_book is ALWAYS disabled regardless of policy
    if (export_type === 'full_book') {
        return {
            allowed: false,
            reason: 'Full book export is permanently disabled'
        };
    }

    const policy = await getPolicyForDocumentType(document_type);

    const isAllowed = policy.allowed_export_types.includes(export_type);

    if (isAllowed) {
        return {
            allowed: true,
            reason: `Export type ${export_type} is permitted for ${document_type}`
        };
    } else {
        return {
            allowed: false,
            reason: `Export type ${export_type} is not permitted for document type ${document_type}`
        };
    }
}

/**
 * Returns all policies sorted by document_type ascending.
 * @returns {Promise<Array>} Array of policy documents (lean)
 */
export async function getAllPolicies() {
    return await ExportPolicy.find().sort({ document_type: 1 }).lean();
}

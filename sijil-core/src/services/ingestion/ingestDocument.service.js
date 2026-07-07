import { generateEntityId } from '../id.service.js';
import * as logger from '../../utils/logger.js';
import { validateQwenOutput } from '../validation/index.js';
import { normalizeDocumentPayload } from './normalizeDocumentPayload.js';
import { buildDocumentRecord } from './buildDocumentRecord.js';
import { persistIngestion } from './persistIngestion.js';
import { computeContentHash } from './computeContentHash.service.js';
import { checkDuplicate, findLatestVersion } from './checkDuplicate.service.js';
import { buildVersionChain } from './buildVersionChain.service.js';

// Access infrastructure dispatch instances established in Phase 5
import { slugResolverQueue, searchIndexQueue } from '../../queues/index.js';
import IngestQueue from '../../models/ingestQueue.model.js';
import Document from '../../models/document.model.js';

/**
 * Validates, normalizes, transforms, persists, and coordinates jobs for incoming generation outputs.
 * @param {Object} params
 * @param {string|Object} params.payload - Input payload data string or object tree.
 * @param {string} params.source - Information on generation origin (e.g., 'manual-test').
 * @param {string} [params.existingDocumentId] - Optional document ID for re-ingestion/versioning.
 * @param {string} [params.rawText] - Optional raw text for hash computation (if already extracted).
 * @returns {Promise<Object>} Operational processing audit summary telemetry.
 */
export async function ingestDocument({ payload, source = 'system', existingDocumentId, rawText }) {
    let parsedPayload;
    try {
        parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch (err) {
        throw new Error(`Failed to parse target ingestion payload content structure: ${err.message}`);
    }

    const trackingId = generateEntityId('ingest');
    // For batch imports or when no source_sha available, use the tracking id as part of the source_sha256 to avoid duplicates!
    const sourceSha = parsedPayload?.meta?.source_file_sha256 || parsedPayload?.source_file_sha256 || `unknown_sha256_${trackingId}`;
    const sourceFileName = parsedPayload?.meta?.source_file_name || parsedPayload?.source_file_name || 'unknown_file';

    logger.info({ trackingId, sourceSha }, `Creating early ingest tracking entry inside database...`);

    // Register early 'processing' lifecycle hook state
    const trackingRecord = await IngestQueue.create({
        _id: trackingId,
        source_file_name: sourceFileName,
        source_file_sha256: sourceSha,
        status: 'processing',
        source: source,
        error_log: [],
        created_at: new Date(),
        updated_at: new Date()
    });

    try {
        logger.info({ trackingId }, 'Passing structured tree directly into validateQwenOutput()...');
        const validationResult = await validateQwenOutput(parsedPayload);

        if (!validationResult.valid) {
            const errorPayload = validationResult.errors || [{ message: 'Validation pipeline rejected payload properties shape.' }];

            await IngestQueue.updateOne(
                { _id: trackingId },
                {
                    status: 'error',
                    error_log: errorPayload.map(e => ({ message: e.message || JSON.stringify(e), timestamp: new Date() })),
                    updated_at: new Date()
                }
            );

            logger.error({ trackingId }, 'Ingestion aborted due to validation criteria failure.');
            return { success: false, tracking_id: trackingId, status: 'error', errors: errorPayload };
        }

        // STEP 1: Compute content hash for duplicate detection
        const textToHash = rawText || parsedPayload?.raw_text || '';
        let versionInfo = { isUpdate: false, documentVersion: 1, parentDocumentId: null, previousTopics: [] };
        
        if (textToHash && typeof textToHash === 'string') {
            const contentHash = computeContentHash(textToHash);
            logger.info({ contentHash }, 'Content hash computed');

            // STEP 2: Check for exact duplicate (same hash)
            const duplicateCheck = await checkDuplicate(contentHash);
            if (duplicateCheck.isDuplicate) {
                logger.info(
                    { existingDocumentId: duplicateCheck.existingDocument._id },
                    'Duplicate document detected - skipping processing'
                );
                
                await IngestQueue.updateOne(
                    { _id: trackingId },
                    {
                        status: 'duplicate',
                        processing_summary: { 
                            existing_document_id: duplicateCheck.existingDocument.document_metadata.document_id,
                            message: 'Document already exists with identical content'
                        },
                        updated_at: new Date()
                    }
                );
                
                return { 
                    success: true, 
                    tracking_id: trackingId, 
                    status: 'duplicate',
                    existingDocument: duplicateCheck.existingDocument 
                };
            }

            // STEP 3: Build version chain (handles parent_document_id, version increment, archival)
            const docIdToUse = existingDocumentId || parsedPayload?.document_metadata?.document_id;
            versionInfo = await buildVersionChain(docIdToUse, contentHash);
            logger.info(versionInfo, 'Version chain established');
            
            // Attach hash and version info to payload (nested under document_metadata)
            if (!parsedPayload.document_metadata) {
              parsedPayload.document_metadata = {};
            }
            parsedPayload.document_metadata.content_hash = contentHash;
            parsedPayload.document_metadata.document_version = versionInfo.documentVersion.toString();
            parsedPayload.document_metadata.parent_document_id = versionInfo.parentDocumentId;
            parsedPayload.document_metadata.is_latest = true;
        }

        // Step 4 & 5: Run data transformations and collection mappings
        const cleanData = validationResult.data || parsedPayload;
        const bundles = await normalizeDocumentPayload(cleanData);
        const documentRecord = buildDocumentRecord(cleanData, bundles.documentId, bundles.documentSlug, bundles.topicRefs, bundles);

        // Override with version info if available (nested under document_metadata)
        if (versionInfo.documentVersion) {
            if (!documentRecord.document_metadata) {
                documentRecord.document_metadata = {};
            }
            documentRecord.document_metadata.document_version = versionInfo.documentVersion.toString();
            documentRecord.document_metadata.parent_document_id = versionInfo.parentDocumentId;
            documentRecord.document_metadata.is_latest = true;
        }

        // Step 6: Atomic database writes execution
        const writeSummary = await persistIngestion({ 
            documentRecord, 
            bundles,
            versionInfo 
        });

        // Step 7 & 9: Cascade control down to specialized background queues
        logger.info({ trackingId }, 'Enqueuing relational background cascade task handlers...');

        const slugJob = await slugResolverQueue.add(`resolve:${bundles.documentId}`, {
            topic_id: bundles.documentId,
            document_id: bundles.documentId,
            unresolved_count: bundles.topicRefs.length,
            context: 'ingestion_cascade'
        });

        const searchJob = await searchIndexQueue.add(`index:${bundles.documentId}`, {
            topic_id: bundles.documentId,
            document_id: bundles.documentId,
            context: 'ingestion_cascade'
        });

        // Step 10: Complete tracking state modifications
        const completionSummary = {
            document_id: bundles.documentId,
            total_topics_processed: bundles.topicRefs.length,
            slug_resolver_job_id: slugJob.id,
            search_index_job_id: searchJob.id,
            auto_fix_log_count: cleanData.autoFixLog?.length || 0,
            flags_raised: cleanData.flags || [],
            is_update: versionInfo.isUpdate,
            document_version: versionInfo.documentVersion.toString()
        };

        await IngestQueue.updateOne(
            { _id: trackingId },
            {
                status: 'complete',
                processing_summary: completionSummary,
                updated_at: new Date()
            }
        );

        logger.info({ trackingId, document_id: bundles.documentId }, 'Ingestion workflow completed cleanly.');

        return {
            success: true,
            tracking_id: trackingId,
            status: 'complete',
            summary: completionSummary
        };

    } catch (globalPipelineError) {
        logger.error({ trackingId, error: globalPipelineError.message }, 'Critical processing interruption caught during pipeline execution!');

        try {
            await IngestQueue.updateOne(
                { _id: trackingId },
                {
                    status: 'error',
                    error_log: [{ message: globalPipelineError.message, stack: globalPipelineError.stack, timestamp: new Date() }],
                    updated_at: new Date()
                }
            );
        } catch (writeErr) {
            logger.error(`Failed to record fault recovery telemetry to tracking database: ${writeErr.message}`);
        }

        return { success: false, tracking_id: trackingId, status: 'error', error: globalPipelineError.message };
    }
}
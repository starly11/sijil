import { generateEntityId } from '../id.service.js';
import * as logger from '../../utils/logger.js';
import { validateQwenOutput } from '../validation/index.js';
import { normalizeDocumentPayload } from './normalizeDocumentPayload.js';
import { buildDocumentRecord } from './buildDocumentRecord.js';
import { persistIngestion } from './persistIngestion.js';
import { computeContentHash } from './computeContentHash.service.js';
import { checkDuplicate, findLatestVersion } from './checkDuplicate.service.js';
import { buildVersionChain } from './buildVersionChain.service.js';
import { createProfiler, setCurrentProfiler } from '../../utils/performanceProfiler.js';
import { validateTopicStructure, filterJunkTopics } from './validateStructure.service.js';

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
export async function ingestDocument({ payload, source = 'system', existingDocumentId, rawText, batchMode = false, deferCascade = false }) {
    const profiler = createProfiler('ingestion');
    setCurrentProfiler(profiler);
    profiler.startTimer('Total');
    
    let parsedPayload;
    profiler.startTimer('Parse');
    try {
        parsedPayload = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch (err) {
        throw new Error(`Failed to parse target ingestion payload content structure: ${err.message}`);
    }
    profiler.stopTimer('Parse');

    const trackingId = batchMode ? null : generateEntityId('ingest');
    const sourceSha = parsedPayload?.ingest_metadata?.source_file_sha256 
                   || parsedPayload?.meta?.source_file_sha256 
                   || parsedPayload?.source_file_sha256 
                   || `unknown_sha256_${trackingId || Date.now()}`;
    const sourceFileName = parsedPayload?.ingest_metadata?.source_file_name 
                        || parsedPayload?.meta?.source_file_name 
                        || parsedPayload?.source_file_name 
                        || 'unknown_file';

    if (!batchMode) {
        logger.info({ trackingId, sourceSha }, `Creating early ingest tracking entry inside database...`);

        const trackingStartTime = process.hrtime.bigint();
        await IngestQueue.create({
            _id: trackingId,
            source_file_name: sourceFileName,
            source_file_sha256: sourceSha,
            status: 'processing',
            source: source,
            error_log: [],
            created_at: new Date(),
            updated_at: new Date()
        });
        const trackingEndTime = process.hrtime.bigint();
        const trackingDurationMs = Number(trackingEndTime - trackingStartTime) / 1000000;
        profiler.trackMongoOperation(IngestQueue.collection.name, 'create', trackingDurationMs, 1);
    }

    try {
        profiler.startTimer('Validation');
        logger.info({ trackingId }, 'Passing structured tree directly into validateQwenOutput()...');
        // Use lenient mode for batch imports to skip strict Zod validation
        const isBatchImport = source === 'batch_import';
        const validationResult = await validateQwenOutput(parsedPayload, { lenient: isBatchImport });
        profiler.stopTimer('Validation');

        if (!validationResult.valid) {
            const errorPayload = (validationResult.errors || [{ message: 'Validation pipeline rejected payload properties shape.' }])
                .map(e => ({
                    message: e.message || JSON.stringify(e),
                    code: e.code || validationResult.tier,
                    path: e.path,
                }));

            if (!batchMode && trackingId) {
                const updateStartTime = process.hrtime.bigint();
                await IngestQueue.updateOne(
                    { _id: trackingId },
                    {
                        status: 'error',
                        error_log: errorPayload.map(e => ({ message: e.message || JSON.stringify(e), timestamp: new Date() })),
                        updated_at: new Date()
                    }
                );
                const updateEndTime = process.hrtime.bigint();
                const updateDurationMs = Number(updateEndTime - updateStartTime) / 1000000;
                profiler.trackMongoOperation(IngestQueue.collection.name, 'updateOne', updateDurationMs, 0);
            }
            profiler.incrementRepeatedWork('validations');

            logger.error({ trackingId, file: sourceFileName }, 'Ingestion aborted due to validation criteria failure.');
            profiler.stopTimer('Total');
            profiler.printSummary(sourceFileName);
            return { success: false, tracking_id: trackingId, status: 'error', errors: errorPayload };
        }

        // STEP 1.5: Run structural validation to catch Qwen extraction failures
        profiler.startTimer('Structural Validation');
        const structuralValidation = validateTopicStructure(validationResult.data || parsedPayload);
        profiler.stopTimer('Structural Validation');
        
        // Log warnings but don't block ingestion (except for critical errors)
        if (structuralValidation.errors.length > 0) {
            logger.warn({
                errors: structuralValidation.errors,
                file: sourceFileName
            }, 'Structural validation found critical errors');
            
            // Block on duplicate content (critical issue)
            const hasDuplicateError = structuralValidation.errors.some(e => e.code === 'DUPLICATE_CONTENT_DETECTED');
            if (hasDuplicateError && !batchMode) {
                await IngestQueue.updateOne(
                    { _id: trackingId },
                    {
                        status: 'error',
                        error_log: [{ 
                            message: 'Duplicate content detected across topics - this indicates extraction failure',
                            details: structuralValidation.errors,
                            timestamp: new Date()
                        }],
                        updated_at: new Date()
                    }
                );
                profiler.stopTimer('Total');
                profiler.printSummary(sourceFileName);
                return { 
                    success: false, 
                    tracking_id: trackingId, 
                    status: 'error',
                    structural_validation: structuralValidation
                };
            }
        }
        
        if (structuralValidation.warnings.length > 0) {
            logger.warn({
                warnings: structuralValidation.warnings,
                stats: structuralValidation.stats,
                file: sourceFileName
            }, 'Structural validation warnings - ingestion will proceed but quality may be affected');
        }
        
        // Optional: Filter out junk topics if enabled via flag (disabled by default to preserve data)
        // To enable automatic junk topic filtering, uncomment the line below:
        // validationResult.data.topics = filterJunkTopics((validationResult.data || parsedPayload).topics);

        // STEP 1: Compute content hash for duplicate detection (skip in batch mode for speed)
        const textToHash = rawText || parsedPayload?.raw_text || '';
        let versionInfo = { isUpdate: false, documentVersion: 1, parentDocumentId: null, previousTopics: [] };
        
        if (!batchMode && textToHash && typeof textToHash === 'string') {
            const contentHash = computeContentHash(textToHash);
            logger.info({ contentHash }, 'Content hash computed');

            // STEP 2: Check for exact duplicate (same hash)
            profiler.startTimer('Duplicate Detection');
            const duplicateCheck = await checkDuplicate(contentHash);
            profiler.stopTimer('Duplicate Detection');
            if (duplicateCheck.isDuplicate) {
                logger.info(
                    { existingDocumentId: duplicateCheck.existingDocument._id },
                    'Duplicate document detected - skipping processing'
                );
                
                const updateStartTime = process.hrtime.bigint();
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
                const updateEndTime = process.hrtime.bigint();
                const updateDurationMs = Number(updateEndTime - updateStartTime) / 1000000;
                profiler.trackMongoOperation(IngestQueue.collection.name, 'updateOne', updateDurationMs, 0);
                profiler.stopTimer('Total');
                profiler.printSummary(sourceFileName);
                
                return { 
                    success: true, 
                    tracking_id: trackingId, 
                    status: 'duplicate',
                    existingDocument: duplicateCheck.existingDocument 
                };
            }

            // STEP 3: Build version chain (handles parent_document_id, version increment, archival)
            profiler.startTimer('Version Chain');
            const docIdToUse = existingDocumentId || parsedPayload?.document_metadata?.document_id;
            versionInfo = await buildVersionChain(docIdToUse, contentHash);
            profiler.stopTimer('Version Chain');
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
        profiler.startTimer('Normalization');
        const cleanData = validationResult.data || parsedPayload;
        const bundles = await normalizeDocumentPayload(cleanData);
        profiler.stopTimer('Normalization');
        
        profiler.startTimer('Document Builder');
        const documentRecord = buildDocumentRecord(cleanData, bundles.documentId, bundles.documentSlug, bundles.topicRefs, bundles);
        profiler.stopTimer('Document Builder');

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
        profiler.startTimer('MongoDB Persistence');
        const writeSummary = await persistIngestion({ 
            documentRecord, 
            bundles,
            versionInfo,
            profiler,
            skipTransaction: batchMode
        });
        profiler.stopTimer('MongoDB Persistence');

        let slugJob = null;
        let searchJob = null;

        if (!deferCascade) {
            logger.info({ trackingId }, 'Enqueuing relational background cascade task handlers...');

            profiler.startTimer('Slug Queue');
            slugJob = await slugResolverQueue.add(`resolve:${bundles.documentId}`, {
                topic_id: bundles.documentId,
                document_id: bundles.documentId,
                unresolved_count: bundles.topicRefs.length,
                context: 'ingestion_cascade'
            });
            profiler.stopTimer('Slug Queue');

            profiler.startTimer('Search Queue');
            searchJob = await searchIndexQueue.add(`index:${bundles.documentId}`, {
                topic_id: bundles.documentId,
                document_id: bundles.documentId,
                context: 'ingestion_cascade'
            });
            profiler.stopTimer('Search Queue');
        }

        // Step 10: Complete tracking state modifications
        const completionSummary = {
            document_id: bundles.documentId,
            total_topics_processed: bundles.topicRefs.length,
            slug_resolver_job_id: slugJob?.id || null,
            search_index_job_id: searchJob?.id || null,
            auto_fix_log_count: validationResult.autoFixLog?.length || 0,
            flags_raised: validationResult.flags || [],
            structural_warnings: validationResult.structuralWarnings || [],
            is_update: versionInfo.isUpdate,
            document_version: versionInfo.documentVersion.toString()
        };

        if (!batchMode && trackingId) {
            profiler.startTimer('Batch Update');
            const batchUpdateStartTime = process.hrtime.bigint();
            await IngestQueue.updateOne(
                { _id: trackingId },
                {
                    status: 'complete',
                    processing_summary: completionSummary,
                    updated_at: new Date()
                }
            );
            const batchUpdateEndTime = process.hrtime.bigint();
            const batchUpdateDurationMs = Number(batchUpdateEndTime - batchUpdateStartTime) / 1000000;
            profiler.trackMongoOperation(IngestQueue.collection.name, 'updateOne', batchUpdateDurationMs, 0);
            profiler.stopTimer('Batch Update');
        }

        logger.info({ trackingId, document_id: bundles.documentId, file: sourceFileName }, 'Ingestion workflow completed cleanly.');

        profiler.stopTimer('Total');
        profiler.printSummary(sourceFileName);

        return {
            success: true,
            tracking_id: trackingId,
            status: 'complete',
            summary: completionSummary
        };
    } catch (globalPipelineError) {
        logger.error({ trackingId, error: globalPipelineError.message }, 'Critical processing interruption caught during pipeline execution!');
        profiler.stopTimer('Total');
        profiler.printSummary(sourceFileName);

        try {
            if (!batchMode && trackingId) {
                const errorUpdateStartTime = process.hrtime.bigint();
                await IngestQueue.updateOne(
                    { _id: trackingId },
                    {
                        status: 'error',
                        error_log: [{ message: globalPipelineError.message, stack: globalPipelineError.stack, timestamp: new Date() }],
                        updated_at: new Date()
                    }
                );
                const errorUpdateEndTime = process.hrtime.bigint();
                const errorUpdateDurationMs = Number(errorUpdateEndTime - errorUpdateStartTime) / 1000000;
                profiler.trackMongoOperation(IngestQueue.collection.name, 'updateOne', errorUpdateDurationMs, 0);
            }
        } catch (writeErr) {
            logger.error(`Failed to record fault recovery telemetry to tracking database: ${writeErr.message}`);
        }

        return { success: false, tracking_id: trackingId, status: 'error', error: globalPipelineError.message };
    }
}

import * as logger from '../../utils/logger.js';
import { ingestDocument } from '../../services/ingestion/ingestDocument.service.js';
import { fetchRepositoryTree, fetchGitHubJsonFile } from '../../services/import/githubFetch.service.js';
import ImportBatch from '../../models/importBatch.model.js';
import { slugResolverQueue, searchIndexQueue } from '../../queues/index.js';
import { recomputeStats } from '../../services/stats/platformStats.service.js';
import { getCurrentProfiler, setCurrentProfiler, createProfiler } from '../../utils/performanceProfiler.js';

const BATCH_SAVE_INTERVAL = 5;

async function saveBatchProgress(batch) {
    batch.markModified('successful_files');
    batch.markModified('failed_files');
    batch.markModified('progress');
    await batch.save();
}

/**
 * Handles incoming JSON payload transformation logic.
 * Supports both single document ingestion and batch import jobs.
 * @param {import('bullmq').Job} job
 */
export default async function processIngestion(job) {
    const jobType = job.name === 'batch_import' ? 'batch_import' : (job.data.job_type || 'single');

    if (jobType === 'batch_import') {
        return await processBatchImport(job);
    }

    logger.info({ queue: 'ingestion', jobId: job.id, event: 'processor_start' }, `Starting ingestion task execution for ID: ${job.data.ingest_id}`);

    try {
        await job.updateProgress(10);

        const result = await ingestDocument({
            payload: job.data.payload,
            source: job.data.source || 'queue_ingestion'
        });

        await job.updateProgress(100);

        logger.info({ queue: 'ingestion', jobId: job.id, success: result.success }, 'Single document ingestion completed');

        return {
            queue: 'ingestion',
            jobId: job.id,
            status: result.success ? 'completed' : 'failed',
            processed_at: new Date().toISOString(),
            result: result
        };

    } catch (error) {
        logger.error({ err: error, queue: 'ingestion', jobId: job.id }, 'Single document ingestion failed');
        throw error;
    }
}

function resolveBranch(batch) {
    const branchMatch = batch.repo_url.match(/\/tree\/([^/]+)/);
    return branchMatch ? branchMatch[1] : 'main';
}

function filterJsonFiles(tree) {
    return tree
        .filter(f => f.type === 'blob' && f.path.endsWith('.json'))
        .map(f => f.path)
        .filter(path => !path.includes('package.json') && !path.includes('tsconfig.json'));
}

async function resolveFileList(batch, github_token, branch, context) {
    if (batch.document_files && batch.document_files.length > 0) {
        logger.info({ ...context, total_files: batch.document_files.length, source: 'cached' }, 'Using cached file list from preview');
        return { files: batch.document_files, tree: null };
    }

    const tree = await fetchRepositoryTree(github_token, batch.repo_owner, batch.repo_name, branch, context);
    const files = filterJsonFiles(tree);
    logger.info({ ...context, total_files: files.length, source: 'github_tree' }, 'Resolved file list from GitHub tree');
    return { files, tree };
}

async function enqueueCascadeJobs(documentIds) {
    const jobs = documentIds.map(documentId =>
        Promise.all([
            slugResolverQueue.add(`resolve:${documentId}`, {
                topic_id: documentId,
                document_id: documentId,
                context: 'batch_import_cascade'
            }, {
                jobId: `slug:resolve:${documentId}`,
                removeOnComplete: 100,
                removeOnFail: 50,
            }),
            searchIndexQueue.add(`index:${documentId}`, {
                topic_id: documentId,
                document_id: documentId,
                context: 'batch_import_cascade'
            }, {
                jobId: `search:index:${documentId}`,
                removeOnComplete: 100,
                removeOnFail: 50,
            }),
        ])
    );
    await Promise.all(jobs);
}

/**
 * Process batch import job — one file at a time with resumable progress.
 * @param {import('bullmq').Job} job
 */
async function processBatchImport(job) {
    const { batch_id, github_token, retry_only } = job.data;

    logger.info({ queue: 'ingestion', jobId: job.id, batch_id, retry_only }, 'Starting batch import processing');

    const profiler = createProfiler(`batch_${batch_id}`);
    setCurrentProfiler(profiler);
    profiler.startTimer('Total');

    await job.updateProgress(5);

    let batch;
    try {
        batch = await ImportBatch.findOne({ batch_id });

        if (!batch) {
            throw new Error(`ImportBatch not found: ${batch_id}`);
        }

        if (batch.status === 'CANCELLED') {
            profiler.stopTimer('Total');
            profiler.printSummary(`Batch ${batch_id}`);
            return { status: 'cancelled', reason: 'Batch was cancelled' };
        }

        if (batch.status === 'COMPLETED' && !retry_only) {
            profiler.stopTimer('Total');
            profiler.printSummary(`Batch ${batch_id}`);
            return { status: 'skipped', reason: `Batch already ${batch.status}` };
        }

        if (retry_only && batch.failed_files.length > 0) {
            batch.status = 'RETRYING';
            batch.progress.importing.status = 'in_progress';
            await batch.save();
        } else if (batch.status === 'QUEUED') {
            batch.status = 'IMPORTING';
            batch.progress.importing.status = 'in_progress';
            await batch.save();
        }

        const branch = resolveBranch(batch);
        logger.info({ batch_id, branch }, 'Using branch for import');

        await job.updateProgress(10);
        const { files: allFiles, tree } = await resolveFileList(
            batch,
            github_token,
            branch,
            { batch_id }
        );

        let filesToProcess;
        if (retry_only && batch.failed_files.length > 0) {
            const failedPaths = new Set(batch.failed_files.map(f => f.file_path));
            filesToProcess = allFiles.filter(path => failedPaths.has(path));
            logger.info({ batch_id, count: filesToProcess.length }, 'Retrying failed files only');
        } else {
            const successfulPaths = new Set(batch.successful_files.map(f => f.file_path));
            filesToProcess = allFiles.filter(path => !successfulPaths.has(path));
        }

        if (filesToProcess.length === 0) {
            batch.status = 'COMPLETED';
            batch.completed_at = new Date();
            await batch.save();
            profiler.stopTimer('Total');
            profiler.printSummary(`Batch ${batch_id}`);
            return { status: 'completed', reason: 'No files to process' };
        }

        const totalFiles = filesToProcess.length;
        let processedCount = 0;
        let successCount = batch.successful_files.length;
        let failCount = batch.failed_files.length;
        const importedDocumentIds = new Set();

        logger.info(
            { batch_id, total: totalFiles, existing_success: successCount },
            'Starting file processing loop'
        );

        for (const filePath of filesToProcess) {
            try {
                await job.updateProgress(10 + Math.round((processedCount / totalFiles) * 80));

                logger.info({ batch_id, file: filePath }, 'Fetching and ingesting document');
                const doc = await fetchGitHubJsonFile(
                    github_token,
                    batch.repo_owner,
                    batch.repo_name,
                    filePath,
                    branch,
                    { batch_id, file: filePath }
                );

                const fileFromTree = tree?.find(f => f.path === filePath);
                const fileSha = fileFromTree?.sha || batch.commit_sha;

                const enrichedDoc = {
                    ...doc,
                    ingest_metadata: {
                        ...(doc.ingest_metadata || doc.meta || {}),
                        source_file_name: filePath,
                        source_file_sha256: fileSha || `batch_${batch_id}_${filePath}`
                    }
                };

                if (!enrichedDoc.topics && enrichedDoc.container?.topics) {
                    enrichedDoc.topics = enrichedDoc.container.topics;
                }
                if (!Array.isArray(enrichedDoc.topics)) {
                    enrichedDoc.topics = [];
                }

                const result = await ingestDocument({
                    payload: enrichedDoc,
                    source: 'batch_import',
                    batchMode: true,
                    deferCascade: true
                });

                processedCount++;

                if (result.success) {
                    batch.successful_files.push({
                        file_path: filePath,
                        document_id: result.summary?.document_id,
                        ingested_at: new Date()
                    });
                    successCount++;
                    batch.failed_files = batch.failed_files.filter(f => f.file_path !== filePath);

                    if (result.summary?.document_id) {
                        importedDocumentIds.add(result.summary.document_id);
                    }

                    batch.imported_topics = (batch.imported_topics || 0) + (result.summary?.total_topics_processed || 0);
                    batch.progress.importing.topics = batch.imported_topics;

                    logger.info(
                        { batch_id, file: filePath, document_id: result.summary?.document_id },
                        'Document imported successfully'
                    );
                } else {
                    const errMsg = result.errors?.map(e => e.message).join('; ')
                        || result.error
                        || 'Unknown ingestion error';
                    trackFailedFile(batch, filePath, errMsg, result.errors?.[0]?.code);
                    failCount++;
                    logger.warn(
                        { batch_id, file: filePath, error: result.error || result.errors?.[0]?.message },
                        'Document ingestion failed'
                    );
                }

                batch.imported_documents = successCount;
                batch.progress.importing.documents = successCount;
                batch.progress.importing.percentage = Math.round((successCount / allFiles.length) * 100);

                if ((processedCount % BATCH_SAVE_INTERVAL === 0) || processedCount === totalFiles) {
                    await saveBatchProgress(batch);
                }

            } catch (error) {
                logger.error({
                    batch_id,
                    file: filePath,
                    message: error?.message,
                    stack: error?.stack
                }, 'Document processing error');

                processedCount++;
                trackFailedFile(batch, filePath, error?.message || 'Unknown error');
                failCount++;

                if ((processedCount % BATCH_SAVE_INTERVAL === 0) || processedCount === totalFiles) {
                    await saveBatchProgress(batch);
                }
            }
        }

        if (importedDocumentIds.size > 0) {
            const docIds = [...importedDocumentIds];
            logger.info({ batch_id, count: docIds.length }, 'Enqueuing deferred cascade jobs');
            await enqueueCascadeJobs(docIds);
            recomputeStats().catch(err => logger.warn({ err: err.message, batch_id }, 'Batch stats recompute failed'));
        }

        if (failCount === 0) {
            batch.status = 'COMPLETED';
        } else if (successCount > 0) {
            batch.status = 'PARTIAL_SUCCESS';
        } else {
            batch.status = 'FAILED';
        }

        batch.completed_at = new Date();
        batch.progress.importing.status = 'completed';
        batch.progress.importing.percentage = 100;
        batch.progress.indexing = { status: 'completed', percentage: 100 };
        batch.failed_documents = failCount;

        batch.report = {
            duration_ms: batch.completed_at - batch.started_at,
            total_files: allFiles.length,
            successful: successCount,
            failed: failCount,
            documents_imported: batch.imported_documents,
            topics_imported: batch.imported_topics,
            assets_imported: batch.imported_assets,
            assessments_imported: batch.imported_assessments,
            commit_sha: batch.commit_sha
        };

        await saveBatchProgress(batch);
        await job.updateProgress(100);

        logger.info(
            { batch_id, status: batch.status, success: successCount, failed: failCount },
            'Batch import completed'
        );

        profiler.stopTimer('Total');
        profiler.printSummary(`Batch ${batch_id}`);

        return {
            queue: 'ingestion',
            jobId: job.id,
            batch_id,
            status: batch.status,
            processed_at: new Date().toISOString(),
            summary: {
                total: allFiles.length,
                successful: successCount,
                failed: failCount
            }
        };

    } catch (error) {
        logger.error({ err: error, batch_id, stack: error.stack }, 'Batch import processing failed');

        const failedBatch = await ImportBatch.findOne({ batch_id });
        if (failedBatch) {
            failedBatch.status = 'FAILED';
            failedBatch.progress.importing.status = 'failed';
            failedBatch.completed_at = new Date();
            failedBatch.report = {
                ...(failedBatch.report || {}),
                fatal_error: error.message,
                failed_at: new Date().toISOString()
            };
            await failedBatch.save();
        }

        profiler.stopTimer('Total');
        profiler.printSummary(`Batch ${batch_id}`);

        throw error;
    }
}

function trackFailedFile(batch, filePath, errorMessage, errorCode = null) {
    const fullError = errorCode ? `[${errorCode}] ${errorMessage}` : errorMessage;
    const existingFailed = batch.failed_files.find(f => f.file_path === filePath);
    if (existingFailed) {
        existingFailed.retry_count = (existingFailed.retry_count || 1) + 1;
        existingFailed.error = fullError;
        existingFailed.failed_at = new Date();
    } else {
        batch.failed_files.push({
            file_path: filePath,
            error: fullError,
            failed_at: new Date(),
            retry_count: 1
        });
    }
}

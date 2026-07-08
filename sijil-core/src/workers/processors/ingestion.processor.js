import axios from 'axios';
import * as logger from '../../utils/logger.js';
import { ingestDocument } from '../../services/ingestion/ingestDocument.service.js';
import ImportBatch from '../../models/importBatch.model.js';


const RETRY_CONFIG = {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    timeoutMs: 30000
};

function classifyError(error) {
    const status = error.response?.status;
    const code = error.code;
    
    if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'ENOTFOUND') {
        return { isRetryable: true, category: 'NETWORK_ERROR' };
    }
    if (status >= 500 && status < 600) {
        return { isRetryable: true, category: 'SERVER_ERROR' };
    }
    if (status === 429) {
        return { isRetryable: true, category: 'RATE_LIMITED' };
    }
    if (status >= 400 && status < 500) {
        return { isRetryable: false, category: 'CLIENT_ERROR' };
    }
    return { isRetryable: true, category: 'UNKNOWN_ERROR' };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoffDelay(attempt) {
    const exponentialDelay = Math.min(
        RETRY_CONFIG.initialDelayMs * Math.pow(2, attempt),
        RETRY_CONFIG.maxDelayMs
    );
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(exponentialDelay + jitter);
}


/**
 * Handles incoming JSON payload transformation logic.
 * Supports both single document ingestion and batch import jobs.
 * @param {import('bullmq').Job} job - Contextual properties reflecting target task configurations.
 */
export default async function processIngestion(job) {
    // Check both job.name (from add() second argument) AND job.data.job_type
    const jobType = job.name === 'batch_import' ? 'batch_import' : (job.data.job_type || 'single');
    
    if (jobType === 'batch_import') {
        return await processBatchImport(job);
    }
    
    // Original single document ingestion flow
    logger.info({ queue: 'ingestion', jobId: job.id, event: 'processor_start' }, `Starting ingestion task execution for ID: ${job.data.ingest_id}`);

    try {
        await job.updateProgress(10);

        // Call the actual ingestDocument service
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

/**
 * Fetch file content from GitHub Raw URL
 * @param {string} token - GitHub PAT
 * @param {string} owner - Repository owner
 * @param {string} name - Repository name
 * @param {string} path - File path
 * @param {string} branch - Branch name (default: main)
 * @returns {Promise<Object>} Parsed JSON content
 */
async function fetchGitHubFile(token, owner, name, path, branch = 'main', context = {}) {
    const url = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${path}`;
    let lastError = null;
    
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
            logger.debug({ ...context, url, attempt: attempt + 1 }, 'Fetching file from GitHub');
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3.raw',
                    'User-Agent': 'sijil-import-service/1.0'
                },
                timeout: RETRY_CONFIG.timeoutMs,
                validateStatus: (status) => status < 500
            });
            
            if (response.status >= 400 && response.status < 500) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }
            
            return response.data;
            
        } catch (error) {
            lastError = error;
            const { isRetryable, category } = classifyError(error);
            
            logger.warn({
                ...context,
                attempt: attempt + 1,
                error: error.message,
                category,
                isRetryable
            }, `GitHub fetch failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`);
            
            if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
                logger.error({ ...context, err: error, category }, 'GitHub fetch failed permanently');
                throw error;
            }
            
            const delay = calculateBackoffDelay(attempt);
            logger.info({ ...context, delayMs: delay }, 'Waiting before retry');
            await sleep(delay);
        }
    }
    
    throw lastError || new Error('Unknown error during GitHub fetch');
}

/**
 * Get repository tree from GitHub API
 * @param {string} token - GitHub PAT
 * @param {string} owner - Repository owner
 * @param {string} name - Repository name
 * @param {string} branch - Branch name (default: main)
 * @returns {Promise<Array>} List of files
 */
async function getRepoTree(token, owner, name, branch = 'main', context = {}) {
    const url = `https://api.github.com/repos/${owner}/${name}/git/trees/${branch}?recursive=1`;
    let lastError = null;
    
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
            logger.debug({ ...context, url, repo: `${owner}/${name}`, branch, attempt: attempt + 1 }, 'Fetching repository tree');
            
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'sijil-import-service/1.0'
                },
                timeout: RETRY_CONFIG.timeoutMs,
                validateStatus: (status) => status < 500
            });
            
            if (response.status >= 400 && response.status < 500) {
                throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
            }
            
            return response.data.tree || [];
            
        } catch (error) {
            lastError = error;
            const { isRetryable, category } = classifyError(error);
            
            logger.warn({
                ...context,
                attempt: attempt + 1,
                error: error.message,
                category,
                isRetryable
            }, `Repo tree fetch failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`);
            
            if (!isRetryable || attempt >= RETRY_CONFIG.maxRetries) {
                logger.error({ ...context, err: error, category }, 'Repo tree fetch failed permanently');
                throw error;
            }
            
            const delay = calculateBackoffDelay(attempt);
            logger.info({ ...context, delayMs: delay }, 'Waiting before retry');
            await sleep(delay);
        }
    }
    
    throw lastError || new Error('Unknown error during repo tree fetch');
}

/**
 * Process batch import job
 * Actually processes each file by calling ingestDocument()
 * @param {import('bullmq').Job} job
 */
async function processBatchImport(job) {
    const { batch_id, github_token, admin_id, retry_only } = job.data;
    
    logger.info({ queue: 'ingestion', jobId: job.id, batch_id, retry_only }, 'Starting batch import processing');
    
    await job.updateProgress(5);
    
    let batch;
    try {
        batch = await ImportBatch.findOne({ batch_id });
        
        if (!batch) {
            throw new Error(`ImportBatch not found: ${batch_id}`);
        }
        
        // Handle different batch states appropriately
        if (batch.status === 'CANCELLED') {
            logger.warn({ batch_id, status: batch.status }, 'Batch was cancelled before starting');
            return { status: 'cancelled', reason: 'Batch was cancelled' };
        }
        
        if (batch.status === 'COMPLETED' && !retry_only) {
            logger.warn({ batch_id, status: batch.status }, 'Batch already completed');
            return { status: 'skipped', reason: `Batch already ${batch.status}` };
        }
        
        // Update status based on current state
        if (retry_only && batch.failed_files.length > 0) {
            batch.status = 'RETRYING';
            batch.progress.importing.status = 'in_progress';
            await batch.save();
        } else if (batch.status === 'QUEUED') {
            // First time processing - update from QUEUED to IMPORTING
            batch.status = 'IMPORTING';
            batch.progress.importing.status = 'in_progress';
            await batch.save();
        }
        // If status is already IMPORTING or RETRYING, continue without changing
        
        // Determine branch from repo_url or default to main
        const branchMatch = batch.repo_url.match(/\/tree\/([^/]+)/);
        const branch = branchMatch ? branchMatch[1] : 'main';
        
        logger.info({ batch_id, branch }, 'Using branch for import');
        
        // Get repository tree
        await job.updateProgress(10);
        const tree = await getRepoTree(github_token, batch.repo_owner, batch.repo_name, branch, { batch_id });
        
        // Get all JSON files
        const allFiles = tree
            .filter(f => f.type === 'blob' && f.path.endsWith('.json'))
            .map(f => f.path)
            .filter(path => !path.includes('package.json') && !path.includes('tsconfig.json'));
        
        logger.info({ batch_id, total_files: allFiles.length }, 'Found JSON files to process');
        
        // Determine which files to process
        let filesToProcess;
        
        if (retry_only && batch.failed_files.length > 0) {
            // Only process previously failed files
            const failedPaths = new Set(batch.failed_files.map(f => f.file_path));
            filesToProcess = allFiles.filter(path => failedPaths.has(path));
            logger.info({ batch_id, count: filesToProcess.length }, 'Retrying failed files only');
        } else {
            // Process all files except already successful ones (resumable)
            const successfulPaths = new Set(batch.successful_files.map(f => f.file_path));
            filesToProcess = allFiles.filter(path => !successfulPaths.has(path));
        }
        
        if (filesToProcess.length === 0) {
            logger.info({ batch_id }, 'No files to process');
            batch.status = 'COMPLETED';
            batch.completed_at = new Date();
            await batch.save();
            return { status: 'completed', reason: 'No files to process' };
        }
        
        const totalFiles = filesToProcess.length;
        let processedCount = 0;
        let successCount = batch.successful_files.length;
        let failCount = batch.failed_files.length;
        
        logger.info(
            { batch_id, total: totalFiles, existing_success: successCount },
            'Starting file processing loop'
        );
        
        // Process each file with batching to reduce database writes
        const BATCH_SAVE_INTERVAL = 5;
        
        for (const filePath of filesToProcess) {
            try {
                await job.updateProgress(10 + Math.round((processedCount / totalFiles) * 80));
                
                logger.info({ batch_id, file: filePath }, '==== STARTING FILE PROCESSING ===');
                
                // Fetch document content from GitHub
                logger.info({ batch_id, file: filePath }, 'Fetching and ingesting document');
                const doc = await fetchGitHubFile(
                    github_token, 
                    batch.repo_owner, 
                    batch.repo_name, 
                    filePath, 
                    branch,
                    { batch_id, file: filePath }
                );
                
                // Get the file SHA to use as source_file_sha256!
                const fileFromTree = tree.find(f => f.path === filePath);
                const fileSha = fileFromTree ? fileFromTree.sha : null;
                
                // Add ingest_metadata to doc with source info (matching the schema format)
                const enrichedDoc = {
                    ...doc,
                    ingest_metadata: {
                        ...(doc.ingest_metadata || doc.meta || {}),
                        source_file_name: filePath,
                        source_file_sha256: fileSha || `batch_${batch_id}_${filePath}`
                    }
                };
                
                // Add extra safe guards to ensure topics is an array
                if (!enrichedDoc.topics && enrichedDoc.container?.topics) {
                    enrichedDoc.topics = enrichedDoc.container.topics;
                }
                if (!Array.isArray(enrichedDoc.topics)) {
                    enrichedDoc.topics = [];
                }
                
                // Call existing ingestDocument service - SINGLE SOURCE OF TRUTH
                logger.info({ batch_id, file: filePath, has_topics: !!enrichedDoc.topics, topic_count: enrichedDoc.topics.length }, 'Calling ingestDocument');
                
                try {
                    const result = await ingestDocument({
                        payload: enrichedDoc,
                        source: 'batch_import',
                        batch_id
                    });
                    logger.info({ batch_id, file: filePath, success: result.success, summary: result.summary }, 'IngestDocument completed');

                    processedCount++;

                    if (result.success) {
                    // Track successful file
                    batch.successful_files.push({
                        file_path: filePath,
                        document_id: result.summary?.document_id,
                        ingested_at: new Date()
                    });
                    successCount++;
                    
                    // Remove from failed files if it was there (retry case)
                    batch.failed_files = batch.failed_files.filter(f => f.file_path !== filePath);
                    
                    logger.info(
                        { batch_id, file: filePath, document_id: result.summary?.document_id },
                        'Document imported successfully'
                    );
                } else {
                    // Track failed file
                    const existingFailed = batch.failed_files.find(f => f.file_path === filePath);
                    if (existingFailed) {
                        existingFailed.retry_count = (existingFailed.retry_count || 1) + 1;
                        existingFailed.error = result.error || result.errors?.[0]?.message || 'Unknown ingestion error';
                        existingFailed.failed_at = new Date();
                    } else {
                        batch.failed_files.push({
                            file_path: filePath,
                            error: result.error || result.errors?.[0]?.message || 'Unknown ingestion error',
                            failed_at: new Date(),
                            retry_count: 1
                        });
                    }
                    failCount++;
                    
                    logger.warn(
                        { batch_id, file: filePath, error: result.error || result.errors?.[0]?.message },
                        'Document ingestion failed'
                    );
                }
                
                // Update progress counters in memory
                batch.imported_documents = successCount;
                batch.progress.importing.documents = successCount;
                batch.progress.importing.percentage = Math.round((successCount / allFiles.length) * 100);
                
                // Batch database saves to reduce write load
                if ((processedCount % BATCH_SAVE_INTERVAL === 0) || processedCount === totalFiles) {
                    await batch.save();
                    logger.debug({ batch_id, processedCount, interval: BATCH_SAVE_INTERVAL }, 'Batch progress saved to database');
                }
                
                logger.info({ batch_id, file: filePath }, '==== FILE PROCESSING COMPLETE ===');
                
            } catch (error) {
                logger.error({ err: error, batch_id, file: filePath, stack: error.stack }, '=== DOCUMENT PROCESSING ERROR ===');
                processedCount++;
                
                // Track failed file
                const existingFailed = batch.failed_files.find(f => f.file_path === filePath);
                if (existingFailed) {
                    existingFailed.retry_count = (existingFailed.retry_count || 1) + 1;
                    existingFailed.error = error.message;
                    existingFailed.failed_at = new Date();
                } else {
                    batch.failed_files.push({
                        file_path: filePath,
                        error: error.message,
                        failed_at: new Date(),
                        retry_count: 1
                    });
                }
                failCount++;
                
                // Continue processing - don't crash the batch
                if ((processedCount % BATCH_SAVE_INTERVAL === 0) || processedCount === totalFiles) {
                    await batch.save();
                }
            }
        }
        
        // Determine final status
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
        
        // Generate final report
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
        
        await batch.save();
        
        logger.info(
            { batch_id, status: batch.status, success: successCount, failed: failCount },
            'Batch import completed'
        );
        
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
        
        // Mark batch as FAILED on worker crash or unexpected error
        const batch = await ImportBatch.findOne({ batch_id });
        if (batch) {
            batch.status = 'FAILED';
            batch.progress.importing.status = 'failed';
            batch.completed_at = new Date();
            
            // Add error to report if it exists
            if (!batch.report) {
                batch.report = {};
            }
            batch.report.fatal_error = error.message;
            batch.report.failed_at = new Date().toISOString();
            
            await batch.save();
        }
        
        throw error;
    }
}
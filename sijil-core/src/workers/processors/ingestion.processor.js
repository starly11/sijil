import axios from 'axios';
import * as logger from '../../utils/logger.js';
import { ingestDocument } from '../../services/ingestion/ingestDocument.service.js';
import ImportBatch from '../../models/importBatch.model.js';

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
async function fetchGitHubFile(token, owner, name, path, branch = 'main') {
    const url = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${path}`;
    
    logger.debug({ url, path }, 'Fetching file from GitHub');
    
    const response = await axios.get(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 30000 // 30 second timeout
    });
    
    return response.data;
}

/**
 * Get repository tree from GitHub API
 * @param {string} token - GitHub PAT
 * @param {string} owner - Repository owner
 * @param {string} name - Repository name
 * @param {string} branch - Branch name (default: main)
 * @returns {Promise<Array>} List of files
 */
async function getRepoTree(token, owner, name, branch = 'main') {
    const url = `https://api.github.com/repos/${owner}/${name}/git/trees/${branch}?recursive=1`;
    
    logger.debug({ url, repo: `${owner}/${name}`, branch }, 'Fetching repository tree');
    
    const response = await axios.get(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        },
        timeout: 30000
    });
    
    return response.data.tree || [];
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
    
    try {
        const batch = await ImportBatch.findOne({ batch_id });
        
        if (!batch) {
            throw new Error(`ImportBatch not found: ${batch_id}`);
        }
        
        if (batch.status === 'COMPLETED' && !retry_only) {
            logger.warn({ batch_id, status: batch.status }, 'Batch already completed');
            return { status: 'skipped', reason: `Batch already ${batch.status}` };
        }
        
        // Determine branch from repo_url or default to main
        const branchMatch = batch.repo_url.match(/\/tree\/([^/]+)/);
        const branch = branchMatch ? branchMatch[1] : 'main';
        
        logger.info({ batch_id, branch }, 'Using branch for import');
        
        // Get repository tree
        await job.updateProgress(10);
        const tree = await getRepoTree(github_token, batch.repo_owner, batch.repo_name, branch);
        
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
        
        // Process each file
        for (const filePath of filesToProcess) {
            try {
                await job.updateProgress(10 + Math.round((processedCount / totalFiles) * 80));
                
                logger.info({ batch_id, file: filePath }, '==== STARTING FILE PROCESSING ===');
                
                // Fetch document content from GitHub
                logger.info({ batch_id, file: filePath }, 'Fetching and ingesting document');
                const doc = await fetchGitHubFile(github_token, batch.repo_owner, batch.repo_name, filePath, branch);
                
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
                const result = await ingestDocument({ 
                    payload: enrichedDoc, 
                    source: 'batch_import',
                    batch_id 
                });
                logger.info({ batch_id, file: filePath, success: result.success }, 'IngestDocument completed');
                
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
                
                // Update progress counters
                batch.imported_documents = successCount;
                batch.progress.importing.documents = successCount;
                batch.progress.importing.percentage = Math.round((successCount / allFiles.length) * 100);
                
                // Save after every file for real-time progress
                await batch.save();
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
                await batch.save();
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
        logger.error({ err: error, batch_id }, 'Batch import processing failed');
        
        const batch = await ImportBatch.findOne({ batch_id });
        if (batch) {
            batch.status = 'FAILED';
            batch.progress.importing.status = 'failed';
            await batch.save();
        }
        
        throw error;
    }
}
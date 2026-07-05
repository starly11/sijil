import { fetch } from 'undici';
import * as logger from '../../utils/logger.js';
import { parseRepoUrl, scanRepository, validateRepositoryStructure } from './repositoryScanner.service.js';
import { fetchFileContent } from './importValidation.service.js';
import { validateQwenOutput } from '../../services/validation/index.js';
import ImportBatch from '../../models/importBatch.model.js';
import AuditLog from '../../models/auditLog.model.js';
import { generateId } from '../../services/id.service.js';

/**
 * Generate unique batch ID
 * @returns {string}
 */
function generateBatchId() {
    return `batch_${generateId('export')}`;
}

/**
 * Preview import from GitHub repository
 * @param {Object} params
 * @param {string} params.repo_url - GitHub repository URL
 * @param {string} params.github_token - GitHub PAT
 * @param {string} params.admin_id - Admin user ID
 * @param {string} params.ip_address - Request IP address
 * @returns {Promise<{
 *   batch_id: string,
 *   documents_found: number,
 *   topics_found: number,
 *   files_preview: Array
 * }>}
 */
export async function previewImport({ 
    repo_url, 
    branch,
    path,
    github_token,
    admin_id = 'bootstrap_admin',
    ip_address = null
}) {
    let batchId = null;

    try {
        // Parse repository URL
        const repo = parseRepoUrl(repo_url);
        
        // Override branch if provided
        if (branch) {
            repo.branch = branch;
        }
        
        // Scan repository with optional path filter
        const scanResult = await scanRepository(github_token, repo, path);
        
        // Validate repository structure
        const structureValidation = validateRepositoryStructure(scanResult);
        
        if (!structureValidation.valid) {
            throw new Error(structureValidation.errors.join('; '));
        }

        // Fetch and validate document contents
        const documents = [];
        const files = [];
        const allErrors = [];
        const allWarnings = [];

        for (const filePath of scanResult.documents) {
            try {
                const doc = await fetchFileContent(github_token, repo.owner, repo.name, filePath);
                documents.push(doc);
                files.push(filePath);

                // Use the same validation as actual ingestion!
                const validationResult = await validateQwenOutput(doc);
                if (!validationResult.valid) {
                    allErrors.push(...(validationResult.errors || []).map(e => ({
                        file: filePath,
                        message: e.message || JSON.stringify(e)
                    })));
                }
                if (validationResult.flags && validationResult.flags.length > 0) {
                    allWarnings.push(...validationResult.flags.map(w => ({
                        file: filePath,
                        message: JSON.stringify(w)
                    })));
                }
            } catch (error) {
                logger.error({ err: error, file: filePath }, 'Failed to fetch document');
            }
        }

        // Calculate stats from actual documents
        let total_topics = 0;
        let total_assets = 0;
        let total_assessments = 0;

        for (const doc of documents) {
            const topics = doc.topics || doc.container?.topics || [];
            total_topics += topics.length;
            
            for (const topic of topics) {
                // Count assets
                if (topic.assets) {
                    total_assets += topic.assets.length;
                }
                
                // Also count images/figures in content blocks
                if (topic.content_blocks) {
                    total_assets += topic.content_blocks.filter(
                        block => block.type === 'image' || block.type === 'figure'
                    ).length;
                }

                // Count assessments (mcqs, flashcards, etc)
                const mcqs = topic.assessments?.mcqs || [];
                const flashcards = topic.assessments?.flashcards || [];
                total_assessments += mcqs.length + flashcards.length;
            }
        }

        // Create ImportBatch record in PENDING state
        batchId = generateBatchId();
        await ImportBatch.create({
            batch_id: batchId,
            repo_url,
            repo_owner: repo.owner,
            repo_name: repo.name,
            commit_sha: scanResult.commit_sha,
            status: 'PENDING',
            total_documents: documents.length,
            total_topics,
            total_assets,
            total_assessments,
            warnings: allWarnings.map(w => ({
                type: 'schema_warning',
                message: w.message,
                file_path: w.file,
                topic_id: null
            })),
            errors: allErrors.map(e => ({
                type: 'schema_error',
                message: e.message,
                file_path: e.file,
                details: null
            }))
        });

        // Log audit trail
        await AuditLog.create({
            action: 'IMPORT_PREVIEW',
            admin_id,
            ip_address,
            batch_id: batchId,
            result: allErrors.length === 0 ? 'success' : 'partial',
            input_data: { repo_url },
            metadata: {
                documents: documents.length,
                topics: total_topics,
                assets: total_assets,
                assessments: total_assessments
            }
        });

        // Build files_preview array that frontend expects
        const files_preview = files.map(filePath => {
            // Find errors/warnings for this file
            const fileErrors = allErrors.filter(e => e.file === filePath);
            
            let status = 'valid';
            let error = null;
            
            if (fileErrors.length > 0) {
                status = 'invalid';
                error = fileErrors[0].message;
            }
            
            return {
                path: filePath,
                type: 'document',
                status,
                error
            };
        });

        return {
            batch_id: batchId,
            repo_info: repo,
            commit_sha: scanResult.commit_sha,
            documents: files,
            total_documents: validationResult.total_documents,
            total_topics: validationResult.total_topics,
            total_assets: validationResult.total_assets,
            total_assessments: validationResult.total_assessments,
            errors: validationResult.errors,
            warnings: validationResult.warnings
        };

    } catch (error) {
        logger.error({ err: error, message: error.message, stack: error.stack, repo_url, batch_id: batchId }, 'Preview import failed');

        // Update batch status if created
        if (batchId) {
            await ImportBatch.findOneAndUpdate(
                { batch_id: batchId },
                { 
                    status: 'FAILED',
                    errors: [{ 
                        type: 'ingestion_failed', 
                        message: error.message,
                        file_path: null,
                        details: { stack: error.stack }
                    }]
                }
            );

            // Log failure
            await AuditLog.create({
                action: 'IMPORT_PREVIEW',
                admin_id,
                ip_address,
                batch_id: batchId,
                result: 'failure',
                input_data: { repo_url },
                error_message: error.message
            });
        }

        throw error;
    }
}

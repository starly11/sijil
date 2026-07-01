import { fetch } from 'undici';
import * as logger from '../../utils/logger.js';
import { parseRepoUrl, scanRepository, validateRepositoryStructure } from './repositoryScanner.service.js';
import { fetchFileContent, validateBatch } from './importValidation.service.js';
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
 *   repo_info: Object,
 *   commit_sha: string,
 *   documents: Array,
 *   total_documents: number,
 *   total_topics: number,
 *   total_assets: number,
 *   total_assessments: number,
 *   errors: Array,
 *   warnings: Array
 * }>}
 */
export async function previewImport({ 
    repo_url, 
    github_token,
    admin_id = 'bootstrap_admin',
    ip_address = null
}) {
    let batchId = null;

    try {
        // Parse repository URL
        const repo = parseRepoUrl(repo_url);
        
        // Scan repository
        const scanResult = await scanRepository(github_token, repo);
        
        // Validate repository structure
        const structureValidation = validateRepositoryStructure(scanResult);
        
        if (!structureValidation.valid) {
            throw new Error(structureValidation.errors.join('; '));
        }

        // Fetch and validate document contents
        const documents = [];
        const files = [];

        for (const filePath of scanResult.documents) {
            try {
                const doc = await fetchFileContent(github_token, repo.owner, repo.name, filePath);
                documents.push(doc);
                files.push(filePath);
            } catch (error) {
                logger.error({ err: error, file: filePath }, 'Failed to fetch document');
            }
        }

        // Validate all documents
        const validationResult = validateBatch(documents, files);

        // Create ImportBatch record in PENDING state
        batchId = generateBatchId();
        await ImportBatch.create({
            batch_id: batchId,
            repo_url,
            repo_owner: repo.owner,
            repo_name: repo.name,
            commit_sha: scanResult.commit_sha,
            status: 'PENDING',
            total_documents: validationResult.total_documents,
            total_topics: validationResult.total_topics,
            total_assets: validationResult.total_assets,
            total_assessments: validationResult.total_assessments,
            warnings: validationResult.warnings.map(w => ({
                type: w.field?.includes('alt_text') ? 'missing_alt' : 
                      w.field?.includes('formula') ? 'missing_formula' :
                      w.field?.includes('mcq') ? 'missing_mcq' :
                      w.field?.includes('duplicate') ? 'duplicate_id' : 'schema_warning',
                message: w.message,
                file_path: w.file,
                topic_id: w.topic_id || null
            })),
            errors: validationResult.errors.map(e => ({
                type: e.field?.includes('schema') ? 'schema_error' :
                      e.field?.includes('Missing required') ? 'missing_required' :
                      e.field?.includes('Duplicate') ? 'invalid_reference' : 'ingestion_failed',
                message: e.message,
                file_path: e.file,
                details: { field: e.field }
            }))
        });

        // Log audit trail
        await AuditLog.create({
            action: 'IMPORT_PREVIEW',
            admin_id,
            ip_address,
            batch_id: batchId,
            result: validationResult.valid ? 'success' : 'partial',
            input_data: { repo_url },
            metadata: {
                documents: validationResult.total_documents,
                topics: validationResult.total_topics,
                assets: validationResult.total_assets,
                assessments: validationResult.total_assessments
            }
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
        logger.error({ err: error, repo_url, batch_id: batchId }, 'Preview import failed');

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

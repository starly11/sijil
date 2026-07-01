import { Router } from 'express';
import { previewImport } from '../services/import/importPreview.service.js';
import { executeImport } from '../services/import/importExecutor.service.js';
import ImportBatch from '../models/importBatch.model.js';
import AuditLog from '../models/auditLog.model.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import * as logger from '../utils/logger.js';

const router = Router();

/**
 * POST /admin/import/preview
 * Preview import from GitHub repository
 */
router.post('/import/preview', requireAdmin, async (req, res, next) => {
    try {
        const { repo_url } = req.body;
        
        if (!repo_url) {
            return res.status(400).json({ 
                success: false, 
                error: 'repo_url is required' 
            });
        }

        const github_token = process.env.GITHUB_PAT || process.env.PAT;
        
        if (!github_token) {
            return res.status(500).json({ 
                success: false, 
                error: 'GitHub PAT not configured' 
            });
        }

        const result = await previewImport({
            repo_url,
            github_token,
            admin_id: req.admin_id || 'bootstrap_admin',
            ip_address: req.ip
        });

        return res.status(200).json({ 
            success: true, 
            data: result 
        });

    } catch (error) {
        logger.error({ err: error }, 'Preview import failed');
        next(error);
    }
});

/**
 * POST /admin/import/start
 * Start batch import
 */
router.post('/import/start', requireAdmin, async (req, res, next) => {
    try {
        const { batch_id } = req.body;
        
        if (!batch_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'batch_id is required' 
            });
        }

        const github_token = process.env.GITHUB_PAT || process.env.PAT;
        
        if (!github_token) {
            return res.status(500).json({ 
                success: false, 
                error: 'GitHub PAT not configured' 
            });
        }

        // Execute import in background
        // Return immediately with batch status
        executeImport({
            batch_id,
            github_token,
            admin_id: req.admin_id || 'bootstrap_admin',
            ip_address: req.ip
        }).catch(err => {
            logger.error({ err, batch_id }, 'Background import failed');
        });

        const batch = await ImportBatch.findOne({ batch_id });
        
        return res.status(200).json({ 
            success: true, 
            data: {
                batch_id,
                status: batch?.status || 'PENDING',
                message: 'Import started in background'
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Start import failed');
        next(error);
    }
});

/**
 * GET /admin/import/:batchId
 * Get import status and progress
 */
router.get('/import/:batchId', requireAdmin, async (req, res, next) => {
    try {
        const { batchId } = req.params;
        
        const batch = await ImportBatch.findOne({ batch_id: batchId });
        
        if (!batch) {
            return res.status(404).json({ 
                success: false, 
                error: 'Import batch not found' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            data: {
                batch_id: batch.batch_id,
                status: batch.status,
                repo_url: batch.repo_url,
                commit_sha: batch.commit_sha,
                progress: batch.progress,
                counts: {
                    total_documents: batch.total_documents,
                    total_topics: batch.total_topics,
                    total_assets: batch.total_assets,
                    total_assessments: batch.total_assessments,
                    imported_documents: batch.imported_documents,
                    imported_topics: batch.imported_topics,
                    imported_assets: batch.imported_assets,
                    imported_assessments: batch.imported_assessments,
                    failed_documents: batch.failed_documents,
                    failed_topics: batch.failed_topics,
                    failed_assets: batch.failed_assets,
                    failed_assessments: batch.failed_assessments
                },
                successful_files: batch.successful_files,
                failed_files: batch.failed_files,
                warnings: batch.warnings,
                errors: batch.errors,
                report: batch.report,
                started_at: batch.started_at,
                completed_at: batch.completed_at,
                created_at: batch.createdAt,
                updated_at: batch.updatedAt
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Get import status failed');
        next(error);
    }
});

/**
 * POST /admin/import/:batchId/retry
 * Retry failed files in a batch
 */
router.post('/import/:batchId/retry', requireAdmin, async (req, res, next) => {
    try {
        const { batchId } = req.params;
        
        const batch = await ImportBatch.findOne({ batch_id: batchId });
        
        if (!batch) {
            return res.status(404).json({ 
                success: false, 
                error: 'Import batch not found' 
            });
        }

        if (batch.failed_files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No failed files to retry' 
            });
        }

        // Log audit trail BEFORE modifying state
        await AuditLog.create({
            action: 'IMPORT_RETRY',
            admin_id: req.admin_id || 'bootstrap_admin',
            ip_address: req.ip,
            batch_id: batchId,
            result: 'success',
            input_data: { 
                batchId,
                failed_count: batch.failed_files.length,
                failed_files: batch.failed_files.map(f => f.file_path)
            }
        });

        // Start import with retry_only flag - do NOT reset failed files yet
        // The processor will handle removing successful retries
        const github_token = process.env.GITHUB_PAT || process.env.PAT;
        
        executeImport({
            batch_id: batchId,
            github_token,
            admin_id: req.admin_id || 'bootstrap_admin',
            ip_address: req.ip,
            retry_only: true  // Critical: only process failed files
        }).catch(err => {
            logger.error({ err, batch_id: batchId }, 'Retry import failed');
        });

        return res.status(200).json({ 
            success: true, 
            message: `Retry started for ${batch.failed_files.length} failed file(s)`,
            data: { 
                batch_id: batchId,
                retrying: batch.failed_files.length,
                files: batch.failed_files.map(f => f.file_path)
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Retry import failed');
        next(error);
    }
});

/**
 * POST /admin/import/:batchId/cancel
 * Cancel an import batch
 */
router.post('/import/:batchId/cancel', requireAdmin, async (req, res, next) => {
    try {
        const { batchId } = req.params;
        
        const batch = await ImportBatch.findOne({ batch_id: batchId });
        
        if (!batch) {
            return res.status(404).json({ 
                success: false, 
                error: 'Import batch not found' 
            });
        }

        if (batch.status === 'COMPLETED' || batch.status === 'FAILED') {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot cancel completed or failed batch' 
            });
        }

        batch.status = 'CANCELLED';
        batch.completed_at = new Date();
        await batch.save();

        // Log audit trail
        await AuditLog.create({
            action: 'IMPORT_CANCEL',
            admin_id: req.admin_id || 'bootstrap_admin',
            ip_address: req.ip,
            batch_id: batchId,
            result: 'success',
            input_data: { batchId }
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Import cancelled',
            data: { batch_id: batchId }
        });

    } catch (error) {
        logger.error({ err: error }, 'Cancel import failed');
        next(error);
    }
});

/**
 * GET /admin/import/:batchId/report
 * Download import report as JSON
 */
router.get('/import/:batchId/report', requireAdmin, async (req, res, next) => {
    try {
        const { batchId } = req.params;
        
        const batch = await ImportBatch.findOne({ batch_id: batchId });
        
        if (!batch) {
            return res.status(404).json({ 
                success: false, 
                error: 'Import batch not found' 
            });
        }

        if (!batch.report) {
            return res.status(400).json({ 
                success: false, 
                error: 'Report not available yet' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            data: batch.report 
        });

    } catch (error) {
        logger.error({ err: error }, 'Get report failed');
        next(error);
    }
});

export default router;

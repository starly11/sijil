import { Router } from 'express';
import { previewImport } from '../services/import/importPreview.service.js';
import { executeImport } from '../services/import/importExecutor.service.js';
import ImportBatch from '../models/importBatch.model.js';
import AuditLog from '../models/auditLog.model.js';
import Document from '../models/document.model.js';
import Topic from '../models/topic.model.js';
import TopicContent from '../models/topicContent.model.js';
import TopicAsset from '../models/topicAsset.model.js';
import TopicAssessment from '../models/topicAssessment.model.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { config } from '../config/env.js';
import * as logger from '../utils/logger.js';

const router = Router();

/**
 * POST /admin/import/preview
 * Preview import from GitHub repository
 */
router.post('/import/preview', requireAdmin, async (req, res, next) => {
    try {
        const { repo_url, branch, path } = req.body;
        
        if (!repo_url) {
            return res.status(400).json({ 
                success: false, 
                error: 'repo_url is required' 
            });
        }

        const github_token = config.GITHUB_PAT || process.env.PAT;
        
        if (!github_token) {
            return res.status(500).json({ 
                success: false, 
                error: 'GitHub PAT not configured' 
            });
        }

        const result = await previewImport({
            repo_url,
            branch,
            path,
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

        const github_token = config.GITHUB_PAT || process.env.PAT;
        
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
                progress: batch.progress ? Math.round(
                    (
                        (batch.progress.scanning?.percentage || 0) +
                        (batch.progress.validating?.percentage || 0) +
                        (batch.progress.importing?.percentage || 0) +
                        (batch.progress.indexing?.percentage || 0)
                    ) / 4
                ) : 0,
                counts: {
                    total_documents: batch.total_documents || 0,
                    total_topics: batch.total_topics || 0,
                    total_assets: batch.total_assets || 0,
                    total_assessments: batch.total_assessments || 0,
                    imported_documents: batch.imported_documents || 0,
                    imported_topics: batch.imported_topics || 0,
                    imported_assets: batch.imported_assets || 0,
                    imported_assessments: batch.imported_assessments || 0,
                    failed_documents: batch.failed_documents || 0,
                    failed_topics: batch.failed_topics || 0,
                    failed_assets: batch.failed_assets || 0,
                    failed_assessments: batch.failed_assessments || 0
                },
                successful_files: batch.successful_files || [],
                failed_files: batch.failed_files || [],
                warnings: batch.warnings || [],
                errors: batch.errors || [],
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
        const github_token = config.GITHUB_PAT || process.env.PAT;
        
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



/**
 * GET /admin/preview/:documentId
 * Preview document with all topics for admin review
 */
router.get('/preview/:documentId', requireAdmin, async (req, res, next) => {
    try {
        const { documentId } = req.params;

        const doc = await Document.findOne({
            $or: [{ document_id: documentId }, { _id: documentId }]
        });

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        // Get all topics for this document
        const topics = await Topic.find({ document_id: doc.document_id })
            .sort({ display_order: 1 })
            .lean();

        // Get topic counts
        const topicIds = topics.map(t => t._id);
        const [contentBlocksCount, assetsCount, assessmentsCount] = await Promise.all([
            TopicContent.countDocuments({ topic_id: { $in: topicIds } }),
            TopicAsset.countDocuments({ topic_id: { $in: topicIds } }),
            TopicAssessment.countDocuments({ topic_id: { $in: topicIds } })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                document: doc,
                topics: topics.map(t => ({
                    ...t,
                    stats: {
                        content_blocks: contentBlocksCount,
                        assets: assetsCount,
                        assessments: assessmentsCount
                    }
                })),
                total_topics: topics.length,
                stats: {
                    total_content_blocks: contentBlocksCount,
                    total_assets: assetsCount,
                    total_assessments: assessmentsCount
                }
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Preview failed');
        next(error);
    }
});

export default router;

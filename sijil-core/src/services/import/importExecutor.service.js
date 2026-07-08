import * as logger from '../../utils/logger.js';
import { ingestionQueue } from '../../queues/index.js';
import ImportBatch from '../../models/importBatch.model.js';
import AuditLog from '../../models/auditLog.model.js';

/**
 * Execute batch import
 * Adds job to ingestionQueue for async processing
 * @param {Object} params
 * @param {string} params.batch_id - ImportBatch ID
 * @param {string} params.github_token - GitHub PAT
 * @param {string} params.admin_id - Admin user ID
 * @param {string} params.ip_address - Request IP address
 * @param {boolean} params.retry_only - Only process failed files (for retry)
 * @returns {Promise<Object>} Job information
 */
export async function executeImport({ 
    batch_id, 
    github_token,
    admin_id = 'bootstrap_admin',
    ip_address = null,
    retry_only = false
}) {
    const batch = await ImportBatch.findOne({ batch_id });
    
    if (!batch) {
        throw new Error(`ImportBatch not found: ${batch_id}`);
    }

    if (batch.status === 'IMPORTING') {
        throw new Error('Import already in progress');
    }

    if (batch.status === 'COMPLETED' && !retry_only) {
        throw new Error('Import already completed');
    }

    try {
        // Update status to QUEUED first, then IMPORTING when worker starts
        batch.status = 'QUEUED';
        batch.started_at = new Date();
        batch.progress.importing.status = 'pending';
        await batch.save();

        // Log audit trail
        await AuditLog.create({
            action: 'IMPORT_START',
            admin_id,
            ip_address,
            batch_id,
            result: 'success',
            input_data: { batch_id, retry_only }
        });

        // Add job to ingestion queue with proper configuration
        const job = await ingestionQueue.add('batch_import', {
            batch_id,
            github_token,
            admin_id,
            retry_only,
            started_at: new Date().toISOString()
        }, {
            jobId: `batch_${batch_id}`,
            attempts: 1,
            removeOnComplete: false,
            removeOnFail: false,
            timeout: 3600000 // 1 hour timeout for large batches
        });

        logger.info(
            { batch_id, jobId: job.id, retry_only },
            'Batch import job added to queue'
        );

        return {
            batch_id,
            job_id: job.id,
            status: 'QUEUED',
            message: 'Import job queued for processing'
        };

    } catch (error) {
        logger.error({ err: error, batch_id }, 'Failed to queue batch import');

        batch.status = 'FAILED';
        batch.progress.importing.status = 'failed';
        await batch.save();

        await AuditLog.create({
            action: 'IMPORT_START',
            admin_id,
            ip_address,
            batch_id,
            result: 'failure',
            error_message: error.message
        });

        throw error;
    }
}

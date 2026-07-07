import { Worker } from 'bullmq';
import { createBullMQConnection } from '../queues/connection.js';
import * as logger from '../utils/logger.js';

/**
 * Instantiates a configured BullMQ Worker, complete with robust event telemetry reporting listeners.
 * Handles Redis disconnections gracefully to prevent worker crashes.
 * Includes automatic stalled job recovery on startup.
 * @param {string} queueName - Registry space target defining job domains to pull.
 * @param {Function} processor - Path or method execution wrapper parsing active payloads.
 * @returns {Worker} Fully operational background engine consumer instance.
 */
export function createWorker(queueName, processor) {
    let dedicatedWorkerConnection;
    
    try {
        dedicatedWorkerConnection = createBullMQConnection();
    } catch (err) {
        logger.error({ queue: queueName, error: err.message }, `Failed to initialize Redis connection for queue [${queueName}]`);
        // Return a mock worker if Redis fails
        return {
            name: queueName,
            close: async () => {},
            on: () => {}
        };
    }

    const worker = new Worker(queueName, processor, {
        connection: dedicatedWorkerConnection,
        concurrency: 5,
        settings: {
            maxStalledCount: 1,
            stalledInterval: 30000,
        }
    });

    // Auto-recover stalled jobs on worker ready
    worker.on('ready', async () => {
        logger.info({ queue: queueName, event: 'worker_ready' }, `Worker process listening for work items inside queue [${queueName}]`);
        
        // Check for stalled jobs and clean them up
        try {
            const stalledJobs = await worker.getStalledJobs();
            if (stalledJobs.length > 0) {
                logger.warn({ queue: queueName, count: stalledJobs.length }, `Found ${stalledJobs.length} stalled jobs on startup. Cleaning up...`);
                
                for (const job of stalledJobs) {
                    try {
                        // Log job details before removal
                        logger.info({ 
                            queue: queueName, 
                            jobId: job.id, 
                            name: job.name,
                            attempts: job.attemptsMade 
                        }, `Removing stalled job: ${job.id}`);
                        
                        // Remove the stalled job
                        await job.remove();
                        
                        // If it's an import batch job, mark the batch as failed in DB
                        if (job.data?.batch_id) {
                            const ImportBatch = (await import('../models/importBatch.model.js')).default;
                            await ImportBatch.findOneAndUpdate(
                                { batch_id: job.data.batch_id },
                                { 
                                    $set: { 
                                        status: 'FAILED',
                                        completed_at: new Date(),
                                        errors: [...(job.data.errors || []), { 
                                            message: 'Job stalled during processing. Server restarted. Please retry.',
                                            timestamp: new Date()
                                        }]
                                    }
                                }
                            );
                            logger.info({ batch_id: job.data.batch_id }, 'Marked batch as FAILED due to stalled job');
                        }
                    } catch (err) {
                        logger.error({ queue: queueName, jobId: job.id, error: err.message }, `Failed to clean up stalled job`);
                    }
                }
                
                logger.info({ queue: queueName, cleaned: stalledJobs.length }, `Cleaned up ${stalledJobs.length} stalled jobs`);
            }
        } catch (err) {
            logger.error({ queue: queueName, error: err.message }, `Error checking for stalled jobs on startup`);
        }
    });

    worker.on('active', (job) => {
        logger.info({ queue: queueName, jobId: job.id, event: 'job_active' }, `Job ${job.id} state changed to active inside queue [${queueName}]`);
    });

    worker.on('progress', (job, progress) => {
        logger.info({ queue: queueName, jobId: job.id, event: 'job_progress', value: progress }, `Job ${job.id} inside queue [${queueName}] reported update: ${progress}%`);
    });

    worker.on('completed', (job, result) => {
        logger.info({ queue: queueName, jobId: job.id, event: 'job_completed' }, `Job ${job.id} inside queue [${queueName}] completed successfully. Payload returned.`);
    });

    worker.on('failed', (job, error) => {
        logger.error(
            { queue: queueName, jobId: job?.id || 'unknown', event: 'job_failed', error: error.message },
            `Job execution failed inside queue [${queueName}]! Attempt count trace: ${job?.attemptsMade}. Details: ${error.stack}`
        );
    });

    worker.on('error', (error) => {
        // Handle specific Redis errors gracefully without crashing
        if (error.code === 'ETIMEDOUT' || error.message.includes('Connection is closed') || error.message.includes('EAI_AGAIN')) {
            logger.warn({ queue: queueName, event: 'redis_error', error: error.message }, `Redis connection issue for queue [${queueName}]. BullMQ will attempt auto-reconnect.`);
        } else {
            logger.error({ queue: queueName, event: 'worker_error', error: error.message }, `Internal pipeline structural exception inside queue [${queueName}]: ${error.stack}`);
        }
    });

    return worker;
}
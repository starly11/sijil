import { Worker, Queue } from 'bullmq';
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

    worker.on('ready', async () => {
        // Track reconnection count to detect unstable connections
        const reconnectCount = (worker._reconnectCount || 0) + 1;
        worker._reconnectCount = reconnectCount;
        
        if (reconnectCount === 1) {
            logger.info({ queue: queueName, event: 'worker_ready' }, `Worker process listening for work items inside queue [${queueName}]`);
        } else {
            logger.warn({ queue: queueName, event: 'worker_reconnected', reconnectCount }, `Worker RECONNECTED to queue [${queueName}] (attempt ${reconnectCount})`);
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
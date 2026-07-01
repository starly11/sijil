import { Worker } from 'bullmq';
import { createBullMQConnection } from '../queues/connection.js';
import * as logger from '../utils/logger.js';

/**
 * Instantiates a configured BullMQ Worker, complete with robust event telemetry reporting listeners.
 * @param {string} queueName - Registry space target defining job domains to pull.
 * @param {Function} processor - Path or method execution wrapper parsing active payloads.
 * @returns {Worker} Fully operational background engine consumer instance.
 */
export function createWorker(queueName, processor) {
    const dedicatedWorkerConnection = createBullMQConnection();

    const worker = new Worker(queueName, processor, {
        connection: dedicatedWorkerConnection,
        concurrency: 5, // Safely balances CPU consumption bounds across simultaneous tasks
    });

    // Structural Telemetry Events Listeners Hook
    worker.on('ready', () => {
        logger.info({ queue: queueName, event: 'worker_ready' }, `Worker process listening for work items inside queue [${queueName}]`);
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
        logger.error({ queue: queueName, event: 'worker_error', error: error.message }, `Internal pipeline structural exception inside queue [${queueName}]: ${error.stack}`);
    });

    return worker;
}
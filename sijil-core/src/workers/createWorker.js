import { Worker } from 'bullmq';
import { createBullMQConnection } from '../queues/connection.js';
import { QUEUE_NAMES } from '../queues/constants.js';
import * as logger from '../utils/logger.js';

const WORKER_DEFAULTS = {
    concurrency: 5,
    lockDuration: 300000,
    stalledInterval: 60000,
    maxStalledCount: 3,
};

const QUEUE_OVERRIDES = {
    [QUEUE_NAMES.INGESTION]: {
        concurrency: 1,
        lockDuration: 900000,
        stalledInterval: 120000,
        maxStalledCount: 5,
    },
    [QUEUE_NAMES.SEARCH_INDEX]: {
        concurrency: 2,
    },
    [QUEUE_NAMES.SLUG_RESOLVER]: {
        concurrency: 3,
    },
};

/**
 * Instantiates a configured BullMQ Worker with queue-specific tuning.
 * @param {string} queueName
 * @param {Function} processor
 * @param {Object} [extraOptions]
 * @returns {Worker}
 */
export function createWorker(queueName, processor, extraOptions = {}) {
    let dedicatedWorkerConnection;

    try {
        dedicatedWorkerConnection = createBullMQConnection({ dedicated: true });
    } catch (err) {
        logger.error({ queue: queueName, error: err.message }, `Failed to initialize Redis connection for queue [${queueName}]`);
        return {
            name: queueName,
            close: async () => { },
            on: () => { },
        };
    }

    const queueConfig = QUEUE_OVERRIDES[queueName] || {};
    const workerOptions = {
        ...WORKER_DEFAULTS,
        ...queueConfig,
        ...extraOptions,
        connection: dedicatedWorkerConnection,
    };

    const worker = new Worker(queueName, processor, workerOptions);

    worker.on('ready', () => {
        if (!worker._hasLoggedReady) {
            worker._hasLoggedReady = true;
            logger.info({ queue: queueName, event: 'worker_ready' }, `Worker process listening for work items inside queue [${queueName}]`);
        }
    });

    worker.on('closing', () => {
        worker._hasLoggedReady = false;
    });

    worker.on('active', (job) => {
        logger.info({ queue: queueName, jobId: job.id, event: 'job_active' }, `Job ${job.id} state changed to active inside queue [${queueName}]`);
    });

    worker.on('progress', (job, progress) => {
        logger.info({ queue: queueName, jobId: job.id, event: 'job_progress', value: progress }, `Job ${job.id} inside queue [${queueName}] reported update: ${progress}%`);
    });

    worker.on('completed', (job) => {
        logger.info({ queue: queueName, jobId: job.id, event: 'job_completed' }, `Job ${job.id} inside queue [${queueName}] completed successfully. Payload returned.`);
    });

    worker.on('failed', (job, error) => {
        logger.error(
            { queue: queueName, jobId: job?.id || 'unknown', event: 'job_failed', error: error.message },
            `Job execution failed inside queue [${queueName}]! Attempt count trace: ${job?.attemptsMade}. Details: ${error.stack}`
        );
    });

    worker.on('error', (error) => {
        if (
            error.code === 'ETIMEDOUT'
            || error.message === 'Command timed out'
            || error.message.includes('Connection is closed')
            || error.message.includes('EAI_AGAIN')
        ) {
            logger.warn({ queue: queueName, event: 'redis_error', error: error.message }, `Redis connection issue for queue [${queueName}]. BullMQ will attempt auto-reconnect.`);
        } else {
            logger.error({ queue: queueName, event: 'worker_error', error: error.message }, `Internal pipeline structural exception inside queue [${queueName}]: ${error.stack}`);
        }
    });

    return worker;
}

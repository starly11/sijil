import { config } from '../config/env.js';
import { connectDB } from '../config/db.js';
import '../models/index.js'; // Register all Mongoose models
import { createWorker } from './createWorker.js';
import { QUEUE_NAMES } from '../queues/constants.js';
import * as logger from '../utils/logger.js';

import processIngestion from './processors/ingestion.processor.js';
import processImageUpload from './processors/imageUpload.processor.js';
import processSlugResolver from './processors/slugResolver.processor.js';
import processExportGen from './processors/exportGen.processor.js';
import processSearchIndex from './processors/searchIndex.processor.js';

logger.info('=== INITIALIZING SIJIL-CORE BACKGROUND DISTRIBUTION CLUSTER ===');

let activeWorkers = [];

// Initialize dependencies before starting workers
async function init() {
    try {
        await connectDB();
        logger.info('✅ MongoDB connected successfully for workers');

        // Spin up individual standalone consumer instances concurrently
        activeWorkers = [
            createWorker(QUEUE_NAMES.INGESTION, processIngestion),
            createWorker(QUEUE_NAMES.IMAGE_UPLOAD, processImageUpload),
            createWorker(QUEUE_NAMES.SLUG_RESOLVER, processSlugResolver),
            createWorker(QUEUE_NAMES.EXPORT_GEN, processExportGen),
            createWorker(QUEUE_NAMES.SEARCH_INDEX, processSearchIndex),
        ];

        logger.info(`Successfully booted ${activeWorkers.length} worker daemons concurrently.`);
    } catch (err) {
        logger.error({ error: err.message }, 'Failed to initialize workers');
        process.exit(1);
    }
}

init();

/**
 * Graceful termination engine routing routine ensuring non-destructive pipeline shutdown operations.
 * @param {string} activeSignal - OS termination system signal intercepted (e.g., SIGTERM, SIGINT)
 */
async function triggerGracefulShutdown(activeSignal) {
    logger.warn(`System event [${activeSignal}] caught! Initiating safe shutdown sequence for all active workers...`);

    // Instruct workers to stop pulling new jobs and wait for active processing runs to finish
    const terminationPromises = activeWorkers.map(async (worker) => {
        try {
            logger.info({ queue: worker.name }, `Closing background worker listener for queue [${worker.name}]...`);
            await worker.close();
            logger.info({ queue: worker.name }, `Background worker consumer [${worker.name}] exited cleanly.`);
        } catch (err) {
            logger.error({ queue: worker.name, error: err.message }, `Error encountered closing background worker [${worker.name}]`);
        }
    });

    await Promise.all(terminationPromises);
    logger.info('All worker processing loops terminated. Exiting runtime context safely.');
    process.exit(0);
}

// OS Process Intercept Signal Hooks
process.on('SIGINT', () => triggerGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => triggerGracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ event: 'unhandled_rejection', reason: String(reason) }, 'Critical Unhandled Promise Rejection intercepted within runtime scope!');
});

process.on('uncaughtException', (error) => {
    logger.error({ event: 'uncaught_exception', error: error.message }, `Critical Uncaught Exception thrown! Stack Trace: ${error.stack}`);
    process.exit(1);
});
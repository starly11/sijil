import { config } from './src/config/env.js';
import app from './app.js';
import { connectDB, dbConnection } from './src/config/db.js';
import redisClient from './src/config/redis.js';
import * as logger from './src/utils/logger.js';
import { seedDefaultPolicies } from './src/services/export/exportPolicy.service.js';
import { recomputeStats } from './src/services/stats/platformStats.service.js';
import './src/models/index.js'; // Register all Mongoose models

let server;

/**
 * Boots the server dependencies and establishes connection event ports cleanly.
 */
const startServer = async () => {
  try {
    // Block application server spin-up until initial database sync checks resolve cleanly
    await connectDB();

    // Seed default export policies (idempotent)
    await seedDefaultPolicies();

    // Recompute platform stats on startup (silent on success)
    try {
      await recomputeStats();
      logger.info('Platform stats initialized');
    } catch (err) {
      logger.warn(`Failed to recompute stats: ${err.message}`);
    }

    // Skip scheduling nightly batch if Redis not available
    try {
      // await scheduleNightlySlugBatch();
      // logger.info('Nightly slug batch job scheduled');
    } catch (err) {
      logger.warn(`Skipping nightly batch scheduling: ${err.message}`);
    }

    server = app.listen(config.PORT, () => {
      logger.info(`🚀 Server running in [${config.NODE_ENV}] mode on http://localhost:${config.PORT}`);
    });
  } catch (err) {
    logger.error(`Fatal core startup execution block: ${err.message}`);
    process.exit(1);
  }
};

/**
 * Intercepts POSIX termination patterns to execute safe process shutdown chains.
 * @param {string} signal - The incoming processing system trap signal (SIGINT / SIGTERM)
 */
const gracefulShutdown = async (signal) => {
  logger.warn(`Received execution interrupt signal: ${signal}. Commencing teardown...`);

  if (server) {
    server.close(() => {
      logger.info('HTTP infrastructure layer safely terminated.');
    });
  }

  try {
    await dbConnection.close();
    logger.info('MongoDB database mapping closed.');
  } catch (err) {
    logger.warn(`Failed to close MongoDB: ${err.message}`);
  }

  try {
    await redisClient.quit();
    logger.info('Redis client socket interface connection quit.');
  } catch (err) {
    logger.warn(`Failed to close Redis: ${err.message}`);
  }

  logger.info('System components successfully disposed. Exiting application node.');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Promise Rejection trapped: ${reason}`);
  // Don't exit on unhandled rejection if it's Redis-related
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Runtime Exception trapped: ${err.message}`);
  // Don't exit immediately if it's Redis-related
});

startServer();
import { config } from './src/config/env.js';
import app from './app.js';
import { connectDB, dbConnection } from './src/config/db.js';
import redisClient from './src/config/redis.js';
import * as logger from './src/utils/logger.js';
import { seedDefaultPolicies } from './src/services/export/exportPolicy.service.js';
import { recomputeStats } from './src/services/stats/platformStats.service.js';
import { scheduleNightlySlugBatch } from './src/services/slug/slugBatch.service.js';
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
    await recomputeStats();
    logger.info('Platform stats initialized');

    // Schedule nightly slug batch resolution job
    await scheduleNightlySlugBatch();
    logger.info('Nightly slug batch job scheduled');

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

  // Give the HTTP engine an immediate processing lock window to discharge inflight packets
  if (server) {
    server.close(() => {
      logger.info('HTTP infrastructure layer safely terminated.');
    });
  }

  try {
    // Dismantle the Mongo driver state pool connection
    await dbConnection.close();
    logger.info('MongoDB database mapping closed.');

    // Break the socket interface configuration mapping cleanly from Redis servers
    await redisClient.quit();
    logger.info('Redis client socket interface connection quit.');

    logger.info('System components successfully disposed. Exiting application node.');
    process.exit(0);
  } catch (err) {
    logger.error(`Error encountered while breaking downstream connections: ${err.message}`);
    process.exit(1);
  }
};

// Listen for termination signals from host runtime controllers (Docker, PM2, K8s, or Ctrl+C)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Ensure the system drops completely when unmanaged code exceptions occurs
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Promise Rejection trapped: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Runtime Exception trapped: ${err.message}`);
  process.exit(1);
});

startServer();
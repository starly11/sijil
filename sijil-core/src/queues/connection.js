import Redis from 'ioredis';
import { config } from '../config/env.js';

/**
 * Creates a Redis connection specifically configured for BullMQ
 * @returns {Redis}
 */
export function createBullMQConnection() {
    return new Redis(config.REDIS_URL, {
        maxRetriesPerRequest: null, // Required by BullMQ
        enableReadyCheck: false, // Speeds up connection
        tls: config.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    });
}

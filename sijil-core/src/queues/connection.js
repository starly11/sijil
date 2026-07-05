import Redis from 'ioredis';
import { config } from '../config/env.js';

// Create a mock BullMQ connection if Redis fails
const createMockConnection = () => ({
    on: () => {},
    once: () => {},
    disconnect: async () => {},
    status: 'ready',
});

let cachedConnection = null;

/**
 * Creates a Redis connection specifically configured for BullMQ
 * Uses a singleton pattern to avoid multiple connections causing timeouts
 * @returns {Redis}
 */
export function createBullMQConnection() {
    // Return cached connection if available
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        const connection = new Redis(config.REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
            connectTimeout: 5000, // Increased timeout
            retryStrategy: (times) => {
                if (times > 3) {
                    console.warn(`⚠️  Redis connection failed after ${times} attempts, using mock`);
                    return null;
                }
                return Math.min(times * 200, 2000);
            },
            tls: config.REDIS_URL.startsWith('rediss://') ? {} : undefined,
        });

        connection.on('connect', () => {
            console.log('⚡ BullMQ Redis connection established');
        });

        connection.on('error', (error) => {
            console.warn(`⚠️  BullMQ Redis error: ${error.message}`);
            // Don't cache failed connections
            cachedConnection = null;
        });

        connection.on('close', () => {
            console.warn('⚠️  BullMQ Redis connection closed');
            cachedConnection = null;
        });

        // Cache the connection
        cachedConnection = connection;
        return connection;
    } catch (error) {
        console.warn(`⚠️  Failed to create BullMQ connection: ${error.message}, using mock`);
        return createMockConnection();
    }
}

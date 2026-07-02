import Redis from 'ioredis';
import { config } from '../config/env.js';

// Create a mock BullMQ connection if Redis fails
const createMockConnection = () => ({
    on: () => {},
    once: () => {},
    disconnect: async () => {},
    status: 'ready',
});

/**
 * Creates a Redis connection specifically configured for BullMQ
 * @returns {Redis}
 */
export function createBullMQConnection() {
    try {
        const connection = new Redis(config.REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
            connectTimeout: 2000,
            tls: config.REDIS_URL.startsWith('rediss://') ? {} : undefined,
        });

        connection.on('error', (error) => {
            console.warn(`⚠️  BullMQ Redis error: ${error.message}`);
        });

        return connection;
    } catch (error) {
        console.warn(`⚠️  Failed to create BullMQ connection: ${error.message}, using mock`);
        return createMockConnection();
    }
}

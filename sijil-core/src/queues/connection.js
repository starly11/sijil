import Redis from 'ioredis';
import { config } from '../config/env.js';

const createMockConnection = () => ({
    on: () => {},
    once: () => {},
    disconnect: async () => {},
    status: 'ready',
});

let cachedQueueConnection = null;

/**
 * Creates a Redis connection for BullMQ.
 * Workers need dedicated connections so lock renewal isn't starved during long jobs.
 *
 * IMPORTANT: Never set commandTimeout — BullMQ workers use blocking commands
 * (BRPOP) that intentionally wait indefinitely for new jobs.
 * @param {{ dedicated?: boolean }} options
 * @returns {Redis}
 */
export function createBullMQConnection({ dedicated = false } = {}) {
    if (!dedicated && cachedQueueConnection) {
        return cachedQueueConnection;
    }

    try {
        const isSecure = config.REDIS_URL.startsWith('rediss://');

        const connection = new Redis(config.REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
            connectTimeout: 10000,
            keepAlive: 10000,
            retryStrategy: (times) => {
                if (times > 30) {
                    return null;
                }
                return Math.min(times * 200, 3000);
            },
            ...(isSecure && { tls: {} }),
        });

        connection.on('connect', () => {
            if (!dedicated) {
                console.log('⚡ BullMQ Redis connection established');
            }
        });

        connection.on('error', (error) => {
            // Blocking-command timeouts are expected if commandTimeout is misconfigured;
            // with correct config these should be rare network blips only.
            if (error.message === 'Command timed out') {
                console.warn(`⚠️  BullMQ Redis command timeout (check commandTimeout is NOT set): ${error.message}`);
                return;
            }
            console.warn(`⚠️  BullMQ Redis error: ${error.message}`);
            if (!dedicated) {
                cachedQueueConnection = null;
            }
        });

        connection.on('close', () => {
            if (!dedicated) {
                cachedQueueConnection = null;
            }
        });

        if (!dedicated) {
            cachedQueueConnection = connection;
        }

        return connection;
    } catch (error) {
        console.warn(`⚠️  Failed to create BullMQ connection: ${error.message}, using mock`);
        return createMockConnection();
    }
}

import Redis from 'ioredis';
import { config } from './env.js';

// 1. Determine if TLS is required based on the URL scheme
// Upstash and secure Redis instances use 'rediss://' (with an extra 's')
const isSecure = config.REDIS_URL.startsWith('rediss://');

const redisOptions = {
    // Required by BullMQ so it can manage its own retry commands on connection drops
    maxRetriesPerRequest: null,

    // Speeds up connection by skipping the internal readiness checks
    enableReadyCheck: false,

    // Conditionally apply TLS options if using a secure connection string
    ...(isSecure && { tls: {} }),
};

// 2. Initialize the single Redis instance
// Note: While your schema parses the REST variables, ensure your connection string 
// passed here uses the Redis protocol (redis:// or rediss://) for ioredis compatibility.
const redis = new Redis(config.REDIS_URL, redisOptions);

// 3. Setup event listeners for connection management
redis.on('connect', () => {
    console.log('⚡ Redis client successfully connected.');
});

redis.on('error', (error) => {
    console.error(`🚨 Redis client error: ${error.message}`);
});

redis.on('close', () => {
    console.warn('⚠️  Redis connection closed.');
});

// 4. Export the single instance
export default redis;
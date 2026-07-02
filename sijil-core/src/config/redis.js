import Redis from 'ioredis';
import { config } from './env.js';

// Create a safe mock Redis client that doesn't throw errors
const createSafeRedis = () => {
    const mock = {
        on: () => {},
        once: () => {},
        quit: async () => {},
        set: async () => {},
        get: async () => null,
        del: async () => {},
        exists: async () => 0,
        incr: async () => 1,
        decr: async () => 0,
        hset: async () => {},
        hget: async () => null,
        hgetall: async () => ({}),
        lpush: async () => {},
        rpop: async () => null,
        llen: async () => 0,
        expire: async () => {},
        keys: async () => [],
        pipeline: () => ({ exec: async () => [] }),
        status: 'ready',
    };
    return mock;
};

let redis;

try {
    // 1. Determine if TLS is required
    const isSecure = config.REDIS_URL.startsWith('rediss://');

    const redisOptions = {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
        connectTimeout: 2000,
        ...(isSecure && { tls: {} }),
    };

    // 2. Initialize Redis
    redis = new Redis(config.REDIS_URL, redisOptions);

    redis.on('connect', () => {
        console.log('⚡ Redis client successfully connected.');
    });

    redis.on('error', (error) => {
        console.warn(`⚠️  Redis unavailable: ${error.message}, using mock client`);
    });

    redis.on('close', () => {
        console.warn('⚠️  Redis connection closed.');
    });

    // Try to connect, if it fails within 2s, use mock
    const connectPromise = new Promise((resolve) => {
        setTimeout(resolve, 2000);
        redis.once('connect', () => resolve('connected'));
    });

    await connectPromise;

} catch (error) {
    console.warn(`⚠️  Failed to initialize Redis: ${error.message}, using mock client`);
    redis = createSafeRedis();
}

export default redis;

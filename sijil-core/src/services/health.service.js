import mongoose from 'mongoose';
import redisClient from '../config/redis.js';

/**
 * Evaluates the live connection statuses of MongoDB and Redis alongside runtime telemetry.
 * @returns {Promise<{mongo: string, redis: string, uptime_seconds: number, timestamp: string}>}
 */
export const checkHealth = async () => {
    // Check Mongoose readyState (1 === connected)
    const isMongoConnected = mongoose.connection.readyState === 1;
    const mongoStatus = isMongoConnected ? 'connected' : 'disconnected';

    let redisStatus = 'disconnected';

    try {
        // Race the Redis ping against a 2-second timeout promise
        const pingPromise = redisClient.ping();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 2000)
        );

        const reply = await Promise.race([pingPromise, timeoutPromise]);
        if (reply === 'PONG') {
            redisStatus = 'connected';
        }
    } catch (error) {
        // Any error or timeout naturally defaults status to 'disconnected'
    }

    return {
        mongo: mongoStatus,
        redis: redisStatus,
        uptime_seconds: process.uptime(),
        timestamp: new Date().toISOString(),
    };
};
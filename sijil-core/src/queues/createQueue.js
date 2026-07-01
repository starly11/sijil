import { Queue } from 'bullmq';
import { createBullMQConnection } from './connection.js';
import { DEFAULT_JOB_OPTIONS } from './constants.js';

/**
 * High-order encapsulation routine building standardized BullMQ Queue controllers.
 * @param {string} queueName - Unique namespace designation matching system registries.
 * @returns {Queue} Instantiated queue control instances ready to register tasks.
 */
export function createQueue(queueName) {
    const sharedRedisClient = createBullMQConnection();

    return new Queue(queueName, {
        connection: sharedRedisClient,
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
} 
import { Router } from 'express';
import { checkHealth } from '../services/health.service.js';

const router = Router();

/**
 * Route handler for system health monitoring checks.
 */
router.get('/', async (req, res, next) => {
    try {
        const healthStatus = await checkHealth();

        // If either system component is down, signal with an HTTP 503 Service Unavailable
        if (healthStatus.mongo === 'disconnected' || healthStatus.redis === 'disconnected') {
            return res.status(503).json(healthStatus);
        }

        return res.status(200).json(healthStatus);
    } catch (error) {
        next(error);
    }
});

export default router;
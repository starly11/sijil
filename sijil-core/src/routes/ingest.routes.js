import { Router } from 'express';
import { submitJsonIngest, getIngestStatus, cancelIngestJob, retryIngestJob } from '../controllers/ingest.controller.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// All ingestion routes now require admin authentication
router.post('/ingest/json', requireAdmin, submitJsonIngest);
router.get('/ingest/:trackingId', requireAdmin, getIngestStatus);
router.post('/ingest/:id/cancel', requireAdmin, cancelIngestJob);
router.post('/ingest/:id/retry', requireAdmin, retryIngestJob);

export default router;
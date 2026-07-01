import { ingestDocument } from '../services/ingestion/ingestDocument.service.js';
import { getIngestStatusById } from '../services/api/ingestStatus.service.js';
import IngestQueue from '../models/ingestQueue.model.js';
import { ingestionQueue } from '../queues/index.js';
import { Job } from 'bullmq';

export async function submitJsonIngest(req, res, next) {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ success: false, error: "Empty request payload content body." });
        }
        const result = await ingestDocument({ payload: req.body, source: 'api-endpoint' });
        if (!result.success) {
            return res.status(422).json(result);
        }
        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
}

export async function getIngestStatus(req, res, next) {
    try {
        const record = await getIngestStatusById(req.params.trackingId);
        if (!record) {
            return res.status(404).json({ success: false, error: 'Ingestion tracking sequence identifier not resolved.' });
        }
        return res.status(200).json({ success: true, data: record });
    } catch (error) {
        next(error);
    }
}

export async function cancelIngestJob(req, res, next) {
    try {
        const { id } = req.params;
        
        // Find job in BullMQ
        const job = await Job.fromId(ingestionQueue, id);
        
        if (!job) {
            return res.status(404).json({ success: false, error: 'Job not found' });
        }
        
        const state = await job.getState();
        
        // Can only cancel waiting or delayed jobs
        if (state === 'waiting' || state === 'delayed') {
            await job.remove();
            
            // Update ingest_queue document status to cancelled
            await IngestQueue.findByIdAndUpdate(id, { status: 'cancelled' });
            
            return res.status(200).json({ success: true, message: 'Job cancelled' });
        }
        
        return res.status(400).json({ success: false, error: 'Cannot cancel job in current state' });
    } catch (error) {
        next(error);
    }
}

export async function retryIngestJob(req, res, next) {
    try {
        const { id } = req.params;
        
        // Find ingest_queue document by _id
        const ingestRecord = await IngestQueue.findById(id);
        
        if (!ingestRecord) {
            return res.status(404).json({ success: false, error: 'Ingest record not found' });
        }
        
        // Only failed jobs can be retried
        if (ingestRecord.status !== 'failed') {
            return res.status(400).json({ success: false, error: 'Only failed jobs can be retried' });
        }
        
        // Re-add to BullMQ queue using existing queue
        const job = await ingestionQueue.add('ingest', ingestRecord.toJSON());
        
        // Update status back to pending
        ingestRecord.status = 'pending';
        await ingestRecord.save();
        
        return res.status(200).json({ success: true, data: { job_id: job.id } });
    } catch (error) {
        next(error);
    }
}
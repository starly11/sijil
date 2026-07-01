import IngestQueue from '../../models/ingestQueue.model.js';

export async function getIngestStatusById(trackingId) {
  if (!trackingId) throw new Error('Tracking identifier parameter is required.');
  return await IngestQueue.findById(trackingId).lean();
}

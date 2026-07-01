import { generateEntityId } from '../id.service.js'
import ExportJob from '../../models/exportJob.model.js'
import { exportGenQueue } from '../../queues/index.js'
import { isExportAllowed } from '../export/exportPolicy.service.js'
import { buildOfflinePackage, generateExportFilename } from '../export/packageBuilder.service.js'
import * as logger from '../../utils/logger.js'

const VALID_EXPORT_TYPES = ['formula_pack', 'mcq_pack', 'revision_pack', 'offline_html', 'flashcard_pack', 'topic_pack']

export async function enqueueExportJob({ topic_id, format, document_type = 'textbook' }) {
  if (!topic_id) throw new Error('topic_id is required')
  if (!VALID_EXPORT_TYPES.includes(format)) {
    throw new Error(`Invalid export type: "${format}". Allowed: ${VALID_EXPORT_TYPES.join(', ')}`)
  }

  // Policy check before enqueuing
  const policy = await isExportAllowed(document_type, format)
  if (!policy.allowed) throw new Error(policy.reason)

  const jobId = generateEntityId('export')
  await ExportJob.create({
    _id: jobId,
    topic_id,
    format,
    export_type: format,
    document_type,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date()
  })

  await exportGenQueue.add(`export:${jobId}`, {
    export_job_id: jobId,
    topic_id,
    format,
    document_type
  })

  return { export_job_id: jobId, topic_id, format, document_type, status: 'pending' }
}

export async function fetchExportJobStatus(jobId) {
  return await ExportJob.findById(jobId).lean()
}

// New: direct download — bypasses queue, returns buffer immediately
// Used by the download endpoint for small exports
export async function generateExportDirect({ topic_id, format, document_type = 'textbook' }) {
  const policy = await isExportAllowed(document_type, format)
  if (!policy.allowed) throw new Error(policy.reason)

  const buffer = await buildOfflinePackage({
    topicId: topic_id,
    exportType: format,
    documentType: document_type,
    designMeta: null
  })

  return buffer
}

/**
 * Checks if an export job's content has become stale since generation.
 */
export async function checkExportStaleness(exportJobId) {
  const ExportJob = (await import('../../models/exportJob.model.js')).default;
  const Topic = (await import('../../models/topic.model.js')).default;

  const job = await ExportJob.findById(exportJobId).lean();
  
  if (!job) {
    throw new Error('Export job not found');
  }

  if (job.status !== 'complete') {
    return { is_stale: false, reason: 'Export not yet complete' };
  }

  if (!job.source_content_hash || job.source_content_hash === '') {
    return { is_stale: false, reason: 'No content hash recorded' };
  }

  const topic = await Topic.findById(job.topic_id).lean();
  
  if (!topic) {
    return { is_stale: true, reason: 'Source topic no longer exists' };
  }

  // Use version field as content hash proxy
  const currentContentHash = topic.version || '';
  
  if (currentContentHash !== job.source_content_hash) {
    // Mark job as stale
    await ExportJob.findByIdAndUpdate(exportJobId, {
      is_stale: true,
      updated_at: new Date()
    });
    
    return { 
      is_stale: true, 
      reason: 'Topic content has changed since export was generated',
      exported_at: job.completed_at 
    };
  }

  return { is_stale: false, reason: 'Export is current' };
}

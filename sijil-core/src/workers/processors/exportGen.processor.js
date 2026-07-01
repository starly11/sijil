import * as logger from '../../utils/logger.js'
import { buildOfflinePackage } from '../../services/export/packageBuilder.service.js'
import ExportJob from '../../models/exportJob.model.js'

/**
 * Real implementation: builds offline package and updates job status.
 * @param {import('bullmq').Job} job
 */
export default async function processExportGen(job) {
  const { export_job_id, topic_id, format, document_type } = job.data

  // 1. Mark job as processing
  await ExportJob.findByIdAndUpdate(export_job_id, {
    status: 'processing',
    updated_at: new Date()
  })
  await job.updateProgress(10)

  try {
    // 2. Build the package
    logger.info({ export_job_id, topic_id, format }, 'Starting export generation')
    const buffer = await buildOfflinePackage({
      topicId: topic_id,
      exportType: format,
      documentType: document_type || 'textbook',
      designMeta: null
    })
    await job.updateProgress(80)

    // 3. Query Topic to get content hash (using version as proxy since no content_hash field exists)
    const Topic = (await import('../../models/topic.model.js')).default;
    const topic = await Topic.findById(topic_id).lean();
    const topicContentHash = topic?.version || '';

    // 4. Build manifest object
    const manifest = {
      export_id: export_job_id,
      topic_id: topic_id,
      export_type: format,
      version: '1.0',
      generated_at: new Date().toISOString(),
      theme_id: 'default',
      content_hash_at_export: topicContentHash,
      size_kb: (buffer.length / 1024).toFixed(2)
    };

    // 5. Update ExportJob with manifest and content hash
    await ExportJob.findByIdAndUpdate(export_job_id, {
      status: 'complete',
      manifest: manifest,
      source_content_hash: topicContentHash,
      is_stale: false,
      output_url: '',
      updated_at: new Date(),
      completed_at: new Date()
    })
    await job.updateProgress(100)

    // GAP 4: Write back to parent document's export_manifest
    const Document = (await import('../../models/document.model.js')).default;
    // Topic already imported at line 31, reuse it
    const topicDoc = await Topic.findById(topic_id).select('document_id').lean();
    if (topicDoc?.document_id) {
      const formatKey = format; // e.g. 'formula_pack'
      
      // Get current manifest to merge with new value
      const currentDoc = await Document.findById(topicDoc.document_id).select('publishing.export_manifest').lean();
      const currentManifest = currentDoc?.publishing?.export_manifest || {};
      
      await Document.findByIdAndUpdate(
        topicDoc.document_id,
        {
          $set: {
            'publishing.export_manifest': {
              ...currentManifest,
              [formatKey]: 'generated'
            },
            'publishing.updated_at': new Date()
          }
        }
      );
      logger.info({ document_id: topicDoc.document_id, format: formatKey }, 'Document export_manifest updated');
    }

    logger.info({ export_job_id, sizeKb: (buffer.length / 1024).toFixed(2) }, 'Export generation complete')
    return {
      export_job_id,
      status: 'complete',
      sizeKb: (buffer.length / 1024).toFixed(2),
      processed_at: new Date().toISOString()
    }

  } catch (err) {
    logger.error({ export_job_id, error: err.message }, 'Export generation failed')
    await ExportJob.findByIdAndUpdate(export_job_id, {
      status: 'error',
      updated_at: new Date(),
      $push: { error_log: { message: err.message, timestamp: new Date() } }
    })
    throw err
  }
}

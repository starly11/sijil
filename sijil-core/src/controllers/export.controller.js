import { enqueueExportJob, fetchExportJobStatus, generateExportDirect, checkExportStaleness } from '../services/api/export.service.js'
import { getAllPolicies, getPolicyForDocumentType } from '../services/export/exportPolicy.service.js'
import { generateExportFilename } from '../services/export/packageBuilder.service.js'
import { recordExportDownload } from '../services/analytics/topicAnalytics.service.js'

export async function createExportJob(req, res, next) {
  try {
    const { topic_id, format } = req.body
    if (!topic_id || !format) {
      return res.status(400).json({ success: false, error: 'Missing mandatory parameters: topic_id and format are required.' })
    }
    const meta = await enqueueExportJob({ topic_id, format })
    return res.status(202).json({ success: true, data: meta })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
}

export async function getExportJobStatus(req, res, next) {
  try {
    const { exportJobId } = req.params
    if (!exportJobId || exportJobId === 'undefined' || exportJobId === 'null' || exportJobId.trim() === '') {
      return res.status(400).json({ success: false, error: 'Invalid export job ID provided.' })
    }
    const status = await fetchExportJobStatus(exportJobId)
    if (!status) return res.status(404).json({ success: false, error: 'Target Export reference context not found.' })
    return res.status(200).json({ success: true, data: status })
  } catch (error) {
    next(error)
  }
}

export async function getPolicies(req, res, next) {
  try {
    const policies = await getAllPolicies()
    return res.status(200).json({ success: true, data: policies })
  } catch (error) {
    next(error)
  }
}

export async function getPolicyByType(req, res, next) {
  try {
    const policy = await getPolicyForDocumentType(req.params.document_type)
    return res.status(200).json({ success: true, data: policy })
  } catch (error) {
    return res.status(404).json({ success: false, error: error.message })
  }
}

// New: direct download controller
export async function downloadExportDirect(req, res, next) {
  try {
    const { topic_id, format, document_type = 'textbook' } = req.query
    
    if (!topic_id || !format) {
      return res.status(400).json({ success: false, error: 'Missing required query parameters: topic_id and format' })
    }

    const buffer = await generateExportDirect({ topic_id, format, document_type })
    
    // Fire-and-forget analytics
    recordExportDownload({ topicId: topic_id, exportType: format, documentType: document_type }).catch(() => {});
    
    const filename = generateExportFilename({
      topicId: topic_id,
      exportType: format,
      metadata: { slug: topic_id }
    })

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.length)
    
    return res.end(buffer)
  } catch (error) {
    // Policy errors
    if (error.message.includes('not permitted') || error.message.includes('disabled')) {
      return res.status(403).json({ success: false, error: error.message })
    }
    // Topic not found
    if (error.message.includes('Topic not found')) {
      return res.status(404).json({ success: false, error: error.message })
    }
    next(error)
  }
}

// New: check export staleness controller
export async function getExportStaleness(req, res, next) {
  try {
    const { exportJobId } = req.params;
    
    if (!exportJobId) {
      return res.status(400).json({ success: false, error: 'Export job ID is required' });
    }

    const result = await checkExportStaleness(exportJobId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
}

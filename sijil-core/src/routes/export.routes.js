import { Router } from 'express'
import { createExportJob, getExportJobStatus, getPolicies, getPolicyByType, downloadExportDirect, getExportStaleness } from '../controllers/export.controller.js'

const router = Router()
router.post('/exports', createExportJob)
router.get('/exports/:exportJobId', getExportJobStatus)
router.get('/policies', getPolicies)
router.get('/policies/:document_type', getPolicyByType)
router.get('/export/download', downloadExportDirect)
router.get('/export/:exportJobId/stale', getExportStaleness)

export default router

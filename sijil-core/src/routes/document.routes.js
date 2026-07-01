import { Router } from 'express';
import { listDocuments, getDocumentById, getDocumentTopics, getDocumentAggregates, getSubjects, getGrades, getSubjectGrades } from '../controllers/document.controller.js';

const router = Router();
router.get('/documents', listDocuments);
router.get('/documents/:documentId', getDocumentById);
router.get('/documents/:documentId/topics', getDocumentTopics);
router.get('/documents/:id/aggregates', getDocumentAggregates);
router.get('/subjects', getSubjects);
router.get('/grades', getGrades);
router.get('/subjects/:subject/grades', getSubjectGrades);

export default router;
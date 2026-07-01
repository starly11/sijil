import { queryDocuments, fetchDocumentById, fetchDocumentTopics, fetchSubjects, fetchGrades, fetchSubjectGrades } from '../services/api/documentQuery.service.js';
import Topic from '../models/topic.model.js';
import TopicContent from '../models/topicContent.model.js';
import FormulaIndex from '../models/formulaIndex.model.js';
import TopicAssessment from '../models/topicAssessment.model.js';
import TopicAsset from '../models/topicAsset.model.js';

export async function listDocuments(req, res, next) {
  try {
    const { subject, grade, status, type, sort, search, page, limit } = req.query;
    const catalog = await queryDocuments({ subject, grade, status, type, sort, search, page, limit });
    return res.status(200).json({ success: true, ...catalog });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentById(req, res, next) {
  try {
    const doc = await fetchDocumentById(req.params.documentId);
    if (!doc) return res.status(404).json({ success: false, error: 'Target Document entry not found.' });
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentTopics(req, res, next) {
  try {
    const topics = await fetchDocumentTopics(req.params.documentId);
    return res.status(200).json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentAggregates(req, res, next) {
  try {
    const { id } = req.params;
    
    // Query in parallel for all counts
    const [topicsCount, contentBlocksCount, formulasCount, assessmentsCount, assetsCount] = await Promise.all([
      Topic.countDocuments({ document_id: id }),
      TopicContent.countDocuments({ document_id: id }),
      FormulaIndex.countDocuments({ document_id: id }),
      TopicAssessment.countDocuments({ document_id: id }),
      TopicAsset.countDocuments({ document_id: id })
    ]);
    
    return res.status(200).json({
      success: true,
      data: {
        document_id: id,
        topics: topicsCount,
        content_blocks: contentBlocksCount,
        formulas: formulasCount,
        assessments: assessmentsCount,
        assets: assetsCount
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getSubjects(req, res, next) {
  try {
    const subjects = await fetchSubjects();
    return res.status(200).json({ success: true, data: subjects });
  } catch (error) {
    next(error);
  }
}

export async function getGrades(req, res, next) {
  try {
    const grades = await fetchGrades();
    return res.status(200).json({ success: true, data: grades });
  } catch (error) {
    next(error);
  }
}

export async function getSubjectGrades(req, res, next) {
  try {
    const { subject } = req.params;
    const grades = await fetchSubjectGrades(subject);
    return res.status(200).json({ success: true, data: grades });
  } catch (error) {
    next(error);
  }
}

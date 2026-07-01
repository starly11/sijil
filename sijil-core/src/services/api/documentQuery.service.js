import Document from '../../models/document.model.js';
import { enrichFiguresWithUrls } from './assetUrl.service.js';
import TopicAsset from '../../models/topicAsset.model.js';

export async function queryDocuments({ subject, grade, status, type, sort, search, page = 1, limit = 10 }) {
    const filter = { is_archived: false };
    if (subject) filter['document_metadata.subject'] = String(subject);
    if (grade) filter['document_metadata.grade_numeric'] = parseInt(grade);
    if (status) filter['publishing.status'] = String(status);
    if (type) filter['document_metadata.document_type'] = String(type);
    if (search) {
        filter['document_metadata.title'] = { $regex: search, $options: 'i' };
    }

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.max(1, parseInt(limit));
    const parsedLimit = Math.max(1, parseInt(limit));

    let sortOption = { created_at: -1 };
    if (sort === 'oldest') {
        sortOption = { created_at: 1 };
    } else if (sort === 'title') {
        sortOption = { 'document_metadata.title': 1 };
    }

    const [items, total] = await Promise.all([
        Document.find(filter).sort(sortOption).skip(skip).limit(parsedLimit).lean(),
        Document.countDocuments(filter)
    ]);

    return {
        items,
        pagination: {
            total,
            page: Math.max(1, parseInt(page)),
            limit: parsedLimit,
            pages: Math.ceil(total / parsedLimit)
        }
    };
}

export async function fetchDocumentById(documentId) {
    if (!documentId) throw new Error('Document ID is required.');
    const doc = await Document.findOne({ _id: documentId, is_archived: false }).lean();
    if (!doc) return null;
    
    // Map document to clean API response shape
    // Title lives under document_metadata.title per schema
    return {
        _id: doc._id,
        title: doc.document_metadata?.title || doc.title || 'Untitled',
        slug: doc.slug,
        document_id: doc.document_metadata?.document_id,
        subject: doc.document_metadata?.subject,
        grade_numeric: doc.document_metadata?.grade_numeric,
        language: doc.document_metadata?.language,
        publishing_status: doc.publishing?.status,
        url_path: doc.publishing?.url_path,
        container: doc.container,
        topic_refs: doc.topic_refs || [],
        document_aggregates: doc.document_aggregates,
        seo_master: doc.seo_master,
        version_control: doc.version_control,
        created_at: doc.created_at,
        updated_at: doc.updated_at
    };
}

/**
 * Fetches document topics with enriched asset URLs.
 * @param {string} documentId 
 * @returns {Promise<Array>} Topics with figures containing computed image_url
 */
export async function fetchDocumentTopics(documentId) {
    if (!documentId) throw new Error('Document ID is required.');
    
    const Topic = (await import('../../models/topic.model.js')).default;
    const topics = await Topic.find({ document_id: documentId, is_latest: true, is_archived: false }).sort({ display_order: 1 }).lean();
    
    // Enrich each topic's assets with computed URLs
    const enrichedTopics = await Promise.all(topics.map(async (topic) => {
        const assetDoc = await TopicAsset.findOne({ topic_id: topic._id }).lean();
        const enrichedFigures = enrichFiguresWithUrls(assetDoc?.figures || []);
        
        return {
            ...topic,
            figures: enrichedFigures
        };
    }));
    
    return enrichedTopics;
}

/**
 * Fetch all subjects with document counts
 * @returns {Promise<Array>} Array of { subject, count, slug } sorted by count desc
 */
export async function fetchSubjects() {
    const results = await Document.aggregate([
        { $match: { 'document_metadata.subject': { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$document_metadata.subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        {
            $project: {
                _id: 0,
                subject: '$_id',
                count: 1,
                slug: { $toLower: { $replaceAll: { input: '$_id', find: ' ', replacement: '-' } } }
            }
        }
    ]);
    return results;
}

/**
 * Fetch all grades with document counts
 * @returns {Promise<Array>} Array of { grade, count } sorted by grade asc
 */
export async function fetchGrades() {
    const results = await Document.aggregate([
        { $match: { 'document_metadata.grade_numeric': { $exists: true, $gte: 1 } } },
        { $group: { _id: '$document_metadata.grade_numeric', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                grade: '$_id',
                count: 1
            }
        }
    ]);
    return results;
}

/**
 * Fetch grades for a specific subject
 * @param {string} subject - Subject name (case-insensitive)
 * @returns {Promise<Array>} Array of { grade, count } sorted by grade asc
 */
export async function fetchSubjectGrades(subject) {
    const results = await Document.aggregate([
        { $match: { 'document_metadata.subject': { $exists: true, $regex: new RegExp('^' + subject + '$', 'i') } } },
        { $match: { 'document_metadata.grade_numeric': { $exists: true, $gte: 1 } } },
        { $group: { _id: '$document_metadata.grade_numeric', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        {
            $project: {
                _id: 0,
                grade: '$_id',
                count: 1
            }
        }
    ]);
    return results;
}

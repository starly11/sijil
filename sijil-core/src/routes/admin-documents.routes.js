import { Router } from 'express';
import Document from '../models/document.model.js';
import Topic from '../models/topic.model.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import * as logger from '../utils/logger.js';

const router = Router();

/**
 * GET /admin/documents
 * List all documents with stats and preview links
 */
router.get('/documents', requireAdmin, async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 50;
        const page = parseInt(req.query.page, 10) || 1;
        const skip = (page - 1) * limit;
        const sortField = req.query.sort || 'created_at';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;

        const [documents, total] = await Promise.all([
            Document.find({ 'document_metadata.is_latest': true })
                .sort({ [sortField]: sortOrder })
                .limit(limit)
                .skip(skip)
                .lean(),
            Document.countDocuments({ 'document_metadata.is_latest': true })
        ]);

        // Enrich with topic counts
        const enrichedDocs = await Promise.all(
            documents.map(async (doc) => {
                const topicCount = await Topic.countDocuments({
                    document_id: doc.document_metadata.document_id,
                    is_latest: true
                });

                return {
                    ...doc,
                    stats: {
                        topic_count: topicCount
                    },
                    preview_url: `/topics/book/${doc.document_metadata.slug_global}`,
                    admin_url: `/admin/import/report?batchId=${doc._id}`
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: {
                items: enrichedDocs,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Get documents failed');
        next(error);
    }
});

/**
 * GET /admin/documents/:documentId
 * Get single document with full details and topic list
 */
router.get('/documents/:documentId', requireAdmin, async (req, res, next) => {
    try {
        const { documentId } = req.params;
        
        const doc = await Document.findOne({
            'document_metadata.document_id': documentId,
            'document_metadata.is_latest': true
        }).lean();

        if (!doc) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        const topics = await Topic.find({
            document_id: documentId,
            is_latest: true
        })
            .sort({ display_order: 1 })
            .lean();

        const topicDetails = await Promise.all(
            topics.map(async (topic) => {
                const url = `/topics/${topic.slug_global}`;
                return {
                    ...topic,
                    preview_url: url
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: {
                document: doc,
                topics: topicDetails,
                total_topics: topics.length,
                preview_url: `/topics/book/${doc.document_metadata.slug_global}`
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Get document details failed');
        next(error);
    }
});

export default router;

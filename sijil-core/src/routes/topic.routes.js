import { Router } from 'express';
import { getTopicById, getTopicBySlugGlobal, getTopicContent, getTopicAssets, getTopicAssessments, getTopicPage } from '../controllers/topic.controller.js';

const router = Router();

router.get('/topics/:topicId', getTopicById);
// Modern path-to-regexp bracket parameter syntax capturing deep multi-segment wildcards safely
router.get('/topics/slug/*slug', getTopicBySlugGlobal);
router.get('/topics/:topicId/content', getTopicContent);
router.get('/topics/:topicId/assets', getTopicAssets);
router.get('/topics/:topicId/assessments', getTopicAssessments);
router.get('/topics/:topicId/page', getTopicPage);

export default router;
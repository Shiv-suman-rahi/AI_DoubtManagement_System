import express from 'express';
import {
  searchKnowledgeBase,
  getKnowledgeBaseArticle,
  markArticleHelpful
} from '../controllers/knowledgeBaseController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', searchKnowledgeBase);
router.get('/:id', getKnowledgeBaseArticle);
router.post('/:id/helpful', markArticleHelpful);

export default router;

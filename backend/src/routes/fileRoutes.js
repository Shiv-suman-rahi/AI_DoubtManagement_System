import express from 'express';
import { getProtectedAttachment } from '../controllers/fileController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/:filename', authenticate, getProtectedAttachment);

export default router;

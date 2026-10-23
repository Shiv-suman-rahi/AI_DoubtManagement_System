import express from 'express';
import {
  submitDoubt,
  getMyDoubts,
  getDoubtById,
  addFollowUp,
  submitFeedback
} from '../controllers/doubtController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { upload } from '../middleware/upload.js';
import { doubtSubmitLimiter } from '../middleware/rateLimiter.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);

// Student submits doubt
router.post(
  '/',
  authorizeRoles(ROLES.STUDENT),
  doubtSubmitLimiter,
  upload.array('attachments', 4),
  submitDoubt
);

// Student views their own doubts
router.get('/my', authorizeRoles(ROLES.STUDENT), getMyDoubts);

// View doubt by ID (authorized student owner or assigned faculty or admin)
router.get('/:id', getDoubtById);

// Add follow up message
router.post('/:id/follow-ups', addFollowUp);

// Submit feedback (student only)
router.post('/:id/feedback', authorizeRoles(ROLES.STUDENT), submitFeedback);

export default router;

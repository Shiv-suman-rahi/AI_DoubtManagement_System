import express from 'express';
import {
  getFacultyAssignments,
  getFacultyDashboard,
  getFacultyDoubts,
  getFacultyDoubtGroups,
  getFacultyDoubtGroupById,
  answerDoubtGroup,
  answerSingleDoubt,
  splitDoubtGroup,
  mergeDoubtGroups,
  updateDoubtStatus
} from '../controllers/facultyController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.FACULTY, ROLES.ADMIN));

router.get('/assignments', getFacultyAssignments);
router.get('/dashboard', getFacultyDashboard);
router.get('/doubts', getFacultyDoubts);
router.get('/doubt-groups', getFacultyDoubtGroups);
router.get('/doubt-groups/:id', getFacultyDoubtGroupById);
router.post('/doubt-groups/:id/answers', answerDoubtGroup);
router.post('/doubts/:id/answers', answerSingleDoubt);
router.patch('/doubt-groups/:id/split', splitDoubtGroup);
router.post('/doubt-groups/merge', mergeDoubtGroups);
router.patch('/doubts/:id/status', updateDoubtStatus);

export default router;

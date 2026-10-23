import express from 'express';
import {
  getAdminAnalytics,
  getUsers,
  createUser,
  updateUserStatus,
  getAcademicHierarchy,
  createClassroom,
  createSubject,
  assignFaculty,
  reassignPendingDoubts,
  importStudents,
  getAuditLogs
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/analytics', getAdminAnalytics);
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id/status', updateUserStatus);
router.get('/hierarchy', getAcademicHierarchy);
router.post('/classrooms', createClassroom);
router.post('/subjects', createSubject);
router.post('/assign-faculty', assignFaculty);
router.post('/reassign-doubts', reassignPendingDoubts);
router.post('/students/import', importStudents);
router.get('/audit-logs', getAuditLogs);

export default router;

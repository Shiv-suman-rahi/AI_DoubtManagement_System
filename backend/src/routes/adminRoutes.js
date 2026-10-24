import express from 'express';
import {
  getAdminAnalytics,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getAcademicHierarchy,
  createClassroom,
  createSubject,
  assignFaculty,
  getFacultyAssignmentsAdmin,
  updateFacultyAssignment,
  deactivateFacultyAssignment,
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
router.patch('/users/:id', updateUser);
router.patch('/users/:id/status', updateUserStatus);
router.get('/hierarchy', getAcademicHierarchy);
router.post('/classrooms', createClassroom);
router.post('/subjects', createSubject);
router.post('/assign-faculty', assignFaculty);
router.get('/faculty-assignments', getFacultyAssignmentsAdmin);
router.patch('/faculty-assignments/:id', updateFacultyAssignment);
router.delete('/faculty-assignments/:id', deactivateFacultyAssignment);
router.post('/reassign-doubts', reassignPendingDoubts);
router.post('/students/import', importStudents);
router.get('/audit-logs', getAuditLogs);

export default router;

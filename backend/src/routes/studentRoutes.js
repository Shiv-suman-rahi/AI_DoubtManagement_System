import express from 'express';
import {
  getStudentProfile,
  getStudentClasses,
  getStudentSubjects,
  getStudentDashboard
} from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles(ROLES.STUDENT, ROLES.ADMIN));

router.get('/profile', getStudentProfile);
router.get('/classes', getStudentClasses);
router.get('/subjects', getStudentSubjects);
router.get('/dashboard', getStudentDashboard);

export default router;

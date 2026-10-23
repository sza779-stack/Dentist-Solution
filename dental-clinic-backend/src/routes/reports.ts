import { Router } from 'express';
import { query } from 'express-validator';
import * as reportController from '../controllers/reports';
import { authenticate, isAdmin, isStaff } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get appointment statistics
router.get(
  '/appointments',
  isStaff,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  reportController.getAppointmentStats
);

// Get patient statistics
router.get(
  '/patients',
  isStaff,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  reportController.getPatientStats
);

// Get treatment statistics
router.get(
  '/treatments',
  isStaff,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  reportController.getTreatmentStats
);

// Get doctor performance report
router.get(
  '/doctors/performance',
  isAdmin,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  reportController.getDoctorPerformance
);

// Get system activity log
router.get(
  '/activity',
  isAdmin,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  reportController.getActivityLog
);

export default router;

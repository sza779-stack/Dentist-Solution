import { Router } from 'express';
import { query } from 'express-validator';
import * as dashboardController from '../controllers/dashboard';
import { authenticate, isStaff, isAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get main dashboard stats (staff)
router.get('/', isStaff, dashboardController.getDashboardStats);

// Get admin dashboard stats
router.get('/admin', isAdmin, dashboardController.getAdminDashboardStats);

// Get doctor dashboard stats
router.get('/doctor', isStaff, dashboardController.getDoctorDashboardStats);

// Get receptionist dashboard stats
router.get('/receptionist', isStaff, dashboardController.getReceptionistDashboardStats);

// Get analytics data (for charts)
router.get(
  '/analytics',
  isStaff,
  [
    query('range').optional().isIn(['7', '30', '90', '365']),
  ],
  dashboardController.getAnalyticsData
);

// Get today's schedule
router.get(
  '/today',
  isStaff,
  [
    query('doctorId').optional().isUUID(),
  ],
  dashboardController.getTodaySchedule
);

// Get upcoming appointments
router.get(
  '/upcoming',
  isStaff,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  dashboardController.getUpcomingAppointments
);

// Get notifications
router.get('/notifications', dashboardController.getNotifications);

// Mark notification as read
router.patch('/notifications/:id/read', dashboardController.markNotificationAsRead);

// Mark all notifications as read
router.patch('/notifications/read-all', dashboardController.markAllNotificationsAsRead);

export default router;

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, param, query } from 'express-validator';
import * as userController from '../controllers/users';
import { authenticate, authorize, isAdmin, isStaff } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// All routes require authentication
router.use(authenticate);

// Get all users (admin and staff only)
router.get(
  '/',
  isStaff,
  [
    query('role').optional().isIn(Object.values(Role)),
    query('isActive').optional().isBoolean(),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  userController.getAllUsers
);

// Get user by ID
router.get(
  '/:id',
  isStaff,
  [param('id').isUUID().withMessage('Valid user ID is required')],
  userController.getUserById
);

// Create user (admin only)
router.post(
  '/',
  isAdmin,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().trim().withMessage('First name is required'),
    body('lastName').notEmpty().trim().withMessage('Last name is required'),
    body('phone').optional().trim(),
    body('role').isIn(Object.values(Role)).withMessage('Valid role is required'),
  ],
  userController.createUser
);

// Update user
router.put(
  '/:id',
  isAdmin,
  [
    param('id').isUUID().withMessage('Valid user ID is required'),
    body('email').optional().isEmail().normalizeEmail(),
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
    body('phone').optional().trim(),
    body('avatarUrl').optional().trim(),
    body('role').optional().isIn(Object.values(Role)),
    body('isActive').optional().isBoolean(),
    body('staffProfile').optional().isObject(),
    body('staffProfile.specialization').optional().trim(),
    body('staffProfile.department').optional().trim(),
    body('staffProfile.licenseNumber').optional().trim(),
    body('staffProfile.biography').optional().trim(),
    body('staffProfile.isAvailable').optional().isBoolean(),
    body('staffProfile.workingHours').optional(),
  ],
  userController.updateUser
);

// Delete user (admin only)
router.delete(
  '/:id',
  isAdmin,
  [param('id').isUUID().withMessage('Valid user ID is required')],
  userController.deleteUser
);

// Activate/Deactivate user
router.patch(
  '/:id/status',
  isAdmin,
  [
    param('id').isUUID().withMessage('Valid user ID is required'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  userController.updateUserStatus
);

// Assign role to user
router.patch(
  '/:id/role',
  isAdmin,
  [
    param('id').isUUID().withMessage('Valid user ID is required'),
    body('role').isIn(Object.values(Role)).withMessage('Valid role is required'),
  ],
  userController.assignRole
);

// Reset user password (admin only)
router.post(
  '/:id/reset-password',
  isAdmin,
  [param('id').isUUID().withMessage('Valid user ID is required')],
  userController.resetPassword
);

// Upload user avatar (admin only)
router.post(
  '/:id/avatar',
  isAdmin,
  [param('id').isUUID().withMessage('Valid user ID is required')],
  avatarUpload.single('avatar'),
  userController.uploadUserAvatar
);

// Get staff members
router.get(
  '/staff/list',
  isStaff,
  [
    query('role').optional().isIn([Role.DOCTOR, Role.DENTIST, Role.SPECIALIST, Role.NURSE, Role.DENTIST_ASSISTANT]),
    query('isAvailable').optional().isBoolean(),
  ],
  userController.getStaffMembers
);

// Get audit logs (admin only)
router.get(
  '/audit-logs',
  isAdmin,
  [
    query('userId').optional().isUUID(),
    query('action').optional().trim(),
    query('entityType').optional().trim(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  userController.getAuditLogs
);

export default router;

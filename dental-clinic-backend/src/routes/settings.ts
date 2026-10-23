import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, param } from 'express-validator';
import { Role } from '@prisma/client';
import * as settingController from '../controllers/settings';
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

const landingDir = path.join(process.cwd(), 'uploads', 'landing');
if (!fs.existsSync(landingDir)) {
  fs.mkdirSync(landingDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, landingDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Public route (no auth required)
router.get('/public/landing', settingController.getPublicLandingSettings);

// All routes require authentication
router.use(authenticate);

router.post('/landing-image', isAdmin, upload.single('image'), settingController.uploadLandingImage);

// Get all settings
router.get('/', isAdmin, settingController.getAllSettings);

// Create broadcast notification
router.post(
  '/notifications/broadcast',
  isAdmin,
  [
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('message').notEmpty().trim().withMessage('Message is required'),
    body('type').optional().trim(),
    body('targetRole').optional().isIn(Object.values(Role)),
  ],
  settingController.createBroadcastNotification
);

// Get setting by key
router.get('/:key', isAdmin, settingController.getSettingByKey);

// Create or update setting
router.put(
  '/:key',
  isAdmin,
  [
    param('key').notEmpty().trim(),
    body('value').notEmpty().withMessage('Value is required'),
    body('category').optional().trim(),
    body('description').optional().trim(),
  ],
  settingController.upsertSetting
);

// Delete setting
router.delete('/:key', isAdmin, settingController.deleteSetting);

// Bulk update settings
router.post(
  '/bulk',
  isAdmin,
  [body('settings').isArray().withMessage('Settings array is required')],
  settingController.bulkUpdateSettings
);

export default router;

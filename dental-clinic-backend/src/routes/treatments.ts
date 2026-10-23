import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, param, query } from 'express-validator';
import * as treatmentController from '../controllers/treatments';
import { authenticate, isStaff, isDoctor, isAdmin } from '../middleware/auth';
import { TreatmentCategory, ToothNotation, ToothTreatmentStatus } from '@prisma/client';

const router = Router();

const xrayDir = path.join(process.cwd(), 'uploads', 'xrays');
if (!fs.existsSync(xrayDir)) {
  fs.mkdirSync(xrayDir, { recursive: true });
}

const xrayUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, xrayDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// All routes require authentication
router.use(authenticate);

// Diagnosis catalog (staff can read, admin manages in settings)
router.get('/diagnosis-catalog', isStaff, treatmentController.getDiagnosisCatalog);

// Get all treatment categories
router.get('/categories', isStaff, treatmentController.getAllCategories);

// Create treatment category (admin only)
router.post(
  '/categories',
  isAdmin,
  [
    body('name').notEmpty().trim().withMessage('Category name is required'),
    body('description').optional().trim(),
    body('icon').optional().trim(),
    body('color').optional().trim(),
  ],
  treatmentController.createCategory
);

// Update treatment category (admin only)
router.put(
  '/categories/:id',
  isAdmin,
  [
    param('id').isUUID().withMessage('Valid category ID is required'),
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('icon').optional().trim(),
    body('color').optional().trim(),
    body('isActive').optional().isBoolean(),
  ],
  treatmentController.updateCategory
);

// Get all treatments
router.get(
  '/',
  isStaff,
  [
    query('categoryId').optional().isUUID(),
    query('isActive').optional().isBoolean(),
    query('search').optional().trim(),
  ],
  treatmentController.getAllTreatments
);

// ============== TOOTH TREATMENTS ==============

// Get tooth treatments
router.get(
  '/tooth-treatments',
  isStaff,
  [
    query('patientId').optional().isUUID(),
    query('appointmentId').optional().isUUID(),
  ],
  treatmentController.getToothTreatments
);

// Create tooth treatment (doctors only)
router.post(
  '/tooth-treatments',
  isDoctor,
  [
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('appointmentId').optional().isUUID(),
    body('toothNumber').notEmpty().trim(),
    body('notation').optional().isIn(Object.values(ToothNotation)),
    body('surfaces').optional().isArray(),
    body('diagnosis').optional().trim(),
    body('treatmentType').notEmpty().trim(),
    body('notes').optional().trim(),
    body('status').optional().isIn(Object.values(ToothTreatmentStatus)),
    body('cost').optional().isFloat({ min: 0 }),
  ],
  treatmentController.createToothTreatment
);

// Update tooth treatment (doctors only)
router.patch(
  '/tooth-treatments/:id',
  isDoctor,
  [
    param('id').isUUID().withMessage('Valid treatment ID is required'),
    body('toothNumber').optional().trim(),
    body('notation').optional().isIn(Object.values(ToothNotation)),
    body('surfaces').optional().isArray(),
    body('diagnosis').optional().trim(),
    body('treatmentType').optional().trim(),
    body('notes').optional().trim(),
    body('status').optional().isIn(Object.values(ToothTreatmentStatus)),
    body('cost').optional().isFloat({ min: 0 }),
  ],
  treatmentController.updateToothTreatment
);

// Tooth treatment attachments
router.get(
  '/tooth-treatments/:id/attachments',
  isStaff,
  [param('id').isUUID().withMessage('Valid treatment ID is required')],
  treatmentController.getToothTreatmentAttachments
);

router.post(
  '/tooth-treatments/:id/attachments',
  isDoctor,
  xrayUpload.single('file'),
  treatmentController.uploadToothTreatmentAttachment
);

router.delete(
  '/tooth-treatments/attachments/:attachmentId',
  isDoctor,
  [param('attachmentId').isUUID().withMessage('Valid attachment ID is required')],
  treatmentController.deleteToothTreatmentAttachment
);

// Get treatment by ID
router.get(
  '/:id',
  isStaff,
  [param('id').isUUID().withMessage('Valid treatment ID is required')],
  treatmentController.getTreatmentById
);

// Create treatment (admin only)
router.post(
  '/',
  isAdmin,
  [
    body('categoryId').isUUID().withMessage('Valid category ID is required'),
    body('name').notEmpty().trim().withMessage('Treatment name is required'),
    body('description').optional().trim(),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('cost').optional().isFloat({ min: 0 }),
    body('code').optional().trim(),
    body('requiresConsultation').optional().isBoolean(),
  ],
  treatmentController.createTreatment
);

// Update treatment (admin only)
router.put(
  '/:id',
  isAdmin,
  [
    param('id').isUUID().withMessage('Valid treatment ID is required'),
    body('categoryId').optional().isUUID(),
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('duration').optional().isInt({ min: 1 }),
    body('price').optional().isFloat({ min: 0 }),
    body('cost').optional().isFloat({ min: 0 }),
    body('code').optional().trim(),
    body('isActive').optional().isBoolean(),
    body('requiresConsultation').optional().isBoolean(),
  ],
  treatmentController.updateTreatment
);

// Delete treatment (admin only)
router.delete(
  '/:id',
  isAdmin,
  [param('id').isUUID().withMessage('Valid treatment ID is required')],
  treatmentController.deleteTreatment
);

// ============== TREATMENT PLANS ==============

// Get all treatment plans
router.get(
  '/plans',
  isStaff,
  [
    query('patientId').optional().isUUID(),
    query('status').optional().trim(),
  ],
  treatmentController.getAllTreatmentPlans
);

// Get treatment plan by ID
router.get(
  '/plans/:id',
  isStaff,
  [param('id').isUUID().withMessage('Valid treatment plan ID is required')],
  treatmentController.getTreatmentPlanById
);

// Create treatment plan (doctors only)
router.post(
  '/plans',
  isDoctor,
  [
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('name').notEmpty().trim().withMessage('Plan name is required'),
    body('description').optional().trim(),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.treatmentId').isUUID().withMessage('Valid treatment ID is required'),
    body('items.*.quantity').optional().isInt({ min: 1 }),
    body('items.*.unitPrice').isFloat({ min: 0 }),
    body('items.*.discount').optional().isFloat({ min: 0 }),
    body('items.*.scheduledDate').optional().isISO8601(),
    body('items.*.notes').optional().trim(),
  ],
  treatmentController.createTreatmentPlan
);

// Update treatment plan (doctors only)
router.put(
  '/plans/:id',
  isDoctor,
  [
    param('id').isUUID().withMessage('Valid treatment plan ID is required'),
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('status').optional().trim(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  treatmentController.updateTreatmentPlan
);

// Approve treatment plan (doctors only)
router.patch(
  '/plans/:id/approve',
  isDoctor,
  [param('id').isUUID().withMessage('Valid treatment plan ID is required')],
  treatmentController.approveTreatmentPlan
);

// Delete treatment plan (admin only)
router.delete(
  '/plans/:id',
  isAdmin,
  [param('id').isUUID().withMessage('Valid treatment plan ID is required')],
  treatmentController.deleteTreatmentPlan
);

export default router;

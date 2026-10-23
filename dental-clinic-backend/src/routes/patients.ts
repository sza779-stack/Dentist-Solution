import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, param, query } from 'express-validator';
import * as patientController from '../controllers/patients';
import { authenticate, authorize, isStaff, isDoctor } from '../middleware/auth';
import { AppointmentType, Gender, PrescriptionStatus } from '@prisma/client';

const router = Router();

const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const upload = multer({
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

// Patient portal doctors and booking
router.get('/portal/doctors', patientController.getPortalDoctors);
router.get(
  '/portal/doctors/:doctorId/availability',
  [
    param('doctorId').isUUID().withMessage('Valid doctor ID is required'),
    query('date').isISO8601().withMessage('Valid date is required'),
  ],
  patientController.getPortalDoctorAvailability
);
router.post(
  '/portal/appointments',
  [
    body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
    body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time (HH:mm) is required'),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('type').isIn(Object.values(AppointmentType)).withMessage('Valid appointment type is required'),
    body('reason').optional().trim(),
    body('notes').optional().trim(),
  ],
  patientController.createPortalAppointment
);

// Get all patients (staff only)
router.get(
  '/',
  isStaff,
  [
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  patientController.getAllPatients
);

// Get patient by ID
router.get(
  '/:id',
  isStaff,
  [param('id').isUUID().withMessage('Valid patient ID is required')],
  patientController.getPatientById
);

// Create patient (staff only)
router.post(
  '/',
  isStaff,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().trim().withMessage('First name is required'),
    body('lastName').notEmpty().trim().withMessage('Last name is required'),
    body('phone').optional().trim(),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(Object.values(Gender)),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('zipCode').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('emergencyPhone').optional().trim(),
    body('insuranceProvider').optional().trim(),
    body('insurancePolicyNumber').optional().trim(),
    body('insuranceGroupNumber').optional().trim(),
    body('medicalHistory').optional().trim(),
    body('allergies').optional().trim(),
    body('medications').optional().trim(),
    body('notes').optional().trim(),
    body('assignedDoctorId').optional().isUUID().withMessage('Valid doctor ID is required'),
  ],
  patientController.createPatient
);

// Update patient
router.put(
  '/:id',
  isStaff,
  [
    param('id').isUUID().withMessage('Valid patient ID is required'),
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
    body('phone').optional().trim(),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(Object.values(Gender)),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('zipCode').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('emergencyPhone').optional().trim(),
    body('insuranceProvider').optional().trim(),
    body('insurancePolicyNumber').optional().trim(),
    body('insuranceGroupNumber').optional().trim(),
    body('medicalHistory').optional().trim(),
    body('allergies').optional().trim(),
    body('medications').optional().trim(),
    body('notes').optional().trim(),
    body('assignedDoctorId').optional().isUUID().withMessage('Valid doctor ID is required'),
  ],
  patientController.updatePatient
);

// Delete patient (admin only)
router.delete(
  '/:id',
  authorize('ADMIN'),
  [param('id').isUUID().withMessage('Valid patient ID is required')],
  patientController.deletePatient
);

// Get patient appointments
router.get(
  '/:id/appointments',
  isStaff,
  [param('id').isUUID().withMessage('Valid patient ID is required')],
  patientController.getPatientAppointments
);

// Get patient treatment history
router.get(
  '/:id/treatments',
  isDoctor,
  [param('id').isUUID().withMessage('Valid patient ID is required')],
  patientController.getPatientTreatments
);

// Get patient invoices
router.get(
  '/:id/invoices',
  isStaff,
  [param('id').isUUID().withMessage('Valid patient ID is required')],
  patientController.getPatientInvoices
);

// Get patient prescriptions
router.get(
  '/:id/prescriptions',
  isStaff,
  [param('id').isUUID().withMessage('Valid patient ID is required')],
  patientController.getPatientPrescriptions
);

// Create patient prescription
router.post(
  '/:id/prescriptions',
  isDoctor,
  [
    param('id').isUUID().withMessage('Valid patient ID is required'),
    body('medicationName').notEmpty().trim().withMessage('Medication name is required'),
    body('dosage').notEmpty().trim().withMessage('Dosage is required'),
    body('frequency').notEmpty().trim().withMessage('Frequency is required'),
    body('duration').optional().trim(),
    body('quantity').optional().isInt({ min: 1 }),
    body('refills').optional().isInt({ min: 0 }),
    body('instructions').optional().trim(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('status').optional().isIn(Object.values(PrescriptionStatus)),
  ],
  patientController.createPatientPrescription
);

router.put(
  '/:id/prescriptions/:prescriptionId',
  isDoctor,
  [
    param('id').isUUID().withMessage('Valid patient ID is required'),
    param('prescriptionId').isUUID().withMessage('Valid prescription ID is required'),
    body('medicationName').optional().notEmpty().trim(),
    body('dosage').optional().notEmpty().trim(),
    body('frequency').optional().notEmpty().trim(),
    body('duration').optional().trim(),
    body('quantity').optional().isInt({ min: 1 }),
    body('refills').optional().isInt({ min: 0 }),
    body('instructions').optional().trim(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('status').optional().isIn(Object.values(PrescriptionStatus)),
  ],
  patientController.updatePatientPrescription
);

router.delete(
  '/:id/prescriptions/:prescriptionId',
  isDoctor,
  [
    param('id').isUUID().withMessage('Valid patient ID is required'),
    param('prescriptionId').isUUID().withMessage('Valid prescription ID is required'),
  ],
  patientController.deletePatientPrescription
);

// Get patient portal data (for logged-in patient)
router.get('/portal/me', patientController.getPatientPortalData);

// Get patient portal treatment history
router.get('/portal/treatments', patientController.getPatientPortalTreatments);

router.get('/portal/prescriptions', patientController.getPatientPortalPrescriptions);

// Update patient portal profile
router.put(
  '/portal/me',
  [
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
    body('phone').optional().trim(),
    body('avatarUrl').optional().trim(),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(Object.values(Gender)),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('zipCode').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('emergencyPhone').optional().trim(),
    body('insuranceProvider').optional().trim(),
    body('insurancePolicyNumber').optional().trim(),
    body('insuranceGroupNumber').optional().trim(),
    body('medicalHistory').optional().trim(),
    body('allergies').optional().trim(),
    body('medications').optional().trim(),
    body('notes').optional().trim(),
  ],
  patientController.updatePatientPortalProfile
);

// Upload patient avatar
router.post(
  '/portal/me/avatar',
  upload.single('avatar'),
  patientController.uploadPatientAvatar
);

export default router;

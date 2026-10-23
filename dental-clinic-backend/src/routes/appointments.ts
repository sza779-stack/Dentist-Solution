import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as appointmentController from '../controllers/appointments';
import { authenticate, isStaff, isDoctor, isAdminOrReceptionist } from '../middleware/auth';
import { AppointmentStatus, AppointmentType } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all appointments
router.get(
  '/',
  isStaff,
  [
    query('patientId').optional().isUUID(),
    query('doctorId').optional().isUUID(),
    query('status').optional().isIn(Object.values(AppointmentStatus)),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  appointmentController.getAllAppointments
);

// Get appointment by ID
router.get(
  '/:id',
  isStaff,
  [param('id').isUUID().withMessage('Valid appointment ID is required')],
  appointmentController.getAppointmentById
);

// Create appointment
router.post(
  '/',
  isAdminOrReceptionist,
  [
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
    body('assistantId').optional().isUUID(),
    body('appointmentDate').isISO8601().withMessage('Valid date is required'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time (HH:mm) is required'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time (HH:mm) is required'),
    body('type').isIn(Object.values(AppointmentType)).withMessage('Valid appointment type is required'),
    body('notes').optional().trim(),
    body('reason').optional().trim(),
  ],
  appointmentController.createAppointment
);

// Update appointment
router.put(
  '/:id',
  isStaff,
  [
    param('id').isUUID().withMessage('Valid appointment ID is required'),
    body('patientId').optional().isUUID(),
    body('doctorId').optional().isUUID(),
    body('assistantId').optional().isUUID(),
    body('appointmentDate').optional().isISO8601(),
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('type').optional().isIn(Object.values(AppointmentType)),
    body('status').optional().isIn(Object.values(AppointmentStatus)),
    body('notes').optional().trim(),
    body('reason').optional().trim(),
  ],
  appointmentController.updateAppointment
);

// Delete appointment
router.delete(
  '/:id',
  isAdminOrReceptionist,
  [param('id').isUUID().withMessage('Valid appointment ID is required')],
  appointmentController.deleteAppointment
);

// Update appointment status
router.patch(
  '/:id/status',
  isStaff,
  [
    param('id').isUUID().withMessage('Valid appointment ID is required'),
    body('status').isIn(Object.values(AppointmentStatus)).withMessage('Valid status is required'),
  ],
  appointmentController.updateAppointmentStatus
);

// Cancel appointment
router.post(
  '/:id/cancel',
  isStaff,
  [
    param('id').isUUID().withMessage('Valid appointment ID is required'),
    body('reason').optional().trim(),
  ],
  appointmentController.cancelAppointment
);

// Get doctor availability
router.get(
  '/availability/:doctorId',
  isStaff,
  [
    param('doctorId').isUUID().withMessage('Valid doctor ID is required'),
    query('date').isISO8601().withMessage('Valid date is required'),
  ],
  appointmentController.getDoctorAvailability
);

// Get doctor schedule
router.get(
  '/schedule/:doctorId',
  isStaff,
  [
    param('doctorId').isUUID().withMessage('Valid doctor ID is required'),
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
  ],
  appointmentController.getDoctorSchedule
);

// Get calendar data
router.get(
  '/calendar/data',
  isStaff,
  [
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
    query('doctorId').optional().isUUID(),
  ],
  appointmentController.getCalendarData
);

// Add treatment to appointment
router.post(
  '/:id/treatments',
  isDoctor,
  [
    param('id').isUUID().withMessage('Valid appointment ID is required'),
    body('treatmentId').isUUID().withMessage('Valid treatment ID is required'),
    body('quantity').optional().isInt({ min: 1 }),
    body('discount').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
  ],
  appointmentController.addTreatmentToAppointment
);

// Add treatment note
router.post(
  '/:id/notes',
  isDoctor,
  [
    param('id').isUUID().withMessage('Valid appointment ID is required'),
    body('note').notEmpty().withMessage('Note content is required'),
    body('isPrivate').optional().isBoolean(),
  ],
  appointmentController.addTreatmentNote
);

export default router;

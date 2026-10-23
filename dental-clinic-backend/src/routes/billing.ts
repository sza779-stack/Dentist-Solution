import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as billingController from '../controllers/billing';
import { authenticate, isStaff, isAdmin } from '../middleware/auth';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============== INVOICES ==============

// Get all invoices
router.get(
  '/invoices',
  isStaff,
  [
    query('patientId').optional().isUUID(),
    query('status').optional().isIn(Object.values(PaymentStatus)),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  billingController.getAllInvoices
);

// Get invoice by ID
router.get(
  '/invoices/:id',
  isStaff,
  [param('id').isUUID().withMessage('Valid invoice ID is required')],
  billingController.getInvoiceById
);

// Create invoice
router.post(
  '/invoices',
  isStaff,
  [
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('appointmentId').optional().isUUID(),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.description').notEmpty().trim(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.unitPrice').isFloat({ min: 0 }),
    body('items.*.treatmentId').optional().isUUID(),
    body('taxAmount').optional().isFloat({ min: 0 }),
    body('discountAmount').optional().isFloat({ min: 0 }),
    body('notes').optional().trim(),
  ],
  billingController.createInvoice
);

// Update invoice (admin only)
router.put(
  '/invoices/:id',
  isAdmin,
  [
    param('id').isUUID().withMessage('Valid invoice ID is required'),
    body('dueDate').optional().isISO8601(),
    body('notes').optional().trim(),
  ],
  billingController.updateInvoice
);

// Delete invoice (admin only)
router.delete(
  '/invoices/:id',
  isAdmin,
  [param('id').isUUID().withMessage('Valid invoice ID is required')],
  billingController.deleteInvoice
);

// Update invoice status
router.patch(
  '/invoices/:id/status',
  isStaff,
  [
    param('id').isUUID().withMessage('Valid invoice ID is required'),
    body('status').isIn(Object.values(PaymentStatus)).withMessage('Valid status is required'),
  ],
  billingController.updateInvoiceStatus
);

// Apply discount
router.patch(
  '/invoices/:id/discount',
  isStaff,
  [
    param('id').isUUID().withMessage('Valid invoice ID is required'),
    body('discountAmount').isFloat({ min: 0 }).withMessage('Valid discount is required'),
  ],
  billingController.applyInvoiceDiscount
);

// Download invoice PDF
router.get(
  '/invoices/:id/download',
  isStaff,
  [param('id').isUUID().withMessage('Valid invoice ID is required')],
  billingController.downloadInvoice
);

// ============== PAYMENTS ==============

// Get all payments
router.get(
  '/payments',
  isStaff,
  [
    query('patientId').optional().isUUID(),
    query('invoiceId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  billingController.getAllPayments
);

// Get payment by ID
router.get(
  '/payments/:id',
  isStaff,
  [param('id').isUUID().withMessage('Valid payment ID is required')],
  billingController.getPaymentById
);

// Create payment
router.post(
  '/payments',
  isStaff,
  [
    body('invoiceId').optional().isUUID(),
    body('patientId').isUUID().withMessage('Valid patient ID is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('method').isIn(Object.values(PaymentMethod)).withMessage('Valid payment method is required'),
    body('reference').optional().trim(),
    body('notes').optional().trim(),
    body('paymentDate').optional().isISO8601(),
  ],
  billingController.createPayment
);

// ============== FINANCIAL REPORTS ==============

// Get revenue report (admin only)
router.get(
  '/reports/revenue',
  isAdmin,
  [
    query('startDate').isISO8601(),
    query('endDate').isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'year']),
    query('patientId').optional().isUUID(),
    query('treatmentId').optional().isUUID(),
  ],
  billingController.getRevenueReport
);

// Get outstanding payments report
router.get(
  '/reports/outstanding',
  isAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  billingController.getOutstandingPayments
);

// Get financial dashboard stats
router.get(
  '/stats',
  isAdmin,
  [
    query('patientId').optional().isUUID(),
    query('treatmentId').optional().isUUID(),
  ],
  billingController.getFinancialStats
);

export default router;

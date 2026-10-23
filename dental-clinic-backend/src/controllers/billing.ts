import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Prisma, PaymentStatus } from '@prisma/client';
import { prisma } from '../index';
import { createAuditLog, AuditActions, EntityTypes } from '../utils/audit';
import { generateInvoiceNumber } from '../utils/billing';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, eachDayOfInterval, subDays } from 'date-fns';

// ============== INVOICES ==============

// Get all invoices
export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { patientId, status, startDate, endDate, page = '1', limit = '10' } = req.query;

    const where: Prisma.InvoiceWhereInput = {};

    if (patientId) {
      where.patientId = patientId as string;
    }

    if (status) {
      where.status = status as PaymentStatus;
    }

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate as string);
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        items: true,
        payments: true,
        appointment: {
          select: {
            appointmentDate: true,
            },
          },
        },
        skip,
        take,
        orderBy: { issueDate: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      invoices,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get all invoices error:', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        items: true,
        payments: true,
        appointment: {
          include: {
            treatments: {
              include: {
                treatment: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch invoice' });
  }
};

// Create invoice
export const createInvoice = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { patientId, appointmentId, dueDate, items, taxAmount = 0, discountAmount = 0, notes } = req.body;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);

    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          patientId,
          appointmentId,
          dueDate: new Date(dueDate),
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          balanceDue: totalAmount,
          notes,
          createdById: req.user?.userId || null,
          items: {
            create: items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              treatmentId: item.treatmentId,
            })),
          },
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          items: true,
        },
      });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: 'New Invoice',
        message: `A new invoice (#${invoiceNumber}) for $${totalAmount.toFixed(2)} has been created`,
        type: 'payment',
        data: { invoiceId: invoice.id },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.CREATE,
      entityType: EntityTypes.INVOICE,
      entityId: invoice.id,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice,
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Failed to create invoice' });
  }
};

// Update invoice
export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { dueDate, notes } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        items: true,
      },
    });

    res.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Failed to update invoice' });
  }
};

// Delete invoice
export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.DELETE,
      entityType: EntityTypes.INVOICE,
      entityId: invoice.id,
      oldValue: invoice,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Failed to delete invoice' });
  }
};

// Update invoice status
export const updateInvoiceStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status },
    });

    res.json({
      message: 'Invoice status updated successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ message: 'Failed to update invoice status' });
  }
};

// Apply discount to invoice
export const applyInvoiceDiscount = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { discountAmount } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const subtotal = Number(invoice.subtotal);
    const taxAmount = Number(invoice.taxAmount);
    const newDiscount = Number(discountAmount);
    const totalAmount = Math.max(0, subtotal + taxAmount - newDiscount);
    const paidAmount = Number(invoice.paidAmount);
    const balanceDue = Math.max(0, totalAmount - paidAmount);

    let status = invoice.status;
    if (balanceDue <= 0) {
      status = PaymentStatus.PAID;
    } else if (paidAmount > 0) {
      status = PaymentStatus.PARTIAL;
    } else {
      status = PaymentStatus.PENDING;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        discountAmount: newDiscount,
        totalAmount,
        balanceDue,
        status,
      },
    });

    res.json({
      message: 'Discount applied successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Apply discount error:', error);
    res.status(500).json({ message: 'Failed to apply discount' });
  }
};

// Download invoice (placeholder - would generate PDF in production)
export const downloadInvoice = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // In production, generate PDF here
    // For now, return JSON
    res.json({
      message: 'Invoice download ready',
      invoice,
      downloadUrl: `/api/billing/invoices/${id}/download`,
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({ message: 'Failed to download invoice' });
  }
};

// ============== PAYMENTS ==============

// Get all payments
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { patientId, invoiceId, startDate, endDate, page = '1', limit = '10' } = req.query;

    const where: Prisma.PaymentWhereInput = {};

    if (patientId) {
      where.patientId = patientId as string;
    }

    if (invoiceId) {
      where.invoiceId = invoiceId as string;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate as string);
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          invoice: {
            select: {
              invoiceNumber: true,
            },
          },
        },
        skip,
        take,
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      payments,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

// Get payment by ID
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        invoice: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch payment' });
  }
};

// Create payment
export const createPayment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { invoiceId, patientId, amount, method, reference, notes, paymentDate } = req.body;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // If invoice is provided, update invoice balance
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      if (invoice.status === PaymentStatus.PAID) {
        return res.status(400).json({ message: 'Invoice is already paid' });
      }

      const newPaidAmount = Number(invoice.paidAmount) + amount;
      const newBalanceDue = Number(invoice.totalAmount) - newPaidAmount;

      let newStatus = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = PaymentStatus.PAID;
      } else if (newPaidAmount > 0) {
        newStatus = PaymentStatus.PARTIAL;
      }

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: Math.max(0, newBalanceDue),
          status: newStatus,
        },
      });
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        patientId,
        amount,
        method,
        reference,
        notes,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        processedBy: req.user?.userId,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        invoice: {
          select: {
            invoiceNumber: true,
          },
        },
      },
    });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: 'Payment Received',
        message: `A payment of $${amount.toFixed(2)} has been received${invoiceId ? ` for invoice #${payment.invoice?.invoiceNumber}` : ''}`,
        type: 'payment',
        data: { paymentId: payment.id },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.CREATE,
      entityType: EntityTypes.PAYMENT,
      entityId: payment.id,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'Payment created successfully',
      payment,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Failed to create payment' });
  }
};

// ============== REPORTS ==============

// Get revenue report
export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { startDate, endDate, groupBy = 'day', patientId, treatmentId } = req.query;

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const paymentWhere: any = {
      paymentDate: {
        gte: start,
        lte: end,
      },
    };

    const invoiceWhere: any = {
      issueDate: {
        gte: start,
        lte: end,
      },
    };

    if (patientId) {
      paymentWhere.patientId = patientId as string;
      invoiceWhere.patientId = patientId as string;
    }

    if (treatmentId) {
      paymentWhere.invoice = {
        items: { some: { treatmentId: treatmentId as string } },
      };
      invoiceWhere.items = { some: { treatmentId: treatmentId as string } };
    }

    // Get payments within date range
    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      orderBy: {
        paymentDate: 'asc',
      },
    });

    // Get invoices within date range
    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      orderBy: {
        issueDate: 'asc',
      },
    });

    // Calculate totals
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const totalOutstanding = invoices
      .filter((i) => i.status !== PaymentStatus.PAID)
      .reduce((sum, i) => sum + Number(i.balanceDue), 0);

    // Group by date
    const revenueByDate: Record<string, number> = {};
    payments.forEach((payment) => {
      const date = format(payment.paymentDate, 'yyyy-MM-dd');
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(payment.amount);
    });

    res.json({
      summary: {
        totalRevenue,
        totalInvoiced,
        totalOutstanding,
        paymentCount: payments.length,
        invoiceCount: invoices.length,
      },
      revenueByDate,
      payments,
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({ message: 'Failed to generate revenue report' });
  }
};

// Get outstanding payments
export const getOutstandingPayments = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE],
          },
          balanceDue: {
            gt: 0,
          },
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        skip,
        take,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.invoice.count({
        where: {
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE],
          },
          balanceDue: {
            gt: 0,
          },
        },
      }),
    ]);

    const totalOutstanding = invoices.reduce((sum, i) => sum + Number(i.balanceDue), 0);

    res.json({
      invoices,
      totalOutstanding,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get outstanding payments error:', error);
    res.status(500).json({ message: 'Failed to fetch outstanding payments' });
  }
};

// Get financial stats
export const getFinancialStats = async (req: Request, res: Response) => {
  try {
    const { patientId, treatmentId } = req.query;
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisMonth = startOfMonth(today);
    const endOfThisMonth = endOfMonth(today);
    const startOfLast30Days = subDays(today, 30);

    const paymentFilter = (start: Date, end: Date) => {
      const where: any = {
        paymentDate: { gte: start, lte: end },
      };
      if (patientId) {
        where.patientId = patientId as string;
      }
      if (treatmentId) {
        where.invoice = {
          items: { some: { treatmentId: treatmentId as string } },
        };
      }
      return where;
    };

    const invoiceFilter = () => {
      const where: any = {
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE],
        },
      };
      if (patientId) {
        where.patientId = patientId as string;
      }
      if (treatmentId) {
        where.items = { some: { treatmentId: treatmentId as string } };
      }
      return where;
    };

    // Today's revenue
    const todayRevenue = await prisma.payment.aggregate({
      where: paymentFilter(startOfToday, endOfToday),
      _sum: { amount: true },
    });

    // This month's revenue
    const monthRevenue = await prisma.payment.aggregate({
      where: paymentFilter(startOfThisMonth, endOfThisMonth),
      _sum: { amount: true },
    });

    // Last 30 days revenue
    const last30DaysRevenue = await prisma.payment.aggregate({
      where: paymentFilter(startOfLast30Days, endOfToday),
      _sum: { amount: true },
    });

    // Outstanding balance
    const outstandingBalance = await prisma.invoice.aggregate({
      where: invoiceFilter(),
      _sum: { balanceDue: true },
    });

    // Invoice counts by status
    const invoiceCounts = await prisma.invoice.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Today's payments count
    const todayPaymentsCount = await prisma.payment.count({
      where: {
        paymentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    res.json({
      today: {
        revenue: todayRevenue._sum.amount || 0,
        paymentsCount: todayPaymentsCount,
      },
      thisMonth: {
        revenue: monthRevenue._sum.amount || 0,
      },
      last30Days: {
        revenue: last30DaysRevenue._sum.amount || 0,
      },
      outstanding: {
        balance: outstandingBalance._sum.balanceDue || 0,
      },
      invoices: invoiceCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Get financial stats error:', error);
    res.status(500).json({ message: 'Failed to fetch financial stats' });
  }
};

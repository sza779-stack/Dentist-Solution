import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Prisma, ToothNotation, ToothTreatmentStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../index';
import { createAuditLog, AuditActions, EntityTypes } from '../utils/audit';
import { generateInvoiceNumber } from '../utils/billing';

// ============== CATEGORIES ==============

// Diagnosis catalog for Tooth Chart (managed via clinic settings)
export const getDiagnosisCatalog = async (_req: Request, res: Response) => {
  try {
    const setting = await prisma.clinicSetting.findUnique({
      where: { key: 'diagnosis_catalog' },
    });

    if (!setting?.value) {
      return res.json({ diagnoses: [] });
    }

    let parsed: unknown = [];
    try {
      parsed = JSON.parse(setting.value);
    } catch {
      parsed = [];
    }

    const diagnoses = Array.isArray(parsed)
      ? parsed
          .filter((item: any) => item?.code && item?.description)
          .map((item: any) => ({
            code: String(item.code),
            description: String(item.description),
          }))
      : [];

    res.json({ diagnoses });
  } catch (error) {
    console.error('Get diagnosis catalog error:', error);
    res.status(500).json({ message: 'Failed to fetch diagnosis catalog' });
  }
};

// Get all categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.treatmentCategory_model.findMany({
      include: {
        _count: {
          select: { treatments: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// Create category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, description, icon, color } = req.body;

    const existingCategory = await prisma.treatmentCategory_model.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return res.status(409).json({ message: 'Category name already exists' });
    }

    const category = await prisma.treatmentCategory_model.create({
      data: {
        name,
        description,
        icon,
        color,
      },
    });

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, icon, color, isActive } = req.body;

    const category = await prisma.treatmentCategory_model.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name && name !== category.name) {
      const existingCategory = await prisma.treatmentCategory_model.findUnique({
        where: { name },
      });
      if (existingCategory) {
        return res.status(409).json({ message: 'Category name already exists' });
      }
    }

    const updatedCategory = await prisma.treatmentCategory_model.update({
      where: { id },
      data: {
        name,
        description,
        icon,
        color,
        isActive,
      },
    });

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
};

// ============== TREATMENTS ==============

// Get all treatments
export const getAllTreatments = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { categoryId, isActive, search } = req.query;

    const where: Prisma.TreatmentWhereInput = {};

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const treatments = await prisma.treatment.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ treatments });
  } catch (error) {
    console.error('Get all treatments error:', error);
    res.status(500).json({ message: 'Failed to fetch treatments' });
  }
};

// Get treatment by ID
export const getTreatmentById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const treatment = await prisma.treatment.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    res.json({ treatment });
  } catch (error) {
    console.error('Get treatment by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch treatment' });
  }
};

// Create treatment
export const createTreatment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      categoryId,
      name,
      description,
      duration,
      price,
      cost,
      code,
      requiresConsultation,
    } = req.body;

    // Check if category exists
    const category = await prisma.treatmentCategory_model.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if code is unique
    if (code) {
      const existingTreatment = await prisma.treatment.findUnique({
        where: { code },
      });
      if (existingTreatment) {
        return res.status(409).json({ message: 'Treatment code already exists' });
      }
    }

    const treatment = await prisma.treatment.create({
      data: {
        categoryId,
        name,
        description,
        duration,
        price,
        cost,
        code,
        requiresConsultation: requiresConsultation || false,
      },
      include: {
        category: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.CREATE,
      entityType: EntityTypes.TREATMENT,
      entityId: treatment.id,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'Treatment created successfully',
      treatment,
    });
  } catch (error) {
    console.error('Create treatment error:', error);
    res.status(500).json({ message: 'Failed to create treatment' });
  }
};

// Update treatment
export const updateTreatment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const {
      categoryId,
      name,
      description,
      duration,
      price,
      cost,
      code,
      isActive,
      requiresConsultation,
    } = req.body;

    const treatment = await prisma.treatment.findUnique({
      where: { id },
    });

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    // Check if code is unique
    if (code && code !== treatment.code) {
      const existingTreatment = await prisma.treatment.findUnique({
        where: { code },
      });
      if (existingTreatment) {
        return res.status(409).json({ message: 'Treatment code already exists' });
      }
    }

    const oldValue = { ...treatment };

    const updatedTreatment = await prisma.treatment.update({
      where: { id },
      data: {
        categoryId,
        name,
        description,
        duration,
        price,
        cost,
        code,
        isActive,
        requiresConsultation,
      },
      include: {
        category: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.UPDATE,
      entityType: EntityTypes.TREATMENT,
      entityId: treatment.id,
      oldValue,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Treatment updated successfully',
      treatment: updatedTreatment,
    });
  } catch (error) {
    console.error('Update treatment error:', error);
    res.status(500).json({ message: 'Failed to update treatment' });
  }
};

// Delete treatment
export const deleteTreatment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const treatment = await prisma.treatment.findUnique({
      where: { id },
    });

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    await prisma.treatment.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.DELETE,
      entityType: EntityTypes.TREATMENT,
      entityId: treatment.id,
      oldValue: treatment,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Treatment deleted successfully' });
  } catch (error) {
    console.error('Delete treatment error:', error);
    res.status(500).json({ message: 'Failed to delete treatment' });
  }
};

// ============== TOOTH TREATMENTS ==============

// Get tooth treatments
export const getToothTreatments = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { patientId, appointmentId } = req.query;

    const where: Prisma.ToothTreatmentWhereInput = {};

    if (patientId) {
      where.patientId = patientId as string;
    }
    if (appointmentId) {
      where.appointmentId = appointmentId as string;
    }

    const treatments = await prisma.toothTreatment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        appointment: {
          select: {
            appointmentDate: true,
            status: true,
          },
        },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ treatments });
  } catch (error) {
    console.error('Get tooth treatments error:', error);
    res.status(500).json({ message: 'Failed to fetch tooth treatments' });
  }
};

// Create tooth treatment
export const createToothTreatment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      patientId,
      appointmentId,
      toothNumber,
      notation = ToothNotation.UNIVERSAL,
      surfaces = [],
      diagnosis,
      treatmentType,
      notes,
      status = ToothTreatmentStatus.PLANNED,
      cost,
    } = req.body;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    let appointment = null;
    if (appointmentId) {
      appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      if (appointment.patientId !== patientId) {
        return res.status(400).json({ message: 'Appointment does not belong to patient' });
      }
    }

    const staff = await prisma.staff.findFirst({
      where: { userId: req.user?.userId },
    });

    if (!staff) {
      return res.status(403).json({ message: 'Doctor profile not found' });
    }

    const created = await prisma.toothTreatment.create({
      data: {
        patientId,
        doctorId: staff.id,
        appointmentId: appointmentId || null,
        toothNumber,
        notation,
        surfaces,
        diagnosis,
        treatmentType,
        notes,
        status,
        cost,
      },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        attachments: true,
      },
    });

    // Auto-create invoice if cost is provided and greater than 0
    if (cost && Number(cost) > 0) {
      try {
        const invoiceNumber = await generateInvoiceNumber();
        const toothDisplay = notation === ToothNotation.FDI ? `FDI ${toothNumber}` : `Tooth #${toothNumber}`;
        
        await prisma.invoice.create({
          data: {
            invoiceNumber,
            patientId,
            appointmentId: appointmentId || null,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
            subtotal: Number(cost),
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: Number(cost),
            balanceDue: Number(cost),
            status: PaymentStatus.PENDING,
            notes: `Auto-generated for ${treatmentType} on ${toothDisplay}`,
            createdById: req.user?.userId || null,
            items: {
              create: [
                {
                  description: `${treatmentType} - ${toothDisplay}${diagnosis ? ` (${diagnosis})` : ''}`,
                  quantity: 1,
                  unitPrice: Number(cost),
                  totalPrice: Number(cost),
                },
              ],
            },
          },
        });
      } catch (invoiceError) {
        console.error('Failed to auto-create invoice for treatment:', invoiceError);
        // Don't fail the treatment creation if invoice creation fails
      }
    }

    res.status(201).json({ message: 'Tooth treatment created', treatment: created });
  } catch (error) {
    console.error('Create tooth treatment error:', error);
    res.status(500).json({ message: 'Failed to create tooth treatment' });
  }
};

// Update tooth treatment
export const updateToothTreatment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const {
      toothNumber,
      notation,
      surfaces,
      diagnosis,
      treatmentType,
      notes,
      status,
      cost,
    } = req.body;

    const existing = await prisma.toothTreatment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Tooth treatment not found' });
    }

    const updated = await prisma.toothTreatment.update({
      where: { id },
      data: {
        toothNumber,
        notation,
        surfaces,
        diagnosis,
        treatmentType,
        notes,
        status,
        cost,
      },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        attachments: true,
      },
    });

    res.json({ message: 'Tooth treatment updated', treatment: updated });
  } catch (error) {
    console.error('Update tooth treatment error:', error);
    res.status(500).json({ message: 'Failed to update tooth treatment' });
  }
};

// Get attachments for a tooth treatment
export const getToothTreatmentAttachments = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const attachments = await prisma.toothTreatmentAttachment.findMany({
      where: { treatmentId: id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ attachments });
  } catch (error) {
    console.error('Get tooth treatment attachments error:', error);
    res.status(500).json({ message: 'Failed to fetch attachments' });
  }
};

// Upload attachment for a tooth treatment
export const uploadToothTreatmentAttachment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const treatment = await prisma.toothTreatment.findUnique({
      where: { id },
    });

    if (!treatment) {
      return res.status(404).json({ message: 'Tooth treatment not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Attachment file is required' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/xrays/${req.file.filename}`;

    const attachment = await prisma.toothTreatmentAttachment.create({
      data: {
        treatmentId: id,
        fileUrl,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });

    res.status(201).json({ message: 'Attachment uploaded', attachment });
  } catch (error) {
    console.error('Upload tooth treatment attachment error:', error);
    res.status(500).json({ message: 'Failed to upload attachment' });
  }
};

// Delete attachment
export const deleteToothTreatmentAttachment = async (req: Request, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const attachment = await prisma.toothTreatmentAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    await prisma.toothTreatmentAttachment.delete({
      where: { id: attachmentId },
    });

    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Failed to delete attachment' });
  }
};

// ============== TREATMENT PLANS ==============

// Get all treatment plans
export const getAllTreatmentPlans = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { patientId, status } = req.query;

    const where: Prisma.TreatmentPlanWhereInput = {};

    if (patientId) {
      where.patientId = patientId as string;
    }

    if (status) {
      where.status = status as string;
    }

    const treatmentPlans = await prisma.treatmentPlan.findMany({
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
        items: {
          include: {
            treatment: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ treatmentPlans });
  } catch (error) {
    console.error('Get all treatment plans error:', error);
    res.status(500).json({ message: 'Failed to fetch treatment plans' });
  }
};

// Get treatment plan by ID
export const getTreatmentPlanById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const treatmentPlan = await prisma.treatmentPlan.findUnique({
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
        items: {
          include: {
            treatment: true,
          },
        },
      },
    });

    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    res.json({ treatmentPlan });
  } catch (error) {
    console.error('Get treatment plan by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch treatment plan' });
  }
};

// Create treatment plan
export const createTreatmentPlan = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { patientId, name, description, items } = req.body;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Calculate total cost
    const totalCost = items.reduce((sum: number, item: any) => {
      return sum + item.unitPrice * item.quantity - (item.discount || 0);
    }, 0);

    const treatmentPlan = await prisma.treatmentPlan.create({
      data: {
        patientId,
        name,
        description,
        totalCost,
        createdBy: req.user?.userId || '',
        items: {
          create: items.map((item: any) => ({
            treatmentId: item.treatmentId,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            scheduledDate: item.scheduledDate ? new Date(item.scheduledDate) : null,
            notes: item.notes,
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
        items: {
          include: {
            treatment: true,
          },
        },
      },
    });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: 'New Treatment Plan',
        message: `A new treatment plan "${name}" has been created for you`,
        type: 'system',
        data: { treatmentPlanId: treatmentPlan.id },
      },
    });

    res.status(201).json({
      message: 'Treatment plan created successfully',
      treatmentPlan,
    });
  } catch (error) {
    console.error('Create treatment plan error:', error);
    res.status(500).json({ message: 'Failed to create treatment plan' });
  }
};

// Update treatment plan
export const updateTreatmentPlan = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, status, startDate, endDate } = req.body;

    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { id },
    });

    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    const updatedTreatmentPlan = await prisma.treatmentPlan.update({
      where: { id },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
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
        items: {
          include: {
            treatment: true,
          },
        },
      },
    });

    res.json({
      message: 'Treatment plan updated successfully',
      treatmentPlan: updatedTreatmentPlan,
    });
  } catch (error) {
    console.error('Update treatment plan error:', error);
    res.status(500).json({ message: 'Failed to update treatment plan' });
  }
};

// Approve treatment plan
export const approveTreatmentPlan = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { id },
    });

    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    const updatedTreatmentPlan = await prisma.treatmentPlan.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: req.user?.userId,
        approvedAt: new Date(),
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
        items: {
          include: {
            treatment: true,
          },
        },
      },
    });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: treatmentPlan.patientId,
        title: 'Treatment Plan Approved',
        message: `Your treatment plan "${treatmentPlan.name}" has been approved`,
        type: 'system',
        data: { treatmentPlanId: treatmentPlan.id },
      },
    });

    res.json({
      message: 'Treatment plan approved successfully',
      treatmentPlan: updatedTreatmentPlan,
    });
  } catch (error) {
    console.error('Approve treatment plan error:', error);
    res.status(500).json({ message: 'Failed to approve treatment plan' });
  }
};

// Delete treatment plan
export const deleteTreatmentPlan = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const treatmentPlan = await prisma.treatmentPlan.findUnique({
      where: { id },
    });

    if (!treatmentPlan) {
      return res.status(404).json({ message: 'Treatment plan not found' });
    }

    await prisma.treatmentPlan.delete({
      where: { id },
    });

    res.json({ message: 'Treatment plan deleted successfully' });
  } catch (error) {
    console.error('Delete treatment plan error:', error);
    res.status(500).json({ message: 'Failed to delete treatment plan' });
  }
};

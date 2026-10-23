import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Role, Prisma, AppointmentStatus, PrescriptionStatus } from '@prisma/client';
import { prisma } from '../index';
import { hashPassword, generateRandomPassword } from '../utils/password';
import { createAuditLog, AuditActions, EntityTypes } from '../utils/audit';
import { startOfDay, endOfDay } from 'date-fns';

const prescriptionInclude = {
  prescribedBy: {
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  },
} satisfies Prisma.PrescriptionInclude;

const getOrCreatePrescriberStaffProfile = async (userId?: string) => {
  if (!userId) {
    return null;
  }

  const existingStaff = await prisma.staff.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (existingStaff) {
    return existingStaff;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, role: true },
  });

  if (!user) {
    return null;
  }

  const employeeId = `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return prisma.staff.create({
    data: {
      userId,
      employeeId,
      hireDate: new Date(),
      department: 'Prescriptions',
      specialization: user.role === Role.ADMIN ? 'Administration' : 'General Practice',
      biography: `${user.firstName} ${user.lastName} prescription profile`,
      isAvailable: false,
    },
    select: { id: true },
  });
};

// Get all patients
export const getAllPatients = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { search, page = '1', limit = '10' } = req.query;

    const where: Prisma.PatientWhereInput = {};

    if (search) {
      where.OR = [
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
        { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { user: { phone: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                isActive: true,
                createdAt: true,
              },
            },
            assignedDoctor: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    role: true,
                  },
                },
              },
            },
            _count: {
              select: {
                appointments: true,
                invoices: true,
              },
            },
        },
        skip,
        take,
        orderBy: {
          user: {
            createdAt: 'desc',
          },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    res.json({
      patients,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get all patients error:', error);
    res.status(500).json({ message: 'Failed to fetch patients' });
  }
};

// Get patient by ID
export const getPatientById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
              createdAt: true,
              lastLoginAt: true,
            },
          },
          assignedDoctor: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              appointments: true,
              treatmentPlans: true,
              invoices: true,
            },
          },
          prescriptions: {
            include: prescriptionInclude,
            orderBy: { createdAt: 'desc' },
          },
      },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch patient' });
  }
};

// Create patient
export const createPatient = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        address,
        city,
        state,
        zipCode,
        emergencyContact,
        emergencyPhone,
        insuranceProvider,
        insurancePolicyNumber,
        insuranceGroupNumber,
        medicalHistory,
        allergies,
        medications,
        notes,
        assignedDoctorId,
      } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Generate password if not provided
    const userPassword = password || generateRandomPassword();
    const hashedPassword = await hashPassword(userPassword);

      const doctorAssignment =
        req.user?.role === Role.ADMIN
          ? (assignedDoctorId ? { assignedDoctorId } : { assignedDoctorId: null })
          : {};

      if (assignedDoctorId && req.user?.role === Role.ADMIN) {
        const doctor = await prisma.staff.findUnique({ where: { id: assignedDoctorId } });
        if (!doctor) {
          return res.status(400).json({ message: 'Assigned doctor not found' });
        }
      }

      const patient = await prisma.patient.create({
        data: {
          user: {
            create: {
              email,
              password: hashedPassword,
              firstName,
              lastName,
              phone,
              role: Role.PATIENT,
            },
          },
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          address,
          city,
          state,
          zipCode,
          emergencyContact,
          emergencyPhone,
          insuranceProvider,
          insurancePolicyNumber,
          insuranceGroupNumber,
          medicalHistory,
          allergies,
          medications,
          notes,
          ...doctorAssignment,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              isActive: true,
            },
          },
          assignedDoctor: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
        },
      });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.CREATE,
      entityType: EntityTypes.PATIENT,
      entityId: patient.id,
      newValue: { email, firstName, lastName },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'Patient created successfully',
      patient,
      ...(password && { generatedPassword: userPassword }),
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: 'Failed to create patient' });
  }
};

// Update patient
export const updatePatient = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
      const {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        address,
        city,
        state,
        zipCode,
        emergencyContact,
        emergencyPhone,
        insuranceProvider,
        insurancePolicyNumber,
        insuranceGroupNumber,
        medicalHistory,
        allergies,
        medications,
        notes,
        assignedDoctorId,
      } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const oldValue = { ...patient };

      const doctorAssignment =
        req.user?.role === Role.ADMIN
          ? { assignedDoctorId: assignedDoctorId ? assignedDoctorId : null }
          : {};

      if (assignedDoctorId && req.user?.role === Role.ADMIN) {
        const doctor = await prisma.staff.findUnique({ where: { id: assignedDoctorId } });
        if (!doctor) {
          return res.status(400).json({ message: 'Assigned doctor not found' });
        }
      }

      const updatedPatient = await prisma.patient.update({
        where: { id },
        data: {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          address,
          city,
          state,
          zipCode,
          emergencyContact,
          emergencyPhone,
          insuranceProvider,
          insurancePolicyNumber,
          insuranceGroupNumber,
          medicalHistory,
          allergies,
          medications,
          notes,
          ...doctorAssignment,
          user: {
            update: {
              firstName,
              lastName,
              phone,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              isActive: true,
            },
          },
          assignedDoctor: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
          },
        },
      });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.UPDATE,
      entityType: EntityTypes.PATIENT,
      entityId: patient.id,
      oldValue,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Patient updated successfully',
      patient: updatedPatient,
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Failed to update patient' });
  }
};

// Delete patient
export const deletePatient = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await prisma.patient.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.DELETE,
      entityType: EntityTypes.PATIENT,
      entityId: patient.id,
      oldValue: patient,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Failed to delete patient' });
  }
};

// Get patient appointments
export const getPatientAppointments = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId: id },
        include: {
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
          treatments: {
            include: {
              treatment: true,
            },
          },
        },
        skip,
        take,
        orderBy: { appointmentDate: 'desc' },
      }),
      prisma.appointment.count({ where: { patientId: id } }),
    ]);

    res.json({
      appointments,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({ message: 'Failed to fetch patient appointments' });
  }
};

// Get patient treatments
export const getPatientTreatments = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const treatmentPlans = await prisma.treatmentPlan.findMany({
      where: { patientId: id },
      include: {
        items: {
          include: {
            treatment: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const appointmentTreatments = await prisma.appointmentTreatment.findMany({
      where: {
        appointment: {
          patientId: id,
        },
      },
      include: {
        treatment: true,
        appointment: {
          select: {
            appointmentDate: true,
            status: true,
          },
        },
      },
      orderBy: {
        appointment: {
          appointmentDate: 'desc',
        },
      },
    });

    res.json({
      treatmentPlans,
      appointmentTreatments,
    });
  } catch (error) {
    console.error('Get patient treatments error:', error);
    res.status(500).json({ message: 'Failed to fetch patient treatments' });
  }
};

// Get patient invoices
export const getPatientInvoices = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { patientId: id },
        include: {
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
      prisma.invoice.count({ where: { patientId: id } }),
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
    console.error('Get patient invoices error:', error);
    res.status(500).json({ message: 'Failed to fetch patient invoices' });
  }
};

export const getPatientPrescriptions = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const patient = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: id },
      include: prescriptionInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ prescriptions });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({ message: 'Failed to fetch patient prescriptions' });
  }
};

export const createPatientPrescription = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const patient = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const prescriber = await getOrCreatePrescriberStaffProfile(req.user?.userId);
    if (!prescriber) {
      return res.status(403).json({ message: 'Prescribing staff profile not found' });
    }

    const prescription = await prisma.prescription.create({
      data: {
        patientId: id,
        prescribedById: prescriber.id,
        medicationName: req.body.medicationName,
        dosage: req.body.dosage,
        frequency: req.body.frequency,
        duration: req.body.duration,
        quantity: req.body.quantity,
        refills: req.body.refills ?? 0,
        instructions: req.body.instructions,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        status: req.body.status || PrescriptionStatus.ACTIVE,
      },
      include: prescriptionInclude,
    });

    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.CREATE,
      entityType: 'PRESCRIPTION',
      entityId: prescription.id,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ message: 'Prescription created successfully', prescription });
  } catch (error) {
    console.error('Create patient prescription error:', error);
    res.status(500).json({ message: 'Failed to create prescription' });
  }
};

export const updatePatientPrescription = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id, prescriptionId } = req.params;
    const existing = await prisma.prescription.findFirst({
      where: { id: prescriptionId, patientId: id },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const prescription = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        medicationName: req.body.medicationName,
        dosage: req.body.dosage,
        frequency: req.body.frequency,
        duration: req.body.duration,
        quantity: req.body.quantity,
        refills: req.body.refills,
        instructions: req.body.instructions,
        startDate: req.body.startDate ? new Date(req.body.startDate) : req.body.startDate === null ? null : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : req.body.endDate === null ? null : undefined,
        status: req.body.status,
      },
      include: prescriptionInclude,
    });

    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.UPDATE,
      entityType: 'PRESCRIPTION',
      entityId: prescription.id,
      oldValue: existing,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Prescription updated successfully', prescription });
  } catch (error) {
    console.error('Update patient prescription error:', error);
    res.status(500).json({ message: 'Failed to update prescription' });
  }
};

export const deletePatientPrescription = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id, prescriptionId } = req.params;
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, patientId: id },
    });
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    await prisma.prescription.delete({ where: { id: prescriptionId } });

    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.DELETE,
      entityType: 'PRESCRIPTION',
      entityId: prescription.id,
      oldValue: prescription,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Delete patient prescription error:', error);
    res.status(500).json({ message: 'Failed to delete prescription' });
  }
};

// Get patient portal data (for logged-in patient)
export const getPatientPortalData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const patient = await prisma.patient.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        appointments: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    avatarUrl: true,
                    role: true,
                  },
                },
              },
            },
            treatments: {
              include: {
                treatment: true,
              },
            },
          },
          orderBy: { appointmentDate: 'desc' },
          take: 10,
        },
        treatmentPlans: {
          include: {
            items: {
              include: {
                treatment: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
            include: {
              items: true,
              payments: true,
              createdBy: {
                select: {
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            orderBy: { issueDate: 'desc' },
            take: 10,
          },
        prescriptions: {
          include: prescriptionInclude,
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
          take: 10,
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    // Get unread notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get unread messages
    const messages = await prisma.message.findMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

      res.json({
        patient,
        prescriptions: await prisma.prescription.findMany({
          where: { patientId: patient.id },
          include: prescriptionInclude,
          orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        }),
        appointmentTreatments: await prisma.appointmentTreatment.findMany({
          where: {
            appointment: {
              patientId: patient.id,
            },
          },
          include: {
            treatment: true,
            appointment: {
              select: {
                appointmentDate: true,
                status: true,
              },
            },
          },
          orderBy: {
            appointment: {
              appointmentDate: 'desc',
            },
          },
        }),
        toothTreatments: await prisma.toothTreatment.findMany({
          where: {
            patientId: patient.id,
          },
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    role: true,
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
          orderBy: {
            createdAt: 'desc',
          },
        }),
        notifications,
        messages,
      });
  } catch (error) {
    console.error('Get patient portal data error:', error);
    res.status(500).json({ message: 'Failed to fetch patient portal data' });
  }
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const checkDoctorConflict = async (
  doctorId: string,
  appointmentDate: Date,
  startTime: string,
  endTime: string
): Promise<boolean> => {
  const where: Prisma.AppointmentWhereInput = {
    doctorId,
    appointmentDate: {
      gte: startOfDay(appointmentDate),
      lte: endOfDay(appointmentDate),
    },
    status: {
      notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
    },
    OR: [
      {
        startTime: { lte: startTime },
        endTime: { gt: startTime },
      },
      {
        startTime: { lt: endTime },
        endTime: { gte: endTime },
      },
      {
        startTime: { gte: startTime },
        endTime: { lte: endTime },
      },
    ],
  };

  const conflicts = await prisma.appointment.findMany({ where, select: { id: true } });
  return conflicts.length > 0;
};

export const getPortalDoctors = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const patient = await prisma.patient.findFirst({ where: { userId }, select: { id: true } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const staff = await prisma.staff.findMany({
      where: {
        isAvailable: true,
        user: {
          isActive: true,
          role: { in: [Role.DOCTOR, Role.DENTIST, Role.SPECIALIST] },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            role: true,
          },
        },
        schedules: {
          where: { isAvailable: true },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
      orderBy: [{ specialization: 'asc' }, { user: { firstName: 'asc' } }],
    });

    res.json({ staff });
  } catch (error) {
    console.error('Get portal doctors error:', error);
    res.status(500).json({ message: 'Failed to fetch doctors' });
  }
};

export const getPortalDoctorAvailability = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const patient = await prisma.patient.findFirst({ where: { userId }, select: { id: true } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const { doctorId } = req.params;
    const date = req.query.date as string;
    const selectedDate = new Date(date);
    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: 'Valid date is required' });
    }

    const doctor = await prisma.staff.findUnique({
      where: { id: doctorId },
      include: { user: { select: { role: true, isActive: true } } },
    });
    const isBookableRole =
      doctor?.user?.role === Role.DOCTOR ||
      doctor?.user?.role === Role.DENTIST ||
      doctor?.user?.role === Role.SPECIALIST;
    if (!doctor || !doctor.user?.isActive || !doctor.isAvailable || !isBookableRole) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const dayOfWeek = selectedDate.getDay();
    const schedule = await prisma.schedule.findUnique({
      where: { staffId_dayOfWeek: { staffId: doctorId, dayOfWeek } },
    });
    if (!schedule || !schedule.isAvailable) {
      return res.json({ availableSlots: [] });
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay(selectedDate),
          lte: endOfDay(selectedDate),
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const slots: string[] = [];
    let current = toMinutes(schedule.startTime);
    const end = toMinutes(schedule.endTime);
    while (current < end) {
      const slotStart = toHHMM(current);
      const slotEnd = toHHMM(current + 30);
      const isBooked = existingAppointments.some(
        (apt) => slotStart < apt.endTime && slotEnd > apt.startTime
      );
      if (!isBooked) {
        slots.push(slotStart);
      }
      current += 30;
    }

    res.json({
      date: selectedDate,
      schedule,
      availableSlots: slots,
    });
  } catch (error) {
    console.error('Get portal doctor availability error:', error);
    res.status(500).json({ message: 'Failed to fetch doctor availability' });
  }
};

export const createPortalAppointment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const patient = await prisma.patient.findFirst({
      where: { userId },
      select: { id: true, userId: true },
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const { doctorId, appointmentDate, startTime, endTime, type, reason, notes } = req.body;
    const selectedDate = new Date(appointmentDate);
    if (Number.isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: 'Valid appointment date is required' });
    }

    const doctor = await prisma.staff.findUnique({
      where: { id: doctorId },
      include: { user: { select: { role: true, isActive: true } } },
    });
    const isBookableRole =
      doctor?.user?.role === Role.DOCTOR ||
      doctor?.user?.role === Role.DENTIST ||
      doctor?.user?.role === Role.SPECIALIST;
    if (!doctor || !doctor.user?.isActive || !doctor.isAvailable || !isBookableRole) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const dayOfWeek = selectedDate.getDay();
    const schedule = await prisma.schedule.findUnique({
      where: { staffId_dayOfWeek: { staffId: doctorId, dayOfWeek } },
    });
    if (!schedule || !schedule.isAvailable) {
      return res.status(409).json({ message: 'Doctor is not available on selected day' });
    }

    const computedEndTime = endTime || toHHMM(toMinutes(startTime) + 30);
    const scheduleStart = toMinutes(schedule.startTime);
    const scheduleEnd = toMinutes(schedule.endTime);
    const selectedStart = toMinutes(startTime);
    const selectedEnd = toMinutes(computedEndTime);

    if (selectedStart < scheduleStart || selectedEnd > scheduleEnd || selectedEnd <= selectedStart) {
      return res.status(409).json({ message: 'Selected time is outside doctor schedule' });
    }

    const hasConflict = await checkDoctorConflict(
      doctorId,
      selectedDate,
      startTime,
      computedEndTime
    );
    if (hasConflict) {
      return res.status(409).json({ message: 'Time slot is already booked' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        appointmentDate: selectedDate,
        startTime,
        endTime: computedEndTime,
        type,
        reason,
        notes,
        status: AppointmentStatus.SCHEDULED,
      },
      include: {
        doctor: {
          include: {
            user: {
              select: { firstName: true, lastName: true, role: true },
            },
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: 'Appointment Requested',
        message: `Appointment booked for ${appointmentDate} at ${startTime}`,
        type: 'appointment',
        data: { appointmentId: appointment.id },
      },
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    console.error('Create portal appointment error:', error);
    res.status(500).json({ message: 'Failed to create appointment' });
  }
};

// Update patient portal profile
export const updatePatientPortalProfile = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const patient = await prisma.patient.findFirst({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const {
      firstName,
      lastName,
      phone,
      avatarUrl,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      emergencyContact,
      emergencyPhone,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceGroupNumber,
      medicalHistory,
      allergies,
      medications,
      notes,
    } = req.body;

    const updatedPatient = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        city,
        state,
        zipCode,
        emergencyContact,
        emergencyPhone,
        insuranceProvider,
        insurancePolicyNumber,
        insuranceGroupNumber,
        medicalHistory,
        allergies,
        medications,
        notes,
        user: {
          update: {
            firstName,
            lastName,
            phone,
            avatarUrl,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    res.json({
      message: 'Profile updated successfully',
      patient: updatedPatient,
    });
  } catch (error) {
    console.error('Update patient portal profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Upload patient avatar (for logged-in patient)
export const uploadPatientAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Avatar file is required' });
    }

    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
      },
    });

    res.json({
      message: 'Avatar uploaded successfully',
      user: updatedUser,
      avatarUrl,
    });
  } catch (error) {
    console.error('Upload patient avatar error:', error);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
};

// Get patient portal treatment history (for logged-in patient)
export const getPatientPortalTreatments = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const patient = await prisma.patient.findFirst({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const treatmentPlans = await prisma.treatmentPlan.findMany({
      where: { patientId: patient.id },
      include: {
        items: {
          include: {
            treatment: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

      const appointmentTreatments = await prisma.appointmentTreatment.findMany({
        where: {
          appointment: {
            patientId: patient.id,
          },
        },
        include: {
          treatment: true,
          appointment: {
            select: {
              appointmentDate: true,
              status: true,
            },
          },
        },
        orderBy: {
          appointment: {
            appointmentDate: 'desc',
          },
        },
      });

      res.json({
        treatmentPlans,
        appointmentTreatments,
        toothTreatments: await prisma.toothTreatment.findMany({
          where: {
            patientId: patient.id,
          },
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    role: true,
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
          orderBy: {
            createdAt: 'desc',
          },
        }),
      });
  } catch (error) {
    console.error('Get patient portal treatments error:', error);
    res.status(500).json({ message: 'Failed to fetch treatment history' });
  }
};

export const getPatientPortalPrescriptions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const patient = await prisma.patient.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: prescriptionInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ prescriptions });
  } catch (error) {
    console.error('Get patient portal prescriptions error:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions' });
  }
};

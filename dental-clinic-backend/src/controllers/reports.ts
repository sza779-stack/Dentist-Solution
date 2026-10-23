import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../index';
import { startOfDay, endOfDay, format, subDays } from 'date-fns';

// Get appointment statistics
export const getAppointmentStats = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : subDays(new Date(), 30);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Total appointments
    const totalAppointments = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: startOfDay(start),
          lte: endOfDay(end),
        },
      },
    });

    // Appointments by status
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        appointmentDate: {
          gte: startOfDay(start),
          lte: endOfDay(end),
        },
      },
      _count: {
        status: true,
      },
    });

    // Appointments by type
    const appointmentsByType = await prisma.appointment.groupBy({
      by: ['type'],
      where: {
        appointmentDate: {
          gte: startOfDay(start),
          lte: endOfDay(end),
        },
      },
      _count: {
        type: true,
      },
    });

    // Appointments by day
    const appointmentsByDay = await prisma.appointment.groupBy({
      by: ['appointmentDate'],
      where: {
        appointmentDate: {
          gte: startOfDay(start),
          lte: endOfDay(end),
        },
      },
      _count: {
        appointmentDate: true,
      },
      orderBy: {
        appointmentDate: 'asc',
      },
    });

    res.json({
      period: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      },
      totalAppointments,
      byStatus: appointmentsByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {} as Record<string, number>),
      byType: appointmentsByType.reduce((acc, curr) => {
        acc[curr.type] = curr._count.type;
        return acc;
      }, {} as Record<string, number>),
      byDay: appointmentsByDay.map((d) => ({
        date: format(d.appointmentDate, 'yyyy-MM-dd'),
        count: d._count.appointmentDate,
      })),
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({ message: 'Failed to fetch appointment statistics' });
  }
};

// Get patient statistics
export const getPatientStats = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : subDays(new Date(), 30);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Total patients
    const totalPatients = await prisma.patient.count();

    // New patients in period
    const newPatients = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfDay(start),
          lte: endOfDay(end),
        },
      },
    });

    // Patients by gender
    const patientsByGender = await prisma.patient.groupBy({
      by: ['gender'],
      _count: {
        gender: true,
      },
    });

    // Top patients by appointments
    const topPatients = await prisma.patient.findMany({
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: {
        appointments: {
          _count: 'desc',
        },
      },
    });

    res.json({
      period: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      },
      totalPatients,
      newPatients,
      byGender: patientsByGender.reduce((acc, curr) => {
        if (curr.gender) {
          acc[curr.gender] = curr._count.gender;
        }
        return acc;
      }, {} as Record<string, number>),
      topPatients: topPatients.map((p) => ({
        id: p.id,
        name: `${p.user.firstName} ${p.user.lastName}`,
        email: p.user.email,
        appointmentCount: p._count.appointments,
      })),
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({ message: 'Failed to fetch patient statistics' });
  }
};

// Get treatment statistics
export const getTreatmentStats = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : subDays(new Date(), 30);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Most performed treatments
    const treatmentCounts = await prisma.appointmentTreatment.groupBy({
      by: ['treatmentId'],
      where: {
        appointment: {
          appointmentDate: {
            gte: startOfDay(start),
            lte: endOfDay(end),
          },
        },
      },
      _count: {
        treatmentId: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _count: {
          treatmentId: 'desc',
        },
      },
      take: 10,
    });

    // Get treatment details
    const treatmentIds = treatmentCounts.map((t) => t.treatmentId);
    const treatments = await prisma.treatment.findMany({
      where: {
        id: {
          in: treatmentIds,
        },
      },
    });

    const topTreatments = treatmentCounts.map((tc) => {
      const treatment = treatments.find((t) => t.id === tc.treatmentId);
      return {
        id: tc.treatmentId,
        name: treatment?.name || 'Unknown',
        count: tc._count.treatmentId,
        totalQuantity: tc._sum.quantity || 0,
      };
    });

    // Revenue by treatment category
    const revenueByCategory = await prisma.appointmentTreatment.groupBy({
      by: ['treatmentId'],
      where: {
        appointment: {
          appointmentDate: {
            gte: startOfDay(start),
            lte: endOfDay(end),
          },
        },
      },
      _sum: {
        unitPrice: true,
      },
    });

    res.json({
      period: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      },
      topTreatments,
    });
  } catch (error) {
    console.error('Get treatment stats error:', error);
    res.status(500).json({ message: 'Failed to fetch treatment statistics' });
  }
};

// Get doctor performance
export const getDoctorPerformance = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : subDays(new Date(), 30);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get all doctors
    const doctors = await prisma.staff.findMany({
      where: {
        user: {
          role: {
            in: ['DOCTOR', 'DENTIST', 'SPECIALIST'],
          },
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    const doctorPerformance = await Promise.all(
      doctors.map(async (doctor) => {
        // Appointments count
        const appointmentsCount = await prisma.appointment.count({
          where: {
            doctorId: doctor.id,
            appointmentDate: {
              gte: startOfDay(start),
              lte: endOfDay(end),
            },
          },
        });

        // Completed appointments
        const completedAppointments = await prisma.appointment.count({
          where: {
            doctorId: doctor.id,
            status: 'COMPLETED',
            appointmentDate: {
              gte: startOfDay(start),
              lte: endOfDay(end),
            },
          },
        });

        // Revenue generated
        const revenue = await prisma.appointmentTreatment.aggregate({
          where: {
            appointment: {
              doctorId: doctor.id,
              appointmentDate: {
                gte: startOfDay(start),
                lte: endOfDay(end),
              },
            },
          },
          _sum: {
            unitPrice: true,
          },
        });

        return {
          id: doctor.id,
          name: `${doctor.user.firstName} ${doctor.user.lastName}`,
          role: doctor.user.role,
          specialization: doctor.specialization,
          appointmentsCount,
          completedAppointments,
          completionRate: appointmentsCount > 0 ? (completedAppointments / appointmentsCount) * 100 : 0,
          revenue: revenue._sum.unitPrice || 0,
        };
      })
    );

    res.json({
      period: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      },
      doctors: doctorPerformance.sort((a, b) => b.revenue - a.revenue),
    });
  } catch (error) {
    console.error('Get doctor performance error:', error);
    res.status(500).json({ message: 'Failed to fetch doctor performance' });
  }
};

// Get activity log
export const getActivityLog = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { startDate, endDate, page = '1', limit = '20' } = req.query;

    const start = startDate ? new Date(startDate as string) : subDays(new Date(), 7);
    const end = endDate ? new Date(endDate as string) : new Date();

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          createdAt: {
            gte: startOfDay(start),
            lte: endOfDay(end),
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: startOfDay(start),
            lte: endOfDay(end),
          },
        },
      }),
    ]);

    res.json({
      period: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      },
      logs,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ message: 'Failed to fetch activity log' });
  }
};

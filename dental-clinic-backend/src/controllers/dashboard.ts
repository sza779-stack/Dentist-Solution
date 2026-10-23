import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { prisma } from '../index';
import { startOfDay, endOfDay, addDays, format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Get main dashboard stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisMonth = startOfMonth(today);
    const startOfLastMonth = startOfMonth(subMonths(today, 1));
    const endOfLastMonth = endOfMonth(subMonths(today, 1));

    // Today's appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
    });

    // Total patients
    const totalPatients = await prisma.patient.count();

    // New patients this month
    const newPatientsThisMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfThisMonth,
        },
      },
    });

    // New patients last month (for comparison)
    const newPatientsLastMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // Pending payments
    const pendingPayments = await prisma.invoice.count({
      where: {
        status: {
          in: ['PENDING', 'PARTIAL', 'OVERDUE'],
        },
      },
    });

    // Today's revenue
    const todayRevenue = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // This month's revenue
    const thisMonthRevenue = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfThisMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Last month's revenue (for comparison)
    const lastMonthRevenue = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const lastMonthRevenueAmount = Number(lastMonthRevenue._sum.amount || 0);
    const thisMonthRevenueAmount = Number(thisMonthRevenue._sum.amount || 0);

    // Recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      take: 5,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Recent patients
    const recentPatients = await prisma.patient.findMany({
      take: 5,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Appointments by status
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Calculate trends
    const patientGrowthRate = newPatientsLastMonth > 0
      ? ((newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth) * 100
      : 0;

    const revenueGrowthRate = lastMonthRevenueAmount > 0
      ? ((thisMonthRevenueAmount - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100
      : 0;

    res.json({
      stats: {
        todayAppointments,
        totalPatients,
        newPatientsThisMonth,
        pendingPayments,
        todayRevenue: todayRevenue._sum.amount || 0,
        thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
        patientGrowthRate: Math.round(patientGrowthRate * 100) / 100,
        revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
      },
      recentAppointments,
      recentPatients,
      appointmentsByStatus: appointmentsByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

// Get admin dashboard stats
export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const startOfThisMonth = startOfMonth(today);
    const thirtyDaysAgo = subDays(today, 30);

    // User counts by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    // Active vs inactive users
    const activeUsers = await prisma.user.count({
      where: { isActive: true },
    });

    const inactiveUsers = await prisma.user.count({
      where: { isActive: false },
    });

    // Total revenue this month
    const monthlyRevenue = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfThisMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Revenue by payment method - use queryRaw for complex aggregations
    const revenueByMethod = await prisma.$queryRaw`
      SELECT 
        method as method,
        SUM(amount) as amount
      FROM "payments"
      WHERE "paymentDate" >= ${startOfThisMonth}
      GROUP BY method
    `;

    // System activity (last 24 hours)
    const recentActivity = await prisma.auditLog.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    // Recent activity breakdown
    const activityBreakdown = await prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10,
    });

    // Daily revenue for the last 30 days
    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE("paymentDate") as date,
        SUM(amount) as total
      FROM "payments"
      WHERE "paymentDate" >= ${thirtyDaysAgo}
      GROUP BY DATE("paymentDate")
      ORDER BY date ASC
    `;

    // Top treatments this month
    const topTreatments = await prisma.treatmentPlanItem.groupBy({
      by: ['treatmentId'],
      where: {
        createdAt: {
          gte: startOfThisMonth,
        },
      },
      _count: {
        treatmentId: true,
      },
      orderBy: {
        _count: {
          treatmentId: 'desc',
        },
      },
      take: 5,
    });

    // Get treatment details
    const treatmentDetails = await prisma.treatment.findMany({
      where: {
        id: {
          in: topTreatments.map(t => t.treatmentId),
        },
      },
      select: {
        id: true,
        name: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // Pending approvals (appointments awaiting confirmation)
    const pendingApprovals = await prisma.appointment.count({
      where: {
        status: 'SCHEDULED',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    res.json({
      users: {
        byRole: usersByRole.reduce((acc, curr) => {
          acc[curr.role] = curr._count.role;
          return acc;
        }, {} as Record<string, number>),
        active: activeUsers,
        inactive: inactiveUsers,
        total: activeUsers + inactiveUsers,
      },
      monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
      revenueByMethod: (revenueByMethod as any[]).map(r => ({
        method: r.method,
        amount: Number(r.amount) || 0,
      })),
      recentActivity,
      activityBreakdown: activityBreakdown.reduce((acc, curr) => {
        acc[curr.action] = curr._count.action;
        return acc;
      }, {} as Record<string, number>),
      dailyRevenue,
      topTreatments: topTreatments.map(t => ({
        count: t._count.treatmentId,
        treatment: treatmentDetails.find(td => td.id === t.treatmentId),
      })),
      pendingApprovals,
    });
  } catch (error) {
    console.error('Get admin dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch admin dashboard stats' });
  }
};

// Get doctor dashboard stats
export const getDoctorDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisMonth = startOfMonth(today);

    // Get doctor's staff ID
    const staff = await prisma.staff.findFirst({
      where: { userId },
    });

    if (!staff) {
      return res.json({
        todayAppointments: [],
        totalPatients: 0,
        completedThisMonth: 0,
        pendingTreatmentPlans: 0,
        upcomingAppointments: [],
      });
    }

    // Today's appointments for doctor
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: staff.id,
        appointmentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
      },
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
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Total unique patients assigned to doctor
    const totalPatients = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: {
        doctorId: staff.id,
      },
      _count: {
        patientId: true,
      },
    });

    // Completed appointments this month
    const completedThisMonth = await prisma.appointment.count({
      where: {
        doctorId: staff.id,
        status: 'COMPLETED',
        appointmentDate: {
          gte: startOfThisMonth,
        },
      },
    });

    // Pending treatment plans created by this doctor
    const pendingTreatmentPlans = await prisma.treatmentPlan.count({
      where: {
        status: 'DRAFT',
        createdBy: staff.id,
      },
    });

    // Upcoming appointments (next 7 days)
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: staff.id,
        appointmentDate: {
          gt: endOfToday,
          lte: endOfDay(addDays(today, 7)),
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
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
      },
      orderBy: {
        appointmentDate: 'asc',
      },
      take: 10,
    });

    // Monthly stats for the doctor
    const monthlyStats = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        doctorId: staff.id,
        appointmentDate: {
          gte: startOfThisMonth,
        },
      },
      _count: {
        status: true,
      },
    });

    res.json({
      todayAppointments,
      totalPatients: totalPatients.length,
      completedThisMonth,
      pendingTreatmentPlans,
      upcomingAppointments,
      monthlyStats: monthlyStats.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error) {
    console.error('Get doctor dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch doctor dashboard stats' });
  }
};

// Get receptionist dashboard stats
export const getReceptionistDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfThisMonth = startOfMonth(today);

    // Today's appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // Check-ins pending (scheduled appointments for today)
    const pendingCheckIns = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: 'SCHEDULED',
      },
    });

    // New patients today
    const newPatientsToday = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // New patients this month
    const newPatientsThisMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfThisMonth,
        },
      },
    });

    // Pending payments
    const pendingPayments = await prisma.invoice.count({
      where: {
        status: {
          in: ['PENDING', 'OVERDUE'],
        },
      },
    });

    // Overdue payments
    const overduePayments = await prisma.invoice.count({
      where: {
        status: 'OVERDUE',
      },
    });

    // Today's collected payments
    const todayCollections = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Appointments waiting for confirmation
    const pendingConfirmations = await prisma.appointment.count({
      where: {
        status: 'SCHEDULED',
        appointmentDate: {
          gte: startOfToday,
          lte: endOfDay(addDays(today, 3)),
        },
      },
    });

    res.json({
      todayAppointments,
      pendingCheckIns,
      newPatientsToday,
      newPatientsThisMonth,
      pendingPayments,
      overduePayments,
      todayCollections: todayCollections._sum.amount || 0,
      pendingConfirmations,
    });
  } catch (error) {
    console.error('Get receptionist dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch receptionist dashboard stats' });
  }
};

// Get analytics data (for charts)
export const getAnalyticsData = async (req: Request, res: Response) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range as string);
    const startDate = subDays(new Date(), days);

    // Daily appointment counts
    const dailyAppointments = await prisma.$queryRaw`
      SELECT 
        DATE("appointmentDate") as date,
        COUNT(*) as count,
        status
      FROM "appointments"
      WHERE "appointmentDate" >= ${startDate}
      GROUP BY DATE("appointmentDate"), status
      ORDER BY date ASC
    `;

    // Daily revenue
    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE("paymentDate") as date,
        SUM(amount) as total
      FROM "payments"
      WHERE "paymentDate" >= ${startDate}
      GROUP BY DATE("paymentDate")
      ORDER BY date ASC
    `;

    // New patients over time
    const newPatientsOverTime = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "patients"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Treatment popularity
    const treatmentPopularity = await prisma.treatmentPlanItem.groupBy({
      by: ['treatmentId'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        treatmentId: true,
      },
      orderBy: {
        _count: {
          treatmentId: 'desc',
        },
      },
      take: 10,
    });

    // Get treatment names
    const treatments = await prisma.treatment.findMany({
      where: {
        id: {
          in: treatmentPopularity.map(t => t.treatmentId),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    res.json({
      dailyAppointments,
      dailyRevenue,
      newPatientsOverTime,
      treatmentPopularity: treatmentPopularity.map(t => ({
        count: t._count.treatmentId,
        treatment: treatments.find(tr => tr.id === t.treatmentId)?.name || 'Unknown',
      })),
    });
  } catch (error) {
    console.error('Get analytics data error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics data' });
  }
};

// Get today's schedule
export const getTodaySchedule = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const { doctorId } = req.query;

    const where: any = {
      appointmentDate: {
        gte: startOfToday,
        lte: endOfToday,
      },
      status: {
        notIn: ['CANCELLED', 'NO_SHOW'],
      },
    };

    if (doctorId) {
      where.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
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
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json({
      date: format(today, 'yyyy-MM-dd'),
      appointments,
    });
  } catch (error) {
    console.error('Get today schedule error:', error);
    res.status(500).json({ message: 'Failed to fetch today schedule' });
  }
};

// Get upcoming appointments
export const getUpcomingAppointments = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { limit = '10' } = req.query;
    const today = new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startOfDay(today),
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
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
      },
      take: parseInt(limit as string),
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' },
      ],
    });

    res.json({ appointments });
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({ message: 'Failed to fetch upcoming appointments' });
  }
};

// Get notifications
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

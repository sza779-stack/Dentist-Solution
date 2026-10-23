import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Prisma, AppointmentStatus } from '@prisma/client';
import { prisma } from '../index';
import { createAuditLog, AuditActions, EntityTypes } from '../utils/audit';
import { startOfDay, endOfDay, parseISO, format, addMinutes } from 'date-fns';

// Get all appointments
export const getAllAppointments = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { patientId, doctorId, status, startDate, endDate, page = '1', limit = '10' } = req.query;

    const where: Prisma.AppointmentWhereInput = {};

    if (patientId) {
      where.patientId = patientId as string;
    }

    if (doctorId) {
      where.doctorId = doctorId as string;
    }

    if (status) {
      where.status = status as AppointmentStatus;
    }

    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        where.appointmentDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.appointmentDate.lte = new Date(endDate as string);
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
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
          assistant: {
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
          treatmentNotes: {
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
            },
          },
        },
        skip,
        take,
        orderBy: { appointmentDate: 'desc' },
      }),
      prisma.appointment.count({ where }),
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
    console.error('Get all appointments error:', error);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
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
        assistant: {
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
        treatmentNotes: {
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
          },
        },
        invoice: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch appointment' });
  }
};

// Check for appointment conflicts
const checkAppointmentConflict = async (
  doctorId: string,
  appointmentDate: Date,
  startTime: string,
  endTime: string,
  excludeId?: string
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
        // New appointment starts during existing appointment
        startTime: {
          lte: startTime,
        },
        endTime: {
          gt: startTime,
        },
      },
      {
        // New appointment ends during existing appointment
        startTime: {
          lt: endTime,
        },
        endTime: {
          gte: endTime,
        },
      },
      {
        // New appointment completely contains existing appointment
        startTime: {
          gte: startTime,
        },
        endTime: {
          lte: endTime,
        },
      },
    ],
  };

  if (excludeId) {
    where.id = {
      not: excludeId,
    };
  }

  const conflictingAppointments = await prisma.appointment.findMany({
    where,
  });

  return conflictingAppointments.length > 0;
};

// Create appointment
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      patientId,
      doctorId,
      assistantId,
      appointmentDate,
      startTime,
      endTime,
      type,
      notes,
      reason,
    } = req.body;

    // Check for conflicts
    const hasConflict = await checkAppointmentConflict(
      doctorId,
      new Date(appointmentDate),
      startTime,
      endTime
    );

    if (hasConflict) {
      return res.status(409).json({ message: 'Time slot is already booked' });
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if doctor exists
    const doctor = await prisma.staff.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        assistantId,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime,
        type,
        notes,
        reason,
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
    });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: 'Appointment Scheduled',
        message: `Your appointment has been scheduled for ${format(new Date(appointmentDate), 'MMMM d, yyyy')} at ${startTime}`,
        type: 'appointment',
        data: { appointmentId: appointment.id },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.CREATE,
      entityType: EntityTypes.APPOINTMENT,
      entityId: appointment.id,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment,
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Failed to create appointment' });
  }
};

// Update appointment
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const {
      patientId,
      doctorId,
      assistantId,
      appointmentDate,
      startTime,
      endTime,
      type,
      status,
      notes,
      reason,
    } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check for conflicts if date/time is being updated
    if (appointmentDate || startTime || endTime || doctorId) {
      const hasConflict = await checkAppointmentConflict(
        doctorId || appointment.doctorId,
        appointmentDate ? new Date(appointmentDate) : appointment.appointmentDate,
        startTime || appointment.startTime,
        endTime || appointment.endTime,
        id
      );

      if (hasConflict) {
        return res.status(409).json({ message: 'Time slot is already booked' });
      }
    }

    const oldValue = { ...appointment };

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        patientId,
        doctorId,
        assistantId,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
        startTime,
        endTime,
        type,
        status,
        notes,
        reason,
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
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.UPDATE,
      entityType: EntityTypes.APPOINTMENT,
      entityId: appointment.id,
      oldValue,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Failed to update appointment' });
  }
};

// Delete appointment
export const deleteAppointment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.DELETE,
      entityType: EntityTypes.APPOINTMENT,
      entityId: appointment.id,
      oldValue: appointment,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ message: 'Failed to delete appointment' });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const oldStatus = appointment.status;

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status },
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
      },
    });

    // Create notification for patient
    const statusMessages: Record<string, string> = {
      CONFIRMED: 'Your appointment has been confirmed',
      COMPLETED: 'Your appointment has been completed',
      CANCELLED: 'Your appointment has been cancelled',
      NO_SHOW: 'You missed your appointment',
    };

    if (statusMessages[status]) {
      await prisma.notification.create({
        data: {
          userId: appointment.patientId,
          title: 'Appointment Update',
          message: statusMessages[status],
          type: 'appointment',
          data: { appointmentId: appointment.id },
        },
      });
    }

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.UPDATE,
      entityType: EntityTypes.APPOINTMENT,
      entityId: appointment.id,
      oldValue: { status: oldStatus },
      newValue: { status },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Appointment status updated successfully',
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Failed to update appointment status' });
  }
};

// Cancel appointment
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        notes: reason ? `${appointment.notes || ''}\nCancellation reason: ${reason}` : appointment.notes,
      },
    });

    // Create notification for patient
    await prisma.notification.create({
      data: {
        userId: appointment.patientId,
        title: 'Appointment Cancelled',
        message: `Your appointment has been cancelled${reason ? `: ${reason}` : ''}`,
        type: 'appointment',
        data: { appointmentId: appointment.id },
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.UPDATE,
      entityType: EntityTypes.APPOINTMENT,
      entityId: appointment.id,
      oldValue: { status: appointment.status },
      newValue: { status: AppointmentStatus.CANCELLED, reason },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Appointment cancelled successfully',
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Failed to cancel appointment' });
  }
};

// Get doctor availability
export const getDoctorAvailability = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { doctorId } = req.params;
    const { date } = req.query;

    const selectedDate = new Date(date as string);
    const dayOfWeek = selectedDate.getDay();

    // Get doctor's schedule for that day
    const schedule = await prisma.schedule.findUnique({
      where: {
        staffId_dayOfWeek: {
          staffId: doctorId,
          dayOfWeek,
        },
      },
    });

    if (!schedule || !schedule.isAvailable) {
      return res.json({ availableSlots: [] });
    }

    // Get existing appointments for that day
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

    // Generate available time slots (30-minute intervals)
    const slots: string[] = [];
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

    let currentTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    while (currentTime < endTime) {
      const hours = Math.floor(currentTime / 60);
      const minutes = currentTime % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Check if slot is available
      const isBooked = existingAppointments.some(
        (apt) => timeString >= apt.startTime && timeString < apt.endTime
      );

      if (!isBooked) {
        slots.push(timeString);
      }

      currentTime += 30;
    }

    res.json({
      date: selectedDate,
      schedule,
      availableSlots: slots,
    });
  } catch (error) {
    console.error('Get doctor availability error:', error);
    res.status(500).json({ message: 'Failed to fetch doctor availability' });
  }
};

// Get doctor schedule
export const getDoctorSchedule = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
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
    });

    res.json({ appointments });
  } catch (error) {
    console.error('Get doctor schedule error:', error);
    res.status(500).json({ message: 'Failed to fetch doctor schedule' });
  }
};

// Get calendar data
export const getCalendarData = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { startDate, endDate, doctorId } = req.query;

    const where: Prisma.AppointmentWhereInput = {
      appointmentDate: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      },
      status: {
        notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
      },
    };

    if (doctorId) {
      where.doctorId = doctorId as string;
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
        appointmentDate: 'asc',
      },
    });

    // Format for calendar
    const events = appointments.map((apt) => ({
      id: apt.id,
      title: `${apt.patient.user.firstName} ${apt.patient.user.lastName} - ${apt.type}`,
      start: `${format(apt.appointmentDate, 'yyyy-MM-dd')}T${apt.startTime}`,
      end: `${format(apt.appointmentDate, 'yyyy-MM-dd')}T${apt.endTime}`,
      status: apt.status,
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      type: apt.type,
    }));

    res.json({ events });
  } catch (error) {
    console.error('Get calendar data error:', error);
    res.status(500).json({ message: 'Failed to fetch calendar data' });
  }
};

// Add treatment to appointment
export const addTreatmentToAppointment = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { treatmentId, quantity = 1, discount = 0, notes } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const treatment = await prisma.treatment.findUnique({
      where: { id: treatmentId },
    });

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    const appointmentTreatment = await prisma.appointmentTreatment.create({
      data: {
        appointmentId: id,
        treatmentId,
        quantity,
        unitPrice: treatment.price,
        discount,
        notes,
      },
      include: {
        treatment: true,
      },
    });

    res.status(201).json({
      message: 'Treatment added to appointment',
      appointmentTreatment,
    });
  } catch (error) {
    console.error('Add treatment to appointment error:', error);
    res.status(500).json({ message: 'Failed to add treatment' });
  }
};

// Add treatment note
export const addTreatmentNote = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { note, isPrivate = false } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const doctorId = req.user?.userId;

    // Get staff profile for the doctor
    const staff = await prisma.staff.findFirst({
      where: { userId: doctorId },
    });

    if (!staff) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const treatmentNote = await prisma.treatmentNote.create({
      data: {
        appointmentId: id,
        doctorId: staff.id,
        note,
        isPrivate,
      },
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
      },
    });

    res.status(201).json({
      message: 'Treatment note added',
      treatmentNote,
    });
  } catch (error) {
    console.error('Add treatment note error:', error);
    res.status(500).json({ message: 'Failed to add treatment note' });
  }
};

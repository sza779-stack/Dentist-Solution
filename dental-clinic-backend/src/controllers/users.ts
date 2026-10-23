import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Role, Prisma } from '@prisma/client';
import { prisma } from '../index';
import { hashPassword, generateRandomPassword } from '../utils/password';
import { createAuditLog, AuditActions, EntityTypes } from '../utils/audit';

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { role, isActive, search, page = '1', limit = '10' } = req.query;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role as Role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          patientProfile: {
            select: { id: true },
          },
          staffProfile: {
            select: { id: true, employeeId: true, specialization: true },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        patientProfile: true,
        staffProfile: {
          include: {
            schedules: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// Create user
export const createUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone, role } = req.body;

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

    // Create user data
    const userData: Prisma.UserCreateInput = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
    };

    // Create profile based on role
    if (role === Role.PATIENT) {
      userData.patientProfile = {
        create: {},
      };
    } else if (role !== Role.ADMIN && role !== Role.RECEPTIONIST) {
      userData.staffProfile = {
        create: {
          employeeId: `EMP-${Date.now()}`,
          hireDate: new Date(),
        },
      };
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        patientProfile: true,
        staffProfile: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.CREATE,
      entityType: EntityTypes.USER,
      entityId: user.id,
      newValue: { email, firstName, lastName, role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        patientProfile: user.patientProfile,
        staffProfile: user.staffProfile,
      },
      ...(password && { generatedPassword: userPassword }),
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { email, firstName, lastName, phone, avatarUrl, role, isActive, staffProfile } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldValue = { ...user };

    const updateData: Prisma.UserUpdateInput = {};
    if (email !== undefined) updateData.email = email;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: updateData,
        include: {
          patientProfile: true,
          staffProfile: true,
        },
      });

      if (staffProfile) {
        const hasStaffProfile = await tx.staff.findUnique({
          where: { userId: id },
        });

        if (hasStaffProfile) {
          await tx.staff.update({
            where: { userId: id },
            data: {
              specialization: staffProfile.specialization,
              department: staffProfile.department,
              licenseNumber: staffProfile.licenseNumber,
              biography: staffProfile.biography,
              isAvailable: staffProfile.isAvailable,
              workingHours: staffProfile.workingHours,
              avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
            },
          });
        }
      }

      return tx.user.findUnique({
        where: { id },
        include: {
          patientProfile: true,
          staffProfile: true,
        },
      });
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.UPDATE,
      entityType: EntityTypes.USER,
      entityId: user.id,
      oldValue,
      newValue: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (id === req.user?.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.DELETE,
      entityType: EntityTypes.USER,
      entityId: user.id,
      oldValue: user,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating yourself
    if (id === req.user?.userId && !isActive) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: isActive ? AuditActions.ACTIVATE : AuditActions.DEACTIVATE,
      entityType: EntityTypes.USER,
      entityId: user.id,
      oldValue: { isActive: user.isActive },
      newValue: { isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

// Assign role to user
export const assignRole = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.role;

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.ASSIGN_ROLE,
      entityType: EntityTypes.USER,
      entityId: user.id,
      oldValue: { role: oldRole },
      newValue: { role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Role assigned successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ message: 'Failed to assign role' });
  }
};

// Reset user password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new password
    const newPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Create audit log
    await createAuditLog({
      userId: req.user?.userId,
      action: AuditActions.RESET_PASSWORD,
      entityType: EntityTypes.USER,
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      message: 'Password reset successfully',
      newPassword,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// Get staff members
export const getStaffMembers = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { role, isAvailable } = req.query;

    const where: Prisma.StaffWhereInput = {};

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    if (role) {
      where.user = {
        role: role as Role,
        isActive: true,
      };
    } else {
      where.user = {
        role: {
          in: [Role.DOCTOR, Role.DENTIST, Role.SPECIALIST, Role.NURSE, Role.DENTIST_ASSISTANT],
        },
        isActive: true,
      };
    }

    const staff = await prisma.staff.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
        schedules: true,
        _count: {
          select: {
            appointmentsAsDoctor: {
              where: {
                status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: 'asc',
        },
      },
    });

    res.json({ staff });
  } catch (error) {
    console.error('Get staff members error:', error);
    res.status(500).json({ message: 'Failed to fetch staff members' });
  }
};

// Get audit logs
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { userId, action, entityType, startDate, endDate, page = '1', limit = '20' } = req.query;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (action) {
      where.action = action as string;
    }

    if (entityType) {
      where.entityType = entityType as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
};

// Upload user avatar (admin only)
export const uploadUserAvatar = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'Avatar file is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

    const updated = await prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    res.json({
      message: 'User avatar uploaded successfully',
      user: updated,
      avatarUrl,
    });
  } catch (error) {
    console.error('Upload user avatar error:', error);
    res.status(500).json({ message: 'Failed to upload user avatar' });
  }
};

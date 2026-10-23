import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Prisma, Role } from '@prisma/client';
import { prisma } from '../index';

// Get messages
export const getMessages = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const userId = req.user?.userId;
    const { type = 'inbox', isRead, page = '1', limit = '10' } = req.query;

    const where: Prisma.MessageWhereInput = {};

    if (type === 'inbox') {
      where.recipientId = userId;
    } else {
      where.senderId = userId;
    }

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          recipient: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where }),
    ]);

    res.json({
      messages,
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Get message by ID
export const getMessageById = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user?.userId;

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        recipient: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or recipient
    if (message.senderId !== userId && message.recipientId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read if recipient is viewing
    if (message.recipientId === userId && !message.isRead) {
      await prisma.message.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    res.json({ message });
  } catch (error) {
    console.error('Get message by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch message' });
  }
};

// Send message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const userId = req.user?.userId;
    const { recipientId, subject, content, parentId } = req.body;

    const messagingEnabled = await prisma.clinicSetting.findUnique({
      where: { key: 'messaging_enabled' },
      select: { value: true },
    });
    if (messagingEnabled && messagingEnabled.value.toLowerCase() !== 'true') {
      return res.status(403).json({ message: 'Messaging is currently disabled by clinic settings' });
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, role: true, firstName: true, lastName: true, isActive: true },
    });

    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, firstName: true, lastName: true, isActive: true },
    });

    if (!recipient || !recipient.isActive) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    if (!sender || !sender.isActive) {
      return res.status(404).json({ message: 'Sender profile not found' });
    }

    // Prevent sending to self
    if (recipientId === userId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Patient can only message staff; staff can message all active users.
    const senderIsPatient = sender.role === Role.PATIENT;
    const recipientIsPatient = recipient.role === Role.PATIENT;
    if (senderIsPatient && recipientIsPatient) {
      return res.status(403).json({ message: 'Patients can message clinic staff only' });
    }

    const message = await prisma.message.create({
      data: {
        senderId: userId!,
        recipientId,
        subject,
        content,
        parentId,
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        recipient: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: 'New Message',
        message: `You have a new message from ${message.sender.firstName} ${message.sender.lastName}: ${subject}`,
        type: 'message',
        data: { messageId: message.id },
      },
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// List available contacts for current user
export const getMessageContacts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const where: Prisma.UserWhereInput =
      currentUser.role === Role.PATIENT
        ? {
            id: { not: userId },
            isActive: true,
            role: { in: [Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR, Role.DENTIST, Role.SPECIALIST, Role.NURSE, Role.DENTIST_ASSISTANT] },
          }
        : {
            id: { not: userId },
            isActive: true,
          };

    const contacts = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });

    res.json({ contacts });
  } catch (error) {
    console.error('Get message contacts error:', error);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
};

// Mark message as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user?.userId;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.recipientId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      message: 'Message marked as read',
      data: updatedMessage,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
};

// Delete message
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user?.userId;

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId !== userId && message.recipientId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.message.delete({
      where: { id },
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};

// Get unread count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const count = await prisma.message.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

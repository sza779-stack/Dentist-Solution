import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Role } from '@prisma/client';
import { prisma } from '../index';

// Public landing settings (no auth)
export const getPublicLandingSettings = async (_req: Request, res: Response) => {
  try {
    const keys = [
      'landing_main_image',
      'landing_welcome_text',
      'landing_title',
      'landing_subtitle',
      'landing_primary_button',
      'landing_secondary_button',
      'clinic_name',
    ];

    const settings = await prisma.clinicSetting.findMany({
      where: { key: { in: keys } },
    });

    const valueOf = (key: string, fallback: string) =>
      settings.find((s) => s.key === key)?.value || fallback;

    res.json({
      landing: {
        clinicName: valueOf('clinic_name', 'Dental Clinic'),
        mainImage: valueOf(
          'landing_main_image',
          'https://images.unsplash.com/photo-1588776814546-ec7e3f2391af?auto=format&fit=crop&w=1600&q=80'
        ),
        welcomeText: valueOf('landing_welcome_text', 'WELCOME TO OUR CLINIC'),
        title: valueOf('landing_title', 'Best Healthcare Solution In Your City'),
        subtitle: valueOf(
          'landing_subtitle',
          'Comprehensive dental care for you and your family with experienced professionals.'
        ),
        primaryButton: valueOf('landing_primary_button', 'Find Doctor'),
        secondaryButton: valueOf('landing_secondary_button', 'Appointment'),
      },
    });
  } catch (error) {
    console.error('Get public landing settings error:', error);
    res.status(500).json({ message: 'Failed to fetch landing settings' });
  }
};

// Get all settings
export const getAllSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.clinicSetting.findMany({
      orderBy: { category: 'asc' },
    });

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, typeof settings>);

    res.json({
      settings,
      grouped,
    });
  } catch (error) {
    console.error('Get all settings error:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

// Get setting by key
export const getSettingByKey = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { key } = req.params;

    const setting = await prisma.clinicSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json({ setting });
  } catch (error) {
    console.error('Get setting by key error:', error);
    res.status(500).json({ message: 'Failed to fetch setting' });
  }
};

// Create or update setting
export const upsertSetting = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { key } = req.params;
    const { value, category = 'general', description } = req.body;

    const setting = await prisma.clinicSetting.upsert({
      where: { key },
      update: {
        value,
        category,
        description,
      },
      create: {
        key,
        value,
        category,
        description,
      },
    });

    res.json({
      message: 'Setting saved successfully',
      setting,
    });
  } catch (error) {
    console.error('Upsert setting error:', error);
    res.status(500).json({ message: 'Failed to save setting' });
  }
};

// Delete setting
export const deleteSetting = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { key } = req.params;

    const setting = await prisma.clinicSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    await prisma.clinicSetting.delete({
      where: { key },
    });

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ message: 'Failed to delete setting' });
  }
};

// Bulk update settings
export const bulkUpdateSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { settings } = req.body;

    const results = await prisma.$transaction(
      settings.map((s: any) =>
        prisma.clinicSetting.upsert({
          where: { key: s.key },
          update: {
            value: s.value,
            category: s.category || 'general',
            description: s.description,
          },
          create: {
            key: s.key,
            value: s.value,
            category: s.category || 'general',
            description: s.description,
          },
        })
      )
    );

    res.json({
      message: 'Settings updated successfully',
      settings: results,
    });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

// Create admin broadcast notification (e.g. store closed)
export const createBroadcastNotification = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { title, message, type = 'system', targetRole } = req.body as {
      title: string;
      message: string;
      type?: string;
      targetRole?: Role;
    };

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(targetRole ? { role: targetRole } : {}),
      },
      select: { id: true },
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'No target users found' });
    }

    const createdAt = new Date();
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title,
        message,
        type,
        data: {
          broadcast: true,
          targetRole: targetRole || null,
          createdBy: req.user?.userId || null,
        },
        createdAt,
      })),
    });

    res.status(201).json({
      message: 'Broadcast notification created',
      recipients: users.length,
    });
  } catch (error) {
    console.error('Create broadcast notification error:', error);
    res.status(500).json({ message: 'Failed to create broadcast notification' });
  }
};

// Upload landing hero image and persist URL in clinic settings
export const uploadLandingImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/landing/${req.file.filename}`;

    const setting = await prisma.clinicSetting.upsert({
      where: { key: 'landing_main_image' },
      update: {
        value: imageUrl,
        category: 'website',
        description: 'Landing page main hero image URL',
      },
      create: {
        key: 'landing_main_image',
        value: imageUrl,
        category: 'website',
        description: 'Landing page main hero image URL',
      },
    });

    res.status(201).json({
      message: 'Landing image uploaded successfully',
      imageUrl,
      setting,
    });
  } catch (error) {
    console.error('Upload landing image error:', error);
    res.status(500).json({ message: 'Failed to upload landing image' });
  }
};

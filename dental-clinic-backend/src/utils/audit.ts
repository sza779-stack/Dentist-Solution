import { prisma } from '../index';

interface AuditLogData {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValue: data.oldValue ? JSON.parse(JSON.stringify(data.oldValue)) : null,
        newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent disrupting main operation
  }
};

export const AuditActions = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  ACTIVATE: 'ACTIVATE',
  DEACTIVATE: 'DEACTIVATE',
  ASSIGN_ROLE: 'ASSIGN_ROLE',
  RESET_PASSWORD: 'RESET_PASSWORD',
} as const;

export const EntityTypes = {
  USER: 'USER',
  PATIENT: 'PATIENT',
  APPOINTMENT: 'APPOINTMENT',
  TREATMENT: 'TREATMENT',
  INVOICE: 'INVOICE',
  PAYMENT: 'PAYMENT',
  MESSAGE: 'MESSAGE',
} as const;

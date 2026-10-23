import { api, apiClient } from './client';
import type { User, RoleType } from '@/types';

export interface UserFilter {
  role?: RoleType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateUserInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: RoleType;
  isActive?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role?: RoleType;
  isActive?: boolean;
  staffProfile?: {
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    biography?: string;
    isAvailable?: boolean;
    workingHours?: any;
  };
}

export const usersApi = {
  getAll: (params?: UserFilter) =>
    api.get<{ users: User[]; meta: any }>('/users', params),
  
  getById: (id: string) => api.get<{ user: User }>(`/users/${id}`),
  
  create: (data: CreateUserInput) =>
    api.post<{ user: User; generatedPassword?: string }>('/users', data),
  
  update: (id: string, data: UpdateUserInput) =>
    api.put<{ user: User }>(`/users/${id}`, data),
  
  delete: (id: string) => api.delete(`/users/${id}`),
  
  updateStatus: (id: string, isActive: boolean) =>
    api.patch<{ user: User }>(`/users/${id}/status`, { isActive }),
  
  assignRole: (id: string, role: RoleType) =>
    api.patch<{ user: User }>(`/users/${id}/role`, { role }),
  
  resetPassword: (id: string) =>
    api.post<{ newPassword: string }>(`/users/${id}/reset-password`),

  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient
      .post<{ avatarUrl: string; user: { id: string; firstName: string; lastName: string; avatarUrl: string } }>(
        `/users/${id}/avatar`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      .then((res) => res.data);
  },
  
  getStaffMembers: (params?: { role?: RoleType; isAvailable?: boolean }) =>
    api.get<{ staff: any[] }>('/users/staff/list', params),
  
  getAuditLogs: (params?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<{ logs: any[]; meta: any }>('/users/audit-logs', params),
};

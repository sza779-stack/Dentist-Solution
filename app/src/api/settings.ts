import { api, apiClient } from './client';

export interface ClinicSetting {
  key: string;
  value: string;
  category: string;
  description?: string;
}

export interface LandingSettings {
  clinicName: string;
  mainImage: string;
  welcomeText: string;
  title: string;
  subtitle: string;
  primaryButton: string;
  secondaryButton: string;
}

export type BroadcastRole =
  | 'ADMIN'
  | 'RECEPTIONIST'
  | 'DOCTOR'
  | 'NURSE'
  | 'DENTIST_ASSISTANT'
  | 'DENTIST'
  | 'SPECIALIST'
  | 'PATIENT';

export const settingsApi = {
  getAll: () => api.get<{ settings: ClinicSetting[]; grouped: Record<string, ClinicSetting[]> }>('/settings'),
  getPublicLanding: () => api.get<{ landing: LandingSettings }>('/settings/public/landing'),
  getByKey: (key: string) => api.get<{ setting: ClinicSetting }>(`/settings/${key}`),
  upsert: (key: string, data: { value: string; category?: string; description?: string }) =>
    api.put<{ setting: ClinicSetting }>(`/settings/${key}`, data),
  bulkUpdate: (settings: { key: string; value: string; category?: string; description?: string }[]) =>
    api.post<{ settings: ClinicSetting[] }>('/settings/bulk', { settings }),
  remove: (key: string) => api.delete(`/settings/${key}`),
  createBroadcastNotification: (data: {
    title: string;
    message: string;
    type?: string;
    targetRole?: BroadcastRole;
  }) => api.post<{ message: string; recipients: number }>('/settings/notifications/broadcast', data),
  uploadLandingImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient
      .post<{ message: string; imageUrl: string }>('/settings/landing-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
};

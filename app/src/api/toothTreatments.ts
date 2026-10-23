import { api } from './client';
import { apiClient } from './client';
import type { ToothTreatment, ToothNotationType, ToothTreatmentStatusType, ToothTreatmentAttachment } from '@/types';

export interface CreateToothTreatmentInput {
  patientId: string;
  appointmentId?: string;
  toothNumber: string;
  notation?: ToothNotationType;
  surfaces?: string[];
  diagnosis?: string;
  treatmentType: string;
  notes?: string;
  status?: ToothTreatmentStatusType;
  cost?: number;
}

export interface UpdateToothTreatmentInput {
  toothNumber?: string;
  notation?: ToothNotationType;
  surfaces?: string[];
  diagnosis?: string;
  treatmentType?: string;
  notes?: string;
  status?: ToothTreatmentStatusType;
  cost?: number;
}

export const toothTreatmentsApi = {
  getAll: (params?: { patientId?: string; appointmentId?: string }) =>
    api.get<{ treatments: ToothTreatment[] }>('/treatments/tooth-treatments', params),

  create: (data: CreateToothTreatmentInput) =>
    api.post<{ treatment: ToothTreatment }>('/treatments/tooth-treatments', data),

  update: (id: string, data: UpdateToothTreatmentInput) =>
    api.patch<{ treatment: ToothTreatment }>(`/treatments/tooth-treatments/${id}`, data),

  getAttachments: (id: string) =>
    api.get<{ attachments: ToothTreatmentAttachment[] }>(`/treatments/tooth-treatments/${id}/attachments`),

  uploadAttachment: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<{ attachment: ToothTreatmentAttachment }>(
        `/treatments/tooth-treatments/${id}/attachments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      .then((res) => res.data);
  },

  deleteAttachment: (attachmentId: string) =>
    api.delete(`/treatments/tooth-treatments/attachments/${attachmentId}`),
};

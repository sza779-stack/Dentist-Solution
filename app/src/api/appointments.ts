import { api } from './client';
import type { Appointment, AppointmentStatusType, AppointmentTypeType } from '@/types';

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  assistantId?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: AppointmentTypeType;
  notes?: string;
  reason?: string;
}

export interface UpdateAppointmentInput {
  patientId?: string;
  doctorId?: string;
  assistantId?: string;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  type?: AppointmentTypeType;
  status?: AppointmentStatusType;
  notes?: string;
  reason?: string;
}

export const appointmentsApi = {
  getAll: (params?: {
    patientId?: string;
    doctorId?: string;
    status?: AppointmentStatusType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<{ appointments: Appointment[]; meta: any }>('/appointments', params),
  
  getById: (id: string) => api.get<{ appointment: Appointment }>(`/appointments/${id}`),
  
  create: (data: CreateAppointmentInput) =>
    api.post<{ appointment: Appointment }>('/appointments', data),
  
  update: (id: string, data: UpdateAppointmentInput) =>
    api.put<{ appointment: Appointment }>(`/appointments/${id}`, data),
  
  delete: (id: string) => api.delete(`/appointments/${id}`),
  
  updateStatus: (id: string, status: AppointmentStatusType) =>
    api.patch<{ appointment: Appointment }>(`/appointments/${id}/status`, { status }),
  
  cancel: (id: string, reason?: string) =>
    api.post<{ appointment: Appointment }>(`/appointments/${id}/cancel`, { reason }),
  
  getDoctorAvailability: (doctorId: string, date: string) =>
    api.get<{
      date: string;
      schedule: any;
      availableSlots: string[];
    }>(`/appointments/availability/${doctorId}`, { date }),
  
  getDoctorSchedule: (doctorId: string, params: { startDate: string; endDate: string }) =>
    api.get<{ appointments: Appointment[] }>(`/appointments/schedule/${doctorId}`, params),
  
  getCalendarData: (params: { startDate: string; endDate: string; doctorId?: string }) =>
    api.get<{ events: { id: string; title: string; start: string; end: string; status: AppointmentStatusType; patientId: string; doctorId: string; type: AppointmentTypeType }[] }>('/appointments/calendar/data', params),
  
  addTreatment: (id: string, data: {
    treatmentId: string;
    quantity?: number;
    discount?: number;
    notes?: string;
  }) => api.post(`/appointments/${id}/treatments`, data),
  
  addNote: (id: string, data: { note: string; isPrivate?: boolean }) =>
    api.post(`/appointments/${id}/notes`, data),
};

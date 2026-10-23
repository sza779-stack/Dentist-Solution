import { api, apiClient } from './client';
import type { Patient, Appointment, Invoice, TreatmentPlan, GenderType, AppointmentTreatment, ToothTreatment, Prescription, PrescriptionStatusType } from '@/types';
import type { AppointmentTypeType, RoleType } from '@/types';

export interface CreatePatientInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: GenderType;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceGroupNumber?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  notes?: string;
}

export interface UpdatePatientInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: GenderType;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceGroupNumber?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  notes?: string;
}

export interface PrescriptionInput {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  refills?: number;
  instructions?: string;
  startDate?: string;
  endDate?: string;
  status?: PrescriptionStatusType;
}

export interface PortalDoctor {
  id: string;
  specialization?: string;
  department?: string;
  biography?: string;
  avatarUrl?: string;
  isAvailable: boolean;
  workingHours?: any;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    role: RoleType;
  };
  schedules?: {
    id: string;
    staffId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
}

export const patientsApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get<{ patients: Patient[]; meta: any }>('/patients', params),
  
  getById: (id: string) => api.get<{ patient: Patient }>(`/patients/${id}`),
  
  create: (data: CreatePatientInput) =>
    api.post<{ patient: Patient; generatedPassword?: string }>('/patients', data),
  
  update: (id: string, data: UpdatePatientInput) =>
    api.put<{ patient: Patient }>(`/patients/${id}`, data),
  
  delete: (id: string) => api.delete(`/patients/${id}`),
  
  getAppointments: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<{ appointments: Appointment[]; meta: any }>(`/patients/${id}/appointments`, params),
  
  getTreatments: (id: string) =>
    api.get<{ treatmentPlans: TreatmentPlan[]; appointmentTreatments: any[] }>(
      `/patients/${id}/treatments`
    ),
  
  getInvoices: (id: string, params?: { page?: number; limit?: number }) =>
    api.get<{ invoices: Invoice[]; meta: any }>(`/patients/${id}/invoices`, params),

  getPrescriptions: (id: string) =>
    api.get<{ prescriptions: Prescription[] }>(`/patients/${id}/prescriptions`),

  createPrescription: (id: string, data: PrescriptionInput) =>
    api.post<{ prescription: Prescription; message: string }>(`/patients/${id}/prescriptions`, data),

  updatePrescription: (patientId: string, prescriptionId: string, data: PrescriptionInput) =>
    api.put<{ prescription: Prescription; message: string }>(
      `/patients/${patientId}/prescriptions/${prescriptionId}`,
      data
    ),

  deletePrescription: (patientId: string, prescriptionId: string) =>
    api.delete<{ message: string }>(`/patients/${patientId}/prescriptions/${prescriptionId}`),
  
  // Patient portal
  getPortalData: () =>
    api.get<{
      patient: Patient & {
        appointments: Appointment[];
        treatmentPlans: TreatmentPlan[];
        invoices: Invoice[];
        prescriptions: Prescription[];
      };
      appointmentTreatments: AppointmentTreatment[];
      toothTreatments: ToothTreatment[];
      prescriptions: Prescription[];
      notifications: any[];
      messages: any[];
    }>('/patients/portal/me'),

  getPortalTreatments: () =>
    api.get<{ treatmentPlans: TreatmentPlan[]; appointmentTreatments: any[]; toothTreatments: ToothTreatment[] }>(
      '/patients/portal/treatments'
    ),

  getPortalPrescriptions: () =>
    api.get<{ prescriptions: Prescription[] }>('/patients/portal/prescriptions'),
  
  updatePortalProfile: (data: UpdatePatientInput) =>
    api.put<{ patient: Patient }>('/patients/portal/me', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient
      .post<{ avatarUrl: string; user: Patient['user'] }>('/patients/portal/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  getPortalDoctors: () =>
    api.get<{ staff: PortalDoctor[] }>('/patients/portal/doctors'),

  getPortalDoctorAvailability: (doctorId: string, date: string) =>
    api.get<{ date: string; schedule?: any; availableSlots: string[] }>(
      `/patients/portal/doctors/${doctorId}/availability`,
      { date }
    ),

  createPortalAppointment: (data: {
    doctorId: string;
    appointmentDate: string;
    startTime: string;
    endTime?: string;
    type: AppointmentTypeType;
    reason?: string;
    notes?: string;
  }) => api.post<{ appointment: Appointment; message: string }>('/patients/portal/appointments', data),
};

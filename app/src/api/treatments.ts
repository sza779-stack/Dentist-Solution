import { api } from './client';
import type { Treatment, TreatmentCategory, TreatmentPlan } from '@/types';

export interface CreateTreatmentInput {
  categoryId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  cost?: number;
  code?: string;
  isActive?: boolean;
  requiresConsultation?: boolean;
}

export interface UpdateTreatmentInput {
  categoryId?: string;
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  cost?: number;
  code?: string;
  isActive?: boolean;
  requiresConsultation?: boolean;
}

export interface CreateTreatmentPlanInput {
  patientId: string;
  name: string;
  description?: string;
  items: {
    treatmentId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    scheduledDate?: string;
    notes?: string;
  }[];
}

export const treatmentsApi = {
  // Diagnosis catalog
  getDiagnosisCatalog: () =>
    api.get<{ diagnoses: { code: string; description: string }[] }>('/treatments/diagnosis-catalog'),

  // Categories
  getCategories: () => api.get<{ categories: (TreatmentCategory & { _count?: { treatments: number } })[] }>('/treatments/categories'),
  
  createCategory: (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }) => api.post<{ category: TreatmentCategory }>('/treatments/categories', data),
  
  updateCategory: (id: string, data: Partial<TreatmentCategory>) =>
    api.put<{ category: TreatmentCategory }>(`/treatments/categories/${id}`, data),
  
  // Treatments
  getAll: (params?: { categoryId?: string; isActive?: boolean; search?: string }) =>
    api.get<{ treatments: Treatment[] }>('/treatments', params),
  
  getById: (id: string) => api.get<{ treatment: Treatment }>(`/treatments/${id}`),
  
  create: (data: CreateTreatmentInput) =>
    api.post<{ treatment: Treatment }>('/treatments', data),
  
  update: (id: string, data: UpdateTreatmentInput) =>
    api.put<{ treatment: Treatment }>(`/treatments/${id}`, data),
  
  delete: (id: string) => api.delete(`/treatments/${id}`),
  
  // Treatment Plans
  getAllPlans: (params?: { patientId?: string; status?: string }) =>
    api.get<{ treatmentPlans: TreatmentPlan[] }>('/treatments/plans', params),
  
  getPlanById: (id: string) =>
    api.get<{ treatmentPlan: TreatmentPlan }>(`/treatments/plans/${id}`),
  
  createPlan: (data: CreateTreatmentPlanInput) =>
    api.post<{ treatmentPlan: TreatmentPlan }>('/treatments/plans', data),
  
  updatePlan: (id: string, data: Partial<TreatmentPlan>) =>
    api.put<{ treatmentPlan: TreatmentPlan }>(`/treatments/plans/${id}`, data),
  
  approvePlan: (id: string) =>
    api.patch<{ treatmentPlan: TreatmentPlan }>(`/treatments/plans/${id}/approve`),
  
  deletePlan: (id: string) => api.delete(`/treatments/plans/${id}`),
};

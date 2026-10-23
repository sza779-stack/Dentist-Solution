import { api } from './client';
import type { Invoice, Payment, PaymentStatusType, PaymentMethodType } from '@/types';

export interface CreateInvoiceInput {
  patientId: string;
  appointmentId?: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    treatmentId?: string;
  }[];
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
}

export interface CreatePaymentInput {
  invoiceId?: string;
  patientId: string;
  amount: number;
  method: PaymentMethodType;
  reference?: string;
  notes?: string;
  paymentDate?: string;
}

export const billingApi = {
  // Invoices
  getAllInvoices: (params?: {
    patientId?: string;
    status?: PaymentStatusType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<{ invoices: Invoice[]; meta: any }>('/billing/invoices', params),
  
  getInvoiceById: (id: string) =>
    api.get<{ invoice: Invoice }>(`/billing/invoices/${id}`),
  
  createInvoice: (data: CreateInvoiceInput) =>
    api.post<{ invoice: Invoice }>('/billing/invoices', data),
  
  updateInvoice: (id: string, data: { dueDate?: string; notes?: string }) =>
    api.put<{ invoice: Invoice }>(`/billing/invoices/${id}`, data),
  
  deleteInvoice: (id: string) => api.delete(`/billing/invoices/${id}`),
  
  updateInvoiceStatus: (id: string, status: PaymentStatusType) =>
    api.patch<{ invoice: Invoice }>(`/billing/invoices/${id}/status`, { status }),

  applyInvoiceDiscount: (id: string, discountAmount: number) =>
    api.patch<{ invoice: Invoice }>(`/billing/invoices/${id}/discount`, { discountAmount }),
  
  downloadInvoice: (id: string) =>
    api.get<{ message: string; invoice: Invoice }>(`/billing/invoices/${id}/download`),
  
  // Payments
  getAllPayments: (params?: {
    patientId?: string;
    invoiceId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => api.get<{ payments: Payment[]; meta: any }>('/billing/payments', params),
  
  getPaymentById: (id: string) => api.get<{ payment: Payment }>(`/billing/payments/${id}`),
  
  createPayment: (data: CreatePaymentInput) =>
    api.post<{ payment: Payment }>('/billing/payments', data),
  
  // Reports
  getRevenueReport: (params: {
    startDate: string;
    endDate: string;
    groupBy?: 'day' | 'week' | 'month' | 'year';
    patientId?: string;
    treatmentId?: string;
  }) => api.get<{
    summary: {
      totalRevenue: number;
      totalInvoiced: number;
      totalOutstanding: number;
      paymentCount: number;
      invoiceCount: number;
    };
    revenueByDate: Record<string, number>;
    payments: Payment[];
  }>('/billing/reports/revenue', params),
  
  getOutstandingPayments: (params?: { page?: number; limit?: number }) =>
    api.get<{ invoices: Invoice[]; totalOutstanding: number; meta: any }>(
      '/billing/reports/outstanding',
      params
    ),
  
  getFinancialStats: (params?: { patientId?: string; treatmentId?: string }) =>
    api.get<{
      today: { revenue: number; paymentsCount: number };
      thisMonth: { revenue: number };
      last30Days: { revenue: number };
      outstanding: { balance: number };
      invoices: Record<string, number>;
    }>('/billing/stats', params),
};

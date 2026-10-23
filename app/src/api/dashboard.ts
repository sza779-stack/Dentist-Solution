import { api } from './client';
import type { DashboardStats, Appointment } from '@/types';

export const dashboardApi = {
  getStats: () => api.get<{ 
    stats: DashboardStats & {
      newPatientsThisMonth: number;
      patientGrowthRate: number;
      revenueGrowthRate: number;
      thisMonthRevenue: number;
    }; 
    recentAppointments: Appointment[]; 
    recentPatients: any[];
    appointmentsByStatus: Record<string, number>;
  }>('/dashboard'),
  
  getAdminStats: () =>
    api.get<{
      users: {
        byRole: Record<string, number>;
        active: number;
        inactive: number;
        total: number;
      };
      monthlyRevenue: number;
      revenueByMethod: { method: string; amount: number }[];
      recentActivity: number;
      activityBreakdown: Record<string, number>;
      dailyRevenue: { date: string; total: number }[];
      topTreatments: { count: number; treatment: { id: string; name: string; category: { name: string } } }[];
      pendingApprovals: number;
    }>('/dashboard/admin'),
  
  getDoctorStats: () =>
    api.get<{
      todayAppointments: Appointment[];
      totalPatients: number;
      completedThisMonth: number;
      pendingTreatmentPlans: number;
      upcomingAppointments: Appointment[];
      monthlyStats: Record<string, number>;
    }>('/dashboard/doctor'),
  
  getReceptionistStats: () =>
    api.get<{
      todayAppointments: number;
      pendingCheckIns: number;
      newPatientsToday: number;
      newPatientsThisMonth: number;
      pendingPayments: number;
      overduePayments: number;
      todayCollections: number;
      pendingConfirmations: number;
    }>('/dashboard/receptionist'),

  getAnalyticsData: (range?: '7' | '30' | '90' | '365') =>
    api.get<{
      dailyAppointments: { date: string; count: number; status: string }[];
      dailyRevenue: { date: string; total: number }[];
      newPatientsOverTime: { date: string; count: number }[];
      treatmentPopularity: { count: number; treatment: string }[];
    }>('/dashboard/analytics', { range }),
  
  getTodaySchedule: (doctorId?: string) =>
    api.get<{ date: string; appointments: Appointment[] }>('/dashboard/today', { doctorId }),
  
  getUpcomingAppointments: (limit?: number) =>
    api.get<{ appointments: Appointment[] }>('/dashboard/upcoming', { limit }),
};

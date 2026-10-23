import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import { useAuth } from '@/contexts/AuthContext';

export function useDashboardStats() {
  const { isStaff, isAdmin, isDoctor } = useAuth();

  const mainStats = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardApi.getStats(),
    enabled: isStaff,
  });

  const adminStats = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => dashboardApi.getAdminStats(),
    enabled: isAdmin,
  });

  const doctorStats = useQuery({
    queryKey: ['doctorStats'],
    queryFn: () => dashboardApi.getDoctorStats(),
    enabled: isDoctor,
  });

  const receptionistStats = useQuery({
    queryKey: ['receptionistStats'],
    queryFn: () => dashboardApi.getReceptionistStats(),
    enabled: isStaff,
  });

  return {
    mainStats: mainStats.data,
    adminStats: adminStats.data,
    doctorStats: doctorStats.data,
    receptionistStats: receptionistStats.data,
    isLoading:
      mainStats.isLoading ||
      adminStats.isLoading ||
      doctorStats.isLoading ||
      receptionistStats.isLoading,
  };
}

export function useTodaySchedule(doctorId?: string) {
  return useQuery({
    queryKey: ['todaySchedule', doctorId],
    queryFn: () => dashboardApi.getTodaySchedule(doctorId),
  });
}

export function useUpcomingAppointments(limit = 10) {
  return useQuery({
    queryKey: ['upcomingAppointments', limit],
    queryFn: () => dashboardApi.getUpcomingAppointments(limit),
  });
}

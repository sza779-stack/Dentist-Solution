import { api } from './client';
import type { LoginInput, AuthResponse, User } from '@/types';

export const authApi = {
  login: (data: LoginInput) => api.post<AuthResponse>('/auth/login', data),
  
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post<AuthResponse>('/auth/register', data),
  
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  
  refreshToken: (refreshToken: string) =>
    api.post<{ tokens: { accessToken: string; refreshToken: string } }>('/auth/refresh', {
      refreshToken,
    }),
  
  getCurrentUser: () => api.get<{ user: User }>('/auth/me'),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
};

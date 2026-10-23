import { api } from './client';
import type { Message, Notification } from '@/types';

export const messagesApi = {
  getMessages: (params?: {
    type?: 'inbox' | 'sent';
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) => api.get<{ messages: Message[]; meta: any }>('/messages', params),
  
  getById: (id: string) => api.get<{ message: Message }>(`/messages/${id}`),
  
  send: (data: {
    recipientId: string;
    subject: string;
    content: string;
    parentId?: string;
  }) => api.post<{ message: string; data: Message }>('/messages', data),

  getContacts: () =>
    api.get<{
      contacts: Array<{
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        avatarUrl?: string;
      }>;
    }>('/messages/contacts'),
  
  markAsRead: (id: string) => api.patch(`/messages/${id}/read`),
  
  delete: (id: string) => api.delete(`/messages/${id}`),
  
  getUnreadCount: () => api.get<{ count: number }>('/messages/unread/count'),
  
  // Notifications
  getNotifications: () =>
    api.get<{ notifications: Notification[]; unreadCount: number }>('/dashboard/notifications'),
  
  markNotificationAsRead: (id: string) =>
    api.patch(`/dashboard/notifications/${id}/read`),
  
  markAllNotificationsAsRead: () =>
    api.patch('/dashboard/notifications/read-all'),
};

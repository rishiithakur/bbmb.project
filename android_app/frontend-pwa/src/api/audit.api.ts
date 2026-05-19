import { apiClient } from './client';
import type { PaginatedResponse, AppNotification } from '../types';

export interface AuditEntry {
  audit_id: number;
  event_type: string;
  username: string;
  site_id: number | null;
  record_id: number | null;
  ip_address: string | null;
  timestamp: string;
  description: string;
}

export const auditApi = {
  getLogs: (params?: any) => 
    apiClient.get<PaginatedResponse<AuditEntry> | AuditEntry[]>('/audit/', { params }),
  
  getLog: (id: number) => 
    apiClient.get<AuditEntry>(`/audit/${id}/`),

  getNotifications: (params?: any) =>
    apiClient.get<PaginatedResponse<AppNotification> | AppNotification[]>('/audit/notifications/', { params }),

  markAllRead: () =>
    apiClient.post<any>('/audit/notifications/mark-all-read/'),

  clearAllNotifications: () =>
    apiClient.post<any>('/audit/notifications/clear-all/'),
};


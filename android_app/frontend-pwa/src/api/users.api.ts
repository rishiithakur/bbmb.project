import { apiClient } from './client';
import type { PaginatedResponse } from '../types';

export interface User {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  mobile?: string;
  mobile_number?: string;
  role: 'admin' | 'operator' | 'viewer';
  user_role?: string;
  site: number | null;
  assigned_site?: number | null;
  site_name?: string;
  assigned_site_name?: string;
  station_name?: string;
  is_active: boolean;
  must_change_pwd?: boolean;
}

export const usersApi = {
  getUsers: () => 
    apiClient.get<PaginatedResponse<User> | User[]>('/users/'),
  
  getUser: (id: number) => 
    apiClient.get<User>(`/users/${id}/`),

  createUser: (data: Partial<User> & { password?: string }) =>
    apiClient.post<User>('/users/', data),

  updateUser: (id: number, data: Partial<User>) =>
    apiClient.put<User>(`/users/${id}/`, data),

  deleteUser: (id: number) =>
    apiClient.delete(`/users/${id}/`),
};

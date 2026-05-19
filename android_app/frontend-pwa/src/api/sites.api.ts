import { apiClient } from './client';
import type { Site, PaginatedResponse } from '../types';

export const sitesApi = {
  getSites: () => 
    apiClient.get<PaginatedResponse<Site> | Site[]>('/sites/'),
  
  getSite: (id: number) => 
    apiClient.get<Site>(`/sites/${id}/`),

  createSite: (data: Partial<Site>) =>
    apiClient.post<Site>('/sites/', data),

  updateSite: (id: number, data: Partial<Site>) =>
    apiClient.put<Site>(`/sites/${id}/`, data),

  deleteSite: (id: number) =>
    apiClient.delete(`/sites/${id}/`),
  
  getGeoJSON: () => 
    apiClient.get<any>('/gis/sites/'),
};

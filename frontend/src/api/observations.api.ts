import { apiClient } from './client';
import type { WaterLevelLog, PaginatedResponse } from '../types';

// ── Submission status types ─────────────────────────────────────────────────
export type SubmissionStatus = 'DRAFT' | 'FINAL';

// ── Request payload sent to POST /observations/ ─────────────────────────────
export interface ObservationPayload {
  site: number;
  // Send as water_level_m (backend canonical name).
  // Optional for DRAFT, required for FINAL.
  water_level_m?: number | null;
  observation_date: string;           // YYYY-MM-DD
  observation_time?: string;          // HH:MM or HH:MM:SS, optional for draft
  weather_condition?: string;
  remarks?: string;
  status: SubmissionStatus;
  entry_latitude?: number | null;
  entry_longitude?: number | null;
  storage_mcm?: number | null;
  inflow_cusecs?: number | null;
  outflow_cusecs?: number | null;

  // DamObservation flattened fields (all optional)
  spillway_gates_open?: number | null;
  spillway_opening_m?: number | null;
  spillway_discharge_cusecs?: number | null;
  sluice_gates_open?: number | null;
  sluice_discharge_cusecs?: number | null;
  power_units_running?: number | null;
  power_generation_mw?: number | null;
  power_discharge_cusecs?: number | null;
  rainfall_today_mm?: number | null;
  upstream_level_m?: number | null;
  downstream_level_m?: number | null;
  tail_water_level_m?: number | null;
  air_temp_celsius?: number | null;
  humidity_percent?: number | null;
  seepage_lt_per_min?: number | null;
  piezometer_reading?: number | null;
  dam_condition?: string;
  alert_level?: string;
  notes?: string;
}

export interface ExportFilters {
  site?: number;
  operator?: number;
  date_from?: string;
  date_to?: string;
  alert_level?: string;
  status?: SubmissionStatus;
}

// ── API client ──────────────────────────────────────────────────────────────
export const observationsApi = {
  // List logs — all params forwarded as query string
  getLogs: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<WaterLevelLog> | WaterLevelLog[]>('/observations/', { params }),

  getLog: (id: number) =>
    apiClient.get<WaterLevelLog>(`/observations/${id}/`),

  // Create — always JSON (never multipart for plain form data)
  createLog: (data: ObservationPayload) =>
    apiClient.post<WaterLevelLog>('/observations/', data),

  // Update (PATCH) — JSON
  updateLog: (id: number, data: Partial<ObservationPayload>) =>
    apiClient.patch<WaterLevelLog>(`/observations/${id}/`, data),

  deleteLog: (id: number) =>
    apiClient.delete(`/observations/${id}/`),

  // Stats summary for dashboard
  getStats: () =>
    apiClient.get<any>('/observations/stats/'),

  // Operator's own submission history
  getMySubmissions: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<WaterLevelLog> | WaterLevelLog[]>('/observations/my-submissions/', { params }),

  // Admin: export Excel
  exportExcel: (filters?: ExportFilters) =>
    apiClient.get('/observations/export-excel/', {
      params: filters,
      responseType: 'blob',
    }),

  // Admin: verify observation (promotes DRAFT to FINAL)
  verifyLog: (id: number) =>
    apiClient.patch<WaterLevelLog>(`/observations/${id}/`, { status: 'FINAL' }),
};

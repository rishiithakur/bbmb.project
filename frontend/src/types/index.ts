export type UserRole = 'admin' | 'operator' | 'viewer' | 'supreme_admin' | 'ultra_admin';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Site {
  site_id: number;
  site_code: string;
  station_name: string;
  division: string;
  state: string;
  river_tributary: string;
  basin: string;
  latitude: number;
  longitude: number;
  full_reservoir_level: number | null;
  minimum_draw_down_level: number | null;
  danger_level: number | null;
  warning_level: number | null;
  site_status: string;
  functional: boolean;
  dam_type: string | null;
  catchment_area_sqkm: number | null;
  max_water_level: number | null;
  dead_storage_level: number | null;
  live_capacity_mcm: number | null;
  total_capacity_mcm: number | null;
  instrumentation: string | null;
  transmission_minutes: number | null;
}

export type SubmissionStatus = 'DRAFT' | 'FINAL';
export type AlertLevel = 'Green' | 'Yellow' | 'Orange' | 'Red' | 'Grey';

export interface WaterLevelLog {
  log_id: number;
  observation_id: number; // alias
  site: number | Site;
  site_name: string;
  user: number;
  observer_name: string;
  observation_date: string;
  observation_time: string;
  observation_datetime: string;
  water_level_m: number;
  current_water_level: number; // alias
  storage_mcm: number | null;
  inflow_cumecs: number | null;
  outflow_cumecs: number | null;
  inflow_cusecs?: number | null;
  outflow_cusecs?: number | null;
  entry_latitude?: number | null;
  entry_longitude?: number | null;
  remarks?: string | null;
  rainfall_today_mm: number | null;
  is_verified: boolean;
  is_flagged: boolean;
  status: SubmissionStatus;
  created_at: string;
  updated_at: string;
  weather_condition?: string | null;
  details?: DamObservation;
}

export interface DamObservation {
  obs_id: number;
  log: number;
  site: number;
  spillway_gates_open: number | null;
  spillway_opening_m: number | null;
  spillway_discharge_cusecs: number | null;
  sluice_gates_open: number | null;
  sluice_discharge_cusecs: number | null;
  power_units_running: number | null;
  power_generation_mw: number | null;
  power_discharge_cusecs: number | null;
  rainfall_today_mm: number | null;
  upstream_level_m: number | null;
  downstream_level_m: number | null;
  tail_water_level_m: number | null;
  air_temp_celsius: number | null;
  humidity_percent: number | null;
  seepage_lt_per_min: number | null;
  piezometer_reading: number | null;
  dam_condition: string;
  alert_level: AlertLevel;
  remarks: string | null;
  created_at: string;
}

export interface SiteGeoJSON {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Point";
      coordinates: [number, number];
    };
    properties: {
      id: number;
      code: string;
      name: string;
      division: string;
      state: string;
      river: string;
      basin: string;
      frl: number | null;
      mddl: number | null;
      alert_level: AlertLevel;
      water_level: number | null;
      storage: number | null;
      observation_at: string | null;
    };
  }>;
}

export interface AppNotification {
  id: number;
  recipient_username: string | null;
  recipient_role: string | null;
  site_name: string | null;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read_status: boolean;
  metadata_json: Record<string, any> | null;
}


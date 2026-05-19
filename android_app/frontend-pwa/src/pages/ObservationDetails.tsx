import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { observationsApi } from '../api/observations.api';
import { useAuthStore } from '../store/auth.store';
import {
  ArrowLeft, User, MapPin, Printer,
  CheckCircle2, AlertCircle, Loader2, Info, Droplets,
  Settings, CloudSun, FileText, Lock, XCircle
} from 'lucide-react';

const ALERT_LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500' },
  Yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  Orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  Red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500' },
  Grey:   { bg: 'bg-slate-50',  text: 'text-slate-700',  border: 'border-slate-200',  dot: 'bg-slate-400' },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft Record', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  FINAL: { label: 'Final Submission', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const ObservationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Fetch the detailed observation log
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['observation-detail', id],
    queryFn: () => observationsApi.getLog(Number(id)).then(r => r.data),
    enabled: !!id,
  });

  const log = response;
  const isDraft = log && !log.is_verified;
  const isAdmin = currentUser?.role && ['admin', 'supreme_admin', 'ultra_admin'].includes(currentUser.role);

  // Verification Mutation for Admin review
  const verifyMutation = useMutation({
    mutationFn: () => observationsApi.updateLog(Number(id), { status: 'FINAL' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observation-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-observations'] });
      queryClient.invalidateQueries({ queryKey: ['observations'] });
    },
    onError: (err: any) => {
      setVerifyError(err?.response?.data?.detail || 'Verification failed. Please try again.');
    }
  });

  const handleVerify = async () => {
    if (!window.confirm('Are you sure you want to verify and lock this hydrological observation?')) {
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      await verifyMutation.mutateAsync();
    } catch (err) {
      // already caught by mutation onError or can handle here
    } finally {
      setVerifying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="font-semibold text-sm">Fetching complete observation report...</p>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-6 bg-red-50 rounded-2xl border border-red-200 text-red-800 flex items-start gap-4">
        <AlertCircle className="flex-shrink-0 mt-1" size={24} />
        <div>
          <h2 className="text-lg font-bold">Report Loading Error</h2>
          <p className="mt-1 text-sm text-red-700">
            Failed to retrieve details for observation ID #{id}. The record might have been deleted or database connection failed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-800 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const details: any = log.details || {};
  const alertLevel = details.alert_level || 'Grey';
  const alertCfg = ALERT_LEVEL_COLORS[alertLevel] || ALERT_LEVEL_COLORS['Grey'];
  const statusKey = log.is_verified ? 'FINAL' : 'DRAFT';
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG['DRAFT'];

  // Resolve site details dynamically from the nested object if available
  const siteDetails = log.site && typeof log.site === 'object' ? log.site : null;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 print:p-0 print:max-w-full">
      {/* Top action bar (hidden in print) */}
      <div className="flex items-center justify-between gap-4 border-b pb-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 bg-white border rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-slate-700 hover:text-slate-900 bg-white border rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <Printer size={16} />
            Print Report
          </button>

          {isAdmin && isDraft && (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            >
              {verifying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Verify & Lock
            </button>
          )}
        </div>
      </div>

      {verifyError && (
        <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 flex items-center gap-2 text-sm print:hidden">
          <XCircle size={16} className="text-red-600 flex-shrink-0" />
          <span>{verifyError}</span>
        </div>
      )}

      {/* ────────────────── OFFICIAL PRINTABLE REPORT ────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-0 print:shadow-none">
        
        {/* Report Official Header Banner */}
        <div className="bg-slate-900 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 print:bg-white print:text-slate-900 print:p-0 print:border-b-2 print:border-slate-300">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="text-blue-400 print:text-blue-600" size={24} />
              <h1 className="text-xl font-black uppercase tracking-wider print:text-slate-900">Hydrological Observation Report</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 print:text-slate-500">
              Official hydrological and telemetry record log for dam monitoring operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.className} print:border-slate-400 print:text-slate-800`}>
              <Lock size={12} />
              {statusCfg.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${alertCfg.bg} ${alertCfg.text} ${alertCfg.border}`}>
              <span className={`w-2 h-2 rounded-full ${alertCfg.dot}`} />
              Alert: {alertLevel}
            </span>
          </div>
        </div>

        {/* 3-Column Report Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Column 1: Identity & Reference */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Info size={14} className="text-slate-400" />
                Station Information
              </h3>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 print:bg-white">
                <ReportField label="Station Name" value={log.site_name} bold />
                <ReportField label="Station Code" value={siteDetails?.site_code || `#${log.site}`} />
                <ReportField label="Division / Basin" value={siteDetails?.division ? `${siteDetails.division} / ${siteDetails.basin || '—'}` : '—'} />
                <ReportField label="Site Status" value={siteDetails?.site_status || 'Operational'} />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <User size={14} className="text-slate-400" />
                Log Reference
              </h3>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 print:bg-white">
                <ReportField label="Observer / Operator" value={log.observer_name || 'System Auto-Capture'} />
                <ReportField label="Date Filed" value={log.observation_date} />
                <ReportField label="Time Logged" value={log.observation_time ? log.observation_time.slice(0, 5) : '—'} />
                <ReportField label="Log Record ID" value={`#${log.log_id}`} />
                <ReportField label="Is Verified / Locked" value={log.is_verified ? 'Yes (Final)' : 'No (Draft Review)'} />
                {log.is_verified && log.updated_at && (
                  <ReportField label="Finalized At" value={new Date(log.updated_at).toLocaleString()} />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <MapPin size={14} className="text-slate-400" />
                Geospatial Check
              </h3>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 print:bg-white">
                <ReportField label="Submission Coordinates" value={
                  log.entry_latitude && log.entry_longitude
                    ? `📍 ${parseFloat(String(log.entry_latitude)).toFixed(5)}, ${parseFloat(String(log.entry_longitude)).toFixed(5)}`
                    : 'Not Verified (No GPS Lock)'
                } />
                <ReportField label="Station Latitude" value={siteDetails?.latitude ? `${siteDetails.latitude}° N` : '—'} />
                <ReportField label="Station Longitude" value={siteDetails?.longitude ? `${siteDetails.longitude}° E` : '—'} />
              </div>
            </div>
          </div>

          {/* Column 2: Hydrological Parameters */}
          <div className="p-6 space-y-6 bg-slate-50/30 print:bg-white">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Droplets size={14} className="text-blue-500" />
                Core Hydrological Logs
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Water Level Gauge Block */}
                <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Water Level (Metric)</span>
                    <p className="text-2xl font-black text-blue-700 mt-0.5">
                      {log.water_level_m ? `${parseFloat(String(log.water_level_m)).toFixed(3)} m` : '—'}
                    </p>
                  </div>
                  <div className="text-right border-l pl-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Water Level (Imperial)</span>
                    <p className="text-xl font-bold text-slate-700 mt-0.5">
                      {log.water_level_m ? `${(parseFloat(String(log.water_level_m)) * 3.28084).toFixed(2)} ft` : '—'}
                    </p>
                  </div>
                </div>

                {/* Storage block */}
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Storage Capacity</span>
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {log.storage_mcm ? `${parseFloat(String(log.storage_mcm)).toFixed(3)} MCM` : '—'}
                    </span>
                  </div>
                  {/* Visual Filling Bar */}
                  {log.storage_mcm && siteDetails?.live_capacity_mcm && (
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, (Number(log.storage_mcm) / Number(siteDetails.live_capacity_mcm)) * 100))}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Inflow / Outflow Block */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border rounded-xl p-3 shadow-sm text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Inflow Volume</span>
                    <p className="text-lg font-bold text-emerald-600 mt-1">
                      {log.inflow_cusecs ? `${parseFloat(String(log.inflow_cusecs)).toFixed(1)}` : '—'}
                    </p>
                    <span className="text-[8px] text-slate-400 uppercase font-medium">cusecs</span>
                  </div>
                  
                  <div className="bg-white border rounded-xl p-3 shadow-sm text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Outflow Volume</span>
                    <p className="text-lg font-bold text-rose-600 mt-1">
                      {log.outflow_cusecs ? `${parseFloat(String(log.outflow_cusecs)).toFixed(1)}` : '—'}
                    </p>
                    <span className="text-[8px] text-slate-400 uppercase font-medium">cusecs</span>
                  </div>
                </div>

                {/* Physical Limits Comparison */}
                <div className="bg-white border rounded-xl p-4 shadow-sm space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b pb-1">Station Design Benchmarks</span>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Full Reservoir Level (FRL):</span>
                    <span className="font-semibold text-slate-800">{siteDetails?.full_reservoir_level ? `${siteDetails.full_reservoir_level} m` : '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Max Water Level (MWL):</span>
                    <span className="font-semibold text-red-600">{siteDetails?.max_water_level ? `${siteDetails.max_water_level} m` : '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Minimum Draw Down Level (MDDL):</span>
                    <span className="font-semibold text-amber-600">{siteDetails?.minimum_draw_down_level ? `${siteDetails.minimum_draw_down_level} m` : '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Telemetry & Operational Parameters */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Settings size={14} className="text-slate-500" />
                Operational Telemetry
              </h3>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 print:bg-white">
                <ReportField label="Spillway Gates Open" value={details.spillway_gates_open != null ? `${details.spillway_gates_open} Gate(s)` : '—'} />
                {details.spillway_gates_open > 0 && (
                  <>
                    <ReportField label="Spillway Gate Opening" value={details.spillway_opening_m != null ? `${details.spillway_opening_m} m` : '—'} />
                    <ReportField label="Spillway Discharge" value={details.spillway_discharge_cusecs != null ? `${details.spillway_discharge_cusecs} cusecs` : '—'} />
                  </>
                )}
                <ReportField label="Sluice Gates Open" value={details.sluice_gates_open != null ? `${details.sluice_gates_open} Gate(s)` : '—'} />
                {details.sluice_gates_open > 0 && (
                  <ReportField label="Sluice Discharge" value={details.sluice_discharge_cusecs != null ? `${details.sluice_discharge_cusecs} cusecs` : '—'} />
                )}
                <ReportField label="Power Units Active" value={details.power_units_running != null ? `${details.power_units_running} Unit(s)` : '—'} />
                {details.power_units_running > 0 && (
                  <>
                    <ReportField label="Power Generation" value={details.power_generation_mw != null ? `${details.power_generation_mw} MW` : '—'} />
                    <ReportField label="Power Discharge" value={details.power_discharge_cusecs != null ? `${details.power_discharge_cusecs} cusecs` : '—'} />
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <CloudSun size={14} className="text-amber-500" />
                Environmental Telemetry
              </h3>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 print:bg-white">
                <ReportField label="Daily Rainfall Today" value={details.rainfall_today_mm != null ? `${details.rainfall_today_mm} mm` : '—'} />
                <ReportField label="Weather Condition" value={log.weather_condition || '—'} />
                <ReportField label="Air Temp / Humidity" value={
                  details.air_temp_celsius != null || details.humidity_percent != null
                    ? `${details.air_temp_celsius ?? '—'}°C / ${details.humidity_percent ?? '—'}%`
                    : '—'
                } />
                <ReportField label="Seepage Discharge" value={details.seepage_lt_per_min != null ? `${details.seepage_lt_per_min} L/min` : '—'} />
                <ReportField label="Piezometer Reading" value={details.piezometer_reading != null ? `${details.piezometer_reading} m` : '—'} />
                <ReportField label="Dam Condition Rating" value={details.dam_condition || '—'} />
              </div>
            </div>
          </div>
        </div>

        {/* Remarks & Special Technical Notes Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 space-y-4 print:bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                <FileText size={13} className="text-slate-400" />
                Operator Field Remarks
              </h4>
              <div className="bg-white border rounded-xl p-4 text-sm text-slate-700 italic min-h-[80px]">
                {log.remarks ? `"${log.remarks}"` : 'No special field remarks recorded for this observation cycle.'}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                <Info size={13} className="text-slate-400" />
                Special Technical Notes
              </h4>
              <div className="bg-white border rounded-xl p-4 text-sm text-slate-700 italic min-h-[80px]">
                {details.notes ? `"${details.notes}"` : 'No technical notes, instrumentation flags, or structural alerts specified.'}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
            <span>© BBMC Dam Monitoring Division · Certified Telemetry Archive Record</span>
            <span>Record ID reference: {log.observation_id} | Security Hash: verified_log_{log.log_id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-component for individual fields ──────────────────────────────────────
const ReportField: React.FC<{ label: string; value: any; bold?: boolean }> = ({ label, value, bold }) => (
  <div className="flex justify-between items-baseline gap-4 text-xs border-b border-dashed border-slate-100 pb-1.5">
    <span className="text-slate-500 font-medium">{label}:</span>
    <span className={`text-slate-900 text-right ${bold ? 'font-bold text-sm' : 'font-mono font-medium'}`}>
      {value !== null && value !== undefined && value !== '' ? String(value) : '—'}
    </span>
  </div>
);

export default ObservationDetails;

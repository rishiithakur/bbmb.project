import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { observationsApi } from '../api/observations.api';
import { sitesApi } from '../api/sites.api';
import ObservationForm from '../features/observations/ObservationForm';
import SubmissionHistory from '../features/observations/SubmissionHistory';
import MapContainer from '../gis/MapContainer';
import {
  TrendingUp, User, ClipboardList, ShieldAlert, Waves, Info, Map
} from 'lucide-react';

const OperatorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [editingLog, setEditingLog] = useState<{ id: number; data: any } | null>(null);
  const [formKey, setFormKey] = useState(0);

  // Fetch operator's assigned site details
  const { data: siteDetails, isLoading: loadingSite } = useQuery({
    queryKey: ['assigned-site-details', user?.assigned_site],
    queryFn: () => user?.assigned_site ? sitesApi.getSite(user.assigned_site).then(r => r.data) : null,
    enabled: !!user?.assigned_site,
  });

  // Fetch submissions to extract the latest water level for statistics
  const { data: submissionsRes } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => observationsApi.getMySubmissions().then(r => r.data),
    refetchInterval: 60000,
  });

  const logs: any[] = Array.isArray(submissionsRes)
    ? submissionsRes
    : (submissionsRes as any)?.results ?? [];

  const latestLog = logs[0]; // Recent log at index 0 because sorted latest first

  const handleEditDraft = (logId: number, logData: any) => {
    setEditingLog({ id: logId, data: logData });
    setFormKey(k => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSuccess = () => {
    setEditingLog(null);
    setFormKey(k => k + 1);
  };

  const editPrefill = editingLog ? {
    site: editingLog.data.site,
    water_level_m: editingLog.data.water_level_m ? parseFloat(editingLog.data.water_level_m) : undefined,
    observation_date: editingLog.data.observation_date,
    observation_time: editingLog.data.observation_time,
    weather_condition: editingLog.data.weather_condition,
    remarks: editingLog.data.remarks,
    inflow_cusecs: editingLog.data.inflow_cusecs ? parseFloat(editingLog.data.inflow_cusecs) : undefined,
    outflow_cusecs: editingLog.data.outflow_cusecs ? parseFloat(editingLog.data.outflow_cusecs) : undefined,
    storage_mcm: editingLog.data.storage_mcm ? parseFloat(editingLog.data.storage_mcm) : undefined,
    rainfall_today_mm: editingLog.data.details?.rainfall_today_mm ? parseFloat(editingLog.data.details.rainfall_today_mm) : undefined,
    alert_level: editingLog.data.details?.alert_level,
    dam_condition: editingLog.data.details?.dam_condition,
    notes: editingLog.data.details?.notes,
  } : undefined;

  // Compute stats relative to full reservoir level (FRL)
  const currentLevel = latestLog?.water_level_m ? parseFloat(latestLog.water_level_m) : null;
  const frl = siteDetails?.full_reservoir_level ? parseFloat(String(siteDetails.full_reservoir_level)) : null;
  const mddl = siteDetails?.minimum_draw_down_level ? parseFloat(String(siteDetails.minimum_draw_down_level)) : null;
  const mwl = siteDetails?.max_water_level ? parseFloat(String(siteDetails.max_water_level)) : null;

  let fillPercentage = 0;
  if (currentLevel != null && frl != null) {
    const minBound = mddl || 0;
    const maxBound = frl;
    if (maxBound > minBound) {
      fillPercentage = Math.max(0, Math.min(100, ((currentLevel - minBound) / (maxBound - minBound)) * 100));
    } else {
      fillPercentage = Math.max(0, Math.min(100, (currentLevel / maxBound) * 100));
    }
  }

  // Safe coordinate formatting helper
  const formatCoord = (val: any) => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const parsedLat = siteDetails ? formatCoord(siteDetails.latitude) : null;
  const parsedLng = siteDetails ? formatCoord(siteDetails.longitude) : null;

  const alertColors: Record<string, string> = {
    Green: 'bg-green-100 text-green-700 border-green-200',
    Yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Orange: 'bg-orange-100 text-orange-700 border-orange-200',
    Red: 'bg-red-100 text-red-700 border-red-200',
    Grey: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const alertLevel = latestLog?.details?.alert_level || 'Grey';
  const alertColor = alertColors[alertLevel] || alertColors['Grey'];

  return (
    <div className="min-h-full bg-slate-50/50 p-4 sm:p-6 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Workspace Title & Alert Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <ClipboardList className="text-blue-500" size={24} />
              Operator Workspace
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Real-time daily field-monitoring and database synchronization panel
            </p>
          </div>
          {latestLog && (
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full border text-xs font-black flex items-center gap-1.5 shadow-sm uppercase tracking-wider ${alertColor}`}>
                <ShieldAlert size={14} />
                {alertLevel} Level Warning
              </div>
              <div className="text-[10px] text-slate-400 font-mono text-right hidden sm:block">
                Last Log: {latestLog.observation_date} · {latestLog.observation_time?.slice(0, 5)}
              </div>
            </div>
          )}
        </div>

        {/* 3-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT PANEL (col-span-3) ── */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Operator Profile Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative p-5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/40">
                  <User className="text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">{user?.full_name || 'Field Operator'}</h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400/80">Site Operator</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Dam:</span>
                  <span className="font-bold text-white truncate max-w-[130px]">
                    {siteDetails?.station_name || 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Station Code:</span>
                  <span className="font-mono text-white font-semibold">
                    {siteDetails?.site_code || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Functional Status:</span>
                  <span className={`font-bold ${siteDetails?.functional ? 'text-green-400' : 'text-red-400'}`}>
                    {siteDetails?.functional ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Today's Status Metrics */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3.5">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <TrendingUp size={12} className="text-blue-500" />
                Today's Overview
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Today's Status</span>
                  <p className={`text-xs font-black mt-1 ${latestLog?.is_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {latestLog ? (latestLog.is_verified ? 'SUBMITTED' : 'DRAFT SAVED') : 'NO DATA'}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold">Rainfall (24h)</span>
                  <p className="text-xs font-black text-slate-800 mt-1">
                    {latestLog?.details?.rainfall_today_mm != null ? `${latestLog.details.rainfall_today_mm} mm` : '0.0 mm'}
                  </p>
                </div>
              </div>
            </div>

            {/* Submission Log */}
            <SubmissionHistory onEditDraft={handleEditDraft} compact={true} />
          </div>

          {/* ── CENTER PANEL (col-span-6) ── */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Editing banner if a draft is loaded */}
            {editingLog && (
              <div className="bg-amber-50 border border-amber-200/60 rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
                <p className="text-xs text-amber-800 font-medium">
                  ✏️ Editing Draft Observation — Log #{editingLog.id} · {editingLog.data.observation_date}
                </p>
                <button 
                  onClick={() => { setEditingLog(null); setFormKey(k => k + 1); }}
                  className="text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200/80 px-2 py-1 rounded-lg transition-all"
                >
                  Cancel Edit
                </button>
              </div>
            )}

            {/* Premium Observation Form card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                  <ClipboardList size={18} className="text-blue-500" />
                  {editingLog ? `Modify Draft Record #${editingLog.id}` : 'Daily Hydrological Observation Form'}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Local Auto-save Active
                </div>
              </div>
              <div className="p-1 sm:p-3">
                <ObservationForm 
                  key={formKey} 
                  prefillData={editPrefill}
                  existingLogId={editingLog?.id} 
                  onSuccess={handleFormSuccess} 
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL (col-span-3) ── */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Compact live GIS map */}
            <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm space-y-2">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Map size={12} className="text-blue-500" />
                Live Location Tracker
              </h4>
              <div className="bg-slate-900 rounded-xl overflow-hidden h-[260px] relative shadow-inner border">
                <MapContainer assignedSiteId={user?.assigned_site} />
              </div>
            </div>

            {/* Assigned Site Parameters & Comparisons */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-black flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Info size={12} className="text-blue-500" />
                Reservoir Level Progress
              </h4>
              
              {loadingSite ? (
                <div className="text-center py-4 text-xs text-slate-400">Loading site metrics...</div>
              ) : siteDetails ? (
                <div className="space-y-4">
                  {/* Gauge indicator */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Waves size={12} className="text-blue-500" />
                        Storage Fill Level:
                      </span>
                      <span className="font-mono font-black text-blue-700">{fillPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Limits and coordinates list */}
                  <div className="pt-2 border-t border-slate-100 text-xs space-y-2.5 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Full Reservoir (FRL):</span>
                      <span className="font-mono font-bold text-slate-800">{frl != null ? `${frl.toFixed(2)} m` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Maximum Level (MWL):</span>
                      <span className="font-mono font-bold text-slate-800">{mwl != null ? `${mwl.toFixed(2)} m` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Dead Storage (MDDL):</span>
                      <span className="font-mono font-bold text-slate-800">{mddl != null ? `${mddl.toFixed(2)} m` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Basin / River:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[130px]">{siteDetails.basin} / {siteDetails.river_tributary || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Coordinates:</span>
                      <span className="font-mono text-slate-500 font-medium">
                        {parsedLat !== null ? `${parsedLat.toFixed(4)}°N` : '—'}, {parsedLng !== null ? `${parsedLng.toFixed(4)}°E` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">
                  No assigned site details available. Please contact system admin.
                </div>
              )}
            </div>

          </div>

        </div>
        
      </div>
    </div>
  );
};

export default OperatorDashboard;

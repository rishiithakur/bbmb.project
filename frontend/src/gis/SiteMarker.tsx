import React, { useState, memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Calendar, User, Eye, Activity, CloudSun, Waves } from 'lucide-react';
import type { AlertLevel } from '../types';

interface SiteMarkerProps {
  feature: {
    geometry: {
      coordinates: [number, number];
    };
    properties: {
      id: number;
      code: string;
      name: string;
      alert_level: AlertLevel;
      water_level: number | null;
      storage_percent: number | null;
      observation_at: string | null;
      division?: string;
      river?: string;
      basin?: string;
      district?: string;
      frl?: number;
      mwl?: number;
      inflow?: number | null;
      outflow?: number | null;
      weather?: string | null;
      spillway_gates_open?: number | null;
      spillway_discharge?: number | null;
      power_generation_mw?: number | null;
      rainfall_mm?: number | null;
      dam_condition?: string | null;
      operator_name?: string | null;
      remarks?: string | null;
      submission_status?: string | null;
    };
  };
}

const getMarkerColor = (level: AlertLevel) => {
  switch (level) {
    case 'Green': return '#22c55e';
    case 'Yellow': return '#eab308';
    case 'Orange': return '#f97316';
    case 'Red': return '#ef4444';
    default: return '#94a3b8';
  }
};

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 26px;
        height: 26px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        transition: all 0.2s ease;
      "></div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
};

const SiteMarker: React.FC<SiteMarkerProps> = memo(({ feature }) => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [isOpen, setIsOpen] = useState(false);
  
  const { coordinates } = feature.geometry;
  const { 
    id, name, code, alert_level, water_level, storage_percent, observation_at,
    frl, district, inflow, outflow, weather,
    spillway_gates_open, spillway_discharge, power_generation_mw,
    rainfall_mm, dam_condition, operator_name, remarks, submission_status
  } = feature.properties;
  
  const icon = createCustomIcon(getMarkerColor(alert_level));

  const handleViewHistorical = () => {
    if (user?.role === 'operator') {
      navigate('/operator');
    } else if (user?.role && ['admin', 'supreme_admin', 'ultra_admin'].includes(user.role)) {
      navigate(`/admin/observations?site=${id}`);
    } else {
      navigate(`/observations?site=${id}`);
    }
  };

  // Dynamically configure responsive popup limits based on screen size
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 768;
  const popupMaxWidth = screenWidth < 768 ? Math.floor(screenWidth * 0.82) : 360;
  const popupMinWidth = screenWidth < 768 ? 260 : 310;

  return (
    <Marker 
      position={[coordinates[1], coordinates[0]]} 
      icon={icon}
      eventHandlers={{
        popupopen: () => setIsOpen(true),
        popupclose: () => setIsOpen(false)
      }}
    >
      <Popup 
        className="bbmc-popup" 
        maxWidth={popupMaxWidth} 
        minWidth={popupMinWidth}
      >
        {isOpen ? (
          <div className="p-2 select-none">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-2 mb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight leading-tight">{name}</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{code} | {district || 'General Division'}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider shadow-sm"
                  style={{ backgroundColor: getMarkerColor(alert_level) }}
                >
                  {alert_level} Alert
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold border uppercase">
                    {dam_condition || 'Normal'}
                  </span>
                  {submission_status && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border uppercase ${
                      submission_status === 'FINAL' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {submission_status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Primary Metrics Grid - stack vertically on mobile, double columns on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-blue-800/80 uppercase tracking-wider flex items-center gap-1">
                  <Waves size={12} className="text-blue-500" />
                  Water Level
                </span>
                <div className="mt-1">
                  <span className="text-base sm:text-lg font-black text-blue-700">
                    {water_level != null ? `${Number(water_level).toFixed(3)}` : 'N/A'}
                  </span>
                  {water_level != null && <span className="text-[10px] text-blue-500 font-semibold ml-1">m</span>}
                </div>
                <span className="text-[9px] text-slate-400 mt-1">FRL: {frl || '--'} m</span>
              </div>

              <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-emerald-800/80 uppercase tracking-wider flex items-center gap-1">
                  <Activity size={12} className="text-emerald-500" />
                  Storage Vol.
                </span>
                <div className="mt-1">
                  <span className="text-base sm:text-lg font-black text-emerald-700">
                    {storage_percent != null ? `${Number(storage_percent).toFixed(2)}` : 'N/A'}
                  </span>
                  {storage_percent != null && <span className="text-[10px] text-emerald-500 font-semibold ml-1">%</span>}
                </div>
                <span className="text-[9px] text-slate-400 mt-1">Percent Capacity</span>
              </div>
            </div>

            {/* Hydrological Metrics Grid - 1 col on mobile, 2 cols on desktop */}
            <div className="bg-slate-50 p-2.5 rounded-lg border mb-3">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pb-1 border-b">
                Hydrological Flows
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Inflow:</span>
                  <span className="font-bold text-slate-800">
                    {inflow != null ? `${Number(inflow).toLocaleString()} cusecs` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Outflow:</span>
                  <span className="font-bold text-slate-800">
                    {outflow != null ? `${Number(outflow).toLocaleString()} cusecs` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Rainfall:</span>
                  <span className="font-bold text-blue-600">
                    {rainfall_mm != null ? `${Number(rainfall_mm).toFixed(1)} mm` : '0.0 mm'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    <CloudSun size={12} className="text-amber-500" />
                    Weather:
                  </span>
                  <span className="font-semibold text-slate-700 capitalize">
                    {weather || 'Clear'}
                  </span>
                </div>
              </div>
            </div>

            {/* Dam Operational Details */}
            <div className="bg-slate-50 p-2.5 rounded-lg border mb-3">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pb-1 border-b">
                Spillways & Generation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Gates Open:</span>
                  <span className="font-bold text-slate-800">
                    {spillway_gates_open != null ? `${spillway_gates_open} Unit(s)` : '0 Unit'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Discharge:</span>
                  <span className="font-bold text-slate-800">
                    {spillway_discharge != null ? `${Number(spillway_discharge).toLocaleString()} ccs` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center sm:col-span-2">
                  <span className="text-slate-500">Power Output:</span>
                  <span className="font-bold text-amber-600">
                    {power_generation_mw != null ? `${Number(power_generation_mw).toFixed(2)} MW` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {remarks && (
              <div className="bg-slate-50 p-2 rounded-lg border mb-3 text-xs text-slate-600 max-h-16 overflow-y-auto">
                <span className="font-bold text-slate-700">Remarks:</span> {remarks}
              </div>
            )}

            {/* Observer Footer */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 italic px-1 mb-2">
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <User size={11} className="text-slate-400" />
                Observer: {operator_name || 'System'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} className="text-slate-400" />
                {observation_at ? new Date(observation_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
              </span>
            </div>

            {/* Primary Action Button */}
            <button 
              className="w-full bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5"
              onClick={handleViewHistorical}
            >
              <Eye size={13} />
              View Historical Logs
            </button>
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 font-medium text-xs">
            Loading Station Details...
          </div>
        )}
      </Popup>
    </Marker>
  );
});

SiteMarker.displayName = 'SiteMarker';

export default SiteMarker;

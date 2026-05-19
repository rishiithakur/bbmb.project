import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { observationsApi } from '../api/observations.api';
import type { Site } from '../types';
import {
  X, Maximize2, Minimize2, Copy, Check, Printer, Download,
  ChevronLeft, ChevronRight, MapPin, User, Clock, CloudSun,
  Droplets, Waves, AlertTriangle, FileText, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Alert and Status styling constants ─────────────────────────────────────────

const ALERT_LEVEL_COLORS: Record<string, { bg: string; text?: string; border: string; dot: string; label: string }> = {
  Green:  { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', border: 'border-emerald-200', label: 'Normal (Green Alert)' },
  Yellow: { bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', border: 'border-yellow-200', label: 'Advisory (Yellow Alert)' },
  Orange: { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', border: 'border-orange-200', label: 'Warning (Orange Alert)' },
  Red:    { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', border: 'border-rose-200', label: 'Danger (Red Alert)' },
  Grey:   { bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400', border: 'border-slate-200', label: 'No Alert' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; border: string; text: string }> = {
  DRAFT:    { label: 'Draft Record', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  FINAL:    { label: 'Final Submission', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  APPROVED: { label: 'Verified & Approved', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
};

interface ObservationViewerModalProps {
  observationId: number | null;
  siblingIds?: number[];
  onClose: () => void;
  onIdChange?: (newId: number) => void;
}

const ObservationViewerModal: React.FC<ObservationViewerModalProps> = ({
  observationId,
  siblingIds = [],
  onClose,
  onIdChange
}) => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Sync initial observationId to active state
  useEffect(() => {
    if (observationId) {
      setActiveId(observationId);
    }
  }, [observationId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeId]);

  // Fetch observation log details dynamically
  const { data: log, isLoading, error } = useQuery({
    queryKey: ['observation-detail', activeId],
    queryFn: () => {
      if (!activeId) return Promise.reject('No ID');
      return observationsApi.getLog(activeId).then(r => r.data);
    },
    enabled: !!activeId,
  });

  if (!activeId) return null;

  // Sibling navigation indices
  const currentIndex = siblingIds.indexOf(activeId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < siblingIds.length - 1;

  const handlePrev = () => {
    if (hasPrevious) {
      const prevId = siblingIds[currentIndex - 1];
      setActiveId(prevId);
      if (onIdChange) onIdChange(prevId);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      const nextId = siblingIds[currentIndex + 1];
      setActiveId(nextId);
      if (onIdChange) onIdChange(nextId);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(activeId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!log) return;
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Observation_${activeId}_Report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const handleExportCSV = () => {
    if (!log) return;
    const rows = [
      ['Parameter', 'Value', 'Unit'],
      ['Observation ID', log.log_id, ''],
      ['Site Name', log.site_name || '', ''],
      ['Observation Date', log.observation_date || '', ''],
      ['Observation Time', log.observation_time || '', ''],
      ['Water Level', log.water_level_m || '', 'm'],
      ['Inflow', log.inflow_cusecs || '', 'cusecs'],
      ['Outflow', log.outflow_cusecs || '', 'cusecs'],
      ['Storage Volume', log.storage_mcm || '', 'MCM'],
      ['Rainfall Today', log.details?.rainfall_today_mm || '', 'mm'],
      ['Power Generation', log.details?.power_generation_mw || '', 'MW'],
      ['Weather', log.weather_condition || '', ''],
      ['Alert Level', log.details?.alert_level || '', ''],
      ['Dam Condition', log.details?.dam_condition || '', ''],
      ['Status', log.status || (log.is_verified ? 'FINAL' : 'DRAFT'), ''],
      ['Operator', log.observer_name || '', ''],
      ['Remarks', log.remarks || '', '']
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Observation_${activeId}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportOpen(false);
  };

  // Status mapping
  const statusKey = log?.status || (log?.is_verified ? 'FINAL' : 'DRAFT');
  const statusObj = STATUS_CONFIG[statusKey] || STATUS_CONFIG['DRAFT'];
  const alertLevel = log?.details?.alert_level || 'Grey';
  const alertCfg = ALERT_LEVEL_COLORS[alertLevel] || ALERT_LEVEL_COLORS['Grey'];

  const siteObj = log && typeof log.site === 'object' ? (log.site as Site) : null;

  // Map settings
  const siteLat = siteObj?.latitude ? Number(siteObj.latitude) : null;
  const siteLng = siteObj?.longitude ? Number(siteObj.longitude) : null;
  const hasCoordinates = siteLat !== null && siteLng !== null && !isNaN(siteLat) && !isNaN(siteLng);

  // Custom marker icon inside modal
  const mapColor = getMarkerColor(alertLevel);
  const customMarkerIcon = L.divIcon({
    className: 'custom-marker-viewer',
    html: `
      <div style="
        background-color: ${mapColor};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  function getMarkerColor(level: string) {
    switch (level) {
      case 'Green': return '#10b981';
      case 'Yellow': return '#eab308';
      case 'Orange': return '#f97316';
      case 'Red': return '#ef4444';
      default: return '#64748b';
    }
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in print:bg-white print:p-0 print:absolute print:inset-0">
      <style>{`
        .modal-container .leaflet-container {
          z-index: 1 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: 100% !important;
          max-height: 100% !important;
          overflow: hidden !important;
          position: relative !important;
          border-radius: inherit !important;
        }
        .modal-container .leaflet-pane,
        .modal-container .leaflet-map-pane,
        .modal-container .leaflet-tile-pane {
          overflow: hidden !important;
        }
        .modal-container .leaflet-popup {
          max-width: 240px !important;
        }
        .modal-container .leaflet-popup-content-wrapper {
          padding: 4px !important;
          border-radius: 8px !important;
        }
        .custom-marker-viewer {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      
      {/* Modal Container */}
      <div className={`modal-container bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 transform scale-100 ${
        isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-5xl h-[88vh]'
      } print:w-full print:h-auto print:max-w-none print:rounded-none print:shadow-none print:border-0`}>
        
        {/* Header Action Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 print:hidden select-none relative z-20">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-400" size={18} />
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Hydrological Record</span>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                ID: #{activeId}
                <button 
                  onClick={handleCopyId}
                  title="Copy Observation ID" 
                  className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </h2>
            </div>
          </div>

          {/* Sibling navigation */}
          {siblingIds.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={handlePrev}
                disabled={!hasPrevious}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors"
                title="Previous Submission"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] px-1.5 font-bold text-slate-300">
                {currentIndex + 1} / {siblingIds.length}
              </span>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-colors"
                title="Next Submission"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Action buttons & Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Print Official Report"
            >
              <Printer size={16} />
            </button>

            {/* Export dropdown toggler */}
            <div className="relative z-30">
              <button
                onClick={() => setExportOpen(p => !p)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                title="Export Data"
              >
                <Download size={16} />
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg border shadow-lg overflow-hidden py-1 z-50 text-slate-700 text-xs font-semibold animate-fade-in">
                  <button
                    onClick={handleExportJSON}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    Export as CSV/Excel
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsFullscreen(p => !p)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              onClick={onClose}
              className="p-1 hover:bg-rose-600 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Close Panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Loading / Error layouts */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center bg-white text-slate-500 gap-3">
            <Clock size={32} className="animate-spin text-blue-600" />
            <p className="font-semibold text-sm">Fetching telemetry record details...</p>
          </div>
        )}

        {error && (
          <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center">
            <AlertTriangle className="text-red-500 mb-2" size={40} />
            <h3 className="font-bold text-slate-800 text-lg">Error Loading Record</h3>
            <p className="text-slate-500 text-sm max-w-sm mt-1">
              Failed to retrieve telemetry record #{activeId}. It may have been deleted, or there was a network database timeout.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm shadow hover:bg-blue-700 transition-colors"
            >
              Close Panel
            </button>
          </div>
        )}

        {/* ── Main Report Workspace ── */}
        {!isLoading && !error && log && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden grid grid-cols-1 lg:grid-cols-[2fr_1fr] print:overflow-visible print:block bg-slate-50">
            
            {/* LEFT / CENTER: Printable Telemetry Content */}
            <div className="p-4 lg:p-6 print:p-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 print:border-0">
              
              {/* Official Report Title Banner */}
              <div className="border-b border-slate-200 pb-4 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    BHAKRA BEAS MANAGEMENT BOARD
                  </h1>
                  <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                    Official Telemetry / Hydrological Observation Report
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${statusObj.bg} ${statusObj.text} ${statusObj.border}`}>
                    <CheckCircle2 size={12} />
                    {statusObj.label}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${alertCfg.bg} ${alertCfg.text} ${alertCfg.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${alertCfg.dot}`} />
                    {alertCfg.label}
                  </span>
                </div>
              </div>

              {/* Grid 1: Site Metadata Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <MapPin className="text-slate-400 mt-0.5" size={16} />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Dam Station</span>
                    <p className="text-sm font-bold text-slate-800">{log.site_name || 'BBMC Dam Station'}</p>
                    <p className="text-[10px] font-mono text-slate-500">Code: {siteObj?.site_code || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="text-slate-400 mt-0.5" size={16} />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Observation Time</span>
                    <p className="text-sm font-bold text-slate-800">{log.observation_date}</p>
                    <p className="text-[10px] font-mono text-slate-500">Time: {log.observation_time || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="text-slate-400 mt-0.5" size={16} />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Submitting Officer</span>
                    <p className="text-sm font-bold text-slate-800">{log.observer_name || 'System Operator'}</p>
                    <p className="text-[10px] font-mono text-slate-500">Role: Field Staff</p>
                  </div>
                </div>
              </div>

              {/* Grid 2: Core Hydrological Telemetry Parameters */}
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Core Hydrological Parameters</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
                
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-tight">Reservoir Water Level</span>
                  <div className="mt-2">
                    <span className="text-xl md:text-2xl font-black text-blue-700 font-mono">
                    {log.water_level_m !== undefined && log.water_level_m !== null ? Number(log.water_level_m).toFixed(3) : '—'}
                    </span>
                    <span className="text-xs font-bold text-blue-500 ml-1">meters</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">
                    FRL: {siteObj?.full_reservoir_level || '—'} m | MWL: {siteObj?.max_water_level || '—'} m
                  </span>
                </div>

                <div className="bg-cyan-50/50 border border-cyan-100 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-extrabold text-cyan-500 uppercase tracking-tight">Reservoir Inflow</span>
                  <div className="mt-2">
                    <span className="text-xl md:text-2xl font-black text-cyan-700 font-mono">
                      {log.inflow_cusecs !== undefined && log.inflow_cusecs !== null ? Number(log.inflow_cusecs).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}
                    </span>
                    <span className="text-xs font-bold text-cyan-500 ml-1">cusecs</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Incoming Flow</span>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-tight">Reservoir Outflow</span>
                  <div className="mt-2">
                    <span className="text-xl md:text-2xl font-black text-indigo-700 font-mono">
                      {log.outflow_cusecs !== undefined && log.outflow_cusecs !== null ? Number(log.outflow_cusecs).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}
                    </span>
                    <span className="text-xs font-bold text-indigo-500 ml-1">cusecs</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Total Discharge</span>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-tight">Storage Quantity</span>
                  <div className="mt-2">
                    <span className="text-xl md:text-2xl font-black text-emerald-700 font-mono">
                      {log.storage_mcm !== undefined && log.storage_mcm !== null ? Number(log.storage_mcm).toFixed(3) : '—'}
                    </span>
                    <span className="text-xs font-bold text-emerald-500 ml-1">MCM</span>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">
                    {siteObj?.total_capacity_mcm ? `Cap: ${siteObj.total_capacity_mcm} MCM` : 'Reservoir Storage'}
                  </span>
                </div>

              </div>

              {/* Grid 3: Operational Status Parameters */}
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Environmental & Grid Parameters</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Rainfall Measurement</span>
                  <p className="text-sm font-bold text-slate-800 flex items-baseline gap-1 mt-0.5">
                    <Droplets className="text-blue-500 inline flex-shrink-0" size={13} />
                    <span className="font-mono text-base font-extrabold">{log.details?.rainfall_today_mm ?? '—'}</span>
                    <span className="text-[10px] text-slate-500">mm</span>
                  </p>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Power Generation</span>
                  <p className="text-sm font-bold text-slate-800 flex items-baseline gap-1 mt-0.5">
                    <Waves className="text-emerald-500 inline flex-shrink-0" size={13} />
                    <span className="font-mono text-base font-extrabold">{log.details?.power_generation_mw ?? '—'}</span>
                    <span className="text-[10px] text-slate-500">MW</span>
                  </p>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Weather Outlook</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <CloudSun className="text-amber-500 inline flex-shrink-0" size={14} />
                    <span>{log.weather_condition || 'Clear'}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Dam Structure Integrity</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <ShieldAlert className="text-slate-500 inline flex-shrink-0" size={14} />
                    <span>{log.details?.dam_condition || 'Good / Stable'}</span>
                  </p>
                </div>
              </div>

              {/* Section 4: Remarks / Operator Log */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Operator Log / Technical Remarks</span>
                <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-700 italic">
                  "{log.remarks || 'No technical remarks provided. Station operating normally.'}"
                </p>
              </div>

              {/* Section 5: Signature & Approvals for official printouts */}
              <div className="hidden print:block mt-16 border-t border-slate-300 pt-6">
                <div className="flex justify-between text-center text-xs">
                  <div>
                    <div className="w-40 border-b border-slate-300 mb-1 mx-auto" />
                    <p className="font-bold text-slate-700">{log.observer_name || 'Operator Signature'}</p>
                    <p className="text-[10px] text-slate-400">Submitting Hydrologist</p>
                  </div>
                  <div>
                    <div className="w-40 border-b border-slate-300 mb-1 mx-auto" />
                    <p className="font-bold text-slate-700">Verified By</p>
                    <p className="text-[10px] text-slate-400">BBMC Superintending Engineer</p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT SIDE PANEL: Mini GIS map & Station metadata */}
            <div className="p-4 lg:p-6 bg-slate-50 flex flex-col gap-5 print:hidden">
              
              {/* Mini Map Container */}
              <div>
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                  <MapPin size={14} className="text-blue-600" />
                  Station GIS Coordinates
                </h3>

                <div className="h-48 rounded-xl border border-slate-200 overflow-hidden shadow-inner relative bg-slate-200">
                  {hasCoordinates ? (
                    <MapContainer
                      key={activeId}
                      center={[siteLat!, siteLng!]}
                      zoom={9}
                      zoomControl={false}
                      attributionControl={false}
                      className="w-full h-full z-10"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[siteLat!, siteLng!]} icon={customMarkerIcon}>
                        <Popup>
                          <div className="text-xs p-1">
                            <p className="font-bold">{log.site_name}</p>
                            <p className="text-[10px] text-blue-600 font-mono">Level: {log.water_level_m}m</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                      <MapPin size={24} className="opacity-50" />
                      <p className="text-xs font-semibold">Station GPS mapping coordinates not configured</p>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-right">
                  <span className="text-[10px] font-mono text-slate-500 bg-white border px-2 py-0.5 rounded-md shadow-sm">
                    Lat: {siteLat?.toFixed(5) || '—'} · Lng: {siteLng?.toFixed(5) || '—'}
                  </span>
                </div>
              </div>

              {/* Station General Info Details */}
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-3">Station Characteristics</h4>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500 font-medium">District</span>
                    <span className="font-bold text-slate-800">{siteObj?.state || 'Himachal Pradesh'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500 font-medium">River Name</span>
                    <span className="font-bold text-slate-800">{siteObj?.river_tributary || 'Sutlej River'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-slate-500 font-medium">River Basin</span>
                    <span className="font-bold text-slate-800">{siteObj?.basin || 'Indus Basin'}</span>
                  </div>
                  <div className="flex justify-between pb-0.5">
                    <span className="text-slate-500 font-medium">Division</span>
                    <span className="font-bold text-slate-800">{siteObj?.division || 'BBMC Division'}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Status Message */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs">
                <h4 className="font-bold text-blue-800 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 size={14} className="text-blue-600" />
                  Hydrological Lock Status
                </h4>
                <p className="text-blue-700 leading-relaxed">
                  {log.is_verified 
                    ? 'This hydrological record has been finalized, audited, and locked. Editing is restricted for official regulatory compliance.'
                    : 'This log is marked as a working draft. Field operators can update or re-save this record before final submission.'
                  }
                </p>
              </div>

            </div>

          </div>
        )}

        {/* Mobile Sticky Footer */}
        <div className="hidden print:hidden lg:hidden border-t bg-white px-4 py-3 items-center justify-between z-10 sticky bottom-0 flex">
          <span className="text-xs font-semibold text-slate-500">ID: #{activeId}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 border rounded-xl text-slate-600 hover:bg-slate-50 flex items-center gap-1 text-xs font-bold"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ObservationViewerModal;

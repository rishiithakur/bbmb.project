import React, { useState, useEffect } from 'react';
import MapContainer from '../gis/MapContainer';
import { useQuery } from '@tanstack/react-query';
import { observationsApi } from '../api/observations.api';
import { Activity, Droplets, AlertTriangle, Clock, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';

const Dashboard: React.FC = () => {

  const { data: response } = useQuery({
    queryKey: ['recent-logs'],
    queryFn: () => observationsApi.getLogs({ limit: 5 }).then(res => res.data),
    refetchInterval: 60000,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => observationsApi.getStats().then(res => res.data),
    refetchInterval: 300000,
  });

  const [splitWidth, setSplitWidth] = useState<number>(() => {
    const saved = localStorage.getItem('admin_dashboard_split_width');
    return saved ? parseFloat(saved) : 75;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [resizeTrigger, setResizeTrigger] = useState(0);

  // Mobile Bottom Sheet Sliding States
  const [sheetState, setSheetState] = useState<'collapsed' | 'half' | 'expanded'>('collapsed');
  const [startY, setStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [windowHeight, setWindowHeight] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 800);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    const hintTimer = setTimeout(() => {
      setShowHint(false);
    }, 4500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(hintTimer);
    };
  }, []);

  const getSheetHeightInPixels = () => {
    switch (sheetState) {
      case 'collapsed': return windowHeight * 0.30; // 30vh - clean preview mode
      case 'half': return windowHeight * 0.55;      // 55vh
      case 'expanded': return windowHeight * 0.88;  // 88vh - keeps top map segment visible
    }
  };

  const getSheetHeight = () => {
    if (isDraggingSheet && startY !== null) {
      const baseHeight = getSheetHeightInPixels();
      const targetHeight = baseHeight - dragOffset;
      // bound strictly between 30vh and 88vh to prevent sheet disappearing under viewport
      return Math.min(Math.max(windowHeight * 0.30, targetHeight), windowHeight * 0.88);
    }
    return getSheetHeightInPixels();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDraggingSheet(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    const diff = e.touches[0].clientY - startY;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (startY === null) return;
    setIsDraggingSheet(false);
    
    const finalDragHeight = getSheetHeightInPixels() - dragOffset;
    const finalPct = (finalDragHeight / windowHeight) * 100;

    // Premium Snapping Points: 30%, 55%, 88%
    const distToCollapsed = Math.abs(finalPct - 30);
    const distToHalf = Math.abs(finalPct - 55);
    const distToExpanded = Math.abs(finalPct - 88);

    const minDist = Math.min(distToCollapsed, distToHalf, distToExpanded);

    if (minDist === distToCollapsed) {
      setSheetState('collapsed');
    } else if (minDist === distToHalf) {
      setSheetState('half');
    } else {
      setSheetState('expanded');
    }
    
    setStartY(null);
    setDragOffset(0);
  };

  const recentLogs = Array.isArray(response)
    ? response
    : (response && typeof response === 'object' && 'results' in response && Array.isArray(response.results))
      ? response.results as any[]
      : [];

  // Mouse drag listeners (desktop)
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('admin-split-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let pct = ((e.clientX - rect.left) / rect.width) * 100;
      if (pct < 30) pct = 30;
      if (pct > 90) pct = 100;
      setSplitWidth(pct);
      setResizeTrigger(p => p + 1);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem('admin_dashboard_split_width', splitWidth.toString());
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, splitWidth]);

  // Touch drag listeners (tablet)
  useEffect(() => {
    if (!isDragging) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const container = document.getElementById('admin-split-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let pct = ((touch.clientX - rect.left) / rect.width) * 100;
      if (pct < 30) pct = 30;
      if (pct > 90) pct = 100;
      setSplitWidth(pct);
      setResizeTrigger(p => p + 1);
    };
    const handleTouchEnd = () => {
      setIsDragging(false);
      localStorage.setItem('admin_dashboard_split_width', splitWidth.toString());
    };
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, splitWidth]);

  return (
    <div className="flex flex-col h-full bg-slate-50">

      {/* ── Stats Bar: 4-col on all viewports for a single horizontal row ── */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-4 p-2 sm:p-4 border-b bg-white shadow-sm flex-shrink-0">
        <StatCard icon={<Droplets className="text-blue-500" />} label="Total Dam Sites"   value={stats?.total_sites?.toString() || '--'}      subValue="Active Monitoring" />
        <StatCard icon={<Activity className="text-green-500" />} label="Last 24h Entries" value={stats?.last_24h_entries?.toString() || '--'}  subValue="Real-time sync" />
        <StatCard icon={<AlertTriangle className="text-amber-500" />} label="Active Alerts" value={stats?.red_alerts?.toString() || '--'}     subValue="Red/Danger Level" />
        <StatCard icon={<Clock className="text-slate-500" />} label="System Status"        value={stats?.system_status || 'Checking...'}       subValue="All sensors linked" />
      </div>

      {/* ── MOBILE: full screen map + draggable bottom sheet ── */}
      <div className="md:hidden relative flex-1 w-full h-full overflow-hidden bg-slate-100 select-none">
        <div className="absolute inset-0">
          <MapContainer resizeTrigger={resizeTrigger} />
        </div>
        
        {/* Google Maps-style Bottom Sheet */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.16)] border-t border-slate-150 z-[1000] flex flex-col will-change-[height] select-none`}
          style={{
            height: `${getSheetHeight()}px`,
            transition: isDraggingSheet ? 'none' : 'height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
          }}
        >
          {/* Swipe gesture indicator overlay */}
          {showHint && (
            <div className="absolute top-[-44px] left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1.5 animate-bounce select-none pointer-events-none transition-all z-[1100]">
              <span>Swipe up for more records</span>
            </div>
          )}

          {/* Header & Drag Handle (Touch area only active here to prevent scrolling collision) */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full flex flex-col items-center pt-3 pb-3.5 cursor-grab active:cursor-grabbing select-none border-b border-slate-100 bg-white rounded-t-3xl flex-shrink-0 touch-none shadow-sm"
          >
            {/* Grab Handle */}
            <div className="w-[60px] h-[6px] bg-slate-300 dark:bg-slate-400 rounded-full shadow-inner mb-3.5" />
            
            {/* Title / Action Bar */}
            <div className="w-full px-5 flex justify-between items-center relative">
              <h2 className="font-black text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Clock size={14} className="text-blue-600 animate-pulse" />
                Recent Observations
              </h2>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (sheetState === 'collapsed') setSheetState('half');
                  else if (sheetState === 'half') setSheetState('expanded');
                  else setSheetState('collapsed');
                }}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
              >
                {sheetState === 'expanded' ? (
                  <ChevronDown size={16} className="text-slate-700" />
                ) : (
                  <ChevronUp size={16} className="text-slate-700 animate-bounce" />
                )}
              </button>
            </div>
          </div>

          {/* Sheet List Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 select-text bg-slate-50/50">
            {recentLogs.map((log) => {
              const isExpanded = sheetState === 'expanded';
              return (
                <div 
                  key={log.observation_id} 
                  className={`p-3.5 bg-white border border-slate-100 rounded-2xl transition-all duration-200 shadow-sm ${
                    isExpanded ? 'ring-1 ring-blue-500/25 shadow-md border-blue-100 bg-gradient-to-br from-white to-blue-50/5' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Site and Water Level */}
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <span className="font-extrabold text-sm text-slate-900 block truncate">{log.site_name || `Site #${log.site}`}</span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {log.observation_date} at {log.observation_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        log.status === 'FINAL' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>{log.status}</span>
                      <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                        {Number(log.current_water_level || 0).toFixed(3)} m
                      </span>
                    </div>
                  </div>

                  {/* Expanded Telemetry parameters inside the card */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2.5 animate-fadeIn">
                      <div className="grid grid-cols-2 gap-2.5 text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block mb-0.5">Recorded By</span>
                          <span className="text-slate-800 font-bold">{log.operator_username || 'Field Operator'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5">Control Action</span>
                          <span className={`font-bold ${log.control_action ? 'text-blue-600' : 'text-slate-500'}`}>
                            {log.control_action || 'No Action'}
                          </span>
                        </div>
                        {log.spillway_status && (
                          <div className="col-span-2">
                            <span className="text-slate-400 block mb-0.5">Spillway Gate Status</span>
                            <span className="text-slate-800 font-bold">{log.spillway_status}</span>
                          </div>
                        )}
                        {log.remarks && (
                          <div className="col-span-2 mt-1">
                            <span className="text-slate-400 block mb-0.5">Observation Remarks</span>
                            <p className="text-slate-700 italic font-medium leading-relaxed">{log.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {recentLogs.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">No recent activity recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP: draggable split-panel ── */}
      <div
        id="admin-split-container"
        className="hidden md:flex flex-1 overflow-hidden relative"
        style={{ userSelect: isDragging ? 'none' : 'auto' }}
      >
        {/* Map panel */}
        <div
          style={{ width: `${splitWidth}%` }}
          className={`relative h-full transition-[width] duration-75 overflow-hidden ${splitWidth === 0 ? 'hidden' : ''}`}
        >
          {/* Preset split buttons */}
          <div className="absolute top-4 left-4 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200 shadow-md select-none">
            <span className="text-[10px] font-bold text-slate-500 px-1 uppercase tracking-wider">Map Focus</span>
            {[100, 80, 70, 50].map(pct => (
              <button
                key={pct}
                onClick={() => { setSplitWidth(pct); setResizeTrigger(p => p + 1); }}
                className={`px-1.5 py-1 text-[10px] font-bold rounded-md transition-all ${
                  Math.round(splitWidth) === pct ? 'bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                {pct === 100 ? '100%' : `${pct}:${100 - pct}`}
              </button>
            ))}
          </div>

          {splitWidth === 100 && (
            <button
              onClick={() => { setSplitWidth(75); setResizeTrigger(p => p + 1); }}
              className="absolute top-4 right-4 z-[1000] bg-slate-900 text-white px-4 py-2 rounded-lg font-bold border border-slate-700 shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-xs"
            >
              Show Recent Observations <ChevronLeft size={16} />
            </button>
          )}
          <MapContainer resizeTrigger={resizeTrigger} />
        </div>

        {/* Drag handle */}
        {splitWidth < 100 && (
          <div
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
            className={`w-1.5 hover:w-2 bg-slate-300 hover:bg-blue-500 cursor-col-resize transition-all duration-150 relative flex items-center justify-center z-30 select-none ${isDragging ? 'bg-blue-600 w-2 shadow-2xl' : ''}`}
          >
            <div className="absolute w-5 h-9 bg-slate-800 border border-slate-700 text-white rounded-md shadow-lg flex flex-col items-center justify-center gap-0.5 pointer-events-none">
              <span className="w-2.5 h-[2px] bg-slate-400 rounded-full" />
              <span className="w-2.5 h-[2px] bg-slate-400 rounded-full" />
              <span className="w-2.5 h-[2px] bg-slate-400 rounded-full" />
            </div>
          </div>
        )}

        {/* Observations side panel */}
        <div
          style={{ width: `${100 - splitWidth}%` }}
          className={`border-l bg-white overflow-y-auto flex flex-col transition-[width] duration-75 ${splitWidth === 100 ? 'hidden' : ''}`}
        >
          <div className="p-4 border-b bg-slate-50 sticky top-0 z-10">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Clock size={16} /> Recent Observations ({Math.round(100 - splitWidth)}%)
            </h2>
          </div>
          <div className="flex-1">
            {recentLogs.map((log) => (
              <div key={log.observation_id} className="p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-slate-900">{log.site_name || `Site #${log.site}`}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                    log.status === 'FINAL' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>{log.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">{log.observation_date}</span>
                    <span className="text-[10px] text-slate-400">{log.observation_time}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-blue-700">
                    {Number(log.current_water_level || 0).toFixed(3)} m
                  </span>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No recent activity recorded.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── StatCard — responsive sizes ──────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subValue }) => (
  <div className="flex items-center gap-1.5 sm:gap-4 p-1 sm:p-2 min-w-0">
    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 [&_svg]:w-4 [&_svg]:h-4 sm:[&_svg]:w-6 sm:[&_svg]:h-6">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] sm:text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider truncate leading-tight">{label}</p>
      <div className="flex items-baseline gap-1 sm:gap-2 mt-0.5 sm:mt-1">
        <span className="text-xs sm:text-xl font-extrabold text-slate-900 leading-none truncate">{value}</span>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">{subValue}</span>
      </div>
    </div>
  </div>
);

export default Dashboard;

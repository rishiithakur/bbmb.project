import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { observationsApi, type ExportFilters } from '../api/observations.api';
import { sitesApi } from '../api/sites.api';
import {
  ClipboardList, Download, Filter, Search,
  AlertCircle, CheckCircle2, Loader2, ChevronDown, XCircle
} from 'lucide-react';
import ObservationViewerModal from '../components/ObservationViewerModal';

const ALERT_COLORS: Record<string, string> = {
  Green:  'bg-green-400', Yellow: 'bg-yellow-400',
  Orange: 'bg-orange-400', Red: 'bg-red-500', Grey: 'bg-slate-400',
};

const STATUS_CLASSES: Record<string, string> = {
  FINAL: 'bg-blue-100 text-blue-700',
  DRAFT: 'bg-amber-100 text-amber-700',
};

// ── Component ─────────────────────────────────────────────────────────────────

const AdminObservationMonitor: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const siteParam = searchParams.get('site');

  const [filters, setFilters] = useState<ExportFilters & { search?: string }>({});
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [selectedObservationId, setSelectedObservationId] = useState<number | null>(null);

  // Initialize filter from query param if present
  useEffect(() => {
    if (siteParam) {
      setFilters(p => ({ ...p, site: siteParam as any }));
      setShowFilters(true);
    }
  }, [siteParam]);

  // Fetch sites for the selector dropdown
  const { data: sitesResponse } = useQuery({
    queryKey: ['sites'],
    queryFn: () => sitesApi.getSites().then(r => r.data),
  });

  const sites = Array.isArray(sitesResponse)
    ? sitesResponse
    : (sitesResponse as any)?.results ?? [];

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['admin-observations', filters],
    queryFn: () => observationsApi.getLogs(filters as any).then(r => r.data),
    refetchInterval: 60000,
  });

  const allLogs: any[] = Array.isArray(response)
    ? response
    : (response as any)?.results ?? [];

  // Client-side search on site name / operator name
  const logs = filters.search
    ? allLogs.filter(l =>
        (l.site_name || '').toLowerCase().includes(filters.search!.toLowerCase()) ||
        (l.observer_name || '').toLowerCase().includes(filters.search!.toLowerCase())
      )
    : allLogs;

  // ── Excel export ──────────────────────────────────────────────────────────

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      setExportMsg(null);
      const response = await observationsApi.exportExcel(filters);
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dam_observations_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      setExportMsg({ type: 'ok', text: 'Excel report downloaded successfully.' });
    } catch (err: any) {
      console.error(err);
      setExportMsg({
        type: 'err',
        text: err?.response?.data?.error || 'Excel export service failed (HTTP 500).'
      });
    } finally {
      setExporting(false);
    }
  };

  // ── Verify verification ──────────────────────────────────────────────────

  const handleVerify = async (id: number) => {
    try {
      setVerifyingId(id);
      await observationsApi.verifyLog(id);
      // Invalidate both lists & detail queries to force UI update
      queryClient.invalidateQueries({ queryKey: ['admin-observations'] });
      queryClient.invalidateQueries({ queryKey: ['observation-detail', id] });
    } catch (err) {
      console.error('Failed to verify record:', err);
      alert('Verification transaction failed. Try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  const setFilter = (key: keyof ExportFilters | 'search', val: any) => {
    setFilters(prev => {
      const next = { ...prev, [key]: val };
      if (!val) delete next[key];
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({});
    if (siteParam) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('site');
      setSearchParams(newParams);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="text-blue-600" size={24} />
            Telemetry Verification Center
          </h1>
          <p className="text-slate-500 text-sm">
            Review, verify, and export official operator log entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
              showFilters ? 'bg-slate-100 text-slate-700' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={16} />
            Filters
            {Object.keys(filters).filter(k => k !== 'search').length > 0 && (
              <span className="bg-blue-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {Object.keys(filters).filter(k => k !== 'search').length}
              </span>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-60"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export Excel
          </button>
        </div>
      </div>

      {/* Export feedback messages */}
      {exportMsg && (
        <div className={`p-4 rounded-xl border mb-6 text-sm flex items-center gap-2 animate-fade-in ${
          exportMsg.type === 'ok' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {exportMsg.type === 'ok' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{exportMsg.text}</span>
          <button onClick={() => setExportMsg(null)} className="ml-auto text-xs font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Search and filter drawer */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            className="w-full text-sm border rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Quick search by site name or submitting operator..."
            title="Search observations by site name or operator"
            aria-label="Search observations"
            value={filters.search || ''}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 animate-slide-down">
            <div>
              <label htmlFor="dam-station-select" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Dam Station</label>
              <div className="relative">
                <select
                  id="dam-station-select"
                  title="Select Dam Station Filter"
                  className="w-full text-sm border rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white pr-8"
                  value={filters.site || ''}
                  onChange={e => setFilter('site', e.target.value)}
                >
                  <option value="">All Stations</option>
                  {sites.map((s: any) => (
                    <option key={s.site_id} value={s.site_id}>{s.station_name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="alert-level-select" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Alert Threshold</label>
              <select
                id="alert-level-select"
                title="Select Alert Threshold Filter"
                className="w-full text-sm border rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={filters.alert_level || ''} onChange={e => setFilter('alert_level', e.target.value)}>
                <option value="">All</option>
                <option>Green</option><option>Yellow</option>
                <option>Orange</option><option>Red</option>
              </select>
            </div>
            <div>
              <label htmlFor="date-from-input" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Date From</label>
              <input
                id="date-from-input"
                type="date"
                title="Observation date starting from"
                className="w-full text-sm border rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={filters.date_from || ''} onChange={e => setFilter('date_from', e.target.value)} />
            </div>
            <div>
              <label htmlFor="date-to-input" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Date To</label>
              <input
                id="date-to-input"
                type="date"
                title="Observation date ending at"
                className="w-full text-sm border rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={filters.date_to || ''} onChange={e => setFilter('date_to', e.target.value)} />
            </div>
            {Object.keys(filters).length > 0 && (
              <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                <button onClick={clearFilters} className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline">
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <SummaryChip label="Total" value={logs.length} color="slate" />
        <SummaryChip label="Submitted" value={logs.filter(l => l.is_verified).length} color="blue" />
        <SummaryChip label="Drafts" value={logs.filter(l => !l.is_verified).length} color="amber" />
        <SummaryChip label="Red Alert" value={logs.filter(l => l.details?.alert_level === 'Red').length} color="red" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" /> Loading observations...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 p-6 bg-red-50 m-4 rounded-xl border border-red-200">
            <AlertCircle size={16} />
            Failed to load observations. Check backend connectivity.
          </div>
        )}

        {!isLoading && !error && logs.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm">
            No observations found matching the current filters.
          </div>
        )}

        {/* ── MOBILE: card list ── */}
        {!isLoading && logs.length > 0 && (
          <div className="divide-y sm:hidden">
            {logs.map(log => (
              <MobileCard
                key={log.log_id}
                log={log}
                onVerify={handleVerify}
                verifying={verifyingId === log.log_id}
                onViewDetails={(id) => setSelectedObservationId(id)}
              />
            ))}
          </div>
        )}

        {/* ── DESKTOP: full table ── */}
        {!isLoading && logs.length > 0 && (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 text-left font-bold">Date</th>
                  <th className="px-4 py-3 text-left font-bold">Site</th>
                  <th className="px-4 py-3 text-left font-bold">Operator</th>
                  <th className="px-4 py-3 text-right font-bold">Water Level</th>
                  <th className="px-4 py-3 text-right font-bold">Inflow</th>
                  <th className="px-4 py-3 text-right font-bold">Outflow</th>
                  <th className="px-4 py-3 text-center font-bold">Alert</th>
                  <th className="px-4 py-3 text-center font-bold">Status</th>
                  <th className="px-4 py-3 text-left font-bold">Remarks</th>
                  <th className="px-4 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => (
                  <DesktopRow
                    key={log.log_id}
                    log={log}
                    onVerify={handleVerify}
                    verifying={verifyingId === log.log_id}
                    onViewDetails={(id) => setSelectedObservationId(id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && logs.length > 0 && (
          <div className="px-4 py-2.5 border-t bg-slate-50 text-[10px] text-slate-400 text-center">
            {logs.length} records · Auto-refreshes every 60s · Use Export Excel to download
          </div>
        )}
      </div>

      {selectedObservationId && (
        <ObservationViewerModal
          observationId={selectedObservationId}
          siblingIds={logs.map((log: any) => log.log_id)}
          onClose={() => setSelectedObservationId(null)}
        />
      )}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SummaryChip: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-${color}-50 border border-${color}-100`}>
    <span className={`text-[10px] font-bold text-${color}-500 uppercase`}>{label}</span>
    <span className={`font-black text-${color}-800 text-sm`}>{value}</span>
  </div>
);

const MobileCard: React.FC<{
  log: any;
  onVerify: (id: number) => void;
  verifying: boolean;
  onViewDetails: (id: number) => void;
}> = ({ log, onVerify, verifying, onViewDetails }) => {
  const statusKey = log.is_verified ? 'FINAL' : 'DRAFT';
  const alertLevel = log.details?.alert_level || '';
  return (
    <div className="p-3 hover:bg-slate-50">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <p className="text-sm font-bold text-slate-900">{log.site_name || `Site #${log.site}`}</p>
          <p className="text-[10px] text-slate-400">{log.observation_date} · {log.observer_name || 'Unknown'}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${STATUS_CLASSES[statusKey]}`}>
          {statusKey === 'FINAL' ? 'Submitted' : 'Draft'}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
          {alertLevel && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${ALERT_COLORS[alertLevel] || 'bg-slate-300'}`} />
              <span className="text-[10px] text-slate-500">{alertLevel}</span>
            </div>
          )}
          <span className="text-xs font-mono font-bold text-blue-700">
            {log.water_level_m ? `${parseFloat(log.water_level_m).toFixed(3)} m` : '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(log.log_id)}
            className="inline-flex items-center px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition-all"
          >
            Details
          </button>
          {!log.is_verified ? (
            <button
              onClick={() => onVerify(log.log_id)}
              disabled={verifying}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all"
            >
              {verifying ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
              Verify
            </button>
          ) : (
            <span className="text-[9px] font-bold text-green-600 uppercase flex items-center gap-0.5">
              <CheckCircle2 size={10} className="text-green-500" />
              Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const DesktopRow: React.FC<{
  log: any;
  onVerify: (id: number) => void;
  verifying: boolean;
  onViewDetails: (id: number) => void;
}> = ({ log, onVerify, verifying, onViewDetails }) => {
  const statusKey = log.is_verified ? 'FINAL' : 'DRAFT';
  const alertLevel = log.details?.alert_level || '';
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">{log.observation_date}</td>
      <td className="px-4 py-3 text-xs font-medium text-slate-900 max-w-[160px] truncate">
        {log.site_name || `Site #${log.site}`}
      </td>
      <td className="px-4 py-3 text-xs text-slate-600">{log.observer_name || '—'}</td>
      <td className="px-4 py-3 text-right font-mono font-bold text-blue-700 text-xs">
        {log.water_level_m ? `${parseFloat(log.water_level_m).toFixed(3)} m` : '—'}
      </td>
      <td className="px-4 py-3 text-right text-xs text-slate-600">
        {log.inflow_cusecs ?? '—'}
      </td>
      <td className="px-4 py-3 text-right text-xs text-slate-600">
        {log.outflow_cusecs ?? '—'}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <div className={`w-2 h-2 rounded-full ${ALERT_COLORS[alertLevel] || 'bg-slate-300'}`} />
          <span className="text-[10px] text-slate-600">{alertLevel || '—'}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_CLASSES[statusKey]}`}>
          {statusKey === 'FINAL' ? 'Submitted' : 'Draft'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
        {log.remarks || '—'}
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onViewDetails(log.log_id)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-all"
          >
            Details
          </button>
          {!log.is_verified ? (
            <button
              onClick={() => onVerify(log.log_id)}
              disabled={verifying}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all disabled:opacity-60"
            >
              {verifying ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              Verify
            </button>
          ) : (
            <span className="text-xs font-bold text-green-600 uppercase flex items-center justify-end gap-1">
              <CheckCircle2 size={14} className="text-green-500" />
              Verified
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};

export default AdminObservationMonitor;

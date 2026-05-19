import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { observationsApi } from '../../api/observations.api';
import {
  Clock, AlertCircle, Edit2, Eye,
  Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import ObservationViewerModal from '../../components/ObservationViewerModal';

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT:    { label: 'Draft',     className: 'bg-amber-100 text-amber-700 border border-amber-200' },
  FINAL:    { label: 'Submitted', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  APPROVED: { label: 'Approved',  className: 'bg-green-100 text-green-700 border border-green-200' },
  REJECTED: { label: 'Rejected',  className: 'bg-red-100 text-red-700 border border-red-200' },
};

const ALERT_COLORS: Record<string, string> = {
  Green:  'bg-green-400',
  Yellow: 'bg-yellow-400',
  Orange: 'bg-orange-400',
  Red:    'bg-red-500',
  Grey:   'bg-slate-400',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface SubmissionHistoryProps {
  onEditDraft?: (logId: number, data: any) => void;
  compact?: boolean;
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({ onEditDraft, compact }) => {
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedObservationId, setSelectedObservationId] = useState<number | null>(null);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => observationsApi.getMySubmissions().then(r => r.data),
    refetchInterval: 60000,
  });

  const logs: any[] = Array.isArray(response)
    ? response
    : (response as any)?.results ?? [];

  const sorted = [...logs].sort((a, b) => {
    const da = new Date(a.observation_datetime || a.observation_date).getTime();
    const db = new Date(b.observation_datetime || b.observation_date).getTime();
    return sortAsc ? da - db : db - da;
  });

  // ── Render states ──────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
      <Loader2 size={18} className="animate-spin" /> Loading submission history...
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 text-red-600 py-6 px-4 bg-red-50 rounded-xl border border-red-200">
      <AlertCircle size={16} /> Failed to load submission history. Check your connection.
    </div>
  );

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Clock size={13} className="text-blue-500" />
            Submission Log
            <span className="text-[10px] font-normal text-slate-400">({logs.length})</span>
          </h3>
          <button
            onClick={() => setSortAsc(p => !p)}
            className="text-[10px] text-slate-500 hover:text-blue-600 font-medium"
          >
            {sortAsc ? 'Oldest' : 'Newest'}
          </button>
        </div>

        {logs.length === 0 && (
          <div className="py-8 text-center text-slate-400 text-xs">
            No entries recorded yet.
          </div>
        )}

        <div className="divide-y overflow-y-auto max-h-[300px] sm:max-h-[360px] flex-1">
          {sorted.map(log => {
            const statusKey = log.status || (log.is_verified ? 'FINAL' : 'DRAFT');
            const statusObj = STATUS_CONFIG[statusKey] || STATUS_CONFIG['DRAFT'];
            const alertLevel = log.details?.alert_level || 'Grey';
            const alertColor = ALERT_COLORS[alertLevel] || 'bg-slate-400';
            return (
              <div key={log.log_id} className="p-2.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-1.5 mb-1">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {log.observation_date}
                      {log.observation_time ? ` · ${log.observation_time.slice(0, 5)}` : ''}
                    </p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${statusObj.className}`}>
                    {statusObj.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${alertColor}`} />
                    <span className="text-xs font-mono font-bold text-blue-700">
                      {log.water_level_m ? `${parseFloat(log.water_level_m).toFixed(3)} m` : '—'}
                    </span>
                  </div>
                  {log.is_verified ? (
                    <button
                      onClick={() => setSelectedObservationId(log.log_id)}
                      className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors hover:underline"
                    >
                      <Eye size={9} /> View
                    </button>
                  ) : (
                    onEditDraft && (
                      <button
                        onClick={() => onEditDraft(log.log_id, log)}
                        className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors hover:underline"
                      >
                        <Edit2 size={9} /> Edit
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedObservationId && (
          <ObservationViewerModal
            observationId={selectedObservationId}
            siblingIds={sorted.map(log => log.log_id)}
            onClose={() => setSelectedObservationId(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Clock size={15} className="text-blue-500" />
          My Submission History
          <span className="ml-1 text-xs font-normal text-slate-400">({logs.length} records)</span>
        </h3>
        <button
          onClick={() => setSortAsc(p => !p)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
        >
          {sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {sortAsc ? 'Oldest first' : 'Newest first'}
        </button>
      </div>

      {logs.length === 0 && (
        <div className="py-12 text-center text-slate-400 text-sm">
          No observations submitted yet. Use the form above to record your first entry.
        </div>
      )}

      {/* ── MOBILE: card list ── */}
      <div className="divide-y sm:hidden">
        {sorted.map(log => (
          <MobileRow 
            key={log.log_id} 
            log={log} 
            onEditDraft={onEditDraft}
            onViewDetail={(id) => setSelectedObservationId(id)}
          />
        ))}
      </div>

      {/* ── DESKTOP: table ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2.5 text-left font-bold">Date & Time</th>
              <th className="px-4 py-2.5 text-left font-bold">Site</th>
              <th className="px-4 py-2.5 text-right font-bold">Water Level</th>
              <th className="px-4 py-2.5 text-center font-bold">Alert</th>
              <th className="px-4 py-2.5 text-center font-bold">Status</th>
              <th className="px-4 py-2.5 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map(log => (
              <DesktopRow 
                key={log.log_id} 
                log={log} 
                onEditDraft={onEditDraft}
                expanded={expandedId === log.log_id}
                onToggle={() => setExpandedId(p => p === log.log_id ? null : log.log_id)}
                onViewDetail={(id) => setSelectedObservationId(id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t bg-slate-50 text-[10px] text-slate-400 text-center">
        Auto-refreshes every 60 seconds · Draft records can be reopened and edited
      </div>

      {selectedObservationId && (
        <ObservationViewerModal
          observationId={selectedObservationId}
          siblingIds={sorted.map(log => log.log_id)}
          onClose={() => setSelectedObservationId(null)}
        />
      )}
    </div>
  );
};

// ── Mobile card row ─────────────────────────────────────────────────────────

const MobileRow: React.FC<{ 
  log: any; 
  onEditDraft?: (id: number, data: any) => void;
  onViewDetail: (id: number) => void;
}> = ({ log, onEditDraft, onViewDetail }) => {
  const statusKey = log.status || (log.is_verified ? 'FINAL' : 'DRAFT');
  const { label, className } = STATUS_CONFIG[statusKey] || STATUS_CONFIG['DRAFT'];
  const alertLevel = log.details?.alert_level || '—';
  const alertColor = ALERT_COLORS[alertLevel] || 'bg-slate-300';
  const isDraft = !log.is_verified;

  return (
    <div className="p-3 hover:bg-slate-50">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div>
          <p className="text-sm font-bold text-slate-900">{log.site_name || `Site #${log.site}`}</p>
          <p className="text-[10px] text-slate-400">
            {log.observation_date}
            {log.observation_time ? ` · ${log.observation_time.slice(0, 5)}` : ''}
          </p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${className}`}>{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${alertColor}`} />
          <span className="text-xs font-mono font-bold text-blue-700">
            {log.water_level_m ? `${parseFloat(log.water_level_m).toFixed(3)} m` : '—'}
          </span>
        </div>
        {isDraft ? (
          onEditDraft && (
            <button
              onClick={() => onEditDraft(log.log_id, log)}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Edit2 size={10} /> Edit Draft
            </button>
          )
        ) : (
          <button
            onClick={() => onViewDetail(log.log_id)}
            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Eye size={10} /> View Detail
          </button>
        )}
      </div>
    </div>
  );
};

// ── Desktop table row ────────────────────────────────────────────────────────

const DesktopRow: React.FC<{
  log: any;
  onEditDraft?: (id: number, data: any) => void;
  expanded: boolean;
  onToggle: () => void;
  onViewDetail: (id: number) => void;
}> = ({ log, onEditDraft, expanded, onToggle, onViewDetail }) => {
  const statusKey = log.status || (log.is_verified ? 'FINAL' : 'DRAFT');
  const { label, className } = STATUS_CONFIG[statusKey] || STATUS_CONFIG['DRAFT'];
  const alertLevel = log.details?.alert_level || '—';
  const alertColor = ALERT_COLORS[alertLevel] || 'bg-slate-300';
  const isDraft = !log.is_verified;

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3">
          <p className="text-xs font-medium text-slate-800">{log.observation_date}</p>
          <p className="text-[10px] text-slate-400">{(log.observation_time || '').slice(0, 5)}</p>
        </td>
        <td className="px-4 py-3 text-xs text-slate-700 font-medium">
          {log.site_name || `Site #${log.site}`}
        </td>
        <td className="px-4 py-3 text-right font-mono font-bold text-blue-700 text-xs">
          {log.water_level_m ? `${parseFloat(log.water_level_m).toFixed(3)} m` : '—'}
        </td>
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${alertColor}`} />
            <span className="text-[10px] text-slate-600">{alertLevel}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${className}`}>{label}</span>
        </td>
        <td className="px-4 py-3 text-right">
          {isDraft && onEditDraft ? (
            <button
              onClick={(e) => { e.stopPropagation(); onEditDraft(log.log_id, log); }}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors ml-auto"
            >
              <Edit2 size={10} /> Edit
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetail(log.log_id); }}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors ml-auto inline-flex"
            >
              <Eye size={10} /> View
            </button>
          )}
        </td>
      </tr>
      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-blue-50">
          <td colSpan={6} className="px-4 py-3">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-xs">
              <DetailCell label="Inflow"        value={log.inflow_cusecs}       suffix="cusecs" />
              <DetailCell label="Outflow"       value={log.outflow_cusecs}      suffix="cusecs" />
              <DetailCell label="Storage"       value={log.storage_mcm}         suffix="MCM" />
              <DetailCell label="Rainfall"      value={log.details?.rainfall_today_mm} suffix="mm" />
              <DetailCell label="Power Gen"     value={log.details?.power_generation_mw} suffix="MW" />
              <DetailCell label="Dam Condition" value={log.details?.dam_condition} />
              {log.remarks && (
                <div className="col-span-3 sm:col-span-6 text-slate-600 italic text-[10px]">
                  Remarks: {log.remarks}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const DetailCell: React.FC<{ label: string; value: any; suffix?: string }> = ({ label, value, suffix }) => (
  <div>
    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{label}</p>
    <p className="font-mono font-bold text-slate-700 text-xs">
      {value !== null && value !== undefined ? `${value}${suffix ? ' ' + suffix : ''}` : '—'}
    </p>
  </div>
);

export default SubmissionHistory;

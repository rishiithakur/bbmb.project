import React, { useState } from 'react';
import { Search, Activity, User, Calendar, Info, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit.api';
import { Loader2 } from 'lucide-react';

// ── Action badge colour mapping ─────────────────────────────────────────────

function getActionColor(eventType: string = '') {
  const e = eventType.toUpperCase();
  if (e.includes('LOGIN'))    return 'bg-blue-100 text-blue-700';
  if (e.includes('DELETE'))   return 'bg-red-100 text-red-700';
  if (e.includes('CREATE') || e.includes('INSERT')) return 'bg-green-100 text-green-700';
  if (e.includes('UPDATE') || e.includes('EDIT'))   return 'bg-amber-100 text-amber-700';
  if (e.includes('LOGOUT'))   return 'bg-slate-100 text-slate-600';
  return 'bg-purple-100 text-purple-700';
}

// ── Component ─────────────────────────────────────────────────────────────────

const AuditLogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.getLogs().then(res => res.data),
    refetchInterval: 30000,
    retry: 2,
  });

  const allLogs: any[] = Array.isArray(response)
    ? response
    : (response && typeof response === 'object' && 'results' in response && Array.isArray((response as any).results))
      ? (response as any).results
      : [];

  const logs = allLogs.filter(log =>
    !searchTerm ||
    (log.event_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    const err = error as any;
    const status = err?.response?.status;
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <PageHeader />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <div>
            <p className="font-bold text-red-800 text-lg">Audit Log Unavailable</p>
            <p className="text-red-600 text-sm mt-1">
              {status === 403
                ? 'You do not have permission to view audit logs. Only Admin, Supreme Admin, and Ultra Admin can access this page.'
                : status === 404
                  ? 'The audit API endpoint was not found. Check backend routing.'
                  : `Server returned error ${status || '(network)'}. Check backend logs.`
              }
            </p>
            <code className="block mt-3 text-xs bg-red-100 text-red-700 px-3 py-2 rounded-lg">
              {err?.message || 'Unknown error'}
            </code>
          </div>
        </div>
      </div>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto">
      <PageHeader />

      {/* Search bar */}
      <div className="bg-white rounded-xl border shadow-sm mb-4 p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Filter by action, user or description..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 px-1 whitespace-nowrap">
          {isLoading ? (
            <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Loading...</span>
          ) : (
            <span><b className="text-slate-900">{logs.length}</b> of {allLogs.length} entries</span>
          )}
        </div>
      </div>

      {/* Log entries */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm font-medium">Fetching audit records from database...</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Info size={32} />
            <p className="text-sm font-medium">
              {searchTerm ? 'No entries match your search.' : 'No audit entries found in the database.'}
            </p>
          </div>
        )}

        {/* ── MOBILE: compact card list ── */}
        {!isLoading && logs.length > 0 && (
          <div className="divide-y sm:hidden">
            {logs.map((log) => (
              <div key={log.audit_id} className="p-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-2.5">
                  {/* Action badge */}
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${getActionColor(log.event_type)}`}>
                    {(log.event_type || 'ACTION').replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{log.description || log.event_type}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <User size={9} /> {log.username || 'System'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={9} />
                        {log.timestamp
                          ? format(new Date(log.timestamp), 'dd MMM yy, HH:mm')
                          : '—'}
                      </span>
                      {log.ip_address && (
                        <span className="font-mono">{log.ip_address}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DESKTOP: full log timeline ── */}
        {!isLoading && logs.length > 0 && (
          <div className="hidden sm:block divide-y">
            {logs.map((log) => (
              <div key={log.audit_id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                {/* Icon circle */}
                <div className="mt-0.5 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border flex-shrink-0">
                  <Info size={16} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getActionColor(log.event_type)}`}>
                        {(log.event_type || 'ACTION').replace(/_/g, ' ')}
                      </span>
                      {log.status && log.status !== 'success' && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase">
                          {log.status}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <Calendar size={11} />
                      {log.timestamp
                        ? format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm:ss')
                        : '—'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{log.description}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <User size={10} />
                      <span className="text-blue-600">{log.username || 'System'}</span>
                      {log.user_role && log.user_role !== 'System' && (
                        <span className="text-slate-300">· {log.user_role}</span>
                      )}
                    </div>
                    {log.ip_address && (
                      <span className="text-[10px] font-mono text-slate-400">IP: {log.ip_address}</span>
                    )}
                    {log.device_type && (
                      <span className="text-[10px] text-slate-400 capitalize">{log.device_type}</span>
                    )}
                    {log.table_name && (
                      <span className="text-[10px] text-slate-400">Table: {log.table_name}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {!isLoading && allLogs.length > 0 && (
          <div className="p-3 sm:p-4 bg-slate-50 border-t text-center">
            <p className="text-xs text-slate-400">
              Showing {logs.length} of {allLogs.length} audit entries · Auto-refreshes every 30s
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Shared page header ───────────────────────────────────────────────────────

const PageHeader: React.FC = () => (
  <div className="mb-4 sm:mb-6">
    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
      <Activity className="text-blue-600" size={22} />
      System Audit Logs
    </h1>
    <p className="text-slate-500 text-sm mt-0.5">
      Track all administrative and field activities for accountability and compliance.
    </p>
  </div>
);

export default AuditLogPage;

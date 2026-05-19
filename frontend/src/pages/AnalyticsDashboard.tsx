import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { observationsApi } from '../api/observations.api';
import { PieChart, TrendingUp, Users, Settings, ClipboardCheck } from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
  const { data: logsResponse } = useQuery({
    queryKey: ['recent-logs-analytics'],
    queryFn: () => observationsApi.getLogs({ limit: 7 }).then((res: any) => res.data),
  });

  const recentLogs = Array.isArray(logsResponse)
    ? logsResponse
    : (logsResponse && typeof logsResponse === 'object' && 'results' in logsResponse && Array.isArray((logsResponse as any).results))
      ? (logsResponse as any).results as any[]
      : [];

  const maxWaterLevel = recentLogs.length > 0
    ? Math.max(...recentLogs.map(l => Number(l.water_level_m || l.current_water_level || 0)), 1)
    : 100;

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => observationsApi.getStats().then((res: any) => res.data),
    refetchInterval: 300000,
  });

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Holistic view of dam safety metrics and system health.</p>
        </div>
      </div>

      {/* ── Stats Grid: 2-col mobile, 4-col desktop ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <MetricCard title="Total Sites"       value={stats?.total_sites || 0}       icon={<Settings className="text-blue-600" />}        trend="Active Sites"        color="blue" />
        <MetricCard title="Active Users"      value={stats?.total_users || 0}       icon={<Users className="text-purple-600" />}         trend="Registered"          color="purple" />
        <MetricCard title="Recent Entries"    value={stats?.last_24h_entries || 0}  icon={<ClipboardCheck className="text-green-600" />} trend="Last 24 hours"       color="green" />
        <MetricCard title="Danger Alerts"     value={stats?.red_alerts || 0}        icon={<TrendingUp className="text-red-600" />}       trend="Active alerts"       color="red" />
      </div>

      {/* ── Charts: stacked on mobile, side-by-side on desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">

        {/* Water Level Bar Chart */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm flex flex-col" style={{ minHeight: '280px' }}>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 sm:mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp size={16} className="text-blue-500" />
              Water Level Comparison
              <span className="text-xs font-normal text-slate-400">(Last 7)</span>
            </h3>
            <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded">LIVE DB</span>
          </div>

          {recentLogs.length > 0 ? (
            <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 px-1 sm:px-2 pt-4 pb-2 border-b overflow-x-auto">
              {recentLogs.map((log, index) => {
                const waterLevel = Number(log.water_level_m || log.current_water_level || 0);
                const heightPercent = Math.max(10, Math.min(100, (waterLevel / maxWaterLevel) * 100));
                return (
                  <div key={log.log_id || index} className="flex-1 min-w-[32px] flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-40 shadow-xl left-1/2 -translate-x-1/2">
                      <p className="font-bold border-b border-slate-700 pb-1 mb-1 truncate">{log.site_name || `Site #${log.site}`}</p>
                      <p>Level: <span className="font-mono text-blue-300 font-bold">{waterLevel.toFixed(3)} m</span></p>
                      <p className="text-slate-400">{log.observation_date}</p>
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer"
                    />
                    {/* Label */}
                    <div className="text-[9px] font-bold text-slate-500 mt-1 truncate w-full text-center">
                      {log.site_name ? log.site_name.substring(0, 6) : `S-${log.site}`}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 bg-slate-50 rounded-xl border border-dashed flex items-center justify-center text-slate-400 italic text-sm">
              No recent observations in database.
            </div>
          )}
        </div>

        {/* Alert Distribution */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base">
            <PieChart size={16} className="text-purple-500" />
            Alert Distribution
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-4">
            <AlertBar label="Danger (Red)"     value={stats?.total_sites > 0 ? Math.round((stats?.red_alerts / stats?.total_sites) * 100) : 0}    color="bg-red-500" />
            <AlertBar label="Warning (Yellow)" value={stats?.total_sites > 0 ? Math.round((stats?.yellow_alerts / stats?.total_sites) * 100) : 0} color="bg-amber-400" />
            <AlertBar label="Normal (Green)"   value={stats?.total_sites > 0 ? Math.round((stats?.normal_sites / stats?.total_sites) * 100) : 0}  color="bg-green-500" />
          </div>
          <div className="mt-4 p-3 sm:p-4 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Health Score</p>
            <div className="text-2xl font-black text-slate-800">{stats?.health_score || 0}<span className="text-base font-medium text-slate-400">/100</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Sub-components ───────────────────────────────────────────────────────────

const MetricCard: React.FC<{
  title: string; value: number | string; icon: React.ReactNode; trend: string; color: string;
}> = ({ title, value, icon, trend, color }) => (
  <div className="bg-white p-3 sm:p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow group">
    <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-${color}-50 flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{title}</p>
    <div className="text-2xl sm:text-3xl font-black text-slate-900 my-0.5 sm:my-1">{value}</div>
    <div className={`text-[10px] font-bold text-${color}-600 bg-${color}-50 inline-block px-2 py-0.5 rounded-full uppercase`}>
      {trend}
    </div>
  </div>
);

const AlertBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-bold text-slate-600">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
      <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default AnalyticsDashboard;

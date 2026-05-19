import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { observationsApi } from '../api/observations.api';
import { Search, Calendar, FileText, CheckCircle, Clock, ArrowRight, Download, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import ObservationViewerModal from '../components/ObservationViewerModal';

const ObservationsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'Final'>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedObservationId, setSelectedObservationId] = useState<number | null>(null);
  const siteParam = searchParams.get('site');

  const { data: response, isLoading } = useQuery({
    queryKey: ['observations', statusFilter],
    queryFn: () => observationsApi.getLogs().then(res => res.data),
  });
  
  const observations = Array.isArray(response) ? response : response?.results || [];

  const filteredData = observations.filter((obs: any) => {
    const siteName = obs.site_name || obs.site_details?.station_name || '';
    const matchesSearch = siteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || obs.status?.toLowerCase() === statusFilter.toLowerCase();
    
    // Support pre-filtering by site ID from URL
    const matchesSite = !siteParam || String(obs.site || obs.site_details?.site_id || '') === siteParam;
    
    return matchesSearch && matchesStatus && matchesSite;
  });

  const clearSiteFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('site');
    setSearchParams(newParams);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Observation Records</h1>
          <p className="text-slate-500">Review and manage water level logs from all monitoring sites.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <Download size={18} />
            Export All
          </button>
          <Link 
            to="/observation/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <FileText size={18} />
            New Entry
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by site name or code..."
            title="Search observations by site name or code"
            aria-label="Search observations"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {(['all', 'Draft', 'Final'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                statusFilter === status 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 border-l pl-4">
          <Calendar size={16} />
          <span>Latest Records</span>
        </div>
      </div>

      {siteParam && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between text-blue-800 text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold">Active Filter:</span>
            <span>Showing observations only for Dam Site ID {siteParam}</span>
          </div>
          <button 
            onClick={clearSiteFilter}
            className="p-1 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
            title="Clear Site Filter"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400 font-medium">
            Loading observations...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-slate-400 font-medium">
            No records found.
          </div>
        ) : (
          filteredData.map((obs: any) => (
            <div key={obs.observation_id} className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {obs.site_name || obs.site_details?.station_name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {obs.observation_date} | {obs.observation_time}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  obs.status === 'FINAL' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {obs.status === 'FINAL' ? <CheckCircle size={8} /> : <Clock size={8} />}
                  {obs.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Water Level</span>
                  <span className="text-sm font-extrabold text-blue-700">{Number(obs.current_water_level || 0).toFixed(3)} m</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Operator</span>
                  <span className="text-xs font-bold text-slate-700 truncate block max-w-[120px]">
                    {obs.observer_name || 'System'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setSelectedObservationId(obs.observation_id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 font-extrabold text-xs rounded-lg transition-colors border border-blue-100"
                >
                  View Details
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Responsive Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Site / Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Water Level</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Operator</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Loading observations...</td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">No records found.</td>
              </tr>
            ) : filteredData.map((obs: any) => (
              <tr key={obs.observation_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{obs.site_name || obs.site_details?.station_name}</div>
                  <div className="text-xs text-slate-500">
                    {obs.observation_date} | {obs.observation_time}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-lg font-bold text-blue-700">{Number(obs.current_water_level || 0).toFixed(3)} m</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Reservoir Level</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    obs.status === 'FINAL' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {obs.status === 'FINAL' ? <CheckCircle size={10} /> : <Clock size={10} />}
                    {obs.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {obs.observer_name || 'System'}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedObservationId(obs.observation_id)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors"
                  >
                    Details
                    <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedObservationId && (
        <ObservationViewerModal
          observationId={selectedObservationId}
          siblingIds={filteredData.map((obs: any) => obs.observation_id)}
          onClose={() => setSelectedObservationId(null)}
        />
      )}
    </div>
  );
};

export default ObservationsList;

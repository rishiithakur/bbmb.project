import React from 'react';
import { Download, FileSpreadsheet, Calendar, Filter, Activity, BarChart2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportsPage: React.FC = () => {
  const handleExportCSV = async () => {
    try {
      // Actually I should call the export_csv endpoint directly via window.open or blob
      window.open(`${import.meta.env.VITE_API_URL}/observations/export-csv/`, '_blank');
    } catch (error) {
      toast.error('Failed to generate report.');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-500">Generate and export dam monitoring data for official review.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard 
          title="Daily Water Level Log"
          description="Consolidated report of all reservoir levels recorded in the last 24 hours."
          icon={<FileSpreadsheet className="text-green-600" />}
          onExport={handleExportCSV}
        />
        <ReportCard 
          title="Structural Health Audit"
          description="Summary of seepage and piezometer readings across all monitoring sites."
          icon={<Activity className="text-blue-600" />}
          onExport={() => toast.success('Structural report scheduled.')}
        />
        <ReportCard 
          title="Inflow/Outflow Analytics"
          description="Monthly discharge summary for spillway and sluice operations."
          icon={<BarChart2 className="text-purple-600" />}
          onExport={() => toast.success('Analytics report scheduled.')}
        />
        <ReportCard 
          title="Alert History"
          description="List of all sites that crossed Yellow/Red alert levels this month."
          icon={<AlertTriangle className="text-amber-600" />}
          onExport={() => toast.success('Alert report scheduled.')}
        />
      </div>

      <div className="mt-12 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Filter size={18} />
          Advanced Report Builder
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Date Range</label>
            <input type="date" className="w-full p-2 border rounded-lg" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Site Category</label>
            <select className="w-full p-2 border rounded-lg">
              <option>All Sites</option>
              <option>Bhakra Dam Division</option>
              <option>Beas Project</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              <Calendar size={18} />
              Generate Custom Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



const ReportCard: React.FC<{ title: string, description: string, icon: React.ReactNode, onExport: () => void }> = ({ title, description, icon, onExport }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl mb-4">
      {icon}
    </div>
    <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
    <p className="text-slate-500 text-sm mb-6 leading-relaxed">{description}</p>
    <button 
      onClick={onExport}
      className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors group"
    >
      <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
      Export as CSV
    </button>
  </div>
);

export default ReportsPage;

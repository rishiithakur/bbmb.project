import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sitesApi } from '../api/sites.api';
import { Plus, Search, MapPin, Edit2, Trash2, X, Loader2, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import type { Site } from '../types';
import { useAuthStore } from '../store/auth.store';

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const SiteManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const role = useAuthStore((s) => s.user?.role);
  
  // Form State
  const [lat, setLat] = useState<number>(31.25);
  const [lng, setLng] = useState<number>(77.0);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => sitesApi.getSites().then(res => res.data),
  });

  useEffect(() => {
    if (editingSite) {
      setLat(editingSite.latitude);
      setLng(editingSite.longitude);
    } else {
      setLat(31.25);
      setLng(77.0);
    }
  }, [editingSite, isModalOpen]);

  const sites = Array.isArray(response) ? response : response?.results || [];

  const filteredSites = sites.filter(site => 
    (site.station_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (site.site_code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: Partial<Site>) => sitesApi.createSite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsModalOpen(false);
      setEditingSite(null);
      toast.success('Site created successfully');
    },
    onError: () => toast.error('Failed to create site'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Site> }) => sitesApi.updateSite(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsModalOpen(false);
      setEditingSite(null);
      toast.success('Site updated successfully');
    },
    onError: () => toast.error('Failed to update site'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sitesApi.deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site deleted');
    },
  });

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      deleteMutation.mutate(id);
    }
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        setIsFetchingLocation(false);
        toast.success('Location fetched successfully');
      },
      (error) => {
        setIsFetchingLocation(false);
        toast.error('Unable to fetch GPS location');
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Draggable Marker Component
  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
      },
    });

    useEffect(() => {
      map.flyTo([lat, lng], map.getZoom());
    }, [lat, lng]);

    return (
      <Marker 
        position={[lat, lng]} 
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            setLat(position.lat);
            setLng(position.lng);
          },
        }}
      />
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dam Sites Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage all reservoir monitoring stations across divisions.</p>
        </div>
        {['supreme_admin', 'ultra_admin'].includes(role || '') && (
          <button
            onClick={() => { setEditingSite(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm text-sm font-medium self-start sm:self-auto min-h-[44px]"
          >
            <Plus size={18} />
            Add New Site
          </button>
        )}
      </div>

      {/* ── Search & Stats ── */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by station name or code..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 text-sm text-slate-500 px-1">
          <span>Total: <b className="text-slate-900">{sites.length}</b></span>
          <span>Filtered: <b className="text-slate-900">{filteredSites.length}</b></span>
        </div>
      </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin mb-2" size={28} />
          <span className="text-sm">Loading sites...</span>
        </div>
      )}

      {/* ── MOBILE: card list (hidden on md+) ── */}
      {!isLoading && (
        <div className="md:hidden space-y-3">
          {filteredSites.map((site) => (
            <div key={site.site_id} className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-slate-900">{site.station_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{site.site_code} · {site.division}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${
                  site.site_status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {site.site_status}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                <MapPin size={12} className="text-slate-400" />
                {Number(site.latitude).toFixed(4)}, {Number(site.longitude).toFixed(4)}
              </div>
              <div className="flex gap-4 text-xs mb-3">
                <span className="text-red-600 font-medium">Danger: {site.danger_level || '--'} m</span>
                <span className="text-amber-600 font-medium">Warning: {site.warning_level || '--'} m</span>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => handleEdit(site)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                >
                  <Edit2 size={14} /> Edit
                </button>
                {['supreme_admin', 'ultra_admin'].includes(role || '') && (
                  <button
                    onClick={() => handleDelete(site.site_id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredSites.length === 0 && !isLoading && (
            <div className="text-center py-12 text-slate-400 text-sm">No sites found.</div>
          )}
        </div>
      )}

      {/* ── DESKTOP: full table (hidden on mobile) ── */}
      {!isLoading && (
        <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Station Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Alert Levels (m)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSites.map((site) => (
                <tr key={site.site_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{site.station_name}</div>
                    <div className="text-xs text-slate-500">{site.site_code} | {site.division}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin size={14} className="text-slate-400" />
                      {Number(site.latitude).toFixed(4)}, {Number(site.longitude).toFixed(4)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-red-600 font-medium">DL: {site.danger_level || '--'}</span>
                      <span className="text-amber-600 font-medium">WL: {site.warning_level || '--'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      site.site_status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {site.site_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button title="Edit site" onClick={() => handleEdit(site)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      {['supreme_admin', 'ultra_admin'].includes(role || '') && (
                        <button title="Delete site" onClick={() => handleDelete(site.site_id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSites.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No sites found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">{editingSite ? 'Edit Dam Site' : 'Add New Dam Site'}</h2>
              <button 
                title="Close modal"
                onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row h-[70vh]">
              {/* Form Side */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                
                const payload: any = {
                  ...data,
                  latitude: lat,
                  longitude: lng,
                  full_reservoir_level: parseFloat(data.full_reservoir_level as string) || null,
                  minimum_draw_down_level: parseFloat(data.minimum_draw_down_level as string) || null,
                  danger_level: parseFloat(data.danger_level as string) || null,
                  warning_level: parseFloat(data.warning_level as string) || null,
                  functional: data.functional === 'on',
                };


                if (editingSite) {
                  updateMutation.mutate({ id: editingSite.site_id, data: payload });
                } else {
                  createMutation.mutate(payload);
                }
              }} className="p-6 flex-1 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Station Name *</label>
                    <input name="station_name" required defaultValue={editingSite?.station_name} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Site Code *</label>
                    <input name="site_code" required defaultValue={editingSite?.site_code} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Basin/Reservoir Name</label>
                    <input name="basin" defaultValue={editingSite?.basin || ''} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Division *</label>
                    <input name="division" required defaultValue={editingSite?.division} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">State *</label>
                    <input name="state" required defaultValue={editingSite?.state || 'Himachal Pradesh'} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">River Name</label>
                    <input name="river_tributary" defaultValue={editingSite?.river_tributary || ''} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                      <MapPin size={16} />
                      Location Details
                    </h3>
                    <button 
                      type="button"
                      onClick={fetchLocation}
                      disabled={isFetchingLocation}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isFetchingLocation ? <Loader2 className="animate-spin" size={14} /> : <Navigation size={14} />}
                      Fetch Current Location
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Latitude</label>
                      <input 
                        value={Number(lat).toFixed(6)}
                        onChange={(e) => setLat(parseFloat(e.target.value))}
                        type="number" step="0.000001" required className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Longitude</label>
                      <input 
                        value={Number(lng).toFixed(6)}
                        onChange={(e) => setLng(parseFloat(e.target.value))}
                        type="number" step="0.000001" required className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-500">
                    Click on the map or drag the marker to adjust coordinates manually.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">FRL (m) *</label>
                    <input name="full_reservoir_level" type="number" step="0.001" required defaultValue={editingSite?.full_reservoir_level || ''} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">MDDL (m) *</label>
                    <input name="minimum_draw_down_level" type="number" step="0.001" required defaultValue={editingSite?.minimum_draw_down_level || ''} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Danger Level (m)</label>
                    <input name="danger_level" type="number" step="0.001" defaultValue={editingSite?.danger_level || ''} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Warning Level (m)</label>
                    <input name="warning_level" type="number" step="0.001" defaultValue={editingSite?.warning_level || ''} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <label className="flex items-center gap-2 py-2">
                  <input type="checkbox" name="functional" defaultChecked={editingSite ? editingSite.functional : true} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">This station is currently functional</span>
                </label>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors shadow-md disabled:opacity-50"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="animate-spin" size={18} />}
                    {editingSite ? 'Update Site' : 'Save Site'}
                  </button>
                </div>
              </form>

              {/* Map Side */}
              <div className="hidden md:block w-96 h-full border-l bg-slate-100">
                <MapContainer center={[lat, lng]} zoom={12} className="w-full h-full">
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker />
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteManagement;

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users.api';
import type { User } from '../api/users.api';
import { sitesApi } from '../api/sites.api';
import {
  Plus, Search, Edit2, Trash2, X,
  Loader2, Lock, Unlock,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRoleBadge(role: string | undefined) {
  const r = (role || '').toLowerCase();
  if (r.includes('supreme') || r.includes('ultra'))
    return 'bg-purple-100 text-purple-700';
  if (r === 'admin')
    return 'bg-amber-100 text-amber-700';
  if (r === 'operator' || r === 'siteuser')
    return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}

function formatRole(role: string | undefined) {
  return (role || 'viewer').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Component ─────────────────────────────────────────────────────────────────

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const currentRole = useAuthStore((s) => s.user?.role);

  const { data: response, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers().then(res => res.data),
  });

  const { data: sitesResponse } = useQuery({
    queryKey: ['sites'],
    queryFn: () => sitesApi.getSites().then(res => res.data),
  });

  const users: User[] = Array.isArray(response) ? response : (response as any)?.results || [];
  const sites = Array.isArray(sitesResponse) ? sitesResponse : (sitesResponse as any)?.results || [];

  const filteredUsers = users.filter(user =>
    (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setEditingUser(null);
    },
    onError: (err: any) => window.alert(`Failed to create user: ${err?.response?.data?.detail || err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setEditingUser(null);
    },
    onError: (err: any) => window.alert(`Failed to update user: ${err?.response?.data?.detail || err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => window.alert(`Failed to delete user: ${err?.response?.data?.detail || err.message}`),
  });

  const handleEdit = (user: User) => { setEditingUser(user); setIsModalOpen(true); };

  const handleToggleStatus = (user: User) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      updateMutation.mutate({ id: user.user_id, data: { is_active: !user.is_active } });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const openCreate = () => { setEditingUser(null); setIsModalOpen(true); };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage operators, viewers, and administrators.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm text-sm font-medium self-start sm:self-auto min-h-[44px]"
        >
          <Plus size={18} />
          Create User
        </button>
      </div>

      {/* ── Search bar ── */}
      <div className="bg-white p-3 rounded-xl shadow-sm border mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, username or email..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500 px-1 whitespace-nowrap">
          <b className="text-slate-900">{filteredUsers.length}</b> / {users.length} users
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="animate-spin mb-2" size={28} />
          <span className="text-sm">Loading users...</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE VIEW: card-per-user list (visible below md breakpoint)
          ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && (
        <div className="md:hidden space-y-3">
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border">No users found.</div>
          )}
          {filteredUsers.map((user) => {
            const role = user.user_role || user.role || '';
            const siteName = user.site_name || user.station_name || user.assigned_site_name;
            return (
              <div key={user.user_id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-3 p-3 border-b bg-slate-50">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-700 uppercase">
                      {(user.full_name || user.username || '?')[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                  </div>
                  {/* Status badge */}
                  <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-full flex-shrink-0 ${
                    user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {user.is_active ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                    {user.is_active ? 'Active' : 'Locked'}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Role</span>
                    <div className="mt-0.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getRoleBadge(role)}`}>
                        {formatRole(role)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Email</span>
                    <p className="text-slate-700 mt-0.5 truncate">{user.email || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Assigned Site</span>
                    <p className="text-slate-700 mt-0.5 truncate">{siteName || (role.toLowerCase().includes('operator') || role === 'SiteUser' ? 'Not Assigned' : 'N/A')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Mobile</span>
                    <p className="text-slate-700 mt-0.5">{user.mobile_number || (user as any).mobile || '—'}</p>
                  </div>
                </div>

                {/* Card actions — always fully visible */}
                <div className="grid grid-cols-3 divide-x border-t">
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                      user.is_active
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={user.is_active ? 'Lock Account' : 'Unlock Account'}
                  >
                    {user.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                    {user.is_active ? 'Lock' : 'Unlock'}
                  </button>
                  <button
                    onClick={() => handleEdit(user)}
                    className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit User"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.user_id)}
                    className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP VIEW: scrollable table (visible from md breakpoint up)
          ════════════════════════════════════════════════════════════════════ */}
      {!isLoading && (
        <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">User</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Assigned Site</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No users found.
                    </td>
                  </tr>
                )}
                {filteredUsers.map((user) => {
                  const role = user.user_role || user.role || '';
                  const siteName = user.site_name || user.station_name || user.assigned_site_name;
                  return (
                    <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-blue-700 uppercase">
                              {(user.full_name || user.username || '?')[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{user.full_name}</div>
                            <div className="text-xs text-slate-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getRoleBadge(role)}`}>
                          {formatRole(role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {siteName || (role.toLowerCase().includes('operator') || role === 'SiteUser' ? (
                          <span className="text-amber-600 font-medium">Not Assigned</span>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        ))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-700">{user.email}</div>
                        <div className="text-xs text-slate-400">{user.mobile_number || (user as any).mobile || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_active ? (
                          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit text-[10px] font-bold uppercase">
                            <CheckCircle2 size={10} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full w-fit text-[10px] font-bold uppercase">
                            <AlertCircle size={10} /> Locked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors ${user.is_active ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                            title={user.is_active ? 'Lock User' : 'Unlock User'}
                          >
                            {user.is_active ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.user_id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CREATE / EDIT MODAL
          ════════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-200">

            {/* Modal header */}
            <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 min-w-[40px] min-h-[40px] flex items-center justify-center"
                title="Close"
              >
                <X size={22} />
              </button>
            </div>

            {/* Scrollable form body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData);
                const payload: any = {
                  ...data,
                  assigned_site: data.assigned_site ? parseInt(data.assigned_site as string, 10) : null,
                };
                if (editingUser && !data.password) delete payload.password;
                if (editingUser) {
                  updateMutation.mutate({ id: editingUser.user_id, data: payload });
                } else {
                  createMutation.mutate(payload);
                }
              }}
              className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <label className="space-y-1 block sm:col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Full Name *</span>
                  <input
                    name="full_name"
                    required
                    defaultValue={editingUser?.full_name}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-slate-500 uppercase">Username *</span>
                  <input
                    name="username"
                    required
                    defaultValue={editingUser?.username}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    {editingUser ? 'Change Password' : 'Password *'}
                  </span>
                  <input
                    name="password"
                    type="password"
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm placeholder:text-slate-300"
                  />
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-slate-500 uppercase">Role *</span>
                  <select
                    name="role"
                    defaultValue={editingUser?.role || editingUser?.user_role || 'operator'}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    title="Select User Role"
                  >
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Administrator</option>
                    {['supreme_admin', 'ultra_admin'].includes(currentRole || '') && (
                      <>
                        <option value="supreme_admin">Supreme Admin</option>
                        <option value="ultra_admin">Ultra Admin</option>
                      </>
                    )}
                  </select>
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-slate-500 uppercase">Assigned Site</span>
                  <select
                    name="assigned_site"
                    defaultValue={editingUser?.assigned_site || ''}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    title="Assign Dam Site"
                  >
                    <option value="">— No Site Assigned —</option>
                    {sites.map((s: any) => (
                      <option key={s.site_id} value={s.site_id}>{s.station_name}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 block">
                  <span className="text-xs font-bold text-slate-500 uppercase">Mobile Number</span>
                  <input
                    name="mobile_number"
                    defaultValue={editingUser?.mobile_number}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="e.g. 9876543210"
                  />
                </label>

                <label className="space-y-1 block sm:col-span-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Email Address *</span>
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={editingUser?.email}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </label>
              </div>

              {/* Modal actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors shadow-md disabled:opacity-50 text-sm font-medium"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="animate-spin" size={16} />
                  )}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

import { NavLink } from 'react-router-dom'
import {
  BarChart2, FileText, Users, Settings,
  Activity, ClipboardList, Map, Monitor
} from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { useUIStore } from '../store/ui.store'

const API_BASE = import.meta.env.VITE_API_BASE_URL !== undefined
  ? (import.meta.env.VITE_API_BASE_URL === '' ? '/api/v1' : import.meta.env.VITE_API_BASE_URL)
  : 'http://localhost:8000/api/v1'

// ── Role-based nav link definitions ────────────────────────────────────────────

const baseAdminLinks = [
  { to: '/map',                 icon: Map,           label: 'GIS Map' },
  { to: '/dashboard',           icon: BarChart2,      label: 'Dashboard' },
  { to: '/observations',        icon: ClipboardList,  label: 'Observations' },
  { to: '/admin/observations',  icon: Monitor,        label: 'Obs. Monitor' },
  { to: '/sites',               icon: Settings,       label: 'Sites' },
  { to: '/users',               icon: Users,          label: 'Users' },
  { to: '/audit',               icon: Activity,       label: 'Audit Log' },
]

const supremeAdminLinks = [
  { to: '/map',                 icon: Map,           label: 'GIS Map' },
  { to: '/dashboard',           icon: BarChart2,      label: 'Dashboard' },
  { to: '/observations',        icon: ClipboardList,  label: 'Observations' },
  { to: '/admin/observations',  icon: Monitor,        label: 'Obs. Monitor' },
  { to: '/sites',               icon: Settings,       label: 'Sites' },
  { to: '/users',               icon: Users,          label: 'Users' },
  { to: '/audit',               icon: Activity,       label: 'Audit Log' },
  { to: '/reports',             icon: FileText,       label: 'Reports' },
]

const operatorLinks = [
  { to: '/operator',        icon: ClipboardList,    label: 'Workspace' },
]

const viewerLinks = [
  { to: '/map',          icon: Map,           label: 'GIS Map' },
  { to: '/dashboard',    icon: BarChart2,      label: 'Dashboard' },
  { to: '/observations', icon: ClipboardList,  label: 'Observations' },
]

// ── Role → links resolution ─────────────────────────────────────────────────

function getLinks(role: string | undefined) {
  if (role === 'operator') return operatorLinks
  if (role === 'viewer')   return viewerLinks
  if (role === 'supreme_admin' || role === 'ultra_admin') return supremeAdminLinks
  if (role === 'admin')    return baseAdminLinks
  return viewerLinks
}

// ── Role label formatting ────────────────────────────────────────────────────

function formatRole(role: string | undefined): string {
  if (!role) return ''
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Component ────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const role = useAuthStore((s) => s.user?.role)
  const user = useAuthStore((s) => s.user)
  const closeSidebarOnMobile = useUIStore((s) => s.closeSidebarOnMobile)

  const links = getLinks(role)

  return (
    <nav className="flex flex-col h-full bg-[#1C2833]">
      
      {/* ── Branding Header ── */}
      <div className="h-14 bg-[#1B4F72] flex items-center px-4 gap-3 border-b border-white/10 flex-shrink-0 select-none">
        <img
          src={`${API_BASE}/branding/logo/`}
          alt="BBMB Logo"
          className="h-7 w-auto object-contain flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        {!collapsed && (
          <div className="min-w-0 animate-fade-in">
            <span className="font-bold text-sm tracking-wide leading-none block text-white">BBMB DWLMS</span>
            <span className="text-[9px] text-white/60 leading-none mt-0.5 block truncate">
              Water Level Monitoring
            </span>
          </div>
        )}
      </div>

      {/* ── User identity strip (shown in expanded drawer) ── */}
      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3 min-h-[56px] select-none">
        <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-blue-200 uppercase">
            {user?.full_name?.[0] || '?'}
          </span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">{formatRole(role)}</p>
          </div>
        )}
      </div>

      {/* ── Nav links ── */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            onClick={closeSidebarOnMobile}
            className={({ isActive }) =>
              `flex items-center rounded-lg transition-all duration-200 text-sm min-h-[44px]
               ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'}
               ${isActive
                 ? 'bg-white/15 text-white font-semibold shadow-inner border border-white/10'
                 : 'text-gray-400 hover:bg-white/8 hover:text-white'
               }`
            }
          >
            <Icon size={19} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </div>

      {/* ── Footer version tag ── */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10 select-none">
          <p className="text-[10px] text-white/30 uppercase tracking-widest">BBMB DWLMS v1.0</p>
        </div>
      )}
    </nav>
  )
}

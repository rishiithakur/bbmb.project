import { useState, useEffect, useRef } from 'react'
import { Menu, Bell, LogOut, X, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react'
import { useUIStore } from '../store/ui.store'
import { useAuth } from '../features/auth/useAuth'
import { useAuthStore } from '../store/auth.store'
import { auditApi } from '../api/audit.api'
import type { AppNotification } from '../types'

import { API_BASE } from '../api/client'

function formatRole(role: string | undefined): string {
  if (!role) return ''
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatTimeAgo(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function Navbar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const { logout } = useAuth()
  const user = useAuthStore((s) => s.user)

  // ── Real Notification State ──
  const [notiOpen, setNotiOpen] = useState(false)
  const notiRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Viewport resize tracking for responsive notifications
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Dynamic API Polling Engine (6-second loop)
  const fetchNotifications = async () => {
    try {
      const res = await auditApi.getNotifications() as any
      if (res && 'results' in (res as object)) {
        setNotifications(res.results)
      } else if (Array.isArray(res)) {
        setNotifications(res)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications() // initial fetch on mount
    const interval = setInterval(() => {
      fetchNotifications()
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read_status).length

  // Click outside listener to auto-close notifications dropdown (desktop)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notiRef.current && !notiRef.current.contains(event.target as Node)) {
        setNotiOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllRead = async () => {
    try {
      await auditApi.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read_status: true })))
      fetchNotifications() // sync in background
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const clearAll = async () => {
    try {
      await auditApi.clearAllNotifications()
      setNotifications([])
      fetchNotifications() // sync in background
    } catch (err) {
      console.error('Error clearing notifications:', err)
    }
  }

  function getNotiLevel(type: string): 'warning' | 'info' | 'success' {
    if (['RESERVOIR_ALERT', 'INACTIVE_SITE'].includes(type)) return 'warning'
    if (['FINAL_SUBMISSION', 'FINAL_SUBMISSION_ALERT', 'LOGIN_SUCCESS', 'EXPORT_SUCCESS'].includes(type)) return 'success'
    return 'info'
  }

  return (
    <header className="bg-[#1B4F72] text-white h-14 flex items-center px-3 sm:px-4 gap-3 flex-shrink-0 z-[1200] shadow-md relative">

      {/* ── Hamburger / Close toggle ────────────────────────────────────── */}
      <button
        onClick={toggleSidebar}
        className="hover:bg-white/10 p-2 rounded-lg transition-colors flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
        title={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={sidebarOpen ? "true" : "false"}
      >
        {/* Animated hamburger → X */}
        <div className="relative w-5 h-5">
          <Menu
            size={20}
            className={`absolute inset-0 transition-all duration-200 ${sidebarOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
          />
          <X
            size={20}
            className={`absolute inset-0 transition-all duration-200 ${sidebarOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
          />
        </div>
      </button>

      {/* ── Mobile-Only Branding (hidden on desktop) ── */}
      <div className="flex items-center gap-2 md:hidden min-w-0 select-none">
        <img
          src={`${API_BASE}/branding/logo/`}
          alt="BBMB Logo"
          className="h-6 w-auto object-contain flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <span className="font-bold text-sm tracking-wide leading-none text-white block">BBMB DWLMS</span>
      </div>

      {/* ── Right actions ─────────────────────────────────────────────────── */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2 relative">

        {/* Notifications Dropdown Container */}
        <div className="relative" ref={notiRef}>
          <button
            onClick={() => setNotiOpen(!notiOpen)}
            className={`hover:bg-white/10 p-2 rounded-lg relative min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors ${
              notiOpen ? 'bg-white/10' : ''
            }`}
            title="Notifications"
            aria-label="View notifications"
            aria-expanded={notiOpen}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border border-[#1B4F72]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Desktop Dropdown Panel */}
          {notiOpen && !isMobile && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden animate-slide-down origin-top-right max-h-[500px] flex flex-col"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-shrink-0">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Bell size={13} className="text-[#1B4F72]" /> Alerts & Telemetry Updates
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold tracking-tight hover:underline transition-all"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Items Area */}
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 size={24} className="text-slate-300" />
                    <span>No active alerts or updates. All quiet.</span>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const lvl = getNotiLevel(n.type)
                    return (
                      <div
                        key={n.id}
                        className={`p-3.5 transition-colors duration-200 text-left ${
                          !n.read_status ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {lvl === 'warning' && (
                              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                            )}
                            {lvl === 'info' && (
                              <FileText size={14} className="text-blue-500 flex-shrink-0" />
                            )}
                            {lvl === 'success' && (
                              <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                            )}
                            <h4 className="font-bold text-xs text-slate-900 leading-tight">
                              {n.title}
                            </h4>
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded">
                            {formatTimeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {n.message}
                        </p>
                        {n.site_name && (
                          <div className="mt-1 text-[10px] font-semibold text-[#1B4F72]">
                            Site: {n.site_name}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-[10px] flex-shrink-0">
                <span className="text-slate-400">Total: {notifications.length} alerts</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-slate-400 hover:text-red-600 font-bold transition-all"
                  >
                    Clear all logs
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User info — name hidden on small mobile to save space */}
        <div className="hidden xs:flex items-center gap-2 text-sm border-l border-white/20 pl-2 sm:pl-3 select-none">
          <div className="w-7 h-7 rounded-full bg-blue-400/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold uppercase">{user?.full_name?.[0] || '?'}</span>
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="font-medium text-sm truncate max-w-[120px]">{user?.full_name}</span>
            <span className="text-[10px] text-white/60 uppercase mt-0.5">
              {formatRole(user?.role)}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="hover:bg-red-600/80 p-2 rounded-lg flex items-center gap-1.5 text-sm transition-colors min-w-[40px] min-h-[40px] justify-center"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>

      {/* ── Mobile Sliding Drawer & Glassmorphic Mask ── */}
      {notiOpen && isMobile && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9998] transition-opacity animate-fade-in"
            onClick={() => setNotiOpen(false)}
            aria-hidden="true"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85%] bg-white shadow-2xl z-[9999] flex flex-col text-slate-800 border-l border-slate-200"
          >
            {/* Drawer Header */}
            <div className="px-4 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-shrink-0">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Bell size={14} className="text-[#1B4F72]" /> Active Notifications
              </span>
              <button
                onClick={() => setNotiOpen(false)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions Bar inside mobile drawer */}
            <div className="px-4 py-2 border-b border-slate-100 bg-white flex justify-between items-center flex-shrink-0 text-xs">
              <span className="text-slate-500 font-medium">{unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-blue-600 hover:text-blue-800 font-bold tracking-tight hover:underline transition-all"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Scrollable list */}
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 bg-white">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 size={28} className="text-slate-300 animate-bounce" />
                  <span className="font-semibold text-slate-500">System Clear</span>
                  <span>No active telemetry updates or alerts.</span>
                </div>
              ) : (
                notifications.map((n) => {
                  const lvl = getNotiLevel(n.type)
                  return (
                    <div
                      key={n.id}
                      className={`p-4 transition-colors duration-200 text-left ${
                        !n.read_status ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          {lvl === 'warning' && (
                            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
                          )}
                          {lvl === 'info' && (
                            <FileText size={15} className="text-blue-500 flex-shrink-0" />
                          )}
                          {lvl === 'success' && (
                            <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
                          )}
                          <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                            {n.title}
                          </h4>
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {n.message}
                      </p>
                      {n.site_name && (
                        <div className="mt-1.5 text-[10px] font-semibold text-[#1B4F72]">
                          Site: {n.site_name}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-[11px] flex-shrink-0">
              <span className="text-slate-400">Total: {notifications.length} alerts</span>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-red-500 hover:text-red-700 font-bold transition-all hover:underline"
                >
                  Clear all notifications
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}

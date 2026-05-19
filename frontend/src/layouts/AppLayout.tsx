import { useState, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import { useUIStore } from '../store/ui.store'
import { useAuth } from '../features/auth/useAuth'
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  // ── Session Inactivity Timeout Hooks & States ──
  const { logout } = useAuth()
  const [showInactivityModal, setShowInactivityModal] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(120)

  const lastActivityRef = useRef<number>(Date.now())
  const warningTimeoutRef = useRef<any>(null)
  const countdownIntervalRef = useRef<any>(null)

  const resetInactivityTimer = () => {
    // If warning modal is open, don't silently reset on passive mouse movement
    if (showInactivityModal) return

    lastActivityRef.current = Date.now()

    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
    }

    // Warn after 13 minutes of complete silence (13 * 60 * 1000 ms)
    warningTimeoutRef.current = setTimeout(() => {
      setShowInactivityModal(true)
      setSecondsLeft(120) // Give exactly 2 minutes warning
    }, 13 * 60 * 1000)
  }

  // Setup event listeners for user activity tracking
  useEffect(() => {
    resetInactivityTimer()

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    const handleActivity = () => {
      // Throttle resets to maximum once per 2 seconds for superior performance
      if (Date.now() - lastActivityRef.current > 2000) {
        resetInactivityTimer()
      }
    }

    events.forEach((ev) => window.addEventListener(ev, handleActivity))

    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      events.forEach((ev) => window.removeEventListener(ev, handleActivity))
    }
  }, [showInactivityModal])

  // Countdown clock timer logic
  useEffect(() => {
    if (!showInactivityModal) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      return
    }

    countdownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current)
          handleAutomaticLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [showInactivityModal])

  const handleAutomaticLogout = () => {
    setShowInactivityModal(false)
    toast.error('Session expired due to inactivity. Telemetry drafts have been securely saved to browser cache.', {
      duration: 8000,
      icon: '⏰',
    })
    logout()
  }

  const handleStayConnected = () => {
    setShowInactivityModal(false)
    resetInactivityTimer()
    toast.success('Session extended. You are still connected.', { id: 'session-extend' })
  }

  // Close sidebar automatically when window shrinks to mobile width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }
    // Run once on mount to establish correct initial layout spacing
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setSidebarOpen])

  return (
    <div className="flex h-screen bg-[#F4F6F7] overflow-hidden font-sans">
      
      {/* ── MOBILE OVERLAY BACKDROP ────────────────────────────────────────────
          Rendered only on mobile when sidebar is open to capture closing clicks. */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[1090] md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ────────────────────────────────────────────────────────────
          Desktop  : inline left column, collapses to a compact 64px icon bar.
          Mobile   : fixed overlay drawer starting at top-0, sliding smoothly.     */}
      <aside
        className={`
          bg-[#1C2833] text-white flex-shrink-0
          transition-all duration-300 ease-in-out overflow-hidden h-screen
          
          /* Desktop: inline sidebar, collapses to 64px icon strip */
          md:relative md:z-auto
          ${sidebarOpen ? 'md:w-[280px]' : 'md:w-16'}
 
          /* Mobile: fixed full-height drawer, slides in/out from top-0 */
          fixed top-0 bottom-0 left-0 z-[1100]
          ${sidebarOpen ? 'w-[280px] translate-x-0' : 'w-[280px] -translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar collapsed={!sidebarOpen} />
      </aside>

      {/* ── RIGHT MAIN COLUMN ──────────────────────────────────────────────────
          Holds the top Navbar and the scrollable page outlet main view.           */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        {/* Top Navbar — perfectly aligned next to sidebar */}
        <Navbar />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-auto min-w-0 bg-[#F4F6F7]">
          <Outlet />
        </main>
      </div>

      {/* ── SESSION INACTIVITY WARNING MODAL ── */}
      {showInactivityModal && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/85 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-scale-up text-slate-800">
            
            {/* Warning Header */}
            <div className="bg-amber-50 px-6 py-5 border-b border-amber-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-amber-600 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-black text-slate-900 leading-tight">Inactivity Session Timeout</h3>
                <p className="text-xs text-amber-700 font-medium mt-0.5">Your session is about to expire</p>
              </div>
            </div>

            {/* Warning Body */}
            <div className="px-6 py-6 text-left">
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                You have been inactive for over <strong>13 minutes</strong>. For system security and regulatory compliance, you will be automatically logged out in:
              </p>
              
              {/* Animated Countdown Ring & Counter */}
              <div className="my-6 flex flex-col items-center justify-center select-none">
                <div className="relative w-28 h-28 rounded-full border-4 border-slate-100 flex flex-col items-center justify-center shadow-inner">
                  {/* Glowing warning outline */}
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 animate-ping" />
                  
                  <Clock size={20} className="text-slate-400 mb-1" />
                  <span className="text-2xl font-black text-slate-800 tracking-tight">
                    {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Remaining</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-start gap-2.5">
                <ShieldAlert size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-normal font-normal">
                  Any field observation draft values are securely preserved in your local browser cache and can be restored upon logging back in.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={handleAutomaticLogout}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-200"
              >
                Log Out Now
              </button>
              <button
                onClick={handleStayConnected}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5"
              >
                Stay Connected
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}


import { Outlet } from 'react-router-dom'

// Dynamic base URL — reads from .env so it works on laptop, LAN, and Cloudflare tunnels.
// Mobile devices resolve "localhost" as the phone itself, breaking branding image requests.
const API_BASE = import.meta.env.VITE_API_BASE_URL !== undefined
  ? (import.meta.env.VITE_API_BASE_URL === '' ? '/api/v1' : import.meta.env.VITE_API_BASE_URL)
  : 'http://localhost:8000/api/v1'

export function AuthLayout() {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: `url("${API_BASE}/branding/background/")`,
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark Overlay with Cinematic Blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px] z-0"></div>
      
      {/* Content Container - Compact & Centered */}
      <div className="relative z-10 w-full max-w-[920px] animate-in fade-in zoom-in-95 duration-700 ease-out">
        <Outlet />
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10">
        <p className="text-white/50 text-[10px] font-bold tracking-[0.2em] uppercase">
          Secure Access Portal • Unauthorized access is monitored
        </p>
      </div>
    </div>
  )
}

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Force operators to go directly to /operator and bypass any standard AppLayout
  if (user?.role === 'operator' && location.pathname !== '/operator') {
    return <Navigate to="/operator" replace />
  }

  // Prevent admin/viewers from hitting the operator dashboard directly
  if (user?.role !== 'operator' && location.pathname === '/operator') {
    return <Navigate to="/map" replace />
  }

  return <Outlet />
}

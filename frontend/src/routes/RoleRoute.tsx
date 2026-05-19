import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import type { UserRole } from '../types'

interface Props {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: Props) {
  const role = useAuthStore((s) => s.user?.role)

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/map" replace />
  }
  return <Outlet />
}

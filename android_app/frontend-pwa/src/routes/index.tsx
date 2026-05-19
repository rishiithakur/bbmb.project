import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'
import { AppLayout } from '../layouts/AppLayout'
import { AuthLayout } from '../layouts/AuthLayout'

import LoginPage from '../pages/Login'
import DashboardPage from '../pages/Dashboard'
import ObservationFormPage from '../features/observations/ObservationForm'
import ObservationDetails from '../pages/ObservationDetails'
import SiteManagement from '../pages/SiteManagement'
import UserManagement from '../pages/UserManagement'
import ReportsPage from '../pages/ReportsPage'
import ObservationsList from '../pages/ObservationsList'
import AnalyticsDashboard from '../pages/AnalyticsDashboard'
import AuditLogPage from '../pages/AuditLogPage'
import OperatorDashboard from '../pages/OperatorDashboard'
import AdminObservationMonitor from '../pages/AdminObservationMonitor'

const MapPage = DashboardPage
const Dashboard = AnalyticsDashboard
const ObservationForm = ObservationFormPage
const ObservationsPage = ObservationsList
const SitesPage = SiteManagement
const UsersPage = UserManagement
const AuditPage = AuditLogPage
const ReportsPageComp = ReportsPage
const NotFound = () => <div className="p-8"><h1>404 Not Found</h1></div>

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        // All authenticated users share AppLayout (sidebar + navbar)
        element: <AppLayout />,
        children: [
          { path: '/', element: <MapPage /> },
          { path: '/map', element: <MapPage /> },

          // ── Operator-only routes ──────────────────────────────────────────
          {
            element: <RoleRoute allowedRoles={['operator']} />,
            children: [
              { path: '/operator', element: <OperatorDashboard /> },
            ],
          },

          // ── Operator + Admin: new observation entry ───────────────────────
          {
            element: <RoleRoute allowedRoles={['admin', 'operator', 'supreme_admin', 'ultra_admin']} />,
            children: [
              { path: '/observation/new', element: <ObservationForm /> },
            ],
          },

          // ── All authenticated roles: view observation details ─────────────
          {
            element: <RoleRoute allowedRoles={['admin', 'operator', 'viewer', 'supreme_admin', 'ultra_admin']} />,
            children: [
              { path: '/observation/:id', element: <ObservationDetails /> },
            ],
          },

          // ── Admin + Viewer read-only ──────────────────────────────────────
          {
            element: <RoleRoute allowedRoles={['admin', 'viewer', 'supreme_admin', 'ultra_admin']} />,
            children: [
              { path: '/dashboard', element: <Dashboard /> },
              { path: '/observations', element: <ObservationsPage /> },
            ],
          },

          // ── Admin: observation monitor + audit ────────────────────────────
          {
            element: <RoleRoute allowedRoles={['admin', 'supreme_admin', 'ultra_admin']} />,
            children: [
              { path: '/audit', element: <AuditPage /> },
              { path: '/sites', element: <SitesPage /> },
              { path: '/users', element: <UsersPage /> },
              { path: '/admin/observations', element: <AdminObservationMonitor /> },
            ],
          },

          // ── Supreme/Ultra admin only ──────────────────────────────────────
          {
            element: <RoleRoute allowedRoles={['supreme_admin', 'ultra_admin']} />,
            children: [
              { path: '/reports', element: <ReportsPageComp /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}

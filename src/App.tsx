import { Component, Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminLayout } from './app/layouts/admin-layout'
import { EmptyState } from './components/shared/common'
import { Button } from './components/ui/button'

const Dashboard = lazy(() =>
  import('./features/dashboard/dashboard-page').then((m) => ({
    default: m.DashboardPage,
  })),
)
const Passengers = lazy(() =>
  import('./features/passengers/passengers-page').then((m) => ({
    default: m.PassengersPage,
  })),
)
const PassengerDetail = lazy(() =>
  import('./features/passengers/passengers-page').then((m) => ({
    default: m.PassengerDetailPage,
  })),
)
const Drivers = lazy(() =>
  import('./features/drivers/drivers-page').then((m) => ({
    default: m.DriversPage,
  })),
)
const DriverDetail = lazy(() =>
  import('./features/drivers/drivers-page').then((m) => ({
    default: m.DriverDetailPage,
  })),
)
const Vehicles = lazy(() =>
  import('./features/vehicles/vehicles-page').then((m) => ({
    default: m.VehiclesPage,
  })),
)
const LiveMap = lazy(() =>
  import('./features/live-map/live-map-page').then((m) => ({
    default: m.LiveMapPage,
  })),
)
const Rides = lazy(() =>
  import('./features/rides/rides-page').then((m) => ({ default: m.RidesPage })),
)
const RideDetail = lazy(() =>
  import('./features/rides/rides-page').then((m) => ({
    default: m.RideDetailPage,
  })),
)
const Payments = lazy(() =>
  import('./features/payments/payments-page').then((m) => ({
    default: m.PaymentsPage,
  })),
)
const Reports = lazy(() =>
  import('./features/reports/reports-page').then((m) => ({
    default: m.ReportsPage,
  })),
)
const AuditLogs = lazy(() =>
  import('./features/audit-logs/audit-logs-page').then((m) => ({
    default: m.AuditLogsPage,
  })),
)
const Notifications = lazy(() =>
  import('./features/notifications/notifications-page').then((m) => ({
    default: m.NotificationsPage,
  })),
)
const Settings = lazy(() =>
  import('./features/settings/settings-page').then((m) => ({
    default: m.SettingsPage,
  })),
)
const queryClient = new QueryClient()
const AdminUsers = lazy(() =>
  import('./features/admin-users/admin-users-page').then((m) => ({
    default: m.AdminUsersPage,
  })),
)

class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <EmptyState
          title="Something went wrong"
          description="Your saved demo data is still in this browser. Reload the app to try again."
          action={
            <Button onClick={() => window.location.reload()}>Reload app</Button>
          }
        />
      </div>
    ) : (
      this.props.children
    )
  }
}
function LoadingPage() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="animate-pulse space-y-6"
    >
      <div className="h-9 w-56 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-28 rounded-xl bg-slate-200/60" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-slate-200/60" />
      <span className="sr-only">Loading page...</span>
    </div>
  )
}
export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              {[
                { path: '/dashboard', element: <Dashboard /> },
                { path: '/admin-users', element: <AdminUsers /> },
                { path: '/passengers', element: <Passengers /> },
                { path: '/passengers/:id', element: <PassengerDetail /> },
                { path: '/drivers', element: <Drivers /> },
                { path: '/drivers/:id', element: <DriverDetail /> },
                { path: '/vehicles', element: <Vehicles /> },
                { path: '/live-map', element: <LiveMap /> },
                { path: '/rides', element: <Rides /> },
                { path: '/rides/:id', element: <RideDetail /> },
                { path: '/payments', element: <Payments /> },
                { path: '/reports', element: <Reports /> },
                { path: '/audit-logs', element: <AuditLogs /> },
                { path: '/notifications', element: <Notifications /> },
                { path: '/settings', element: <Settings /> },
              ].map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <Suspense fallback={<LoadingPage />}>
                      {route.element}
                    </Suspense>
                  }
                />
              ))}
              <Route
                path="*"
                element={
                  <EmptyState
                    title="This page took a wrong turn"
                    description="The page you're looking for doesn't exist. Let's get you back to your workspace."
                    action={
                      <Button asChild>
                        <Link to="/dashboard">Back to dashboard</Link>
                      </Button>
                    }
                  />
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import AppLayout from '../components/layout/AppLayout';
import RoleGuard from '../components/layout/RoleGuard';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import MaterialsPage from '../pages/MaterialsPage';
import RequestsPage from '../pages/RequestsPage';
import UsersPage from '../pages/UsersPage';
import EventLogsPage from '../pages/EventLogsPage';
import ManagerEventLogsPage from '../pages/ManagerEventLogsPage';

// eslint-disable-next-line react-refresh/only-export-components
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useSelector((s: RootState) => s.auth.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'warehouse',
        element: (
          <RoleGuard routeKey="warehouse">
            <MaterialsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'requests',
        element: (
          <RoleGuard routeKey="requests">
            <RequestsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleGuard routeKey="users">
            <UsersPage />
          </RoleGuard>
        ),
      },
      {
        path: 'event-logs',
        element: (
          <RoleGuard routeKey="event-logs">
            <EventLogsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'manager-logs',
        element: (
          <RoleGuard routeKey="manager-logs">
            <ManagerEventLogsPage />
          </RoleGuard>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

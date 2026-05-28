import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { PageLoader } from '@/components/common/PageLoader';

// Lazy-loaded pages – keeps the initial bundle lean.
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const POSPage = lazy(() => import('@/pages/admin/POSPage'));
const KDSPage = lazy(() => import('@/pages/admin/KDSPage'));
const OrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));
const MenuPage = lazy(() => import('@/pages/admin/MenuPage'));
const TablesPage = lazy(() => import('@/pages/admin/TablesPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const OffersPage = lazy(() => import('@/pages/admin/OffersPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const PublicMenuPage = lazy(() => import('@/pages/public/PublicMenuPage'));
const OrderStatusPage = lazy(() => import('@/pages/public/OrderStatusPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const withSuspense = (node: React.ReactNode) => <Suspense fallback={<PageLoader />}>{node}</Suspense>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  // -------------------- AUTH --------------------
  { path: '/login', element: withSuspense(<LoginPage />) },

  // -------------------- ADMIN --------------------
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: withSuspense(<DashboardPage />) },
      { path: 'pos', element: withSuspense(<POSPage />) },
      { path: 'billing', element: withSuspense(<POSPage />) },
      { path: 'kds', element: withSuspense(<KDSPage />) },
      { path: 'orders', element: withSuspense(<OrdersPage />) },
      { path: 'menu', element: withSuspense(<MenuPage />) },
      { path: 'tables', element: withSuspense(<TablesPage />) },
      { path: 'reports', element: withSuspense(<ReportsPage />) },
      { path: 'offers', element: withSuspense(<OffersPage />) },
      { path: 'settings', element: withSuspense(<SettingsPage />) },
      { path: 'reservations', element: withSuspense(<TablesPage />) },
      { path: 'delivery', element: withSuspense(<OrdersPage />) },
    ],
  },

  // -------------------- PUBLIC (customer QR ordering) --------------------
  {
    path: '/m',
    element: <PublicLayout />,
    children: [
      { path: ':slug/:table', element: withSuspense(<PublicMenuPage />) },
      { path: ':slug/order/:orderId', element: withSuspense(<OrderStatusPage />) },
    ],
  },

  // -------------------- 404 --------------------
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);

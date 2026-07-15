import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { PageLoader } from '@/components/common/PageLoader';

// Lazy-loaded pages – keeps the initial bundle lean.
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const KDSPage = lazy(() => import('@/pages/admin/KDSPage'));
const MenuPage = lazy(() => import('@/pages/admin/MenuPage'));
const MenuOCRWorkflowPage = lazy(() => import('@/pages/admin/MenuOCRWorkflowPage'));
const TablesPage = lazy(() => import('@/pages/admin/TablesPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const OffersPage = lazy(() => import('@/pages/admin/OffersPage'));
const ComboManagementPage = lazy(() => import('@/pages/admin/ComboManagementPage'));
const PaymentConfigPage = lazy(() => import('@/pages/admin/PaymentConfigPage'));
const IntegrationConfigPage = lazy(() => import('@/pages/admin/IntegrationConfigPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const CustomerLaunchPage = lazy(() => import('@/pages/public/CustomerLaunchPage'));
const PublicMenuPage = lazy(() => import('@/pages/public/PublicMenuPage'));
const OrderStatusPage = lazy(() => import('@/pages/public/OrderStatusPage'));
const PaymentStatusPage = lazy(() => import('@/pages/public/PaymentStatusPage'));
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
      { path: 'pos', element: <Navigate to="/kds" replace /> },
      { path: 'billing', element: <Navigate to="/kds" replace /> },
      { path: 'kds', element: withSuspense(<KDSPage />) },
      { path: 'orders', element: <Navigate to="/kds" replace /> },
      { path: 'menu', element: withSuspense(<MenuPage />) },
      { path: 'menu/extraction', element: withSuspense(<MenuOCRWorkflowPage />) },
      { path: 'tables', element: withSuspense(<TablesPage />) },
      { path: 'reports', element: withSuspense(<ReportsPage />) },
      { path: 'offers', element: withSuspense(<OffersPage />) },
      { path: 'offers/combos', element: withSuspense(<ComboManagementPage />) },
      { path: 'payment-config', element: withSuspense(<PaymentConfigPage />) },
      { path: 'integration-config', element: withSuspense(<IntegrationConfigPage />) },
      { path: 'settings', element: withSuspense(<SettingsPage />) },
    ],
  },

  // -------------------- PUBLIC (customer QR ordering) --------------------
  {
    path: '/customer-launch',
    element: withSuspense(<CustomerLaunchPage />),
  },
  {
    path: '/m',
    element: <PublicLayout />,
    children: [
      { path: ':slug/:table', element: withSuspense(<PublicMenuPage />) },
      { path: ':slug/order/:orderId', element: withSuspense(<OrderStatusPage />) },
    ],
  },
  {
    path: '/order/:slug/:table',
    element: withSuspense(<PublicMenuPage />),
  },
  {
    path: '/payment-status',
    element: withSuspense(<PaymentStatusPage />),
  },

  // -------------------- 404 --------------------
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);

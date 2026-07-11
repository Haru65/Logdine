import { QueryClient } from '@tanstack/react-query';

/** Global QueryClient — short stale time, refetch on focus for live ops dashboards. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number } | null)?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
    },
    mutations: { retry: false },
  },
});

/** Hierarchical, type-safe query keys — keep invalidation surgical. */
export const qk = {
  auth: ['auth'] as const,
  me: () => ['auth', 'me'] as const,

  dashboard: (tenantId: string) => ['dashboard', tenantId] as const,

  tables: (tenantId: string) => ['tables', tenantId] as const,

  categories: (tenantId: string) => ['categories', tenantId] as const,
  items: (tenantId: string) => ['items', tenantId] as const,

  orders: (tenantId: string, filters?: object) =>
    filters ? (['orders', tenantId, filters] as const) : (['orders', tenantId] as const),
  order: (tenantId: string, orderId: string) => ['orders', tenantId, orderId] as const,

  reports: {
    revenue: (tenantId: string, period: string, dates?: object) => ['reports', tenantId, 'revenue', period, dates] as const,
    products: (tenantId: string, dates?: object) => ['reports', tenantId, 'products', dates] as const,
  },

  offers: (tenantId: string) => ['offers', tenantId] as const,
  combos: (tenantId: string) => ['combos', tenantId] as const,
  paymentConfig: (tenantId: string, provider: string) => ['payment-config', tenantId, provider] as const,
  paymentSettings: (tenantId: string) => ['payment-settings', tenantId] as const,
  integrationConfig: (tenantId: string, provider: string) => ['integration-config', tenantId, provider] as const,

  publicMenu: (slug: string, table: string) => ['public', 'menu', slug, table] as const,
  publicOrder: (slug: string, id: string) => ['public', 'order', slug, id] as const,
};

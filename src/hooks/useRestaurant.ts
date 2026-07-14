import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurant.service';
import { qk } from '@/api/queryClient';
import { useAuthStore, selectTenantId } from '@/store/auth.store';
import type {
  ComboOffer,
  IntegrationConfig,
  IntegrationProvider,
  MenuAddon,
  MenuCategory,
  MenuItem,
  MenuVariant,
  OrderStatus,
  PaymentStatus,
  PaymentConfig,
  PaymentSettings,
  PaymentProvider,
  RestaurantTable,
  TaxConfig,
  Tenant,
} from '@/types';
import { toast } from 'sonner';

/** Resolve the active tenantId from the auth store. Superadmin users can be
 * authenticated without a restaurant tenant, so render-time hooks must not throw.
 */
function useTenantId() {
  return useAuthStore(selectTenantId);
}

function requireTenantId(tenantId: string | null): string {
  if (!tenantId) {
    throw new Error('A restaurant tenant is required for this action.');
  }
  return tenantId;
}

function tableSortValue(table: RestaurantTable) {
  return table.table_number || table.name || table.identifier || '';
}

function compareTablesAsc(a: RestaurantTable, b: RestaurantTable) {
  return tableSortValue(a).localeCompare(tableSortValue(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

// ------------------------------ Dashboard --------------------------------
export function useDashboardMetrics() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.dashboard(tenantId) : ['dashboard', 'none'],
    queryFn: () => restaurantService.getDashboardMetrics(requireTenantId(tenantId)),
    enabled: Boolean(tenantId),
    refetchInterval: 30_000, // live-ish for ops floor
  });
}

export function useUpdateRestaurantInfo() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (data: Partial<Tenant>) => restaurantService.updateInfo(requireTenantId(tenantId), data),
    onSuccess: (tenant) => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: qk.dashboard(tenantId) });
      }
      if (user) {
        setUser({
          ...user,
          tenant: {
            ...user.tenant,
            ...tenant,
          },
        });
      }
      toast.success('Restaurant profile saved');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save restaurant profile';
      toast.error(errorMessage);
    },
  });
}

// ------------------------------ Tables -----------------------------------
export function useTables() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.tables(tenantId) : ['tables', 'none'],
    queryFn: () => restaurantService.getTables(requireTenantId(tenantId)),
    select: (tables) => [...tables].sort(compareTablesAsc),
    enabled: Boolean(tenantId),
  });
}

export function useUpdateTable() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: Partial<RestaurantTable> }) =>
      restaurantService.updateTable(requireTenantId(tenantId), tableId, data),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.tables(tenantId) });
      toast.success('Table updated');
    },
  });
}

export function useDeleteTable() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableId: string) => restaurantService.deleteTable(requireTenantId(tenantId), tableId),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.tables(tenantId) });
      toast.success('Table deleted');
    },
    onError: () => {
      toast.error('Failed to delete table');
    },
  });
}

export function useCreateBulkTables() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tables: Partial<RestaurantTable>[]) =>
      restaurantService.createBulkTables(requireTenantId(tenantId), tables),
    onSuccess: (created) => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.tables(tenantId) });
      toast.success(`${created.length} table(s) created successfully with QR codes`);
    },
    onError: () => {
      toast.error('Failed to create tables');
    },
  });
}

// -------------------------------- Menu -----------------------------------
export function useCategories() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.categories(tenantId) : ['categories', 'none'],
    queryFn: () => restaurantService.getCategories(requireTenantId(tenantId)),
    enabled: Boolean(tenantId),
  });
}

export function useMenuItems() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.items(tenantId) : ['items', 'none'],
    queryFn: () => restaurantService.getItems(requireTenantId(tenantId)),
    enabled: Boolean(tenantId),
  });
}

export function useCreateItem() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MenuItem>) => restaurantService.createItem(requireTenantId(tenantId), data),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.items(tenantId) });
      toast.success('Item created');
    },
  });
}

export function useCreateItemsBulk() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Partial<MenuItem>[]) => restaurantService.createItemsBulk(requireTenantId(tenantId), items),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.items(tenantId) });
      toast.success('Items imported');
    },
  });
}

export function useUpdateItem() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) =>
      restaurantService.updateItem(requireTenantId(tenantId), id, data),
    // Optimistic toggle for availability flips & price tweaks — feels instant.
    onMutate: async ({ id, data }) => {
      if (!tenantId) return { prev: undefined };
      await qc.cancelQueries({ queryKey: qk.items(tenantId) });
      const prev = qc.getQueryData<MenuItem[]>(qk.items(tenantId));
      if (prev) {
        qc.setQueryData<MenuItem[]>(
          qk.items(tenantId),
          prev.map((it) => (it.id === id ? { ...it, ...data } : it)),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (tenantId && ctx?.prev) qc.setQueryData(qk.items(tenantId), ctx.prev);
      toast.error('Could not save changes');
    },
    onSettled: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.items(tenantId) });
    },
  });
}

export function useDeleteItem() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restaurantService.deleteItem(requireTenantId(tenantId), id),
    onMutate: async (id) => {
      if (!tenantId) return { prev: undefined };
      await qc.cancelQueries({ queryKey: qk.items(tenantId) });
      const prev = qc.getQueryData<MenuItem[]>(qk.items(tenantId));
      if (prev) {
        qc.setQueryData<MenuItem[]>(
          qk.items(tenantId),
          prev.filter((item) => item.id !== id),
        );
      }
      return { prev };
    },
    onSuccess: () => {
      toast.success('Item deleted');
    },
    onError: (_err, _id, ctx) => {
      if (tenantId && ctx?.prev) qc.setQueryData(qk.items(tenantId), ctx.prev);
      toast.error('Failed to delete item');
    },
    onSettled: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.items(tenantId) });
    },
  });
}

export function useUpdateItemVariants() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, variants }: { id: string; variants: Partial<MenuVariant>[] }) =>
      restaurantService.updateItemVariants(requireTenantId(tenantId), id, variants),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.items(tenantId) });
      toast.success('Variants updated');
    },
  });
}

export function useUpdateItemAddons() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, addons }: { id: string; addons: Partial<MenuAddon>[] }) =>
      restaurantService.updateItemAddons(requireTenantId(tenantId), id, addons),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.items(tenantId) });
      toast.success('Add-ons updated');
    },
  });
}

export function useBulkUpdateImages() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => restaurantService.bulkUpdateImages(requireTenantId(tenantId)),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.items(tenantId) });
      toast.success('Image update started');
    },
  });
}

export function useCreateCategory() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Pick<MenuCategory, 'name'> & { sort_order?: number }) =>
      restaurantService.createCategory(requireTenantId(tenantId), data),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.categories(tenantId) });
      toast.success('Category created');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || error?.message || 'Could not create category');
    },
  });
}

// -------------------------------- Orders ---------------------------------
export function useOrders(filters?: { status?: OrderStatus }) {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.orders(tenantId, filters) : ['orders', 'none', filters],
    queryFn: () => restaurantService.getOrders(requireTenantId(tenantId), filters),
    enabled: Boolean(tenantId),
    refetchInterval: 15_000,
  });
}

export function useUpdateOrderStatus() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      restaurantService.updateOrderStatus(requireTenantId(tenantId), orderId, status),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['orders', tenantId] });
        qc.invalidateQueries({ queryKey: qk.dashboard(tenantId) });
      }
      toast.success('Order status updated');
    },
    onError: (error: any) => {
      console.error('Error updating order status:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update order status';
      toast.error(errorMessage);
    },
  });
}

export function useUpdateOrderPaymentStatus() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, paymentStatus }: { orderId: string; paymentStatus: PaymentStatus }) =>
      restaurantService.updateOrderPaymentStatus(requireTenantId(tenantId), orderId, paymentStatus),
    onSuccess: () => {
      if (tenantId) {
        qc.invalidateQueries({ queryKey: ['orders', tenantId] });
        qc.invalidateQueries({ queryKey: qk.dashboard(tenantId) });
      }
      toast.success('Payment marked as received');
    },
    onError: (error: any) => {
      console.error('Error updating payment status:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update payment status';
      toast.error(errorMessage);
    },
  });
}

// ------------------------------ Reports ----------------------------------
export function useRevenueReport(
  period: 'day' | 'week' | 'month' | 'year' = 'week',
  dates: { startDate: string; endDate: string },
) {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.reports.revenue(tenantId, period, dates) : ['reports', 'none', 'revenue', period, dates],
    queryFn: () => restaurantService.getRevenueReport(requireTenantId(tenantId), period, dates),
    enabled: Boolean(tenantId),
  });
}

export function useProductReport(dates: { startDate: string; endDate: string }) {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.reports.products(tenantId, dates) : ['reports', 'none', 'products', dates],
    queryFn: () => restaurantService.getProductReport(requireTenantId(tenantId), dates),
    enabled: Boolean(tenantId),
  });
}

// ------------------------------ Combos -----------------------------------
export function useCombos() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.combos(tenantId) : ['combos', 'none'],
    queryFn: () => restaurantService.getCombos(requireTenantId(tenantId)),
    enabled: Boolean(tenantId),
  });
}

export function useCreateCombo() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ComboOffer>) => restaurantService.createCombo(requireTenantId(tenantId), data),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.combos(tenantId) });
      toast.success('Combo created');
    },
  });
}

export function useUpdateCombo() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ComboOffer> }) =>
      restaurantService.updateCombo(requireTenantId(tenantId), id, data),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.combos(tenantId) });
      toast.success('Combo updated');
    },
  });
}

export function useDeleteCombo() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restaurantService.deleteCombo(requireTenantId(tenantId), id),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.combos(tenantId) });
      toast.success('Combo deleted');
    },
  });
}

// ----------------------- Tax configuration -------------------------------
export function useTaxConfig() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? ['tax-config', tenantId] : ['tax-config', 'none'],
    queryFn: () => restaurantService.getTaxConfig(requireTenantId(tenantId)),
    enabled: Boolean(tenantId),
  });
}

export function useSaveTaxConfig() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaxConfig) => restaurantService.updateTaxConfig(requireTenantId(tenantId), data),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: ['tax-config', tenantId] });
      toast.success('Tax settings saved');
    },
    onError: () => {
      toast.error('Failed to save tax settings');
    },
  });
}

// ----------------------- Payment / integrations --------------------------
export function usePaymentSettings() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.paymentSettings(tenantId) : ['payment-settings', 'none'],
    queryFn: () => restaurantService.getPaymentSettings(requireTenantId(tenantId)),
    enabled: Boolean(tenantId),
  });
}

export function useSavePaymentSettings() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PaymentSettings) => restaurantService.updatePaymentSettings(requireTenantId(tenantId), data),
    onSuccess: () => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.paymentSettings(tenantId) });
      toast.success('Payment settings saved');
    },
    onError: () => toast.error('Failed to save payment settings'),
  });
}

export function usePaymentConfig(provider: PaymentProvider) {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.paymentConfig(tenantId, provider) : ['payment-config', 'none', provider],
    queryFn: () => restaurantService.getPaymentConfig(requireTenantId(tenantId), provider),
    enabled: Boolean(tenantId),
  });
}

export function useSavePaymentConfig() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PaymentConfig) => restaurantService.savePaymentConfig(requireTenantId(tenantId), data),
    onSuccess: (_data, vars) => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.paymentConfig(tenantId, vars.provider) });
      toast.success('Payment configuration saved');
    },
  });
}

export function useIntegrationConfig(provider: IntegrationProvider) {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: tenantId ? qk.integrationConfig(tenantId, provider) : ['integration-config', 'none', provider],
    queryFn: () => restaurantService.getIntegrationConfig(requireTenantId(tenantId), provider),
    enabled: Boolean(tenantId),
  });
}

export function useSaveIntegrationConfig() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, data }: { provider: IntegrationProvider; data: Partial<IntegrationConfig> }) =>
      restaurantService.saveIntegrationConfig(requireTenantId(tenantId), provider, data),
    onSuccess: (_data, vars) => {
      if (tenantId) qc.invalidateQueries({ queryKey: qk.integrationConfig(tenantId, vars.provider) });
      toast.success('Integration saved');
    },
  });
}

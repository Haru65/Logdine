import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurant.service';
import { qk } from '@/api/queryClient';
import { useAuthStore, selectTenantId } from '@/store/auth.store';
import type { MenuCategory, MenuItem, OrderStatus, RestaurantTable } from '@/types';
import { toast } from 'sonner';

/** Resolve the active tenantId from the auth store. Throws inside hooks
 * that absolutely require one (callers are admin-only routes). */
function useTenantId() {
  const tenantId = useAuthStore(selectTenantId);
  if (!tenantId) throw new Error('useTenantId() called without an authenticated tenant');
  return tenantId;
}

// ------------------------------ Dashboard --------------------------------
export function useDashboardMetrics() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: qk.dashboard(tenantId),
    queryFn: () => restaurantService.getDashboardMetrics(tenantId),
    refetchInterval: 30_000, // live-ish for ops floor
  });
}

// ------------------------------ Tables -----------------------------------
export function useTables() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: qk.tables(tenantId),
    queryFn: () => restaurantService.getTables(tenantId),
  });
}

export function useUpdateTable() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: Partial<RestaurantTable> }) =>
      restaurantService.updateTable(tenantId, tableId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tables(tenantId) });
      toast.success('Table updated');
    },
  });
}

// -------------------------------- Menu -----------------------------------
export function useCategories() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: qk.categories(tenantId),
    queryFn: () => restaurantService.getCategories(tenantId),
  });
}

export function useMenuItems() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: qk.items(tenantId),
    queryFn: () => restaurantService.getItems(tenantId),
  });
}

export function useCreateItem() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MenuItem>) => restaurantService.createItem(tenantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.items(tenantId) });
      toast.success('Item created');
    },
  });
}

export function useUpdateItem() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) =>
      restaurantService.updateItem(tenantId, id, data),
    // Optimistic toggle for availability flips & price tweaks — feels instant.
    onMutate: async ({ id, data }) => {
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
      if (ctx?.prev) qc.setQueryData(qk.items(tenantId), ctx.prev);
      toast.error('Could not save changes');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.items(tenantId) }),
  });
}

export function useDeleteItem() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restaurantService.deleteItem(tenantId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.items(tenantId) });
      toast.success('Item deleted');
    },
  });
}

export function useCreateCategory() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MenuCategory>) => restaurantService.createCategory(tenantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories(tenantId) }),
  });
}

// -------------------------------- Orders ---------------------------------
export function useOrders(filters?: { status?: OrderStatus }) {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: qk.orders(tenantId, filters),
    queryFn: () => restaurantService.getOrders(tenantId, filters),
    refetchInterval: 15_000,
  });
}

export function useUpdateOrderStatus() {
  const tenantId = useTenantId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      restaurantService.updateOrderStatus(tenantId, orderId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', tenantId] });
      qc.invalidateQueries({ queryKey: qk.dashboard(tenantId) });
      toast.success('Order status updated');
    },
  });
}

// ------------------------------ Reports ----------------------------------
export function useRevenueReport(period: 'day' | 'week' | 'month' | 'year' = 'week') {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: qk.reports.revenue(tenantId, period),
    queryFn: () => restaurantService.getRevenueReport(tenantId, period),
  });
}

export function useProductReport() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: qk.reports.products(tenantId),
    queryFn: () => restaurantService.getProductReport(tenantId),
  });
}

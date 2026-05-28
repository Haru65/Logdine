import apiClient, { unwrap } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type {
  DashboardMetrics,
  MenuAddon,
  MenuCategory,
  MenuItem,
  MenuVariant,
  Offer,
  Order,
  OrderStatus,
  ProductReport,
  RestaurantTable,
  RevenueReport,
  Tenant,
} from '@/types';

/**
 * Restaurant-scoped API methods. Each method takes `tenantId` explicitly
 * so the surface is testable and stateless.
 */
export const restaurantService = {
  // -------------------------- Superadmin tenants ---------------------------
  async getTenants(): Promise<Tenant[]> {
    const res = await apiClient.get(endpoints.superadmin.tenants);
    return unwrap<Tenant[]>(res.data);
  },

  async getTenantById(id: string): Promise<Tenant> {
    const res = await apiClient.get(endpoints.superadmin.tenant(id));
    return unwrap<Tenant>(res.data);
  },

  async createTenant(data: Partial<Tenant> | FormData): Promise<Tenant> {
    const res = await apiClient.post(endpoints.superadmin.tenants, data);
    return unwrap<Tenant>(res.data);
  },

  async updateTenant(id: string, data: Partial<Tenant> | FormData): Promise<Tenant> {
    const res = await apiClient.put(endpoints.superadmin.tenant(id), data);
    return unwrap<Tenant>(res.data);
  },

  async deleteTenant(id: string): Promise<void> {
    await apiClient.delete(endpoints.superadmin.tenant(id));
  },

  async pauseTenant(id: string): Promise<Tenant> {
    const res = await apiClient.patch(endpoints.superadmin.pause(id));
    return unwrap<Tenant>(res.data);
  },

  async resumeTenant(id: string): Promise<Tenant> {
    const res = await apiClient.patch(endpoints.superadmin.resume(id));
    return unwrap<Tenant>(res.data);
  },

  // ----------------------- Restaurant info / dashboard -----------------------
  async getInfo(tenantId: string): Promise<Tenant> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).info);
    return unwrap<Tenant>(res.data);
  },

  async getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).dashboardMetrics);
    return unwrap<DashboardMetrics>(res.data);
  },

  // -------------------------------- Tables -----------------------------------
  async getTables(tenantId: string): Promise<RestaurantTable[]> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).tables);
    return unwrap<RestaurantTable[]>(res.data);
  },

  async createTable(tenantId: string, data: Partial<RestaurantTable>): Promise<RestaurantTable> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).tables, data);
    return unwrap<RestaurantTable>(res.data);
  },

  async createBulkTables(
    tenantId: string,
    tables: Partial<RestaurantTable>[],
  ): Promise<RestaurantTable[]> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).tablesBulk, { tables });
    return unwrap<RestaurantTable[]>(res.data);
  },

  async updateTable(
    tenantId: string,
    tableId: string,
    data: Partial<RestaurantTable>,
  ): Promise<RestaurantTable> {
    const res = await apiClient.put(endpoints.restaurant(tenantId).table(tableId), data);
    return unwrap<RestaurantTable>(res.data);
  },

  async deleteTable(tenantId: string, tableId: string): Promise<void> {
    await apiClient.delete(endpoints.restaurant(tenantId).table(tableId));
  },

  // -------------------------------- Menu -------------------------------------
  async getCategories(tenantId: string): Promise<MenuCategory[]> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).categories);
    return unwrap<MenuCategory[]>(res.data);
  },

  async createCategory(tenantId: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).categories, data);
    return unwrap<MenuCategory>(res.data);
  },

  async updateCategory(
    tenantId: string,
    id: string,
    data: Partial<MenuCategory>,
  ): Promise<MenuCategory> {
    const res = await apiClient.put(endpoints.restaurant(tenantId).category(id), data);
    return unwrap<MenuCategory>(res.data);
  },

  async deleteCategory(tenantId: string, id: string): Promise<void> {
    await apiClient.delete(endpoints.restaurant(tenantId).category(id));
  },

  async getItems(tenantId: string): Promise<MenuItem[]> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).items);
    return unwrap<MenuItem[]>(res.data);
  },

  async createItem(tenantId: string, data: Partial<MenuItem>): Promise<MenuItem> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).items, data);
    return unwrap<MenuItem>(res.data);
  },

  async createItemsBulk(tenantId: string, items: Partial<MenuItem>[]): Promise<MenuItem[]> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).itemsBulk, { items });
    return unwrap<MenuItem[]>(res.data);
  },

  async updateItem(tenantId: string, id: string, data: Partial<MenuItem>): Promise<MenuItem> {
    const res = await apiClient.put(endpoints.restaurant(tenantId).item(id), data);
    return unwrap<MenuItem>(res.data);
  },

  async deleteItem(tenantId: string, id: string): Promise<void> {
    await apiClient.delete(endpoints.restaurant(tenantId).item(id));
  },

  async deleteAllMenuItems(tenantId: string): Promise<void> {
    await apiClient.delete(endpoints.restaurant(tenantId).allItems);
  },

  async uploadItemImage(tenantId: string, id: string, file: File): Promise<{ url: string }> {
    const fd = new FormData();
    fd.append('image', file);
    const res = await apiClient.post(endpoints.restaurant(tenantId).itemImage(id), fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<{ url: string }>(res.data);
  },

  async autoGenerateItemImage(tenantId: string, id: string, prompt?: string): Promise<{ url: string }> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).itemAutoImage(id), { prompt });
    return unwrap<{ url: string }>(res.data);
  },

  async bulkUpdateImages(tenantId: string, data?: Record<string, unknown>): Promise<unknown> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).bulkUpdateImages, data ?? {});
    return unwrap<unknown>(res.data);
  },

  // ---------------------------- Addons / Variants ----------------------------
  async getMenuItemAddons(tenantId: string, id: string): Promise<MenuAddon[]> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).itemAddons(id));
    const data = unwrap<MenuAddon[] | { addons: MenuAddon[] }>(res.data);
    return Array.isArray(data) ? data : data.addons;
  },

  async updateItemAddons(tenantId: string, id: string, addons: Partial<MenuAddon>[]): Promise<MenuAddon[]> {
    const res = await apiClient.put(endpoints.restaurant(tenantId).itemAddons(id), { addons });
    return unwrap<MenuAddon[]>(res.data);
  },

  async deleteMenuItemAddon(tenantId: string, id: string, addonId: string): Promise<void> {
    await apiClient.delete(endpoints.restaurant(tenantId).itemAddon(id, addonId));
  },

  async updateItemVariants(
    tenantId: string,
    id: string,
    variants: Partial<MenuVariant>[],
  ): Promise<MenuVariant[]> {
    const res = await apiClient.put(endpoints.restaurant(tenantId).itemVariants(id), { variants });
    return unwrap<MenuVariant[]>(res.data);
  },

  async getMenuItemVariants(tenantId: string, id: string): Promise<MenuVariant[]> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).itemVariants(id));
    const data = unwrap<MenuVariant[] | { variants: MenuVariant[] }>(res.data);
    return Array.isArray(data) ? data : data.variants;
  },

  async deleteMenuItemVariant(tenantId: string, id: string, variantId: string): Promise<void> {
    await apiClient.delete(endpoints.restaurant(tenantId).itemVariant(id, variantId));
  },

  // -------------------------------- Orders -----------------------------------
  async getOrders(
    tenantId: string,
    filters?: { status?: OrderStatus; from?: string; to?: string; type?: string },
  ): Promise<Order[]> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).orders, { params: filters });
    return unwrap<Order[]>(res.data);
  },

  async getOrder(tenantId: string, orderId: string): Promise<Order> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).order(orderId));
    return unwrap<Order>(res.data);
  },

  async getOrderById(tenantId: string, orderId: string): Promise<Order> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).order(orderId));
    return unwrap<Order>(res.data);
  },

  async updateOrderStatus(tenantId: string, orderId: string, status: OrderStatus): Promise<Order> {
    const res = await apiClient.patch(endpoints.restaurant(tenantId).order(orderId), { status });
    return unwrap<Order>(res.data);
  },

  async updateOrderItemStatus(
    tenantId: string,
    orderId: string,
    itemId: string,
    data: Record<string, unknown>,
  ): Promise<Order> {
    const res = await apiClient.put(endpoints.restaurant(tenantId).orderItem(orderId, itemId), data);
    return unwrap<Order>(res.data);
  },

  // ------------------------------- Reports -----------------------------------
  async getRevenueReport(
    tenantId: string,
    period: 'day' | 'week' | 'month' | 'year',
    dates?: { from?: string; to?: string },
  ): Promise<RevenueReport> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).revenueReport, {
      params: { period, ...dates },
    });
    return unwrap<RevenueReport>(res.data);
  },

  async getProductReport(tenantId: string): Promise<ProductReport[]> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).productsReport);
    return unwrap<ProductReport[]>(res.data);
  },

  async getOrderReport(
    tenantId: string,
    dates?: { from?: string; to?: string },
    filters?: Record<string, unknown>,
  ): Promise<unknown> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).ordersReport, {
      params: { ...dates, ...filters },
    });
    return unwrap<unknown>(res.data);
  },

  async getSummaryReport(tenantId: string): Promise<unknown> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).summaryReport);
    return unwrap<unknown>(res.data);
  },

  // ---------------------------- Tax & config -------------------------------
  async getTaxConfig(tenantId: string): Promise<unknown> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).taxConfig);
    return unwrap<unknown>(res.data);
  },

  async updateTaxConfig(tenantId: string, config: Record<string, unknown>): Promise<unknown> {
    const res = await apiClient.put(endpoints.restaurant(tenantId).taxConfig, config);
    return unwrap<unknown>(res.data);
  },

  async getTaxLogs(tenantId: string): Promise<unknown[]> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).taxLogs);
    return unwrap<unknown[]>(res.data);
  },

  async getIntegrationConfig(tenantId: string, provider: string): Promise<unknown> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).integrationConfig(provider));
    return unwrap<unknown>(res.data);
  },

  async saveIntegrationConfig(
    tenantId: string,
    provider: string,
    config: Record<string, unknown>,
  ): Promise<unknown> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).integrationConfig(provider), config);
    return unwrap<unknown>(res.data);
  },

  async getEmailConfig(tenantId: string): Promise<unknown[]> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).emailConfig);
    return unwrap<unknown[]>(res.data);
  },

  async createEmailConfig(tenantId: string, config: Record<string, unknown>): Promise<unknown> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).emailConfig, config);
    return unwrap<unknown>(res.data);
  },

  async updateEmailConfig(
    tenantId: string,
    configId: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    const res = await apiClient.put(endpoints.restaurant(tenantId).emailConfigById(configId), data);
    return unwrap<unknown>(res.data);
  },

  // ----------------------------- Offers --------------------------------------
  async getOffers(tenantId: string): Promise<Offer[]> {
    const res = await apiClient.get(endpoints.restaurant(tenantId).offers);
    return unwrap<Offer[]>(res.data);
  },

  async createOffer(tenantId: string, data: Partial<Offer>): Promise<Offer> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).offers, data);
    return unwrap<Offer>(res.data);
  },

  async updateOffer(tenantId: string, id: string, data: Partial<Offer>): Promise<Offer> {
    const res = await apiClient.put(endpoints.restaurant(tenantId).offer(id), data);
    return unwrap<Offer>(res.data);
  },

  async deleteOffer(tenantId: string, id: string): Promise<void> {
    await apiClient.delete(endpoints.restaurant(tenantId).offer(id));
  },

  // --------------------------- Menu extraction ------------------------------
  async convertToJson(tenantId: string, data: Record<string, unknown>): Promise<unknown> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).convertToJson, data);
    return unwrap<unknown>(res.data);
  },

  async processOcr(tenantId: string, file: File): Promise<unknown> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiClient.post(endpoints.restaurant(tenantId).ocrProcess, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<unknown>(res.data);
  },

  async extractFromImage(tenantId: string, file: File): Promise<unknown> {
    const fd = new FormData();
    fd.append('image', file);
    const res = await apiClient.post(endpoints.restaurant(tenantId).extractImage, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<unknown>(res.data);
  },

  async extractFromPDF(tenantId: string, file: File): Promise<unknown> {
    const fd = new FormData();
    fd.append('pdf', file);
    const res = await apiClient.post(endpoints.restaurant(tenantId).extractPdf, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<unknown>(res.data);
  },

  async importExtracted(
    tenantId: string,
    items: unknown[],
    options?: Record<string, unknown>,
  ): Promise<unknown> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).importExtracted, {
      items,
      ...options,
    });
    return unwrap<unknown>(res.data);
  },

  async extractAndImport(tenantId: string, file: File): Promise<unknown> {
    const fd = new FormData();
    fd.append('image', file);
    const res = await apiClient.post(endpoints.restaurant(tenantId).extractAndImport, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap<unknown>(res.data);
  },

  async enrichItems(tenantId: string, data: Record<string, unknown>): Promise<unknown> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).enrichItems, data);
    return unwrap<unknown>(res.data);
  },

  async importEnriched(tenantId: string, data: Record<string, unknown>): Promise<unknown> {
    const res = await apiClient.post(endpoints.restaurant(tenantId).importEnriched, data);
    return unwrap<unknown>(res.data);
  },
};

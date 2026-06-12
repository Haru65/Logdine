import apiClient, { unwrap } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { MenuAddon, MenuCategory, MenuItem, MenuVariant, Order, PaymentMethod, RestaurantTable, Tenant } from '@/types';

export interface PublicMenuResponse {
  restaurant: Tenant;
  table: RestaurantTable;
  categories: MenuCategory[];
  items: MenuItem[];
  paymentOptions?: {
    cash?: { isAvailable: boolean };
    paytm?: {
      isAvailable: boolean;
      accountId?: string | null;
      accountLabel?: string | null;
    };
  };
  taxConfig?: {
    taxTypes?: Array<{
      id: string;
      name: string;
      percentage: number;
      isActive: boolean | number | string;
    }>;
    gstin?: string;
  } | null;
}

type PublicMenuCategory = MenuCategory & { items?: MenuItem[] };

const toBool = (value: unknown) => value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

function normalizePublicMenuItem(item: MenuItem, categoryId?: string): MenuItem {
  return {
    ...item,
    category_id: item.category_id ?? categoryId ?? '',
    price: Number(item.price ?? 0),
    is_veg: toBool(item.is_veg),
    is_spicy: toBool(item.is_spicy),
    is_available: toBool(item.is_available),
    variants: (item.variants ?? [])
      .filter((variant) => variant.is_available === undefined || toBool(variant.is_available))
      .map((variant) => ({
        ...variant,
        price: Number(variant.price ?? 0),
        is_available: variant.is_available === undefined ? true : toBool(variant.is_available),
      })),
    addons: (item.addons ?? [])
      .filter((addon) => addon.is_available === undefined || toBool(addon.is_available))
      .map((addon) => ({
        ...addon,
        price: Number(addon.price ?? 0),
        is_available: addon.is_available === undefined ? true : toBool(addon.is_available),
      })),
  };
}

export interface CreateOrderPayload {
  items: Array<{
    menu_item_id: string;
    quantity: number;
    selectedVariant?: Pick<MenuVariant, 'id' | 'name' | 'price'> | null;
    selectedAddons?: Array<Pick<MenuAddon, 'id' | 'name' | 'price'>>;
    notes?: string;
  }>;
  paymentMethod: PaymentMethod;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
}

export const publicOrderService = {
  async health(): Promise<{ status: string; serverTime: string; timestamp: number }> {
    const res = await apiClient.get(endpoints.public.health);
    return unwrap(res.data);
  },

  async getMenu(slug: string, qrToken: string): Promise<PublicMenuResponse> {
    const res = await apiClient.get(endpoints.public.menu(slug, qrToken));
    const data = unwrap<Omit<PublicMenuResponse, 'categories' | 'items'> & {
      categories?: PublicMenuCategory[];
      items?: MenuItem[];
    }>(res.data);
    const categories: PublicMenuCategory[] = (data.categories ?? []).map((category) => ({
      ...category,
      items: (category.items ?? []).map((item) => normalizePublicMenuItem(item, category.id)),
    }));
    const items = data.items?.map((item) => normalizePublicMenuItem(item)) ?? categories.flatMap((category) => category.items ?? []);

    return {
      ...data,
      table: {
        ...data.table,
        table_number: data.table.table_number ?? data.table.name ?? 'Table',
        status: data.table.status ?? 'available',
        capacity: Number(data.table.capacity ?? 4),
      },
      categories,
      items,
    };
  },

  async getTableOrders(slug: string, qrToken: string): Promise<Order[]> {
    const res = await apiClient.get(endpoints.public.tableOrders(slug, qrToken));
    return unwrap<Order[]>(res.data);
  },

  async createOrder(slug: string, qrToken: string, payload: CreateOrderPayload): Promise<Order> {
    const res = await apiClient.post(endpoints.public.order(slug, qrToken), payload);
    return unwrap<Order>(res.data);
  },

  async getOrderStatus(slug: string, orderId: string): Promise<Order> {
    const res = await apiClient.get(endpoints.public.orderStatus(slug, orderId));
    return unwrap<Order>(res.data);
  },

  async cancelOrder(slug: string, orderId: string): Promise<Order> {
    const res = await apiClient.patch(endpoints.public.orderStatus(slug, orderId), {
      status: 'cancelled',
    });
    return unwrap<Order>(res.data);
  },

  async createPaymentOrder(payload: {
    orderId: string;
    slug: string;
    amount: number;
    method: PaymentMethod;
  }): Promise<{ orderId: string; key: string; amount: number }> {
    const res = await apiClient.post(endpoints.public.paymentCreate, payload);
    return unwrap(res.data);
  },

  async verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean }> {
    const res = await apiClient.post(endpoints.public.paymentVerify, payload);
    return unwrap(res.data);
  },

  async createPaytmTransaction(payload: Record<string, unknown>): Promise<{
    orderId: string;
    amount: number;
    txnToken: string;
    merchantId: string;
    paymentUrl: string;
    website: string;
    currency: 'INR';
    restaurantName: string;
  }> {
    const res = await apiClient.post(endpoints.paytm.createTransaction, payload);
    return unwrap(res.data);
  },

  async verifyPaytmPayment(payload: Record<string, unknown>): Promise<unknown> {
    const res = await apiClient.post(endpoints.paytm.verify, payload);
    return unwrap<unknown>(res.data);
  },
};

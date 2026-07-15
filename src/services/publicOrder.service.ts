import apiClient, { unwrap } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { ComboOffer, MenuAddon, MenuCategory, MenuItem, MenuVariant, Order, PaymentMethod, RestaurantTable, TaxConfig, Tenant } from '@/types';
import { normalizeTaxConfig } from '@/lib/taxes';

export interface PublicMenuResponse {
  restaurant: Tenant;
  table: RestaurantTable;
  categories: MenuCategory[];
  items: MenuItem[];
  combos?: ComboOffer[];
  paymentOptions?: {
    cash?: { isAvailable: boolean };
    paytm?: {
      isAvailable: boolean;
      accountId?: string | null;
      accountLabel?: string | null;
    };
  };
  taxConfig?: TaxConfig | null;
}

export type PublicPaymentOptions = NonNullable<PublicMenuResponse['paymentOptions']>;

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

function normalizeCombo(combo: ComboOffer): ComboOffer {
  return {
    ...combo,
    combo_price: Number(combo.combo_price ?? 0),
    original_price: Number(combo.original_price ?? 0),
    is_active: toBool(combo.is_active),
    items: (combo.items ?? []).map((item) => ({
      ...item,
      quantity: Number(item.quantity ?? 1),
      item_price: Number(item.item_price ?? 0),
    })),
  };
}

export interface CreateOrderPayload {
  items: Array<{
    menu_item_id?: string;
    combo_id?: string;
    quantity: number;
    selectedVariant?: Pick<MenuVariant, 'id' | 'name' | 'price'> | null;
    selectedAddons?: Array<Pick<MenuAddon, 'id' | 'name' | 'price'>>;
    notes?: string;
  }>;
  paymentMethod: PaymentMethod;
  paymentAccountId?: string;
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
      combos?: ComboOffer[];
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
      combos: (data.combos ?? []).map(normalizeCombo),
      taxConfig: normalizeTaxConfig(data.taxConfig),
      paymentOptions: {
        cash: {
          isAvailable: data.paymentOptions?.cash?.isAvailable === undefined
            ? true
            : toBool(data.paymentOptions.cash.isAvailable),
        },
        paytm: {
          ...data.paymentOptions?.paytm,
          isAvailable: toBool(data.paymentOptions?.paytm?.isAvailable),
        },
      },
    };
  },

  async getCheckoutOptions(slug: string, qrToken: string): Promise<PublicPaymentOptions> {
    const res = await apiClient.get(endpoints.public.checkoutOptions(slug, qrToken));
    const data = unwrap<{ paymentOptions?: PublicMenuResponse['paymentOptions'] }>(res.data);

    return {
      cash: {
        isAvailable: data.paymentOptions?.cash?.isAvailable === undefined
          ? true
          : toBool(data.paymentOptions.cash.isAvailable),
      },
      paytm: {
        ...data.paymentOptions?.paytm,
        isAvailable: toBool(data.paymentOptions?.paytm?.isAvailable),
      },
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

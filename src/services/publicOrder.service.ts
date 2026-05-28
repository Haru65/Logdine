import apiClient, { unwrap } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { MenuCategory, MenuItem, Order, PaymentMethod, RestaurantTable, Tenant } from '@/types';

export interface PublicMenuResponse {
  restaurant: Tenant;
  table: RestaurantTable;
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface CreateOrderPayload {
  items: Array<{
    menu_item_id: string;
    quantity: number;
    variants?: string[];
    addons?: string[];
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

  async getMenu(slug: string, table: string): Promise<PublicMenuResponse> {
    const res = await apiClient.get(endpoints.public.menu(slug, table));
    return unwrap<PublicMenuResponse>(res.data);
  },

  async getTableOrders(slug: string, table: string): Promise<Order[]> {
    const res = await apiClient.get(endpoints.public.tableOrders(slug, table));
    return unwrap<Order[]>(res.data);
  },

  async createOrder(slug: string, table: string, payload: CreateOrderPayload): Promise<Order> {
    const res = await apiClient.post(endpoints.public.order(slug, table), payload);
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

  async createPaytmTransaction(payload: Record<string, unknown>): Promise<unknown> {
    const res = await apiClient.post(endpoints.paytm.createTransaction, payload);
    return unwrap<unknown>(res.data);
  },

  async verifyPaytmPayment(payload: Record<string, unknown>): Promise<unknown> {
    const res = await apiClient.post(endpoints.paytm.verify, payload);
    return unwrap<unknown>(res.data);
  },
};

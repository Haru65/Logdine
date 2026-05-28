/**
 * RestroHub – Domain types.
 * These mirror the API response shapes described in API_DOCUMENTATION.md.
 * Keep this file canonical; services and components import from here.
 */

// --------------------------------------------------------------------
//  Auth & users
// --------------------------------------------------------------------
export type UserRole = 'superadmin' | 'restaurant_admin' | 'manager' | 'cashier' | 'kitchen';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  address?: string;
  contact_phone?: string;
  logo_url?: string;
  is_active?: boolean;
  is_paused?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  tenant?: Tenant;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// --------------------------------------------------------------------
//  Menu
// --------------------------------------------------------------------
export interface MenuCategory {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
  icon?: string;
}

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
  is_default?: boolean;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
  is_required?: boolean;
}

export interface MenuItem {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_veg: boolean;
  is_available: boolean;
  is_featured?: boolean;
  preparation_time?: number; // minutes
  tags?: string[];
  variants?: MenuVariant[];
  addons?: MenuAddon[];
}

// --------------------------------------------------------------------
//  Tables
// --------------------------------------------------------------------
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface RestaurantTable {
  id: string;
  tenant_id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  qr_code_url?: string;
  zone?: string;
}

// --------------------------------------------------------------------
//  Orders
// --------------------------------------------------------------------
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'served'
  | 'completed'
  | 'cancelled';

export type OrderType = 'dine_in' | 'take_away' | 'delivery';
export type PaymentMethod = 'cash' | 'card' | 'online' | 'upi';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name_snapshot: string;
  price_snapshot: number;
  quantity: number;
  variants?: MenuVariant[];
  addons?: MenuAddon[];
  notes?: string;
  status?: OrderStatus;
}

export interface Order {
  id: string;
  tenant_id: string;
  table_id?: string;
  table_number?: string;
  type: OrderType;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  subtotal?: number;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// --------------------------------------------------------------------
//  Reports & analytics
// --------------------------------------------------------------------
export interface DashboardMetrics {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  unpaid_bills: number;
  pending_kitchen: number;
  preparing_kitchen: number;
  ready_kitchen: number;
  revenue_trend?: { date: string; value: number }[];
  top_items?: { name: string; count: number; revenue: number }[];
}

export interface RevenueReport {
  period: string;
  total: number;
  breakdown: { label: string; value: number }[];
}

export interface ProductReport {
  product_id: string;
  name: string;
  quantity_sold: number;
  revenue: number;
}

// --------------------------------------------------------------------
//  Offers & promotions
// --------------------------------------------------------------------
export type OfferType = 'flat' | 'percentage' | 'bogo' | 'happy_hour';

export interface Offer {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  description?: string;
  type: OfferType;
  value: number;
  min_order_value?: number;
  max_discount?: number;
  starts_at?: string;
  ends_at?: string;
  is_active: boolean;
}

// --------------------------------------------------------------------
//  Cart (client-side POS state)
// --------------------------------------------------------------------
export interface CartItem {
  uid: string; // local UUID — distinguishes same item with diff addons
  menu_item_id: string;
  name: string;
  price: number; // unit price after variant
  quantity: number;
  variants: MenuVariant[];
  addons: MenuAddon[];
  notes?: string;
  image_url?: string;
}

// --------------------------------------------------------------------
//  API envelope
// --------------------------------------------------------------------
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
}

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
  tenant_type?: 'cafe' | 'restaurant' | 'lodging' | string;
  type?: 'cafe' | 'restaurant' | 'lodging' | string;
  source?: 'cafe' | 'restaurant' | 'lodging' | string;
  address?: string;
  contact_phone?: string;
  contact_email?: string;
  logo_url?: string;
  logoUrl?: string;
  logo?: string;
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
  is_available?: boolean;
  sort_order?: number;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
  is_required?: boolean;
  is_available?: boolean;
  sort_order?: number;
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
  is_spicy?: boolean;
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
  name?: string;
  identifier?: string;
  qr_token?: string;
  qrToken?: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  qr_code_url?: string;
  qr_url?: string;
  zone?: string;
  qr_scan_count?: number;
  last_qr_scan_at?: string | null;
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
  source_type?: string;
  order_source?: 'qr' | string;
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
  today_revenue?: number;
  yesterday_revenue?: number;
  revenue_growth_percent?: number | null;
  today_orders?: number;
  yesterday_orders?: number;
  orders_growth_percent?: number | null;
  avg_order_value_delta?: number;
  avg_order_value_growth_percent?: number | null;
  pending_kitchen: number;
  preparing_kitchen: number;
  ready_kitchen: number;
  revenue_trend?: { date: string; value: number }[];
  top_items?: { name: string; count: number; revenue: number }[];
}

export interface RevenueReport {
  period: string;
  data: {
    period: string;
    total_orders: number;
    total_revenue: number;
    total_tax?: number;
    total_discount?: number;
    avg_order_value?: number;
    paid_orders?: number;
    paid_revenue?: number;
    cash_orders?: number;
    cash_revenue?: number;
    online_orders?: number;
    online_revenue?: number;
  }[];
  summary: {
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
    payment_success_rate: number;
    cash_orders?: number;
    cash_revenue?: number;
    online_orders?: number;
    online_revenue?: number;
  };
}

export interface ProductReport {
  items: {
    id: string;
    name: string;
    category_name?: string;
    total_quantity: number;
    total_revenue: number;
    order_count?: number;
    avg_price?: number;
    current_price?: number;
    is_veg?: boolean | number;
    is_spicy?: boolean | number;
  }[];
  categories: {
    category_name: string;
    item_count: number;
    total_quantity: number;
    total_revenue: number;
  }[];
  summary: {
    total_items_sold: number;
    total_revenue: number;
    unique_items: number;
    top_item?: unknown;
  };
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

export interface ComboItem {
  id?: string;
  menu_item_id: string;
  quantity: number;
  item_name?: string;
  item_price?: number;
  item_image?: string;
}

export interface ComboOffer {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  combo_price: number;
  original_price?: number;
  image_url?: string;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  items?: ComboItem[];
  created_at?: string;
}

export type PaymentProvider = 'razorpay' | 'paytm';

export interface PaymentConfig {
  id?: string;
  accountId?: string;
  account_label?: string;
  accountLabel?: string;
  provider: PaymentProvider;
  key_id: string;
  key_secret?: string;
  webhook_secret?: string;
  website?: string;
  is_active?: boolean | number;
  isActive?: boolean | number;
  is_default?: boolean | number;
  isDefault?: boolean | number;
  accounts?: PaymentConfig[];
}

export interface TaxType {
  id: string;
  name: string;
  percentage: number;
  isActive: boolean;
}

export interface TaxConfig {
  taxTypes: TaxType[];
  totalTaxTypes?: number;
  gstin?: string;
}

export interface PaymentSettings {
  payAtCounterEnabled: boolean;
}

export type IntegrationProvider = 'zomato' | 'swiggy';

export interface IntegrationConfig {
  id?: string;
  provider: IntegrationProvider;
  webhook_url?: string;
  soapie_url?: string;
  api_key?: string;
  is_active?: boolean | number;
}

// --------------------------------------------------------------------
//  Cart (client-side POS state)
// --------------------------------------------------------------------
export interface CartItem {
  uid: string; // local UUID — distinguishes same item with diff addons
  menu_item_id: string;
  combo_id?: string;
  combo_items?: ComboItem[];
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

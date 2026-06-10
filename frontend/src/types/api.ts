// API Types for Ketupat Cinta Frontend

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

// ── User ──
export interface User {
  id: number;
  name: string;
  wa_number?: string;
  role: 'customer' | 'reseller' | 'admin';
  role_label: string;
  is_trusted: boolean;
  status: 'active' | 'inactive';
  avatar_url?: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ── Address ──
export interface UserAddress {
  id: number;
  user_id: number;
  label: string;
  detail: string;
  city: 'bandung' | 'cimahi';
  district?: string;
  map_link?: string;
  is_default: boolean;
}

// ── Product ──
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  price: string;
  price_normal: string;
  price_reseller?: string;
  min_order: number;
  min_order_customer: number;
  min_order_reseller?: number;
  stock_po_default?: number;
  status: string;
  po_schedules?: PoSchedule[];
  created_at: string;
}

// ── PO Schedule ──
export interface PoSchedule {
  id: number;
  product_id: number;
  schedule_date: string;
  schedule_date_formatted: string;
  allocated_stock: number;
  remaining_stock: number;
  status: 'open' | 'closed' | 'full';
  status_label: string;
  is_available: boolean;
  product?: Product;
}

// ── Cart ──
export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  po_schedule_id: number;
  qty: number;
  unit_price?: string;
  subtotal?: string;
  product: Product;
  poSchedule: PoSchedule;
}

// ── Order ──
export interface Order {
  id: number;
  order_number: string;
  user?: User;
  address?: {
    label?: string;
    detail: string;
    city: string;
    district?: string;
    map_link?: string;
  };
  subtotal_amount: string;
  shipping_cost: string;
  total_amount: string;
  shipping_method: string;
  shipping_method_label: string;
  payment_type: string;
  payment_type_label: string;
  order_status: OrderStatusValue;
  order_status_label: string;
  notes?: string;
  cancel_reason?: string;
  expired_at?: string;
  items?: OrderItem[];
  payment?: Payment;
  shipment?: Shipment;
  reseller_invoice?: Invoice;
  created_at: string;
  updated_at: string;
}

export type OrderStatusValue =
  | 'pending_payment'
  | 'waiting_verification'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  id: number;
  product?: Product;
  po_schedule?: PoSchedule;
  qty: number;
  unit_price: string;
  subtotal: string;
}

// ── Payment ──
export interface Payment {
  id: number;
  method: string;
  method_label: string;
  payment_status: string;
  payment_status_label: string;
  proof_image_url?: string;
  amount: string;
  paid_at?: string;
  expired_at?: string;
  verified_at?: string;
}

// ── Shipment ──
export interface Shipment {
  id: number;
  courier_name?: string;
  driver_name?: string;
  vehicle_number?: string;
  tracking_link?: string;
  tracking_number?: string;
  status: string;
  status_label: string;
  notes?: string;
  shipped_at?: string;
  delivered_at?: string;
}

// ── Invoice ──
export interface Invoice {
  id: number;
  invoice_number: string;
  user?: User;
  order?: Order;
  total_debt: string;
  paid_amount: string;
  remaining_debt: string;
  due_date: string;
  due_date_formatted: string;
  status: 'belum_ditagih' | 'menunggu_pembayaran' | 'terlambat' | 'lunas';
  status_label: string;
  is_overdue: boolean;
  created_at: string;
}

// ── Notification ──
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  channel: string;
  created_at: string;
  time_ago: string;
}

// ── Dashboard Stats ──
export interface DashboardStats {
  total_orders_today: number;
  orders_pending_payment: number;
  orders_processing: number;
  total_revenue: number;
  total_resellers: number;
  total_customers: number;
  overdue_invoices: number;
  total_unpaid_debt: number;
}

// ── Reseller Application ──
export interface ResellerApplication {
  id: number;
  user_id: number;
  user?: User;
  business_name: string;
  business_description?: string;
  motivation?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

// ── Form Types ──
export interface RegisterForm {
  name: string;
  wa_number: string;
  password: string;
  password_confirmation: string;
}

export interface LoginForm {
  wa_number: string;
  password: string;
}

export interface CheckoutForm {
  address_id: number;
  shipping_method: string;
  payment_type: 'transfer_manual' | 'qris_manual' | 'midtrans' | 'tempo';
  notes?: string;
}

export interface AddressForm {
  label?: string;
  detail: string;
  city: 'bandung' | 'cimahi';
  district?: string;
  map_link?: string;
  is_default?: boolean;
}

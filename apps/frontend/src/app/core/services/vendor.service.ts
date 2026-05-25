import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Product } from './product.service';

export interface VendorProductInput {
  name: string; slug?: string; sku?: string;
  description?: string; shortDescription?: string;
  categoryId: number; brandId?: number | null;
  basePrice: number; salePrice?: number | null; taxRate?: number;
  status?: 'draft' | 'active' | 'inactive';
  metaTitle?: string; metaDescription?: string; tags?: string[];
  hasVariants?: boolean;
  images?: { url: string; alt?: string; isPrimary?: boolean; sortOrder?: number }[];
  variants?: {
    sku: string; name?: string; price: number; salePrice?: number | null;
    attributes?: Record<string, string>; image?: string;
  }[];
}

export type VendorStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refund_requested' | 'refunded';

export interface VendorOrderItem {
  id: number;
  orderId: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  product?: { id: number; name: string; slug: string };
}

export interface VendorOrder {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAmount: number;
  trackingNumber: string | null;
  courier: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
  user?: { id: number; name: string; email: string; phone?: string };
  items: VendorOrderItem[];
  statusHistory?: { id: number; fromStatus: OrderStatus; toStatus: OrderStatus; note: string | null; createdAt: string }[];
}

export interface VendorProfile {
  id:             number;
  userId:         number;
  storeName:      string;
  storeSlug:      string;
  description:    string | null;
  logo:           string | null;
  banner:         string | null;
  website:        string | null;
  gstin:          string | null;
  pan:            string | null;
  commissionRate: number;
  status:         VendorStatus;
  isVerified:     boolean;
  totalProducts:  number;
  totalRevenue:   number;
  rating:         number;
  reviewCount:    number;
  address:        { line1: string; city: string; state: string; pincode: string } | null;
  bankDetails:    { accountHolder: string; accountNumber: string; ifsc: string; bankName: string } | null;
  user?:          { id: number; name: string; email: string; phone?: string };
}

// ─── Analytics ──────────────────────────────────────────────
export interface RevenueMonth { month: string; gross: number; net: number; orders: number; }
export interface TopProduct   { productId: number; name: string; revenue: number; unitsSold: number; }
export interface StatusCount  { status: string; count: number; }
export interface AnalyticsData {
  revenueByMonth: RevenueMonth[];
  topProducts: TopProduct[];
  statusBreakdown: StatusCount[];
  totals: { grossRevenue: number; netRevenue: number; ordersDelivered: number };
}

// ─── Inventory ──────────────────────────────────────────────
export interface InventoryRecord { id: number; variantId: number; qtyOnHand: number; qtyReserved: number; lowStockThreshold: number; }
export interface InventoryVariant {
  id: number; sku: string | null; name: string | null;
  price: number; attributes: Record<string, string> | null;
  product?: { id: number; name: string; slug: string };
  inventory?: InventoryRecord;
}

// ─── Customers ──────────────────────────────────────────────
export interface VendorCustomer {
  id: number; name: string; email: string; phone?: string;
  createdAt: string; totalOrders: number; totalSpend: number;
}

// ─── Coupons ────────────────────────────────────────────────
export interface VendorCoupon {
  id: number; code: string; type: 'percent' | 'fixed'; value: number;
  minOrderValue: number | null; maxDiscount: number | null;
  maxUses: number | null; usedCount: number;
  maxUsesPerUser: number | null; expiresAt: string | null;
  isActive: boolean; createdAt: string;
}
export interface CreateCouponInput {
  codeSuffix: string; type: 'percent' | 'fixed'; value: number;
  minOrderValue?: number; maxDiscount?: number; maxUses?: number;
  maxUsesPerUser?: number; expiresAt?: string;
}

// ─── Reviews ────────────────────────────────────────────────
export interface ProductReviewStat {
  id: number; name: string; slug: string; status: string;
  basePrice: number; rating: number; reviewCount: number;
  images?: { url: string }[];
}

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface EarningsOverview {
  grossEarned:        number;
  commissionDeducted: number;
  netEarned:          number;
  totalPaid:          number;
  pendingAmount:      number;
  available:          number;
  commissionRate:     number;
}

export interface VendorTransaction {
  id:          number;
  orderId:     number;
  productName: string;
  qty:         number;
  gross:       number;
  commission:  number;
  net:         number;
  createdAt:   string;
  order?:      { id: number; orderNumber: string; createdAt: string; paymentStatus: string };
  product?:    { id: number; name: string; slug: string };
}

export interface VendorPayout {
  id:          number;
  vendorId:    number;
  amount:      number;
  commission:  number;
  netAmount:   number;
  status:      PayoutStatus;
  reference:   string | null;
  paidAt:      string | null;
  periodFrom:  string | null;
  periodTo:    string | null;
  note:        string | null;
  createdAt:   string;
}

export interface DashboardStats {
  totalRevenue:      number;
  totalOrders:       number;
  totalProducts:     number;
  pendingOrders:     number;
  revenueThisMonth:  number;
  recentOrders:      unknown[];
}

@Injectable({ providedIn: 'root' })
export class VendorService {
  readonly #http = inject(HttpClient);
  readonly #base = `${environment.apiUrl}/api/v1`;

  apply(data: { storeName: string; description?: string; gstin?: string }): Observable<{ success: boolean; data: VendorProfile }> {
    return this.#http.post<{ success: boolean; data: VendorProfile }>(`${this.#base}/vendor/apply`, data);
  }

  getMyProfile(): Observable<{ success: boolean; data: VendorProfile }> {
    return this.#http.get<{ success: boolean; data: VendorProfile }>(`${this.#base}/vendor/profile`);
  }

  updateProfile(data: Partial<VendorProfile>): Observable<{ success: boolean; data: VendorProfile }> {
    return this.#http.patch<{ success: boolean; data: VendorProfile }>(`${this.#base}/vendor/profile`, data);
  }

  getDashboard(): Observable<{ success: boolean; data: DashboardStats }> {
    return this.#http.get<{ success: boolean; data: DashboardStats }>(`${this.#base}/vendor/dashboard`);
  }

  getMyProducts(page = 1, status?: string): Observable<{ success: boolean; data: Product[]; meta: { total: number; totalPages: number; page: number; limit: number } }> {
    let p = new HttpParams().set('page', page).set('limit', 20);
    if (status) p = p.set('status', status);
    return this.#http.get<any>(`${this.#base}/vendor/products`, { params: p });
  }

  getMyOrders(page = 1, status?: string): Observable<{ success: boolean; data: unknown[]; meta: { total: number; totalPages: number } }> {
    let p = new HttpParams().set('page', page).set('limit', 20);
    if (status) p = p.set('status', status);
    return this.#http.get<any>(`${this.#base}/vendor/orders`, { params: p });
  }

  // ─── Analytics ──────────────────────────────────────────────
  getAnalytics(): Observable<{ success: boolean; data: AnalyticsData }> {
    return this.#http.get<any>(`${this.#base}/vendor/analytics`);
  }

  // ─── Inventory ──────────────────────────────────────────────
  getVendorInventory(page = 1, q?: string): Observable<{ success: boolean; data: InventoryVariant[]; meta: { total: number; totalPages: number; page: number; limit: number } }> {
    let p = new HttpParams().set('page', page).set('limit', 30);
    if (q) p = p.set('q', q);
    return this.#http.get<any>(`${this.#base}/vendor/inventory`, { params: p });
  }

  adjustInventory(variantId: number, type: string, qtyChange: number, note?: string): Observable<{ success: boolean; data: unknown }> {
    return this.#http.post<any>(`${this.#base}/vendor/inventory/${variantId}/adjust`, { type, qtyChange, note });
  }

  setLowStockThreshold(variantId: number, threshold: number): Observable<{ success: boolean; data: unknown }> {
    return this.#http.patch<any>(`${this.#base}/vendor/inventory/${variantId}/threshold`, { threshold });
  }

  getVendorLowStock(): Observable<{ success: boolean; data: InventoryVariant[] }> {
    return this.#http.get<any>(`${this.#base}/vendor/inventory/low-stock`);
  }

  // ─── Customers ──────────────────────────────────────────────
  getVendorCustomers(page = 1, q?: string): Observable<{ success: boolean; data: VendorCustomer[]; meta: { total: number; totalPages: number } }> {
    let p = new HttpParams().set('page', page).set('limit', 20);
    if (q) p = p.set('q', q);
    return this.#http.get<any>(`${this.#base}/vendor/customers`, { params: p });
  }

  // ─── Coupons ────────────────────────────────────────────────
  getVendorCoupons(page = 1): Observable<{ success: boolean; data: VendorCoupon[]; meta: { total: number; totalPages: number } }> {
    return this.#http.get<any>(`${this.#base}/vendor/coupons`, { params: new HttpParams().set('page', page) });
  }

  createVendorCoupon(data: CreateCouponInput): Observable<{ success: boolean; data: VendorCoupon }> {
    return this.#http.post<any>(`${this.#base}/vendor/coupons`, data);
  }

  toggleVendorCoupon(id: number): Observable<{ success: boolean; data: VendorCoupon }> {
    return this.#http.patch<any>(`${this.#base}/vendor/coupons/${id}/toggle`, {});
  }

  deleteVendorCoupon(id: number): Observable<{ success: boolean }> {
    return this.#http.delete<any>(`${this.#base}/vendor/coupons/${id}`);
  }

  // ─── Reviews ────────────────────────────────────────────────
  getVendorProductStats(page = 1): Observable<{ success: boolean; data: ProductReviewStat[]; meta: { total: number; totalPages: number } }> {
    return this.#http.get<any>(`${this.#base}/vendor/reviews`, { params: new HttpParams().set('page', page) });
  }

  getEarningsOverview(): Observable<{ success: boolean; data: EarningsOverview }> {
    return this.#http.get<any>(`${this.#base}/vendor/payments/overview`);
  }

  getTransactions(page = 1): Observable<{ success: boolean; data: VendorTransaction[]; meta: { total: number; totalPages: number; page: number; limit: number } }> {
    const p = new HttpParams().set('page', page).set('limit', 20);
    return this.#http.get<any>(`${this.#base}/vendor/payments/transactions`, { params: p });
  }

  getPayouts(page = 1): Observable<{ success: boolean; data: VendorPayout[]; meta: { total: number; totalPages: number; page: number; limit: number } }> {
    const p = new HttpParams().set('page', page).set('limit', 20);
    return this.#http.get<any>(`${this.#base}/vendor/payments/payouts`, { params: p });
  }

  requestPayout(amount: number): Observable<{ success: boolean; data: VendorPayout }> {
    return this.#http.post<any>(`${this.#base}/vendor/payments/payout-request`, { amount });
  }

  getOrderDetail(orderId: number): Observable<{ success: boolean; data: VendorOrder }> {
    return this.#http.get<any>(`${this.#base}/vendor/orders/${orderId}`);
  }

  updateOrderItemStatus(itemId: number, status: OrderStatus, note?: string): Observable<{ success: boolean; data: VendorOrderItem }> {
    return this.#http.patch<any>(`${this.#base}/vendor/orders/items/${itemId}/status`, { status, note });
  }

  addOrderTracking(orderId: number, data: { trackingNumber?: string; courier?: string; estimatedDelivery?: string }): Observable<{ success: boolean; data: VendorOrder }> {
    return this.#http.patch<any>(`${this.#base}/vendor/orders/${orderId}/tracking`, data);
  }

  getStore(storeSlug: string): Observable<{ success: boolean; data: { vendor: VendorProfile; products: Product[] } }> {
    return this.#http.get<any>(`${this.#base}/vendors/${storeSlug}`);
  }

  listStores(page = 1, q?: string): Observable<{ success: boolean; data: VendorProfile[]; meta: { total: number; totalPages: number } }> {
    let p = new HttpParams().set('page', page).set('limit', 20);
    if (q) p = p.set('q', q);
    return this.#http.get<any>(`${this.#base}/vendors`, { params: p });
  }

  // ─── Product CRUD ──────────────────────────────────────────────
  createProduct(data: VendorProductInput): Observable<{ success: boolean; data: Product }> {
    return this.#http.post<any>(`${this.#base}/vendor/products`, data);
  }

  getProduct(id: number): Observable<{ success: boolean; data: Product }> {
    return this.#http.get<any>(`${this.#base}/vendor/products/${id}`);
  }

  updateProduct(id: number, data: Partial<VendorProductInput>): Observable<{ success: boolean; data: Product }> {
    return this.#http.patch<any>(`${this.#base}/vendor/products/${id}`, data);
  }

  updateProductStatus(id: number, status: 'draft' | 'active' | 'inactive' | 'archived'): Observable<{ success: boolean; data: Product }> {
    return this.#http.patch<any>(`${this.#base}/vendor/products/${id}/status`, { status });
  }

  deleteProduct(id: number): Observable<{ success: boolean }> {
    return this.#http.delete<any>(`${this.#base}/vendor/products/${id}`);
  }
}

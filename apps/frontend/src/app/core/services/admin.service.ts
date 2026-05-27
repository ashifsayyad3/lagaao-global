import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/api/v1`;
const ADMIN = `${BASE}/admin`;

// ─── Analytics ──────────────────────────────────────────────────
export interface AdminSummary {
  totalRevenue: number; totalOrders: number; totalUsers: number;
  totalVendors: number; totalProducts: number; pendingOrders: number;
  pendingVendors: number; refundRequests: number;
}
export interface TrendPoint  { date: string; value: number; }
export interface TopProduct  { id: number; name: string; sales: number; revenue: number; }
export interface TopVendor   { id: number; storeName: string; revenue: number; orders: number; }
export interface StatusBreak { status: string; count: number; }
export interface CatBreak    { category: string; count: number; revenue: number; }
export interface RecentOrder { id: number; orderNumber: string; status: string; total: number; createdAt: string; customerName?: string; }

// ─── Vendors ────────────────────────────────────────────────────
export interface AdminVendor {
  id: number; storeName: string; storeSlug: string; status: string;
  isVerified: boolean; commissionRate: number; totalRevenue: number;
  totalProducts: number; rating: number; createdAt: string;
  user?: { id: number; name: string; email: string };
}

// ─── Orders ─────────────────────────────────────────────────────
export interface AdminOrder {
  id: number; orderNumber: string; status: string; total: number;
  paymentStatus: string; paymentMethod: string; createdAt: string;
  user?: { name: string; email: string };
}

// ─── Users ──────────────────────────────────────────────────────
export interface AdminUser {
  id: number; name: string; email: string; role: string; phone?: string;
  isVerified: boolean; createdAt: string;
}

// ─── Payouts ────────────────────────────────────────────────────
export interface AdminPayout {
  id: number; amount: number; commission: number; netAmount: number;
  status: string; reference: string | null; paidAt: string | null;
  createdAt: string; vendor?: { storeName: string };
}

export type PaginatedResponse<T> = { success: boolean; data: T[]; meta: { total: number; totalPages: number; page: number; limit: number } };

// ─── Email ───────────────────────────────────────────────────────
export interface AdminEmailLog {
  id: number; type: string; to: string; subject: string;
  status: 'sent' | 'failed' | 'queued'; messageId?: string;
  error?: string; createdAt: string;
}
export interface AdminEmailStats {
  total: number; sent: number; failed: number; queued: number;
  openRate?: number; clickRate?: number;
}

// ─── Notifications ───────────────────────────────────────────────
export interface AdminNotificationLog {
  id: number; userId?: number; type: string; title: string;
  body: string; channel: string; status: string; createdAt: string;
  user?: { name: string; email: string };
}

// ─── Tracking ────────────────────────────────────────────────────
export interface AdminShipment {
  id: number; orderId: number; orderNumber?: string;
  courier: string; trackingNumber: string; status: string;
  estimatedDelivery?: string; failedAttempts: number;
  events?: Array<{ timestamp: string; status: string; location?: string }>;
  createdAt: string; updatedAt: string;
  order?: { orderNumber: string; user?: { name: string } };
}
export interface AdminTrackingStats {
  total: number; delivered: number; inTransit: number;
  failed: number; returned: number; avgDeliveryDays: number;
}

// ─── CRM ─────────────────────────────────────────────────────────
export interface AdminCrmCustomer {
  id: number; name: string; email: string; phone?: string;
  totalOrders: number; totalSpent: number; lastOrderAt?: string;
  ltv: number; segment: string; joinedAt: string;
}

// ─── Monitoring ──────────────────────────────────────────────────
export interface AdminHealthStatus {
  status: string; uptime: number; env: string; version: string;
  checks: { mysql: string; redis: string; elasticsearch: string };
}
export interface AdminApiLog {
  id?: number; method: string; path: string; statusCode: number;
  duration: number; ip: string; userId?: number; createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  readonly #http = inject(HttpClient);

  // ── Analytics ────────────────────────────────────────────────
  getSummary(): Observable<{ success: boolean; data: AdminSummary }> {
    return this.#http.get<any>(`${ADMIN}/analytics/summary`);
  }
  getRevenueTrend(days = 30): Observable<{ success: boolean; data: TrendPoint[] }> {
    return this.#http.get<any>(`${ADMIN}/analytics/revenue-trend`, { params: new HttpParams().set('days', days) });
  }
  getUserTrend(days = 30): Observable<{ success: boolean; data: TrendPoint[] }> {
    return this.#http.get<any>(`${ADMIN}/analytics/user-trend`, { params: new HttpParams().set('days', days) });
  }
  getTopProducts(limit = 10): Observable<{ success: boolean; data: TopProduct[] }> {
    return this.#http.get<any>(`${ADMIN}/analytics/top-products`, { params: new HttpParams().set('limit', limit) });
  }
  getTopVendors(limit = 10): Observable<{ success: boolean; data: TopVendor[] }> {
    return this.#http.get<any>(`${ADMIN}/analytics/top-vendors`, { params: new HttpParams().set('limit', limit) });
  }
  getOrderStatusBreakdown(): Observable<{ success: boolean; data: StatusBreak[] }> {
    return this.#http.get<any>(`${ADMIN}/analytics/order-status`);
  }
  getCategoryBreakdown(): Observable<{ success: boolean; data: CatBreak[] }> {
    return this.#http.get<any>(`${ADMIN}/analytics/category-breakdown`);
  }
  getRecentOrders(limit = 10): Observable<{ success: boolean; data: RecentOrder[] }> {
    return this.#http.get<any>(`${ADMIN}/analytics/recent-orders`, { params: new HttpParams().set('limit', limit) });
  }

  // ── Vendors ──────────────────────────────────────────────────
  getVendors(page = 1, status?: string, q?: string): Observable<PaginatedResponse<AdminVendor>> {
    let p = new HttpParams().set('page', page).set('limit', 20);
    if (status) p = p.set('status', status);
    if (q) p = p.set('q', q);
    return this.#http.get<any>(`${ADMIN}/vendors`, { params: p });
  }
  updateVendorStatus(id: number, status: 'active' | 'suspended' | 'rejected'): Observable<{ success: boolean; data: AdminVendor }> {
    return this.#http.patch<any>(`${ADMIN}/vendors/${id}/status`, { status });
  }
  updateVendorCommission(id: number, commissionRate: number): Observable<{ success: boolean; data: AdminVendor }> {
    return this.#http.patch<any>(`${ADMIN}/vendors/${id}/commission`, { commissionRate });
  }

  // ── Orders ───────────────────────────────────────────────────
  getOrders(page = 1, status?: string, q?: string): Observable<PaginatedResponse<AdminOrder>> {
    let p = new HttpParams().set('page', page).set('limit', 20);
    if (status) p = p.set('status', status);
    if (q) p = p.set('q', q);
    return this.#http.get<any>(`${ADMIN}/orders`, { params: p });
  }
  updateOrderStatus(id: number, status: string): Observable<{ success: boolean; data: AdminOrder }> {
    return this.#http.patch<any>(`${ADMIN}/orders/${id}/status`, { status });
  }

  // ── Users ────────────────────────────────────────────────────
  getUsers(page = 1, role?: string, q?: string): Observable<PaginatedResponse<AdminUser>> {
    let p = new HttpParams().set('page', page).set('limit', 20);
    if (role) p = p.set('role', role);
    if (q)    p = p.set('q', q);
    return this.#http.get<any>(`${BASE}/users`, { params: p });
  }

  // ── Payouts ──────────────────────────────────────────────────
  getPayouts(status?: string): Observable<PaginatedResponse<AdminPayout>> {
    let p = new HttpParams().set('limit', 100);
    if (status) p = p.set('status', status);
    return this.#http.get<any>(`${ADMIN}/vendors/payouts`, { params: p });
  }
  updatePayoutStatus(id: number, status: 'paid' | 'rejected'): Observable<{ success: boolean; data: AdminPayout }> {
    return this.#http.patch<any>(`${ADMIN}/vendors/payouts/${id}`, { status });
  }

  // ── Email ─────────────────────────────────────────────────────
  getEmailLogs(page = 1, status?: string): Observable<PaginatedResponse<AdminEmailLog>> {
    let p = new HttpParams().set('page', page).set('limit', 25);
    if (status) p = p.set('status', status);
    return this.#http.get<any>(`${ADMIN}/email/logs`, { params: p });
  }
  getEmailStats(): Observable<{ success: boolean; data: AdminEmailStats }> {
    return this.#http.get<any>(`${ADMIN}/email/stats`);
  }
  retryEmail(id: number): Observable<{ success: boolean }> {
    return this.#http.post<any>(`${ADMIN}/email/retry/${id}`, {});
  }

  // ── Notifications ─────────────────────────────────────────────
  getNotificationLogs(page = 1): Observable<PaginatedResponse<AdminNotificationLog>> {
    return this.#http.get<any>(`${ADMIN}/notifications/logs`, { params: new HttpParams().set('page', page).set('limit', 25) });
  }
  broadcastNotification(payload: { title: string; body: string; type: string }): Observable<{ success: boolean }> {
    return this.#http.post<any>(`${ADMIN}/notifications/broadcast`, payload);
  }

  // ── Tracking ─────────────────────────────────────────────────
  getShipments(page = 1, status?: string, q?: string): Observable<PaginatedResponse<AdminShipment>> {
    let p = new HttpParams().set('page', page).set('limit', 20);
    if (status) p = p.set('status', status);
    if (q)      p = p.set('q', q);
    return this.#http.get<any>(`${ADMIN}/tracking/shipments`, { params: p });
  }
  getTrackingStats(): Observable<{ success: boolean; data: AdminTrackingStats }> {
    return this.#http.get<any>(`${ADMIN}/tracking/stats`);
  }
  updateShipment(id: number, payload: Partial<AdminShipment>): Observable<{ success: boolean; data: AdminShipment }> {
    return this.#http.patch<any>(`${ADMIN}/tracking/shipments/${id}`, payload);
  }

  // ── CRM ───────────────────────────────────────────────────────
  getCrmCustomers(page = 1, q?: string): Observable<PaginatedResponse<AdminCrmCustomer>> {
    let p = new HttpParams().set('page', page).set('limit', 20);
    if (q) p = p.set('q', q);
    return this.#http.get<any>(`${ADMIN}/crm/customers`, { params: p });
  }
  getCustomerDetail(id: number): Observable<{ success: boolean; data: AdminCrmCustomer }> {
    return this.#http.get<any>(`${ADMIN}/crm/customers/${id}`);
  }

  // ── Monitoring ────────────────────────────────────────────────
  getHealthStatus(): Observable<{ success: boolean; data: AdminHealthStatus }> {
    return this.#http.get<any>('/health');
  }
  getApiLogs(page = 1): Observable<PaginatedResponse<AdminApiLog>> {
    return this.#http.get<any>(`${ADMIN}/monitoring/api-logs`, { params: new HttpParams().set('page', page).set('limit', 50) });
  }

  // ── CMS ──────────────────────────────────────────────────────
  getBanners(): Observable<{ success: boolean; data: unknown[] }> {
    return this.#http.get<any>(`${ADMIN}/cms/banners`);
  }
  getAnnouncements(): Observable<{ success: boolean; data: unknown[] }> {
    return this.#http.get<any>(`${ADMIN}/cms/announcements`);
  }
  getBlogPosts(page = 1): Observable<PaginatedResponse<unknown>> {
    return this.#http.get<any>(`${ADMIN}/cms/blog`, { params: new HttpParams().set('page', page) });
  }
}

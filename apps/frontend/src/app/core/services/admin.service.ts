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

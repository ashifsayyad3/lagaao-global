import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AnalyticsSummary {
  totalUsers:        number;
  totalOrders:       number;
  totalRevenue:      number;
  totalProducts:     number;
  totalVendors:      number;
  totalSubscribers:  number;
  revenueThisMonth:  number;
  ordersThisMonth:   number;
  revenueChange:     number;
  ordersChange:      number;
  usersChange:       number;
}

export interface TrendPoint  { date: string; revenue: number; orders: number }
export interface UserPoint   { date: string; signups: number }
export interface TopProduct  { productId: number; name: string; slug: string; revenue: number; unitsSold: number }
export interface TopVendor   { vendorId: number; storeName: string; storeSlug: string; revenue: number; orderCount: number }
export interface StatusBreak { status: string; count: number }
export interface CatBreak    { categoryName: string; revenue: number; units: number }
export interface RecentOrder { id: number; orderNumber: string; total: number; status: string; createdAt: string; user?: { name: string; email: string } }

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  readonly #http = inject(HttpClient);
  readonly #base = `${environment.apiUrl}/admin/analytics`;

  getSummary() {
    return this.#http.get<{ success: boolean; data: AnalyticsSummary }>(`${this.#base}/summary`);
  }
  getRevenueTrend(days = 30) {
    return this.#http.get<{ success: boolean; data: TrendPoint[] }>(
      `${this.#base}/revenue-trend`, { params: new HttpParams().set('days', days) },
    );
  }
  getUserTrend(days = 30) {
    return this.#http.get<{ success: boolean; data: UserPoint[] }>(
      `${this.#base}/user-trend`, { params: new HttpParams().set('days', days) },
    );
  }
  getTopProducts() {
    return this.#http.get<{ success: boolean; data: TopProduct[] }>(`${this.#base}/top-products`);
  }
  getTopVendors() {
    return this.#http.get<{ success: boolean; data: TopVendor[] }>(`${this.#base}/top-vendors`);
  }
  getOrderStatus() {
    return this.#http.get<{ success: boolean; data: StatusBreak[] }>(`${this.#base}/order-status`);
  }
  getCategoryBreakdown() {
    return this.#http.get<{ success: boolean; data: CatBreak[] }>(`${this.#base}/category-breakdown`);
  }
  getRecentOrders() {
    return this.#http.get<{ success: boolean; data: RecentOrder[] }>(`${this.#base}/recent-orders`);
  }
}

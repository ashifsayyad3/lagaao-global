import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Product } from './product.service';

export type VendorStatus = 'pending' | 'active' | 'suspended' | 'rejected';

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

  getStore(storeSlug: string): Observable<{ success: boolean; data: { vendor: VendorProfile; products: Product[] } }> {
    return this.#http.get<any>(`${this.#base}/vendors/${storeSlug}`);
  }

  listStores(page = 1, q?: string): Observable<{ success: boolean; data: VendorProfile[]; meta: { total: number; totalPages: number } }> {
    let p = new HttpParams().set('page', page).set('limit', 20);
    if (q) p = p.set('q', q);
    return this.#http.get<any>(`${this.#base}/vendors`, { params: p });
  }
}

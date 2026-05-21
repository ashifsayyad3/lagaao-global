import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CartItem {
  id:            number;
  productId:     number;
  productName:   string;
  productSlug:   string;
  variantId:     number | null;
  variantName:   string | null;
  variantAttrs:  Record<string, string> | null;
  sku:           string | null;
  image:         string;
  price:         number;
  effectivePrice: number;
  qty:           number;
  lineTotal:     number;
  isOutOfStock:  boolean;
}

export interface CartSummary {
  id:         number;
  items:      CartItem[];
  subtotal:   number;
  itemCount:  number;
}

export interface PriceSummary {
  subtotal:    number;
  discount:    number;
  couponCode:  string | null;
  couponDesc:  string | null;
  shipping:    number;
  tax:         number;
  total:       number;
  itemCount:   number;
  savings:     number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly #http    = inject(HttpClient);
  readonly #base    = `${environment.apiUrl}/api/v1`;

  readonly cart      = signal<CartSummary | null>(null);
  readonly itemCount = computed(() => this.cart()?.itemCount ?? 0);
  readonly subtotal  = computed(() => this.cart()?.subtotal ?? 0);

  readonly sessionId = this.#getOrCreateSession();

  private get headers() {
    return { 'x-session-id': this.sessionId };
  }

  load(): Observable<{ success: boolean; data: CartSummary }> {
    return this.#http.get<{ success: boolean; data: CartSummary }>(
      `${this.#base}/cart`, { headers: this.headers }
    ).pipe(tap(r => this.cart.set(r.data)));
  }

  addItem(productId: number, variantId: number | null = null, qty = 1): Observable<{ success: boolean; data: CartSummary }> {
    return this.#http.post<{ success: boolean; data: CartSummary }>(
      `${this.#base}/cart/items`, { productId, variantId, qty }, { headers: this.headers }
    ).pipe(tap(r => this.cart.set(r.data)));
  }

  updateItem(itemId: number, qty: number): Observable<{ success: boolean; data: CartSummary }> {
    return this.#http.patch<{ success: boolean; data: CartSummary }>(
      `${this.#base}/cart/items/${itemId}`, { qty }, { headers: this.headers }
    ).pipe(tap(r => this.cart.set(r.data)));
  }

  removeItem(itemId: number): Observable<{ success: boolean; data: CartSummary }> {
    return this.#http.delete<{ success: boolean; data: CartSummary }>(
      `${this.#base}/cart/items/${itemId}`, { headers: this.headers }
    ).pipe(tap(r => this.cart.set(r.data)));
  }

  clearCart(): Observable<unknown> {
    return this.#http.delete(`${this.#base}/cart`, { headers: this.headers })
      .pipe(tap(() => this.cart.set(null)));
  }

  mergeGuestCart(): Observable<{ success: boolean; data: CartSummary }> {
    return this.#http.post<{ success: boolean; data: CartSummary }>(
      `${this.#base}/cart/merge`, {}, { headers: this.headers }
    ).pipe(tap(r => this.cart.set(r.data)));
  }

  getPriceSummary(couponCode?: string): Observable<{ success: boolean; data: PriceSummary }> {
    const params = couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : '';
    return this.#http.get<{ success: boolean; data: PriceSummary }>(
      `${this.#base}/checkout/summary${params}`, { headers: this.headers }
    );
  }

  validateCoupon(code: string): Observable<{ success: boolean; data: { discount: number; description: string; code: string } }> {
    return this.#http.post<{ success: boolean; data: { discount: number; description: string; code: string } }>(
      `${this.#base}/coupons/validate`, { code, subtotal: this.subtotal() }, { headers: this.headers }
    );
  }

  #getOrCreateSession(): string {
    let id = localStorage.getItem('lg_session');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('lg_session', id);
    }
    return id;
  }
}

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const API = `${environment.apiUrl}/api/v1/wishlist`;

@Injectable({ providedIn: 'root' })
export class WishlistService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  /** Set of wishlisted product IDs */
  readonly wishlistIds = signal<Set<number>>(new Set());
  readonly count = computed(() => this.wishlistIds().size);

  isWishlisted(productId: number): boolean {
    return this.wishlistIds().has(productId);
  }

  /** Load wishlist IDs — call once on app init or after login */
  load(): void {
    if (!this.#auth.isLoggedIn()) return;
    this.#http.get<{ success: boolean; data: { items: { productId: number }[]; meta: unknown } }>(
      API, { withCredentials: true },
    ).subscribe({
      next: r => {
        if (r.success) {
          this.wishlistIds.set(new Set(r.data.items.map(i => i.productId)));
        }
      },
    });
  }

  add(productId: number): void {
    this.wishlistIds.update(s => new Set([...s, productId]));
    this.#http.post(`${API}/${productId}`, {}, { withCredentials: true })
      .subscribe({ error: () => this.wishlistIds.update(s => { const n = new Set(s); n.delete(productId); return n; }) });
  }

  remove(productId: number): void {
    this.wishlistIds.update(s => { const n = new Set(s); n.delete(productId); return n; });
    this.#http.delete(`${API}/${productId}`, { withCredentials: true })
      .subscribe({ error: () => this.wishlistIds.update(s => new Set([...s, productId])) });
  }

  toggle(productId: number): void {
    if (this.isWishlisted(productId)) {
      this.remove(productId);
    } else {
      this.add(productId);
    }
  }
}

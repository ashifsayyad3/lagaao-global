import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/api/v1/recommendations`;

export interface RecommendedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  thumbnail: string | null;
  avgRating: number;
  reviewCount: number;
  score: number;
}

@Injectable({ providedIn: 'root' })
export class RecommendationsService {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  readonly forUser    = signal<RecommendedProduct[]>([]);
  readonly bestsellers = signal<RecommendedProduct[]>([]);

  loadForUser(limit = 12): void {
    const url = this.#auth.isLoggedIn()
      ? `${BASE}/user?limit=${limit}`
      : `${BASE}/bestsellers?limit=${limit}`;

    this.#http.get<{ data: RecommendedProduct[] }>(url).subscribe({
      next:  r => this.forUser.set(r.data),
      error: () => {},
    });
  }

  loadBestsellers(limit = 12): void {
    this.#http.get<{ data: RecommendedProduct[] }>(`${BASE}/bestsellers?limit=${limit}`).subscribe({
      next:  r => this.bestsellers.set(r.data),
      error: () => {},
    });
  }

  getForProduct(productId: number, limit = 8) {
    return this.#http.get<{ data: RecommendedProduct[] }>(`${BASE}/product/${productId}?limit=${limit}`);
  }
}

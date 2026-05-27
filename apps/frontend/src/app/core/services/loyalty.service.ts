import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/api/v1/loyalty`;

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  readonly #http = inject(HttpClient);

  readonly balance = signal(0);

  loadBalance(): void {
    this.#http.get<{ balance: number; history: unknown[]; total: number }>(`${BASE}/me`)
      .subscribe({ next: r => this.balance.set(r.balance), error: () => {} });
  }

  /** Returns rupee discount from the redeem API */
  redeem(points: number, orderId: number) {
    return this.#http.post<{ discount: number; pointsUsed: number }>(
      `${BASE}/redeem`, { points, orderId }
    );
  }
}

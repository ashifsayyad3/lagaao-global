import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const API = `${environment.apiUrl}/api/v1/wallet`;

export interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit' | 'refund' | 'cashback' | 'admin_credit' | 'admin_debit';
  amount: number;
  balanceAfter: number;
  description: string | null;
  referenceType: string | null;
  referenceId: number | null;
  createdAt: string;
}

export interface WalletState {
  balance: number;
  isFrozen: boolean;
  transactions: WalletTransaction[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  readonly #http = inject(HttpClient);

  readonly balance  = signal<number>(0);
  readonly isFrozen = signal<boolean>(false);

  loadBalance(): void {
    this.#http.get<{ success: boolean; data: { balance: number; isFrozen: boolean } }>(
      `${API}/balance`, { withCredentials: true },
    ).subscribe({ next: r => { if (r.success) { this.balance.set(r.data.balance); this.isFrozen.set(r.data.isFrozen); } } });
  }

  getWallet(page = 1): Observable<{ success: boolean; data: WalletState }> {
    return this.#http.get<{ success: boolean; data: WalletState }>(
      API, { params: { page: String(page), limit: '20' }, withCredentials: true },
    ).pipe(tap(r => { if (r.success) { this.balance.set(r.data.balance); this.isFrozen.set(r.data.isFrozen); } }));
  }
}

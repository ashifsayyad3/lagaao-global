import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';

const BASE = `${environment.apiUrl}/api/v1/admin/fraud`;

interface FraudOrder {
  id: number;
  orderNumber: string;
  status: string;
  total: number;
  fraudScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  fraudFlags: string[] | null;
  paymentMethod: string;
  ipAddress: string | null;
  createdAt: string;
  user?: { id: number; name: string; email: string };
}

interface PagedResult {
  rows: FraudOrder[];
  count: number;
}

@Component({
  selector: 'lg-admin-fraud',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe, NgClass, TitleCasePipe, CurrencyInrPipe],
  template: `
<div class="p-6 space-y-6 max-w-6xl mx-auto">

  <div>
    <h1 class="text-xl font-bold text-text-primary">Fraud Queue</h1>
    <p class="text-sm text-text-muted mt-0.5">Review flagged and held orders</p>
  </div>

  <!-- Legend -->
  <div class="flex gap-4 flex-wrap">
    <div class="flex items-center gap-2 text-xs text-text-muted">
      <span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span> High risk (auto-held)
    </div>
    <div class="flex items-center gap-2 text-xs text-text-muted">
      <span class="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> Medium risk (review)
    </div>
    <div class="flex items-center gap-2 text-xs text-text-muted">
      <span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Low risk
    </div>
  </div>

  @if (loading()) {
    <div class="space-y-3">
      @for (i of [1,2,3]; track i) {
        <div class="h-28 rounded-2xl bg-surface-50 animate-pulse"></div>
      }
    </div>
  } @else if (data() && data()!.rows.length > 0) {

    <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
      <div class="px-5 py-3 bg-surface-50 border-b border-border-default">
        <span class="text-sm font-semibold text-text-primary">
          {{ data()!.count }} flagged order{{ data()!.count !== 1 ? 's' : '' }}
        </span>
      </div>

      <div class="divide-y divide-border-default">
        @for (o of data()!.rows; track o.id) {
          <div class="p-5 space-y-3">

            <!-- Header row -->
            <div class="flex items-start justify-between gap-4">
              <div class="space-y-0.5">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-bold text-text-primary">{{ o.orderNumber }}</span>
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                        [ngClass]="{
                          'bg-red-100 text-red-700':    o.riskLevel === 'high',
                          'bg-amber-100 text-amber-700': o.riskLevel === 'medium',
                          'bg-green-100 text-green-700': o.riskLevel === 'low'
                        }">
                    Score {{ o.fraudScore }} · {{ o.riskLevel | titlecase }}
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-text-muted">
                    {{ o.status }}
                  </span>
                </div>
                <p class="text-xs text-text-muted">
                  {{ o.user?.name }} · {{ o.user?.email }} · {{ o.createdAt | date:'dd MMM yyyy, h:mm a' }}
                </p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="font-bold text-text-primary">{{ o.total | currencyInr }}</p>
                <p class="text-xs text-text-muted uppercase">{{ o.paymentMethod }}</p>
              </div>
            </div>

            <!-- Flags -->
            @if (o.fraudFlags && o.fraudFlags.length > 0) {
              <div class="flex flex-wrap gap-1.5">
                @for (flag of o.fraudFlags; track flag) {
                  <span class="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    <mat-icon class="text-xs" style="font-size:11px;width:11px;height:11px;vertical-align:middle">warning</mat-icon>
                    {{ flag }}
                  </span>
                }
              </div>
            }

            <!-- IP -->
            @if (o.ipAddress) {
              <p class="text-xs text-text-muted">IP: <span class="font-mono">{{ o.ipAddress }}</span></p>
            }

            <!-- Actions -->
            @if (o.status === 'fraud_review' || o.riskLevel === 'high') {
              <div class="flex gap-2 pt-1">
                <button (click)="approve(o.id)"
                        class="px-3 py-1.5 rounded-xl bg-green-600 text-white text-xs font-medium
                               hover:bg-green-700 transition-colors flex items-center gap-1">
                  <mat-icon class="text-sm">check_circle</mat-icon> Approve
                </button>
                <button (click)="reject(o.id)"
                        class="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-medium
                               hover:bg-red-700 transition-colors flex items-center gap-1">
                  <mat-icon class="text-sm">cancel</mat-icon> Reject
                </button>
              </div>
            }

          </div>
        }
      </div>
    </div>

    <!-- Pagination -->
    @if (data()!.count > 20) {
      <div class="flex items-center justify-between">
        <span class="text-xs text-text-muted">Page {{ page() }}</span>
        <div class="flex gap-2">
          <button (click)="prev()" [disabled]="page() === 1"
                  class="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40">← Prev</button>
          <button (click)="next()" [disabled]="page() * 20 >= data()!.count"
                  class="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40">Next →</button>
        </div>
      </div>
    }

  } @else {
    <div class="text-center py-16 text-text-muted">
      <mat-icon class="text-4xl text-green-500">verified_user</mat-icon>
      <p class="mt-3 text-sm font-medium">No flagged orders</p>
      <p class="text-xs mt-1">All orders are passing fraud checks</p>
    </div>
  }

</div>
  `,
})
export class AdminFraudComponent implements OnInit {
  readonly #http  = inject(HttpClient);
  readonly #toast = inject(ToastService);

  loading = signal(true);
  data    = signal<PagedResult | null>(null);
  page    = signal(1);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.#http.get<{ data: PagedResult }>(`${BASE}?page=${this.page()}&limit=20`).subscribe({
      next:  r => { this.data.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  approve(id: number) {
    this.#http.post(`${BASE}/${id}/approve`, {}).subscribe({
      next: () => { this.#toast.success('Order approved'); this.load(); },
      error: () => this.#toast.error('Failed'),
    });
  }

  reject(id: number) {
    this.#http.post(`${BASE}/${id}/reject`, {}).subscribe({
      next: () => { this.#toast.success('Order rejected'); this.load(); },
      error: () => this.#toast.error('Failed'),
    });
  }

  prev() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  next() { this.page.update(p => p + 1); this.load(); }
}

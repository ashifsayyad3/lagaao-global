import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';

const BASE = `${environment.apiUrl}/api/v1/admin/affiliates`;

type Tab = 'affiliates' | 'conversions';

interface AffiliateRow {
  id: number;
  code: string;
  status: 'pending' | 'active' | 'suspended';
  commissionRate: number;
  totalClicks: number;
  totalEarnings: number;
  paidOut: number;
  notes: string | null;
  createdAt: string;
  user?: { id: number; name: string; email: string };
}

interface ConversionRow {
  id: number;
  orderId: number;
  orderTotal: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  createdAt: string;
  affiliate?: { id: number; code: string; user?: { name: string; email: string } };
  order?: { orderNumber: string; status: string };
}

@Component({
  selector: 'lg-admin-affiliates',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, FormsModule, DatePipe, NgClass, CurrencyInrPipe],
  template: `
<div class="p-6 space-y-6 max-w-6xl mx-auto">

  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-xl font-bold text-text-primary">Affiliate Program</h1>
      <p class="text-sm text-text-muted mt-0.5">Manage affiliates, conversions and payouts</p>
    </div>
    @if (tab() === 'conversions') {
      <button (click)="approveAll()" [disabled]="approving()"
              class="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium
                     hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
        <mat-icon class="text-base">done_all</mat-icon>
        Approve Delivered
      </button>
    }
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 bg-surface-50 rounded-xl p-1 w-fit">
    <button (click)="tab.set('affiliates')"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            [ngClass]="tab() === 'affiliates' ? 'bg-white shadow text-text-primary' : 'text-text-muted hover:text-text-primary'">
      Affiliates
    </button>
    <button (click)="tab.set('conversions'); loadConversions()"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            [ngClass]="tab() === 'conversions' ? 'bg-white shadow text-text-primary' : 'text-text-muted hover:text-text-primary'">
      Conversions
    </button>
  </div>

  <!-- ── Affiliates tab ─────────────────────────────────────── -->
  @if (tab() === 'affiliates') {
    @if (loading()) {
      <div class="h-64 rounded-2xl bg-surface-50 animate-pulse"></div>
    } @else if (affiliates().length > 0) {
      <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-surface-50 text-xs text-text-muted uppercase tracking-wide">
            <tr>
              <th class="px-4 py-3 text-left">Affiliate</th>
              <th class="px-4 py-3 text-left">Code</th>
              <th class="px-4 py-3 text-right">Rate</th>
              <th class="px-4 py-3 text-right">Clicks</th>
              <th class="px-4 py-3 text-right">Earned</th>
              <th class="px-4 py-3 text-right">Paid Out</th>
              <th class="px-4 py-3 text-left">Status</th>
              <th class="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-default">
            @for (a of affiliates(); track a.id) {
              <tr class="hover:bg-surface-50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-medium text-text-primary">{{ a.user?.name ?? '—' }}</p>
                  <p class="text-xs text-text-muted">{{ a.user?.email }}</p>
                </td>
                <td class="px-4 py-3 font-mono text-text-secondary">{{ a.code }}</td>
                <td class="px-4 py-3 text-right">{{ a.commissionRate }}%</td>
                <td class="px-4 py-3 text-right text-text-secondary">{{ a.totalClicks }}</td>
                <td class="px-4 py-3 text-right font-semibold text-green-600">{{ a.totalEarnings | currencyInr }}</td>
                <td class="px-4 py-3 text-right text-text-muted">{{ a.paidOut | currencyInr }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-amber-100 text-amber-700':  a.status === 'pending',
                          'bg-green-100 text-green-700':  a.status === 'active',
                          'bg-red-100   text-red-700':    a.status === 'suspended'
                        }">
                    {{ a.status | titlecase }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-1.5 flex-wrap">
                    @if (a.status === 'pending' || a.status === 'suspended') {
                      <button (click)="setStatus(a.id, 'active')"
                              class="px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700">
                        Approve
                      </button>
                    }
                    @if (a.status === 'active') {
                      <button (click)="setStatus(a.id, 'suspended')"
                              class="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700">
                        Suspend
                      </button>
                      <button (click)="payout(a.id)"
                              class="px-2.5 py-1 rounded-lg bg-primary-600 text-white text-xs hover:bg-primary-700">
                        Mark Paid
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="text-center py-16 text-text-muted text-sm">No affiliates yet.</div>
    }
  }

  <!-- ── Conversions tab ────────────────────────────────────── -->
  @if (tab() === 'conversions') {
    @if (convLoading()) {
      <div class="h-64 rounded-2xl bg-surface-50 animate-pulse"></div>
    } @else if (conversions().length > 0) {
      <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-surface-50 text-xs text-text-muted uppercase tracking-wide">
            <tr>
              <th class="px-4 py-3 text-left">Affiliate</th>
              <th class="px-4 py-3 text-left">Order</th>
              <th class="px-4 py-3 text-right">Order Total</th>
              <th class="px-4 py-3 text-right">Commission</th>
              <th class="px-4 py-3 text-left">Status</th>
              <th class="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-default">
            @for (c of conversions(); track c.id) {
              <tr class="hover:bg-surface-50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-medium text-text-primary">{{ c.affiliate?.user?.name ?? '—' }}</p>
                  <p class="text-xs font-mono text-text-muted">{{ c.affiliate?.code }}</p>
                </td>
                <td class="px-4 py-3">
                  <p class="font-mono text-text-secondary">{{ c.order?.orderNumber ?? '#' + c.orderId }}</p>
                  <p class="text-xs text-text-muted">{{ c.order?.status }}</p>
                </td>
                <td class="px-4 py-3 text-right">{{ c.orderTotal | currencyInr }}</td>
                <td class="px-4 py-3 text-right font-bold text-green-600">{{ c.commissionAmount | currencyInr }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-amber-100 text-amber-700':  c.status === 'pending',
                          'bg-blue-100  text-blue-700':   c.status === 'approved',
                          'bg-green-100 text-green-700':  c.status === 'paid',
                          'bg-red-100   text-red-700':    c.status === 'cancelled'
                        }">
                    {{ c.status | titlecase }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-text-muted">{{ c.createdAt | date:'dd MMM yyyy' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="text-center py-16 text-text-muted text-sm">No conversions yet.</div>
    }
  }

</div>
  `,
})
export class AdminAffiliatesComponent implements OnInit {
  readonly #http  = inject(HttpClient);
  readonly #toast = inject(ToastService);

  tab         = signal<Tab>('affiliates');
  loading     = signal(true);
  convLoading = signal(false);
  approving   = signal(false);

  affiliates  = signal<AffiliateRow[]>([]);
  conversions = signal<ConversionRow[]>([]);

  ngOnInit() { this.loadAffiliates(); }

  loadAffiliates() {
    this.loading.set(true);
    this.#http.get<{ data: { rows: AffiliateRow[] } }>(`${BASE}?limit=50`).subscribe({
      next:  r => { this.affiliates.set(r.data.rows); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadConversions() {
    if (this.conversions().length) return;
    this.convLoading.set(true);
    this.#http.get<{ data: { rows: ConversionRow[] } }>(`${BASE}/conversions?limit=50`).subscribe({
      next:  r => { this.conversions.set(r.data.rows); this.convLoading.set(false); },
      error: () => this.convLoading.set(false),
    });
  }

  setStatus(id: number, status: 'active' | 'suspended') {
    this.#http.patch(`${BASE}/${id}`, { status }).subscribe({
      next: () => { this.#toast.show(`Affiliate ${status}`, 'success'); this.loadAffiliates(); },
      error: () => this.#toast.show('Failed', 'error'),
    });
  }

  payout(id: number) {
    this.#http.post<{ data: { paid: number } }>(`${BASE}/${id}/payout`, {}).subscribe({
      next: r => {
        this.#toast.show(`Marked ₹${r.data.paid} as paid`, 'success');
        this.loadAffiliates();
        this.conversions.set([]);
      },
      error: (e) => this.#toast.show(e?.error?.message ?? 'No approved earnings to pay', 'error'),
    });
  }

  approveAll() {
    this.approving.set(true);
    this.#http.post<{ data: { approved: number } }>(`${BASE}/conversions/approve`, {}).subscribe({
      next: r => {
        this.#toast.show(`${r.data.approved} conversions approved`, 'success');
        this.approving.set(false);
        this.conversions.set([]);
        this.loadConversions();
      },
      error: () => { this.#toast.show('Failed', 'error'); this.approving.set(false); },
    });
  }
}

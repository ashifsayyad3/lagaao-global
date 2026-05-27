import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';
import { ToastService } from '../../../../core/services/toast.service';

const BASE = `${environment.apiUrl}/api/v1/admin/loyalty`;

interface LoyaltyEntry {
  id: number;
  points: number;
  type: 'earn' | 'redeem' | 'expire' | 'admin';
  description: string;
  createdAt: string;
  user?: { id: number; name: string; email: string };
}

interface PagedResult {
  rows: LoyaltyEntry[];
  count: number;
  page: number;
  limit: number;
}

@Component({
  selector: 'lg-admin-loyalty',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, FormsModule, DatePipe, NgClass],
  template: `
<div class="p-6 space-y-6 max-w-5xl mx-auto">

  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-text-primary">Loyalty Points</h1>
      <p class="text-sm text-text-muted mt-0.5">View history, adjust balances, expire stale points</p>
    </div>
    <div class="flex gap-2">
      <button (click)="expirePoints()" [disabled]="expiring()"
              class="px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium
                     hover:bg-amber-100 transition-colors disabled:opacity-50 flex items-center gap-1.5">
        <mat-icon class="text-base">timer_off</mat-icon>
        Expire Stale
      </button>
    </div>
  </div>

  <!-- Adjust panel -->
  <div class="rounded-2xl border border-border-default bg-bg-base p-5 space-y-4">
    <h2 class="font-semibold text-sm text-text-primary">Manual Adjustment</h2>
    <div class="flex gap-3 flex-wrap">
      <div class="flex flex-col gap-1 flex-1 min-w-40">
        <label class="text-xs text-text-muted font-medium">User ID</label>
        <input [(ngModel)]="adj.userId" type="number" placeholder="e.g. 42"
               class="px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:border-primary-400" />
      </div>
      <div class="flex flex-col gap-1 flex-1 min-w-32">
        <label class="text-xs text-text-muted font-medium">Points (+/-)</label>
        <input [(ngModel)]="adj.points" type="number" placeholder="e.g. 100 or -50"
               class="px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:border-primary-400" />
      </div>
      <div class="flex flex-col gap-1 flex-1 min-w-48">
        <label class="text-xs text-text-muted font-medium">Reason</label>
        <input [(ngModel)]="adj.description" placeholder="e.g. Contest winner"
               class="px-3 py-2 rounded-xl border border-border-default text-sm focus:outline-none focus:border-primary-400" />
      </div>
      <div class="flex items-end">
        <button (click)="adjust()" [disabled]="!adj.userId || !adj.points || !adj.description || saving()"
                class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700
                       transition-colors disabled:opacity-50">
          Apply
        </button>
      </div>
    </div>
  </div>

  <!-- History table -->
  <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
    <div class="px-5 py-3 bg-surface-50 border-b border-border-default flex items-center justify-between">
      <h2 class="text-sm font-semibold text-text-primary">
        All Transactions
        @if (data()) { <span class="ml-2 text-text-muted font-normal">({{ data()!.count }} total)</span> }
      </h2>
    </div>

    @if (loading()) {
      <div class="p-8 text-center text-text-muted text-sm">Loading…</div>
    } @else if (data() && data()!.rows.length > 0) {
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-50 text-xs text-text-muted uppercase tracking-wide">
            <tr>
              <th class="px-4 py-3 text-left">User</th>
              <th class="px-4 py-3 text-left">Type</th>
              <th class="px-4 py-3 text-left">Description</th>
              <th class="px-4 py-3 text-right">Points</th>
              <th class="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-default">
            @for (e of data()!.rows; track e.id) {
              <tr class="hover:bg-surface-50 transition-colors">
                <td class="px-4 py-3">
                  <p class="font-medium text-text-primary">{{ e.user?.name ?? '—' }}</p>
                  <p class="text-xs text-text-muted">{{ e.user?.email }}</p>
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [ngClass]="{
                          'bg-green-100 text-green-700':  e.type === 'earn',
                          'bg-red-100   text-red-700':    e.type === 'redeem',
                          'bg-amber-100 text-amber-700':  e.type === 'expire',
                          'bg-blue-100  text-blue-700':   e.type === 'admin'
                        }">
                    {{ e.type }}
                  </span>
                </td>
                <td class="px-4 py-3 text-text-secondary">{{ e.description }}</td>
                <td class="px-4 py-3 text-right font-bold"
                    [ngClass]="e.points > 0 ? 'text-green-600' : 'text-red-600'">
                  {{ e.points > 0 ? '+' : '' }}{{ e.points }}
                </td>
                <td class="px-4 py-3 text-text-muted text-xs">{{ e.createdAt | date:'dd MMM yyyy' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (data()!.count > data()!.limit) {
        <div class="flex items-center justify-between px-5 py-3 border-t border-border-default">
          <span class="text-xs text-text-muted">Page {{ page() }}</span>
          <div class="flex gap-2">
            <button (click)="prev()" [disabled]="page() === 1"
                    class="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40">← Prev</button>
            <button (click)="next()" [disabled]="page() * data()!.limit >= data()!.count"
                    class="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40">Next →</button>
          </div>
        </div>
      }
    } @else {
      <div class="p-8 text-center text-text-muted text-sm">No transactions yet.</div>
    }
  </div>

</div>
  `,
})
export class AdminLoyaltyComponent implements OnInit {
  readonly #http  = inject(HttpClient);
  readonly #toast = inject(ToastService);

  loading  = signal(true);
  saving   = signal(false);
  expiring = signal(false);
  data     = signal<PagedResult | null>(null);
  page     = signal(1);

  adj = { userId: null as number | null, points: null as number | null, description: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.#http.get<{ data: PagedResult }>(`${BASE}?page=${this.page()}&limit=20`).subscribe({
      next:  r => { this.data.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  adjust() {
    if (!this.adj.userId || !this.adj.points || !this.adj.description) return;
    this.saving.set(true);
    this.#http.post(`${BASE}/adjust`, this.adj).subscribe({
      next: () => {
        this.#toast.show('Adjustment applied', 'success');
        this.adj = { userId: null, points: null, description: '' };
        this.saving.set(false);
        this.load();
      },
      error: () => { this.#toast.show('Failed to adjust', 'error'); this.saving.set(false); },
    });
  }

  expirePoints() {
    this.expiring.set(true);
    this.#http.post<{ data: { expired: number } }>(`${BASE}/expire`, {}).subscribe({
      next: r => {
        this.#toast.show(`Expired ${r.data.expired} points`, 'success');
        this.expiring.set(false);
        this.load();
      },
      error: () => { this.#toast.show('Failed to expire', 'error'); this.expiring.set(false); },
    });
  }

  prev() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  next() { this.page.update(p => p + 1); this.load(); }
}

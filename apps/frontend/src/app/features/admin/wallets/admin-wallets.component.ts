import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

interface WalletRow {
  id: number;
  userId: number;
  balance: number;
  totalCredited: number;
  totalDebited: number;
  isFrozen: boolean;
  updatedAt: string;
  user: { id: number; name: string; email: string };
}

@Component({
  selector: 'lg-admin-wallets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, MatIconModule, CurrencyInrPipe],
  styles: [`
    :host { display: block; }
    .page-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px; }
    .page-title { font-family:var(--font-display);font-size:1.375rem;font-weight:700;color:var(--text-primary);margin:0; }

    .table-wrap { overflow-x:auto;border-radius:16px;border:1px solid var(--border-default); }
    table { width:100%;border-collapse:collapse; }
    th { padding:11px 14px;text-align:left;font-size:.75rem;font-weight:700;color:var(--text-muted);
         text-transform:uppercase;letter-spacing:.05em;background:var(--bg-subtle);border-bottom:1px solid var(--border-default); }
    td { padding:13px 14px;font-size:.875rem;color:var(--text-secondary);border-bottom:1px solid var(--border-default); }
    tr:last-child td { border-bottom:none; }
    tr:hover td { background:var(--bg-subtle); }

    .user-name { font-weight:600;color:var(--text-primary); }
    .user-email { font-size:.75rem;color:var(--text-muted); }

    .frozen-badge { display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:99px;
                    font-size:.6875rem;font-weight:700;background:rgba(220,38,38,.1);color:#dc2626; }
    .active-badge { display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:99px;
                    font-size:.6875rem;font-weight:700;background:rgba(22,163,74,.1);color:#16a34a; }

    .action-btn { padding:5px 12px;border-radius:8px;border:1.5px solid var(--border-default);background:none;
                  font-size:.8125rem;font-weight:600;color:var(--text-secondary);cursor:pointer;
                  transition:border-color 150ms,color 150ms; }
    .action-btn:hover { border-color:var(--color-primary);color:var(--color-primary); }
    .action-btn.danger { border-color:rgba(220,38,38,.3);color:#dc2626; }
    .action-btn.danger:hover { border-color:#dc2626; }

    /* Adjust modal */
    .modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;
                      display:flex;align-items:center;justify-content:center;padding:20px; }
    .modal { background:var(--bg-base);border-radius:20px;padding:28px;width:100%;max-width:420px;
             box-shadow:0 20px 60px rgba(0,0,0,.2); }
    .modal-title { font-family:var(--font-display);font-size:1.125rem;font-weight:700;
                   color:var(--text-primary);margin:0 0 20px; }
    .field { display:flex;flex-direction:column;gap:5px;margin-bottom:14px; }
    .field label { font-size:.8125rem;font-weight:600;color:var(--text-secondary); }
    .field input, .field textarea {
      padding:10px 14px;border:1.5px solid var(--border-default);border-radius:10px;
      font-size:.875rem;color:var(--text-primary);background:var(--bg-subtle);
      outline:none;width:100%; }
    .field input:focus { border-color:var(--color-primary);background:var(--bg-base); }
    .modal-actions { display:flex;gap:10px;margin-top:20px; }
    .btn-primary { flex:1;padding:10px;background:var(--color-primary);color:#fff;border:none;
                   border-radius:10px;font-weight:600;font-size:.9375rem;cursor:pointer; }
    .btn-cancel { padding:10px 18px;background:none;border:1.5px solid var(--border-default);
                  border-radius:10px;font-weight:600;font-size:.875rem;color:var(--text-secondary);cursor:pointer; }

    /* Pagination */
    .pagination { display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px; }
    .page-btn { padding:6px 14px;border-radius:8px;border:1.5px solid var(--border-default);background:none;
                font-size:.875rem;font-weight:600;color:var(--text-secondary);cursor:pointer; }
    .page-btn.active { border-color:var(--color-primary);background:var(--color-primary);color:#fff; }
    .page-btn:disabled { opacity:.4;cursor:not-allowed; }
  `],
  template: `
    <div>
      <div class="page-head">
        <h1 class="page-title">
          <mat-icon style="vertical-align:middle;margin-right:8px">account_balance_wallet</mat-icon>
          Customer Wallets
        </h1>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Balance</th>
              <th>Total Credited</th>
              <th>Total Debited</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              @for (_ of [1,2,3,4,5]; track _) {
                <tr>
                  @for (__ of [1,2,3,4,5,6,7]; track __) {
                    <td><div style="height:14px;background:var(--bg-subtle);border-radius:4px;animation:pulse 1.4s infinite"></div></td>
                  }
                </tr>
              }
            } @else {
              @for (w of wallets(); track w.id) {
                <tr>
                  <td>
                    <div class="user-name">{{ w.user.name }}</div>
                    <div class="user-email">{{ w.user.email }}</div>
                  </td>
                  <td style="font-weight:700;color:var(--color-primary)">{{ w.balance | currencyInr }}</td>
                  <td style="color:#16a34a">{{ w.totalCredited | currencyInr }}</td>
                  <td style="color:#dc2626">{{ w.totalDebited | currencyInr }}</td>
                  <td>
                    @if (w.isFrozen) {
                      <span class="frozen-badge">
                        <mat-icon style="font-size:11px;width:11px;height:11px">lock</mat-icon>Frozen
                      </span>
                    } @else {
                      <span class="active-badge">
                        <mat-icon style="font-size:11px;width:11px;height:11px">check_circle</mat-icon>Active
                      </span>
                    }
                  </td>
                  <td>{{ w.updatedAt | date:'d MMM yyyy' }}</td>
                  <td style="display:flex;gap:6px;flex-wrap:wrap">
                    <button class="action-btn" (click)="openAdjust(w)">Adjust</button>
                    <button class="action-btn" [class.danger]="!w.isFrozen"
                            (click)="toggleFreeze(w)">
                      {{ w.isFrozen ? 'Unfreeze' : 'Freeze' }}
                    </button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="page-btn" [disabled]="page() === 1" (click)="loadPage(page() - 1)">‹</button>
          @for (p of pageRange(); track p) {
            <button class="page-btn" [class.active]="p === page()" (click)="loadPage(p)">{{ p }}</button>
          }
          <button class="page-btn" [disabled]="page() === totalPages()" (click)="loadPage(page() + 1)">›</button>
        </div>
      }
    </div>

    <!-- Adjust modal -->
    @if (adjustTarget()) {
      <div class="modal-backdrop" (click)="adjustTarget.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Adjust Wallet — {{ adjustTarget()!.user.name }}</h3>
          <p style="font-size:.875rem;color:var(--text-muted);margin:0 0 16px">
            Current balance: <strong>{{ adjustTarget()!.balance | currencyInr }}</strong>
          </p>
          <div class="field">
            <label>Amount (positive to credit, negative to debit)</label>
            <input type="number" [(ngModel)]="adjustAmount" placeholder="e.g. 100 or -50" />
          </div>
          <div class="field">
            <label>Note (optional)</label>
            <input type="text" [(ngModel)]="adjustNote" placeholder="Reason for adjustment" />
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="adjustTarget.set(null)">Cancel</button>
            <button class="btn-primary" [disabled]="adjusting()" (click)="submitAdjust()">
              {{ adjusting() ? 'Saving…' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminWalletsComponent implements OnInit {
  readonly #http  = inject(HttpClient);
  readonly #toast = inject(ToastService);

  readonly wallets     = signal<WalletRow[]>([]);
  readonly loading     = signal(true);
  readonly page        = signal(1);
  readonly totalPages  = signal(1);
  readonly adjustTarget = signal<WalletRow | null>(null);
  readonly adjusting    = signal(false);

  adjustAmount = 0;
  adjustNote   = '';

  ngOnInit(): void { this.loadPage(1); }

  loadPage(p: number): void {
    this.loading.set(true);
    this.#http.get<{ success: boolean; data: { wallets: WalletRow[]; meta: { page: number; totalPages: number } } }>(
      `${environment.apiUrl}/api/v1/admin/wallets`,
      { params: { page: String(p), limit: '25' }, withCredentials: true },
    ).subscribe({
      next: r => {
        if (r.success) {
          this.wallets.set(r.data.wallets);
          this.page.set(r.data.meta.page);
          this.totalPages.set(r.data.meta.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  pageRange(): number[] {
    const t = this.totalPages();
    const p = this.page();
    const start = Math.max(1, p - 2);
    const end   = Math.min(t, p + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  openAdjust(w: WalletRow): void {
    this.adjustTarget.set(w);
    this.adjustAmount = 0;
    this.adjustNote   = '';
  }

  submitAdjust(): void {
    const target = this.adjustTarget();
    if (!target || this.adjustAmount === 0) return;
    this.adjusting.set(true);
    this.#http.post(
      `${environment.apiUrl}/api/v1/admin/wallets/${target.userId}/adjust`,
      { amount: this.adjustAmount, note: this.adjustNote },
      { withCredentials: true },
    ).subscribe({
      next: () => {
        this.adjusting.set(false);
        this.adjustTarget.set(null);
        this.#toast.success('Wallet adjusted successfully');
        this.loadPage(this.page());
      },
      error: err => {
        this.adjusting.set(false);
        this.#toast.error('Error', err?.error?.message ?? 'Adjustment failed');
      },
    });
  }

  toggleFreeze(w: WalletRow): void {
    this.#http.patch(
      `${environment.apiUrl}/api/v1/admin/wallets/${w.userId}/freeze`,
      { frozen: !w.isFrozen },
      { withCredentials: true },
    ).subscribe({
      next: () => {
        this.#toast.success(w.isFrozen ? 'Wallet unfrozen' : 'Wallet frozen');
        this.wallets.update(list => list.map(x => x.id === w.id ? { ...x, isFrozen: !x.isFrozen } : x));
      },
      error: err => this.#toast.error('Error', err?.error?.message ?? 'Failed'),
    });
  }
}

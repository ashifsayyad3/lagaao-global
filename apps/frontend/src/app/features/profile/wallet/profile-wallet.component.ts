import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { WalletService, WalletTransaction } from '../../../core/services/wallet.service';

@Component({
  selector: 'lg-profile-wallet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, CurrencyInrPipe],
  styles: [`
    :host { display: block; }

    .wallet-card {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #2d6a3f) 100%);
      border-radius: 20px; padding: 28px 32px; color: #fff;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px; margin-bottom: 32px;
    }
    .balance-label { font-size: .9375rem; opacity: .85; margin: 0 0 4px; }
    .balance-amount { font-size: 2.5rem; font-weight: 800; line-height: 1; margin: 0; }
    .balance-sub { font-size: .8125rem; opacity: .7; margin: 4px 0 0; }
    .frozen-chip {
      background: rgba(255,255,255,.2); border-radius: 99px;
      padding: 4px 12px; font-size: .8125rem; font-weight: 700;
      display: inline-flex; align-items: center; gap: 4px; margin-top: 8px;
    }
    .wallet-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: rgba(255,255,255,.15);
      display: flex; align-items: center; justify-content: center;
    }

    /* Transactions */
    .section-title {
      font-family: var(--font-display); font-size: 1.125rem; font-weight: 700;
      color: var(--text-primary); margin: 0 0 16px;
    }

    .tx-list { display: flex; flex-direction: column; gap: 0; }
    .tx-row {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 0; border-bottom: 1px solid var(--border-default);
    }
    .tx-row:last-child { border-bottom: none; }

    .tx-icon {
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .tx-icon.credit  { background: rgba(22,163,74,.12); color: #16a34a; }
    .tx-icon.debit   { background: rgba(220,38,38,.1);  color: #dc2626; }
    .tx-icon.refund  { background: rgba(59,130,246,.1); color: #3b82f6; }
    .tx-icon.cashback { background: rgba(245,158,11,.1); color: #f59e0b; }
    .tx-icon.admin_credit { background: rgba(22,163,74,.12); color: #16a34a; }
    .tx-icon.admin_debit  { background: rgba(220,38,38,.1);  color: #dc2626; }

    .tx-desc { flex: 1; }
    .tx-desc-main { font-size: .9375rem; font-weight: 500; color: var(--text-primary); }
    .tx-desc-date { font-size: .75rem; color: var(--text-muted); margin-top: 1px; }

    .tx-amount { text-align: right; flex-shrink: 0; }
    .tx-amount-val { font-size: 1rem; font-weight: 700; }
    .tx-amount-val.credit, .tx-amount-val.cashback, .tx-amount-val.refund,
    .tx-amount-val.admin_credit { color: #16a34a; }
    .tx-amount-val.debit, .tx-amount-val.admin_debit { color: #dc2626; }
    .tx-balance-after { font-size: .75rem; color: var(--text-muted); }

    /* Load more */
    .load-more { text-align: center; margin-top: 20px; }
    .load-btn {
      padding: 9px 28px; border-radius: 10px;
      border: 1.5px solid var(--border-default); background: none;
      font-size: .875rem; font-weight: 600; color: var(--text-secondary);
      cursor: pointer; transition: border-color 150ms;
    }
    .load-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .load-btn:disabled { opacity: .5; cursor: not-allowed; }

    /* Empty */
    .empty { text-align: center; padding: 40px; color: var(--text-muted); }

    /* Skeleton */
    .skeleton { background: var(--bg-subtle); border-radius: 8px; animation: pulse 1.4s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  `],
  template: `
    <div>
      <!-- Wallet card -->
      <div class="wallet-card">
        <div>
          <p class="balance-label">Available Balance</p>
          <p class="balance-amount">{{ walletSvc.balance() | currencyInr }}</p>
          <p class="balance-sub">Lagaao Wallet</p>
          @if (walletSvc.isFrozen()) {
            <span class="frozen-chip">
              <mat-icon style="font-size:14px;width:14px;height:14px">lock</mat-icon>
              Wallet Frozen
            </span>
          }
        </div>
        <div class="wallet-icon">
          <mat-icon style="font-size:36px;width:36px;height:36px">account_balance_wallet</mat-icon>
        </div>
      </div>

      <!-- Transactions -->
      <h2 class="section-title">Transaction History</h2>

      @if (loading()) {
        <div style="display:flex;flex-direction:column;gap:12px">
          @for (_ of [1,2,3,4,5]; track _) {
            <div style="display:flex;gap:14px;align-items:center">
              <div class="skeleton" style="width:40px;height:40px;border-radius:50%"></div>
              <div style="flex:1;display:flex;flex-direction:column;gap:6px">
                <div class="skeleton" style="height:14px;width:60%;border-radius:4px"></div>
                <div class="skeleton" style="height:11px;width:35%;border-radius:4px"></div>
              </div>
              <div class="skeleton" style="width:64px;height:18px;border-radius:4px"></div>
            </div>
          }
        </div>
      } @else if (!transactions().length) {
        <div class="empty">
          <mat-icon style="font-size:40px;width:40px;height:40px;display:block;margin:0 auto 8px">
            receipt_long
          </mat-icon>
          No transactions yet. Your wallet history will appear here.
        </div>
      } @else {
        <div class="tx-list">
          @for (tx of transactions(); track tx.id) {
            <div class="tx-row">
              <div class="tx-icon" [class]="tx.type">
                <mat-icon style="font-size:20px;width:20px;height:20px">
                  {{ txIcon(tx.type) }}
                </mat-icon>
              </div>
              <div class="tx-desc">
                <div class="tx-desc-main">{{ tx.description || txLabel(tx.type) }}</div>
                <div class="tx-desc-date">{{ tx.createdAt | date:'d MMM yyyy, h:mm a' }}</div>
              </div>
              <div class="tx-amount">
                <div class="tx-amount-val" [class]="tx.type">
                  {{ isCredit(tx.type) ? '+' : '−' }}{{ tx.amount | currencyInr }}
                </div>
                <div class="tx-balance-after">Bal: {{ tx.balanceAfter | currencyInr }}</div>
              </div>
            </div>
          }
        </div>

        @if (hasMore()) {
          <div class="load-more">
            <button class="load-btn" [disabled]="loadingMore()" (click)="loadMore()">
              {{ loadingMore() ? 'Loading…' : 'Load More' }}
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class ProfileWalletComponent implements OnInit {
  readonly walletSvc   = inject(WalletService);

  readonly loading     = signal(true);
  readonly loadingMore = signal(false);
  readonly transactions = signal<WalletTransaction[]>([]);
  readonly hasMore     = signal(false);

  private page = 1;

  ngOnInit(): void { this.load(1); }

  load(page: number): void {
    if (page === 1) this.loading.set(true); else this.loadingMore.set(true);
    this.walletSvc.getWallet(page).subscribe({
      next: r => {
        if (r.success) {
          const d = r.data;
          this.transactions.update(prev => page === 1 ? d.transactions : [...prev, ...d.transactions]);
          this.hasMore.set(d.meta.page < d.meta.totalPages);
          this.page = page;
        }
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); },
    });
  }

  loadMore(): void { this.load(this.page + 1); }

  isCredit(type: string): boolean {
    return ['credit', 'refund', 'cashback', 'admin_credit'].includes(type);
  }

  txIcon(type: string): string {
    const map: Record<string, string> = {
      credit: 'add_circle', debit: 'remove_circle', refund: 'replay',
      cashback: 'local_offer', admin_credit: 'add_circle_outline', admin_debit: 'remove_circle_outline',
    };
    return map[type] ?? 'swap_horiz';
  }

  txLabel(type: string): string {
    const map: Record<string, string> = {
      credit: 'Wallet Credited', debit: 'Wallet Debited', refund: 'Refund',
      cashback: 'Cashback', admin_credit: 'Admin Credit', admin_debit: 'Admin Debit',
    };
    return map[type] ?? 'Transaction';
  }
}

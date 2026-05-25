import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  VendorService, EarningsOverview, VendorTransaction, VendorPayout, PayoutStatus
} from '../../../core/services/vendor.service';

type ActiveTab = 'transactions' | 'settlements';

const PAYOUT_COLORS: Record<PayoutStatus, string> = {
  pending:    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  paid:       'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  failed:     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

@Component({
  selector: 'lg-vendor-payments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
  template: `
<div class="p-6 max-w-7xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Payments & Earnings</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track your revenue, commissions, and settlements</p>
    </div>
    <button
      (click)="openPayoutModal()"
      [disabled]="(overview()?.available ?? 0) < 100"
      class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
      <span class="material-icons text-[18px]">account_balance</span>
      Request Payout
    </button>
  </div>

  <!-- Overview cards -->
  @if (overviewLoading()) {
    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      @for (i of [1,2,3,4,5,6]; track i) {
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse h-24"></div>
      }
    </div>
  } @else if (overview()) {
    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

      <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4 text-white col-span-2 lg:col-span-1 xl:col-span-2">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-green-100 text-[18px]">account_balance_wallet</span>
          <span class="text-xs text-green-100 font-medium">Available Balance</span>
        </div>
        <p class="text-2xl font-bold">{{ overview()!.available | currency:'INR':'symbol':'1.0-0' }}</p>
        <p class="text-xs text-green-100 mt-1">Ready to withdraw</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-blue-500 text-[18px]">trending_up</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Gross Earned</span>
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ overview()!.grossEarned | currency:'INR':'symbol':'1.0-0' }}</p>
        <p class="text-xs text-gray-400 mt-1">Before commission</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-purple-500 text-[18px]">percent</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Commission</span>
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ overview()!.commissionDeducted | currency:'INR':'symbol':'1.0-0' }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ overview()!.commissionRate }}% platform fee</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-emerald-500 text-[18px]">savings</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Net Earned</span>
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ overview()!.netEarned | currency:'INR':'symbol':'1.0-0' }}</p>
        <p class="text-xs text-gray-400 mt-1">After commission</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-indigo-500 text-[18px]">done_all</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Paid Out</span>
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ overview()!.totalPaid | currency:'INR':'symbol':'1.0-0' }}</p>
        <p class="text-xs text-gray-400 mt-1">All settled</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-amber-500 text-[18px]">hourglass_top</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">Pending Payout</span>
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ overview()!.pendingAmount | currency:'INR':'symbol':'1.0-0' }}</p>
        <p class="text-xs text-gray-400 mt-1">In processing</p>
      </div>

    </div>
  }

  <!-- Commission info banner -->
  @if (overview()) {
    <div class="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
      <span class="material-icons text-[18px]">info</span>
      <span>Platform charges a <strong>{{ overview()!.commissionRate }}%</strong> commission on all delivered orders. Payouts are processed within 3–5 business days.</span>
    </div>
  }

  <!-- Tabs -->
  <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700">
    @for (tab of tabs; track tab.id) {
      <button
        (click)="setTab(tab.id)"
        class="px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        [class]="activeTab() === tab.id
          ? 'border-green-600 text-green-700 dark:text-green-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
        {{ tab.label }}
      </button>
    }
  </div>

  <!-- Transactions tab -->
  @if (activeTab() === 'transactions') {
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      @if (txLoading()) {
        <div class="flex items-center justify-center py-20">
          <div class="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (transactions().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 gap-3">
          <span class="material-icons text-5xl text-gray-300 dark:text-gray-600">receipt</span>
          <p class="text-gray-400 text-sm">No transactions yet. Earnings appear here when orders are delivered.</p>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Order</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Product</th>
                <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Qty</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Gross</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Commission</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Net</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (tx of transactions(); track tx.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-4 py-3">
                    <span class="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {{ tx.order?.orderNumber ?? '#' + tx.orderId }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                    {{ tx.product?.name ?? tx.productName }}
                  </td>
                  <td class="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{{ tx.qty }}</td>
                  <td class="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{{ tx.gross | currency:'INR':'symbol':'1.0-2' }}</td>
                  <td class="px-4 py-3 text-right text-red-600 dark:text-red-400">−{{ tx.commission | currency:'INR':'symbol':'1.0-2' }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-green-700 dark:text-green-400">{{ tx.net | currency:'INR':'symbol':'1.0-2' }}</td>
                  <td class="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{{ tx.createdAt | date:'d MMM y' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <!-- Tx pagination -->
        @if (txTotalPages() > 1) {
          <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ (txPage() - 1) * 20 + 1 }}–{{ minOf(txPage() * 20, txTotal()) }} of {{ txTotal() }} transactions
            </p>
            <div class="flex gap-1">
              <button [disabled]="txPage() === 1" (click)="goTxPage(txPage() - 1)"
                class="px-2.5 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">‹</button>
              @for (p of txPageNumbers(); track p) {
                <button (click)="goTxPage(p)"
                  class="px-2.5 py-1 rounded-lg border text-sm transition-colors"
                  [class]="p === txPage() ? 'bg-green-600 text-white border-green-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-gray-300'">
                  {{ p }}
                </button>
              }
              <button [disabled]="txPage() === txTotalPages()" (click)="goTxPage(txPage() + 1)"
                class="px-2.5 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">›</button>
            </div>
          </div>
        }
      }
    </div>
  }

  <!-- Settlements tab -->
  @if (activeTab() === 'settlements') {
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      @if (payoutsLoading()) {
        <div class="flex items-center justify-center py-20">
          <div class="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else if (payouts().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 gap-3">
          <span class="material-icons text-5xl text-gray-300 dark:text-gray-600">account_balance</span>
          <p class="text-gray-400 text-sm">No payout requests yet.</p>
          <button
            (click)="openPayoutModal()"
            [disabled]="(overview()?.available ?? 0) < 100"
            class="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-40">
            Request Your First Payout
          </button>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Reference</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Commission</th>
                <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Net Payout</th>
                <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Requested</th>
                <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Paid At</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (payout of payouts(); track payout.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-4 py-3">
                    <span class="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {{ payout.reference ?? 'PR-' + payout.id }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-800 dark:text-gray-200">{{ payout.amount | currency:'INR':'symbol':'1.0-2' }}</td>
                  <td class="px-4 py-3 text-right text-red-600 dark:text-red-400">−{{ payout.commission | currency:'INR':'symbol':'1.0-2' }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{{ payout.netAmount | currency:'INR':'symbol':'1.0-2' }}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ payoutStatusClass(payout.status) }}">
                      {{ payout.status | titlecase }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{{ payout.createdAt | date:'d MMM y' }}</td>
                  <td class="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {{ payout.paidAt ? (payout.paidAt | date:'d MMM y') : '—' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (payoutsTotalPages() > 1) {
          <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ payoutsTotal() }} settlements</p>
            <div class="flex gap-1">
              <button [disabled]="payoutsPage() === 1" (click)="goPayoutsPage(payoutsPage() - 1)"
                class="px-2.5 py-1 rounded-lg border text-sm disabled:opacity-40 dark:border-gray-600">‹</button>
              @for (p of payoutsPageNumbers(); track p) {
                <button (click)="goPayoutsPage(p)"
                  class="px-2.5 py-1 rounded-lg border text-sm"
                  [class]="p === payoutsPage() ? 'bg-green-600 text-white border-green-600' : 'dark:border-gray-600 text-gray-700 dark:text-gray-300'">
                  {{ p }}
                </button>
              }
              <button [disabled]="payoutsPage() === payoutsTotalPages()" (click)="goPayoutsPage(payoutsPage() + 1)"
                class="px-2.5 py-1 rounded-lg border text-sm disabled:opacity-40 dark:border-gray-600">›</button>
            </div>
          </div>
        }
      }
    </div>
  }

</div>

<!-- Payout request modal -->
@if (showPayoutModal()) {
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="closePayoutModal()">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" (click)="$event.stopPropagation()">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">Request Payout</h3>
        <button (click)="closePayoutModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <span class="material-icons text-[20px]">close</span>
        </button>
      </div>

      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2 text-sm">
        <div class="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Available Balance</span>
          <span class="font-semibold text-gray-900 dark:text-white">{{ overview()!.available | currency:'INR':'symbol':'1.0-2' }}</span>
        </div>
        <div class="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Commission Rate</span>
          <span>{{ overview()!.commissionRate }}%</span>
        </div>
        <div class="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Minimum Payout</span>
          <span>₹100</span>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount to Request (₹) *</label>
        <input
          type="number" min="100" [max]="overview()!.available"
          [(ngModel)]="payoutAmount"
          placeholder="Enter amount"
          class="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        @if (payoutAmount > 0) {
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            You'll receive <strong class="text-gray-900 dark:text-white">{{ payoutNetPreview() | currency:'INR':'symbol':'1.0-2' }}</strong>
            after {{ overview()!.commissionRate }}% commission deduction
          </p>
        }
      </div>

      @if (payoutError()) {
        <p class="text-sm text-red-600 dark:text-red-400">{{ payoutError() }}</p>
      }
      @if (payoutSuccess()) {
        <p class="text-sm text-green-600 dark:text-green-400">Payout request submitted! We'll process it within 3–5 business days.</p>
      }

      <div class="flex gap-3 pt-1">
        <button (click)="closePayoutModal()"
          class="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Cancel
        </button>
        <button (click)="submitPayout()" [disabled]="payoutSaving() || payoutSuccess()"
          class="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          @if (payoutSaving()) {
            <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          }
          Submit Request
        </button>
      </div>
    </div>
  </div>
}
  `,
})
export class VendorPaymentsComponent implements OnInit {
  readonly #vendor = inject(VendorService);

  readonly tabs = [
    { id: 'transactions' as ActiveTab, label: 'Transactions' },
    { id: 'settlements' as ActiveTab, label: 'Settlements' },
  ];

  readonly activeTab       = signal<ActiveTab>('transactions');
  readonly overviewLoading = signal(true);
  readonly overview        = signal<EarningsOverview | null>(null);

  // Transactions
  readonly transactions    = signal<VendorTransaction[]>([]);
  readonly txLoading       = signal(true);
  readonly txTotal         = signal(0);
  readonly txPage          = signal(1);
  readonly txTotalPages    = computed(() => Math.ceil(this.txTotal() / 20) || 1);
  readonly txPageNumbers   = computed(() => this.pageRange(this.txPage(), this.txTotalPages()));

  // Payouts
  readonly payouts           = signal<VendorPayout[]>([]);
  readonly payoutsLoading    = signal(false);
  readonly payoutsTotal      = signal(0);
  readonly payoutsPage       = signal(1);
  readonly payoutsTotalPages = computed(() => Math.ceil(this.payoutsTotal() / 20) || 1);
  readonly payoutsPageNumbers = computed(() => this.pageRange(this.payoutsPage(), this.payoutsTotalPages()));

  // Payout modal
  readonly showPayoutModal = signal(false);
  readonly payoutSaving    = signal(false);
  readonly payoutError     = signal('');
  readonly payoutSuccess   = signal(false);
  payoutAmount = 0;

  readonly payoutNetPreview = computed(() => {
    if (!this.overview() || this.payoutAmount <= 0) return 0;
    return this.payoutAmount * (1 - this.overview()!.commissionRate / 100);
  });

  ngOnInit(): void {
    this.loadOverview();
    this.loadTransactions();
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'settlements' && this.payouts().length === 0) this.loadPayouts();
  }

  goTxPage(p: number): void { this.txPage.set(p); this.loadTransactions(); }
  goPayoutsPage(p: number): void { this.payoutsPage.set(p); this.loadPayouts(); }

  openPayoutModal(): void {
    this.payoutAmount = 0;
    this.payoutError.set('');
    this.payoutSuccess.set(false);
    this.showPayoutModal.set(true);
  }
  closePayoutModal(): void { if (!this.payoutSaving()) this.showPayoutModal.set(false); }

  submitPayout(): void {
    if (this.payoutAmount < 100) { this.payoutError.set('Minimum payout amount is ₹100'); return; }
    if (this.payoutAmount > (this.overview()?.available ?? 0)) {
      this.payoutError.set('Amount exceeds available balance'); return;
    }
    this.payoutSaving.set(true);
    this.payoutError.set('');
    this.#vendor.requestPayout(this.payoutAmount).subscribe({
      next: () => {
        this.payoutSuccess.set(true);
        this.payoutSaving.set(false);
        this.loadOverview();
        this.loadPayouts();
        setTimeout(() => this.closePayoutModal(), 2500);
      },
      error: (e) => {
        this.payoutError.set(e?.error?.message ?? 'Failed to submit request');
        this.payoutSaving.set(false);
      },
    });
  }

  payoutStatusClass(s: PayoutStatus): string { return PAYOUT_COLORS[s] ?? PAYOUT_COLORS.pending; }

  minOf(a: number, b: number): number { return a < b ? a : b; }

  private loadOverview(): void {
    this.overviewLoading.set(true);
    this.#vendor.getEarningsOverview().subscribe({
      next: r => { this.overview.set(r.data); this.overviewLoading.set(false); },
      error: () => this.overviewLoading.set(false),
    });
  }

  private loadTransactions(): void {
    this.txLoading.set(true);
    this.#vendor.getTransactions(this.txPage()).subscribe({
      next: r => {
        this.transactions.set(r.data);
        this.txTotal.set(r.meta.total);
        this.txLoading.set(false);
      },
      error: () => this.txLoading.set(false),
    });
  }

  private loadPayouts(): void {
    this.payoutsLoading.set(true);
    this.#vendor.getPayouts(this.payoutsPage()).subscribe({
      next: r => {
        this.payouts.set(r.data);
        this.payoutsTotal.set(r.meta.total);
        this.payoutsLoading.set(false);
      },
      error: () => this.payoutsLoading.set(false),
    });
  }

  private pageRange(current: number, total: number): number[] {
    const pages: number[] = [];
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) pages.push(i);
    return pages;
  }
}

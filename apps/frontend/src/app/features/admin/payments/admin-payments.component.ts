import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService, AdminOrder, AdminPayout, PaginatedResponse } from '../../../core/services/admin.service';

type Tab = 'transactions' | 'payouts' | 'refunds' | 'commission' | 'settlements';

interface Transaction {
  id: number; orderNumber: string; customer: string;
  method: string; amount: number; status: string;
  date: string; ref: string;
}

@Component({
  selector: 'lg-admin-payments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Payments & Finance</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Transactions, payouts, commissions and settlements</p>
    </div>
    <button (click)="exportCsv()"
      class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
      <span class="material-icons text-[16px]">download</span> Export CSV
    </button>
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
    @for (kpi of kpis(); track kpi.label) {
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center" [class]="kpi.bg">
            <span class="material-icons text-[18px]" [class]="kpi.color">{{ kpi.icon }}</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight">{{ kpi.label }}</p>
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ kpi.value }}</p>
        @if (kpi.sub) {
          <p class="text-xs text-gray-400 mt-0.5">{{ kpi.sub }}</p>
        }
      </div>
    }
  </div>

  <!-- Tabs -->
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 px-4">
      @for (t of tabs; track t.id) {
        <button (click)="activeTab.set(t.id)"
          class="flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors shrink-0"
          [class]="activeTab() === t.id
            ? 'border-green-600 text-green-600 dark:text-green-400 dark:border-green-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
          <span class="material-icons text-[16px]">{{ t.icon }}</span>
          {{ t.label }}
          @if (t.badge) {
            <span class="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{{ t.badge }}</span>
          }
        </button>
      }
    </div>

    <!-- Transactions Tab -->
    @if (activeTab() === 'transactions') {
      <div class="p-4 space-y-4">
        <!-- Filters -->
        <div class="flex flex-wrap gap-3">
          <div class="relative flex-1 min-w-[200px]">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-[18px]">search</span>
            <input [(ngModel)]="txSearch" (ngModelChange)="loadOrders()"
              placeholder="Order number / customer…"
              class="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none">
          </div>
          <select [(ngModel)]="txMethod" (ngModelChange)="loadOrders()"
            class="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none">
            <option value="">All Methods</option>
            <option value="cod">COD</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="netbanking">Net Banking</option>
            <option value="wallet">Wallet</option>
          </select>
          <select [(ngModel)]="txStatus" (ngModelChange)="loadOrders()"
            class="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none">
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                @for (h of txHeaders; track h) {
                  <th class="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{{ h }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (s of [1,2,3,4,5]; track s) {
                  <tr class="border-t border-gray-100 dark:border-gray-700">
                    @for (c of [1,2,3,4,5,6]; track c) {
                      <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></td>
                    }
                  </tr>
                }
              } @else {
                @for (tx of transactions(); track tx.id) {
                  <tr class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td class="px-4 py-3 font-mono text-xs text-green-600 dark:text-green-400 font-medium">{{ tx.orderNumber }}</td>
                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ tx.customer }}</td>
                    <td class="px-4 py-3">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <span class="material-icons text-[11px]">{{ methodIcon(tx.method) }}</span>
                        {{ tx.method | uppercase }}
                      </span>
                    </td>
                    <td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">₹{{ tx.amount | number }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium" [class]="statusBadge(tx.status)">
                        {{ tx.status | titlecase }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-400 text-xs">{{ tx.date | date:'dd MMM, HH:mm' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="text-center py-12 text-gray-400">No transactions found</td></tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Showing {{ transactions().length }} of {{ txTotal() }} transactions</span>
          <div class="flex gap-2">
            <button [disabled]="txPage() === 1" (click)="txPage.update(p => p - 1); loadOrders()"
              class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span class="material-icons text-[16px]">chevron_left</span>
            </button>
            <span class="px-3 py-1.5">{{ txPage() }} / {{ txTotalPages() }}</span>
            <button [disabled]="txPage() >= txTotalPages()" (click)="txPage.update(p => p + 1); loadOrders()"
              class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span class="material-icons text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Payouts Tab -->
    @if (activeTab() === 'payouts') {
      <div class="p-4 space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600 dark:text-gray-400">Vendor payout requests awaiting approval</p>
          <button (click)="loadPayouts()"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400">
            <span class="material-icons text-[16px]">refresh</span> Refresh
          </button>
        </div>
        <div class="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                @for (h of payoutHeaders; track h) {
                  <th class="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{{ h }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (p of payouts(); track p.id) {
                <tr class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">{{ p.vendor?.storeName ?? '—' }}</td>
                  <td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">₹{{ p.amount | number }}</td>
                  <td class="px-4 py-3 text-red-500">-₹{{ p.commission | number }}</td>
                  <td class="px-4 py-3 font-bold text-green-600 dark:text-green-400">₹{{ p.netAmount | number }}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium" [class]="payoutBadge(p.status)">{{ p.status | titlecase }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-400 text-xs">{{ p.createdAt | date:'dd MMM yyyy' }}</td>
                  <td class="px-4 py-3">
                    @if (p.status === 'pending') {
                      <div class="flex gap-2">
                        <button (click)="approvePayout(p.id)"
                          class="px-2.5 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors font-medium">
                          Approve
                        </button>
                        <button (click)="rejectPayout(p.id)"
                          class="px-2.5 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors font-medium">
                          Reject
                        </button>
                      </div>
                    } @else {
                      <span class="text-gray-400 text-xs">{{ p.paidAt ? (p.paidAt | date:'dd MMM') : '—' }}</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="text-center py-12 text-gray-400">No payout requests</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Refunds Tab -->
    @if (activeTab() === 'refunds') {
      <div class="p-4 space-y-4">
        <div class="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                @for (h of refundHeaders; track h) {
                  <th class="text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{{ h }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (r of refunds(); track r.id) {
                <tr class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-mono text-xs text-green-600 font-medium">{{ r.orderNumber }}</td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ r.customer }}</td>
                  <td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">₹{{ r.amount | number }}</td>
                  <td class="px-4 py-3 text-gray-400 text-xs">{{ r.date | date:'dd MMM yyyy' }}</td>
                  <td class="px-4 py-3">
                    <button (click)="processRefund(r.id)"
                      class="px-2.5 py-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-md hover:bg-amber-200 transition-colors font-medium">
                      Process Refund
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="text-center py-12 text-gray-400">No pending refunds</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Commission Tab -->
    @if (activeTab() === 'commission') {
      <div class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (c of commissionStats(); track c.label) {
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5">
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{{ c.label }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ c.value }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ c.sub }}</p>
            </div>
          }
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <span class="material-icons text-blue-500 text-[20px] mt-0.5">info</span>
          <div>
            <p class="text-sm font-medium text-blue-800 dark:text-blue-300">Platform Commission Policy</p>
            <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">Default commission rate is 10% on all vendor sales. Rates can be customised per vendor in the Vendor Management module. Commission is deducted automatically before vendor payout calculation.</p>
          </div>
        </div>
      </div>
    }

    <!-- Settlements Tab -->
    @if (activeTab() === 'settlements') {
      <div class="p-6">
        <div class="text-center py-16">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span class="material-icons text-gray-400 text-[32px]">account_balance</span>
          </div>
          <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">Settlement Engine</p>
          <p class="text-sm text-gray-400 mt-1 max-w-md mx-auto">Automated settlement cycles will be configured here. Connect your payment gateway (Razorpay) for automatic payouts.</p>
          <button class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            Configure Settlement
          </button>
        </div>
      </div>
    }
  </div>

</div>
  `,
})
export class AdminPaymentsComponent implements OnInit {
  readonly #admin = inject(AdminService);

  readonly activeTab   = signal<Tab>('transactions');
  readonly loading     = signal(false);
  readonly transactions = signal<Transaction[]>([]);
  readonly payouts     = signal<AdminPayout[]>([]);
  readonly refunds     = signal<Transaction[]>([]);
  readonly txTotal     = signal(0);
  readonly txTotalPages = signal(1);
  readonly txPage      = signal(1);

  txSearch = '';
  txMethod = '';
  txStatus = '';

  readonly tabs = [
    { id: 'transactions' as Tab, label: 'Transactions',  icon: 'swap_horiz',           badge: 0 },
    { id: 'payouts'      as Tab, label: 'Payouts',       icon: 'send',                 badge: 0 },
    { id: 'refunds'      as Tab, label: 'Refunds',       icon: 'undo',                 badge: 0 },
    { id: 'commission'   as Tab, label: 'Commission',    icon: 'percent',              badge: 0 },
    { id: 'settlements'  as Tab, label: 'Settlements',   icon: 'account_balance',      badge: 0 },
  ];

  readonly txHeaders      = ['Order #', 'Customer', 'Method', 'Amount', 'Status', 'Date'];
  readonly payoutHeaders  = ['Vendor', 'Gross', 'Commission', 'Net Amount', 'Status', 'Requested', 'Action'];
  readonly refundHeaders  = ['Order #', 'Customer', 'Amount', 'Date', 'Action'];

  readonly kpis = computed(() => [
    { label: 'Total Revenue',    icon: 'currency_rupee',  bg: 'bg-green-100 dark:bg-green-900/30',  color: 'text-green-600 dark:text-green-400', value: '₹' + this.#fmtRevenue(this.txTotal()), sub: 'All time' },
    { label: 'Pending Payouts',  icon: 'hourglass_empty', bg: 'bg-amber-100 dark:bg-amber-900/30',  color: 'text-amber-600 dark:text-amber-400', value: this.payouts().filter(p => p.status === 'pending').length.toString(), sub: 'awaiting approval' },
    { label: 'Commission Earned',icon: 'percent',         bg: 'bg-blue-100 dark:bg-blue-900/30',    color: 'text-blue-600 dark:text-blue-400',   value: '₹' + this.#fmtRevenue(this.payouts().reduce((s, p) => s + p.commission, 0)), sub: 'platform fee' },
    { label: 'Refunds Requested',icon: 'undo',            bg: 'bg-red-100 dark:bg-red-900/30',      color: 'text-red-500',                       value: this.refunds().length.toString(), sub: 'pending action' },
    { label: 'Net Settlement',   icon: 'account_balance', bg: 'bg-purple-100 dark:bg-purple-900/30',color: 'text-purple-600 dark:text-purple-400',value: '₹' + this.#fmtRevenue(this.payouts().filter(p => p.status === 'paid').reduce((s, p) => s + p.netAmount, 0)), sub: 'paid out' },
  ]);

  readonly commissionStats = computed(() => [
    { label: 'Commission This Month', value: '₹' + this.#fmtRevenue(this.payouts().reduce((s, p) => s + p.commission, 0)), sub: 'Platform fee earned' },
    { label: 'Avg Commission Rate',   value: '10%', sub: 'Default platform rate' },
    { label: 'Total Vendors Paid',    value: this.payouts().filter(p => p.status === 'paid').length.toString(), sub: 'Settled vendors' },
  ]);

  ngOnInit(): void {
    this.loadOrders();
    this.loadPayouts();
    this.loadRefunds();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.#admin.getOrders(this.txPage(), this.txStatus || undefined, this.txSearch || undefined)
      .subscribe({
        next: res => {
          this.transactions.set(res.data.map(o => ({
            id:          o.id,
            orderNumber: o.orderNumber,
            customer:    o.user?.name ?? '—',
            method:      o.paymentMethod,
            amount:      o.total,
            status:      o.paymentStatus ?? o.status,
            date:        o.createdAt,
            ref:         '',
          })));
          this.txTotal.set(res.meta.total);
          this.txTotalPages.set(res.meta.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadPayouts(): void {
    this.#admin.getPayouts().subscribe({ next: res => this.payouts.set(res.data), error: () => {} });
  }

  loadRefunds(): void {
    this.#admin.getOrders(1, 'refund_requested').subscribe({
      next: res => this.refunds.set(res.data.map(o => ({
        id: o.id, orderNumber: o.orderNumber, customer: o.user?.name ?? '—',
        method: o.paymentMethod, amount: o.total, status: o.status, date: o.createdAt, ref: '',
      }))),
      error: () => {},
    });
  }

  approvePayout(id: number): void {
    this.#admin.updatePayoutStatus(id, 'paid').subscribe(() => this.loadPayouts());
  }

  rejectPayout(id: number): void {
    this.#admin.updatePayoutStatus(id, 'rejected').subscribe(() => this.loadPayouts());
  }

  processRefund(_id: number): void {
    alert('Refund flow: connect to payment gateway. Configure in System > Payment Config.');
  }

  exportCsv(): void {
    const rows = [['Order #', 'Customer', 'Method', 'Amount', 'Status', 'Date']];
    this.transactions().forEach(t => rows.push([t.orderNumber, t.customer, t.method, t.amount.toString(), t.status, t.date]));
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  statusBadge(s: string): string {
    const m: Record<string, string> = {
      paid:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      failed:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      refunded: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return m[s] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  }

  payoutBadge(s: string): string {
    const m: Record<string, string> = {
      pending:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      paid:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return m[s] ?? 'bg-gray-100 text-gray-600';
  }

  methodIcon(m: string): string {
    const icons: Record<string, string> = { cod: 'payments', upi: 'qr_code', card: 'credit_card', netbanking: 'account_balance', wallet: 'account_balance_wallet' };
    return icons[m] ?? 'payment';
  }

  #fmtRevenue(n: number): string {
    if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000)   return (n / 100000).toFixed(1) + 'L';
    if (n >= 1000)     return (n / 1000).toFixed(0) + 'K';
    return n.toFixed(0);
  }
}

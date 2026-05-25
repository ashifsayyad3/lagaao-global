import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VendorService, VendorOrder, OrderStatus } from '../../../core/services/vendor.service';
import { MatTooltipModule } from '@angular/material/tooltip';

const STATUS_TABS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All',            value: '' },
  { label: 'Pending',        value: 'pending' },
  { label: 'Confirmed',      value: 'confirmed' },
  { label: 'Processing',     value: 'processing' },
  { label: 'Shipped',        value: 'shipped' },
  { label: 'Out for Del.',   value: 'out_for_delivery' },
  { label: 'Delivered',      value: 'delivered' },
  { label: 'Cancelled',      value: 'cancelled' },
  { label: 'Refund',         value: 'refund_requested' },
];

const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  confirmed:        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  processing:       'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  shipped:          'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  out_for_delivery: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  delivered:        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  cancelled:        'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  refund_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  refunded:         'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
};

@Component({
  selector: 'lg-vendor-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, CurrencyPipe, MatTooltipModule],
  template: `
<div class="p-6 max-w-7xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage and fulfil your customer orders</p>
    </div>
  </div>

  <!-- Filters row -->
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap gap-3">
    <!-- Search -->
    <div class="relative flex-1 min-w-[200px]">
      <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
      <input
        class="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="Search order number or customer…"
        [(ngModel)]="searchQuery"
        (ngModelChange)="onSearch($event)"
      />
    </div>
    <!-- Date range (static UI for now) -->
    <select
      class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
      [(ngModel)]="dateFilter" (ngModelChange)="reload()">
      <option value="">All Time</option>
      <option value="today">Today</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
    </select>
  </div>

  <!-- Status tabs -->
  <div class="flex gap-1 overflow-x-auto pb-1 border-b border-gray-200 dark:border-gray-700">
    @for (tab of tabs; track tab.value) {
      <button
        (click)="setTab(tab.value)"
        class="px-4 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors"
        [class]="activeTab() === tab.value
          ? 'bg-white dark:bg-gray-800 border-t border-l border-r border-gray-200 dark:border-gray-700 text-green-700 dark:text-green-400 -mb-px'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
        {{ tab.label }}
        @if (tab.value === '') {
          <span class="ml-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">{{ total() }}</span>
        }
      </button>
    }
  </div>

  <!-- Table -->
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
    @if (loading()) {
      <div class="flex items-center justify-center py-24">
        <div class="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    } @else if (orders().length === 0) {
      <div class="flex flex-col items-center justify-center py-24 gap-3">
        <span class="material-icons text-5xl text-gray-300 dark:text-gray-600">receipt_long</span>
        <p class="text-gray-500 dark:text-gray-400 text-sm">No orders found</p>
      </div>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Order</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Customer</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Items</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
              <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
              <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            @for (order of orders(); track order.id) {
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-4 py-3">
                  <span class="font-mono font-semibold text-gray-900 dark:text-white text-xs">{{ order.orderNumber }}</span>
                </td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {{ order.user?.name || '—' }}
                  @if (order.user?.phone) {
                    <div class="text-xs text-gray-400">{{ order.user?.phone }}</div>
                  }
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {{ order.items?.length ?? 0 }} item{{ (order.items?.length ?? 0) === 1 ? '' : 's' }}
                </td>
                <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                  {{ order.totalAmount | currency:'INR':'symbol':'1.0-0' }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ statusClass(order.status) }}">
                    {{ formatStatus(order.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                  {{ order.createdAt | date:'d MMM y, h:mm a' }}
                </td>
                <td class="px-4 py-3 text-center">
                  <a [routerLink]="['/vendor/orders', order.id]"
                     class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                    <span class="material-icons text-[14px]">visibility</span>
                    View
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Showing {{ (page() - 1) * 20 + 1 }}–{{ [page() * 20, total()].reduce((a,b) => a < b ? a : b) }} of {{ total() }}
          </p>
          <div class="flex gap-1">
            <button
              [disabled]="page() === 1"
              (click)="goPage(page() - 1)"
              class="px-2.5 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors">
              ‹
            </button>
            @for (p of pageNumbers(); track p) {
              <button
                (click)="goPage(p)"
                class="px-2.5 py-1 rounded-lg border text-sm transition-colors"
                [class]="p === page()
                  ? 'bg-green-600 text-white border-green-600'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-gray-300'">
                {{ p }}
              </button>
            }
            <button
              [disabled]="page() === totalPages()"
              (click)="goPage(page() + 1)"
              class="px-2.5 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors">
              ›
            </button>
          </div>
        </div>
      }
    }
  </div>

</div>
  `,
})
export class VendorOrdersComponent implements OnInit {
  readonly #vendor = inject(VendorService);

  readonly tabs = STATUS_TABS;
  readonly activeTab = signal<OrderStatus | ''>('');
  readonly orders = signal<VendorOrder[]>([]);
  readonly loading = signal(true);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly totalPages = computed(() => Math.ceil(this.total() / 20) || 1);
  readonly pageNumbers = computed(() => {
    const tp = this.totalPages(); const cp = this.page();
    const pages: number[] = [];
    for (let i = Math.max(1, cp - 2); i <= Math.min(tp, cp + 2); i++) pages.push(i);
    return pages;
  });

  searchQuery = '';
  dateFilter = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.load(); }

  setTab(v: OrderStatus | ''): void {
    this.activeTab.set(v);
    this.page.set(1);
    this.load();
  }

  onSearch(v: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 350);
  }

  reload(): void { this.page.set(1); this.load(); }

  goPage(p: number): void { this.page.set(p); this.load(); }

  private load(): void {
    this.loading.set(true);
    this.#vendor.getMyOrders(this.page(), this.activeTab() || undefined).subscribe({
      next: r => {
        this.orders.set((r.data as VendorOrder[]));
        this.total.set(r.meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusClass(s: string): string { return STATUS_COLORS[s] ?? STATUS_COLORS['pending']; }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

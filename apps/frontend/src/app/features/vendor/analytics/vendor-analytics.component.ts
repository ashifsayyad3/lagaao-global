import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  VendorService,
  AnalyticsData,
  RevenueMonth,
  TopProduct,
  StatusCount,
} from '../../../core/services/vendor.service';

interface ChartBar {
  month: RevenueMonth;
  label: string;
  heightPct: number;
}

interface DonutSegment {
  status: string;
  count: number;
  color: string;
  pct: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending:          '#f59e0b',
  confirmed:        '#3b82f6',
  processing:       '#8b5cf6',
  shipped:          '#06b6d4',
  out_for_delivery: '#f97316',
  delivered:        '#22c55e',
  cancelled:        '#ef4444',
  refund_requested: '#ec4899',
  refunded:         '#6b7280',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Component({
  selector: 'lg-vendor-analytics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <!-- Loading skeleton -->
    @if (loading()) {
      <div class="p-6 space-y-6 animate-pulse">
        <div class="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          @for (i of [1,2,3]; track i) {
            <div class="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          }
        </div>
        <div class="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div class="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    }

    @if (!loading() && analytics()) {
      <div class="p-6 space-y-8">

        <!-- Header -->
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Last 12 months</p>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {{ analytics()!.totals.grossRevenue | currency:'INR':'symbol':'1.0-0' }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">Gross</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Net Revenue</p>
            <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {{ analytics()!.totals.netRevenue | currency:'INR':'symbol':'1.0-0' }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">After commission</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Orders Delivered</p>
            <p class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {{ analytics()!.totals.ordersDelivered }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">Successfully fulfilled</p>
          </div>
        </div>

        <!-- Revenue Bar Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-6">Monthly Revenue</h2>

          @if (chartBars().length > 0) {
            <div class="flex items-end gap-2 h-48 overflow-x-auto pb-2">
              @for (bar of chartBars(); track bar.month.month) {
                <div class="flex flex-col items-center flex-1 min-w-[32px] gap-1 group">
                  <!-- Tooltip -->
                  <div class="hidden group-hover:flex flex-col items-center mb-1">
                    <div class="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 whitespace-nowrap shadow">
                      {{ bar.month.gross | currency:'INR':'symbol':'1.0-0' }}
                    </div>
                  </div>
                  <!-- Bar -->
                  <div
                    class="w-full rounded-t transition-all duration-300 cursor-pointer"
                    [style.height.%]="bar.heightPct || 2"
                    style="background-color: var(--color-primary, #22c55e); min-height: 4px; max-height: 100%; align-self: flex-end;"
                    [title]="bar.label + ': ' + formatCurrency(bar.month.gross)"
                  ></div>
                  <!-- Month label -->
                  <span class="text-[10px] text-gray-500 dark:text-gray-400 mt-1 select-none">{{ bar.label }}</span>
                </div>
              }
            </div>
          } @else {
            <p class="text-sm text-gray-400 dark:text-gray-500 text-center py-12">No revenue data available.</p>
          }
        </div>

        <!-- Top Products Table + Donut side by side on md+ -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Top 10 Products Table -->
          <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Top Products</h2>

            @if (topProducts().length > 0) {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-100 dark:border-gray-700">
                      <th class="pb-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-8">#</th>
                      <th class="pb-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Product</th>
                      <th class="pb-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Units</th>
                      <th class="pb-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Revenue</th>
                      <th class="pb-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-28 pl-4">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of topProducts(); track p.productId; let i = $index) {
                      <tr class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td class="py-2.5 text-gray-400 dark:text-gray-500 font-mono text-xs">{{ i + 1 }}</td>
                        <td class="py-2.5 font-medium text-gray-800 dark:text-gray-200 max-w-[180px] truncate" [title]="p.name">
                          {{ p.name }}
                        </td>
                        <td class="py-2.5 text-right text-gray-600 dark:text-gray-300">{{ p.unitsSold }}</td>
                        <td class="py-2.5 text-right font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {{ p.revenue | currency:'INR':'symbol':'1.0-0' }}
                        </td>
                        <td class="py-2.5 pl-4">
                          <div class="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden w-24">
                            <div
                              class="absolute inset-y-0 left-0 rounded-full"
                              style="background-color: var(--color-primary, #22c55e);"
                              [style.width.%]="productBarPct(p.revenue)"
                            ></div>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No product data available.</p>
            }
          </div>

          <!-- Order Status Donut -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm flex flex-col">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Order Status</h2>

            @if (donutSegments().length > 0) {
              <div class="flex flex-col items-center gap-4 flex-1">
                <!-- Donut circle -->
                <div
                  class="w-40 h-40 rounded-full flex-shrink-0"
                  [style.background]="conicGradient()"
                  style="mask: radial-gradient(transparent 48%, black 49%); -webkit-mask: radial-gradient(transparent 48%, black 49%);"
                ></div>

                <!-- Legend -->
                <ul class="w-full space-y-1.5 text-xs">
                  @for (seg of donutSegments(); track seg.status) {
                    <li class="flex items-center justify-between gap-2">
                      <span class="flex items-center gap-1.5 truncate">
                        <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" [style.background-color]="seg.color"></span>
                        <span class="capitalize text-gray-600 dark:text-gray-300">{{ formatStatus(seg.status) }}</span>
                      </span>
                      <span class="font-semibold text-gray-800 dark:text-gray-200 flex-shrink-0">{{ seg.count }}</span>
                    </li>
                  }
                </ul>
              </div>
            } @else {
              <p class="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No order data available.</p>
            }
          </div>

        </div>

      </div>
    }

    <!-- Error state -->
    @if (!loading() && error()) {
      <div class="p-6 flex flex-col items-center gap-3 text-center">
        <span class="text-4xl">⚠️</span>
        <p class="text-gray-700 dark:text-gray-300 font-medium">Failed to load analytics</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ error() }}</p>
        <button
          class="mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style="background-color: var(--color-primary, #22c55e);"
          (click)="load()"
        >Retry</button>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    :host-context(.dark) {
      color-scheme: dark;
    }
  `],
})
export class VendorAnalyticsComponent implements OnInit {
  readonly #vendorService = inject(VendorService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly analytics = signal<AnalyticsData | null>(null);

  /** Derived chart bars — sorted by month, limited to last 12 */
  readonly chartBars = computed<ChartBar[]>(() => {
    const data = this.analytics();
    if (!data?.revenueByMonth?.length) return [];
    const months = [...data.revenueByMonth]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
    const maxGross = Math.max(...months.map(m => m.gross), 1);
    return months.map(m => ({
      month: m,
      label: this.shortMonth(m.month),
      heightPct: (m.gross / maxGross) * 100,
    }));
  });

  /** Top 10 products sorted by revenue desc */
  readonly topProducts = computed<TopProduct[]>(() => {
    const data = this.analytics();
    if (!data?.topProducts?.length) return [];
    return [...data.topProducts]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  });

  /** Top product revenue for percentage bars */
  readonly #topRevenue = computed<number>(() => {
    const products = this.topProducts();
    return products.length ? Math.max(...products.map(p => p.revenue), 1) : 1;
  });

  /** Donut segments with colors and cumulative percentages */
  readonly donutSegments = computed<DonutSegment[]>(() => {
    const data = this.analytics();
    if (!data?.statusBreakdown?.length) return [];
    const total = data.statusBreakdown.reduce((s, x) => s + x.count, 0) || 1;
    return data.statusBreakdown
      .filter(s => s.count > 0)
      .map(s => ({
        status: s.status,
        count: s.count,
        color: STATUS_COLORS[s.status] ?? '#94a3b8',
        pct: (s.count / total) * 100,
      }));
  });

  /** CSS conic-gradient string for donut */
  readonly conicGradient = computed<string>(() => {
    const segments = this.donutSegments();
    if (!segments.length) return 'conic-gradient(#e5e7eb 0deg 360deg)';
    let cumulative = 0;
    const stops = segments.map(seg => {
      const start = cumulative;
      cumulative += seg.pct;
      return `${seg.color} ${start.toFixed(2)}% ${cumulative.toFixed(2)}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.#vendorService.getAnalytics().subscribe({
      next: res => {
        this.analytics.set(res.data);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? err?.message ?? 'Unknown error');
        this.loading.set(false);
      },
    });
  }

  /** Convert 'YYYY-MM' to short month name e.g. 'Jan' */
  shortMonth(m: string): string {
    const parts = m.split('-');
    const monthIndex = parseInt(parts[1], 10) - 1;
    return MONTH_NAMES[monthIndex] ?? m;
  }

  /** Product revenue as percentage of top product */
  productBarPct(revenue: number): number {
    return (revenue / this.#topRevenue()) * 100;
  }

  /** Format status string for display */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  /** Format currency for tooltip title attributes */
  formatCurrency(value: number): string {
    return '₹' + value.toLocaleString('en-IN');
  }
}

import {
  Component, OnInit, signal, computed, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  AnalyticsService, AnalyticsSummary, TrendPoint, TopProduct,
  TopVendor, StatusBreak, CatBreak, RecentOrder,
} from '../../../core/services/analytics.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { LineChartComponent, ChartSeries } from '../../../shared/components/line-chart/line-chart.component';
import { MonitoringService, HealthCheck } from '../../../core/services/monitoring.service';

type AdminTab = 'overview' | 'products' | 'vendors' | 'orders';

@Component({
  selector: 'lg-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, DatePipe, DecimalPipe, MatIconModule,
    CurrencyInrPipe, BadgeComponent, SkeletonComponent, LineChartComponent,
  ],
  template: `
    <div class="max-w-screen-2xl mx-auto px-4 md:px-6 py-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p class="text-sm text-text-secondary mt-0.5">Platform analytics and management</p>
        </div>
        <div class="flex gap-2">
          @for (d of [7, 30, 90]; track d) {
            <button
              class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
              [class]="trendDays() === d
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-border text-text-secondary hover:text-text-primary'"
              (click)="setTrendDays(d)"
            >{{ d }}d</button>
          }
        </div>
      </div>

      <!-- KPI Cards -->
      @if (summaryLoading()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          @for (i of [0,1,2,3]; track i) { <lg-skeleton height="110px" borderRadius="1rem"></lg-skeleton> }
        </div>
      } @else if (summary()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          @for (card of kpiCards(); track card.label) {
            <div class="rounded-2xl border border-border bg-bg-base p-5">
              <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                     [style.background]="card.bg">
                  <mat-icon class="!text-xl" [style.color]="card.color">{{ card.icon }}</mat-icon>
                </div>
                @if (card.change !== null) {
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                        [class]="card.change >= 0
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'">
                    {{ card.change >= 0 ? '+' : '' }}{{ card.change }}%
                  </span>
                }
              </div>
              <p class="text-2xl font-bold text-text-primary">{{ card.value }}</p>
              <p class="text-xs text-text-secondary mt-0.5">{{ card.label }}</p>
            </div>
          }
        </div>
      }

      <!-- Tab nav -->
      <div class="flex gap-1 border-b border-border mb-6">
        @for (tab of tabs; track tab.key) {
          <button
            class="px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px"
            [class.border-primary-600]="activeTab() === tab.key"
            [class.text-primary-600]="activeTab() === tab.key"
            [class.border-transparent]="activeTab() !== tab.key"
            [class.text-text-secondary]="activeTab() !== tab.key"
            (click)="activeTab.set(tab.key)"
          >
            <mat-icon class="!text-sm mr-1">{{ tab.icon }}</mat-icon>{{ tab.label }}
          </button>
        }
      </div>

      <!-- ─── Overview tab ───────────────────────────────────── -->
      @if (activeTab() === 'overview') {
        <div class="grid lg:grid-cols-3 gap-6">

          <!-- Revenue chart (2/3 width) -->
          <div class="lg:col-span-2 rounded-2xl border border-border bg-bg-base p-5">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-text-primary">Revenue & Orders</h2>
              @if (chartLoading()) {
                <span class="text-xs text-text-secondary animate-pulse">Loading…</span>
              }
            </div>
            @if (revenueSeries().length > 0) {
              <lg-line-chart
                [series]="revenueSeries()"
                [labels]="chartLabels()"
                [formatY]="formatRevenue"
              ></lg-line-chart>
            } @else {
              <div class="h-48 flex items-center justify-center text-text-secondary text-sm">
                No data for this period
              </div>
            }
          </div>

          <!-- Order status donut (1/3 width) -->
          <div class="rounded-2xl border border-border bg-bg-base p-5">
            <h2 class="font-semibold text-text-primary mb-4">Order Status</h2>
            @if (statusBreakdown().length > 0) {
              <div class="space-y-2.5">
                @for (s of statusBreakdown(); track s.status) {
                  <div>
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-text-secondary capitalize">{{ s.status.replace('_', ' ') }}</span>
                      <span class="font-semibold text-text-primary">{{ s.count }}</span>
                    </div>
                    <div class="h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                      <div class="h-full rounded-full transition-all"
                           [style.width.%]="statusPct(s.count)"
                           [style.background]="statusColor(s.status)"></div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="h-40 flex items-center justify-center text-text-secondary text-sm">No orders yet</div>
            }
          </div>

          <!-- User signups chart -->
          <div class="lg:col-span-2 rounded-2xl border border-border bg-bg-base p-5">
            <h2 class="font-semibold text-text-primary mb-4">User Signups</h2>
            @if (userSeries().length > 0) {
              <lg-line-chart
                [series]="userSeries()"
                [labels]="chartLabels()"
                [formatY]="formatCount"
              ></lg-line-chart>
            }
          </div>

          <!-- Category breakdown -->
          <div class="rounded-2xl border border-border bg-bg-base p-5">
            <h2 class="font-semibold text-text-primary mb-4">Revenue by Category</h2>
            @if (categories().length > 0) {
              <div class="space-y-2.5">
                @for (c of categories(); track c.categoryName) {
                  <div>
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-text-secondary truncate max-w-[120px]">{{ c.categoryName }}</span>
                      <span class="font-semibold text-text-primary">{{ c.revenue | currencyInr }}</span>
                    </div>
                    <div class="h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                      <div class="h-full rounded-full bg-accent transition-all"
                           [style.width.%]="catPct(c.revenue)"></div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="h-40 flex items-center justify-center text-text-secondary text-sm">No data</div>
            }
          </div>

          <!-- Recent Orders -->
          <div class="lg:col-span-3 rounded-2xl border border-border bg-bg-base overflow-hidden">
            <div class="px-5 py-3 border-b border-border flex items-center justify-between bg-surface-50 dark:bg-surface-900">
              <h2 class="font-semibold text-text-primary text-sm">Recent Orders</h2>
              <a routerLink="/admin/orders" class="text-xs text-primary-600 hover:underline">View all</a>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border text-left">
                    <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Order</th>
                    <th class="px-5 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">Customer</th>
                    <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Amount</th>
                    <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Status</th>
                    <th class="px-5 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  @for (o of recentOrders(); track o.id) {
                    <tr class="hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                      <td class="px-5 py-3 font-mono text-text-primary">{{ o.orderNumber }}</td>
                      <td class="px-5 py-3 text-text-secondary hidden sm:table-cell">{{ o.user?.name ?? '—' }}</td>
                      <td class="px-5 py-3 font-semibold text-text-primary">{{ o.total | currencyInr }}</td>
                      <td class="px-5 py-3">
                        <lg-badge [variant]="orderStatusVariant(o.status)">{{ o.status }}</lg-badge>
                      </td>
                      <td class="px-5 py-3 text-text-secondary text-xs hidden md:table-cell">
                        {{ o.createdAt | date: 'd MMM, h:mm a' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- System Health -->
          @if (health()) {
            <div class="lg:col-span-3 rounded-2xl border border-border bg-bg-base p-5">
              <div class="flex items-center justify-between mb-4">
                <h2 class="font-semibold text-text-primary text-sm">System Health</h2>
                <span class="text-xs text-text-secondary">
                  Uptime: {{ formatUptime(health()!.uptime) }} · v{{ health()!.version }}
                </span>
              </div>
              <div class="flex flex-wrap gap-4">
                @for (entry of healthEntries(); track entry.service) {
                  <div class="flex items-center gap-2 px-3 py-2 rounded-xl border border-border">
                    <span class="w-2 h-2 rounded-full"
                          [class]="entry.status === 'ok' ? 'bg-green-500' : entry.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'">
                    </span>
                    <span class="text-sm font-medium text-text-primary capitalize">{{ entry.service }}</span>
                    <span class="text-xs text-text-secondary">{{ entry.status }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- ─── Products tab ───────────────────────────────────── -->
      @if (activeTab() === 'products') {
        <div class="rounded-2xl border border-border bg-bg-base overflow-hidden">
          <div class="px-5 py-3 bg-surface-50 dark:bg-surface-900 border-b border-border">
            <h2 class="font-semibold text-text-primary text-sm">Top Products by Revenue</h2>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left">
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">#</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Product</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Units Sold</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Revenue</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Revenue Share</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (p of topProducts(); track p.productId; let i = $index) {
                <tr class="hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                  <td class="px-5 py-3 text-text-secondary font-mono">{{ i + 1 }}</td>
                  <td class="px-5 py-3">
                    <a [routerLink]="['/products', p.slug]"
                       class="font-medium text-text-primary hover:text-primary-600 truncate max-w-[200px] block">
                      {{ p.name }}
                    </a>
                  </td>
                  <td class="px-5 py-3 text-text-secondary">{{ p.unitsSold | number }}</td>
                  <td class="px-5 py-3 font-semibold text-text-primary">{{ p.revenue | currencyInr }}</td>
                  <td class="px-5 py-3 w-48">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                        <div class="h-full rounded-full bg-primary-500"
                             [style.width.%]="productRevPct(p.revenue)"></div>
                      </div>
                      <span class="text-xs text-text-secondary w-8 text-right">
                        {{ productRevPct(p.revenue) | number: '1.0-1' }}%
                      </span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ─── Vendors tab ────────────────────────────────────── -->
      @if (activeTab() === 'vendors') {
        <div class="rounded-2xl border border-border bg-bg-base overflow-hidden">
          <div class="px-5 py-3 bg-surface-50 dark:bg-surface-900 border-b border-border">
            <h2 class="font-semibold text-text-primary text-sm">Top Vendors by Revenue</h2>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left">
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">#</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Store</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">Orders</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Revenue</th>
                <th class="px-5 py-3 text-xs font-semibond text-text-secondary">Share</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (v of topVendors(); track v.vendorId; let i = $index) {
                <tr class="hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                  <td class="px-5 py-3 text-text-secondary font-mono">{{ i + 1 }}</td>
                  <td class="px-5 py-3">
                    <a [routerLink]="['/vendors', v.storeSlug]"
                       class="font-medium text-text-primary hover:text-primary-600">
                      {{ v.storeName }}
                    </a>
                  </td>
                  <td class="px-5 py-3 text-text-secondary hidden sm:table-cell">{{ v.orderCount | number }}</td>
                  <td class="px-5 py-3 font-semibold text-text-primary">{{ v.revenue | currencyInr }}</td>
                  <td class="px-5 py-3 w-48">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
                        <div class="h-full rounded-full bg-accent"
                             [style.width.%]="vendorRevPct(v.revenue)"></div>
                      </div>
                      <span class="text-xs text-text-secondary w-8 text-right">
                        {{ vendorRevPct(v.revenue) | number: '1.0-1' }}%
                      </span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ─── Orders tab ─────────────────────────────────────── -->
      @if (activeTab() === 'orders') {
        <div class="rounded-2xl border border-border bg-bg-base overflow-hidden">
          <div class="px-5 py-3 bg-surface-50 dark:bg-surface-900 border-b border-border">
            <h2 class="font-semibold text-text-primary text-sm">All Recent Orders</h2>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left">
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Order #</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">Customer</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Amount</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary">Status</th>
                <th class="px-5 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (o of recentOrders(); track o.id) {
                <tr class="hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors">
                  <td class="px-5 py-3 font-mono text-text-primary">{{ o.orderNumber }}</td>
                  <td class="px-5 py-3 hidden sm:table-cell">
                    <p class="font-medium text-text-primary">{{ o.user?.name ?? '—' }}</p>
                    <p class="text-xs text-text-secondary">{{ o.user?.email ?? '' }}</p>
                  </td>
                  <td class="px-5 py-3 font-semibold text-text-primary">{{ o.total | currencyInr }}</td>
                  <td class="px-5 py-3">
                    <lg-badge [variant]="orderStatusVariant(o.status)">{{ o.status }}</lg-badge>
                  </td>
                  <td class="px-5 py-3 text-text-secondary text-xs hidden md:table-cell">
                    {{ o.createdAt | date: 'd MMM y, h:mm a' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  readonly #analytics  = inject(AnalyticsService);
  readonly #monitoring = inject(MonitoringService);

  summaryLoading = signal(true);
  chartLoading   = signal(true);
  trendDays      = signal(30);
  activeTab      = signal<AdminTab>('overview');

  summary         = signal<AnalyticsSummary | null>(null);
  trendData       = signal<TrendPoint[]>([]);
  userTrendData   = signal<{ date: string; signups: number }[]>([]);
  topProducts     = signal<TopProduct[]>([]);
  topVendors      = signal<TopVendor[]>([]);
  statusBreakdown = signal<StatusBreak[]>([]);
  categories      = signal<CatBreak[]>([]);
  recentOrders    = signal<RecentOrder[]>([]);
  health          = signal<HealthCheck | null>(null);

  readonly healthEntries = computed(() => {
    const h = this.health();
    if (!h) return [];
    return Object.entries(h.checks).map(([service, status]) => ({ service, status }));
  });

  readonly tabs = [
    { key: 'overview' as AdminTab, label: 'Overview',  icon: 'dashboard' },
    { key: 'products' as AdminTab, label: 'Products',  icon: 'inventory_2' },
    { key: 'vendors'  as AdminTab, label: 'Vendors',   icon: 'store' },
    { key: 'orders'   as AdminTab, label: 'Orders',    icon: 'receipt_long' },
  ];

  readonly kpiCards = computed(() => {
    const s = this.summary();
    if (!s) return [];
    return [
      {
        icon: 'currency_rupee', label: 'Total Revenue',
        value: this.formatRevenue(s.totalRevenue),
        bg: '#dcfce7', color: '#16a34a', change: s.revenueChange,
      },
      {
        icon: 'receipt_long', label: 'Total Orders',
        value: s.totalOrders.toLocaleString('en-IN'),
        bg: '#dbeafe', color: '#2563eb', change: s.ordersChange,
      },
      {
        icon: 'people', label: 'Total Users',
        value: s.totalUsers.toLocaleString('en-IN'),
        bg: '#ede9fe', color: '#7c3aed', change: s.usersChange,
      },
      {
        icon: 'store', label: 'Active Vendors',
        value: s.totalVendors.toLocaleString('en-IN'),
        bg: '#fef3c7', color: '#d97706', change: null,
      },
    ];
  });

  readonly chartLabels  = computed(() => this.trendData().map(d => d.date));
  readonly revenueSeries = computed((): ChartSeries[] => [
    { label: 'Revenue (₹)', values: this.trendData().map(d => d.revenue), color: '#6366f1' },
  ]);
  readonly userSeries = computed((): ChartSeries[] => [
    { label: 'Signups', values: this.userTrendData().map(d => d.signups), color: '#f59e0b' },
  ]);

  readonly totalOrderCount   = computed(() => this.statusBreakdown().reduce((s, r) => s + r.count, 0) || 1);
  readonly maxProductRevenue = computed(() => Math.max(...this.topProducts().map(p => p.revenue), 1));
  readonly maxVendorRevenue  = computed(() => Math.max(...this.topVendors().map(v => v.revenue), 1));
  readonly maxCatRevenue     = computed(() => Math.max(...this.categories().map(c => c.revenue), 1));

  ngOnInit() {
    this.loadAll();
  }

  setTrendDays(d: number) {
    this.trendDays.set(d);
    this.loadTrends(d);
  }

  loadAll() {
    this.#analytics.getSummary().subscribe({
      next:  r => { this.summary.set(r.data); this.summaryLoading.set(false); },
      error: () => this.summaryLoading.set(false),
    });
    this.#analytics.getOrderStatus().subscribe({ next: r => this.statusBreakdown.set(r.data), error: () => {} });
    this.#analytics.getCategoryBreakdown().subscribe({ next: r => this.categories.set(r.data), error: () => {} });
    this.#analytics.getTopProducts().subscribe({ next: r => this.topProducts.set(r.data), error: () => {} });
    this.#analytics.getTopVendors().subscribe({ next: r => this.topVendors.set(r.data), error: () => {} });
    this.#analytics.getRecentOrders().subscribe({ next: r => this.recentOrders.set(r.data), error: () => {} });
    this.#monitoring.getHealth().subscribe({ next: h => this.health.set(h), error: () => {} });
    this.loadTrends(this.trendDays());
  }

  loadTrends(days: number) {
    this.chartLoading.set(true);
    this.#analytics.getRevenueTrend(days).subscribe({
      next:  r => { this.trendData.set(r.data); this.chartLoading.set(false); },
      error: () => this.chartLoading.set(false),
    });
    this.#analytics.getUserTrend(days).subscribe({ next: r => this.userTrendData.set(r.data), error: () => {} });
  }

  formatRevenue = (v: number) => `₹${(v / 1000).toFixed(0)}k`;
  formatCount   = (v: number) => String(v);

  statusPct(count: number)       { return (count / this.totalOrderCount()) * 100; }
  productRevPct(rev: number)     { return (rev / this.maxProductRevenue()) * 100; }
  vendorRevPct(rev: number)      { return (rev / this.maxVendorRevenue()) * 100; }
  catPct(rev: number)            { return (rev / this.maxCatRevenue()) * 100; }

  statusColor(status: string): string {
    const map: Record<string, string> = {
      pending:          '#f59e0b',
      confirmed:        '#3b82f6',
      processing:       '#8b5cf6',
      shipped:          '#06b6d4',
      out_for_delivery: '#10b981',
      delivered:        '#22c55e',
      cancelled:        '#ef4444',
    };
    return map[status] ?? '#94a3b8';
  }

  formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  orderStatusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
    if (status === 'delivered')              return 'success';
    if (['cancelled', 'refunded'].includes(status)) return 'error';
    if (['shipped', 'out_for_delivery'].includes(status)) return 'info';
    if (['confirmed', 'processing'].includes(status)) return 'warning';
    return 'default';
  }
}

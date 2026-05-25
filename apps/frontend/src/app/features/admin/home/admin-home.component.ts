import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AdminService, AdminSummary, TrendPoint, TopProduct, TopVendor,
  StatusBreak, CatBreak, RecentOrder
} from '../../../core/services/admin.service';

interface KpiCard {
  label: string; value: string; icon: string;
  gradient: string; iconColor: string; sub?: string; trend?: string; trendUp?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending:          '#f59e0b',
  confirmed:        '#3b82f6',
  processing:       '#8b5cf6',
  shipped:          '#6366f1',
  out_for_delivery: '#06b6d4',
  delivered:        '#10b981',
  cancelled:        '#ef4444',
  refund_requested: '#f97316',
  refunded:         '#6b7280',
};

@Component({
  selector: 'lg-admin-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
<div class="p-6 max-w-screen-2xl mx-auto space-y-6">

  <!-- Welcome bar -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ greeting() }} · Platform overview</p>
    </div>
    <div class="flex gap-2">
      <a routerLink="/admin/products/new"
         class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
        <span class="material-icons text-[16px]">add</span> Add Product
      </a>
      <a routerLink="/admin/vendors/approvals"
         class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors">
        <span class="material-icons text-[16px]">how_to_reg</span> Approve Vendors
      </a>
      <a routerLink="/admin/orders"
         class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <span class="material-icons text-[16px]">receipt_long</span> Orders
      </a>
    </div>
  </div>

  <!-- KPI cards -->
  @if (summaryLoading()) {
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      @for (i of [1,2,3,4,5,6,7,8]; track i) {
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse h-28 col-span-1"></div>
      }
    </div>
  } @else {
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      @for (kpi of kpiCards(); track kpi.label) {
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-xl {{ kpi.gradient }} flex items-center justify-center">
              <span class="material-icons text-[20px] {{ kpi.iconColor }}">{{ kpi.icon }}</span>
            </div>
            @if (kpi.trend) {
              <span class="text-xs font-medium {{ kpi.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-500' }}">
                {{ kpi.trend }}
              </span>
            }
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ kpi.label }}</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{{ kpi.value }}</p>
          @if (kpi.sub) { <p class="text-xs text-gray-400 mt-0.5">{{ kpi.sub }}</p> }
        </div>
      }
    </div>
  }

  <!-- Revenue + Orders charts row -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

    <!-- Revenue trend chart (2/3 width) -->
    <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-semibold text-gray-900 dark:text-white text-sm">Revenue Trend</h2>
        <div class="flex gap-1">
          @for (d of [7, 14, 30]; track d) {
            <button (click)="setRevenueDays(d)"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
              [class]="revenueDays() === d ? 'bg-green-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'">
              {{ d }}d
            </button>
          }
        </div>
      </div>
      @if (revenueLoading()) {
        <div class="h-48 animate-pulse bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
      } @else {
        <div class="h-48 flex items-end gap-0.5 relative">
          <!-- Y axis hint -->
          <div class="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-gray-400 pr-1">
            <span>{{ maxRevenue() | currency:'INR':'symbol':'1.0-0' }}</span>
            <span>{{ (maxRevenue() / 2) | currency:'INR':'symbol':'1.0-0' }}</span>
            <span>₹0</span>
          </div>
          <div class="flex-1 flex items-end gap-0.5 pl-12 h-full">
            @for (pt of revenueTrend(); track pt.date) {
              <div class="flex-1 flex flex-col items-center gap-1 group">
                <div
                  class="w-full rounded-t-sm bg-green-500 dark:bg-green-600 opacity-80 group-hover:opacity-100 transition-opacity relative"
                  [style.height]="barHeight(pt.value, maxRevenue()) + '%'"
                  [title]="pt.date + ': ₹' + pt.value">
                </div>
                @if (revenueTrend().length <= 14) {
                  <span class="text-[9px] text-gray-400 truncate w-full text-center">{{ shortDate(pt.date) }}</span>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>

    <!-- Order status donut (1/3 width) -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">Order Status</h2>
      @if (statusLoading()) {
        <div class="h-40 animate-pulse bg-gray-100 dark:bg-gray-700 rounded-full w-40 mx-auto"></div>
      } @else {
        <!-- Conic-gradient donut -->
        <div class="flex items-center justify-center mb-4">
          <div class="w-36 h-36 rounded-full relative"
               [style.background]="donutGradient()">
            <div class="absolute inset-4 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
              <div class="text-center">
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ totalOrders() }}</p>
                <p class="text-[10px] text-gray-400">total</p>
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-1.5">
          @for (s of statusBreakdown(); track s.status) {
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 rounded-sm" [style.background]="statusColor(s.status)"></div>
                <span class="text-gray-600 dark:text-gray-400 capitalize">{{ s.status.replace('_', ' ') }}</span>
              </div>
              <span class="font-semibold text-gray-900 dark:text-white">{{ s.count }}</span>
            </div>
          }
        </div>
      }
    </div>
  </div>

  <!-- Top products + Top vendors -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

    <!-- Top products -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 class="font-semibold text-gray-900 dark:text-white text-sm">Top Products</h2>
        <a routerLink="/admin/analytics/products" class="text-xs text-green-600 dark:text-green-400 hover:underline">View all</a>
      </div>
      @if (topProductsLoading()) {
        <div class="p-5 space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="h-8 animate-pulse bg-gray-100 dark:bg-gray-700 rounded"></div>
          }
        </div>
      } @else {
        <div class="divide-y divide-gray-50 dark:divide-gray-700">
          @for (p of topProducts(); track p.id; let i = $index) {
            <div class="flex items-center gap-3 px-5 py-3">
              <span class="text-xs font-bold text-gray-400 w-5">{{ i + 1 }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ p.name }}</p>
                <p class="text-xs text-gray-400">{{ p.sales }} sales</p>
              </div>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ p.revenue | currency:'INR':'symbol':'1.0-0' }}</p>
              <!-- Revenue bar -->
              <div class="w-16 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 shrink-0">
                <div class="h-full rounded-full bg-green-500"
                     [style.width.%]="topProductBar(p.revenue)"></div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Top vendors -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 class="font-semibold text-gray-900 dark:text-white text-sm">Top Vendors</h2>
        <a routerLink="/admin/vendors" class="text-xs text-green-600 dark:text-green-400 hover:underline">View all</a>
      </div>
      @if (topVendorsLoading()) {
        <div class="p-5 space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="h-8 animate-pulse bg-gray-100 dark:bg-gray-700 rounded"></div>
          }
        </div>
      } @else {
        <div class="divide-y divide-gray-50 dark:divide-gray-700">
          @for (v of topVendors(); track v.id; let i = $index) {
            <div class="flex items-center gap-3 px-5 py-3">
              <span class="text-xs font-bold text-gray-400 w-5">{{ i + 1 }}</span>
              <div class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                <span class="material-icons text-[14px] text-slate-500">store</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ v.storeName }}</p>
                <p class="text-xs text-gray-400">{{ v.orders }} orders</p>
              </div>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ v.revenue | currency:'INR':'symbol':'1.0-0' }}</p>
            </div>
          }
        </div>
      }
    </div>
  </div>

  <!-- Recent orders + Category breakdown -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

    <!-- Recent orders (2/3) -->
    <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 class="font-semibold text-gray-900 dark:text-white text-sm">Recent Orders</h2>
        <a routerLink="/admin/orders" class="text-xs text-green-600 dark:text-green-400 hover:underline">View all</a>
      </div>
      @if (recentOrdersLoading()) {
        <div class="p-5 space-y-3">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="h-8 animate-pulse bg-gray-100 dark:bg-gray-700 rounded"></div>
          }
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th class="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Order</th>
                <th class="text-left px-3 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Customer</th>
                <th class="text-right px-3 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th class="text-center px-3 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th class="text-left px-5 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50 dark:divide-gray-700">
              @for (o of recentOrders(); track o.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-5 py-3">
                    <a [routerLink]="['/admin/orders', o.id]"
                       class="font-mono text-xs font-semibold text-green-600 dark:text-green-400 hover:underline">
                      {{ o.orderNumber }}
                    </a>
                  </td>
                  <td class="px-3 py-3 text-xs text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                    {{ o.customerName ?? 'Customer' }}
                  </td>
                  <td class="px-3 py-3 text-xs text-right font-semibold text-gray-900 dark:text-white">
                    {{ o.total | currency:'INR':'symbol':'1.0-0' }}
                  </td>
                  <td class="px-3 py-3 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium {{ statusBadge(o.status) }}">
                      {{ o.status.replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {{ o.createdAt | date:'d MMM, h:mm a' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Category breakdown (1/3) -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">Category Sales</h2>
      @if (catLoading()) {
        <div class="space-y-3">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="h-6 animate-pulse bg-gray-100 dark:bg-gray-700 rounded"></div>
          }
        </div>
      } @else {
        <div class="space-y-3">
          @for (c of catBreakdown(); track c.category; let i = $index) {
            <div>
              <div class="flex justify-between text-xs mb-1">
                <span class="text-gray-600 dark:text-gray-400 truncate">{{ c.category }}</span>
                <span class="font-semibold text-gray-900 dark:text-white ml-2">{{ c.count }}</span>
              </div>
              <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                <div class="h-full rounded-full transition-all duration-500"
                     [style.width.%]="catBarWidth(c.count)"
                     [style.background]="catColors[i % catColors.length]"></div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  </div>

  <!-- Quick actions footer -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
    @for (action of quickActions; track action.label) {
      <a [routerLink]="action.route"
         class="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:shadow-sm transition-all group">
        <div class="w-10 h-10 rounded-xl {{ action.color }} flex items-center justify-center group-hover:scale-110 transition-transform">
          <span class="material-icons text-[20px]">{{ action.icon }}</span>
        </div>
        <span class="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{{ action.label }}</span>
      </a>
    }
  </div>

</div>
  `,
})
export class AdminHomeComponent implements OnInit {
  readonly #admin = inject(AdminService);

  readonly summaryLoading      = signal(true);
  readonly revenueLoading      = signal(true);
  readonly statusLoading       = signal(true);
  readonly topProductsLoading  = signal(true);
  readonly topVendorsLoading   = signal(true);
  readonly recentOrdersLoading = signal(true);
  readonly catLoading          = signal(true);

  readonly summary         = signal<AdminSummary | null>(null);
  readonly revenueTrend    = signal<TrendPoint[]>([]);
  readonly statusBreakdown = signal<StatusBreak[]>([]);
  readonly topProducts     = signal<TopProduct[]>([]);
  readonly topVendors      = signal<TopVendor[]>([]);
  readonly recentOrders    = signal<RecentOrder[]>([]);
  readonly catBreakdown    = signal<CatBreak[]>([]);
  readonly revenueDays     = signal(30);

  readonly maxRevenue  = computed(() => Math.max(...this.revenueTrend().map(p => p.value), 1));
  readonly totalOrders = computed(() => this.statusBreakdown().reduce((s, x) => s + x.count, 0));

  readonly donutGradient = computed(() => {
    const list = this.statusBreakdown();
    if (!list.length) return 'conic-gradient(#e5e7eb 0% 100%)';
    const total = list.reduce((s, x) => s + x.count, 0);
    let angle = 0;
    const stops: string[] = [];
    list.forEach(s => {
      const pct = (s.count / total) * 100;
      const color = STATUS_COLORS[s.status] ?? '#6b7280';
      stops.push(`${color} ${angle.toFixed(1)}% ${(angle + pct).toFixed(1)}%`);
      angle += pct;
    });
    return `conic-gradient(${stops.join(', ')})`;
  });

  readonly kpiCards = computed<KpiCard[]>(() => {
    const s = this.summary();
    if (!s) return [];
    return [
      { label: 'Total Revenue',    value: '₹' + this.fmt(s.totalRevenue),  icon: 'trending_up',    gradient: 'bg-green-100 dark:bg-green-900/40',  iconColor: 'text-green-600 dark:text-green-400' },
      { label: 'Total Orders',     value: this.fmtN(s.totalOrders),        icon: 'shopping_bag',   gradient: 'bg-blue-100 dark:bg-blue-900/40',    iconColor: 'text-blue-600 dark:text-blue-400'   },
      { label: 'Customers',        value: this.fmtN(s.totalUsers),         icon: 'people',         gradient: 'bg-purple-100 dark:bg-purple-900/40',iconColor: 'text-purple-600 dark:text-purple-400'},
      { label: 'Vendors',          value: this.fmtN(s.totalVendors),       icon: 'storefront',     gradient: 'bg-amber-100 dark:bg-amber-900/40',  iconColor: 'text-amber-600 dark:text-amber-400'  },
      { label: 'Products',         value: this.fmtN(s.totalProducts),      icon: 'inventory_2',    gradient: 'bg-cyan-100 dark:bg-cyan-900/40',    iconColor: 'text-cyan-600 dark:text-cyan-400'   },
      { label: 'Pending Orders',   value: this.fmtN(s.pendingOrders),      icon: 'pending',        gradient: 'bg-orange-100 dark:bg-orange-900/40',iconColor: 'text-orange-600 dark:text-orange-400'},
      { label: 'Pending Vendors',  value: this.fmtN(s.pendingVendors),     icon: 'how_to_reg',     gradient: 'bg-indigo-100 dark:bg-indigo-900/40',iconColor: 'text-indigo-600 dark:text-indigo-400'},
      { label: 'Refund Requests',  value: this.fmtN(s.refundRequests),     icon: 'assignment_return',gradient: 'bg-red-100 dark:bg-red-900/40',   iconColor: 'text-red-600 dark:text-red-400'     },
    ];
  });

  readonly catColors = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#6366f1'];

  readonly quickActions = [
    { label: 'Add Product',     icon: 'add_box',        color: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',   route: '/admin/products/new' },
    { label: 'View Orders',     icon: 'receipt_long',   color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',       route: '/admin/orders' },
    { label: 'Approve Vendor',  icon: 'how_to_reg',     color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',   route: '/admin/vendors/approvals' },
    { label: 'Manage CMS',      icon: 'web',            color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',route: '/admin/cms/banners' },
    { label: 'Analytics',       icon: 'bar_chart',      color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',       route: '/admin/analytics' },
  ];

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  });

  ngOnInit(): void {
    this.loadSummary();
    this.loadRevenue();
    this.loadStatus();
    this.loadTopProducts();
    this.loadTopVendors();
    this.loadRecentOrders();
    this.loadCategories();
  }

  setRevenueDays(d: number): void {
    this.revenueDays.set(d);
    this.loadRevenue();
  }

  private loadSummary(): void {
    this.#admin.getSummary().subscribe({
      next: r => { this.summary.set(r.data); this.summaryLoading.set(false); },
      error: () => this.summaryLoading.set(false),
    });
  }
  private loadRevenue(): void {
    this.revenueLoading.set(true);
    this.#admin.getRevenueTrend(this.revenueDays()).subscribe({
      next: r => { this.revenueTrend.set(r.data); this.revenueLoading.set(false); },
      error: () => this.revenueLoading.set(false),
    });
  }
  private loadStatus(): void {
    this.#admin.getOrderStatusBreakdown().subscribe({
      next: r => { this.statusBreakdown.set(r.data); this.statusLoading.set(false); },
      error: () => this.statusLoading.set(false),
    });
  }
  private loadTopProducts(): void {
    this.#admin.getTopProducts().subscribe({
      next: r => { this.topProducts.set(r.data); this.topProductsLoading.set(false); },
      error: () => this.topProductsLoading.set(false),
    });
  }
  private loadTopVendors(): void {
    this.#admin.getTopVendors().subscribe({
      next: r => { this.topVendors.set(r.data); this.topVendorsLoading.set(false); },
      error: () => this.topVendorsLoading.set(false),
    });
  }
  private loadRecentOrders(): void {
    this.#admin.getRecentOrders().subscribe({
      next: r => { this.recentOrders.set(r.data); this.recentOrdersLoading.set(false); },
      error: () => this.recentOrdersLoading.set(false),
    });
  }
  private loadCategories(): void {
    this.#admin.getCategoryBreakdown().subscribe({
      next: r => { this.catBreakdown.set(r.data); this.catLoading.set(false); },
      error: () => this.catLoading.set(false),
    });
  }

  barHeight(v: number, max: number): number { return max ? Math.max((v / max) * 100, 2) : 2; }
  topProductBar(rev: number): number {
    const max = Math.max(...this.topProducts().map(p => p.revenue), 1);
    return (rev / max) * 100;
  }
  catBarWidth(count: number): number {
    const max = Math.max(...this.catBreakdown().map(c => c.count), 1);
    return (count / max) * 100;
  }
  statusColor(s: string): string { return STATUS_COLORS[s] ?? '#6b7280'; }
  statusBadge(s: string): string {
    const m: Record<string, string> = {
      pending:    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      delivered:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
      cancelled:  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
      shipped:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
    };
    return m[s] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
  shortDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  fmt(n: number): string {
    if (n >= 1e7) return (n / 1e7).toFixed(1) + 'Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(1) + 'L';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toFixed(0);
  }
  fmtN(n: number): string {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
  }
}

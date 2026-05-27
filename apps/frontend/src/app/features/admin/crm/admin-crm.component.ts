import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminCrmCustomer } from '../../../core/services/admin.service';

type CrmView = 'profiles' | 'segments' | 'activity' | 'wishlist' | 'ltv';

@Component({
  selector: 'lg-admin-crm',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">CRM Center</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Customer profiles, segments, activity and lifetime value</p>
    </div>
    <button (click)="exportCsv()"
      class="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <span class="material-icons text-[16px]">download</span> Export
    </button>
  </div>

  <!-- KPI Row -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    @for (k of kpis(); track k.label) {
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{{ k.label }}</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ k.value }}</p>
        @if (k.sub) { <p class="text-xs text-gray-400 mt-0.5">{{ k.sub }}</p> }
      </div>
    }
  </div>

  <!-- Tabs -->
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
    <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 px-4">
      @for (t of tabs; track t.id) {
        <button (click)="activeView.set(t.id)"
          class="flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors shrink-0"
          [class]="activeView() === t.id
            ? 'border-green-600 text-green-600 dark:text-green-400 dark:border-green-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
          <span class="material-icons text-[16px]">{{ t.icon }}</span>
          {{ t.label }}
        </button>
      }
    </div>

    <!-- Customer Profiles -->
    @if (activeView() === 'profiles') {
      <div class="p-4 space-y-4">
        <div class="flex flex-wrap gap-3">
          <div class="relative flex-1 min-w-[200px]">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-[18px]">search</span>
            <input [(ngModel)]="searchQ" (input)="filterCustomers()"
              placeholder="Name, email, phone…"
              class="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500">
          </div>
          <select [(ngModel)]="segmentFilter" (change)="filterCustomers()"
            class="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
            <option value="">All Segments</option>
            <option value="vip">VIP</option>
            <option value="regular">Regular</option>
            <option value="new">New</option>
            <option value="at_risk">At Risk</option>
            <option value="churned">Churned</option>
          </select>
          <select [(ngModel)]="sortBy" (change)="filterCustomers()"
            class="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
            <option value="ltv_desc">Sort: Highest LTV</option>
            <option value="orders_desc">Sort: Most Orders</option>
            <option value="recent">Sort: Most Recent</option>
          </select>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                @for (h of profileHeaders; track h) {
                  <th class="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{{ h }}</th>
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
                @for (c of displayedCustomers(); track c.id) {
                  <tr class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                      (click)="selectedCustomer.set(c)">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" [style.background]="avatarBg(c.name)">
                          {{ c.name.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <p class="font-medium text-gray-800 dark:text-gray-200 text-xs">{{ c.name }}</p>
                          <p class="text-[11px] text-gray-400">{{ c.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-center font-semibold text-gray-800 dark:text-gray-200">{{ c.totalOrders }}</td>
                    <td class="px-4 py-3 font-semibold text-gray-900 dark:text-white">₹{{ c.totalSpent | number }}</td>
                    <td class="px-4 py-3 font-bold text-green-600 dark:text-green-400">₹{{ c.ltv | number }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" [class]="segmentBadge(c.segment)">{{ c.segment | titlecase }}</span>
                    </td>
                    <td class="px-4 py-3 text-gray-400 text-xs">{{ c.lastOrderAt ? (c.lastOrderAt | date:'dd MMM yyyy') : 'Never' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="text-center py-12 text-gray-400">No customers found</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Segments -->
    @if (activeView() === 'segments') {
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (seg of segmentDefs; track seg.id) {
            <div class="border rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow" [class]="seg.border">
              <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" [class]="seg.bg">
                  <span class="material-icons text-[20px]" [class]="seg.iconColor">{{ seg.icon }}</span>
                </div>
                <span class="text-xl font-bold" [class]="seg.iconColor">{{ segmentCount(seg.id) }}</span>
              </div>
              <h3 class="font-semibold text-sm text-gray-900 dark:text-white">{{ seg.name }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ seg.desc }}</p>
              <button class="mt-3 text-xs font-medium" [class]="seg.iconColor"
                (click)="activeView.set('profiles'); segmentFilter = seg.id; filterCustomers()">
                View Customers →
              </button>
            </div>
          }
        </div>
      </div>
    }

    <!-- Activity Logs -->
    @if (activeView() === 'activity') {
      <div class="p-6">
        <div class="space-y-3">
          @for (log of activityLogs(); track log.id) {
            <div class="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" [class]="log.bg">
                <span class="material-icons text-[16px]" [class]="log.color">{{ log.icon }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-800 dark:text-gray-200 font-medium">{{ log.action }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ log.customer }} · {{ log.email }}</p>
              </div>
              <span class="text-xs text-gray-400 shrink-0">{{ log.time }}</span>
            </div>
          }
        </div>
      </div>
    }

    <!-- Wishlist / LTV (info panels) -->
    @if (activeView() === 'wishlist' || activeView() === 'ltv') {
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          @for (m of (activeView() === 'ltv' ? ltvMetrics() : wishlistMetrics()); track m.label) {
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ m.value }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ m.label }}</p>
            </div>
          }
        </div>
        <div class="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
          <span class="material-icons text-blue-500">info</span>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            {{ activeView() === 'ltv'
              ? 'LTV calculation uses order history over the customer lifetime. Deep analytics including cohort analysis and churn prediction available in Analytics > Customers.'
              : 'Wishlist tracking shows which products customers are saving. Use this data to trigger targeted campaigns when items go on sale.' }}
          </p>
        </div>
      </div>
    }
  </div>

  <!-- Customer Detail Side Panel -->
  @if (selectedCustomer()) {
    <div class="fixed inset-0 z-50 flex justify-end" (click)="selectedCustomer.set(null)">
      <div class="bg-white dark:bg-gray-800 w-full max-w-sm h-full shadow-2xl overflow-y-auto" (click)="$event.stopPropagation()">
        @let c = selectedCustomer()!;
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="font-bold text-gray-900 dark:text-white">Customer Profile</h3>
          <button (click)="selectedCustomer.set(null)" class="text-gray-400 hover:text-gray-600">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="p-5 space-y-5">
          <!-- Avatar + name -->
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold" [style.background]="avatarBg(c.name)">
              {{ c.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-bold text-gray-900 dark:text-white">{{ c.name }}</p>
              <p class="text-sm text-gray-500">{{ c.email }}</p>
              @if (c.phone) { <p class="text-sm text-gray-400">{{ c.phone }}</p> }
            </div>
          </div>

          <!-- Segment badge -->
          <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold" [class]="segmentBadge(c.segment)">
            {{ c.segment | titlecase }} Customer
          </span>

          <!-- Stats grid -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ c.totalOrders }}</p>
              <p class="text-xs text-gray-400">Total Orders</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
              <p class="text-lg font-bold text-gray-900 dark:text-white">₹{{ c.totalSpent | number }}</p>
              <p class="text-xs text-gray-400">Total Spent</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
              <p class="text-lg font-bold text-green-600 dark:text-green-400">₹{{ c.ltv | number }}</p>
              <p class="text-xs text-gray-400">Lifetime Value</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ c.joinedAt | date:'MMM yyyy' }}</p>
              <p class="text-xs text-gray-400">Member Since</p>
            </div>
          </div>

          <div class="flex gap-3">
            <a [href]="'mailto:' + c.email"
              class="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span class="material-icons text-[16px]">email</span> Email
            </a>
            <button
              class="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              <span class="material-icons text-[16px]">visibility</span> View Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  }
</div>
  `,
})
export class AdminCrmComponent implements OnInit {
  readonly #admin = inject(AdminService);

  readonly activeView       = signal<CrmView>('profiles');
  readonly loading          = signal(false);
  readonly customers        = signal<AdminCrmCustomer[]>([]);
  readonly selectedCustomer = signal<AdminCrmCustomer | null>(null);

  searchQ       = '';
  segmentFilter = '';
  sortBy        = 'ltv_desc';

  readonly tabs = [
    { id: 'profiles'  as CrmView, label: 'Customer Profiles',  icon: 'person_search' },
    { id: 'segments'  as CrmView, label: 'Segments',           icon: 'group_work' },
    { id: 'activity'  as CrmView, label: 'Activity Logs',      icon: 'timeline' },
    { id: 'wishlist'  as CrmView, label: 'Wishlists',          icon: 'favorite' },
    { id: 'ltv'       as CrmView, label: 'LTV Report',         icon: 'trending_up' },
  ];

  readonly profileHeaders = ['Customer', 'Orders', 'Total Spent', 'LTV', 'Segment', 'Last Order'];

  readonly segmentDefs = [
    { id: 'vip',      name: 'VIP Customers',  desc: '5+ orders or ₹5K+ total spend', icon: 'star',       bg: 'bg-yellow-50 dark:bg-yellow-900/30', iconColor: 'text-yellow-500', border: 'border-yellow-200 dark:border-yellow-800' },
    { id: 'regular',  name: 'Regular',        desc: '2–4 orders in the last 6 months', icon: 'person',   bg: 'bg-blue-50 dark:bg-blue-900/30',     iconColor: 'text-blue-500',   border: 'border-blue-200 dark:border-blue-800' },
    { id: 'new',      name: 'New Customers',  desc: 'Joined in the last 30 days',       icon: 'new_releases', bg: 'bg-green-50 dark:bg-green-900/30', iconColor: 'text-green-500', border: 'border-green-200 dark:border-green-800' },
    { id: 'at_risk',  name: 'At Risk',        desc: 'No orders in 60–90 days',         icon: 'warning',  bg: 'bg-amber-50 dark:bg-amber-900/30',   iconColor: 'text-amber-500',  border: 'border-amber-200 dark:border-amber-800' },
    { id: 'churned',  name: 'Churned',        desc: 'No orders in 90+ days',           icon: 'person_off',bg: 'bg-red-50 dark:bg-red-900/30',     iconColor: 'text-red-500',    border: 'border-red-200 dark:border-red-800' },
  ];

  readonly displayedCustomers = computed(() => {
    let list = this.customers();
    if (this.searchQ) {
      const q = this.searchQ.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone?.includes(q) ?? false));
    }
    if (this.segmentFilter) list = list.filter(c => c.segment === this.segmentFilter);
    if (this.sortBy === 'ltv_desc')    list = [...list].sort((a, b) => b.ltv - a.ltv);
    if (this.sortBy === 'orders_desc') list = [...list].sort((a, b) => b.totalOrders - a.totalOrders);
    if (this.sortBy === 'recent')      list = [...list].sort((a, b) => new Date(b.lastOrderAt ?? 0).getTime() - new Date(a.lastOrderAt ?? 0).getTime());
    return list;
  });

  readonly kpis = computed(() => {
    const c = this.customers();
    const total   = c.length;
    const vip     = c.filter(x => x.segment === 'vip').length;
    const atRisk  = c.filter(x => x.segment === 'at_risk').length;
    const avgLTV  = total ? Math.round(c.reduce((s, x) => s + x.ltv, 0) / total) : 0;
    return [
      { label: 'Total Customers', value: total.toLocaleString(),        sub: 'registered users' },
      { label: 'VIP Customers',   value: vip.toLocaleString(),          sub: 'high-value segment' },
      { label: 'At Risk',         value: atRisk.toLocaleString(),       sub: 'need re-engagement' },
      { label: 'Avg LTV',         value: '₹' + avgLTV.toLocaleString(), sub: 'lifetime value' },
    ];
  });

  readonly activityLogs = computed(() => [
    { id: 1, action: 'New order placed — LG-0045', customer: 'Rahul Sharma',  email: 'rahul@example.com',  icon: 'shopping_bag',  bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400',  time: '2 min ago' },
    { id: 2, action: 'Account created',             customer: 'Priya Singh',   email: 'priya@example.com',  icon: 'person_add',    bg: 'bg-blue-100 dark:bg-blue-900/30',   color: 'text-blue-600 dark:text-blue-400',    time: '15 min ago' },
    { id: 3, action: 'Product added to wishlist',   customer: 'Amit Kumar',    email: 'amit@example.com',   icon: 'favorite',      bg: 'bg-red-100 dark:bg-red-900/30',     color: 'text-red-500',                        time: '1 hr ago' },
    { id: 4, action: 'Refund requested — LG-0041', customer: 'Sneha Patel',   email: 'sneha@example.com',  icon: 'undo',          bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400',  time: '3 hr ago' },
    { id: 5, action: 'Password reset request',      customer: 'Ravi Mehra',    email: 'ravi@example.com',   icon: 'lock_reset',    bg: 'bg-purple-100 dark:bg-purple-900/30',color: 'text-purple-600 dark:text-purple-400',time: 'Yesterday' },
  ]);

  readonly ltvMetrics    = computed(() => [
    { label: 'Avg LTV',       value: '₹0' },
    { label: 'Highest LTV',   value: '₹0' },
    { label: 'Total LTV Pool',value: '₹0' },
    { label: 'LTV Growth',    value: '0%' },
  ]);

  readonly wishlistMetrics = computed(() => [
    { label: 'Items Wishlisted', value: '0' },
    { label: 'Unique Products',  value: '0' },
    { label: 'Top Wishlisted',   value: '—' },
    { label: 'Conversion Rate',  value: '0%' },
  ]);

  segmentCount(seg: string): number {
    return this.customers().filter(c => c.segment === seg).length;
  }

  ngOnInit(): void {
    const url = window.location.pathname;
    if (url.includes('/segments'))   this.activeView.set('segments');
    else if (url.includes('/activity')) this.activeView.set('activity');
    else if (url.includes('/wishlist')) this.activeView.set('wishlist');
    else if (url.includes('/ltv'))      this.activeView.set('ltv');
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.#admin.getCrmCustomers().subscribe({
      next: res => { this.customers.set(res.data); this.loading.set(false); },
      error: () => { this.customers.set([]); this.loading.set(false); },
    });
  }

  filterCustomers(): void { /* displayedCustomers computed handles it */ }

  exportCsv(): void {
    const rows = [['Name', 'Email', 'Orders', 'Spent', 'LTV', 'Segment']];
    this.displayedCustomers().forEach(c => rows.push([c.name, c.email, c.totalOrders.toString(), c.totalSpent.toString(), c.ltv.toString(), c.segment]));
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crm-customers.csv'; a.click();
  }

  avatarBg(name: string): string {
    const colors = ['#16a34a','#2563eb','#9333ea','#d97706','#dc2626','#0891b2','#db2777','#059669'];
    return colors[name.charCodeAt(0) % colors.length];
  }

  segmentBadge(seg: string): string {
    const m: Record<string, string> = {
      vip:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      regular: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      new:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      at_risk: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      churned: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return m[seg] ?? 'bg-gray-100 text-gray-600';
  }
}

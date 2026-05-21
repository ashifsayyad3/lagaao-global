import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { VendorService, DashboardStats, VendorProfile } from '../../../core/services/vendor.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

type ActiveTab = 'overview' | 'products' | 'orders' | 'settings';

@Component({
  selector: 'lg-vendor-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe, DecimalPipe, SkeletonComponent, BadgeComponent, ButtonComponent, TimeAgoPipe],
  template: `
    <div class="max-w-screen-2xl mx-auto px-4 md:px-6 py-8">

      @if (loading()) {
        <div class="space-y-4">
          <lg-skeleton height="80px" borderRadius="1rem"></lg-skeleton>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            @for (i of [0,1,2,3]; track i) { <lg-skeleton height="100px" borderRadius="1rem"></lg-skeleton> }
          </div>
        </div>

      } @else if (notVendor()) {
        <div class="flex flex-col items-center py-20 text-center">
          <mat-icon class="!text-6xl text-text-muted mb-4">store</mat-icon>
          <h2 class="font-display text-2xl font-bold text-text-primary mb-2">You're not a seller yet</h2>
          <p class="text-text-secondary mb-8">Apply to become a vendor and start selling on Lagaao.</p>
          <lg-button variant="primary" size="lg" routerLink="/sell" prefixIcon="store">Become a Seller</lg-button>
        </div>

      } @else if (pendingApproval()) {
        <div class="flex flex-col items-center py-20 text-center">
          <div class="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <mat-icon class="!text-4xl text-amber-600">hourglass_empty</mat-icon>
          </div>
          <h2 class="font-display text-2xl font-bold text-text-primary mb-2">Application Under Review</h2>
          <p class="text-text-secondary">Your store <strong>{{ vendor()?.storeName }}</strong> is pending approval.</p>
          <p class="text-sm text-text-muted mt-2">We'll notify you within 2–3 business days.</p>
        </div>

      } @else {
        <!-- Dashboard header -->
        <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div class="flex items-center gap-4">
            @if (vendor()?.logo) {
              <img [src]="vendor()!.logo!" class="w-14 h-14 rounded-2xl object-cover" [alt]="vendor()!.storeName" />
            } @else {
              <div class="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center">
                <mat-icon class="text-primary-600 !text-2xl">store</mat-icon>
              </div>
            }
            <div>
              <div class="flex items-center gap-2">
                <h1 class="font-display text-xl font-bold text-text-primary">{{ vendor()?.storeName }}</h1>
                @if (vendor()?.isVerified) {
                  <mat-icon class="!text-base text-blue-500" title="Verified">verified</mat-icon>
                }
              </div>
              <p class="text-sm text-text-muted">lagaao.com/vendors/{{ vendor()?.storeSlug }}</p>
            </div>
          </div>
          <a [href]="'/vendors/' + vendor()?.storeSlug" target="_blank"
             class="flex items-center gap-1.5 text-sm text-primary-600 hover:underline">
            <mat-icon class="!text-base">open_in_new</mat-icon> View Store
          </a>
        </div>

        <!-- Tab nav -->
        <div class="flex gap-1 border-b border-border-default mb-6">
          @for (tab of tabs; track tab.key) {
            <button
              class="px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px"
              [class.border-primary-600]="activeTab() === tab.key"
              [class.text-primary-600]="activeTab() === tab.key"
              [class.border-transparent]="activeTab() !== tab.key"
              [class.text-text-secondary]="activeTab() !== tab.key"
              [class.hover:text-text-primary]="activeTab() !== tab.key"
              (click)="activeTab.set(tab.key)"
            >
              <mat-icon class="!text-sm mr-1">{{ tab.icon }}</mat-icon>
              {{ tab.label }}
            </button>
          }
        </div>

        <!-- Overview tab -->
        @if (activeTab() === 'overview') {
          @if (statsLoading()) {
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              @for (i of [0,1,2,3]; track i) { <lg-skeleton height="100px" borderRadius="1rem"></lg-skeleton> }
            </div>
          } @else {
            <!-- Stats cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              @for (card of statCards(); track card.label) {
                <div class="rounded-2xl border border-border-default bg-bg-base p-5">
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                         [style.background]="card.bg">
                      <mat-icon class="!text-xl" [style.color]="card.color">{{ card.icon }}</mat-icon>
                    </div>
                    @if (card.trend) {
                      <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {{ card.trend }}
                      </span>
                    }
                  </div>
                  <p class="text-2xl font-bold text-text-primary">{{ card.value }}</p>
                  <p class="text-xs text-text-muted mt-0.5">{{ card.label }}</p>
                </div>
              }
            </div>

            <!-- Recent orders -->
            @if (stats()?.recentOrders?.length) {
              <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
                <div class="px-5 py-3 bg-surface-50 border-b border-border-default flex items-center justify-between">
                  <h2 class="font-semibold text-text-primary text-sm">Recent Orders</h2>
                  <button (click)="activeTab.set('orders')"
                          class="text-xs text-primary-600 hover:underline">View all</button>
                </div>
                <div class="divide-y divide-border-default">
                  @for (order of stats()!.recentOrders.slice(0, 5); track $index) {
                    <div class="px-5 py-3 flex items-center justify-between text-sm">
                      <div>
                        <p class="font-medium text-text-primary">{{ getOrderNumber(order) }}</p>
                        <p class="text-xs text-text-muted">{{ getProductName(order) }}</p>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold text-text-primary">{{ getLineTotal(order) | currencyInr }}</p>
                        <p class="text-xs text-text-muted">{{ getOrderDate(order) | timeAgo }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          }
        }

        <!-- Products tab -->
        @if (activeTab() === 'products') {
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display font-bold text-lg text-text-primary">My Products</h2>
            <lg-button variant="primary" size="sm" prefixIcon="add" routerLink="/products/new">
              Add Product
            </lg-button>
          </div>

          @if (productsLoading()) {
            <div class="space-y-3">
              @for (i of [0,1,2,3]; track i) { <lg-skeleton height="70px" borderRadius="0.75rem"></lg-skeleton> }
            </div>
          } @else if (products().length === 0) {
            <div class="flex flex-col items-center py-16 text-center">
              <mat-icon class="!text-5xl text-text-muted mb-3">inventory_2</mat-icon>
              <p class="text-text-secondary mb-4">You haven't listed any products yet.</p>
              <lg-button variant="primary" routerLink="/products/new" prefixIcon="add">List Your First Product</lg-button>
            </div>
          } @else {
            <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-surface-50 border-b border-border-default">
                    <th class="text-left px-4 py-3 font-semibold text-text-secondary">Product</th>
                    <th class="text-left px-4 py-3 font-semibold text-text-secondary hidden sm:table-cell">Price</th>
                    <th class="text-left px-4 py-3 font-semibold text-text-secondary hidden md:table-cell">Category</th>
                    <th class="text-left px-4 py-3 font-semibold text-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-default">
                  @for (p of products(); track p.id) {
                    <tr class="hover:bg-surface-50 transition-colors">
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0">
                            <img [src]="p.images?.[0]?.url || '/assets/placeholder.png'" [alt]="p.name"
                                 class="w-full h-full object-cover" />
                          </div>
                          <a [routerLink]="['/products', p.slug]"
                             class="font-medium text-text-primary hover:text-primary-600 truncate max-w-[180px]">
                            {{ p.name }}
                          </a>
                        </div>
                      </td>
                      <td class="px-4 py-3 hidden sm:table-cell text-text-primary">
                        ₹{{ p.basePrice | number: '1.0-0' }}
                      </td>
                      <td class="px-4 py-3 hidden md:table-cell text-text-secondary">
                        {{ p.category?.name ?? '—' }}
                      </td>
                      <td class="px-4 py-3">
                        <lg-badge [variant]="p.status === 'active' ? 'success' : p.status === 'draft' ? 'default' : 'warning'">
                          {{ p.status }}
                        </lg-badge>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }

        <!-- Orders tab -->
        @if (activeTab() === 'orders') {
          <h2 class="font-display font-bold text-lg text-text-primary mb-4">Order Items</h2>
          @if (ordersLoading()) {
            <div class="space-y-3">
              @for (i of [0,1,2]; track i) { <lg-skeleton height="80px" borderRadius="0.75rem"></lg-skeleton> }
            </div>
          } @else if (orderItems().length === 0) {
            <div class="flex flex-col items-center py-16 text-center">
              <mat-icon class="!text-5xl text-text-muted mb-3">receipt_long</mat-icon>
              <p class="text-text-secondary">No orders yet.</p>
            </div>
          } @else {
            <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-surface-50 border-b border-border-default">
                    <th class="text-left px-4 py-3 font-semibold text-text-secondary">Order</th>
                    <th class="text-left px-4 py-3 font-semibold text-text-secondary">Product</th>
                    <th class="text-left px-4 py-3 font-semibold text-text-secondary hidden sm:table-cell">Amount</th>
                    <th class="text-left px-4 py-3 font-semibold text-text-secondary">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border-default">
                  @for (item of orderItems(); track $index) {
                    <tr class="hover:bg-surface-50 transition-colors">
                      <td class="px-4 py-3 font-mono text-text-primary">
                        {{ getOrderNumber(item) }}
                      </td>
                      <td class="px-4 py-3">
                        <p class="font-medium text-text-primary truncate max-w-[200px]">{{ getProductName(item) }}</p>
                        <p class="text-xs text-text-muted">Qty: {{ getQty(item) }}</p>
                      </td>
                      <td class="px-4 py-3 hidden sm:table-cell font-semibold text-text-primary">
                        {{ getLineTotal(item) | currencyInr }}
                      </td>
                      <td class="px-4 py-3">
                        <lg-badge [variant]="getStatusVariant(item)">{{ getStatus(item) }}</lg-badge>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }

        <!-- Settings tab -->
        @if (activeTab() === 'settings') {
          <div class="max-w-lg space-y-6">
            <div class="rounded-2xl border border-border-default bg-bg-base p-6">
              <h3 class="font-semibold text-text-primary mb-4">Store Info</h3>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between py-2 border-b border-border-default">
                  <span class="text-text-muted">Store Name</span>
                  <span class="font-medium text-text-primary">{{ vendor()?.storeName }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border-default">
                  <span class="text-text-muted">Store URL</span>
                  <span class="text-primary-600">{{ vendor()?.storeSlug }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border-default">
                  <span class="text-text-muted">Commission Rate</span>
                  <span class="font-medium text-text-primary">{{ vendor()?.commissionRate }}%</span>
                </div>
                <div class="flex justify-between py-2">
                  <span class="text-text-muted">Verification</span>
                  @if (vendor()?.isVerified) {
                    <lg-badge variant="success">Verified</lg-badge>
                  } @else {
                    <lg-badge variant="warning">Pending</lg-badge>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class VendorDashboardComponent implements OnInit {
  readonly #vendorSvc = inject(VendorService);

  readonly loading       = signal(true);
  readonly statsLoading  = signal(false);
  readonly productsLoading = signal(false);
  readonly ordersLoading = signal(false);
  readonly notVendor     = signal(false);
  readonly pendingApproval = signal(false);
  readonly vendor        = signal<VendorProfile | null>(null);
  readonly stats         = signal<DashboardStats | null>(null);
  readonly products      = signal<any[]>([]);
  readonly orderItems    = signal<any[]>([]);
  readonly activeTab     = signal<ActiveTab>('overview');

  readonly tabs = [
    { key: 'overview'  as ActiveTab, label: 'Overview',  icon: 'dashboard' },
    { key: 'products'  as ActiveTab, label: 'Products',  icon: 'inventory_2' },
    { key: 'orders'    as ActiveTab, label: 'Orders',    icon: 'receipt_long' },
    { key: 'settings'  as ActiveTab, label: 'Settings',  icon: 'settings' },
  ];

  readonly statCards = computed(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { icon: 'currency_rupee', label: 'Total Revenue',    value: `₹${s.totalRevenue.toLocaleString('en-IN')}`,      bg: '#dcfce7', color: '#16a34a', trend: null },
      { icon: 'receipt_long',   label: 'Total Orders',     value: s.totalOrders.toString(),                           bg: '#dbeafe', color: '#2563eb', trend: null },
      { icon: 'inventory_2',    label: 'Active Products',  value: s.totalProducts.toString(),                         bg: '#ede9fe', color: '#7c3aed', trend: null },
      { icon: 'pending_actions',label: 'Pending Orders',   value: s.pendingOrders.toString(),                         bg: '#fef3c7', color: '#d97706', trend: null },
    ];
  });

  ngOnInit(): void {
    this.#vendorSvc.getMyProfile().subscribe({
      next: r => {
        this.loading.set(false);
        this.vendor.set(r.data);
        if (r.data.status === 'pending' || r.data.status === 'rejected') {
          this.pendingApproval.set(true);
        } else if (r.data.status === 'active') {
          this.loadStats();
          this.loadProducts();
          this.loadOrders();
        }
      },
      error: () => { this.loading.set(false); this.notVendor.set(true); },
    });
  }

  loadStats(): void {
    this.statsLoading.set(true);
    this.#vendorSvc.getDashboard().subscribe({
      next: r => { this.stats.set(r.data); this.statsLoading.set(false); },
      error: () => this.statsLoading.set(false),
    });
  }

  loadProducts(): void {
    this.productsLoading.set(true);
    this.#vendorSvc.getMyProducts().subscribe({
      next: r => { this.products.set(r.data); this.productsLoading.set(false); },
      error: () => this.productsLoading.set(false),
    });
  }

  loadOrders(): void {
    this.ordersLoading.set(true);
    this.#vendorSvc.getMyOrders().subscribe({
      next: r => { this.orderItems.set(r.data); this.ordersLoading.set(false); },
      error: () => this.ordersLoading.set(false),
    });
  }

  // Helper accessors for unknown order/item shapes
  getOrderNumber(o: any): string { return o?.order?.orderNumber ?? o?.orderNumber ?? '—'; }
  getProductName(o: any): string { return o?.product?.name ?? o?.productName ?? '—'; }
  getLineTotal(o: any):   number { return Number(o?.lineTotal ?? 0); }
  getQty(o: any):         number { return o?.qty ?? 1; }
  getStatus(o: any):      string { return (o?.status ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()); }
  getOrderDate(o: any):   string { return o?.order?.createdAt ?? o?.createdAt ?? new Date().toISOString(); }
  getStatusVariant(o: any): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' {
    const s = o?.status ?? '';
    if (s === 'delivered') return 'success';
    if (['cancelled','refunded'].includes(s)) return 'error';
    if (['shipped','out_for_delivery'].includes(s)) return 'info';
    return 'warning';
  }
}

import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminShipment, AdminTrackingStats } from '../../../core/services/admin.service';

type TrackView = 'shipments' | 'couriers' | 'failed' | 'returns' | 'analytics';

@Component({
  selector: 'lg-admin-tracking',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tracking Center</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Shipment tracking, courier logs and delivery analytics</p>
    </div>
    <button (click)="refresh()"
      class="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <span class="material-icons text-[16px]">refresh</span> Refresh
    </button>
  </div>

  <!-- Stats cards -->
  <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
    @for (s of statCards(); track s.label) {
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-icons text-[16px]" [class]="s.color">{{ s.icon }}</span>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{{ s.label }}</p>
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white">{{ s.value }}</p>
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

    <!-- Shipments Table (shared for shipments / failed / returns) -->
    @if (activeView() === 'shipments' || activeView() === 'failed' || activeView() === 'returns') {
      <div class="p-4 space-y-4">
        <div class="flex flex-wrap gap-3">
          <div class="relative flex-1 min-w-[200px]">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-[18px]">search</span>
            <input [(ngModel)]="searchQ" (input)="loadShipments()"
              placeholder="Order number / tracking…"
              class="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500">
          </div>
          <select [(ngModel)]="filterStatus" (change)="loadShipments()"
            class="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
            <option value="">All Statuses</option>
            <option value="pending">Pending Pickup</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed_delivery">Failed Delivery</option>
            <option value="returned">Returned</option>
          </select>
          <select [(ngModel)]="filterCourier" (change)="loadShipments()"
            class="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
            <option value="">All Couriers</option>
            @for (c of couriers; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                @for (h of shipmentHeaders; track h) {
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
                @for (s of filteredShipments(); track s.id) {
                  <tr class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                      (click)="selectedShipment.set(s)">
                    <td class="px-4 py-3 font-mono text-xs text-green-600 dark:text-green-400 font-medium">{{ s.order?.orderNumber ?? '#' + s.orderId }}</td>
                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">{{ s.courier }}</td>
                    <td class="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{{ s.trackingNumber }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" [class]="trackingBadge(s.status)">
                        {{ s.status.replace('_', ' ') | titlecase }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-400 text-xs">{{ s.estimatedDelivery ? (s.estimatedDelivery | date:'dd MMM') : '—' }}</td>
                    <td class="px-4 py-3">
                      @if (s.failedAttempts > 0) {
                        <span class="px-2 py-0.5 rounded-md text-[10px] bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-medium">{{ s.failedAttempts }} failed</span>
                      } @else {
                        <span class="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-gray-400 text-xs">{{ s.createdAt | date:'dd MMM' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center py-16">
                      <span class="material-icons text-gray-300 text-[48px] block mb-2">local_shipping</span>
                      <p class="text-gray-400">No shipments found</p>
                      <p class="text-xs text-gray-300 mt-1">Shipments are created when orders are confirmed and dispatched</p>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Courier Logs -->
    @if (activeView() === 'couriers') {
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (c of courierStats(); track c.name) {
            <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <span class="material-icons text-blue-500">local_shipping</span>
                  </div>
                  <div>
                    <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ c.name }}</p>
                    <p class="text-xs text-gray-400">{{ c.shipments }} shipments</p>
                  </div>
                </div>
                <span class="text-sm font-bold" [class]="c.rate >= 90 ? 'text-green-500' : c.rate >= 75 ? 'text-amber-500' : 'text-red-500'">
                  {{ c.rate }}%
                </span>
              </div>
              <div class="space-y-2">
                <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Delivery Rate</span><span>{{ c.rate }}%</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full transition-all"
                       [class]="c.rate >= 90 ? 'bg-green-500' : c.rate >= 75 ? 'bg-amber-500' : 'bg-red-500'"
                       [style.width]="c.rate + '%'"></div>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-2 mt-4">
                <div class="text-center">
                  <p class="text-xs text-gray-400">Avg Days</p>
                  <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ c.avgDays }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-400">Failed</p>
                  <p class="text-sm font-semibold text-red-500">{{ c.failed }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-gray-400">Returns</p>
                  <p class="text-sm font-semibold text-amber-500">{{ c.returns }}</p>
                </div>
              </div>
            </div>
          }
        </div>
        <div class="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 flex items-start gap-3">
          <span class="material-icons text-blue-500">info</span>
          <div>
            <p class="text-sm font-medium text-blue-800 dark:text-blue-300">Courier Integration</p>
            <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">Connect Shiprocket, Delhivery, or DTDC via their APIs to enable real-time tracking. Configure in System > API Keys.</p>
          </div>
        </div>
      </div>
    }

    <!-- Analytics Tab -->
    @if (activeView() === 'analytics') {
      <div class="p-6 space-y-6">
        <!-- Delivery Performance -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Delivery Performance</h3>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            @for (m of deliveryMetrics(); track m.label) {
              <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
                <p class="text-2xl font-bold text-gray-900 dark:text-white" [class]="m.color">{{ m.value }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ m.label }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Status breakdown horizontal bars -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Shipment Status Breakdown</h3>
          <div class="space-y-3">
            @for (row of statusBreakdown(); track row.status) {
              <div class="flex items-center gap-4">
                <span class="text-xs text-gray-600 dark:text-gray-400 w-32 shrink-0">{{ row.status | titlecase }}</span>
                <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all" [class]="row.barColor" [style.width]="row.pct + '%'"></div>
                </div>
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 w-10 text-right">{{ row.count }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    }
  </div>

  <!-- Shipment Detail Drawer -->
  @if (selectedShipment()) {
    <div class="fixed inset-0 z-50 flex justify-end" (click)="selectedShipment.set(null)">
      <div class="bg-white dark:bg-gray-800 w-full max-w-sm h-full shadow-2xl overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="font-bold text-gray-900 dark:text-white">Shipment Detail</h3>
          <button (click)="selectedShipment.set(null)" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="p-4 space-y-4">
          @let s = selectedShipment()!;
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Order</span>
              <span class="font-mono font-semibold text-green-600">{{ s.order?.orderNumber ?? '#' + s.orderId }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Courier</span>
              <span class="font-medium text-gray-800 dark:text-gray-200">{{ s.courier }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Tracking #</span>
              <span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{ s.trackingNumber }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Status</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [class]="trackingBadge(s.status)">{{ s.status | titlecase }}</span>
            </div>
            @if (s.estimatedDelivery) {
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">ETA</span>
                <span class="text-gray-800 dark:text-gray-200">{{ s.estimatedDelivery | date:'dd MMM yyyy' }}</span>
              </div>
            }
          </div>

          @if (s.events?.length) {
            <div class="mt-4">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tracking Timeline</p>
              <div class="space-y-0">
                @for (ev of s.events!; track $index; let last = $last) {
                  <div class="flex gap-3">
                    <div class="flex flex-col items-center">
                      <div class="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 mt-1"></div>
                      @if (!last) { <div class="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1"></div> }
                    </div>
                    <div class="pb-4">
                      <p class="text-xs font-medium text-gray-800 dark:text-gray-200">{{ ev.status }}</p>
                      @if (ev.location) { <p class="text-[11px] text-gray-400">{{ ev.location }}</p> }
                      <p class="text-[11px] text-gray-400">{{ ev.timestamp | date:'dd MMM, HH:mm' }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  }
</div>
  `,
})
export class AdminTrackingComponent implements OnInit {
  readonly #admin = inject(AdminService);

  readonly activeView       = signal<TrackView>('shipments');
  readonly loading          = signal(false);
  readonly shipments        = signal<AdminShipment[]>([]);
  readonly trackingStats    = signal<AdminTrackingStats | null>(null);
  readonly selectedShipment = signal<AdminShipment | null>(null);

  searchQ      = '';
  filterStatus = '';
  filterCourier = '';

  readonly couriers = ['Shiprocket', 'Delhivery', 'DTDC', 'BlueDart', 'Ecom Express', 'XpressBees'];

  readonly tabs = [
    { id: 'shipments'  as TrackView, label: 'Shipments',      icon: 'inventory_2' },
    { id: 'couriers'   as TrackView, label: 'Courier Logs',   icon: 'assignment' },
    { id: 'failed'     as TrackView, label: 'Failed Delivery',icon: 'not_listed_location' },
    { id: 'returns'    as TrackView, label: 'Returns',        icon: 'assignment_return' },
    { id: 'analytics'  as TrackView, label: 'Delivery Stats', icon: 'analytics' },
  ];

  readonly shipmentHeaders = ['Order #', 'Courier', 'Tracking #', 'Status', 'ETA', 'Failed Attempts', 'Created'];

  readonly filteredShipments = computed(() => {
    let list = this.shipments();
    if (this.activeView() === 'failed')  list = list.filter(s => s.status === 'failed_delivery');
    if (this.activeView() === 'returns') list = list.filter(s => s.status === 'returned');
    if (this.filterCourier) list = list.filter(s => s.courier === this.filterCourier);
    return list;
  });

  readonly statCards = computed(() => {
    const s = this.trackingStats();
    return [
      { label: 'Total',       icon: 'inventory_2',      color: 'text-blue-500',   value: (s?.total ?? 0).toString() },
      { label: 'Delivered',   icon: 'done_all',         color: 'text-green-500',  value: (s?.delivered ?? 0).toString() },
      { label: 'In Transit',  icon: 'local_shipping',   color: 'text-blue-500',   value: (s?.inTransit ?? 0).toString() },
      { label: 'Failed',      icon: 'error_outline',    color: 'text-red-500',    value: (s?.failed ?? 0).toString() },
      { label: 'Returned',    icon: 'assignment_return',color: 'text-amber-500',  value: (s?.returned ?? 0).toString() },
      { label: 'Avg Days',    icon: 'schedule',         color: 'text-purple-500', value: (s?.avgDeliveryDays ?? 0).toFixed(1) + 'd' },
    ];
  });

  readonly deliveryMetrics = computed(() => {
    const s = this.trackingStats();
    const total = s?.total || 1;
    const rate = s ? Math.round((s.delivered / total) * 100) : 0;
    return [
      { label: 'Delivery Rate',    value: rate + '%',               color: rate >= 90 ? 'text-green-600' : 'text-amber-500' },
      { label: 'Avg Delivery Days',value: (s?.avgDeliveryDays ?? 0).toFixed(1), color: 'text-blue-600' },
      { label: 'Failed Attempts',  value: (s?.failed ?? 0).toString(),         color: 'text-red-500' },
      { label: 'Return Rate',      value: s ? Math.round((s.returned / total) * 100) + '%' : '0%', color: 'text-amber-500' },
    ];
  });

  readonly statusBreakdown = computed(() => {
    const s = this.trackingStats();
    if (!s) return [];
    const total = s.total || 1;
    const colors: Record<string, string> = {
      delivered: 'bg-green-500', in_transit: 'bg-blue-500', pending: 'bg-gray-400', failed: 'bg-red-500', returned: 'bg-amber-500',
    };
    return [
      { status: 'delivered',  count: s.delivered,   pct: Math.round(s.delivered  / total * 100), barColor: colors['delivered'] },
      { status: 'in transit', count: s.inTransit,   pct: Math.round(s.inTransit  / total * 100), barColor: colors['in_transit'] },
      { status: 'pending',    count: s.total - s.delivered - s.inTransit - s.failed - s.returned,
        pct: Math.round((s.total - s.delivered - s.inTransit - s.failed - s.returned) / total * 100), barColor: colors['pending'] },
      { status: 'failed',     count: s.failed,      pct: Math.round(s.failed     / total * 100), barColor: colors['failed'] },
      { status: 'returned',   count: s.returned,    pct: Math.round(s.returned   / total * 100), barColor: colors['returned'] },
    ];
  });

  readonly courierStats = computed(() => {
    // Demo courier stats until backend data available
    return [
      { name: 'Shiprocket',    shipments: 0, rate: 0, avgDays: 0, failed: 0, returns: 0 },
      { name: 'Delhivery',     shipments: 0, rate: 0, avgDays: 0, failed: 0, returns: 0 },
      { name: 'Ecom Express',  shipments: 0, rate: 0, avgDays: 0, failed: 0, returns: 0 },
    ];
  });

  ngOnInit(): void {
    const url = window.location.pathname;
    if (url.includes('/couriers'))   this.activeView.set('couriers');
    else if (url.includes('/failed')) this.activeView.set('failed');
    else if (url.includes('/returns')) this.activeView.set('returns');
    else if (url.includes('/analytics')) this.activeView.set('analytics');

    this.loadShipments();
  }

  loadShipments(): void {
    this.loading.set(true);
    this.#admin.getShipments(1, this.filterStatus || undefined, this.searchQ || undefined).subscribe({
      next: res => { this.shipments.set(res.data); this.loading.set(false); },
      error: () => { this.shipments.set([]); this.loading.set(false); },
    });
    this.#admin.getTrackingStats().subscribe({
      next: res => this.trackingStats.set(res.data),
      error: () => this.trackingStats.set({ total: 0, delivered: 0, inTransit: 0, failed: 0, returned: 0, avgDeliveryDays: 0 }),
    });
  }

  refresh(): void { this.loadShipments(); }

  trackingBadge(s: string): string {
    const m: Record<string, string> = {
      delivered:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      in_transit:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      out_for_delivery: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      picked_up:        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      pending:          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      failed_delivery:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      returned:         'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return m[s] ?? 'bg-gray-100 text-gray-600';
  }
}

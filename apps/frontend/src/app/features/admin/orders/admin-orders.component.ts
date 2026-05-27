import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';
import { Order, OrderStatus } from '../../../core/services/order.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';

const BASE = `${environment.apiUrl}/api/v1`;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
  cancelled: 'Cancelled', refund_requested: 'Refund Requested', refunded: 'Refunded',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#d97706', confirmed: '#2563eb', processing: '#7c3aed',
  shipped: '#0891b2', out_for_delivery: '#f59e0b', delivered: '#16a34a',
  cancelled: '#dc2626', refund_requested: '#c026d3', refunded: '#6b7280',
};

@Component({
  selector: 'lg-admin-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, CurrencyInrPipe, DatePipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-text-primary">Orders</h1>
      <p class="text-sm text-text-muted mt-0.5">Manage and fulfil customer orders</p>
    </div>
  </div>

  <!-- Filters -->
  <div class="flex flex-wrap gap-3">
    <input [(ngModel)]="search" (ngModelChange)="onSearch($event)"
           placeholder="Search order number…"
           class="border border-border-default rounded-xl px-4 py-2 text-sm bg-bg-base text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-300 w-56" />

    <div class="flex gap-2 flex-wrap">
      @for (s of statuses; track s) {
        <button (click)="setFilter(s)"
                [style.background]="filterStatus() === s ? STATUS_COLORS[s] + '22' : ''"
                [style.border-color]="filterStatus() === s ? STATUS_COLORS[s] : ''"
                class="px-3 py-1.5 rounded-full text-xs font-medium border border-border-default text-text-secondary hover:border-primary-400 transition-colors">
          {{ s === 'all' ? 'All' : STATUS_LABELS[s] }}
        </button>
      }
    </div>
  </div>

  <!-- Table -->
  @if (loading()) {
    <div class="space-y-2">
      @for (i of [1,2,3,4,5]; track i) {
        <div class="h-14 rounded-xl bg-surface-50 animate-pulse"></div>
      }
    </div>
  } @else if (orders().length === 0) {
    <div class="text-center py-16 text-text-muted">
      <mat-icon class="text-5xl">inbox</mat-icon>
      <p class="mt-2">No orders found</p>
    </div>
  } @else {
    <div class="rounded-2xl border border-border-default overflow-hidden bg-bg-base">
      <table class="w-full text-sm">
        <thead class="bg-surface-50 border-b border-border-default">
          <tr>
            <th class="text-left px-4 py-3 text-text-secondary font-medium">Order</th>
            <th class="text-left px-4 py-3 text-text-secondary font-medium">Customer</th>
            <th class="text-left px-4 py-3 text-text-secondary font-medium">Items</th>
            <th class="text-left px-4 py-3 text-text-secondary font-medium">Total</th>
            <th class="text-left px-4 py-3 text-text-secondary font-medium">Payment</th>
            <th class="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
            <th class="text-left px-4 py-3 text-text-secondary font-medium">Date</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-default">
          @for (o of orders(); track o.id) {
            <tr class="hover:bg-surface-50 transition-colors">
              <td class="px-4 py-3 font-mono text-xs font-semibold text-text-primary">{{ o.orderNumber }}</td>
              <td class="px-4 py-3 text-text-secondary">{{ o.shippingAddress.fullName }}</td>
              <td class="px-4 py-3 text-text-secondary">{{ o.items.length }}</td>
              <td class="px-4 py-3 font-semibold text-text-primary">{{ o.total | currencyInr }}</td>
              <td class="px-4 py-3">
                <span [style.color]="o.paymentStatus === 'paid' ? '#16a34a' : '#d97706'"
                      class="text-xs font-medium">
                  {{ o.paymentMethod.toUpperCase() }} · {{ o.paymentStatus }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [style.background]="STATUS_COLORS[o.status] + '22'"
                      [style.color]="STATUS_COLORS[o.status]">
                  {{ STATUS_LABELS[o.status] }}
                </span>
              </td>
              <td class="px-4 py-3 text-text-muted text-xs">{{ o.createdAt | date:'dd MMM yy' }}</td>
              <td class="px-4 py-3">
                <button (click)="openDetail(o)"
                        class="text-primary-600 text-xs font-medium hover:underline">Manage</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between text-sm text-text-muted pt-1">
      <span>{{ total() }} orders</span>
      <div class="flex gap-2">
        <button (click)="prevPage()" [disabled]="page() === 1"
                class="px-3 py-1 rounded-lg border border-border-default disabled:opacity-40 hover:bg-surface-50">
          Previous
        </button>
        <span class="px-3 py-1">{{ page() }} / {{ totalPages() }}</span>
        <button (click)="nextPage()" [disabled]="page() === totalPages()"
                class="px-3 py-1 rounded-lg border border-border-default disabled:opacity-40 hover:bg-surface-50">
          Next
        </button>
      </div>
    </div>
  }
</div>

<!-- Detail Drawer -->
@if (selected()) {
  <div class="fixed inset-0 z-50 flex">
    <!-- Backdrop -->
    <div class="flex-1 bg-black/40" (click)="closeDetail()"></div>

    <!-- Panel -->
    <div class="w-full max-w-2xl bg-bg-base h-full overflow-y-auto shadow-2xl flex flex-col">
      <div class="flex items-center justify-between px-6 py-4 border-b border-border-default">
        <div>
          <h2 class="font-bold text-text-primary text-base">{{ selected()!.orderNumber }}</h2>
          <p class="text-xs text-text-muted mt-0.5">{{ selected()!.createdAt | date:'dd MMM yyyy, HH:mm' }}</p>
        </div>
        <button (click)="closeDetail()" class="p-1 rounded-lg hover:bg-surface-50">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="p-6 space-y-5 flex-1">

        <!-- Status badge -->
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full text-sm font-semibold"
                [style.background]="STATUS_COLORS[selected()!.status] + '22'"
                [style.color]="STATUS_COLORS[selected()!.status]">
            {{ STATUS_LABELS[selected()!.status] }}
          </span>
          <span class="text-sm text-text-muted">{{ selected()!.paymentMethod.toUpperCase() }} · {{ selected()!.paymentStatus }}</span>
        </div>

        <!-- Shiprocket actions -->
        <div class="rounded-xl border border-border-default p-4 space-y-3">
          <h3 class="text-sm font-semibold text-text-primary flex items-center gap-2">
            <mat-icon class="text-base text-primary-600">local_shipping</mat-icon>
            Shiprocket
          </h3>

          @if (selected()!.awbCode) {
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-text-secondary">AWB</span>
                <span class="font-mono font-semibold">{{ selected()!.awbCode }}</span>
              </div>
              @if (selected()!.courierName) {
                <div class="flex justify-between">
                  <span class="text-text-secondary">Courier</span>
                  <span class="font-medium">{{ selected()!.courierName }}</span>
                </div>
              }
              @if (selected()!.trackingUrl) {
                <a [href]="selected()!.trackingUrl" target="_blank"
                   class="flex items-center gap-1 text-primary-600 text-xs font-medium hover:underline mt-1">
                  <mat-icon class="text-sm">open_in_new</mat-icon> Track
                </a>
              }
            </div>
          } @else if (selected()!.shiprocketOrderId) {
            <p class="text-xs text-text-secondary">Shiprocket Order ID: {{ selected()!.shiprocketOrderId }}</p>
            <button (click)="generateAwb()" [disabled]="srLoading()"
                    class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium disabled:opacity-50">
              <mat-icon class="text-base">qr_code</mat-icon>
              {{ srLoading() ? 'Generating…' : 'Generate AWB' }}
            </button>
          } @else {
            <button (click)="pushToShiprocket()" [disabled]="srLoading()"
                    [class.opacity-50]="!canPushShiprocket()"
                    class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium disabled:opacity-50">
              <mat-icon class="text-base">upload</mat-icon>
              {{ srLoading() ? 'Pushing…' : 'Push to Shiprocket' }}
            </button>
            @if (!canPushShiprocket()) {
              <p class="text-xs text-amber-600">Order must be confirmed or processing to push.</p>
            }
          }

          @if (srError()) {
            <p class="text-xs text-red-500">{{ srError() }}</p>
          }
        </div>

        <!-- Status update -->
        <div class="rounded-xl border border-border-default p-4 space-y-3">
          <h3 class="text-sm font-semibold text-text-primary">Update Status</h3>
          <div class="flex gap-2">
            <select [(ngModel)]="newStatus"
                    class="flex-1 border border-border-default rounded-xl px-3 py-2 text-sm bg-bg-base text-text-primary focus:outline-none">
              @for (s of orderStatuses; track s) {
                <option [value]="s">{{ STATUS_LABELS[s] }}</option>
              }
            </select>
            <button (click)="updateStatus()" [disabled]="statusLoading()"
                    class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium disabled:opacity-50">
              {{ statusLoading() ? 'Saving…' : 'Update' }}
            </button>
          </div>
          <input [(ngModel)]="statusNote" placeholder="Note (optional)"
                 class="w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-bg-base text-text-primary focus:outline-none" />
        </div>

        <!-- Order items -->
        <div class="rounded-xl border border-border-default overflow-hidden">
          <div class="px-4 py-3 bg-surface-50 border-b border-border-default">
            <h3 class="text-sm font-semibold text-text-primary">Items</h3>
          </div>
          <div class="divide-y divide-border-default">
            @for (item of selected()!.items; track item.id) {
              <div class="flex items-center gap-3 px-4 py-3">
                @if (item.image) {
                  <img [src]="item.image" class="w-10 h-10 rounded-lg object-cover" />
                } @else {
                  <div class="w-10 h-10 rounded-lg bg-surface-50 flex items-center justify-center">
                    <mat-icon class="text-text-muted text-base">inventory_2</mat-icon>
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-text-primary truncate">{{ item.productName }}</p>
                  <p class="text-xs text-text-muted">Qty: {{ item.qty }} × {{ item.unitPrice | currencyInr }}</p>
                </div>
                <span class="font-semibold text-sm text-text-primary">{{ item.lineTotal | currencyInr }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Shipping address -->
        <div class="rounded-xl border border-border-default p-4 text-sm space-y-1">
          <h3 class="font-semibold text-text-primary mb-2">Shipping Address</h3>
          <p class="font-medium text-text-primary">{{ selected()!.shippingAddress.fullName }}</p>
          <p class="text-text-secondary">{{ selected()!.shippingAddress.line1 }}
            @if (selected()!.shippingAddress.line2) { , {{ selected()!.shippingAddress.line2 }} }
          </p>
          <p class="text-text-secondary">{{ selected()!.shippingAddress.city }}, {{ selected()!.shippingAddress.state }} – {{ selected()!.shippingAddress.pincode }}</p>
          <p class="text-text-secondary">{{ selected()!.shippingAddress.phone }}</p>
        </div>

        <!-- Invoice link -->
        <a [href]="apiUrl + '/api/v1/admin/orders/' + selected()!.id + '/invoice'"
           target="_blank"
           class="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:underline">
          <mat-icon class="text-base">receipt_long</mat-icon>
          Download Invoice
        </a>
      </div>
    </div>
  </div>
}
  `,
})
export class AdminOrdersComponent implements OnInit {
  readonly #http = inject(HttpClient);

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_COLORS = STATUS_COLORS;
  readonly apiUrl = environment.apiUrl;

  readonly statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped',
                       'out_for_delivery', 'delivered', 'cancelled', 'refund_requested', 'refunded'];
  readonly orderStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped',
                       'out_for_delivery', 'delivered', 'cancelled', 'refund_requested', 'refunded'];

  orders    = signal<Order[]>([]);
  loading   = signal(false);
  page      = signal(1);
  total     = signal(0);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / 20)));
  filterStatus = signal('all');
  search    = '';

  selected    = signal<Order | null>(null);
  srLoading   = signal(false);
  srError     = signal('');
  statusLoading = signal(false);
  newStatus   = '';
  statusNote  = '';

  canPushShiprocket = computed(() => {
    const s = this.selected()?.status;
    return s === 'confirmed' || s === 'processing';
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    let p = new HttpParams().set('page', this.page()).set('limit', 20);
    if (this.filterStatus() !== 'all') p = p.set('status', this.filterStatus());
    if (this.search) p = p.set('q', this.search);

    this.#http.get<{ success: boolean; data: Order[]; meta: { total: number } }>(
      `${BASE}/admin/orders`, { params: p }
    ).subscribe({
      next: r => {
        this.orders.set(r.data ?? []);
        this.total.set(r.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  setFilter(s: string) { this.filterStatus.set(s); this.page.set(1); this.load(); }
  prevPage() { this.page.update(p => p - 1); this.load(); }
  nextPage() { this.page.update(p => p + 1); this.load(); }
  onSearch(_: string) { this.page.set(1); this.load(); }

  openDetail(o: Order) {
    this.selected.set(o);
    this.newStatus = o.status;
    this.statusNote = '';
    this.srError.set('');
  }
  closeDetail() { this.selected.set(null); }

  pushToShiprocket() {
    const id = this.selected()?.id;
    if (!id) return;
    this.srLoading.set(true);
    this.srError.set('');
    this.#http.post<{ success: boolean; data: Order }>(
      `${BASE}/admin/orders/${id}/create`, {}
    ).subscribe({
      next: r => { this.selected.set(r.data); this.srLoading.set(false); this.refreshInList(r.data); },
      error: (e) => { this.srError.set(e.error?.message ?? 'Failed'); this.srLoading.set(false); },
    });
  }

  generateAwb() {
    const id = this.selected()?.id;
    if (!id) return;
    this.srLoading.set(true);
    this.srError.set('');
    this.#http.post<{ success: boolean; data: Order }>(
      `${BASE}/admin/orders/${id}/awb`, {}
    ).subscribe({
      next: r => { this.selected.set(r.data); this.srLoading.set(false); this.refreshInList(r.data); },
      error: (e) => { this.srError.set(e.error?.message ?? 'Failed'); this.srLoading.set(false); },
    });
  }

  updateStatus() {
    const id = this.selected()?.id;
    if (!id || !this.newStatus) return;
    this.statusLoading.set(true);
    this.#http.patch<{ success: boolean; data: Order }>(
      `${BASE}/admin/orders/${id}/status`,
      { status: this.newStatus, note: this.statusNote || undefined }
    ).subscribe({
      next: r => { this.selected.set(r.data); this.statusLoading.set(false); this.refreshInList(r.data); },
      error: () => this.statusLoading.set(false),
    });
  }

  private refreshInList(updated: Order) {
    this.orders.update(list => list.map(o => o.id === updated.id ? updated : o));
  }
}

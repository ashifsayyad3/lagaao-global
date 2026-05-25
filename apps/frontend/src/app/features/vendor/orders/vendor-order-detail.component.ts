import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VendorService, VendorOrder, VendorOrderItem, OrderStatus } from '../../../core/services/vendor.service';
import { MatTooltipModule } from '@angular/material/tooltip';

const STATUS_STEPS: OrderStatus[] = [
  'pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'
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

const ALLOWED: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped'],
  shipped:          ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        ['refund_requested'],
  refund_requested: ['refunded'],
};

@Component({
  selector: 'lg-vendor-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, CurrencyPipe, MatTooltipModule],
  template: `
<div class="p-6 max-w-6xl mx-auto space-y-6">

  <!-- Back + header -->
  <div class="flex items-center gap-3">
    <a routerLink="/vendor/orders"
       class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500">
      <span class="material-icons text-[20px]">arrow_back</span>
    </a>
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">
        Order {{ order()?.orderNumber ?? '…' }}
      </h1>
      <p class="text-xs text-gray-400 mt-0.5">{{ order()?.createdAt | date:'d MMMM y, h:mm a' }}</p>
    </div>
    @if (order()) {
      <span class="ml-auto inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {{ statusClass(order()!.status) }}">
        {{ formatStatus(order()!.status) }}
      </span>
    }
  </div>

  @if (loading()) {
    <div class="flex items-center justify-center py-32">
      <div class="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  } @else if (!order()) {
    <div class="text-center py-32 text-gray-400">Order not found.</div>
  } @else {

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Left column: items + timeline -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Status timeline -->
        @if (!isCancelled()) {
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 class="font-semibold text-gray-900 dark:text-white mb-4 text-sm">Fulfilment Progress</h2>
            <div class="flex items-center gap-0">
              @for (step of timelineSteps; track step; let last = $last) {
                <div class="flex flex-col items-center flex-1 min-w-0">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0
                    {{ stepDone(step) ? 'bg-green-600 text-white' : stepActive(step) ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 ring-2 ring-green-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-400' }}">
                    @if (stepDone(step)) {
                      <span class="material-icons text-[16px]">check</span>
                    } @else {
                      {{ $index + 1 }}
                    }
                  </div>
                  <p class="text-[10px] mt-1.5 text-center leading-tight
                    {{ stepDone(step) || stepActive(step) ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-400 dark:text-gray-500' }}">
                    {{ formatStatus(step) }}
                  </p>
                </div>
                @if (!last) {
                  <div class="h-0.5 flex-1 mb-5 {{ stepDone(step) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600' }}"></div>
                }
              }
            </div>
          </div>
        }

        <!-- Order items -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 class="font-semibold text-gray-900 dark:text-white text-sm">Items in This Order (Your Products)</h2>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-700">
            @for (item of order()!.items; track item.id) {
              <div class="flex items-center gap-4 px-5 py-4">
                <div class="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  <span class="material-icons text-gray-400 text-[22px]">inventory_2</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {{ item.product?.name ?? 'Product #' + item.productId }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">Qty: {{ item.quantity }} × {{ item.unitPrice | currency:'INR':'symbol':'1.0-0' }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ item.totalPrice | currency:'INR':'symbol':'1.0-0' }}</p>
                  <span class="text-[11px] px-2 py-0.5 rounded-full {{ statusClass(item.status) }}">{{ formatStatus(item.status) }}</span>
                </div>
              </div>
            }
          </div>
          <div class="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Order Total</span>
            <span class="font-bold text-gray-900 dark:text-white">{{ order()!.totalAmount | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <!-- Status history -->
        @if (order()!.statusHistory?.length) {
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">Status History</h2>
            <div class="space-y-3">
              @for (h of order()!.statusHistory; track h.id) {
                <div class="flex gap-3 text-sm">
                  <div class="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                  <div>
                    <span class="font-medium text-gray-800 dark:text-gray-200">{{ formatStatus(h.toStatus) }}</span>
                    @if (h.note) {
                      <span class="text-gray-500 dark:text-gray-400"> — {{ h.note }}</span>
                    }
                    <p class="text-xs text-gray-400 mt-0.5">{{ h.createdAt | date:'d MMM y, h:mm a' }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

      </div>

      <!-- Right column: customer + actions + tracking -->
      <div class="space-y-6">

        <!-- Customer -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <h2 class="font-semibold text-gray-900 dark:text-white text-sm">Customer</h2>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-sm">
              {{ customerInitial() }}
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm">{{ order()!.user?.name ?? 'Customer' }}</p>
              <p class="text-xs text-gray-400">{{ order()!.user?.email }}</p>
              @if (order()!.user?.phone) {
                <p class="text-xs text-gray-400">{{ order()!.user?.phone }}</p>
              }
            </div>
          </div>
        </div>

        <!-- Update status -->
        @if (nextStatuses().length > 0) {
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <h2 class="font-semibold text-gray-900 dark:text-white text-sm">Update Status</h2>
            <textarea
              [(ngModel)]="statusNote"
              rows="2"
              placeholder="Optional note…"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500">
            </textarea>
            <div class="flex flex-col gap-2">
              @for (ns of nextStatuses(); track ns) {
                <button
                  [disabled]="updating()"
                  (click)="updateStatus(ns)"
                  class="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
                    {{ ns === 'cancelled' || ns === 'refunded'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 border border-red-200 dark:border-red-800'
                      : 'bg-green-600 text-white hover:bg-green-700' }}">
                  @if (updating()) {
                    <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-middle"></span>
                  }
                  Mark as {{ formatStatus(ns) }}
                </button>
              }
            </div>
            @if (statusError()) {
              <p class="text-xs text-red-600 dark:text-red-400">{{ statusError() }}</p>
            }
          </div>
        }

        <!-- Tracking -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <h2 class="font-semibold text-gray-900 dark:text-white text-sm">Shipping & Tracking</h2>
          <div class="space-y-2">
            <input
              [(ngModel)]="trackingForm.trackingNumber"
              placeholder="Tracking number"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              [(ngModel)]="trackingForm.courier"
              placeholder="Courier (e.g. Delhivery, Bluedart)"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="date"
              [(ngModel)]="trackingForm.estimatedDelivery"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            [disabled]="trackingSaving()"
            (click)="saveTracking()"
            class="w-full py-2 px-4 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50">
            @if (trackingSaving()) {
              <span class="inline-block w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin mr-2 align-middle"></span>
            }
            Save Tracking Info
          </button>
          @if (trackingSuccess()) {
            <p class="text-xs text-green-600 dark:text-green-400">Tracking info saved.</p>
          }
        </div>

      </div>
    </div>
  }

</div>
  `,
})
export class VendorOrderDetailComponent implements OnInit {
  readonly #vendor = inject(VendorService);
  readonly #route  = inject(ActivatedRoute);

  readonly order    = signal<VendorOrder | null>(null);
  readonly loading  = signal(true);
  readonly updating = signal(false);
  readonly statusError = signal('');
  readonly trackingSaving = signal(false);
  readonly trackingSuccess = signal(false);

  readonly isCancelled = computed(() => {
    const s = this.order()?.status;
    return s === 'cancelled' || s === 'refunded';
  });

  readonly nextStatuses = computed<OrderStatus[]>(() => {
    const s = this.order()?.status;
    return s ? (ALLOWED[s] ?? []) : [];
  });

  readonly customerInitial = computed(() =>
    (this.order()?.user?.name ?? 'C').charAt(0).toUpperCase()
  );

  readonly timelineSteps = STATUS_STEPS;

  statusNote = '';
  trackingForm = { trackingNumber: '', courier: '', estimatedDelivery: '' };

  ngOnInit(): void {
    const id = Number(this.#route.snapshot.paramMap.get('id'));
    this.#vendor.getOrderDetail(id).subscribe({
      next: r => {
        this.order.set(r.data);
        const o = r.data;
        this.trackingForm.trackingNumber = o.trackingNumber ?? '';
        this.trackingForm.courier = o.courier ?? '';
        this.trackingForm.estimatedDelivery = o.estimatedDelivery
          ? o.estimatedDelivery.slice(0, 10) : '';
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  stepDone(step: OrderStatus): boolean {
    const cur = this.order()?.status;
    if (!cur) return false;
    const ci = STATUS_STEPS.indexOf(cur);
    const si = STATUS_STEPS.indexOf(step);
    return si < ci;
  }

  stepActive(step: OrderStatus): boolean {
    return this.order()?.status === step;
  }

  updateStatus(next: OrderStatus): void {
    const items = this.order()?.items;
    if (!items?.length) return;
    this.updating.set(true);
    this.statusError.set('');
    const itemId = items[0].id;
    this.#vendor.updateOrderItemStatus(itemId, next, this.statusNote || undefined).subscribe({
      next: () => {
        this.order.update(o => o ? { ...o, status: next, items: o.items.map(i => ({ ...i, status: next })) } : o);
        this.statusNote = '';
        this.updating.set(false);
      },
      error: (e) => {
        this.statusError.set(e?.error?.message ?? 'Failed to update status');
        this.updating.set(false);
      },
    });
  }

  saveTracking(): void {
    const id = this.order()?.id;
    if (!id) return;
    this.trackingSaving.set(true);
    this.trackingSuccess.set(false);
    this.#vendor.addOrderTracking(id, this.trackingForm).subscribe({
      next: r => {
        this.order.update(o => o ? { ...o, ...r.data } : o);
        this.trackingSaving.set(false);
        this.trackingSuccess.set(true);
        setTimeout(() => this.trackingSuccess.set(false), 3000);
      },
      error: () => this.trackingSaving.set(false),
    });
  }

  statusClass(s: string): string { return STATUS_COLORS[s] ?? STATUS_COLORS['pending']; }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

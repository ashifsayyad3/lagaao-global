import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { OrderService, Order, OrderStatus } from '../../../core/services/order.service';
import { DatePipe } from '@angular/common';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'lg-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe, SkeletonComponent, BadgeComponent, TimeAgoPipe, DatePipe],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 md:px-6 py-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="font-display text-2xl font-bold text-text-primary">My Orders</h1>
          @if (!loading()) {
            <p class="text-sm text-text-muted mt-0.5">{{ total() }} order{{ total() !== 1 ? 's' : '' }}</p>
          }
        </div>
      </div>

      <!-- Status filter tabs -->
      <div class="flex gap-1 mb-6 overflow-x-auto pb-1 hide-scrollbar">
        @for (tab of statusTabs; track tab.value) {
          <button
            class="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            [class.bg-primary-600]="activeStatus() === tab.value"
            [class.text-white]="activeStatus() === tab.value"
            [class.bg-surface-100]="activeStatus() !== tab.value"
            [class.text-text-secondary]="activeStatus() !== tab.value"
            [class.hover:bg-surface-200]="activeStatus() !== tab.value"
            (click)="filterStatus(tab.value)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-4">
          @for (i of [0,1,2]; track i) { <lg-skeleton height="140px" borderRadius="1rem"></lg-skeleton> }
        </div>
      } @else if (orders().length === 0) {
        <div class="flex flex-col items-center py-24 text-center">
          <mat-icon class="!text-6xl text-text-muted mb-4">receipt_long</mat-icon>
          <h3 class="font-display text-xl font-semibold text-text-primary mb-2">No orders yet</h3>
          <p class="text-text-secondary mb-8">Looks like you haven't placed any orders.</p>
          <a routerLink="/products"
             class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium
                    rounded-xl transition-colors">
            Start Shopping
          </a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (order of orders(); track order.id) {
            <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden
                        hover:border-primary-200 transition-colors">

              <!-- Order header -->
              <div class="flex items-center justify-between px-5 py-3 bg-surface-50 border-b border-border-default">
                <div class="flex items-center gap-4 flex-wrap text-sm">
                  <div>
                    <span class="text-text-muted text-xs uppercase tracking-wider">Order</span>
                    <p class="font-semibold text-text-primary font-mono">{{ order.orderNumber }}</p>
                  </div>
                  <div>
                    <span class="text-text-muted text-xs uppercase tracking-wider">Placed</span>
                    <p class="text-text-secondary">{{ order.createdAt | timeAgo }}</p>
                  </div>
                  <div>
                    <span class="text-text-muted text-xs uppercase tracking-wider">Total</span>
                    <p class="font-semibold text-text-primary">{{ order.total | currencyInr }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <lg-badge [variant]="statusVariant(order.status)">
                    {{ statusLabel(order.status) }}
                  </lg-badge>
                  <a [routerLink]="['/orders', order.id]"
                     class="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Details →
                  </a>
                </div>
              </div>

              <!-- Items preview -->
              <div class="px-5 py-4 flex items-center gap-4 overflow-x-auto hide-scrollbar">
                @for (item of order.items.slice(0, 4); track item.id) {
                  <div class="flex-shrink-0 flex items-center gap-3">
                    <div class="w-14 h-14 rounded-xl overflow-hidden bg-surface-100 flex-shrink-0">
                      <img [src]="item.image || '/assets/placeholder.png'" [alt]="item.productName"
                           class="w-full h-full object-cover" />
                    </div>
                    <div class="min-w-0 hidden sm:block">
                      <p class="text-sm font-medium text-text-primary truncate max-w-[140px]">
                        {{ item.productName }}
                      </p>
                      <p class="text-xs text-text-muted">Qty: {{ item.qty }} · {{ item.lineTotal | currencyInr }}</p>
                    </div>
                  </div>
                }
                @if (order.items.length > 4) {
                  <div class="flex-shrink-0 w-14 h-14 rounded-xl bg-surface-100 flex items-center
                              justify-center text-sm font-semibold text-text-secondary">
                    +{{ order.items.length - 4 }}
                  </div>
                }
              </div>

              <!-- Tracking bar (if shipped) -->
              @if (['shipped','out_for_delivery','delivered'].includes(order.status)) {
                <div class="px-5 pb-4">
                  <div class="flex items-center gap-2">
                    <mat-icon class="!text-base text-primary-600">local_shipping</mat-icon>
                    <span class="text-xs text-text-secondary">
                      @if (order.trackingNumber) {
                        {{ order.courier ?? 'Courier' }} · {{ order.trackingNumber }}
                      }
                      @if (order.estimatedDelivery && order.status !== 'delivered') {
                        · Est. delivery {{ $any(order.estimatedDelivery) | date: 'd MMM' }}
                      }
                      @if (order.status === 'delivered') {
                        · Delivered {{ order.deliveredAt | timeAgo }}
                      }
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex justify-center items-center gap-2 mt-8">
            <button class="pagination-btn" [disabled]="page() === 1" (click)="goToPage(page() - 1)">
              <mat-icon>chevron_left</mat-icon>
            </button>
            @for (p of pageNumbers(); track p) {
              <button class="pagination-btn"
                      [class.bg-primary-600]="p === page()"
                      [class.text-white]="p === page()"
                      (click)="goToPage(p)">{{ p }}</button>
            }
            <button class="pagination-btn" [disabled]="page() === totalPages()" (click)="goToPage(page() + 1)">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pagination-btn { min-width: 2.25rem; height: 2.25rem; padding: 0 0.5rem; border-radius: 0.5rem; border: 1px solid var(--border-default); background: var(--bg-base); color: var(--text-primary); font-size: 0.875rem; display: inline-flex; align-items: center; justify-content: center; transition: all 150ms; }
    .pagination-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
    .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .hide-scrollbar { scrollbar-width: none; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
  `],
})
export class OrderListComponent implements OnInit {
  readonly #orderSvc = inject(OrderService);

  readonly orders     = signal<Order[]>([]);
  readonly loading    = signal(true);
  readonly total      = signal(0);
  readonly page       = signal(1);
  readonly totalPages = signal(1);
  readonly activeStatus = signal<string>('');

  readonly statusTabs = [
    { label: 'All',          value: '' },
    { label: 'Active',       value: 'processing' },
    { label: 'Shipped',      value: 'shipped' },
    { label: 'Delivered',    value: 'delivered' },
    { label: 'Cancelled',    value: 'cancelled' },
  ];

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur   = this.page();
    const pages: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
    return pages;
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.#orderSvc.getOrders(this.page(), this.activeStatus() || undefined).subscribe({
      next: r => {
        this.orders.set(r.data);
        this.total.set(r.meta.total);
        this.totalPages.set(r.meta.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterStatus(status: string): void {
    this.activeStatus.set(status);
    this.page.set(1);
    this.load();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  statusVariant(status: OrderStatus): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' {
    const map: Record<OrderStatus, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
      pending:           'warning',
      confirmed:         'primary',
      processing:        'primary',
      shipped:           'info',
      out_for_delivery:  'info',
      delivered:         'success',
      cancelled:         'error',
      refund_requested:  'warning',
      refunded:          'default',
    };
    return map[status] ?? 'default';
  }

  statusLabel(status: OrderStatus): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

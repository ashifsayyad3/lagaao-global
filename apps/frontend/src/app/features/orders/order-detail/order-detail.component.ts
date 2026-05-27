import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { OrderService, Order, OrderStatus } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { ReviewFormComponent } from '../../../shared/components/review-form/review-form.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'lg-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule, MatIconModule, DatePipe,
    CurrencyInrPipe, SkeletonComponent, BadgeComponent, ButtonComponent, TimeAgoPipe,
    ReviewFormComponent, StarRatingComponent,
  ],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 md:px-6 py-8">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-text-muted mb-6">
        <a routerLink="/" class="hover:text-text-primary">Home</a>
        <mat-icon class="!text-base">chevron_right</mat-icon>
        <a routerLink="/orders" class="hover:text-text-primary">My Orders</a>
        <mat-icon class="!text-base">chevron_right</mat-icon>
        <span class="text-text-primary">{{ order()?.orderNumber ?? 'Order' }}</span>
      </nav>

      @if (loading()) {
        <div class="grid lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-4">
            <lg-skeleton height="80px" borderRadius="1rem"></lg-skeleton>
            <lg-skeleton height="200px" borderRadius="1rem"></lg-skeleton>
            <lg-skeleton height="160px" borderRadius="1rem"></lg-skeleton>
          </div>
          <div class="space-y-4">
            <lg-skeleton height="200px" borderRadius="1rem"></lg-skeleton>
            <lg-skeleton height="120px" borderRadius="1rem"></lg-skeleton>
          </div>
        </div>

      } @else if (!order()) {
        <div class="flex flex-col items-center py-20 text-center">
          <mat-icon class="!text-6xl text-text-muted mb-4">receipt_long</mat-icon>
          <h3 class="font-display text-xl font-semibold text-text-primary mb-2">Order not found</h3>
          <a routerLink="/orders" class="text-primary-600 hover:underline mt-2">Back to orders</a>
        </div>

      } @else {
        <div class="grid lg:grid-cols-3 gap-6 items-start">

          <!-- Left: items + status timeline -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Order header -->
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 class="font-display text-xl font-bold text-text-primary font-mono">
                  {{ order()!.orderNumber }}
                </h1>
                <p class="text-sm text-text-muted mt-0.5">
                  Placed {{ order()!.createdAt | timeAgo }} ·
                  {{ order()!.items.length }} item{{ order()!.items.length !== 1 ? 's' : '' }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <lg-badge [variant]="statusVariant(order()!.status)" class="text-sm px-3 py-1">
                  {{ statusLabel(order()!.status) }}
                </lg-badge>
                @if (canCancel()) {
                  <lg-button variant="outline" size="sm" prefixIcon="close"
                             [loading]="cancelling()" (click)="cancelOrder()">
                    Cancel
                  </lg-button>
                }
              </div>
            </div>

            <!-- Shipping progress bar -->
            @if (!['cancelled','refund_requested','refunded'].includes(order()!.status)) {
              <div class="rounded-2xl border border-border-default bg-bg-base p-5">
                <div class="flex justify-between mb-4">
                  @for (step of trackingSteps; track step.status) {
                    <div class="flex flex-col items-center gap-1.5 flex-1"
                         [class.opacity-40]="!isReached(step.status)">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center"
                           [class.bg-primary-600]="isReached(step.status)"
                           [class.text-white]="isReached(step.status)"
                           [class.bg-surface-100]="!isReached(step.status)"
                           [class.text-text-muted]="!isReached(step.status)">
                        <mat-icon class="!text-base">{{ step.icon }}</mat-icon>
                      </div>
                      <span class="text-[10px] text-center font-medium"
                            [class.text-primary-600]="order()!.status === step.status"
                            [class.text-text-muted]="order()!.status !== step.status">
                        {{ step.label }}
                      </span>
                    </div>
                  }
                </div>
                @if (order()!.trackingNumber) {
                  <div class="flex items-center gap-2 mt-2 text-sm text-text-secondary">
                    <mat-icon class="!text-base text-primary-600">local_shipping</mat-icon>
                    {{ order()!.courier ?? 'Courier' }} · Tracking: {{ order()!.trackingNumber }}
                  </div>
                }
                @if (order()!.estimatedDelivery && order()!.status !== 'delivered') {
                  <p class="text-xs text-text-muted mt-1">
                    Expected delivery: {{ $any(order()!.estimatedDelivery) | date: 'EEE, d MMM yyyy' }}
                  </p>
                }
              </div>
            }

            <!-- Order items -->
            <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
              <div class="px-5 py-3 bg-surface-50 border-b border-border-default">
                <h2 class="font-semibold text-text-primary text-sm">Items Ordered</h2>
              </div>
              <div class="divide-y divide-border-default">
                @for (item of order()!.items; track item.id) {
                  <div class="flex gap-4 px-5 py-4">
                    <div class="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 flex-shrink-0">
                      <img [src]="item.image || '/assets/placeholder.png'" [alt]="item.productName"
                           class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-text-primary text-sm">{{ item.productName }}</p>
                      @if (item.variantAttrs) {
                        <p class="text-xs text-text-muted mt-0.5">
                          @for (e of objectEntries(item.variantAttrs); track e[0]) {
                            <span class="capitalize">{{ e[0] }}: {{ e[1] }}</span>
                            <span class="mx-1 last:hidden">·</span>
                          }
                        </p>
                      }
                      @if (item.sku) {
                        <p class="text-xs text-text-muted">SKU: {{ item.sku }}</p>
                      }
                    </div>
                    <div class="text-right flex-shrink-0">
                      <p class="font-semibold text-text-primary text-sm">{{ item.lineTotal | currencyInr }}</p>
                      <p class="text-xs text-text-muted">{{ item.unitPrice | currencyInr }} × {{ item.qty }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ── Review your items (delivered orders only) ── -->
            @if (order()!.status === 'delivered') {
              <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
                <div class="px-5 py-3 bg-surface-50 border-b border-border-default flex items-center justify-between">
                  <h2 class="font-semibold text-text-primary text-sm">Rate Your Items</h2>
                  @if (!showReviewForm()) {
                    <button class="text-xs text-primary-600 font-semibold hover:underline"
                            (click)="openReview()">
                      + Write a Review
                    </button>
                  }
                </div>

                <!-- Per-item star display / review prompt -->
                @if (!showReviewForm()) {
                  <div class="divide-y divide-border-default">
                    @for (item of order()!.items; track item.id) {
                      <div class="flex gap-4 px-5 py-4 items-center">
                        <div class="w-12 h-12 rounded-xl overflow-hidden bg-surface-100 flex-shrink-0">
                          <img [src]="item.image || '/assets/placeholder.png'"
                               [alt]="item.productName"
                               class="w-full h-full object-cover" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-text-primary text-sm truncate">{{ item.productName }}</p>
                        </div>
                        <div class="flex items-center gap-3 flex-shrink-0">
                          @if (reviewedProductIds().has(item.productId)) {
                            <span class="text-xs text-primary-600 font-semibold flex items-center gap-1">
                              <mat-icon class="!text-sm">check_circle</mat-icon> Reviewed
                            </span>
                          } @else {
                            <lg-star-rating
                              [value]="0"
                              [size]="20"
                              [interactive]="true"
                              (ratingChange)="openReviewForProduct(item.productId, item.productName, $event)"
                            />
                          }
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Inline review form -->
                @if (showReviewForm() && reviewProductId()) {
                  <div class="p-4">
                    <p class="text-xs text-text-muted mb-3">
                      Reviewing: <strong>{{ reviewProductName() }}</strong>
                    </p>
                    <lg-review-form
                      [productId]="reviewProductId()!"
                      [orderId]="order()!.id"
                      (reviewSubmitted)="onReviewDone($event)"
                      (cancelled)="showReviewForm.set(false)"
                    />
                  </div>
                }
              </div>
            }

            <!-- ── Return request ── -->
            @if (order()!.status === 'delivered' && !returnSubmitted()) {
              <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
                <div class="px-5 py-3 bg-surface-50 border-b border-border-default flex items-center justify-between">
                  <h2 class="font-semibold text-text-primary text-sm">
                    <mat-icon class="!text-sm" style="vertical-align:middle;margin-right:4px">assignment_return</mat-icon>
                    Return / Refund
                  </h2>
                  @if (!showReturnForm()) {
                    <button class="text-xs text-primary-600 font-semibold hover:underline"
                            (click)="showReturnForm.set(true)">
                      Request Return
                    </button>
                  }
                </div>
                @if (showReturnForm()) {
                  <div class="p-5 flex flex-col gap-4">
                    <div>
                      <label class="text-xs font-semibold text-text-secondary block mb-1">Reason</label>
                      <select [(ngModel)]="returnReason"
                              style="width:100%;padding:9px 12px;border:1.5px solid var(--border-default);
                                     border-radius:10px;background:var(--bg-subtle);font-size:.875rem;
                                     color:var(--text-primary);outline:none">
                        <option value="">Select a reason…</option>
                        <option value="damaged">Item arrived damaged</option>
                        <option value="wrong_item">Wrong item sent</option>
                        <option value="not_as_described">Not as described</option>
                        <option value="changed_mind">Changed my mind</option>
                        <option value="quality_issue">Quality issue</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label class="text-xs font-semibold text-text-secondary block mb-1">Description (optional)</label>
                      <textarea [(ngModel)]="returnDescription" rows="3"
                                placeholder="Describe the issue…"
                                style="width:100%;padding:9px 12px;border:1.5px solid var(--border-default);
                                       border-radius:10px;background:var(--bg-subtle);font-size:.875rem;
                                       color:var(--text-primary);outline:none;resize:vertical"></textarea>
                    </div>
                    <div style="display:flex;gap:10px">
                      <button (click)="submitReturn()"
                              [disabled]="!returnReason || submittingReturn()"
                              style="flex:1;padding:10px;background:var(--color-primary);color:#fff;
                                     border:none;border-radius:10px;font-weight:600;font-size:.9375rem;
                                     cursor:pointer;opacity:1"
                              [style.opacity]="!returnReason || submittingReturn() ? '0.5' : '1'">
                        {{ submittingReturn() ? 'Submitting…' : 'Submit Return Request' }}
                      </button>
                      <button (click)="showReturnForm.set(false)"
                              style="padding:10px 18px;background:none;border:1.5px solid var(--border-default);
                                     border-radius:10px;font-weight:600;font-size:.875rem;color:var(--text-secondary);cursor:pointer">
                        Cancel
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
            @if (returnSubmitted()) {
              <div style="background:rgba(22,163,74,.08);border:1px solid rgba(22,163,74,.2);border-radius:16px;
                           padding:16px 20px;display:flex;align-items:center;gap:10px">
                <mat-icon style="color:#16a34a">check_circle</mat-icon>
                <div>
                  <p style="font-weight:600;color:#16a34a;margin:0;font-size:.9375rem">Return request submitted</p>
                  <p style="font-size:.8125rem;color:var(--text-muted);margin:2px 0 0">
                    Our team will review your request within 1–2 business days.
                  </p>
                </div>
              </div>
            }

            <!-- Status timeline -->
            @if ((order()!.statusHistory?.length ?? 0) > 0) {
              <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
                <div class="px-5 py-3 bg-surface-50 border-b border-border-default">
                  <h2 class="font-semibold text-text-primary text-sm">Order Timeline</h2>
                </div>
                <div class="px-5 py-4">
                  <ol class="relative border-l border-border-default ml-3 space-y-4">
                    @for (h of order()!.statusHistory; track h.id) {
                      <li class="ml-6">
                        <span class="absolute -left-1.5 w-3 h-3 rounded-full bg-primary-600 border-2 border-bg-base"></span>
                        <div class="flex items-center justify-between">
                          <p class="text-sm font-medium text-text-primary">{{ statusLabel($any(h.toStatus)) }}</p>
                          <time class="text-xs text-text-muted">{{ h.createdAt | timeAgo }}</time>
                        </div>
                        @if (h.note) {
                          <p class="text-xs text-text-secondary mt-0.5">{{ h.note }}</p>
                        }
                      </li>
                    }
                  </ol>
                </div>
              </div>
            }
          </div>

          <!-- Right: summary + address + payment -->
          <div class="space-y-4">

            <!-- Price summary -->
            <div class="rounded-2xl border border-border-default bg-bg-base p-5 space-y-3">
              <h3 class="font-semibold text-text-primary">Price Details</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between text-text-secondary">
                  <span>Subtotal</span><span>{{ order()!.subtotal | currencyInr }}</span>
                </div>
                @if (order()!.discount > 0) {
                  <div class="flex justify-between text-green-600">
                    <span>Discount{{ order()!.couponCode ? ' (' + order()!.couponCode + ')' : '' }}</span>
                    <span>−{{ order()!.discount | currencyInr }}</span>
                  </div>
                }
                <div class="flex justify-between text-text-secondary">
                  <span>Shipping</span>
                  @if (order()!.shipping === 0) {
                    <span class="text-green-600">FREE</span>
                  } @else {
                    <span>{{ order()!.shipping | currencyInr }}</span>
                  }
                </div>
                <div class="flex justify-between text-text-muted text-xs">
                  <span>GST (18% incl.)</span><span>{{ order()!.tax | currencyInr }}</span>
                </div>
                <div class="border-t border-border-default pt-2 flex justify-between font-bold text-text-primary">
                  <span>Total</span><span>{{ order()!.total | currencyInr }}</span>
                </div>
              </div>
            </div>

            <!-- Shipping address -->
            <div class="rounded-2xl border border-border-default bg-bg-base p-5">
              <h3 class="font-semibold text-text-primary mb-3">Delivery Address</h3>
              <p class="font-medium text-text-primary text-sm">{{ order()!.shippingAddress.fullName }}</p>
              <p class="text-sm text-text-secondary">{{ order()!.shippingAddress.phone }}</p>
              <p class="text-sm text-text-secondary mt-1">
                {{ order()!.shippingAddress.line1 }}
                @if (order()!.shippingAddress.line2) { , {{ order()!.shippingAddress.line2 }} }
              </p>
              <p class="text-sm text-text-secondary">
                {{ order()!.shippingAddress.city }}, {{ order()!.shippingAddress.state }}
                {{ order()!.shippingAddress.pincode }}
              </p>
            </div>

            <!-- Payment info -->
            <div class="rounded-2xl border border-border-default bg-bg-base p-5">
              <h3 class="font-semibold text-text-primary mb-3">Payment</h3>
              <div class="flex items-center gap-2">
                <mat-icon class="!text-base text-text-secondary">
                  {{ paymentIcon(order()!.paymentMethod) }}
                </mat-icon>
                <span class="text-sm text-text-primary capitalize">{{ order()!.paymentMethod }}</span>
                <lg-badge [variant]="order()!.paymentStatus === 'paid' ? 'success' : 'warning'" class="ml-auto">
                  {{ order()!.paymentStatus }}
                </lg-badge>
              </div>
              @if (order()!.paymentRef) {
                <p class="text-xs text-text-muted mt-1.5">Ref: {{ order()!.paymentRef }}</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class OrderDetailComponent implements OnInit {
  readonly #route    = inject(ActivatedRoute);
  readonly #orderSvc = inject(OrderService);
  readonly #toast    = inject(ToastService);
  readonly #http     = inject(HttpClient);

  readonly order      = signal<Order | null>(null);
  readonly loading    = signal(true);
  readonly cancelling = signal(false);

  // ── Return state ───────────────────────────────────────
  readonly showReturnForm   = signal(false);
  readonly submittingReturn = signal(false);
  readonly returnSubmitted  = signal(false);
  returnReason      = '';
  returnDescription = '';

  // ── Review state ───────────────────────────────────────
  readonly showReviewForm     = signal(false);
  readonly reviewProductId    = signal<number | null>(null);
  readonly reviewProductName  = signal('');
  readonly reviewedProductIds = signal<Set<number>>(new Set());

  readonly trackingSteps = [
    { status: 'pending',          label: 'Ordered',   icon: 'check_circle' },
    { status: 'confirmed',        label: 'Confirmed', icon: 'verified' },
    { status: 'processing',       label: 'Packed',    icon: 'inventory_2' },
    { status: 'shipped',          label: 'Shipped',   icon: 'local_shipping' },
    { status: 'out_for_delivery', label: 'Out for\nDelivery', icon: 'delivery_dining' },
    { status: 'delivered',        label: 'Delivered', icon: 'home' },
  ];

  readonly statusOrder: OrderStatus[] = [
    'pending','confirmed','processing','shipped','out_for_delivery','delivered',
  ];

  ngOnInit(): void {
    this.#route.params.subscribe(p => {
      this.loading.set(true);
      this.#orderSvc.getOrder(Number(p['id'])).subscribe({
        next: r => { this.order.set(r.data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
    });
  }

  canCancel(): boolean {
    return ['pending', 'confirmed'].includes(this.order()?.status ?? '');
  }

  isReached(status: string): boolean {
    const cur = this.order()?.status ?? '';
    const curIdx = this.statusOrder.indexOf(cur as OrderStatus);
    const stepIdx = this.statusOrder.indexOf(status as OrderStatus);
    return stepIdx <= curIdx;
  }

  cancelOrder(): void {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    this.cancelling.set(true);
    this.#orderSvc.cancelOrder(this.order()!.id, 'Cancelled by customer').subscribe({
      next: r => {
        this.order.set(r.data);
        this.cancelling.set(false);
        this.#toast.success('Order cancelled');
      },
      error: err => {
        this.cancelling.set(false);
        this.#toast.error('Error', err?.error?.message ?? 'Could not cancel');
      },
    });
  }

  statusVariant(status: OrderStatus): 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' {
    const map: Record<OrderStatus, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
      pending: 'warning', confirmed: 'primary', processing: 'primary',
      shipped: 'info', out_for_delivery: 'info', delivered: 'success',
      cancelled: 'error', refund_requested: 'warning', refunded: 'default',
    };
    return map[status] ?? 'default';
  }

  statusLabel(status: OrderStatus): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  paymentIcon(method: string): string {
    const icons: Record<string, string> = {
      upi: 'account_balance_wallet', card: 'credit_card',
      netbanking: 'account_balance', cod: 'payments', wallet: 'wallet',
    };
    return icons[method] ?? 'payment';
  }

  objectEntries(obj: Record<string, string>): [string, string][] {
    return Object.entries(obj);
  }

  // ── Review helpers ─────────────────────────────────────
  openReview(): void {
    const firstUnreviewed = this.order()?.items
      .find(i => !this.reviewedProductIds().has(i.productId));
    if (firstUnreviewed) {
      this.reviewProductId.set(firstUnreviewed.productId);
      this.reviewProductName.set(firstUnreviewed.productName);
    }
    this.showReviewForm.set(true);
  }

  openReviewForProduct(productId: number, productName: string, initialRating: number): void {
    this.reviewProductId.set(productId);
    this.reviewProductName.set(productName);
    this.showReviewForm.set(true);
    void initialRating; // rating is set inside the form via the star picker
  }

  submitReturn(): void {
    if (!this.returnReason) return;
    this.submittingReturn.set(true);
    this.#http.post(
      `${environment.apiUrl}/api/v1/returns`,
      {
        orderId:     this.order()!.id,
        reason:      this.returnReason,
        description: this.returnDescription.trim() || undefined,
      },
      { withCredentials: true },
    ).subscribe({
      next: () => {
        this.submittingReturn.set(false);
        this.returnSubmitted.set(true);
        this.showReturnForm.set(false);
        this.#toast.success('Return request submitted', 'We\'ll review it within 1–2 business days');
      },
      error: err => {
        this.submittingReturn.set(false);
        this.#toast.error('Error', err?.error?.message ?? 'Could not submit return request');
      },
    });
  }

  onReviewDone(_review: unknown): void {
    const pid = this.reviewProductId();
    if (pid) {
      this.reviewedProductIds.update(s => new Set([...s, pid]));
    }
    this.showReviewForm.set(false);
    this.reviewProductId.set(null);
    this.reviewProductName.set('');
    this.#toast.success('Review submitted!', 'Thank you for your feedback 🌿');
  }
}

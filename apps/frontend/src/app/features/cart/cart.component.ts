import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CartService, CartItem, PriceSummary } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'lg-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule, MatIconModule,
    CurrencyInrPipe, SkeletonComponent, BadgeComponent, ButtonComponent,
  ],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 md:px-6 py-8">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-text-muted mb-6">
        <a routerLink="/" class="hover:text-text-primary transition-colors">Home</a>
        <mat-icon class="!text-base">chevron_right</mat-icon>
        <span class="text-text-primary">Shopping Cart</span>
      </nav>

      <h1 class="font-display text-2xl font-bold text-text-primary mb-6">
        Shopping Cart
        @if (!loading() && cartSvc.itemCount() > 0) {
          <span class="text-base font-normal text-text-muted ml-2">
            ({{ cartSvc.itemCount() }} item{{ cartSvc.itemCount() !== 1 ? 's' : '' }})
          </span>
        }
      </h1>

      @if (loading()) {
        <div class="grid lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-4">
            @for (i of [0,1,2]; track i) {
              <lg-skeleton height="120px" borderRadius="1rem"></lg-skeleton>
            }
          </div>
          <lg-skeleton height="320px" borderRadius="1rem"></lg-skeleton>
        </div>

      } @else if (!cartSvc.cart() || cartSvc.cart()!.items.length === 0) {
        <div class="flex flex-col items-center justify-center py-24 text-center">
          <div class="w-24 h-24 rounded-full bg-surface-100 flex items-center justify-center mb-6">
            <mat-icon class="!text-4xl text-text-muted">shopping_cart</mat-icon>
          </div>
          <h3 class="font-display text-xl font-semibold text-text-primary mb-2">Your cart is empty</h3>
          <p class="text-text-secondary mb-8">Looks like you haven't added anything yet.</p>
          <lg-button variant="primary" size="lg" routerLink="/products" prefixIcon="explore">
            Start Shopping
          </lg-button>
        </div>

      } @else {
        <div class="grid lg:grid-cols-3 gap-8 items-start">

          <!-- Cart items -->
          <div class="lg:col-span-2 space-y-4">
            @for (item of cartSvc.cart()!.items; track item.id) {
              <div class="flex gap-4 p-4 rounded-2xl border border-border-default bg-bg-base
                          hover:border-primary-200 transition-colors">

                <a [routerLink]="['/products', item.productSlug]"
                   class="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-surface-50">
                  <img [src]="item.image || '/assets/placeholder.png'"
                       [alt]="item.productName"
                       class="w-full h-full object-cover" />
                </a>

                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <a [routerLink]="['/products', item.productSlug]"
                         class="font-medium text-text-primary hover:text-primary-600 transition-colors line-clamp-2">
                        {{ item.productName }}
                      </a>
                      @if (item.variantAttrs) {
                        <p class="text-xs text-text-muted mt-0.5">
                          @for (entry of objectEntries(item.variantAttrs); track entry[0]) {
                            <span class="capitalize">{{ entry[0] }}: {{ entry[1] }}</span>
                            <span class="mx-1 last:hidden">·</span>
                          }
                        </p>
                      }
                      @if (item.sku) {
                        <p class="text-xs text-text-muted">SKU: {{ item.sku }}</p>
                      }
                    </div>
                    <button
                      class="flex-shrink-0 w-7 h-7 rounded-full text-text-muted hover:text-red-500
                             hover:bg-red-50 transition-colors flex items-center justify-center"
                      (click)="remove(item)" aria-label="Remove">
                      <mat-icon class="!text-base">close</mat-icon>
                    </button>
                  </div>

                  <div class="flex items-center justify-between mt-3 gap-4">
                    <div class="flex items-center border border-border-default rounded-lg overflow-hidden">
                      <button class="px-2.5 py-1.5 hover:bg-surface-100 transition-colors disabled:opacity-40"
                              [disabled]="item.qty <= 1"
                              (click)="updateQty(item, item.qty - 1)">
                        <mat-icon class="!text-sm">remove</mat-icon>
                      </button>
                      <span class="px-3 py-1.5 text-sm font-semibold min-w-[2rem] text-center">{{ item.qty }}</span>
                      <button class="px-2.5 py-1.5 hover:bg-surface-100 transition-colors"
                              (click)="updateQty(item, item.qty + 1)">
                        <mat-icon class="!text-sm">add</mat-icon>
                      </button>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-text-primary">{{ item.lineTotal | currencyInr }}</p>
                      @if (item.effectivePrice !== item.price) {
                        <p class="text-xs text-text-muted line-through">{{ (item.price * item.qty) | currencyInr }}</p>
                      }
                    </div>
                  </div>

                  @if (item.isOutOfStock) {
                    <lg-badge variant="error" class="mt-2">Out of stock — please remove</lg-badge>
                  }
                </div>
              </div>
            }

            <a routerLink="/products"
               class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium">
              <mat-icon class="!text-base">arrow_back</mat-icon>
              Continue shopping
            </a>
          </div>

          <!-- Order summary -->
          <div class="rounded-2xl border border-border-default bg-bg-base p-6 space-y-4 sticky top-20">
            <h2 class="font-display font-bold text-lg text-text-primary">Order Summary</h2>

            <div class="flex gap-2">
              <input [(ngModel)]="couponInput"
                     placeholder="Coupon code"
                     class="flex-1 h-9 px-3 rounded-lg border border-border-default bg-surface-50
                            text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
              />
              <button class="h-9 px-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm
                             font-medium transition-colors disabled:opacity-50"
                      [disabled]="!couponInput.trim() || applyingCoupon()"
                      (click)="applyCoupon()">
                Apply
              </button>
            </div>
            @if (couponError()) {
              <p class="text-xs text-red-600 -mt-2">{{ couponError() }}</p>
            }

            @if (pricing()) {
              <div class="space-y-2.5 text-sm">
                <div class="flex justify-between text-text-secondary">
                  <span>Subtotal ({{ pricing()!.itemCount }} items)</span>
                  <span>{{ pricing()!.subtotal | currencyInr }}</span>
                </div>
                @if (pricing()!.discount > 0) {
                  <div class="flex justify-between text-green-600">
                    <span>Coupon ({{ pricing()!.couponCode }})</span>
                    <span>−{{ pricing()!.discount | currencyInr }}</span>
                  </div>
                }
                <div class="flex justify-between text-text-secondary">
                  <span>Shipping</span>
                  @if (pricing()!.shipping === 0) {
                    <span class="text-green-600 font-medium">FREE</span>
                  } @else {
                    <span>{{ pricing()!.shipping | currencyInr }}</span>
                  }
                </div>
                <div class="flex justify-between text-text-muted text-xs">
                  <span>GST (18% included)</span>
                  <span>{{ pricing()!.tax | currencyInr }}</span>
                </div>
                @if (pricing()!.shipping > 0) {
                  <p class="text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2">
                    Add {{ (499 - pricing()!.subtotal) | currencyInr }} more for FREE shipping
                  </p>
                }
                <div class="border-t border-border-default pt-2.5 flex justify-between font-bold text-text-primary text-base">
                  <span>Total</span>
                  <span>{{ pricing()!.total | currencyInr }}</span>
                </div>
                @if (pricing()!.savings > 0) {
                  <p class="text-xs text-green-600 font-medium text-center">
                    You save {{ pricing()!.savings | currencyInr }} on this order!
                  </p>
                }
              </div>
            }

            <lg-button variant="primary" size="lg" [fullWidth]="true" prefixIcon="lock"
                       [disabled]="hasOutOfStock()" routerLink="/checkout">
              Proceed to Checkout
            </lg-button>

            <div class="flex justify-center gap-6 pt-1">
              @for (t of trustItems; track t.icon) {
                <div class="flex flex-col items-center gap-0.5 text-text-muted">
                  <mat-icon class="!text-base text-green-500">{{ t.icon }}</mat-icon>
                  <span class="text-[10px]">{{ t.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CartComponent implements OnInit {
  readonly cartSvc = inject(CartService);
  readonly #toast  = inject(ToastService);

  readonly loading        = signal(true);
  readonly pricing        = signal<PriceSummary | null>(null);
  readonly applyingCoupon = signal(false);
  readonly couponError    = signal<string | null>(null);
  couponInput = '';

  readonly hasOutOfStock = computed(() =>
    this.cartSvc.cart()?.items.some(i => i.isOutOfStock) ?? false
  );

  readonly trustItems = [
    { icon: 'verified_user', label: 'Secure' },
    { icon: 'replay',        label: 'Returns' },
    { icon: 'support_agent', label: 'Support' },
  ];

  ngOnInit(): void {
    this.cartSvc.load().subscribe({
      next: () => { this.loading.set(false); this.loadPricing(); },
      error: () => this.loading.set(false),
    });
  }

  loadPricing(coupon?: string): void {
    this.cartSvc.getPriceSummary(coupon).subscribe({ next: r => this.pricing.set(r.data) });
  }

  applyCoupon(): void {
    const code = this.couponInput.trim().toUpperCase();
    if (!code) return;
    this.applyingCoupon.set(true);
    this.couponError.set(null);
    this.cartSvc.validateCoupon(code).subscribe({
      next: r => {
        this.applyingCoupon.set(false);
        this.#toast.success('Coupon applied!', r.data.description);
        this.loadPricing(code);
      },
      error: err => {
        this.applyingCoupon.set(false);
        this.couponError.set(err?.error?.message ?? 'Invalid coupon');
      },
    });
  }

  updateQty(item: CartItem, qty: number): void {
    this.cartSvc.updateItem(item.id, qty).subscribe({
      next: () => this.loadPricing(this.pricing()?.couponCode ?? undefined),
      error: err => this.#toast.error('Error', err?.error?.message ?? 'Could not update'),
    });
  }

  remove(item: CartItem): void {
    this.cartSvc.removeItem(item.id).subscribe({
      next: () => {
        this.#toast.success('Removed', item.productName);
        this.loadPricing(this.pricing()?.couponCode ?? undefined);
      },
    });
  }

  objectEntries(obj: Record<string, string>): [string, string][] {
    return Object.entries(obj);
  }
}

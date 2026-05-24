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

@Component({
  selector: 'lg-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, MatIconModule, CurrencyInrPipe, SkeletonComponent],
  styles: [`
    :host { display: block; }
    .page { max-width: 1200px; margin: 0 auto; padding: 24px 24px 80px; }

    /* ── Breadcrumb ─────────────────────────────── */
    .breadcrumb { display:flex; align-items:center; gap:4px; font-size:.8125rem; color:var(--text-muted); margin-bottom:24px; }
    .breadcrumb a { color:var(--text-muted); text-decoration:none; transition:color 150ms; }
    .breadcrumb a:hover { color:var(--color-primary); }

    /* ── Page heading ───────────────────────────── */
    .page-heading { font-family:var(--font-display); font-size:1.75rem; font-weight:600; color:var(--text-primary); margin:0 0 28px; }
    .item-count { font-family:var(--font-sans); font-size:.9375rem; font-weight:400; color:var(--text-muted); margin-left:8px; }

    /* ── Main grid ──────────────────────────────── */
    .cart-grid { display:grid; grid-template-columns:1fr; gap:24px; align-items:start; }
    @media(min-width:1024px){ .cart-grid { grid-template-columns:1fr 380px; } }

    /* ── Cart item card ─────────────────────────── */
    .item-card {
      display:flex; gap:16px; padding:16px;
      background:#fff; border:1px solid var(--border-default); border-radius:16px;
      transition:border-color 200ms, box-shadow 200ms;
    }
    .item-card:hover { border-color:var(--color-primary-200); box-shadow:var(--shadow-sm); }

    .item-img {
      flex-shrink:0; width:100px; height:100px;
      border-radius:12px; overflow:hidden; background:var(--bg-subtle);
      text-decoration:none;
    }
    .item-img img { width:100%; height:100%; object-fit:cover; transition:transform 300ms ease; }
    .item-card:hover .item-img img { transform:scale(1.05); }

    .item-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:8px; }

    .item-top { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }

    .item-name {
      font-size:.9375rem; font-weight:500; color:var(--text-primary);
      text-decoration:none; line-height:1.4;
      display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
      transition:color 150ms;
    }
    .item-name:hover { color:var(--color-primary); }

    .item-meta { font-size:.75rem; color:var(--text-muted); }

    .remove-btn {
      flex-shrink:0; width:28px; height:28px; border-radius:50%;
      background:none; border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      color:var(--text-muted); transition:color 150ms, background 150ms;
    }
    .remove-btn:hover { color:#c0392b; background:rgba(192,57,43,.08); }

    .item-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; }

    /* ── Qty stepper ────────────────────────────── */
    .qty-stepper {
      display:flex; align-items:center;
      border:1.5px solid var(--border-default); border-radius:10px; overflow:hidden;
      background:#fff;
    }
    .qty-btn {
      width:34px; height:34px; border:none; background:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center; color:var(--text-secondary);
      transition:background 150ms;
    }
    .qty-btn:hover:not(:disabled) { background:var(--bg-subtle); }
    .qty-btn:disabled { opacity:.35; cursor:not-allowed; }
    .qty-val {
      min-width:36px; text-align:center; font-weight:700; font-size:.875rem;
      color:var(--text-primary);
      border-left:1.5px solid var(--border-default); border-right:1.5px solid var(--border-default);
      line-height:34px;
    }

    .item-price { text-align:right; }
    .item-price .total { font-size:1rem; font-weight:700; color:var(--text-primary); }
    .item-price .mrp { font-size:.75rem; color:var(--text-muted); text-decoration:line-through; }

    .oos-chip {
      display:inline-flex; align-items:center; gap:4px;
      font-size:.75rem; font-weight:600; color:#c0392b;
      background:rgba(192,57,43,.08); border-radius:9999px; padding:2px 10px;
    }

    .continue-link {
      display:inline-flex; align-items:center; gap:6px;
      font-size:.875rem; font-weight:600; color:var(--color-primary);
      text-decoration:none; margin-top:4px; transition:opacity 150ms;
    }
    .continue-link:hover { opacity:.75; }

    /* ── Order summary panel ────────────────────── */
    .summary-panel {
      background:#fff; border:1px solid var(--border-default); border-radius:20px;
      padding:24px; display:flex; flex-direction:column; gap:18px;
    }
    @media(min-width:1024px){ .summary-panel { position:sticky; top:88px; } }

    .summary-heading { font-family:var(--font-display); font-size:1.125rem; font-weight:600; color:var(--text-primary); margin:0; }

    /* ── Coupon input ───────────────────────────── */
    .coupon-row { display:flex; gap:8px; }
    .coupon-inp {
      flex:1; height:40px; padding:0 14px;
      border:1.5px solid var(--border-default); border-radius:10px;
      font-family:var(--font-sans); font-size:.875rem; color:var(--text-primary);
      background:var(--bg-subtle); outline:none; text-transform:uppercase;
      transition:border-color 150ms;
    }
    .coupon-inp:focus { border-color:var(--color-primary); background:#fff; }
    .coupon-inp::placeholder { text-transform:none; color:var(--text-muted); }
    .coupon-btn {
      height:40px; padding:0 18px;
      background:var(--color-primary); color:#fff;
      border:none; border-radius:10px; cursor:pointer;
      font-family:var(--font-sans); font-size:.875rem; font-weight:700;
      transition:background 150ms;
    }
    .coupon-btn:hover { background:var(--color-primary-dark); }
    .coupon-btn:disabled { opacity:.5; cursor:not-allowed; }
    .coupon-err { font-size:.75rem; color:var(--color-error); margin-top:-6px; }
    .coupon-ok  { font-size:.75rem; color:var(--color-primary); font-weight:600; margin-top:-6px; }

    /* ── Price rows ─────────────────────────────── */
    .price-rows { display:flex; flex-direction:column; gap:10px; font-size:.875rem; }
    .price-row  { display:flex; justify-content:space-between; color:var(--text-secondary); }
    .price-row.saving { color:var(--color-primary); }
    .price-row.free   { color:var(--color-primary); font-weight:600; }
    .price-row.cod    { color:var(--color-warning); }
    .price-divider    { height:1px; background:var(--border-default); }
    .price-total { display:flex; justify-content:space-between; font-size:1rem; font-weight:700; color:var(--text-primary); }

    .free-shipping-nudge {
      display:flex; align-items:center; gap:6px; padding:10px 14px;
      background:var(--color-primary-50); border-radius:10px;
      font-size:.8125rem; color:var(--color-primary-dark); font-weight:500;
    }

    /* ── Checkout button ────────────────────────── */
    .checkout-btn {
      display:flex; align-items:center; justify-content:center; gap:8px;
      width:100%; height:52px; border:none; border-radius:14px;
      background:var(--color-primary); color:#fff;
      font-family:var(--font-sans); font-size:1rem; font-weight:700;
      cursor:pointer; transition:background 150ms, transform 150ms, box-shadow 150ms;
    }
    .checkout-btn:hover:not(:disabled) {
      background:var(--color-primary-dark);
      transform:translateY(-1px);
      box-shadow:0 6px 20px rgba(61,107,69,.3);
    }
    .checkout-btn:active { transform:none; }
    .checkout-btn:disabled { opacity:.5; cursor:not-allowed; }

    /* ── Trust row ──────────────────────────────── */
    .trust-row { display:flex; justify-content:space-around; padding-top:4px; }
    .trust-item { display:flex; flex-direction:column; align-items:center; gap:4px; }
    .trust-label { font-size:10px; color:var(--text-muted); }

    /* ── Empty state ────────────────────────────── */
    .empty {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      padding:80px 0; text-align:center;
    }
    .empty-icon { width:88px; height:88px; border-radius:50%; background:var(--bg-subtle); display:flex; align-items:center; justify-content:center; margin-bottom:20px; }
    .empty h3 { font-family:var(--font-display); font-size:1.375rem; font-weight:600; color:var(--text-primary); margin:0 0 8px; }
    .empty p  { font-size:.9375rem; color:var(--text-muted); margin:0 0 24px; }
    .empty-btn {
      display:inline-flex; align-items:center; gap:8px;
      padding:12px 28px; background:var(--color-primary); color:#fff;
      border:none; border-radius:9999px; font-family:var(--font-sans); font-size:.9375rem; font-weight:700;
      text-decoration:none; cursor:pointer; transition:background 150ms, box-shadow 150ms;
    }
    .empty-btn:hover { background:var(--color-primary-dark); box-shadow:0 6px 20px rgba(61,107,69,.3); }
  `],
  template: `
    <div class="page">

      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/">Home</a>
        <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
        <span style="color:var(--text-primary);font-weight:500">Shopping Cart</span>
      </nav>

      <h1 class="page-heading">
        Shopping Cart
        @if (!loading() && cartSvc.itemCount() > 0) {
          <span class="item-count">({{ cartSvc.itemCount() }} item{{ cartSvc.itemCount() !== 1 ? 's' : '' }})</span>
        }
      </h1>

      @if (loading()) {
        <div class="cart-grid">
          <div style="display:flex;flex-direction:column;gap:16px">
            @for (i of [0,1,2]; track i) {
              <lg-skeleton height="116px" borderRadius="16px"></lg-skeleton>
            }
          </div>
          <lg-skeleton height="340px" borderRadius="20px"></lg-skeleton>
        </div>

      } @else if (!cartSvc.cart() || cartSvc.cart()!.items.length === 0) {
        <div class="empty">
          <div class="empty-icon">
            <mat-icon style="font-size:40px;width:40px;height:40px;color:var(--color-sage)">eco</mat-icon>
          </div>
          <h3>Your cart is empty</h3>
          <p>Discover beautiful plants, seeds, and garden essentials.</p>
          <a routerLink="/products" class="empty-btn">
            <mat-icon style="font-size:20px;width:20px;height:20px">local_florist</mat-icon>
            Browse Plants
          </a>
        </div>

      } @else {
        <div class="cart-grid">

          <!-- ── Cart items ───────────────────────── -->
          <div style="display:flex;flex-direction:column;gap:12px">
            @for (item of cartSvc.cart()!.items; track item.id) {
              <div class="item-card">

                <a [routerLink]="['/products', item.productSlug]" class="item-img">
                  <img [src]="item.image || '/assets/placeholder.png'" [alt]="item.productName" />
                </a>

                <div class="item-body">
                  <div class="item-top">
                    <div style="flex:1;min-width:0">
                      <a [routerLink]="['/products', item.productSlug]" class="item-name">
                        {{ item.productName }}
                      </a>
                      @if (item.variantAttrs) {
                        <p class="item-meta" style="margin-top:2px">
                          @for (e of objectEntries(item.variantAttrs); track e[0]) {
                            <span class="capitalize">{{ e[0] }}: {{ e[1] }}</span>
                            @if (!$last) { <span style="margin:0 4px">·</span> }
                          }
                        </p>
                      }
                    </div>
                    <button class="remove-btn" (click)="remove(item)" aria-label="Remove">
                      <mat-icon style="font-size:16px;width:16px;height:16px">close</mat-icon>
                    </button>
                  </div>

                  <div class="item-footer">
                    <div class="qty-stepper">
                      <button class="qty-btn" [disabled]="item.qty <= 1" (click)="updateQty(item, item.qty - 1)">
                        <mat-icon style="font-size:16px;width:16px;height:16px">remove</mat-icon>
                      </button>
                      <span class="qty-val">{{ item.qty }}</span>
                      <button class="qty-btn" (click)="updateQty(item, item.qty + 1)">
                        <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon>
                      </button>
                    </div>

                    <div class="item-price">
                      <div class="total">{{ item.lineTotal | currencyInr }}</div>
                      @if (item.effectivePrice !== item.price) {
                        <div class="mrp">{{ (item.price * item.qty) | currencyInr }}</div>
                      }
                    </div>
                  </div>

                  @if (item.isOutOfStock) {
                    <div>
                      <span class="oos-chip">
                        <mat-icon style="font-size:12px;width:12px;height:12px">warning</mat-icon>
                        Out of stock — please remove
                      </span>
                    </div>
                  }
                </div>
              </div>
            }

            <a routerLink="/products" class="continue-link">
              <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
              Continue shopping
            </a>
          </div>

          <!-- ── Order summary ────────────────────── -->
          <div class="summary-panel">
            <h2 class="summary-heading">Order Summary</h2>

            <!-- Coupon -->
            <div>
              <div class="coupon-row">
                <input class="coupon-inp" [(ngModel)]="couponInput" placeholder="Enter coupon code" />
                <button class="coupon-btn"
                        [disabled]="!couponInput.trim() || applyingCoupon()"
                        (click)="applyCoupon()">
                  Apply
                </button>
              </div>
              @if (couponError()) {
                <p class="coupon-err" style="margin-top:6px">{{ couponError() }}</p>
              }
              @if (pricing()?.couponCode) {
                <p class="coupon-ok" style="margin-top:6px">
                  🎉 Coupon "{{ pricing()!.couponCode }}" applied!
                </p>
              }
            </div>

            @if (pricing()) {
              <!-- Free shipping nudge -->
              @if (pricing()!.shipping > 0) {
                <div class="free-shipping-nudge">
                  <mat-icon style="font-size:16px;width:16px;height:16px">local_shipping</mat-icon>
                  Add {{ (499 - pricing()!.subtotal) | currencyInr }} more for <strong>FREE delivery</strong>
                </div>
              }

              <!-- Price breakdown -->
              <div class="price-rows">
                <div class="price-row">
                  <span>Subtotal ({{ pricing()!.itemCount }} items)</span>
                  <span>{{ pricing()!.subtotal | currencyInr }}</span>
                </div>
                @if (pricing()!.discount > 0) {
                  <div class="price-row saving">
                    <span>Coupon discount</span>
                    <span>−{{ pricing()!.discount | currencyInr }}</span>
                  </div>
                }
                <div class="price-row" [class.free]="pricing()!.shipping === 0">
                  <span>Delivery</span>
                  <span>{{ pricing()!.shipping === 0 ? 'FREE' : (pricing()!.shipping | currencyInr) }}</span>
                </div>
                <div class="price-row" style="color:var(--text-muted);font-size:.8125rem">
                  <span>GST (18% incl.)</span>
                  <span>{{ pricing()!.tax | currencyInr }}</span>
                </div>
                <div class="price-divider"></div>
                <div class="price-total">
                  <span>Total</span>
                  <span>{{ pricing()!.total | currencyInr }}</span>
                </div>
                @if (pricing()!.savings > 0) {
                  <div style="text-align:center;font-size:.8125rem;color:var(--color-primary);font-weight:600;
                               background:var(--color-primary-50);border-radius:9px;padding:8px">
                    🌿 You save {{ pricing()!.savings | currencyInr }} on this order!
                  </div>
                }
              </div>
            }

            <button class="checkout-btn" [disabled]="hasOutOfStock()" routerLink="/checkout">
              <mat-icon style="font-size:20px;width:20px;height:20px">lock</mat-icon>
              Proceed to Checkout
            </button>

            <div class="trust-row">
              @for (t of trustItems; track t.icon) {
                <div class="trust-item">
                  <mat-icon style="font-size:18px;width:18px;height:18px;color:var(--color-primary)">{{ t.icon }}</mat-icon>
                  <span class="trust-label">{{ t.label }}</span>
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
    { icon: 'verified_user', label: 'Secure Pay' },
    { icon: 'replay',        label: '7-Day Return' },
    { icon: 'local_shipping',label: 'Fast Delivery' },
    { icon: 'support_agent', label: '24/7 Support' },
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

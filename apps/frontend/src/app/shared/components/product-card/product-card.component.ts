import {
  Component, Input, ChangeDetectionStrategy, inject, computed, input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';
import { LazyImgDirective } from '../../directives/lazy-img.directive';
import type { Product } from '../../../core/services/product.service';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'lg-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe, LazyImgDirective],
  styles: [`
    :host { display: block; }

    /* ══════════════════════════════════════════════
       GRID VIEW
    ══════════════════════════════════════════════ */
    .card-grid {
      border-radius: 16px;
      background: var(--bg-base, #fff);
      border: 1px solid var(--border-default);
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
      transition: box-shadow 280ms cubic-bezier(0.16,1,0.3,1),
                  transform  280ms cubic-bezier(0.16,1,0.3,1);
      overflow: hidden;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .card-grid:hover {
      box-shadow: 0 8px 32px rgba(0,0,0,.12);
      transform: translateY(-3px);
    }

    /* Image */
    .grid-img-wrap {
      position: relative;
      background: var(--bg-subtle);
      aspect-ratio: 4/3;
      overflow: hidden;
    }
    .grid-img-wrap img {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 380ms cubic-bezier(0.16,1,0.3,1);
    }
    .card-grid:hover .grid-img-wrap img { transform: scale(1.07); }

    /* Badges */
    .badge-discount {
      position: absolute; top: 10px; left: 10px;
      background: var(--color-accent, #c8603a);
      color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 3px 9px; border-radius: 9999px;
      letter-spacing: .02em;
    }

    .badge-new {
      position: absolute; top: 10px; left: 10px;
      background: var(--color-primary, #3d6b45);
      color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 3px 9px; border-radius: 9999px;
    }

    .badge-care {
      position: absolute; bottom: 10px; left: 10px;
      font-size: 10px; font-weight: 600;
      padding: 3px 8px; border-radius: 9999px;
      backdrop-filter: blur(4px);
    }
    .care-easy   { background: rgba(61,107,69,.82); color: #fff; }
    .care-medium { background: rgba(212,136,10,.85); color: #fff; }
    .care-hard   { background: rgba(192,57,43,.85);  color: #fff; }

    .oos-overlay {
      position: absolute; inset: 0;
      background: rgba(250,246,240,.75);
      display: flex; align-items: center; justify-content: center;
    }
    .oos-label {
      font-size: 12px; font-weight: 600; color: var(--text-muted);
      border: 1px solid var(--border-strong);
      padding: 4px 14px; border-radius: 9999px;
      background: #fff;
    }

    /* Wishlist */
    .wishlist-btn {
      position: absolute; top: 10px; right: 10px;
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,.92);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      opacity: 0;
      transition: opacity 180ms ease, transform 180ms ease;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }
    .card-grid:hover .wishlist-btn { opacity: 1; }
    .wishlist-btn:hover { transform: scale(1.15); }
    .wishlist-btn.active { opacity: 1; }

    /* Info section */
    .grid-info {
      padding: 14px 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      flex: 1;
    }

    .product-name {
      font-size: .875rem;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 150ms;
    }
    .card-grid:hover .product-name { color: var(--color-primary); }

    .rating-row { display: flex; align-items: center; gap: 5px; }
    .rating-badge {
      display: inline-flex; align-items: center; gap: 2px;
      background: var(--color-primary); color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 2px 7px; border-radius: 5px;
    }
    .rating-count { font-size: 11px; color: var(--text-muted); }

    .price-row {
      display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap;
      margin-top: 2px;
    }
    .price-main { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); }
    .price-mrp  { font-size: .8125rem; color: var(--text-muted); text-decoration: line-through; }
    .price-save { font-size: .8125rem; color: #16a34a; font-weight: 600; }

    .meta-row {
      display: flex; align-items: center; gap: 10px;
      font-size: 11px; color: var(--color-primary); font-weight: 500;
    }
    .low-stock { color: var(--color-warning, #d97706) !important; }

    /* Add button */
    .add-btn {
      margin-top: auto;
      padding-top: 4px;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; padding: 9px 0;
      background: var(--color-primary);
      color: #fff;
      border: none; border-radius: 9999px; cursor: pointer;
      font-size: .8125rem; font-weight: 600; letter-spacing: .03em;
      transition: background 150ms, transform 120ms, box-shadow 150ms;
    }
    .add-btn:hover:not(:disabled) {
      background: var(--color-primary-dark, #2d5235);
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(61,107,69,.28);
    }
    .add-btn:active:not(:disabled) { transform: translateY(0); }
    .add-btn:disabled {
      background: var(--border-default);
      color: var(--text-muted);
      cursor: not-allowed;
    }

    /* ══════════════════════════════════════════════
       LIST VIEW
    ══════════════════════════════════════════════ */
    .card-list {
      display: flex;
      align-items: stretch;
      gap: 0;
      background: var(--bg-base, #fff);
      border: 1px solid var(--border-default);
      border-radius: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 200ms, transform 200ms;
    }
    .card-list:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,.09);
      transform: translateX(2px);
    }

    /* List image */
    .list-img-wrap {
      position: relative;
      flex-shrink: 0;
      width: 140px;
      background: var(--bg-subtle);
      overflow: hidden;
    }
    .list-img-wrap img {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 360ms cubic-bezier(0.16,1,0.3,1);
    }
    .card-list:hover .list-img-wrap img { transform: scale(1.05); }

    /* List discount badge */
    .list-badge {
      position: absolute; top: 8px; left: 8px;
      background: var(--color-accent, #c8603a); color: #fff;
      font-size: 10px; font-weight: 700;
      padding: 2px 7px; border-radius: 9999px;
    }

    /* List body */
    .list-body {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
    }

    .list-details { flex: 1; min-width: 0; }

    .list-name {
      font-size: .9375rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.35;
      margin: 0 0 6px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 150ms;
    }
    .card-list:hover .list-name { color: var(--color-primary); }

    .list-desc {
      font-size: .8125rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin: 0 0 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .list-meta {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }

    .list-rating {
      display: inline-flex; align-items: center; gap: 3px;
      background: var(--color-primary); color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 2px 7px; border-radius: 5px;
    }
    .list-stock {
      font-size: 11px; font-weight: 500;
    }
    .list-stock.in-stock  { color: #16a34a; }
    .list-stock.low-stock { color: var(--color-warning, #d97706); }
    .list-stock.out       { color: #dc2626; }

    /* List CTA column */
    .list-cta {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      min-width: 140px;
    }

    .list-price-main {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }
    .list-price-row {
      display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
    }
    .list-price-mrp  { font-size: .8125rem; color: var(--text-muted); text-decoration: line-through; }
    .list-price-save { font-size: .8125rem; color: #16a34a; font-weight: 600; }

    .list-add-btn {
      display: flex; align-items: center; justify-content: center; gap: 5px;
      padding: 9px 18px;
      background: var(--color-primary);
      color: #fff;
      border: none; border-radius: 9999px; cursor: pointer;
      font-size: .8125rem; font-weight: 600;
      transition: background 150ms, transform 120ms;
      white-space: nowrap;
      width: 100%;
    }
    .list-add-btn:hover:not(:disabled) {
      background: var(--color-primary-dark, #2d5235);
      transform: translateY(-1px);
    }
    .list-add-btn:disabled {
      background: var(--border-default);
      color: var(--text-muted);
      cursor: not-allowed;
    }

    .list-wishlist-btn {
      width: 34px; height: 34px;
      border-radius: 50%;
      background: var(--bg-subtle);
      border: 1.5px solid var(--border-default);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 150ms, transform 150ms;
    }
    .list-wishlist-btn:hover { border-color: #c8603a; transform: scale(1.1); }
    .list-wishlist-btn.active { border-color: #c8603a; background: #fff1ee; }

    /* Responsive list */
    @media (max-width: 640px) {
      .list-img-wrap { width: 100px; }
      .list-body { padding: 12px 14px; gap: 12px; }
      .list-cta { min-width: 110px; }
      .list-price-main { font-size: 1.0625rem; }
    }
  `],
  template: `
    @if (mode() === 'list') {
      <!-- ── LIST VIEW ───────────────────────────────── -->
      <div class="card-list">
        <!-- Image -->
        <a [routerLink]="['/products', product.slug]" class="list-img-wrap">
          <img [lgLazy]="productSvc.getPrimaryImage(product)" [alt]="product.name" />
          @if (discountPct > 0) {
            <span class="list-badge">{{ discountPct }}% off</span>
          }
        </a>

        <!-- Body -->
        <div class="list-body">
          <div class="list-details">
            <a [routerLink]="['/products', product.slug]">
              <p class="list-name">{{ product.name }}</p>
            </a>

            @if (product.description) {
              <p class="list-desc">{{ product.description }}</p>
            }

            <div class="list-meta">
              @if (product.reviewCount > 0) {
                <span class="list-rating">
                  <mat-icon style="font-size:11px;width:11px;height:11px">star</mat-icon>
                  {{ product.rating }} ({{ formatCount(product.reviewCount) }})
                </span>
              }
              @if (isOutOfStock) {
                <span class="list-stock out">Out of Stock</span>
              } @else if (isLowStock) {
                <span class="list-stock low-stock">Only a few left</span>
              } @else {
                <span class="list-stock in-stock">
                  <mat-icon style="font-size:11px;width:11px;height:11px">check_circle</mat-icon>
                  In Stock
                </span>
              }
              <span style="font-size:11px;color:var(--color-primary);font-weight:500;display:flex;align-items:center;gap:2px">
                <mat-icon style="font-size:11px;width:11px;height:11px">local_shipping</mat-icon>
                Free delivery
              </span>
            </div>
          </div>

          <!-- Price + CTA -->
          <div class="list-cta">
            <div class="list-price-row">
              <span class="list-price-main">{{ effectivePrice | currencyInr }}</span>
              @if (product.salePrice) {
                <span class="list-price-mrp">{{ product.basePrice | currencyInr }}</span>
                <span class="list-price-save">{{ discountPct }}% off</span>
              }
            </div>

            <button
              class="list-add-btn"
              [disabled]="isOutOfStock"
              (click)="addToCart($event)"
            >
              <mat-icon style="font-size:14px;width:14px;height:14px">add_shopping_cart</mat-icon>
              {{ isOutOfStock ? 'Out of Stock' : 'Add to Cart' }}
            </button>

            <button
              class="list-wishlist-btn"
              [class.active]="wishlisted()"
              (click)="toggleWishlist($event)"
              title="{{ wishlisted() ? 'Remove from wishlist' : 'Add to wishlist' }}"
            >
              <mat-icon style="font-size:16px;width:16px;height:16px"
                        [style.color]="wishlisted() ? '#c8603a' : 'var(--text-muted)'">
                {{ wishlisted() ? 'favorite' : 'favorite_border' }}
              </mat-icon>
            </button>
          </div>
        </div>
      </div>

    } @else {
      <!-- ── GRID VIEW ───────────────────────────────── -->
      <div class="card-grid">

        <!-- Image -->
        <a [routerLink]="['/products', product.slug]" class="grid-img-wrap">
          <img [lgLazy]="productSvc.getPrimaryImage(product)" [alt]="product.name" />

          <!-- Discount badge -->
          @if (discountPct > 0) {
            <span class="badge-discount">{{ discountPct }}% off</span>
          } @else {
            <span class="badge-new">New</span>
          }

          <!-- Care difficulty -->
          <span class="badge-care" [class]="careDifficultyClass">{{ careDifficulty }}</span>

          <!-- OOS overlay -->
          @if (isOutOfStock) {
            <div class="oos-overlay">
              <span class="oos-label">Out of Stock</span>
            </div>
          }

          <!-- Wishlist -->
          <button class="wishlist-btn" [class.active]="wishlisted()" (click)="toggleWishlist($event)">
            <mat-icon style="font-size:16px;width:16px;height:16px"
                      [style.color]="wishlisted() ? '#c8603a' : '#8a9e8d'">
              {{ wishlisted() ? 'favorite' : 'favorite_border' }}
            </mat-icon>
          </button>
        </a>

        <!-- Info -->
        <div class="grid-info">
          <a [routerLink]="['/products', product.slug]" class="product-name">{{ product.name }}</a>

          @if (product.reviewCount > 0) {
            <div class="rating-row">
              <span class="rating-badge">
                {{ product.rating }}
                <mat-icon style="font-size:10px;width:10px;height:10px">star</mat-icon>
              </span>
              <span class="rating-count">{{ formatCount(product.reviewCount) }} reviews</span>
            </div>
          }

          <div class="price-row">
            <span class="price-main">{{ effectivePrice | currencyInr }}</span>
            @if (product.salePrice) {
              <span class="price-mrp">{{ product.basePrice | currencyInr }}</span>
              <span class="price-save">{{ discountPct }}% off</span>
            }
          </div>

          <div class="meta-row">
            <span style="display:flex;align-items:center;gap:3px">
              <mat-icon style="font-size:11px;width:11px;height:11px">local_shipping</mat-icon>
              Free delivery
            </span>
            @if (isLowStock) {
              <span class="low-stock" style="display:flex;align-items:center;gap:3px">
                <mat-icon style="font-size:11px;width:11px;height:11px">timer</mat-icon>
                Few left
              </span>
            }
          </div>

          <button
            class="add-btn"
            [disabled]="isOutOfStock"
            (click)="addToCart($event)"
          >
            <mat-icon style="font-size:15px;width:15px;height:15px">add_shopping_cart</mat-icon>
            {{ isOutOfStock ? 'Out of Stock' : 'Add to Cart' }}
          </button>
        </div>
      </div>
    }
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  readonly mode = input<'grid' | 'list'>('grid');

  readonly productSvc = inject(ProductService);
  readonly #cartSvc   = inject(CartService);
  readonly #toast     = inject(ToastService);
  readonly #wishlist  = inject(WishlistService);
  readonly #auth      = inject(AuthService);

  readonly wishlisted = computed(() => this.#wishlist.isWishlisted(this.product?.id));

  get effectivePrice(): number { return this.productSvc.getEffectivePrice(this.product); }
  get discountPct(): number    { return this.productSvc.getDiscountPct(this.product); }

  get isOutOfStock(): boolean {
    if (!this.product.hasVariants || !this.product.variants?.length) return false;
    return this.product.variants.every(v => v.inventory?.isOutOfStock ?? false);
  }

  get isLowStock(): boolean {
    if (this.isOutOfStock) return false;
    return this.product.variants?.some(v => v.inventory?.isLowStock) ?? false;
  }

  get careDifficulty(): string {
    const tags: string[] = (this.product as any).tags ?? [];
    if (tags.some((t: string) => /hard|advanced|expert/i.test(t))) return '🌿 Hard';
    if (tags.some((t: string) => /medium|moderate/i.test(t))) return '🌱 Medium';
    return '☀️ Easy Care';
  }

  get careDifficultyClass(): string {
    const d = this.careDifficulty;
    if (d.includes('Hard'))   return 'badge-care care-hard';
    if (d.includes('Medium')) return 'badge-care care-medium';
    return 'badge-care care-easy';
  }

  formatCount(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return `${n}`;
  }

  toggleWishlist(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this.#auth.isLoggedIn()) {
      this.#toast.error('Login required', 'Please login to use wishlist');
      return;
    }
    const adding = !this.wishlisted();
    this.#wishlist.toggle(this.product.id);
    this.#toast.success(adding ? 'Added to wishlist ❤️' : 'Removed from wishlist');
  }

  addToCart(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.#cartSvc.addItem(this.product.id).subscribe({
      next: () => this.#toast.success('Added to cart 🛒', this.product.name),
      error: err => this.#toast.error('Could not add to cart', err?.error?.message),
    });
  }
}

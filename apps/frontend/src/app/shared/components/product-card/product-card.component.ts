import {
  Component, Input, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';
import { LazyImgDirective } from '../../directives/lazy-img.directive';
import type { Product } from '../../../core/services/product.service';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'lg-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe, LazyImgDirective],
  styles: [`
    :host { display: block; }

    .card-wrap {
      border-radius: 16px;
      background: #fff;
      border: 1px solid var(--border-default);
      box-shadow: var(--shadow-card);
      transition: box-shadow 300ms cubic-bezier(0.16,1,0.3,1),
                  transform  300ms cubic-bezier(0.16,1,0.3,1);
      overflow: hidden;
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }
    .card-wrap:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-4px);
    }

    .img-wrap {
      position: relative;
      background: var(--bg-subtle);
      aspect-ratio: 1;
      overflow: hidden;
    }
    .img-wrap img {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 400ms cubic-bezier(0.16,1,0.3,1);
    }
    .card-wrap:hover .img-wrap img { transform: scale(1.06); }

    .wishlist-btn {
      position: absolute; top: 10px; right: 10px;
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,.9);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      opacity: 0;
      transition: opacity 200ms ease, transform 200ms ease;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }
    .card-wrap:hover .wishlist-btn { opacity: 1; }
    .wishlist-btn:hover { transform: scale(1.15); }
    .wishlist-btn.active { opacity: 1; }

    .badge-discount {
      position: absolute; top: 10px; left: 10px;
      background: var(--color-accent);
      color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 2px 8px; border-radius: 9999px;
    }

    .badge-care {
      position: absolute; bottom: 10px; left: 10px;
      font-size: 10px; font-weight: 600; letter-spacing: .03em;
      padding: 2px 8px; border-radius: 9999px;
      backdrop-filter: blur(4px);
    }
    .care-easy    { background: rgba(61,107,69,.85); color: #fff; }
    .care-medium  { background: rgba(212,136,10,.85); color: #fff; }
    .care-hard    { background: rgba(192,57,43,.85);  color: #fff; }

    .info { padding: 14px 14px 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }

    .product-name {
      font-family: var(--font-sans);
      font-size: .875rem;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      transition: color 150ms ease;
    }
    .card-wrap:hover .product-name { color: var(--color-primary); }

    .rating-row { display: flex; align-items: center; gap: 6px; }
    .rating-badge {
      display: inline-flex; align-items: center; gap: 2px;
      background: var(--color-primary); color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 2px 6px; border-radius: 4px;
    }
    .rating-count { font-size: 11px; color: var(--text-muted); }

    .price-row { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
    .price-main { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); }
    .price-mrp  { font-size: .8125rem; color: var(--text-muted); text-decoration: line-through; }
    .price-save { font-size: .8125rem; color: var(--color-primary); font-weight: 600; }

    .free-del {
      font-size: 11px; color: var(--color-primary); font-weight: 500;
      display: flex; align-items: center; gap: 3px;
    }
    .low-stock {
      font-size: 11px; color: var(--color-warning); font-weight: 500;
      display: flex; align-items: center; gap: 3px;
    }

    .add-btn {
      margin-top: 4px;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; padding: 9px 0;
      background: var(--color-primary);
      color: #fff;
      border: none; border-radius: 9999px; cursor: pointer;
      font-family: var(--font-sans);
      font-size: .8125rem; font-weight: 600; letter-spacing: .03em;
      transition: background 150ms ease, transform 150ms ease, box-shadow 150ms ease;
    }
    .add-btn:hover:not(:disabled) {
      background: var(--color-primary-dark);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(61,107,69,.3);
    }
    .add-btn:active:not(:disabled) { transform: translateY(0); }
    .add-btn:disabled { background: var(--border-default); color: var(--text-muted); cursor: not-allowed; }

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
  `],
  template: `
    <div class="card-wrap">

      <!-- Image -->
      <a [routerLink]="['/products', product.slug]" class="img-wrap">
        <img
          [lgLazy]="productSvc.getPrimaryImage(product)"
          [alt]="product.name"
        />

        <!-- Discount badge -->
        @if (discountPct > 0) {
          <span class="badge-discount">{{ discountPct }}% off</span>
        }

        <!-- Care difficulty -->
        <span class="badge-care" [class]="careDifficultyClass">
          {{ careDifficulty }}
        </span>

        <!-- Out of stock overlay -->
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
      <div class="info">
        <a [routerLink]="['/products', product.slug]" class="product-name">{{ product.name }}</a>

        @if (product.reviewCount > 0) {
          <div class="rating-row">
            <span class="rating-badge">
              {{ product.rating }}
              <mat-icon style="font-size:10px;width:10px;height:10px">star</mat-icon>
            </span>
            <span class="rating-count">{{ formatCount(product.reviewCount) }}</span>
          </div>
        }

        <div class="price-row">
          <span class="price-main">{{ effectivePrice | currencyInr }}</span>
          @if (product.salePrice) {
            <span class="price-mrp">{{ product.basePrice | currencyInr }}</span>
            <span class="price-save">{{ discountPct }}% off</span>
          }
        </div>

        <p class="free-del">
          <mat-icon style="font-size:12px;width:12px;height:12px">local_shipping</mat-icon>
          Free delivery
        </p>

        @if (isLowStock) {
          <p class="low-stock">
            <mat-icon style="font-size:12px;width:12px;height:12px">timer</mat-icon>
            Only a few left
          </p>
        }

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
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  readonly productSvc = inject(ProductService);
  readonly #cartSvc   = inject(CartService);
  readonly #toast     = inject(ToastService);

  readonly wishlisted = signal(false);

  get effectivePrice(): number {
    return this.productSvc.getEffectivePrice(this.product);
  }

  get discountPct(): number {
    return this.productSvc.getDiscountPct(this.product);
  }

  get isOutOfStock(): boolean {
    if (!this.product.hasVariants || !this.product.variants?.length) return false;
    return this.product.variants.every(v => v.inventory?.isOutOfStock ?? false);
  }

  get isLowStock(): boolean {
    if (this.isOutOfStock) return false;
    return this.product.variants?.some(v => v.inventory?.isLowStock) ?? false;
  }

  // Derive care difficulty from product tags or default to Easy for plants
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
    this.wishlisted.update(v => !v);
    this.#toast.success(this.wishlisted() ? 'Added to wishlist' : 'Removed from wishlist');
  }

  addToCart(e: Event): void {
    e.preventDefault();
    this.#cartSvc.addItem(this.product.id).subscribe({
      next: () => this.#toast.success('Added to cart', this.product.name),
      error: err => this.#toast.error('Error', err?.error?.message ?? 'Could not add to cart'),
    });
  }
}

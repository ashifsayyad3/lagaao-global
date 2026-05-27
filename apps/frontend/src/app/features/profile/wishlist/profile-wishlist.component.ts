import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

interface WishlistProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  rating: number;
  reviewCount: number;
  stock: number;
  images?: { url: string; altText: string; isPrimary: boolean }[];
}

interface WishlistItemFull {
  id: number;
  productId: number;
  createdAt: string;
  product: WishlistProduct;
}

@Component({
  selector: 'lg-profile-wishlist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe],
  styles: [`
    :host { display: block; }

    .page-head {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 28px; flex-wrap: wrap; gap: 12px;
    }
    .page-title {
      font-family: var(--font-display); font-size: 1.375rem; font-weight: 700;
      color: var(--text-primary); margin: 0;
      display: flex; align-items: center; gap: 8px;
    }
    .count-chip {
      background: var(--color-primary-50); color: var(--color-primary);
      font-size: .75rem; font-weight: 700; padding: 2px 10px;
      border-radius: 99px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }

    .item-card {
      border: 1px solid var(--border-default); border-radius: 16px;
      overflow: hidden; background: var(--bg-base);
      transition: box-shadow 250ms, transform 250ms;
      display: flex; flex-direction: column;
    }
    .item-card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,.12); transform: translateY(-3px);
    }

    .img-wrap {
      aspect-ratio: 1; overflow: hidden; background: var(--bg-subtle);
      position: relative;
    }
    .img-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .img-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted);
    }

    .remove-btn {
      position: absolute; top: 8px; right: 8px;
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,.9); border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--color-danger, #dc2626);
      transition: background 150ms, transform 150ms;
    }
    .remove-btn:hover { background: #fff; transform: scale(1.1); }

    .body { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .product-name {
      font-size: .9375rem; font-weight: 600; color: var(--text-primary);
      line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
      text-decoration: none;
    }
    .product-name:hover { color: var(--color-primary); }

    .price-row { display: flex; align-items: baseline; gap: 8px; }
    .price { font-size: 1.0625rem; font-weight: 700; color: var(--color-primary); }
    .compare { font-size: .8125rem; color: var(--text-muted); text-decoration: line-through; }

    .cart-btn {
      margin-top: auto; padding: 9px;
      background: var(--color-primary); color: #fff;
      border: none; border-radius: 10px;
      font-size: .875rem; font-weight: 600;
      cursor: pointer; transition: background 150ms;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .cart-btn:hover:not(:disabled) { background: var(--color-primary-dark); }
    .cart-btn:disabled { opacity: .5; cursor: not-allowed; }

    /* Empty state */
    .empty {
      text-align: center; padding: 64px 20px;
      display: flex; flex-direction: column; align-items: center; gap: 16px;
    }
    .empty-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--color-primary-50);
      display: flex; align-items: center; justify-content: center;
      color: var(--color-primary);
    }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .empty-sub { font-size: .9375rem; color: var(--text-muted); margin: 0; }
    .browse-btn {
      padding: 10px 28px; background: var(--color-primary); color: #fff;
      border: none; border-radius: 12px; font-size: .9375rem; font-weight: 600;
      cursor: pointer; text-decoration: none;
    }

    /* Skeleton */
    .skeleton { background: var(--bg-subtle); border-radius: 8px; animation: pulse 1.4s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  `],
  template: `
    <div>
      <div class="page-head">
        <h1 class="page-title">
          <mat-icon>favorite</mat-icon>
          My Wishlist
          @if (items().length) {
            <span class="count-chip">{{ items().length }}</span>
          }
        </h1>
      </div>

      @if (loading()) {
        <!-- Skeleton grid -->
        <div class="grid">
          @for (_ of [1,2,3,4]; track _) {
            <div class="item-card">
              <div class="skeleton" style="aspect-ratio:1"></div>
              <div class="body">
                <div class="skeleton" style="height:18px;border-radius:4px"></div>
                <div class="skeleton" style="height:14px;width:60%;border-radius:4px"></div>
                <div class="skeleton" style="height:36px;border-radius:10px;margin-top:8px"></div>
              </div>
            </div>
          }
        </div>
      } @else if (!items().length) {
        <div class="empty">
          <div class="empty-icon">
            <mat-icon style="font-size:36px;width:36px;height:36px">favorite_border</mat-icon>
          </div>
          <p class="empty-title">Your wishlist is empty</p>
          <p class="empty-sub">Save products you love and come back to them anytime.</p>
          <a class="browse-btn" routerLink="/products">Browse Products</a>
        </div>
      } @else {
        <div class="grid">
          @for (item of items(); track item.id) {
            <div class="item-card">
              <div class="img-wrap">
                @if (primaryImage(item)) {
                  <img [src]="primaryImage(item)" [alt]="item.product.name" loading="lazy" />
                } @else {
                  <div class="img-placeholder">
                    <mat-icon style="font-size:48px;width:48px;height:48px">local_florist</mat-icon>
                  </div>
                }
                <button class="remove-btn" (click)="removeItem(item.productId)" title="Remove from wishlist">
                  <mat-icon style="font-size:18px;width:18px;height:18px">close</mat-icon>
                </button>
              </div>
              <div class="body">
                <a class="product-name" [routerLink]="['/products', item.product.slug]">
                  {{ item.product.name }}
                </a>
                <div class="price-row">
                  <span class="price">{{ item.product.price | currencyInr }}</span>
                  @if (item.product.comparePrice) {
                    <span class="compare">{{ item.product.comparePrice | currencyInr }}</span>
                  }
                </div>
                <button class="cart-btn"
                        [disabled]="addingToCart().has(item.productId)"
                        (click)="addToCart(item.productId)">
                  <mat-icon style="font-size:16px;width:16px;height:16px">shopping_cart</mat-icon>
                  {{ addingToCart().has(item.productId) ? 'Adding…' : 'Add to Cart' }}
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProfileWishlistComponent implements OnInit {
  readonly #http      = inject(HttpClient);
  readonly #wishlist  = inject(WishlistService);
  readonly #cart      = inject(CartService);
  readonly #toast     = inject(ToastService);

  readonly items        = signal<WishlistItemFull[]>([]);
  readonly loading      = signal(true);
  readonly addingToCart = signal<Set<number>>(new Set());

  ngOnInit(): void { this.loadItems(); }

  loadItems(): void {
    this.loading.set(true);
    this.#http.get<{ success: boolean; data: { items: WishlistItemFull[]; meta: unknown } }>(
      `${environment.apiUrl}/api/v1/wishlist`, { withCredentials: true },
    ).subscribe({
      next: r => {
        if (r.success) this.items.set(r.data.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  primaryImage(item: WishlistItemFull): string | null {
    return item.product.images?.find(i => i.isPrimary)?.url
        ?? item.product.images?.[0]?.url
        ?? null;
  }

  removeItem(productId: number): void {
    this.#wishlist.remove(productId);
    this.items.update(arr => arr.filter(i => i.productId !== productId));
    this.#toast.success('Removed from wishlist');
  }

  addToCart(productId: number): void {
    this.addingToCart.update(s => new Set([...s, productId]));
    this.#cart.addItem(productId).subscribe({
      next: () => {
        this.addingToCart.update(s => { const n = new Set(s); n.delete(productId); return n; });
        this.#toast.success('Added to cart');
      },
      error: (err) => {
        this.addingToCart.update(s => { const n = new Set(s); n.delete(productId); return n; });
        this.#toast.error('Error', err?.error?.message ?? 'Could not add to cart');
      },
    });
  }
}

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
  template: `
    <div class="group bg-white dark:bg-[#1e2a3a] border border-[#F0F0F0] dark:border-[#2a3a4a]
                transition-shadow duration-200 hover:shadow-fk-card-hover cursor-pointer flex flex-col">

      <!-- Image -->
      <a [routerLink]="['/products', product.slug]"
         class="block relative overflow-hidden bg-white dark:bg-[#16213e] aspect-square p-4">
        <img
          [lgLazy]="productSvc.getPrimaryImage(product)"
          [alt]="product.name"
          class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        />

        <!-- Discount badge -->
        @if (discountPct > 0) {
          <span class="absolute top-2 left-2 bg-[#FF6161] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm">
            {{ discountPct }}% off
          </span>
        }

        <!-- Out of stock overlay -->
        @if (isOutOfStock) {
          <div class="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span class="text-gray-600 text-xs font-semibold border border-gray-400 px-3 py-1 rounded-sm">
              Out of Stock
            </span>
          </div>
        }

        <!-- Wishlist -->
        <button
          class="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center
                 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          (click)="toggleWishlist($event)"
        >
          <mat-icon class="!text-base" [class.text-red-500]="wishlisted()">
            {{ wishlisted() ? 'favorite' : 'favorite_border' }}
          </mat-icon>
        </button>
      </a>

      <!-- Info section -->
      <div class="px-3 pb-3 pt-2 flex flex-col gap-1 flex-1">
        <a [routerLink]="['/products', product.slug]"
           class="text-sm text-[#212121] dark:text-gray-200 font-medium leading-snug line-clamp-2
                  hover:text-primary-600 transition-colors">
          {{ product.name }}
        </a>

        <!-- Rating badge + count -->
        @if (product.reviewCount > 0) {
          <div class="flex items-center gap-1.5 mt-0.5">
            <span class="inline-flex items-center gap-0.5 bg-[#388E3C] text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
              {{ product.rating }}
              <mat-icon class="!text-[10px]">star</mat-icon>
            </span>
            <span class="text-xs text-[#878787]">{{ formatCount(product.reviewCount) }}</span>
          </div>
        }

        <!-- Price row -->
        <div class="flex items-baseline gap-1.5 flex-wrap mt-1">
          <span class="text-base font-bold text-[#212121] dark:text-white">
            {{ effectivePrice | currencyInr }}
          </span>
          @if (product.salePrice) {
            <span class="text-xs text-[#878787] line-through">
              {{ product.basePrice | currencyInr }}
            </span>
            <span class="text-xs text-[#388E3C] font-medium">{{ discountPct }}% off</span>
          }
        </div>

        <!-- Free delivery tag -->
        <p class="text-[11px] text-[#388E3C] font-medium flex items-center gap-0.5 mt-0.5">
          <mat-icon class="!text-xs">local_shipping</mat-icon>
          Free delivery
        </p>

        <!-- Low stock -->
        @if (isLowStock) {
          <p class="text-[11px] text-[#FF9F00] font-medium flex items-center gap-0.5">
            <mat-icon class="!text-xs">timer</mat-icon>
            Only a few left
          </p>
        }

        <!-- Add to cart button -->
        <button
          class="mt-2 w-full py-2 rounded-sm text-xs font-bold uppercase tracking-wide
                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                 flex items-center justify-center gap-1.5"
          [class]="isOutOfStock
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-[#FF9F00] hover:bg-[#F7931E] text-white'"
          [disabled]="isOutOfStock"
          (click)="addToCart($event)"
        >
          <mat-icon class="!text-sm">add_shopping_cart</mat-icon>
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
  readonly stars = [1, 2, 3, 4, 5];

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

  formatCount(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k ratings`;
    return `${n} ratings`;
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

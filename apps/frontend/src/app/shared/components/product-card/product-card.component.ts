import {
  Component, Input, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';
import { LazyImgDirective } from '../../directives/lazy-img.directive';
import type { Product } from '../../../core/services/product.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'lg-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe, LazyImgDirective],
  template: `
    <div class="group relative rounded-2xl border border-border-default bg-bg-base
                overflow-hidden transition-all duration-300 hover:shadow-elevation-3
                hover:-translate-y-1 hover:border-primary-200">

      <!-- Image container -->
      <a [routerLink]="['/products', product.slug]" class="block relative overflow-hidden bg-surface-100 aspect-square">
        <img
          [lgLazy]="productSvc.getPrimaryImage(product)"
          [alt]="product.name"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <!-- Discount badge -->
        @if (discountPct > 0) {
          <span class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{{ discountPct }}%
          </span>
        }

        <!-- Out of stock overlay -->
        @if (isOutOfStock) {
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span class="bg-white text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        }

        <!-- Wishlist button -->
        <button
          class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm
                 flex items-center justify-center opacity-0 group-hover:opacity-100
                 transition-all duration-200 hover:bg-white hover:scale-110"
          (click)="toggleWishlist($event)"
          [attr.aria-label]="wishlisted() ? 'Remove from wishlist' : 'Add to wishlist'"
        >
          <mat-icon class="!text-lg" [class.text-red-500]="wishlisted()">
            {{ wishlisted() ? 'favorite' : 'favorite_border' }}
          </mat-icon>
        </button>
      </a>

      <!-- Info -->
      <div class="p-3">
        @if (product.brand) {
          <p class="text-xs text-text-muted uppercase tracking-wide mb-1 font-medium">
            {{ product.brand.name }}
          </p>
        }

        <a [routerLink]="['/products', product.slug]"
           class="block font-medium text-sm text-text-primary leading-snug mb-2 line-clamp-2
                  hover:text-primary-600 transition-colors">
          {{ product.name }}
        </a>

        <!-- Rating -->
        @if (product.reviewCount > 0) {
          <div class="flex items-center gap-1 mb-2">
            <div class="flex">
              @for (i of stars; track i) {
                <mat-icon class="!text-xs text-amber-400">{{ i <= product.rating ? 'star' : 'star_border' }}</mat-icon>
              }
            </div>
            <span class="text-xs text-text-muted">({{ product.reviewCount }})</span>
          </div>
        }

        <!-- Price row -->
        <div class="flex items-center justify-between gap-2 mt-auto">
          <div class="flex items-baseline gap-1.5 flex-wrap">
            <span class="font-bold text-text-primary">
              {{ effectivePrice | currencyInr }}
            </span>
            @if (product.salePrice) {
              <span class="text-xs text-text-muted line-through">
                {{ product.basePrice | currencyInr }}
              </span>
            }
          </div>

          <button
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                   bg-primary-600 hover:bg-primary-700 text-white transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
            [disabled]="isOutOfStock"
            (click)="addToCart($event)"
            aria-label="Add to cart"
          >
            <mat-icon class="!text-base">add_shopping_cart</mat-icon>
          </button>
        </div>

        <!-- Low stock -->
        @if (isLowStock) {
          <p class="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
            <mat-icon class="!text-xs">warning</mat-icon>
            Only a few left
          </p>
        }
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  readonly productSvc = inject(ProductService);
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

  toggleWishlist(e: Event): void {
    e.preventDefault();
    this.wishlisted.update(v => !v);
    this.#toast.success(
      this.wishlisted() ? 'Added to wishlist' : 'Removed from wishlist',
    );
  }

  addToCart(e: Event): void {
    e.preventDefault();
    this.#toast.success('Added to cart', this.product.name);
    // Cart service integration in Phase 5
  }
}

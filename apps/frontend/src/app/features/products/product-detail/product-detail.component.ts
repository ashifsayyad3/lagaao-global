import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ProductService, Product, ProductVariant } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { LazyImgDirective } from '../../../shared/directives/lazy-img.directive';

@Component({
  selector: 'lg-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule,
    ProductCardComponent, SkeletonComponent, BadgeComponent, ButtonComponent,
    CurrencyInrPipe, LazyImgDirective,
  ],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 md:px-6 py-8">

      @if (loading()) {
        <!-- Skeleton -->
        <div class="grid lg:grid-cols-2 gap-10">
          <lg-skeleton height="480px" borderRadius="1rem"></lg-skeleton>
          <div class="space-y-4">
            <lg-skeleton height="2rem" width="70%"></lg-skeleton>
            <lg-skeleton height="1rem" width="40%"></lg-skeleton>
            <lg-skeleton height="2rem" width="30%"></lg-skeleton>
            <lg-skeleton height="4rem"></lg-skeleton>
            <lg-skeleton height="3rem" borderRadius="0.75rem"></lg-skeleton>
          </div>
        </div>

      } @else if (!product()) {
        <div class="flex flex-col items-center py-20 text-center">
          <mat-icon class="!text-6xl text-text-muted mb-4">inventory_2</mat-icon>
          <h2 class="font-display text-2xl font-bold text-text-primary mb-2">Product not found</h2>
          <a routerLink="/products" class="text-primary-600 hover:underline mt-4">Browse all products</a>
        </div>

      } @else {
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-text-muted mb-6">
          <a routerLink="/" class="hover:text-text-primary">Home</a>
          <mat-icon class="!text-base">chevron_right</mat-icon>
          <a routerLink="/products" class="hover:text-text-primary">Products</a>
          @if (product()!.category) {
            <mat-icon class="!text-base">chevron_right</mat-icon>
            <a [routerLink]="['/products']" [queryParams]="{ category: product()!.category.slug }"
               class="hover:text-text-primary">{{ product()!.category.name }}</a>
          }
          <mat-icon class="!text-base">chevron_right</mat-icon>
          <span class="text-text-primary truncate max-w-[200px]">{{ product()!.name }}</span>
        </nav>

        <div class="grid lg:grid-cols-2 gap-10 lg:gap-16">

          <!-- Image gallery -->
          <div class="space-y-3">
            <div class="rounded-2xl overflow-hidden bg-surface-50 aspect-square">
              <img
                [lgLazy]="activeImage()"
                [alt]="product()!.name"
                class="w-full h-full object-contain p-4"
              />
            </div>
            @if ((product()!.images?.length ?? 0) > 1) {
              <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                @for (img of product()!.images; track img.id) {
                  <button
                    class="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors"
                    [class.border-primary-500]="activeImageUrl() === img.url"
                    [class.border-transparent]="activeImageUrl() !== img.url"
                    (click)="activeImageUrl.set(img.url)"
                  >
                    <img [src]="img.url" [alt]="img.alt ?? product()!.name" class="w-full h-full object-cover" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Product info -->
          <div class="space-y-5">
            @if (product()!.brand) {
              <p class="text-sm text-text-muted uppercase tracking-widest font-semibold">
                {{ product()!.brand!.name }}
              </p>
            }

            <h1 class="font-display text-2xl md:text-3xl font-bold text-text-primary leading-tight">
              {{ product()!.name }}
            </h1>

            <!-- Rating -->
            @if (product()!.reviewCount > 0) {
              <div class="flex items-center gap-2">
                <div class="flex">
                  @for (i of [1,2,3,4,5]; track i) {
                    <mat-icon class="!text-base text-amber-400">
                      {{ i <= product()!.rating ? 'star' : 'star_border' }}
                    </mat-icon>
                  }
                </div>
                <span class="text-sm text-text-secondary">{{ product()!.rating }} ({{ product()!.reviewCount }} reviews)</span>
              </div>
            }

            <!-- Price -->
            <div class="flex items-baseline gap-3">
              <span class="font-display text-3xl font-bold text-text-primary">
                {{ effectivePrice() | currencyInr }}
              </span>
              @if (product()!.salePrice) {
                <span class="text-lg text-text-muted line-through">
                  {{ product()!.basePrice | currencyInr }}
                </span>
                <lg-badge variant="error">{{ discountPct() }}% OFF</lg-badge>
              }
            </div>
            <p class="text-xs text-text-muted">Inclusive of all taxes</p>

            <!-- Variant selector -->
            @if (product()!.hasVariants && (product()!.variants?.length ?? 0) > 0) {
              @for (attrKey of variantAttributes(); track attrKey) {
                <div>
                  <p class="text-sm font-semibold text-text-primary mb-2 capitalize">
                    {{ attrKey }}:
                    <span class="font-normal text-text-secondary">{{ selectedVariant()?.attributes?.[attrKey] }}</span>
                  </p>
                  <div class="flex flex-wrap gap-2">
                    @for (val of variantValues(attrKey); track val) {
                      <button
                        class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-all"
                        [class.border-primary-500]="selectedVariant()?.attributes?.[attrKey] === val"
                        [class.bg-primary-50]="selectedVariant()?.attributes?.[attrKey] === val"
                        [class.text-primary-700]="selectedVariant()?.attributes?.[attrKey] === val"
                        [class.border-border-default]="selectedVariant()?.attributes?.[attrKey] !== val"
                        [class.text-text-secondary]="selectedVariant()?.attributes?.[attrKey] !== val"
                        (click)="selectVariantByAttr(attrKey, val)"
                      >{{ val }}</button>
                    }
                  </div>
                </div>
              }
            }

            <!-- Qty -->
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-text-primary">Quantity:</span>
              <div class="flex items-center border border-border-default rounded-xl overflow-hidden">
                <button class="px-3 py-2 hover:bg-surface-100 transition-colors"
                        (click)="decrementQty()">
                  <mat-icon class="!text-base">remove</mat-icon>
                </button>
                <span class="px-4 py-2 text-sm font-semibold min-w-[2.5rem] text-center">{{ qty() }}</span>
                <button class="px-3 py-2 hover:bg-surface-100 transition-colors"
                        (click)="qty.update(q => q + 1)">
                  <mat-icon class="!text-base">add</mat-icon>
                </button>
              </div>

              @if (stockStatus() === 'in_stock') {
                <lg-badge variant="success">In Stock</lg-badge>
              } @else if (stockStatus() === 'low') {
                <lg-badge variant="warning">Low Stock</lg-badge>
              } @else {
                <lg-badge variant="error">Out of Stock</lg-badge>
              }
            </div>

            <!-- CTA Buttons -->
            <div class="flex gap-3 pt-2">
              <lg-button
                variant="primary" size="lg" [fullWidth]="true"
                prefixIcon="add_shopping_cart"
                [disabled]="stockStatus() === 'out_of_stock'"
                (click)="addToCart()"
              >
                Add to Cart
              </lg-button>
              <lg-button
                variant="accent" size="lg" [fullWidth]="true"
                prefixIcon="bolt"
                [disabled]="stockStatus() === 'out_of_stock'"
                (click)="buyNow()"
              >
                Buy Now
              </lg-button>
            </div>

            <!-- Trust badges -->
            <div class="grid grid-cols-2 gap-3 pt-2">
              @for (badge of trustBadges; track badge.icon) {
                <div class="flex items-center gap-2 text-sm text-text-secondary">
                  <mat-icon class="!text-base text-green-500">{{ badge.icon }}</mat-icon>
                  {{ badge.label }}
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Description -->
        @if (product()!.description) {
          <div class="mt-12 pt-8 border-t border-border-default">
            <h2 class="font-display text-xl font-bold text-text-primary mb-4">Product Description</h2>
            <div class="prose dark:prose-invert max-w-none text-text-secondary leading-relaxed"
                 [innerHTML]="product()!.description">
            </div>
          </div>
        }

        <!-- Related Products -->
        @if (related().length > 0) {
          <div class="mt-12 pt-8 border-t border-border-default">
            <h2 class="font-display text-xl font-bold text-text-primary mb-6">Related Products</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              @for (p of related(); track p.id) {
                <lg-product-card [product]="p"></lg-product-card>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  readonly #route      = inject(ActivatedRoute);
  readonly productSvc  = inject(ProductService);
  readonly #toast      = inject(ToastService);

  readonly product         = signal<Product | null>(null);
  readonly related         = signal<Product[]>([]);
  readonly loading         = signal(true);
  readonly activeImageUrl  = signal<string>('');
  readonly selectedVariant = signal<ProductVariant | null>(null);
  readonly qty             = signal(1);

  readonly activeImage = computed(() =>
    this.activeImageUrl() || this.productSvc.getPrimaryImage(this.product()!),
  );

  readonly effectivePrice = computed(() => {
    const v = this.selectedVariant();
    if (v) return v.salePrice ?? v.price;
    const p = this.product();
    return p ? this.productSvc.getEffectivePrice(p) : 0;
  });

  readonly discountPct = computed(() => {
    const p = this.product();
    return p ? this.productSvc.getDiscountPct(p) : 0;
  });

  readonly variantAttributes = computed((): string[] => {
    const variants = this.product()?.variants ?? [];
    const keys = new Set<string>();
    variants.forEach(v => Object.keys(v.attributes ?? {}).forEach(k => keys.add(k)));
    return Array.from(keys);
  });

  readonly stockStatus = computed((): 'in_stock' | 'low' | 'out_of_stock' => {
    const v = this.selectedVariant();
    if (!v?.inventory) return 'in_stock';
    if (v.inventory.isOutOfStock) return 'out_of_stock';
    if (v.inventory.isLowStock)   return 'low';
    return 'in_stock';
  });

  readonly trustBadges = [
    { icon: 'verified',        label: 'Genuine Product' },
    { icon: 'local_shipping',  label: 'Free Delivery' },
    { icon: 'replay',          label: '10-Day Returns' },
    { icon: 'support_agent',   label: '24/7 Support' },
  ];

  ngOnInit(): void {
    this.#route.params.subscribe(params => {
      this.loading.set(true);
      this.productSvc.getProduct(params['slug']).subscribe({
        next: res => {
          this.product.set(res.data);
          this.activeImageUrl.set(this.productSvc.getPrimaryImage(res.data));
          if (res.data.variants?.length) this.selectedVariant.set(res.data.variants[0]);
          this.loading.set(false);

          // Load related
          this.productSvc.getRelated(res.data.id).subscribe({
            next: r => this.related.set(r.data),
          });
        },
        error: () => this.loading.set(false),
      });
    });
  }

  variantValues(attrKey: string): string[] {
    const vals = new Set<string>();
    this.product()?.variants?.forEach(v => {
      const val = v.attributes?.[attrKey];
      if (val) vals.add(val);
    });
    return Array.from(vals);
  }

  selectVariantByAttr(key: string, value: string): void {
    const current = this.selectedVariant();
    const match = this.product()?.variants?.find(v => {
      const attrs = { ...current?.attributes, [key]: value };
      return Object.entries(attrs).every(([k, v2]) => v.attributes?.[k] === v2);
    }) ?? this.product()?.variants?.find(v => v.attributes?.[key] === value);
    if (match) this.selectedVariant.set(match);
  }

  decrementQty(): void { this.qty.update(q => q > 1 ? q - 1 : 1); }

  addToCart(): void {
    this.#toast.success('Added to cart', this.product()!.name);
    // Phase 5: cart integration
  }

  buyNow(): void {
    this.#toast.info('Checkout', 'Redirecting to checkout...');
    // Phase 5: checkout integration
  }
}

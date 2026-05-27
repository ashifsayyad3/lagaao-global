import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ProductService, Product, ProductVariant } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { LazyImgDirective } from '../../../shared/directives/lazy-img.directive';
import { AiService, AiProduct } from '../../../core/services/ai.service';
import { ProductCarouselComponent } from '../../../shared/components/product-carousel/product-carousel.component';
import { SeoService } from '../../../core/services/seo.service';
import { ReviewListComponent } from '../../../shared/components/review-list/review-list.component';

@Component({
  selector: 'lg-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule, TitleCasePipe,
    ProductCardComponent, SkeletonComponent,
    CurrencyInrPipe, LazyImgDirective, ProductCarouselComponent,
    ReviewListComponent,
  ],
  styles: [`
    :host { display: block; }

    /* ── Page layout ──────────────────────────────── */
    .page { max-width: 1280px; margin: 0 auto; padding: 24px 24px 80px; }

    /* ── Breadcrumb ───────────────────────────────── */
    .breadcrumb {
      display: flex; align-items: center; gap: 4px;
      font-size: .8125rem; color: var(--text-muted); margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .breadcrumb a { color: var(--text-muted); text-decoration: none; transition: color 150ms; }
    .breadcrumb a:hover { color: var(--color-primary); }
    .breadcrumb .cur { color: var(--text-primary); font-weight: 500; }

    /* ── Main grid ────────────────────────────────── */
    .pdp-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
    }
    @media (min-width: 1024px) {
      .pdp-grid { grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
    }

    /* ── Image gallery ────────────────────────────── */
    .gallery { display: flex; flex-direction: column; gap: 12px; }

    .main-img {
      border-radius: 20px;
      overflow: hidden;
      background: var(--bg-subtle);
      aspect-ratio: 1;
      position: relative;
    }
    .main-img img {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 400ms ease;
    }
    .main-img:hover img { transform: scale(1.04); }

    .zoom-hint {
      position: absolute; bottom: 12px; right: 12px;
      background: rgba(255,255,255,.85);
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
      pointer-events: none;
    }

    .thumb-strip {
      display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
    }
    .thumb-strip::-webkit-scrollbar { height: 4px; }
    .thumb-strip::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

    .thumb-btn {
      flex-shrink: 0;
      width: 68px; height: 68px;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid transparent;
      cursor: pointer;
      transition: border-color 150ms;
      background: var(--bg-subtle);
      padding: 0;
    }
    .thumb-btn.active { border-color: var(--color-primary); }
    .thumb-btn img { width: 100%; height: 100%; object-fit: cover; }

    /* ── Sticky panel ─────────────────────────────── */
    .info-panel { display: flex; flex-direction: column; gap: 20px; }
    @media (min-width: 1024px) {
      .info-panel { position: sticky; top: 88px; }
    }

    /* ── Brand tag ────────────────────────────────── */
    .brand-tag {
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--color-sage);
    }

    /* ── Product name ─────────────────────────────── */
    .product-name {
      font-family: var(--font-display);
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.2;
      margin: 0;
    }

    /* ── Rating row ───────────────────────────────── */
    .rating-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .stars { display: flex; gap: 1px; }
    .star { font-size: 16px; width: 16px; height: 16px; color: #f59e0b; }
    .star-empty { color: var(--border-strong); }
    .review-text { font-size: .8125rem; color: var(--text-muted); }

    /* ── Plant info pills ─────────────────────────── */
    .info-pills { display: flex; flex-wrap: wrap; gap: 8px; }
    .info-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-default);
      border-radius: 9999px;
      font-size: .75rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .info-pill mat-icon { font-size: 14px; width: 14px; height: 14px; color: var(--color-primary); }

    /* ── Price block ──────────────────────────────── */
    .price-block { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
    .price-main  { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--text-primary); }
    .price-mrp   { font-size: 1.125rem; color: var(--text-muted); text-decoration: line-through; }
    .price-badge {
      display: inline-flex; align-items: center;
      background: var(--color-accent); color: #fff;
      font-size: .75rem; font-weight: 700;
      padding: 3px 10px; border-radius: 9999px;
    }
    .tax-note { font-size: .75rem; color: var(--text-muted); }

    /* ── Stock badge ──────────────────────────────── */
    .stock-in  { color: var(--color-primary); }
    .stock-low { color: var(--color-warning); }
    .stock-out { color: var(--color-error); }
    .stock-chip {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: .8125rem; font-weight: 600;
    }

    /* ── Variant selector ─────────────────────────── */
    .variant-label {
      font-size: .8125rem; font-weight: 600;
      color: var(--text-primary); margin-bottom: 8px;
    }
    .variant-label span { font-weight: 400; color: var(--text-secondary); margin-left: 4px; }
    .variant-btns { display: flex; flex-wrap: wrap; gap: 8px; }
    .variant-btn {
      padding: 7px 16px;
      border-radius: 9px;
      border: 1.5px solid var(--border-default);
      background: #fff;
      font-family: var(--font-sans);
      font-size: .8125rem; font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: border-color 150ms, color 150ms, background 150ms;
    }
    .variant-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .variant-btn.active {
      border-color: var(--color-primary);
      background: var(--color-primary-50);
      color: var(--color-primary-dark);
      font-weight: 600;
    }

    /* ── Qty stepper ──────────────────────────────── */
    .qty-wrap { display: flex; align-items: center; gap: 14px; }
    .qty-label { font-size: .8125rem; font-weight: 600; color: var(--text-primary); }
    .qty-stepper {
      display: flex; align-items: center;
      border: 1.5px solid var(--border-default);
      border-radius: 12px; overflow: hidden;
      background: #fff;
    }
    .qty-btn {
      width: 38px; height: 40px;
      border: none; background: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary);
      transition: background 150ms;
    }
    .qty-btn:hover { background: var(--bg-subtle); }
    .qty-btn:disabled { opacity: .35; cursor: not-allowed; }
    .qty-val {
      min-width: 40px; text-align: center;
      font-weight: 700; font-size: .9375rem;
      color: var(--text-primary);
      border-left: 1.5px solid var(--border-default);
      border-right: 1.5px solid var(--border-default);
      line-height: 40px;
    }

    /* ── CTA buttons ──────────────────────────────── */
    .cta-row { display: flex; gap: 10px; }
    .btn-cart {
      flex: 1;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      height: 50px;
      border: 1.5px solid var(--color-primary);
      border-radius: 14px;
      background: #fff;
      font-family: var(--font-sans);
      font-size: .9375rem; font-weight: 700;
      color: var(--color-primary);
      cursor: pointer;
      transition: background 150ms, color 150ms;
    }
    .btn-cart:hover { background: var(--color-primary-50); }
    .btn-cart:disabled { opacity: .4; cursor: not-allowed; }

    .btn-buy {
      flex: 1;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      height: 50px;
      border: none;
      border-radius: 14px;
      background: var(--color-primary);
      font-family: var(--font-sans);
      font-size: .9375rem; font-weight: 700;
      color: #fff;
      cursor: pointer;
      transition: background 150ms, transform 150ms, box-shadow 150ms;
    }
    .btn-buy:hover { background: var(--color-primary-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(61,107,69,.3); }
    .btn-buy:active { transform: none; }
    .btn-buy:disabled { opacity: .4; cursor: not-allowed; transform: none; box-shadow: none; }

    /* ── Trust strip ──────────────────────────────── */
    .trust-strip {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
      background: var(--bg-subtle);
      border: 1px solid var(--border-default);
      border-radius: 14px;
      padding: 14px;
    }
    .trust-item { display: flex; align-items: center; gap: 8px; }
    .trust-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); }
    .trust-text { font-size: .8125rem; color: var(--text-secondary); font-weight: 500; }

    /* ── Section divider ──────────────────────────── */
    .section { margin-top: 56px; padding-top: 40px; border-top: 1px solid var(--border-default); }
    .section-heading {
      font-family: var(--font-display);
      font-size: 1.5rem; font-weight: 600;
      color: var(--text-primary); margin: 0 0 24px;
    }

    /* ── Care guide grid ──────────────────────────── */
    .care-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (min-width: 640px) { .care-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1024px) { .care-grid { grid-template-columns: repeat(6, 1fr); } }

    .care-card {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 20px 12px;
      background: #fff;
      border: 1px solid var(--border-default);
      border-radius: 16px;
      text-align: center;
    }
    .care-emoji { font-size: 1.75rem; line-height: 1; }
    .care-label { font-size: .6875rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--text-muted); }
    .care-value { font-size: .875rem; font-weight: 600; color: var(--text-primary); }

    /* ── Description prose ────────────────────────── */
    .description {
      font-size: .9375rem; line-height: 1.8;
      color: var(--text-secondary);
    }
    .description p { margin: 0 0 14px; }
    .description strong { color: var(--text-primary); }
    .description ul { padding-left: 20px; margin: 0 0 14px; }
    .description li { margin-bottom: 6px; }

    /* ── FAQ accordion ────────────────────────────── */
    .faq-item {
      border: 1px solid var(--border-default);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .faq-btn {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      padding: 16px 18px;
      background: none; border: none; cursor: pointer;
      font-family: var(--font-sans); font-size: .9375rem; font-weight: 600;
      color: var(--text-primary); text-align: left;
      transition: background 150ms;
    }
    .faq-btn:hover { background: var(--bg-subtle); }
    .faq-body {
      padding: 0 18px 16px;
      font-size: .875rem; line-height: 1.7;
      color: var(--text-secondary);
    }

    /* ── Not found ────────────────────────────────── */
    .not-found {
      display: flex; flex-direction: column; align-items: center;
      padding: 80px 0; text-align: center;
    }
    .not-found h2 {
      font-family: var(--font-display);
      font-size: 1.5rem; font-weight: 600;
      color: var(--text-primary); margin: 16px 0 8px;
    }

    /* ── Related grid ─────────────────────────────── */
    .related-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (min-width: 640px) { .related-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1024px) { .related-grid { grid-template-columns: repeat(4, 1fr); } }
  `],
  template: `
    <div class="page">

      @if (loading()) {
        <!-- Skeleton -->
        <div class="pdp-grid">
          <lg-skeleton height="480px" borderRadius="20px"></lg-skeleton>
          <div style="display:flex;flex-direction:column;gap:16px">
            <lg-skeleton height="1.5rem" width="40%"></lg-skeleton>
            <lg-skeleton height="2.5rem" width="80%"></lg-skeleton>
            <lg-skeleton height="1rem" width="60%"></lg-skeleton>
            <lg-skeleton height="2.5rem" width="35%"></lg-skeleton>
            <lg-skeleton height="50px" borderRadius="14px"></lg-skeleton>
          </div>
        </div>

      } @else if (!product()) {
        <div class="not-found">
          <mat-icon style="font-size:56px;width:56px;height:56px;color:var(--color-sage)">eco</mat-icon>
          <h2>Plant not found</h2>
          <p style="color:var(--text-muted);margin:0 0 20px">This product may no longer be available.</p>
          <a routerLink="/products" style="color:var(--color-primary);font-weight:600;text-decoration:none">
            Browse all plants →
          </a>
        </div>

      } @else {
        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a routerLink="/">Home</a>
          <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
          <a routerLink="/products">Plants & Seeds</a>
          @if (product()!.category) {
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
            <a [routerLink]="['/products']" [queryParams]="{ category: product()!.category.slug }">
              {{ product()!.category.name }}
            </a>
          }
          <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
          <span class="cur" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            {{ product()!.name }}
          </span>
        </nav>

        <div class="pdp-grid">

          <!-- ── Left: Image gallery ───────────────── -->
          <div class="gallery">
            <div class="main-img">
              <img [lgLazy]="activeImage()" [alt]="product()!.name" />
              <div class="zoom-hint">
                <mat-icon style="font-size:12px;width:12px;height:12px">zoom_in</mat-icon>
                Hover to zoom
              </div>
            </div>

            @if ((product()!.images?.length ?? 0) > 1) {
              <div class="thumb-strip">
                @for (img of product()!.images; track img.id) {
                  <button class="thumb-btn" [class.active]="activeImageUrl() === img.url"
                          (click)="activeImageUrl.set(img.url)">
                    <img [src]="img.url" [alt]="img.alt ?? product()!.name" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- ── Right: Product info ───────────────── -->
          <div class="info-panel">

            @if (product()!.brand) {
              <p class="brand-tag">{{ product()!.brand!.name }}</p>
            }

            <h1 class="product-name">{{ product()!.name }}</h1>

            <!-- Rating -->
            @if (product()!.reviewCount > 0) {
              <div class="rating-row">
                <div class="stars">
                  @for (i of [1,2,3,4,5]; track i) {
                    <mat-icon class="star" [class.star-empty]="i > product()!.rating"
                              style="font-size:16px;width:16px;height:16px">
                      {{ i <= product()!.rating ? 'star' : 'star_border' }}
                    </mat-icon>
                  }
                </div>
                <span class="review-text">{{ product()!.rating }} · {{ product()!.reviewCount }} reviews</span>
              </div>
            }

            <!-- Plant info pills -->
            <div class="info-pills">
              <span class="info-pill">
                <mat-icon>wb_sunny</mat-icon> Bright Indirect
              </span>
              <span class="info-pill">
                <mat-icon>water_drop</mat-icon> Weekly Watering
              </span>
              <span class="info-pill">
                <mat-icon>eco</mat-icon> Air Purifying
              </span>
              <span class="info-pill">
                <mat-icon>local_shipping</mat-icon> Ships with Pot
              </span>
            </div>

            <!-- Price -->
            <div>
              <div class="price-block">
                <span class="price-main">{{ effectivePrice() | currencyInr }}</span>
                @if (product()!.salePrice) {
                  <span class="price-mrp">{{ product()!.basePrice | currencyInr }}</span>
                  <span class="price-badge">{{ discountPct() }}% OFF</span>
                }
              </div>
              <p class="tax-note" style="margin-top:4px">Inclusive of all taxes · Free delivery above ₹499</p>
            </div>

            <!-- Stock status -->
            <div class="stock-chip" [class]="'stock-chip ' + stockStatusClass()">
              <mat-icon style="font-size:15px;width:15px;height:15px">
                {{ stockStatus() === 'out_of_stock' ? 'cancel' : stockStatus() === 'low' ? 'warning' : 'check_circle' }}
              </mat-icon>
              {{ stockStatus() === 'out_of_stock' ? 'Out of Stock' : stockStatus() === 'low' ? 'Only a few left — order soon!' : 'In Stock · Ready to ship' }}
            </div>

            <!-- Variant selector -->
            @if (product()!.hasVariants && (product()!.variants?.length ?? 0) > 0) {
              @for (attrKey of variantAttributes(); track attrKey) {
                <div>
                  <p class="variant-label">
                    {{ attrKey | titlecase }}:
                    <span>{{ selectedVariant()?.attributes?.[attrKey] }}</span>
                  </p>
                  <div class="variant-btns">
                    @for (val of variantValues(attrKey); track val) {
                      <button class="variant-btn"
                              [class.active]="selectedVariant()?.attributes?.[attrKey] === val"
                              (click)="selectVariantByAttr(attrKey, val)">
                        {{ val }}
                      </button>
                    }
                  </div>
                </div>
              }
            }

            <!-- Qty stepper -->
            <div class="qty-wrap">
              <span class="qty-label">Qty</span>
              <div class="qty-stepper">
                <button class="qty-btn" [disabled]="qty() <= 1" (click)="decrementQty()">
                  <mat-icon style="font-size:18px;width:18px;height:18px">remove</mat-icon>
                </button>
                <span class="qty-val">{{ qty() }}</span>
                <button class="qty-btn" (click)="qty.update(q => q + 1)">
                  <mat-icon style="font-size:18px;width:18px;height:18px">add</mat-icon>
                </button>
              </div>
            </div>

            <!-- CTA buttons -->
            <div class="cta-row">
              <button class="btn-cart" [disabled]="stockStatus() === 'out_of_stock'" (click)="addToCart()">
                <mat-icon style="font-size:20px;width:20px;height:20px">add_shopping_cart</mat-icon>
                Add to Cart
              </button>
              <button class="btn-buy" [disabled]="stockStatus() === 'out_of_stock'" (click)="buyNow()">
                <mat-icon style="font-size:20px;width:20px;height:20px">bolt</mat-icon>
                Buy Now
              </button>
            </div>

            <!-- Trust strip -->
            <div class="trust-strip">
              @for (badge of trustBadges; track badge.icon) {
                <div class="trust-item">
                  <mat-icon class="trust-icon">{{ badge.icon }}</mat-icon>
                  <span class="trust-text">{{ badge.label }}</span>
                </div>
              }
            </div>

          </div><!-- /info-panel -->
        </div><!-- /pdp-grid -->

        <!-- ── Care Guide ──────────────────────────── -->
        <div class="section">
          <h2 class="section-heading">🌱 Plant Care Guide</h2>
          <div class="care-grid">
            @for (care of careGuide; track care.label) {
              <div class="care-card">
                <span class="care-emoji">{{ care.emoji }}</span>
                <span class="care-label">{{ care.label }}</span>
                <span class="care-value">{{ care.value }}</span>
              </div>
            }
          </div>
        </div>

        <!-- ── Description ─────────────────────────── -->
        @if (product()!.description) {
          <div class="section">
            <h2 class="section-heading">About This Plant</h2>
            <div class="description" [innerHTML]="product()!.description"></div>
          </div>
        }

        <!-- ── FAQ ────────────────────────────────────── -->
        <div class="section">
          <h2 class="section-heading">Frequently Asked Questions</h2>
          @for (faq of faqs; track faq.q; let i = $index) {
            <div class="faq-item">
              <button class="faq-btn" (click)="toggleFaq(i)">
                {{ faq.q }}
                <mat-icon style="font-size:18px;width:18px;height:18px;flex-shrink:0;
                                 transition:transform 200ms"
                          [style.transform]="openFaq() === i ? 'rotate(180deg)' : 'none'">
                  expand_more
                </mat-icon>
              </button>
              @if (openFaq() === i) {
                <div class="faq-body">{{ faq.a }}</div>
              }
            </div>
          }
        </div>

        <!-- ── Reviews ─────────────────────────────── -->
        @if (product()?.id) {
          <div class="section">
            <lg-review-list [productId]="product()!.id" />
          </div>
        }

        <!-- ── Related products ─────────────────────── -->
        @if (related().length > 0) {
          <div class="section">
            <h2 class="section-heading">You May Also Like</h2>
            <div class="related-grid">
              @for (p of related(); track p.id) {
                <lg-product-card [product]="p"></lg-product-card>
              }
            </div>
          </div>
        }

        <!-- ── Also bought carousel ─────────────────── -->
        @if (alsoBought().length > 0) {
          <div class="section" style="padding-top:0;border-top:none">
            <lg-product-carousel title="Customers Also Bought" [products]="alsoBought()"></lg-product-carousel>
          </div>
        }

      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  readonly #route      = inject(ActivatedRoute);
  readonly #router     = inject(Router);
  readonly productSvc  = inject(ProductService);
  readonly #cartSvc    = inject(CartService);
  readonly #toast      = inject(ToastService);
  readonly #seo        = inject(SeoService);
  readonly #ai         = inject(AiService);

  readonly product         = signal<Product | null>(null);
  readonly related         = signal<Product[]>([]);
  readonly alsoBought      = signal<AiProduct[]>([]);
  readonly loading         = signal(true);
  readonly activeImageUrl  = signal<string>('');
  readonly selectedVariant = signal<ProductVariant | null>(null);
  readonly qty             = signal(1);
  readonly openFaq         = signal<number | null>(null);

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

  readonly stockStatusClass = computed(() => {
    const s = this.stockStatus();
    if (s === 'out_of_stock') return 'stock-out';
    if (s === 'low') return 'stock-low';
    return 'stock-in';
  });

  readonly trustBadges = [
    { icon: 'verified',       label: 'Genuine Plants' },
    { icon: 'local_shipping', label: 'Free Delivery' },
    { icon: 'replay',         label: '7-Day Returns' },
    { icon: 'support_agent',  label: 'Expert Support' },
  ];

  readonly careGuide = [
    { emoji: '☀️', label: 'Sunlight',     value: 'Bright Indirect' },
    { emoji: '💧', label: 'Water',        value: 'Every 7 Days' },
    { emoji: '🌡️', label: 'Temperature', value: '18–30°C' },
    { emoji: '💨', label: 'Humidity',     value: 'Medium' },
    { emoji: '🌱', label: 'Difficulty',   value: 'Easy' },
    { emoji: '📏', label: 'Mature Size',  value: '1–2 ft' },
  ];

  readonly faqs = [
    {
      q: 'Will the plant look exactly like in the photo?',
      a: 'Plants are natural products and may vary slightly in size, colour, and shape. The photo is representative of the variety you will receive. We take care to send healthy, thriving specimens.',
    },
    {
      q: 'How is the plant packaged for delivery?',
      a: 'Each plant is carefully packed in our specially designed eco-friendly packaging with breathable holes, moisture-retaining paper, and secure support to prevent movement during transit.',
    },
    {
      q: 'What if my plant arrives damaged?',
      a: 'We offer a 7-day plant guarantee. If your plant arrives damaged or in poor health, take a photo within 24 hours of delivery and contact us — we will replace it free of charge.',
    },
    {
      q: 'Do you ship the plant with or without the pot?',
      a: 'All plants are shipped with a nursery grow pot. The decorative pot shown in some images is for illustration purposes and is sold separately.',
    },
    {
      q: 'How do I care for the plant after delivery?',
      a: 'Let the plant rest for 2–3 days after arrival before repotting. Water lightly and place in bright indirect light. Avoid direct afternoon sun for the first week while the plant acclimatises.',
    },
  ];

  ngOnInit(): void {
    this.#route.params.subscribe(params => {
      this.loading.set(true);
      this.qty.set(1);
      this.openFaq.set(null);
      this.productSvc.getProduct(params['slug']).subscribe({
        next: res => {
          this.product.set(res.data);
          this.activeImageUrl.set(this.productSvc.getPrimaryImage(res.data));
          if (res.data.variants?.length) this.selectedVariant.set(res.data.variants[0]);
          this.loading.set(false);

          // ── SEO ───────────────────────────────────────────────────────────
          const p = res.data;
          const img = this.productSvc.getPrimaryImage(p);
          const pageUrl = `https://lagaao.com/products/${p.slug}`;
          const effectivePrice = this.productSvc.getEffectivePrice(p);
          const inStock = p.variants?.length
            ? p.variants.some(v => (v as any).stock > 0)
            : true;
          this.#seo.setMeta({
            title:        p.name,
            description:  p.description?.substring(0, 160) ?? `Buy ${p.name} online at Lagaao`,
            canonical:    pageUrl,
            image:        img,
            type:         'product',
            price:        effectivePrice,
            currency:     'INR',
            availability: inStock ? 'InStock' : 'OutOfStock',
            keywords:     [p.name, p.category?.name ?? '', 'buy online', 'India'].filter(Boolean).join(', '),
          });
          this.#seo.setProductSchema({
            id:           p.id,
            name:         p.name,
            description:  p.description ?? `Buy ${p.name} at Lagaao`,
            image:        p.images?.map((i: any) => i.url ?? i) ?? img,
            price:        p.basePrice,
            salePrice:    p.salePrice ?? null,
            currency:     'INR',
            sku:          String(p.id),
            brand:        p.brand?.name,
            availability: inStock ? 'InStock' : 'OutOfStock',
            rating:       p.rating,
            reviewCount:  p.reviewCount,
            category:     p.category?.name,
            url:          pageUrl,
          });
          this.#seo.setBreadcrumbSchema([
            { name: 'Home',     url: 'https://lagaao.com/' },
            { name: 'Products', url: 'https://lagaao.com/products' },
            ...(p.category ? [{ name: p.category.name, url: `https://lagaao.com/products?category=${p.category.slug ?? p.category.id}` }] : []),
            { name: p.name,     url: pageUrl },
          ]);
          // ── /SEO ──────────────────────────────────────────────────────────

          this.productSvc.getRelated(res.data.id).subscribe({
            next: r => this.related.set(r.data),
            error: () => {},
          });
          this.#ai.getAlsoBought(res.data.id).subscribe({
            next: r => this.alsoBought.set(r.data),
            error: () => {},
          });
          this.#ai.trackView(res.data.id).subscribe({ error: () => {} });
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
    const match =
      this.product()?.variants?.find(v => {
        const attrs = { ...current?.attributes, [key]: value };
        return Object.entries(attrs).every(([k, v2]) => v.attributes?.[k] === v2);
      }) ?? this.product()?.variants?.find(v => v.attributes?.[key] === value);
    if (match) this.selectedVariant.set(match);
  }

  decrementQty(): void { this.qty.update(q => Math.max(1, q - 1)); }

  toggleFaq(i: number): void {
    this.openFaq.update(cur => cur === i ? null : i);
  }

  addToCart(): void {
    const p = this.product()!;
    const variantId = this.selectedVariant()?.id ?? null;
    this.#cartSvc.addItem(p.id, variantId, this.qty()).subscribe({
      next: () => this.#toast.success('Added to cart', p.name),
      error: err => this.#toast.error('Error', err?.error?.message ?? 'Could not add to cart'),
    });
  }

  buyNow(): void {
    const p = this.product()!;
    const variantId = this.selectedVariant()?.id ?? null;
    this.#cartSvc.addItem(p.id, variantId, this.qty()).subscribe({
      next: () => this.#router.navigate(['/checkout']),
      error: err => this.#toast.error('Error', err?.error?.message ?? 'Could not add to cart'),
    });
  }
}

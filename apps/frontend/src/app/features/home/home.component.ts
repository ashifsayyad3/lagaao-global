import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SkeletonCardComponent } from '../../shared/components/skeleton/skeleton.component';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { NewsletterComponent } from '../../shared/components/newsletter/newsletter.component';
import { ProductCarouselComponent } from '../../shared/components/product-carousel/product-carousel.component';
import { CmsService, Banner } from '../../core/services/cms.service';
import { AiService, AiProduct } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'lg-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule,
    SkeletonCardComponent, CurrencyInrPipe,
    NewsletterComponent, ProductCarouselComponent,
  ],
  template: `

    <!-- ─── Hero / Banner Slider ──────────────────────────────── -->
    @if (heroBanners().length > 0) {
      <section class="relative overflow-hidden bg-[#F1F3F6]">
        <div class="flex transition-transform duration-500"
             [style.transform]="'translateX(-' + activeBanner() * 100 + '%)'">
          @for (banner of heroBanners(); track banner.id) {
            <div class="relative min-w-full h-[280px] md:h-[380px] flex-shrink-0 overflow-hidden"
                 [style.background-color]="banner.bgColor ?? '#2874F0'">
              @if (banner.image) {
                <img [src]="banner.image" [alt]="banner.title"
                     class="absolute inset-0 w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent"></div>
              }
              <div class="absolute inset-0 flex items-center px-8 md:px-16">
                <div class="max-w-md text-white">
                  <h2 class="font-display text-3xl md:text-4xl font-bold leading-tight mb-2">{{ banner.title }}</h2>
                  @if (banner.subtitle) {
                    <p class="text-white/80 text-base mb-4">{{ banner.subtitle }}</p>
                  }
                  @if (banner.link) {
                    <a [href]="banner.link"
                       class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FB641B] hover:bg-[#e0530d]
                              text-white font-bold text-sm rounded-sm transition-colors">
                      {{ banner.ctaLabel ?? 'Shop Now' }}
                      <mat-icon class="!text-sm">arrow_forward</mat-icon>
                    </a>
                  }
                </div>
              </div>
            </div>
          }
        </div>
        <!-- Chevrons -->
        @if (heroBanners().length > 1) {
          <button class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-16 bg-white/90 flex items-center
                         justify-center shadow hover:bg-white transition-colors"
                  (click)="prevBanner()">
            <mat-icon class="text-gray-700">chevron_left</mat-icon>
          </button>
          <button class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-16 bg-white/90 flex items-center
                         justify-center shadow hover:bg-white transition-colors"
                  (click)="nextBanner()">
            <mat-icon class="text-gray-700">chevron_right</mat-icon>
          </button>
          <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            @for (b of heroBanners(); track b.id; let i = $index) {
              <button class="h-1.5 rounded-full transition-all"
                      [class]="i === activeBanner() ? 'w-6 bg-white' : 'w-1.5 bg-white/50'"
                      (click)="activeBanner.set(i)"></button>
            }
          </div>
        }
      </section>
    } @else {
      <!-- Default hero -->
      <section class="bg-gradient-to-r from-[#2874F0] to-[#1254c4] py-8 md:py-14">
        <div class="max-w-screen-2xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 items-center">
          <div class="text-white">
            <div class="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold
                        px-3 py-1 rounded-full mb-4">
              <mat-icon class="!text-sm">auto_awesome</mat-icon>
              AI-Powered Shopping
            </div>
            <h1 class="font-display text-3xl md:text-5xl font-bold leading-tight mb-4">
              Shop Smarter.<br><span class="text-yellow-300">Save Bigger.</span>
            </h1>
            <p class="text-white/80 text-base mb-6 max-w-md">
              Millions of products. Genuine sellers. AI that finds exactly what you need.
            </p>
            <a routerLink="/products"
               class="inline-flex items-center gap-2 px-6 py-3 bg-[#FB641B] hover:bg-[#e0530d]
                      text-white font-bold text-sm rounded-sm transition-colors">
              Shop Now <mat-icon class="!text-sm">arrow_forward</mat-icon>
            </a>
            <div class="mt-8 flex flex-wrap gap-5 text-sm text-white/70">
              <span class="flex items-center gap-1"><mat-icon class="!text-base text-green-300">verified</mat-icon> 100% Genuine</span>
              <span class="flex items-center gap-1"><mat-icon class="!text-base text-green-300">local_shipping</mat-icon> Free Delivery</span>
              <span class="flex items-center gap-1"><mat-icon class="!text-base text-green-300">replay</mat-icon> Easy Returns</span>
              <span class="flex items-center gap-1"><mat-icon class="!text-base text-green-300">lock</mat-icon> Secure Pay</span>
            </div>
          </div>
          <div class="hidden md:flex justify-end">
            <div class="bg-white rounded-lg shadow-xl p-5 w-72">
              <img src="https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=280&fit=crop"
                   alt="Featured product" class="w-full h-44 object-cover rounded mb-3" />
              <p class="text-xs text-[#2874F0] font-semibold mb-1">SONY</p>
              <p class="text-sm font-bold text-[#212121] leading-snug">Sony WH-1000XM5 Headphones</p>
              <div class="flex items-center gap-1.5 mt-1.5">
                <span class="bg-[#388E3C] text-white text-xs font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                  4.5 <mat-icon class="!text-[10px]">star</mat-icon>
                </span>
                <span class="text-xs text-[#878787]">2.3k ratings</span>
              </div>
              <div class="flex items-baseline gap-2 mt-2">
                <span class="font-bold text-[#212121]">{{ 24990 | currencyInr }}</span>
                <span class="text-xs text-[#878787] line-through">{{ 29990 | currencyInr }}</span>
                <span class="text-xs text-[#388E3C] font-semibold">17% off</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    }

    <!-- ─── Category Tiles (Flipkart grid) ────────────────────── -->
    <section class="max-w-screen-2xl mx-auto px-2 md:px-6 mt-3">
      <div class="bg-white dark:bg-[#1e2a3a] shadow-fk-card">
        <div class="flex overflow-x-auto hide-scrollbar">
          @for (cat of categories; track cat.label) {
            <a [routerLink]="['/products']" [queryParams]="{ category: cat.slug }"
               class="flex flex-col items-center gap-2 px-4 py-4 flex-shrink-0 group
                      hover:text-primary-600 transition-colors min-w-[80px] md:min-w-[100px]
                      border-b-2 border-transparent hover:border-primary-500">
              <div class="w-14 h-14 rounded-full overflow-hidden bg-[#F1F3F6] flex items-center justify-center text-2xl
                          group-hover:shadow-md transition-shadow">
                {{ cat.emoji }}
              </div>
              <span class="text-xs font-medium text-[#212121] dark:text-gray-300 group-hover:text-primary-600
                           text-center leading-tight whitespace-nowrap">
                {{ cat.label }}
              </span>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- ─── Flash Sale / Deal Strip ───────────────────────────── -->
    <section class="max-w-screen-2xl mx-auto px-2 md:px-6 mt-3">
      <div class="bg-white dark:bg-[#1e2a3a] shadow-fk-card">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0]">
          <div class="flex items-center gap-3">
            <h2 class="font-display text-xl font-bold text-[#212121] dark:text-white">Deal of the Day</h2>
            <div class="flex items-center gap-1 text-[#FB641B] text-sm font-semibold">
              <mat-icon class="!text-base">timer</mat-icon>
              <span>Ends in </span>
              <span class="bg-[#212121] text-white text-xs font-mono px-1.5 py-0.5 rounded">{{ dealTimer() }}</span>
            </div>
          </div>
          <a routerLink="/products" class="text-primary-500 text-sm font-bold hover:text-primary-700 uppercase
                                           tracking-wide flex items-center gap-0.5">
            View All <mat-icon class="!text-base">chevron_right</mat-icon>
          </a>
        </div>

        <!-- Deal product grid (skeletons until loaded) -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 divide-x divide-y divide-[#F0F0F0]">
          @for (i of [1,2,3,4,5,6]; track i) {
            <lg-skeleton-card></lg-skeleton-card>
          }
        </div>
      </div>
    </section>

    <!-- ─── Mid Banners (2-col) ───────────────────────────────── -->
    @if (midBanners().length > 0) {
      <section class="max-w-screen-2xl mx-auto px-2 md:px-6 mt-3">
        <div class="grid sm:grid-cols-2 gap-3">
          @for (banner of midBanners().slice(0, 2); track banner.id) {
            <a [href]="banner.link ?? '#'"
               class="relative overflow-hidden h-36 md:h-44 flex items-end p-5 shadow-fk-card"
               [style.background-color]="banner.bgColor ?? '#2874F0'">
              @if (banner.image) {
                <img [src]="banner.image" [alt]="banner.title"
                     class="absolute inset-0 w-full h-full object-cover" />
                <div class="absolute inset-0 bg-black/30"></div>
              }
              <div class="relative z-10">
                <p class="font-bold text-white text-lg leading-tight">{{ banner.title }}</p>
                @if (banner.ctaLabel) {
                  <span class="text-xs text-white/80 mt-1 inline-block">{{ banner.ctaLabel }} →</span>
                }
              </div>
            </a>
          }
        </div>
      </section>
    } @else {
      <!-- Fallback promo strips -->
      <section class="max-w-screen-2xl mx-auto px-2 md:px-6 mt-3">
        <div class="grid sm:grid-cols-2 gap-3">
          <a routerLink="/products" [queryParams]="{ category: 'electronics' }"
             class="relative overflow-hidden h-36 rounded-none shadow-fk-card bg-gradient-to-r from-[#1254c4] to-[#2874F0]
                    flex items-center px-8 gap-6">
            <div class="text-white">
              <p class="text-xs font-semibold text-yellow-300 uppercase tracking-wider mb-1">Up to 60% off</p>
              <p class="font-display font-bold text-2xl leading-tight">Electronics<br>Superstore</p>
              <p class="text-white/70 text-xs mt-1">Shop from top brands</p>
            </div>
            <span class="text-6xl ml-auto">📱</span>
          </a>
          <a routerLink="/products" [queryParams]="{ category: 'fashion' }"
             class="relative overflow-hidden h-36 rounded-none shadow-fk-card bg-gradient-to-r from-[#F03A5F] to-[#FF6B6B]
                    flex items-center px-8 gap-6">
            <div class="text-white">
              <p class="text-xs font-semibold text-yellow-200 uppercase tracking-wider mb-1">Min 50% off</p>
              <p class="font-display font-bold text-2xl leading-tight">Fashion<br>Clearance</p>
              <p class="text-white/70 text-xs mt-1">Top brands, great deals</p>
            </div>
            <span class="text-6xl ml-auto">👗</span>
          </a>
        </div>
      </section>
    }

    <!-- ─── Best Sellers Section ──────────────────────────────── -->
    <section class="max-w-screen-2xl mx-auto px-2 md:px-6 mt-3">
      <div class="bg-white dark:bg-[#1e2a3a] shadow-fk-card">
        <div class="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0]">
          <h2 class="font-display text-xl font-bold text-[#212121] dark:text-white">Best Sellers</h2>
          <a routerLink="/products" class="text-primary-500 text-sm font-bold hover:text-primary-700 uppercase
                                           tracking-wide flex items-center gap-0.5">
            View All <mat-icon class="!text-base">chevron_right</mat-icon>
          </a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 divide-x divide-y divide-[#F0F0F0]">
          @for (i of [1,2,3,4,5,6]; track i) {
            <lg-skeleton-card></lg-skeleton-card>
          }
        </div>
      </div>
    </section>

    <!-- ─── AI Recommendations ────────────────────────────────── -->
    @if (forYou().length > 0) {
      <section class="max-w-screen-2xl mx-auto px-2 md:px-6 mt-3">
        <div class="bg-white dark:bg-[#1e2a3a] shadow-fk-card p-1">
          <lg-product-carousel title="Picked For You" [products]="forYou()" viewAllLink="/search"></lg-product-carousel>
        </div>
      </section>
    }
    @if (recentlyViewed().length > 0) {
      <section class="max-w-screen-2xl mx-auto px-2 md:px-6 mt-3">
        <div class="bg-white dark:bg-[#1e2a3a] shadow-fk-card p-1">
          <lg-product-carousel title="Recently Viewed" [products]="recentlyViewed()"></lg-product-carousel>
        </div>
      </section>
    }

    <!-- ─── AI Chat promo strip ───────────────────────────────── -->
    <section class="max-w-screen-2xl mx-auto px-2 md:px-6 mt-3">
      <div class="bg-gradient-to-r from-[#2874F0] to-[#6c63ff] text-white px-6 py-5 flex flex-col md:flex-row
                  items-center gap-5 shadow-fk-card">
        <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <mat-icon class="!text-2xl text-white">psychology</mat-icon>
        </div>
        <div class="flex-1 text-center md:text-left">
          <p class="font-display font-bold text-lg">Meet Your AI Shopping Assistant</p>
          <p class="text-white/75 text-sm mt-0.5">
            Describe what you want in plain words — our AI finds the perfect product instantly.
          </p>
        </div>
        <a routerLink="/search" [queryParams]="{ ai: '1' }"
           class="px-5 py-2.5 bg-white text-[#2874F0] font-bold text-sm rounded-sm hover:bg-gray-50 transition-colors whitespace-nowrap">
          Try AI Search
        </a>
      </div>
    </section>

    <!-- ─── Trust badges ──────────────────────────────────────── -->
    <section class="max-w-screen-2xl mx-auto px-2 md:px-6 mt-3 mb-6">
      <div class="bg-white dark:bg-[#1e2a3a] shadow-fk-card px-6 py-4
                  grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-[#F0F0F0]">
        @for (badge of trustBadges; track badge.title) {
          <div class="flex items-center gap-3 px-4 first:pl-0">
            <mat-icon class="!text-2xl text-[#2874F0]">{{ badge.icon }}</mat-icon>
            <div>
              <p class="text-xs font-bold text-[#212121] dark:text-white">{{ badge.title }}</p>
              <p class="text-[11px] text-[#878787]">{{ badge.desc }}</p>
            </div>
          </div>
        }
      </div>
    </section>

    <!-- Newsletter -->
    <section class="max-w-screen-2xl mx-auto px-2 md:px-6 mb-6">
      <lg-newsletter></lg-newsletter>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  readonly #cms  = inject(CmsService);
  readonly #ai   = inject(AiService);
  readonly #auth = inject(AuthService);

  heroBanners    = signal<Banner[]>([]);
  midBanners     = signal<Banner[]>([]);
  activeBanner   = signal(0);
  forYou         = signal<AiProduct[]>([]);
  recentlyViewed = signal<AiProduct[]>([]);
  dealTimer      = signal('04:23:17');

  readonly categories = [
    { label: 'Grocery',      emoji: '🛒',  slug: 'grocery' },
    { label: 'Mobiles',      emoji: '📱',  slug: 'smartphones' },
    { label: 'Fashion',      emoji: '👗',  slug: 'fashion' },
    { label: 'Electronics',  emoji: '💻',  slug: 'electronics' },
    { label: 'Home',         emoji: '🏠',  slug: 'home' },
    { label: 'Appliances',   emoji: '🧺',  slug: 'appliances' },
    { label: 'Travel',       emoji: '✈️',  slug: 'travel' },
    { label: 'Beauty',       emoji: '💄',  slug: 'beauty' },
    { label: 'Jewellery',    emoji: '💍',  slug: 'jewellery' },
    { label: 'Sports',       emoji: '⚽',  slug: 'sports' },
    { label: 'Books',        emoji: '📚',  slug: 'books' },
    { label: 'Toys',         emoji: '🧸',  slug: 'toys' },
  ];

  readonly trustBadges = [
    { icon: 'verified_user',  title: '100% Genuine',   desc: 'All products verified' },
    { icon: 'local_shipping', title: 'Free Delivery',  desc: 'On orders above ₹499' },
    { icon: 'replay',         title: '10-Day Returns', desc: 'Hassle-free returns' },
    { icon: 'support_agent',  title: '24/7 Support',   desc: 'Always here to help' },
  ];

  ngOnInit() {
    this.#cms.getBanners('hero').subscribe({ next: r => this.heroBanners.set(r.data), error: () => {} });
    this.#cms.getBanners('mid').subscribe({ next: r => this.midBanners.set(r.data), error: () => {} });
    this.#ai.getRecentlyViewed().subscribe({ next: r => this.recentlyViewed.set(r.data), error: () => {} });
    if (this.#auth.isLoggedIn()) {
      this.#ai.getForYou().subscribe({ next: r => this.forYou.set(r.data), error: () => {} });
    }
    this.#startDealTimer();
  }

  prevBanner(): void {
    this.activeBanner.update(i => i > 0 ? i - 1 : this.heroBanners().length - 1);
  }

  nextBanner(): void {
    this.activeBanner.update(i => i < this.heroBanners().length - 1 ? i + 1 : 0);
  }

  #startDealTimer(): void {
    let seconds = 4 * 3600 + 23 * 60 + 17;
    const tick = () => {
      if (seconds <= 0) return;
      seconds--;
      const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      this.dealTimer.set(`${h}:${m}:${s}`);
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 1000);
  }
}

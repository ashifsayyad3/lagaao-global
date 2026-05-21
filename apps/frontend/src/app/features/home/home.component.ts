import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SkeletonCardComponent } from '../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { NewsletterComponent } from '../../shared/components/newsletter/newsletter.component';
import { CmsService, Banner } from '../../core/services/cms.service';

@Component({
  selector: 'lg-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule,
    SkeletonCardComponent, BadgeComponent, ButtonComponent, CurrencyInrPipe,
    NewsletterComponent,
  ],
  template: `
    <!-- Hero Section -->
    @if (heroBanners().length > 0) {
      <!-- API-driven hero banner -->
      <section class="relative overflow-hidden min-h-[400px] flex items-end"
               [style.background-color]="heroBanners()[activeBanner()].bgColor ?? '#1e3a5f'">
        @if (heroBanners()[activeBanner()].image) {
          <img [src]="heroBanners()[activeBanner()].image"
               [alt]="heroBanners()[activeBanner()].title"
               class="absolute inset-0 w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/40"></div>
        }
        <div class="relative z-10 max-w-screen-2xl mx-auto px-4 md:px-6 py-16 w-full">
          <div class="max-w-xl">
            <h1 class="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              {{ heroBanners()[activeBanner()].title }}
            </h1>
            @if (heroBanners()[activeBanner()].subtitle) {
              <p class="text-white/80 text-lg mb-6">{{ heroBanners()[activeBanner()].subtitle }}</p>
            }
            @if (heroBanners()[activeBanner()].link) {
              <a [href]="heroBanners()[activeBanner()].link"
                 class="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-xl
                        hover:bg-accent/90 transition-colors text-sm">
                {{ heroBanners()[activeBanner()].ctaLabel ?? 'Shop Now' }}
                <mat-icon class="!text-base">arrow_forward</mat-icon>
              </a>
            }
          </div>
          <!-- Dots -->
          @if (heroBanners().length > 1) {
            <div class="flex gap-2 mt-6">
              @for (b of heroBanners(); track b.id; let i = $index) {
                <button
                  class="w-2 h-2 rounded-full transition-all"
                  [class]="i === activeBanner() ? 'bg-white w-6' : 'bg-white/50'"
                  (click)="activeBanner.set(i)"
                ></button>
              }
            </div>
          }
        </div>
      </section>
    } @else {
      <!-- Default hero (no banners yet) -->
      <section class="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 min-h-[560px] flex items-center">
        <div class="absolute inset-0 opacity-10"
             style="background-image: radial-gradient(circle at 25% 25%, white 1px, transparent 0),
                    radial-gradient(circle at 75% 75%, white 1px, transparent 0);
                    background-size: 40px 40px;">
        </div>
        <div class="relative z-10 max-w-screen-2xl mx-auto px-4 md:px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
          <div class="animate-fade-in">
            <lg-badge variant="info" class="mb-4">
              <mat-icon class="!text-sm !w-4 !h-4 mr-1">auto_awesome</mat-icon>
              AI-Powered Shopping
            </lg-badge>
            <h1 class="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Shop Smarter<br>
              <span class="text-amber-400">Live Better</span>
            </h1>
            <p class="text-primary-200 text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              Discover millions of products across every category. Powered by AI to find exactly what you need.
            </p>
            <div class="flex flex-wrap gap-3">
              <lg-button variant="accent" size="lg" suffixIcon="arrow_forward" routerLink="/products">
                Shop Now
              </lg-button>
            </div>
            <div class="mt-10 flex flex-wrap gap-6 text-sm text-primary-300">
              <div class="flex items-center gap-1.5">
                <mat-icon class="!text-base text-green-400">verified</mat-icon>
                10M+ Products
              </div>
              <div class="flex items-center gap-1.5">
                <mat-icon class="!text-base text-green-400">local_shipping</mat-icon>
                Free Delivery
              </div>
              <div class="flex items-center gap-1.5">
                <mat-icon class="!text-base text-green-400">replay</mat-icon>
                Easy Returns
              </div>
              <div class="flex items-center gap-1.5">
                <mat-icon class="!text-base text-green-400">security</mat-icon>
                Secure Payments
              </div>
            </div>
          </div>
          <div class="hidden lg:flex justify-center animation-delay-200 animate-fade-in">
            <div class="glass-strong rounded-3xl p-6 shadow-2xl w-72">
              <div class="rounded-2xl overflow-hidden mb-4 bg-white/20 h-48 flex items-center justify-center">
                <mat-icon class="!text-7xl text-white/40">shopping_bag</mat-icon>
              </div>
              <lg-badge variant="success" class="mb-2">Best Seller</lg-badge>
              <h3 class="font-semibold text-white text-lg">Premium Wireless Headphones</h3>
              <p class="text-primary-300 text-sm mt-1">Active Noise Cancellation • 30h battery</p>
              <div class="flex justify-between items-center mt-4">
                <div>
                  <span class="text-white font-bold text-xl">{{ 8999 | currencyInr }}</span>
                  <span class="text-primary-400 text-sm line-through ml-2">{{ 14999 | currencyInr }}</span>
                </div>
                <lg-button variant="accent" size="sm">Add to Cart</lg-button>
              </div>
            </div>
          </div>
        </div>
      </section>
    }

    <!-- Category Quick Links -->
    <section class="py-10 bg-bg-base">
      <div class="max-w-screen-2xl mx-auto px-4 md:px-6">
        <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          @for (cat of categories; track cat.label) {
            <a
              [routerLink]="['/products']"
              [queryParams]="{ category: cat.slug }"
              class="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border border-border-default
                     bg-bg-subtle hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950
                     transition-all flex-shrink-0 group"
            >
              <span class="text-2xl">{{ cat.emoji }}</span>
              <span class="text-xs font-medium text-text-secondary group-hover:text-primary-600 whitespace-nowrap">
                {{ cat.label }}
              </span>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Mid banners -->
    @if (midBanners().length > 0) {
      <section class="py-4">
        <div class="max-w-screen-2xl mx-auto px-4 md:px-6 grid sm:grid-cols-2 gap-4">
          @for (banner of midBanners().slice(0, 2); track banner.id) {
            <a [href]="banner.link ?? '#'"
               class="relative overflow-hidden rounded-2xl h-40 flex items-end p-5"
               [style.background-color]="banner.bgColor ?? '#e0f0ff'">
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
      <!-- Flash Sale fallback -->
      <section class="py-4">
        <div class="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div class="rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 p-5 flex flex-col sm:flex-row
                      justify-between items-center gap-4">
            <div class="flex items-center gap-3 text-white">
              <span class="text-3xl">⚡</span>
              <div>
                <p class="font-bold text-lg">Flash Sale</p>
                <p class="text-white/80 text-sm">Up to 70% off on top brands</p>
              </div>
            </div>
            <lg-button variant="secondary" size="md" routerLink="/products" [queryParams]="{ sale: 'flash' }">
              Shop Flash Sale
            </lg-button>
          </div>
        </div>
      </section>
    }

    <!-- Featured Products (skeleton demo) -->
    <section class="py-10">
      <div class="max-w-screen-2xl mx-auto px-4 md:px-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="font-display text-2xl font-bold text-text-primary">Trending Now</h2>
          <a routerLink="/products" class="text-primary-600 hover:text-primary-700 text-sm font-medium
                                           flex items-center gap-1">
            See all <mat-icon class="!text-base">chevron_right</mat-icon>
          </a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          @for (i of [1,2,3,4,5]; track i) {
            <lg-skeleton-card></lg-skeleton-card>
          }
        </div>
      </div>
    </section>

    <!-- AI Banner -->
    <section class="py-10">
      <div class="max-w-screen-2xl mx-auto px-4 md:px-6">
        <div class="glass-card p-8 flex flex-col md:flex-row items-center gap-8">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent
                      flex items-center justify-center flex-shrink-0">
            <mat-icon class="!text-3xl text-white">psychology</mat-icon>
          </div>
          <div class="flex-1 text-center md:text-left">
            <h3 class="font-display text-xl font-bold text-text-primary mb-2">
              Meet Your AI Shopping Assistant
            </h3>
            <p class="text-text-secondary">
              Describe what you're looking for in plain language. Our AI understands your intent and
              finds the perfect products instantly.
            </p>
          </div>
          <lg-button variant="primary" size="lg" prefixIcon="chat" routerLink="/search" [queryParams]="{ ai: '1' }">
            Try AI Search
          </lg-button>
        </div>
      </div>
    </section>

    <!-- Newsletter -->
    <section class="py-10">
      <div class="max-w-screen-2xl mx-auto px-4 md:px-6">
        <lg-newsletter></lg-newsletter>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  readonly #cms = inject(CmsService);

  heroBanners  = signal<Banner[]>([]);
  midBanners   = signal<Banner[]>([]);
  activeBanner = signal(0);

  categories = [
    { label: 'Electronics',  emoji: '📱', slug: 'electronics' },
    { label: 'Fashion',      emoji: '👗', slug: 'fashion' },
    { label: 'Home',         emoji: '🏠', slug: 'home' },
    { label: 'Sports',       emoji: '⚽', slug: 'sports' },
    { label: 'Beauty',       emoji: '💄', slug: 'beauty' },
    { label: 'Books',        emoji: '📚', slug: 'books' },
    { label: 'Toys',         emoji: '🧸', slug: 'toys' },
    { label: 'Grocery',      emoji: '🛒', slug: 'grocery' },
    { label: 'Automotive',   emoji: '🚗', slug: 'automotive' },
    { label: 'Health',       emoji: '💊', slug: 'health' },
  ];

  ngOnInit() {
    this.#cms.getBanners('hero').subscribe(r => this.heroBanners.set(r.data));
    this.#cms.getBanners('mid').subscribe(r => this.midBanners.set(r.data));
  }
}

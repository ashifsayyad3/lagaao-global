import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SkeletonCardComponent } from '../../shared/components/skeleton/skeleton.component';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { ProductCarouselComponent } from '../../shared/components/product-carousel/product-carousel.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CmsService, Banner } from '../../core/services/cms.service';
import { AiService, AiProduct } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductService, Product } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { YouMayLikeComponent } from '../../shared/components/you-may-like/you-may-like.component';

@Component({
  selector: 'lg-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, SkeletonCardComponent, CurrencyInrPipe, ProductCarouselComponent, ProductCardComponent, YouMayLikeComponent],
  template: `

    <!-- ═══════════════════════════════════════════════════════
         HERO SLIDER
    ═══════════════════════════════════════════════════════ -->
    <section class="relative overflow-hidden bg-[#f0f7f1]">
      @if (heroBanners().length > 0) {
        <!-- API banner -->
        <div class="relative min-h-[480px] md:min-h-[560px] flex items-center"
             [style.background-color]="heroBanners()[activeBanner()].bgColor ?? '#e8f4ea'">
          @if (heroBanners()[activeBanner()].image) {
            <img [src]="heroBanners()[activeBanner()].image"
                 [alt]="heroBanners()[activeBanner()].title"
                 class="absolute inset-0 w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-r from-primary-900/70 via-primary-900/30 to-transparent"></div>
          }
          <div class="relative z-10 max-w-screen-xl mx-auto px-6 py-16">
            <div class="max-w-lg">
              <p class="text-primary-200 text-sm font-medium tracking-widest uppercase mb-3">
                {{ heroBanners()[activeBanner()].subtitle ?? 'New Collection' }}
              </p>
              <h1 class="font-display text-4xl md:text-6xl font-semibold text-white leading-tight mb-5">
                {{ heroBanners()[activeBanner()].title }}
              </h1>
              @if (heroBanners()[activeBanner()].link) {
                <a [href]="heroBanners()[activeBanner()].link"
                   class="btn-primary inline-flex text-base px-8 py-3.5">
                  {{ heroBanners()[activeBanner()].ctaLabel ?? 'Shop Now' }}
                  <mat-icon class="!text-base">arrow_forward</mat-icon>
                </a>
              }
            </div>
          </div>
          <!-- Slide nav dots -->
          @if (heroBanners().length > 1) {
            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              @for (b of heroBanners(); track b.id; let i = $index) {
                <button (click)="activeBanner.set(i)"
                        class="rounded-full transition-all duration-300"
                        [class]="i === activeBanner()
                          ? 'w-8 h-2 bg-white'
                          : 'w-2 h-2 bg-white/40 hover:bg-white/70'">
                </button>
              }
            </div>
            <button (click)="prevBanner()"
                    class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                           bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white
                           flex items-center justify-center transition-all">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <button (click)="nextBanner()"
                    class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                           bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white
                           flex items-center justify-center transition-all">
              <mat-icon>chevron_right</mat-icon>
            </button>
          }
        </div>
      } @else {
        <!-- Default editorial hero -->
        <div class="relative min-h-[520px] md:min-h-[620px] flex items-center overflow-hidden"
             style="background: linear-gradient(135deg, #1e3a23 0%, #2d5535 40%, #3d6b45 100%)">

          <!-- Decorative leaf circles -->
          <div class="absolute -right-24 -top-24 w-96 h-96 rounded-full opacity-10"
               style="background: radial-gradient(circle, #7a9e7e, transparent)"></div>
          <div class="absolute right-32 bottom-0 w-64 h-64 rounded-full opacity-10"
               style="background: radial-gradient(circle, #a8c4ab, transparent)"></div>
          <div class="absolute -left-16 top-1/2 w-48 h-48 rounded-full opacity-10"
               style="background: radial-gradient(circle, #5a8f64, transparent)"></div>

          <div class="relative z-10 max-w-screen-xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
            <!-- Left text -->
            <div class="animate-fade-up">
              <span class="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm
                           text-primary-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-white/20">
                <span class="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse"></span>
                10,000+ Happy Plant Parents
              </span>

              <h1 class="font-display text-white leading-[1.1] mb-5"
                  style="font-size: clamp(2.4rem, 5.5vw, 4rem); font-weight: 600;">
                Bring Nature<br>
                <em class="not-italic text-green-300">Home.</em>
              </h1>

              <p class="text-primary-200 text-lg leading-relaxed mb-8 max-w-md">
                Handpicked indoor plants, rare varieties, gardening essentials — delivered fresh to your door
                with our expert care guarantee.
              </p>

              <div class="flex flex-wrap gap-3 mb-10">
                <a routerLink="/products" [queryParams]="{ category: 'plants' }"
                   class="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-primary-700
                          font-semibold rounded-full hover:bg-primary-50 transition-all
                          shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm">
                  <mat-icon class="!text-base">local_florist</mat-icon>
                  Shop Plants
                </a>
                <a routerLink="/products" [queryParams]="{ category: 'plant-care' }"
                   class="inline-flex items-center gap-2 px-7 py-3.5 border border-white/40
                          text-white font-medium rounded-full hover:bg-white/10 transition-all text-sm">
                  Plant Care
                  <mat-icon class="!text-base">arrow_forward</mat-icon>
                </a>
              </div>

              <!-- Trust pills -->
              <div class="flex flex-wrap gap-3">
                @for (trust of trustPills; track trust.label) {
                  <div class="flex items-center gap-1.5 text-xs text-primary-200">
                    <mat-icon class="!text-sm text-green-300">{{ trust.icon }}</mat-icon>
                    {{ trust.label }}
                  </div>
                }
              </div>
            </div>

            <!-- Right — featured plant card -->
            <div class="hidden lg:flex justify-center items-center animate-fade-up"
                 style="animation-delay: 150ms">
              <div class="relative">
                <!-- Card glow -->
                <div class="absolute inset-0 rounded-3xl blur-2xl opacity-30 scale-95"
                     style="background: linear-gradient(135deg, #7a9e7e, #3d6b45)"></div>

                <div class="relative bg-white rounded-3xl overflow-hidden w-80 shadow-2xl">
                  <div class="h-64 bg-primary-50 relative overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&h=600&fit=crop&crop=center"
                         alt="Money Plant"
                         class="w-full h-full object-cover" />
                    <span class="absolute top-3 left-3 bg-terracotta-500 text-white text-xs
                                 font-bold px-3 py-1 rounded-full">Bestseller</span>
                    <span class="absolute top-3 right-3 bg-white text-primary-600 text-xs
                                 font-bold px-2 py-1 rounded-full shadow">🌿 Easy Care</span>
                  </div>
                  <div class="p-5">
                    <p class="text-xs text-sage-500 font-semibold uppercase tracking-widest mb-1">
                      Epipremnum aureum
                    </p>
                    <h3 class="font-display text-lg font-semibold text-primary-900 mb-1">
                      Golden Money Plant
                    </h3>
                    <div class="flex items-center gap-1 mb-3">
                      @for (i of [1,2,3,4,5]; track i) {
                        <mat-icon class="!text-xs text-amber-400">star</mat-icon>
                      }
                      <span class="text-xs text-stone ml-1">(2.4k reviews)</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-bold text-xl text-primary-800">{{ 299 | currencyInr }}</span>
                        <span class="text-sm text-stone line-through ml-2">{{ 499 | currencyInr }}</span>
                      </div>
                      <button class="btn-primary text-xs px-4 py-2">Add to Cart</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </section>

    <!-- ═══════════════════════════════════════════════════════
         SHOP BY CATEGORY — icon grid
    ═══════════════════════════════════════════════════════ -->
    <section class="py-14 bg-[var(--bg-subtle)]">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6">
        <div class="text-center mb-10">
          <p class="text-sage-500 text-sm font-semibold uppercase tracking-widest mb-2">Browse</p>
          <h2 class="section-title">Shop by Category</h2>
        </div>

        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          @for (cat of shopCategories; track cat.label) {
            <a [routerLink]="['/products']" [queryParams]="{ category: cat.slug }"
               class="flex flex-col items-center gap-2.5 p-3 rounded-2xl group cursor-pointer
                      hover:bg-primary-50 transition-all duration-200 hover:-translate-y-1">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
                          shadow-warm-sm group-hover:shadow-warm-md transition-all duration-200"
                   [style.background]="cat.bg">
                {{ cat.emoji }}
              </div>
              <span class="text-xs font-medium text-text-secondary group-hover:text-primary-600
                           text-center leading-tight transition-colors">
                {{ cat.label }}
              </span>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         HERO BANNER STRIP — two promo cards
    ═══════════════════════════════════════════════════════ -->
    <section class="py-6 bg-[var(--bg-subtle)]">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-4">
        <!-- Promo 1 -->
        <div class="relative overflow-hidden rounded-2xl min-h-[180px] flex items-center px-8
                    bg-gradient-to-br from-[#1e3a23] to-[#3d6b45]">
          <div class="relative z-10">
            <p class="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">
              Low Maintenance
            </p>
            <h3 class="font-display text-white text-2xl font-semibold mb-3">
              Plants for<br>Busy People
            </h3>
            <a routerLink="/products" [queryParams]="{ category: 'low-maintenance' }"
               class="inline-flex items-center gap-1.5 text-sm font-semibold text-white
                      bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all">
              Explore <mat-icon class="!text-sm">arrow_forward</mat-icon>
            </a>
          </div>
          <div class="absolute -right-4 -bottom-4 text-[120px] opacity-20 leading-none select-none">
            🪴
          </div>
        </div>

        <!-- Promo 2 -->
        <div class="relative overflow-hidden rounded-2xl min-h-[180px] flex items-center px-8"
             style="background: linear-gradient(135deg, #5c2817, #a04828)">
          <div class="relative z-10">
            <p class="text-orange-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Gift a Garden
            </p>
            <h3 class="font-display text-white text-2xl font-semibold mb-3">
              Plant Gift<br>Hampers
            </h3>
            <a routerLink="/products" [queryParams]="{ category: 'gifts-combos' }"
               class="inline-flex items-center gap-1.5 text-sm font-semibold text-white
                      bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all">
              Shop Gifts <mat-icon class="!text-sm">arrow_forward</mat-icon>
            </a>
          </div>
          <div class="absolute -right-4 -bottom-4 text-[120px] opacity-20 leading-none select-none">
            🎁
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         BESTSELLERS
    ═══════════════════════════════════════════════════════ -->
    <section class="py-14 bg-[var(--color-cream)]">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6">
        <div class="flex items-end justify-between mb-8">
          <div>
            <p class="text-sage-500 text-sm font-semibold uppercase tracking-widest mb-1">Top Picks</p>
            <h2 class="section-title">Bestselling Plants</h2>
          </div>
          <a routerLink="/products" [queryParams]="{ sort: 'popular' }"
             class="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary-600
                    hover:text-primary-700 transition-colors">
            View all <mat-icon class="!text-base">east</mat-icon>
          </a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          @if (bestsellers().length === 0) {
            @for (i of [1,2,3,4,5]; track i) {
              <lg-skeleton-card></lg-skeleton-card>
            }
          } @else {
            @for (p of bestsellers(); track p.id) {
              <lg-product-card [product]="p"></lg-product-card>
            }
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         NEW ARRIVALS — horizontal scroll carousel
    ═══════════════════════════════════════════════════════ -->
    <section class="py-14 bg-[var(--bg-subtle)]">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6">
        <div class="flex items-end justify-between mb-8">
          <div>
            <p class="text-sage-500 text-sm font-semibold uppercase tracking-widest mb-1">Fresh Stock</p>
            <h2 class="section-title">New Arrivals</h2>
          </div>
          <a routerLink="/products" [queryParams]="{ sort: 'newest' }"
             class="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary-600
                    hover:text-primary-700 transition-colors">
            View all <mat-icon class="!text-base">east</mat-icon>
          </a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          @if (newArrivals().length === 0) {
            @for (i of [1,2,3,4]; track i) {
              <lg-skeleton-card></lg-skeleton-card>
            }
          } @else {
            @for (p of newArrivals(); track p.id) {
              <lg-product-card [product]="p"></lg-product-card>
            }
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         WHY LAGAAO — trust section
    ═══════════════════════════════════════════════════════ -->
    <section class="py-16 bg-primary-800">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6">
        <div class="text-center mb-12">
          <h2 class="font-display text-3xl font-semibold text-white mb-3">
            Why Plant Parents Love Lagaao
          </h2>
          <p class="text-primary-300 max-w-lg mx-auto">
            We grow happy, healthy plants and ship them with care — straight to your home.
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          @for (feat of whyUs; track feat.title) {
            <div class="flex flex-col items-center text-center p-6 rounded-2xl
                        bg-white/5 hover:bg-white/10 border border-white/10
                        transition-all duration-300 group hover:-translate-y-1">
              <div class="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center
                          mb-4 group-hover:bg-terracotta-500 transition-colors text-2xl">
                {{ feat.emoji }}
              </div>
              <h4 class="font-semibold text-white text-sm mb-2">{{ feat.title }}</h4>
              <p class="text-primary-300 text-xs leading-relaxed">{{ feat.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         PLANT CARE PRODUCTS
    ═══════════════════════════════════════════════════════ -->
    <section class="py-14 bg-[var(--bg-subtle)]">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6">
        <div class="flex items-end justify-between mb-8">
          <div>
            <p class="text-sage-500 text-sm font-semibold uppercase tracking-widest mb-1">
              Keep Them Thriving
            </p>
            <h2 class="section-title">Plant Care Essentials</h2>
          </div>
          <a routerLink="/products" [queryParams]="{ category: 'plant-care' }"
             class="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary-600
                    hover:text-primary-700 transition-colors">
            View all <mat-icon class="!text-base">east</mat-icon>
          </a>
        </div>

        <!-- Care category pills -->
        <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-2 mb-6">
          @for (tag of careTags; track tag.label) {
            <a [routerLink]="['/products']" [queryParams]="{ category: tag.slug }"
               class="flex items-center gap-1.5 px-4 py-2 rounded-full border border-sand
                      bg-[var(--bg-base)] hover:bg-primary-50 hover:border-primary-300
                      text-sm font-medium text-text-secondary hover:text-primary-600
                      transition-all whitespace-nowrap flex-shrink-0">
              {{ tag.emoji }} {{ tag.label }}
            </a>
          }
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          @if (careProducts().length === 0) {
            @for (i of [1,2,3,4,5]; track i) {
              <lg-skeleton-card></lg-skeleton-card>
            }
          } @else {
            @for (p of careProducts(); track p.id) {
              <lg-product-card [product]="p"></lg-product-card>
            }
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         AI RECOMMENDATIONS (if logged in / recently viewed)
    ═══════════════════════════════════════════════════════ -->
    @if (forYou().length > 0) {
      <section class="py-6 max-w-screen-xl mx-auto px-4 md:px-6">
        <lg-product-carousel title="Picked For You" [products]="forYou()" viewAllLink="/search"></lg-product-carousel>
      </section>
    }
    @if (recentlyViewed().length > 0) {
      <section class="py-6 max-w-screen-xl mx-auto px-4 md:px-6">
        <lg-product-carousel title="Recently Viewed" [products]="recentlyViewed()"></lg-product-carousel>
      </section>
    }

    <!-- ═══════════════════════════════════════════════════════
         AI CHAT PROMO STRIP
    ═══════════════════════════════════════════════════════ -->
    <section class="py-6 bg-[var(--bg-subtle)]">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6">
        <div class="rounded-2xl overflow-hidden bg-gradient-to-r from-primary-700 to-primary-500
                    flex flex-col md:flex-row items-center gap-6 px-8 py-7">
          <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <mat-icon class="!text-2xl text-white">psychology</mat-icon>
          </div>
          <div class="flex-1 text-center md:text-left">
            <h3 class="font-display text-xl font-semibold text-white mb-1">
              "Which plant suits my balcony?" — Just ask our AI
            </h3>
            <p class="text-primary-200 text-sm">
              Describe your space, light conditions or mood — get personalised plant picks instantly.
            </p>
          </div>
          <a routerLink="/search" [queryParams]="{ ai: '1' }"
             class="flex-shrink-0 px-6 py-2.5 bg-white text-primary-700 font-semibold
                    text-sm rounded-full hover:bg-primary-50 transition-colors whitespace-nowrap">
            Try AI Search 🌿
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         COMBO PACKS
    ═══════════════════════════════════════════════════════ -->
    <section class="py-14 bg-[var(--color-cream)]">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6">
        <div class="flex items-end justify-between mb-8">
          <div>
            <p class="text-sage-500 text-sm font-semibold uppercase tracking-widest mb-1">Bundle & Save</p>
            <h2 class="section-title">Combo Packs</h2>
          </div>
          <a routerLink="/products" [queryParams]="{ category: 'combo-packs' }"
             class="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary-600
                    hover:text-primary-700 transition-colors">
            View all <mat-icon class="!text-base">east</mat-icon>
          </a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          @if (comboProducts().length === 0) {
            @for (i of [1,2,3,4]; track i) {
              <lg-skeleton-card></lg-skeleton-card>
            }
          } @else {
            @for (p of comboProducts(); track p.id) {
              <lg-product-card [product]="p"></lg-product-card>
            }
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         CUSTOMER GALLERY STRIP
    ═══════════════════════════════════════════════════════ -->
    <section class="py-14 bg-[var(--bg-subtle)]">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6">
        <div class="text-center mb-10">
          <p class="text-sage-500 text-sm font-semibold uppercase tracking-widest mb-2">#LagaaoHomes</p>
          <h2 class="section-title">From Our Plant Community</h2>
          <p class="text-text-muted text-sm mt-2">Real homes, real plants, real joy</p>
        </div>
        <div class="grid grid-cols-3 md:grid-cols-6 gap-2">
          @for (photo of galleryPhotos; track photo.id) {
            <div class="aspect-square rounded-xl overflow-hidden bg-primary-50 group cursor-pointer">
              <img [src]="photo.src" [alt]="photo.alt"
                   class="w-full h-full object-cover transition-transform duration-500
                          group-hover:scale-110" />
            </div>
          }
        </div>
        <div class="text-center mt-8">
          <a href="#" class="btn-outline inline-flex">
            <mat-icon class="!text-base">photo_camera</mat-icon>
            Tag us @lagaao to be featured
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         BLOG SECTION
    ═══════════════════════════════════════════════════════ -->
    <section class="py-14 bg-[var(--bg-subtle)]">
      <div class="max-w-screen-xl mx-auto px-4 md:px-6">
        <div class="flex items-end justify-between mb-8">
          <div>
            <p class="text-sage-500 text-sm font-semibold uppercase tracking-widest mb-1">Learn & Grow</p>
            <h2 class="section-title">Plant Care Blog</h2>
          </div>
          <a routerLink="/blog" class="hidden sm:flex items-center gap-1 text-sm font-semibold
                                        text-primary-600 hover:text-primary-700 transition-colors">
            All articles <mat-icon class="!text-base">east</mat-icon>
          </a>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
          @for (post of blogPreviews; track post.title) {
            <a [routerLink]="['/blog', post.slug]"
               class="group rounded-2xl overflow-hidden bg-[var(--bg-subtle)] border border-sand
                      hover:border-primary-200 transition-all duration-300 hover:-translate-y-1
                      hover:shadow-warm-md block">
              <div class="h-48 overflow-hidden">
                <img [src]="post.image" [alt]="post.title"
                     class="w-full h-full object-cover transition-transform duration-500
                            group-hover:scale-105" />
              </div>
              <div class="p-5">
                <span class="badge-green text-[11px] mb-3 inline-flex">{{ post.tag }}</span>
                <h4 class="font-semibold text-text-primary text-sm leading-snug mb-2
                           group-hover:text-primary-600 transition-colors line-clamp-2">
                  {{ post.title }}
                </h4>
                <p class="text-xs text-text-muted">{{ post.readTime }}</p>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         NEWSLETTER
    ═══════════════════════════════════════════════════════ -->
    <section class="py-16 bg-[var(--linen)]">
      <div class="max-w-lg mx-auto px-6 text-center">
        <div class="text-5xl mb-4">🌱</div>
        <h2 class="font-display text-3xl font-semibold text-primary-800 mb-3">
          Get Growing Tips Weekly
        </h2>
        <p class="text-text-secondary text-sm mb-8">
          Join 50,000+ plant lovers. Get care guides, seasonal tips and exclusive deals — no spam.
        </p>
        <div class="flex gap-2 max-w-sm mx-auto">
          <input type="email" placeholder="your@email.com"
                 class="flex-1 px-4 py-3 rounded-full border border-sand bg-[var(--bg-base)] text-sm
                        outline-none focus:border-primary-400 transition-colors" />
          <button class="btn-primary px-6 py-3 whitespace-nowrap">Subscribe</button>
        </div>
        <p class="text-xs text-text-muted mt-3">Unsubscribe anytime. We respect your inbox.</p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════
         PERSONALISED RECOMMENDATIONS
    ═══════════════════════════════════════════════════════ -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <lg-you-may-like title="Recommended For You" />
    </section>

  `,
})
export class HomeComponent implements OnInit {
  readonly #cms     = inject(CmsService);
  readonly #ai      = inject(AiService);
  readonly #auth    = inject(AuthService);
  readonly #product = inject(ProductService);
  readonly #seo     = inject(SeoService);

  heroBanners    = signal<Banner[]>([]);
  midBanners     = signal<Banner[]>([]);
  activeBanner   = signal(0);
  forYou         = signal<AiProduct[]>([]);
  recentlyViewed = signal<AiProduct[]>([]);
  bestsellers    = signal<Product[]>([]);
  newArrivals    = signal<Product[]>([]);
  careProducts   = signal<Product[]>([]);
  comboProducts  = signal<Product[]>([]);

  readonly trustPills = [
    { icon: 'eco',           label: '100% Healthy Plants' },
    { icon: 'local_shipping',label: 'Free Delivery ₹499+' },
    { icon: 'replay',        label: '7-Day Replacement' },
    { icon: 'support_agent', label: 'Expert Plant Care' },
  ];

  readonly whyUs = [
    { emoji: '🌿', title: 'Farm Fresh Plants',      desc: 'Sourced directly from trusted nurseries across India' },
    { emoji: '📦', title: 'Safe Packaging',         desc: 'Every plant secured with our special transit packaging' },
    { emoji: '🔄', title: '7-Day Replacement',      desc: 'Not happy with your plant? We replace it, no questions' },
    { emoji: '🧑‍🌾', title: 'Expert Care Guidance',  desc: 'Each plant ships with a care card + our 24/7 support' },
  ];

  readonly shopCategories = [
    { label: 'Indoor Plants',    emoji: '🪴', slug: 'indoor-plants',   bg: '#a8d5b0' },
    { label: 'Outdoor Plants',   emoji: '🌳', slug: 'outdoor-plants',  bg: '#b5dbb9' },
    { label: 'Flowering',        emoji: '🌸', slug: 'flowering-plants',bg: '#f5b8a0' },
    { label: 'Succulents',       emoji: '🌵', slug: 'succulents',      bg: '#99c9a8' },
    { label: 'Seeds',            emoji: '🌱', slug: 'seeds',           bg: '#d4d97a' },
    { label: 'Pots & Planters',  emoji: '🏺', slug: 'pots-planters',   bg: '#f0c8b0' },
    { label: 'Plant Care',       emoji: '🧪', slug: 'plant-care',      bg: '#b0d4c8' },
    { label: 'Gifts',            emoji: '🎁', slug: 'gifts-combos',    bg: '#f5c0b8' },
    { label: 'Air Purifying',    emoji: '💨', slug: 'air-purifying',   bg: '#a8c4f0' },
    { label: 'Pet Friendly',     emoji: '🐾', slug: 'pet-friendly',    bg: '#f0d890' },
    { label: 'Low Maintenance',  emoji: '⏱️', slug: 'low-maintenance',  bg: '#b8d4b0' },
    { label: 'Medicinal',        emoji: '🌿', slug: 'medicinal',       bg: '#90c4a0' },
    { label: 'Fruit Plants',     emoji: '🍋', slug: 'fruit-plants',    bg: '#f0e090' },
    { label: 'XL Plants',        emoji: '🌴', slug: 'xl-plants',       bg: '#a8c8b8' },
    { label: 'Combos',           emoji: '📦', slug: 'combo-packs',     bg: '#f0b8a0' },
    { label: 'New Arrivals',     emoji: '✨', slug: 'new-arrivals',    bg: '#c8b8f0' },
  ];

  readonly careTags = [
    { label: 'Potting Mix',   emoji: '🌍', slug: 'potting-mix' },
    { label: 'Fertilizers',   emoji: '🧪', slug: 'fertilizers' },
    { label: 'Garden Tools',  emoji: '🔧', slug: 'garden-tools' },
    { label: 'Watering',      emoji: '💧', slug: 'watering-tools' },
    { label: 'Pest Control',  emoji: '🐛', slug: 'pest-control' },
    { label: 'Pebbles',       emoji: '🪨', slug: 'pebbles' },
  ];

  readonly galleryPhotos = [
    { id: 1, src: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=300&h=300&fit=crop', alt: 'Indoor plant' },
    { id: 2, src: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300&h=300&fit=crop', alt: 'Shelf plants' },
    { id: 3, src: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=300&h=300&fit=crop', alt: 'Succulent' },
    { id: 4, src: 'https://images.unsplash.com/photo-1508022713622-df2d8fb7b4cd?w=300&h=300&fit=crop', alt: 'Potted plant' },
    { id: 5, src: 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=300&h=300&fit=crop', alt: 'Balcony garden' },
    { id: 6, src: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=300&h=300&fit=crop', alt: 'Hanging plant' },
  ];

  readonly blogPreviews = [
    {
      slug:      'how-to-care-for-indoor-plants',
      title:     "The Complete Beginner's Guide to Indoor Plant Care",
      tag:       'Plant Care',
      image:     'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&h=400&fit=crop',
      readTime:  '5 min read',
    },
    {
      slug:      'best-air-purifying-plants',
      title:     '10 Best Air Purifying Plants for Your Home in 2024',
      tag:       'Indoor Plants',
      image:     'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop',
      readTime:  '4 min read',
    },
    {
      slug:      'how-to-water-plants',
      title:     'Stop Overwatering: The Right Way to Water Every Plant',
      tag:       'Tips & Tricks',
      image:     'https://images.unsplash.com/photo-1627424171666-8f35dc3c6a18?w=600&h=400&fit=crop',
      readTime:  '3 min read',
    },
  ];

  ngOnInit() {
    this.#seo.setMeta({
      title:       'Lagaao — Shop Everything Online',
      description: 'Discover fashion, electronics, home décor & more on Lagaao — India\'s AI-powered marketplace. Free delivery on orders above ₹499.',
      canonical:   'https://lagaao.com/',
      type:        'website',
      keywords:    'online shopping India, fashion, electronics, home décor, Lagaao',
    });
    this.#seo.setOrganizationSchema();

    this.#cms.getBanners('hero').subscribe({ next: r => this.heroBanners.set(r.data), error: () => {} });
    this.#cms.getBanners('mid').subscribe({ next: r => this.midBanners.set(r.data), error: () => {} });
    this.#ai.getRecentlyViewed().subscribe({ next: r => this.recentlyViewed.set(r.data), error: () => {} });
    if (this.#auth.isLoggedIn()) {
      this.#ai.getForYou().subscribe({ next: r => this.forYou.set(r.data), error: () => {} });
    }
    this.#product.getProducts({ sort: 'rating', limit: 10 })
      .subscribe({ next: r => this.bestsellers.set(r.data), error: () => {} });
    this.#product.getProducts({ sort: 'newest', limit: 8 })
      .subscribe({ next: r => this.newArrivals.set(r.data), error: () => {} });
    this.#product.getProducts({ category: 'plant-care', sort: 'rating', limit: 10 })
      .subscribe({ next: r => this.careProducts.set(r.data), error: () => {} });
    this.#product.getProducts({ category: 'gifts-combos', sort: 'rating', limit: 8 })
      .subscribe({ next: r => this.comboProducts.set(r.data), error: () => {} });
  }

  prevBanner(): void { this.activeBanner.update(i => i > 0 ? i - 1 : this.heroBanners().length - 1); }
  nextBanner(): void { this.activeBanner.update(i => i < this.heroBanners().length - 1 ? i + 1 : 0); }
}

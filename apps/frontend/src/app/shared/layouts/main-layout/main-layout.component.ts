import {
  Component, ChangeDetectionStrategy, inject, OnInit, signal, HostListener, ElementRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastContainerComponent } from '../../components/toast/toast.component';
import { LoadingService } from '../../../core/services/loading.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { WalletService } from '../../../core/services/wallet.service';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { AnnouncementBarComponent } from '../../components/announcement-bar/announcement-bar.component';
import { AiChatComponent } from '../../components/ai-chat/ai-chat.component';
import { LgLogoComponent } from '../../components/logo/logo.component';
import { FlashSaleBannerComponent } from '../../components/flash-sale-banner/flash-sale-banner.component';

interface MegaMenuCategory {
  label: string;
  slug: string;
  icon: string;
  color: string;
  sub: { label: string; slug: string }[];
}

@Component({
  selector: 'lg-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, MatIconModule,
            ToastContainerComponent, SearchBarComponent, AnnouncementBarComponent, AiChatComponent, LgLogoComponent,
            FlashSaleBannerComponent],
  styles: [`
    /* ── Page progress bar ──────────────────────────────────────── */
    .progress-bar {
      position: fixed; top: 0; left: 0; right: 0; height: 2px;
      z-index: 9999; overflow: hidden;
    }
    .progress-bar__fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), var(--color-sage), var(--color-accent));
      animation: progressPulse 1.5s ease-in-out infinite;
    }
    @keyframes progressPulse {
      0%   { opacity: 1; }
      50%  { opacity: .6; }
      100% { opacity: 1; }
    }

    /* ── Header elevation states ───────────────────────────────── */
    .site-header {
      transition: box-shadow 300ms var(--ease-out), background 300ms var(--ease-out);
    }
    .site-header.scrolled {
      box-shadow: 0 2px 20px rgba(0,0,0,.08);
    }

    /* ── Nav item underline ─────────────────────────────────────── */
    .nav-link {
      position: relative;
    }
    .nav-link::after {
      content: '';
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 2px; border-radius: 1px;
      background: var(--color-primary);
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 200ms var(--ease-out);
    }
    .nav-link:hover::after,
    .nav-link.active::after { transform: scaleX(1); }

    /* ── Mega dropdown ──────────────────────────────────────────── */
    .mega-dropdown {
      position: absolute;
      top: calc(100% + 1px);
      left: 50%;
      transform: translateX(-50%);
      min-width: 280px;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transform: translateX(-50%) translateY(-8px);
      transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out), visibility 180ms;
    }
    .nav-item:hover .mega-dropdown {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      transform: translateX(-50%) translateY(0);
    }

    /* ── Cart badge pulse ───────────────────────────────────────── */
    @keyframes badgePop {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
    .cart-badge { animation: badgePop 300ms var(--ease-spring); }

    /* ── Mega dropdown sub-links ────────────────────────────────── */
    .dropdown-sub-link:hover {
      background: #f0f7f1;
      color: #3d6b45 !important;
    }
    .dropdown-view-all:hover {
      color: #2a4d31 !important;
    }

    /* ── Footer links ───────────────────────────────────────────── */
    .footer-link {
      color: #333;
    }
    .footer-link:hover {
      color: var(--color-primary);
    }

    /* ── Footer newsletter input ────────────────────────────────── */
    .newsletter-input:focus {
      outline: none;
      border-color: var(--color-sage);
      background: rgba(255,255,255,.12);
    }

    /* ── Mobile nav entrance ────────────────────────────────────── */
    @keyframes drawerSlideIn {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }
    .mobile-drawer {
      animation: drawerSlideIn 280ms var(--ease-out) both;
    }
  `],
  template: `
    <!-- ══════════════════════════════════════════════════════════
         PAGE PROGRESS BAR
    ══════════════════════════════════════════════════════════ -->
    @if (loading.isLoading()) {
      <div class="progress-bar">
        <div class="progress-bar__fill"></div>
      </div>
    }

    <!-- ══════════════════════════════════════════════════════════
         ANNOUNCEMENT BAR
    ══════════════════════════════════════════════════════════ -->
    <lg-announcement-bar></lg-announcement-bar>

    <!-- ══════════════════════════════════════════════════════════
         TOP UTILITY STRIP  (desktop only, minimal reference style)
    ══════════════════════════════════════════════════════════ -->
    <div class="hidden md:block" style="background:var(--bg-page)">
      <div class="max-w-screen-xl mx-auto px-6 h-8 flex items-center justify-between">
        <div class="flex items-center gap-5 text-xs" style="color:#444">
          <span>🌿 Free delivery above ₹499</span>
          <span style="color:#bbb">|</span>
          <span>100% healthy plant guarantee</span>
          <span style="color:#bbb">|</span>
          <span>7-day replacement promise</span>
        </div>
        <div class="flex items-center gap-4 text-xs" style="color:#444">
          <a routerLink="/orders"      class="hover:text-primary-700 transition-colors" style="color:#444;text-decoration:none">Track Order</a>
          <a routerLink="/pages/contact" class="hover:text-primary-700 transition-colors" style="color:#444;text-decoration:none">Help</a>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         MAIN STICKY HEADER
    ══════════════════════════════════════════════════════════ -->
    <header
      class="site-header sticky top-0 z-sticky"
      [class.scrolled]="scrolled()"
      style="background: #fff; border-bottom: 1px solid #f0f0ed;"
    >
      <div class="max-w-screen-xl mx-auto px-4 md:px-6 h-[64px] flex items-center gap-3 lg:gap-5">

        <!-- Logo -->
        <a routerLink="/" class="flex-shrink-0">
          <lg-logo size="38px"></lg-logo>
        </a>

        <!-- Search — expands on desktop -->
        <div class="flex-1 max-w-2xl hidden md:block">
          <lg-search-bar class="w-full"></lg-search-bar>
        </div>

        <!-- ── Right actions ──────────────────────────────────── -->
        <div class="flex items-center gap-0.5 ml-auto md:ml-0 flex-shrink-0">

          <!-- Wishlist (sm+) -->
          <a routerLink="/profile/wishlist"
             class="hidden sm:flex items-center gap-1.5 h-10 px-3 rounded-xl
                    text-text-secondary hover:text-primary-600 hover:bg-primary-50
                    transition-all group relative"
             style="position:relative">
            <mat-icon class="!text-[1.25rem] group-hover:scale-110 transition-transform duration-200">
              {{ wishlist.count() > 0 ? 'favorite' : 'favorite_border' }}
            </mat-icon>
            @if (wishlist.count() > 0) {
              <span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
                           bg-terracotta-500 text-white rounded-full
                           text-[10px] font-bold flex items-center justify-center px-1">
                {{ wishlist.count() > 9 ? '9+' : wishlist.count() }}
              </span>
            }
            <span class="hidden lg:block text-sm font-medium">Wishlist</span>
          </a>

          <!-- Account -->
          @if (auth.isLoggedIn()) {
            <div class="relative user-menu-wrap">
              <button (click)="toggleUserMenu()"
                      class="flex items-center gap-2 h-10 px-3 rounded-xl
                             text-text-secondary hover:text-primary-700
                             hover:bg-primary-50 transition-all text-sm font-medium group">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600
                            flex items-center justify-center text-white font-bold text-sm
                            flex-shrink-0 shadow-sm">
                  {{ (auth.user()?.name ?? '?')[0].toUpperCase() }}
                </div>
                <span class="hidden lg:block max-w-[80px] truncate">
                  {{ (auth.user()?.name?.split(' ') ?? [''])[0] }}
                </span>
                <mat-icon class="!text-sm transition-transform duration-200 text-text-muted"
                          [style.transform]="userMenuOpen() ? 'rotate(180deg)' : 'none'">
                  keyboard_arrow_down
                </mat-icon>
              </button>

              @if (userMenuOpen()) {
                <div class="absolute right-0 top-full mt-2 w-56
                            bg-white border border-sand
                            rounded-2xl shadow-warm-xl py-1.5 z-dropdown
                            animate-scale-in origin-top-right">

                  <!-- User info header -->
                  <div class="px-4 py-3 border-b border-sand mb-1">
                    <p class="text-sm font-semibold text-text-primary truncate">{{ auth.user()?.name }}</p>
                    <p class="text-xs text-text-muted truncate">{{ auth.user()?.email }}</p>
                  </div>

                  @for (item of userMenuItems; track item.label) {
                    @if (item.divider) {
                      <div class="my-1 h-px bg-sand mx-2"></div>
                    } @else if (!item.adminOnly || auth.user()?.role === 'vendor' || auth.user()?.role === 'super_admin') {
                      <a [routerLink]="item.route" (click)="userMenuOpen.set(false)"
                         class="flex items-center gap-3 px-4 py-2.5 text-sm
                                text-text-secondary hover:text-primary-700
                                hover:bg-primary-50 transition-colors mx-1 rounded-xl">
                        <mat-icon class="!text-base flex-shrink-0 text-text-muted">{{ item.icon }}</mat-icon>
                        <span>{{ item.label }}</span>
                        @if (item.label === 'My Wallet' && wallet.balance() > 0) {
                          <span class="ml-auto text-xs font-bold text-primary-600
                                       bg-primary-50 px-2 py-0.5 rounded-full">
                            ₹{{ wallet.balance() }}
                          </span>
                        }
                        @if (item.label === 'My Wishlist' && wishlist.count() > 0) {
                          <span class="ml-auto text-xs font-bold text-terracotta-600
                                       bg-terracotta-50 px-2 py-0.5 rounded-full">
                            {{ wishlist.count() }}
                          </span>
                        }
                      </a>
                    }
                  }

                  <div class="my-1 h-px bg-sand mx-2"></div>
                  <button (click)="auth.logout(); userMenuOpen.set(false)"
                          class="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                 text-red-500 hover:bg-red-50 transition-colors mx-0 rounded-b-2xl">
                    <mat-icon class="!text-base">logout</mat-icon>
                    Sign Out
                  </button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/auth/login"
               class="hidden sm:flex items-center gap-1.5 h-10 px-3 rounded-xl
                      text-text-secondary hover:text-primary-700
                      hover:bg-primary-50 transition-all text-sm font-medium">
              <mat-icon class="!text-[1.25rem]">person_outline</mat-icon>
              <span class="hidden lg:block">Sign In</span>
            </a>
          }

          <!-- Cart CTA -->
          <a routerLink="/cart"
             class="relative flex items-center gap-2 h-10 px-4 ml-1
                    bg-primary-600 hover:bg-primary-700
                    text-white rounded-xl font-semibold text-sm
                    shadow-warm-sm hover:shadow-warm-md
                    hover:-translate-y-0.5 transition-all duration-200 group">
            <mat-icon class="!text-[1.1rem] group-hover:scale-110 transition-transform duration-200">
              shopping_bag
            </mat-icon>
            <span class="hidden sm:block">Cart</span>
            @if (cart.itemCount() > 0) {
              <span class="absolute -top-1.5 -right-1.5 min-w-[20px] h-5
                           bg-terracotta-500 text-white
                           text-[10px] font-bold rounded-full
                           flex items-center justify-center px-1 cart-badge">
                {{ cart.itemCount() > 9 ? '9+' : cart.itemCount() }}
              </span>
            }
          </a>

          <!-- Mobile hamburger -->
          <button class="md:hidden flex items-center justify-center w-10 h-10 ml-1
                         rounded-xl hover:bg-primary-50
                         text-text-secondary transition-colors"
                  (click)="mobileNavOpen.set(true)" aria-label="Open menu">
            <mat-icon>menu</mat-icon>
          </button>
        </div>
      </div>

      <!-- ── Category navigation (desktop) ─────────────────────── -->
      <nav class="hidden md:block" style="border-top:1px solid #f0f0ed">
        <div class="max-w-screen-xl mx-auto px-6">
          <ul class="flex items-center">

            @for (cat of megaMenu; track cat.slug) {
              <li class="nav-item relative group/nav">
                <a (click)="goTo('/products', { category: cat.slug })"
                   [routerLink]="['/products']" [queryParams]="{ category: cat.slug }"
                   class="nav-link flex items-center gap-1.5 px-4 py-3
                          text-sm font-medium text-text-secondary
                          hover:text-primary-700 transition-colors whitespace-nowrap"
                   style="cursor:pointer">
                  {{ cat.label }}
                  @if (cat.sub.length > 0) {
                    <mat-icon class="!text-xs transition-transform duration-200
                                     group-hover/nav:rotate-180">
                      keyboard_arrow_down
                    </mat-icon>
                  }
                </a>

                @if (cat.sub.length > 0) {
                  <div class="mega-dropdown z-dropdown">
                    <div style="background:#fff; border-radius:16px;
                                box-shadow:0 8px 32px rgba(0,0,0,.10), 0 0 0 1px rgba(0,0,0,.06);
                                padding:20px; min-width:260px;">

                      <!-- Category header -->
                      <div style="display:flex;align-items:center;gap:12px;
                                  margin-bottom:14px;padding-bottom:14px;
                                  border-bottom:1px solid #f0ede8;">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                             [style.background]="cat.color">
                          {{ cat.icon }}
                        </div>
                        <div>
                          <p class="font-semibold text-sm" style="color:#111">{{ cat.label }}</p>
                          <p class="text-xs" style="color:#999">{{ cat.sub.length }} subcategories</p>
                        </div>
                      </div>

                      <!-- Sub-links -->
                      <div [class]="cat.sub.length > 5 ? 'grid grid-cols-2 gap-0.5' : 'flex flex-col gap-0.5'">
                        @for (sub of cat.sub; track sub.slug) {
                          <a (click)="goTo('/products', { category: sub.slug })"
                             [routerLink]="['/products']" [queryParams]="{ category: sub.slug }"
                             class="dropdown-sub-link flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm transition-colors"
                             style="color:#444;text-decoration:none;cursor:pointer">
                            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background:#7a9e7e"></span>
                            {{ sub.label }}
                          </a>
                        }
                      </div>

                      <a (click)="goTo('/products', { category: cat.slug })"
                         [routerLink]="['/products']" [queryParams]="{ category: cat.slug }"
                         class="dropdown-view-all flex items-center gap-1.5 text-xs font-semibold transition-colors"
                         style="margin-top:12px;padding-top:12px;border-top:1px solid #f0ede8;
                                color:#3d6b45;text-decoration:none;cursor:pointer">
                        View all {{ cat.label }}
                        <mat-icon class="!text-xs">arrow_forward</mat-icon>
                      </a>
                    </div>
                  </div>
                }
              </li>
            }

            <!-- Sale highlight -->
            <li>
              <a (click)="goTo('/products', { sale: 'true' })"
                 [routerLink]="['/products']" [queryParams]="{ sale: 'true' }"
                 class="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold
                        text-terracotta-500 hover:text-terracotta-600 transition-colors"
                 style="cursor:pointer">
                <mat-icon class="!text-sm">local_fire_department</mat-icon>
                Sale
              </a>
            </li>

            <li class="ml-auto">
              <a (click)="goTo('/sell')"
                 [routerLink]="['/sell']"
                 class="flex items-center gap-1.5 px-4 py-3 text-sm font-medium
                        text-text-muted hover:text-primary-700 transition-colors"
                 style="cursor:pointer">
                <mat-icon class="!text-sm">storefront</mat-icon>
                Sell on Lagaao
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>

    <!-- ══════════════════════════════════════════════════════════
         MOBILE NAV DRAWER
    ══════════════════════════════════════════════════════════ -->
    @if (mobileNavOpen()) {
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-overlay md:hidden"
           (click)="mobileNavOpen.set(false)"></div>

      <div class="mobile-drawer fixed top-0 left-0 bottom-0 w-[320px]
                  bg-white z-modal flex flex-col md:hidden shadow-2xl">

        <!-- Drawer header -->
        <div class="flex items-center justify-between px-5 h-16 border-b border-sand">
          <lg-logo size="32px"></lg-logo>
          <button class="w-9 h-9 flex items-center justify-center rounded-xl
                         hover:bg-primary-50 text-text-muted transition-colors"
                  (click)="mobileNavOpen.set(false)">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Search in drawer -->
        <div class="px-4 py-3 border-b border-sand/60">
          <lg-search-bar class="w-full"></lg-search-bar>
        </div>

        <!-- Nav links -->
        <div class="flex-1 overflow-y-auto py-3 space-y-0.5 px-3">

          @for (cat of megaMenu; track cat.slug) {
            <a [routerLink]="['/products']" [queryParams]="{ category: cat.slug }"
               (click)="mobileNavOpen.set(false)"
               class="flex items-center gap-3 px-3 py-3 rounded-xl
                      text-text-secondary hover:text-primary-700
                      hover:bg-primary-50 transition-colors font-medium text-[0.9375rem]">
              <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    [style.background]="cat.color">{{ cat.icon }}</span>
              {{ cat.label }}
              <mat-icon class="!text-sm ml-auto text-text-muted">chevron_right</mat-icon>
            </a>
          }

          <div class="h-px bg-sand/60 mx-1 my-2"></div>

          <a routerLink="/orders" (click)="mobileNavOpen.set(false)"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary
                    hover:text-primary-700 hover:bg-primary-50 transition-colors text-sm">
            <mat-icon class="!text-base text-text-muted">receipt_long</mat-icon>
            My Orders
          </a>
          <a routerLink="/profile/wishlist" (click)="mobileNavOpen.set(false)"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary
                    hover:text-primary-700 hover:bg-primary-50 transition-colors text-sm">
            <mat-icon class="!text-base text-text-muted">favorite_border</mat-icon>
            Wishlist
            @if (wishlist.count() > 0) {
              <span class="ml-auto min-w-[20px] h-5 bg-terracotta-50 text-terracotta-600
                           text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                {{ wishlist.count() }}
              </span>
            }
          </a>
          <a routerLink="/cart" (click)="mobileNavOpen.set(false)"
             class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary
                    hover:text-primary-700 hover:bg-primary-50 transition-colors text-sm">
            <mat-icon class="!text-base text-text-muted">shopping_bag</mat-icon>
            Cart
            @if (cart.itemCount() > 0) {
              <span class="ml-auto min-w-[20px] h-5 bg-primary-50 text-primary-700
                           text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                {{ cart.itemCount() }}
              </span>
            }
          </a>
        </div>

        <!-- Drawer footer -->
        <div class="px-4 py-4 border-t border-sand space-y-2">
          @if (auth.isLoggedIn()) {
            <button (click)="auth.logout(); mobileNavOpen.set(false)"
                    class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                           text-red-500 hover:bg-red-50 transition-colors text-sm font-medium border border-red-100">
              <mat-icon class="!text-base">logout</mat-icon>
              Sign Out
            </button>
          } @else {
            <a routerLink="/auth/login" (click)="mobileNavOpen.set(false)"
               class="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                      bg-primary-600 text-white text-sm font-semibold
                      hover:bg-primary-700 transition-colors shadow-warm-sm">
              <mat-icon class="!text-base">person_outline</mat-icon>
              Sign In to Your Account
            </a>
          }
        </div>
      </div>
    }

    <!-- ── Flash sale banner ───────────────────────────────────────── -->
    <lg-flash-sale-banner></lg-flash-sale-banner>

    <!-- ══════════════════════════════════════════════════════════
         PAGE CONTENT
    ══════════════════════════════════════════════════════════ -->
    <main class="min-h-screen" style="background: var(--bg-page)">
      <router-outlet></router-outlet>
    </main>

    <!-- ══════════════════════════════════════════════════════════
         FOOTER  — matches reference: light bg, logo+social left,
         4 link columns right, copyright bottom centre
    ══════════════════════════════════════════════════════════ -->
    <footer style="background: var(--bg-page); padding: 16px 16px 0">

      <!-- ── Footer card ─────────────────────────────────────── -->
      <div style="background:#fff; border-radius:20px 20px 0 0;
                  box-shadow:0 -2px 16px rgba(0,0,0,.04);
                  overflow:hidden">

        <!-- ── Main grid ────────────────────────────────────── -->
        <div class="max-w-screen-xl mx-auto px-8 pt-12 pb-8">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-10">

            <!-- Brand + social column -->
            <div class="md:col-span-1">
              <!-- Logo -->
              <div class="mb-5">
                <lg-logo size="34px"></lg-logo>
              </div>
              <p class="text-sm leading-relaxed mb-6"
                 style="color:#444;max-width:200px">
                India's most loved plant store. Bringing nature home, one plant at a time.
              </p>
              <!-- Follow us -->
              <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color:#333">
                Follow us
              </p>
              <div class="flex gap-2.5">
                @for (social of socials; track social.label) {
                  <a [href]="social.url"
                     [attr.target]="social.url.startsWith('http') ? '_blank' : null"
                     [attr.rel]="social.url.startsWith('http') ? 'noopener noreferrer' : null"
                     class="w-9 h-9 rounded-full flex items-center justify-center
                            transition-all hover:-translate-y-0.5"
                     style="background:#f0f0ed; color:#111"
                     [attr.aria-label]="social.label">
                    <span style="width:16px;height:16px;display:flex;align-items:center;justify-content:center"
                          [innerHTML]="safe(social.svg)"></span>
                  </a>
                }
              </div>
            </div>

            <!-- Link columns -->
            @for (col of footerLinks; track col.title) {
              <div>
                <h4 class="text-xs font-bold uppercase tracking-widest mb-5"
                    style="color:#111;letter-spacing:.1em">
                  {{ col.title }}
                </h4>
                <ul class="space-y-3">
                  @for (link of col.links; track link.label) {
                    <li>
                      <a [routerLink]="link.route"
                         [queryParams]="link.params ?? null"
                         class="footer-link text-sm transition-colors"
                         style="text-decoration:none">
                        {{ link.label }}
                      </a>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>

        <!-- ── Bottom bar ──────────────────────────────────── -->
        <div style="border-top:1px solid #f0f0ed; padding:16px 32px;
                    display:flex; align-items:center; justify-content:center">
          <p class="text-xs" style="color:#666; text-align:center">
            &copy;Copyright {{ year }} Lagaao.com. All rights reserved.
          </p>
        </div>

      </div>
    </footer>

    <!-- ── Toast + AI ─────────────────────────────────────────────── -->
    <lg-toast-container></lg-toast-container>
    <lg-ai-chat></lg-ai-chat>
  `,
})
export class MainLayoutComponent implements OnInit {
  readonly theme     = inject(ThemeService);
  readonly loading   = inject(LoadingService);
  readonly auth      = inject(AuthService);
  readonly cart      = inject(CartService);
  readonly wishlist  = inject(WishlistService);
  readonly wallet    = inject(WalletService);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #el        = inject(ElementRef);
  readonly #router    = inject(Router);
  readonly year      = new Date().getFullYear();

  /** Explicit programmatic navigation — used alongside [routerLink] for SSR reliability */
  goTo(path: string, params?: Record<string, string>): void {
    this.#router.navigate([path], params ? { queryParams: params } : {});
  }
  readonly scrolled      = signal(false);
  readonly userMenuOpen  = signal(false);
  readonly mobileNavOpen = signal(false);

  safe(html: string): SafeHtml { return this.#sanitizer.bypassSecurityTrustHtml(html); }

  toggleUserMenu(): void { this.userMenuOpen.update(v => !v); }

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 10); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.#el.nativeElement.querySelector('.user-menu-wrap')?.contains(e.target as Node)) {
      this.userMenuOpen.set(false);
    }
  }

  // ── User menu items ──────────────────────────────────────────
  readonly userMenuItems = [
    { label: 'My Profile',       route: '/profile',          icon: 'person_outline',          divider: false, adminOnly: false },
    { label: 'My Orders',        route: '/orders',           icon: 'receipt_long',             divider: false, adminOnly: false },
    { label: 'My Wallet',        route: '/profile/wallet',   icon: 'account_balance_wallet',   divider: false, adminOnly: false },
    { label: 'My Wishlist',      route: '/profile/wishlist', icon: 'favorite_border',          divider: false, adminOnly: false },
    { label: 'Loyalty Points',   route: '/profile/loyalty',  icon: 'stars',                   divider: false, adminOnly: false },
    { label: 'Affiliate Program',route: '/profile/affiliate',icon: 'campaign',                divider: false, adminOnly: false },
    { label: 'Support',          route: '/profile/support',  icon: 'support_agent',           divider: false, adminOnly: false },
    { label: 'Security & 2FA',   route: '/profile/security', icon: 'security',                divider: false, adminOnly: false },
    { label: 'Vendor Dashboard', route: '/vendor',           icon: 'storefront',              divider: true,  adminOnly: true  },
  ];

  // ── Mega menu ─────────────────────────────────────────────────
  readonly megaMenu: MegaMenuCategory[] = [
    {
      label: 'Plants', slug: 'plants', icon: '🌿', color: '#d8ecdb',
      sub: [
        { label: 'Indoor Plants',    slug: 'indoor-plants' },
        { label: 'Outdoor Plants',   slug: 'outdoor-plants' },
        { label: 'Flowering Plants', slug: 'flowering-plants' },
        { label: 'Air Purifying',    slug: 'air-purifying' },
        { label: 'Low Maintenance',  slug: 'low-maintenance' },
        { label: 'Succulents',       slug: 'succulents' },
        { label: 'Hanging Plants',   slug: 'hanging-plants' },
        { label: 'Pet Friendly',     slug: 'pet-friendly' },
        { label: 'Medicinal Plants', slug: 'medicinal' },
        { label: 'XL Plants',        slug: 'xl-plants' },
      ],
    },
    {
      label: 'Seeds', slug: 'seeds', icon: '🌱', color: '#faf8e8',
      sub: [
        { label: 'Flower Seeds',    slug: 'flower-seeds' },
        { label: 'Vegetable Seeds', slug: 'vegetable-seeds' },
        { label: 'Herb Seeds',      slug: 'herb-seeds' },
        { label: 'Fruit Seeds',     slug: 'fruit-seeds' },
        { label: 'Microgreens',     slug: 'microgreens' },
        { label: 'Seed Kits',       slug: 'seed-kits' },
        { label: 'Bulbs',           slug: 'bulbs' },
      ],
    },
    {
      label: 'Pots & Planters', slug: 'pots-planters', icon: '🪴', color: '#fdf3ef',
      sub: [
        { label: 'Ceramic Pots',        slug: 'ceramic-pots' },
        { label: 'Plastic Pots',        slug: 'plastic-pots' },
        { label: 'Hanging Planters',    slug: 'hanging-planters' },
        { label: 'Wooden Pots',         slug: 'wooden-pots' },
        { label: 'Metal Planters',      slug: 'metal-planters' },
        { label: 'Plant Stands',        slug: 'plant-stands' },
        { label: 'Decorative Planters', slug: 'decorative-planters' },
      ],
    },
    {
      label: 'Plant Care', slug: 'plant-care', icon: '🧪', color: '#f4f8f4',
      sub: [
        { label: 'Potting Mix',  slug: 'potting-mix' },
        { label: 'Fertilizers',  slug: 'fertilizers' },
        { label: 'Garden Tools', slug: 'garden-tools' },
        { label: 'Watering',     slug: 'watering-tools' },
        { label: 'Pest Control', slug: 'pest-control' },
        { label: 'Pebbles',      slug: 'pebbles' },
        { label: 'Garden Decor', slug: 'garden-decor' },
      ],
    },
    {
      label: 'Gifts & Combos', slug: 'gifts-combos', icon: '🎁', color: '#fdf3ef',
      sub: [
        { label: 'Plant Gifts',    slug: 'plant-gifts' },
        { label: 'Festival Gifts', slug: 'festival-gifts' },
        { label: 'Office Gifts',   slug: 'office-gifts' },
        { label: 'Combo Packs',    slug: 'combo-packs' },
      ],
    },
    { label: 'New Arrivals', slug: 'new-arrivals', icon: '✨', color: '#f0f7f1', sub: [] },
  ];

  // ── Footer links ──────────────────────────────────────────────
  readonly footerLinks: { title: string; links: { label: string; route: string; params?: Record<string,string> }[] }[] = [
    {
      title: 'Shop',
      links: [
        { label: 'All Plants',      route: '/products' },
        { label: 'Seeds',           route: '/products', params: { category: 'seeds' } },
        { label: 'Pots & Planters', route: '/products', params: { category: 'pots-planters' } },
        { label: 'Plant Care',      route: '/products', params: { category: 'plant-care' } },
        { label: 'Gifts & Combos',  route: '/products', params: { category: 'gifts-combos' } },
        { label: 'New Arrivals',    route: '/products', params: { category: 'new-arrivals' } },
      ],
    },
    {
      title: 'Help',
      links: [
        { label: 'Track Order',       route: '/orders' },
        { label: 'Returns & Refunds', route: '/pages/returns' },
        { label: 'Shipping Info',     route: '/pages/shipping' },
        { label: 'Plant Care Guide',  route: '/pages/plant-care-guide' },
        { label: 'Contact Us',        route: '/pages/contact' },
        { label: 'FAQs',              route: '/pages/faq' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Lagaao',  route: '/pages/about' },
        { label: 'Blog',          route: '/blog' },
        { label: 'Careers',       route: '/pages/careers' },
        { label: 'Sell on Lagaao',route: '/sell' },
        { label: 'Vendor Login',  route: '/vendor' },
      ],
    },
  ];

  // ── Social links ──────────────────────────────────────────────
  readonly socials = [
    {
      label: 'Instagram', url: 'https://www.instagram.com/lagaao.official/',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    },
    {
      label: 'WhatsApp', url: 'https://wa.me/919834656144',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
    },
    {
      label: 'YouTube', url: 'https://youtube.com',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    },
    {
      label: 'Email', url: 'mailto:info@lagaao.com',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
    },
  ];

  ngOnInit(): void {
    this.cart.load().subscribe();
    this.wishlist.load();
    this.wallet.loadBalance();
  }
}

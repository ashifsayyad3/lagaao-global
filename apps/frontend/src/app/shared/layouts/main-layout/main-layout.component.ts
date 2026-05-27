import {
  Component, ChangeDetectionStrategy, inject, OnInit, signal, HostListener, ElementRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterOutlet, RouterLink } from '@angular/router';
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
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher.component';

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
            ThemeSwitcherComponent],
  template: `
    <!-- ── Announcement / Utility bar ─────────────────────────── -->
    <lg-announcement-bar></lg-announcement-bar>

    <!-- ── Top utility strip (hidden on mobile) ────────────────── -->
    <div class="hidden md:block bg-primary-900 text-xs text-primary-100 py-1.5">
      <div class="max-w-screen-xl mx-auto px-6 flex items-center justify-between">
        <div class="flex items-center gap-5">
          <span class="flex items-center gap-1.5">
            <mat-icon class="!text-sm text-primary-300">local_shipping</mat-icon>
            Free delivery on orders above ₹499
          </span>
          <span class="text-primary-500">|</span>
          <span class="flex items-center gap-1.5">
            <mat-icon class="!text-sm text-primary-300">verified_user</mat-icon>
            100% healthy plant guarantee
          </span>
        </div>
        <div class="flex items-center gap-5">
          <a routerLink="/orders" class="flex items-center gap-1 hover:text-white transition-colors">
            <mat-icon class="!text-sm">local_shipping</mat-icon> Track Order
          </a>
          <a routerLink="/pages/contact" class="flex items-center gap-1 hover:text-white transition-colors">
            <mat-icon class="!text-sm">support_agent</mat-icon> Help
          </a>
          <lg-theme-switcher variant="icon" />
        </div>
      </div>
    </div>

    <!-- ── Progress bar ────────────────────────────────────────── -->
    @if (loading.isLoading()) {
      <div class="fixed top-0 left-0 right-0 h-0.5 z-[var(--z-toast)] overflow-hidden">
        <div class="h-full bg-terracotta-500 animate-pulse w-full"></div>
      </div>
    }

    <!-- ── Main sticky header ──────────────────────────────────── -->
    <header
      class="sticky top-0 z-[var(--z-sticky)] bg-white dark:bg-surface-900 transition-shadow duration-300"
      [class.shadow-warm-md]="scrolled()"
      [class.border-b]="!scrolled()"
      [class.border-sand]="!scrolled()"
    >
      <div class="max-w-screen-xl mx-auto px-4 md:px-6 h-16 flex items-center gap-4 lg:gap-6">

        <!-- Logo -->
        <lg-logo size="40px"></lg-logo>

        <!-- Search (expanded on desktop) -->
        <div class="flex-1 max-w-xl hidden md:block">
          <lg-search-bar class="w-full"></lg-search-bar>
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-1 ml-auto md:ml-0 flex-shrink-0">

          <!-- Theme switcher (desktop) -->
          <div class="hidden md:flex">
            <lg-theme-switcher variant="icon" />
          </div>

          <!-- Mobile search toggle -->
          <button class="md:hidden w-9 h-9 flex items-center justify-content rounded-lg
                         hover:bg-primary-50 text-primary-700 transition-colors">
            <mat-icon>search</mat-icon>
          </button>

          <!-- Wishlist -->
          <a routerLink="/profile/wishlist"
             class="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg
                    text-text-secondary hover:text-primary-600 hover:bg-primary-50
                    dark:hover:bg-primary-900/30 transition-all text-sm font-medium group"
             style="position:relative">
            <mat-icon class="!text-xl group-hover:scale-110 transition-transform">
              {{ wishlist.count() > 0 ? 'favorite' : 'favorite_border' }}
            </mat-icon>
            @if (wishlist.count() > 0) {
              <span style="position:absolute;top:4px;right:4px;min-width:16px;height:16px;
                           background:var(--color-primary);color:#fff;border-radius:99px;
                           font-size:.625rem;font-weight:700;display:flex;align-items:center;
                           justify-content:center;padding:0 3px;line-height:1">
                {{ wishlist.count() > 9 ? '9+' : wishlist.count() }}
              </span>
            }
            <span class="hidden lg:block">Wishlist</span>
          </a>

          <!-- Account -->
          @if (auth.isLoggedIn()) {
            <div class="relative user-menu-wrap">
              <button (click)="toggleUserMenu()"
                      class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-text-secondary
                             hover:text-primary-600 hover:bg-primary-50 transition-all text-sm font-medium group">
                <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center
                            text-primary-700 font-bold text-xs group-hover:bg-primary-200 transition-colors">
                  {{ (auth.user()?.name ?? '?')[0].toUpperCase() }}
                </div>
                <span class="hidden lg:block">{{ (auth.user()?.name?.split(' ') ?? [''])[0] }}</span>
                <mat-icon class="!text-sm transition-transform duration-200"
                          [style.transform]="userMenuOpen() ? 'rotate(180deg)' : 'rotate(0deg)'">
                  expand_more
                </mat-icon>
              </button>

              @if (userMenuOpen()) {
                <div class="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-surface-900
                            border border-sand dark:border-surface-700 rounded-xl shadow-warm-xl
                            py-1 z-dropdown animate-slide-down">
                  <a routerLink="/profile" (click)="userMenuOpen.set(false)"
                     class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary
                            hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-colors">
                    <mat-icon class="!text-base">person_outline</mat-icon>
                    My Profile
                  </a>
                  <a routerLink="/orders" (click)="userMenuOpen.set(false)"
                     class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary
                            hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-colors">
                    <mat-icon class="!text-base">receipt_long</mat-icon>
                    My Orders
                  </a>
                  <a routerLink="/profile/wallet" (click)="userMenuOpen.set(false)"
                     class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary
                            hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-colors">
                    <mat-icon class="!text-base">account_balance_wallet</mat-icon>
                    My Wallet
                    @if (wallet.balance() > 0) {
                      <span style="margin-left:auto;font-size:.6875rem;font-weight:700;
                                   color:var(--color-primary);background:var(--color-primary-50);
                                   padding:1px 7px;border-radius:99px">
                        ₹{{ wallet.balance() }}
                      </span>
                    }
                  </a>
                  <a routerLink="/profile/support" (click)="userMenuOpen.set(false)"
                     class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary
                            hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-colors">
                    <mat-icon class="!text-base">support_agent</mat-icon>
                    Support
                  </a>
                  <a routerLink="/profile/wishlist" (click)="userMenuOpen.set(false)"
                     class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary
                            hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-colors">
                    <mat-icon class="!text-base">favorite_border</mat-icon>
                    My Wishlist
                    @if (wishlist.count() > 0) {
                      <span style="margin-left:auto;background:var(--color-primary-50);
                                   color:var(--color-primary);font-size:.6875rem;font-weight:700;
                                   padding:1px 7px;border-radius:99px">
                        {{ wishlist.count() }}
                      </span>
                    }
                  </a>
                  @if (auth.user()?.role === 'vendor' || auth.user()?.role === 'super_admin') {
                    <a routerLink="/vendor" (click)="userMenuOpen.set(false)"
                       class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary
                              hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-colors">
                      <mat-icon class="!text-base">store</mat-icon>
                      Vendor Dashboard
                    </a>
                  }
                  <div class="my-1 h-px bg-sand dark:bg-surface-700"></div>
                  <button (click)="auth.logout(); userMenuOpen.set(false)"
                          class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500
                                 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <mat-icon class="!text-base">logout</mat-icon>
                    Sign Out
                  </button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/auth/login"
               class="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg
                      text-text-secondary hover:text-primary-600 hover:bg-primary-50
                      transition-all text-sm font-medium">
              <mat-icon class="!text-xl">person_outline</mat-icon>
              <span class="hidden lg:block">Sign In</span>
            </a>
          }

          <!-- Cart -->
          <a routerLink="/cart"
             class="relative flex items-center gap-1.5 px-3 py-2 rounded-lg
                    bg-primary-500 hover:bg-primary-600 text-white
                    transition-all text-sm font-semibold shadow-warm-sm hover:shadow-warm-md
                    hover:-translate-y-0.5 group">
            <mat-icon class="!text-xl group-hover:scale-110 transition-transform">shopping_bag</mat-icon>
            <span class="hidden sm:block">Cart</span>
            @if (cart.itemCount() > 0) {
              <span class="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-terracotta-500
                           text-white text-xs font-bold rounded-full flex items-center
                           justify-center px-1 animate-scale-in">
                {{ cart.itemCount() > 9 ? '9+' : cart.itemCount() }}
              </span>
            }
          </a>
        </div>
      </div>

      <!-- ── Mega menu navigation ────────────────────────────── -->
      <nav class="border-t border-sand dark:border-surface-800 hidden md:block">
        <div class="max-w-screen-xl mx-auto px-6">
          <ul class="flex items-center gap-0">
            @for (cat of megaMenu; track cat.slug) {
              <li class="relative group/nav">
                <a
                  [routerLink]="['/products']"
                  [queryParams]="{ category: cat.slug }"
                  class="flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium text-text-secondary
                         hover:text-primary-600 dark:hover:text-primary-300 transition-colors
                         border-b-2 border-transparent group-hover/nav:border-primary-500
                         group-hover/nav:text-primary-600 whitespace-nowrap"
                >
                  <span>{{ cat.label }}</span>
                  @if (cat.sub.length > 0) {
                    <mat-icon class="!text-sm transition-transform group-hover/nav:rotate-180 duration-200">
                      expand_more
                    </mat-icon>
                  }
                </a>

                <!-- Mega dropdown -->
                @if (cat.sub.length > 0) {
                  <div class="absolute top-full left-0 pt-0 opacity-0 invisible
                              group-hover/nav:opacity-100 group-hover/nav:visible
                              transition-all duration-200 z-dropdown">
                    <div class="mt-0 bg-white dark:bg-surface-900 rounded-b-xl rounded-tr-xl
                                shadow-warm-xl border border-sand dark:border-surface-700
                                p-5 min-w-[220px] animate-slide-down">
                      <!-- Category header -->
                      <div class="flex items-center gap-2 mb-3 pb-3 border-b border-linen dark:border-surface-800">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                             [style.background]="cat.color">
                          {{ cat.icon }}
                        </div>
                        <div>
                          <p class="font-semibold text-text-primary text-sm">{{ cat.label }}</p>
                          <p class="text-xs text-text-muted">{{ cat.sub.length }} subcategories</p>
                        </div>
                      </div>
                      <!-- Links grid -->
                      <div class="grid grid-cols-1 gap-0.5">
                        @for (sub of cat.sub; track sub.slug) {
                          <a
                            [routerLink]="['/products']"
                            [queryParams]="{ category: sub.slug }"
                            class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm
                                   text-text-secondary hover:text-primary-600
                                   hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                          >
                            <mat-icon class="!text-sm text-sage-400">arrow_forward_ios</mat-icon>
                            {{ sub.label }}
                          </a>
                        }
                      </div>
                      <!-- View all -->
                      <a [routerLink]="['/products']" [queryParams]="{ category: cat.slug }"
                         class="mt-3 pt-3 border-t border-linen dark:border-surface-800 flex items-center
                                gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700
                                transition-colors">
                        View all {{ cat.label }}
                        <mat-icon class="!text-xs">east</mat-icon>
                      </a>
                    </div>
                  </div>
                }
              </li>
            }

            <!-- Sale highlight -->
            <li class="ml-2">
              <a routerLink="/products" [queryParams]="{ sale: 'true' }"
                 class="flex items-center gap-1.5 px-3.5 py-3 text-sm font-semibold
                        text-terracotta-500 hover:text-terracotta-600 transition-colors">
                <mat-icon class="!text-base">local_fire_department</mat-icon>
                Sale
              </a>
            </li>

            <li class="ml-auto">
              <a routerLink="/sell"
                 class="flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium
                        text-text-muted hover:text-primary-600 transition-colors">
                <mat-icon class="!text-base">store</mat-icon>
                Sell on Lagaao
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>

    <!-- ── Page content ────────────────────────────────────────── -->
    <main class="min-h-screen bg-[var(--bg-subtle)]">
      <router-outlet></router-outlet>
    </main>

    <!-- ── Footer ──────────────────────────────────────────────── -->
    <footer class="bg-primary-900 text-primary-100">
      <!-- Newsletter banner -->
      <div class="bg-primary-800 py-10">
        <div class="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row items-center
                    justify-between gap-6">
          <div>
            <p class="font-display text-xl font-medium text-white mb-1">
              Get growing tips & exclusive offers
            </p>
            <p class="text-primary-300 text-sm">Join 50,000+ plant lovers. No spam, ever.</p>
          </div>
          <div class="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="Your email address"
              class="flex-1 md:w-64 px-4 py-2.5 rounded-lg bg-white/10 border border-primary-600
                     text-white placeholder:text-primary-400 text-sm outline-none
                     focus:border-primary-400 transition-colors"
            />
            <button class="px-5 py-2.5 bg-terracotta-500 hover:bg-terracotta-400 text-white
                           font-semibold text-sm rounded-lg transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <!-- Links grid -->
      <div class="max-w-screen-xl mx-auto px-6 py-12">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
          <!-- Brand -->
          <div class="col-span-2 md:col-span-1">
            <div class="flex items-center gap-2 mb-4">
              <lg-logo size="36px" variant="white"></lg-logo>
            </div>
            <p class="text-sm text-primary-300 leading-relaxed mb-4">
              India's most loved plant store. Bringing nature closer to you, one plant at a time.
            </p>
            <div class="flex gap-3">
              @for (social of socials; track social.label) {
                <a [href]="social.url" [attr.target]="social.url.startsWith('http') ? '_blank' : null"
                   [attr.rel]="social.url.startsWith('http') ? 'noopener noreferrer' : null"
                   class="w-9 h-9 rounded-full bg-primary-700 hover:bg-primary-500
                          flex items-center justify-center transition-colors"
                   [attr.aria-label]="social.label">
                  <span style="width:18px;height:18px;display:flex;align-items:center;justify-content:center"
                        [innerHTML]="safe(social.svg)"></span>
                </a>
              }
            </div>
          </div>

          @for (col of footerLinks; track col.title) {
            <div>
              <h4 class="font-semibold text-white text-sm uppercase tracking-wider mb-4">
                {{ col.title }}
              </h4>
              <ul class="space-y-2">
                @for (link of col.links; track link.label) {
                  <li>
                    <a [routerLink]="link.route"
                       class="text-sm text-primary-300 hover:text-white transition-colors">
                      {{ link.label }}
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="border-t border-primary-800 py-5">
        <div class="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row justify-between
                    items-center gap-3 text-xs text-primary-400">
          <p>&copy; {{ year }} Lagaao.com — All rights reserved</p>
          <div class="flex items-center gap-4 flex-wrap justify-center">
            <a routerLink="/pages/privacy" class="hover:text-primary-200 transition-colors">Privacy Policy</a>
            <a routerLink="/pages/terms" class="hover:text-primary-200 transition-colors">Terms of Use</a>
            <a routerLink="/pages/shipping" class="hover:text-primary-200 transition-colors">Shipping Policy</a>
            <a routerLink="/pages/returns" class="hover:text-primary-200 transition-colors">Returns</a>
          </div>
          <div class="flex items-center gap-1.5">
            <mat-icon class="!text-sm text-primary-400">lock</mat-icon>
            <span>Secure & Trusted</span>
          </div>
        </div>
      </div>
    </footer>

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
  readonly year      = new Date().getFullYear();
  readonly scrolled      = signal(false);
  readonly userMenuOpen  = signal(false);

  safe(html: string): SafeHtml { return this.#sanitizer.bypassSecurityTrustHtml(html); }

  toggleUserMenu(): void { this.userMenuOpen.update(v => !v); }

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 20); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.#el.nativeElement.querySelector('.user-menu-wrap')?.contains(e.target as Node)) {
      this.userMenuOpen.set(false);
    }
  }

  readonly megaMenu: MegaMenuCategory[] = [
    {
      label: 'Plants', slug: 'plants', icon: '🌿', color: '#d8ecdb',
      sub: [
        { label: 'Indoor Plants',     slug: 'indoor-plants' },
        { label: 'Outdoor Plants',    slug: 'outdoor-plants' },
        { label: 'Flowering Plants',  slug: 'flowering-plants' },
        { label: 'Air Purifying',     slug: 'air-purifying' },
        { label: 'Low Maintenance',   slug: 'low-maintenance' },
        { label: 'Succulents',        slug: 'succulents' },
        { label: 'Hanging Plants',    slug: 'hanging-plants' },
        { label: 'Pet Friendly',      slug: 'pet-friendly' },
        { label: 'Medicinal Plants',  slug: 'medicinal' },
        { label: 'XL Plants',         slug: 'xl-plants' },
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
        { label: 'Ceramic Pots',       slug: 'ceramic-pots' },
        { label: 'Plastic Pots',       slug: 'plastic-pots' },
        { label: 'Hanging Planters',   slug: 'hanging-planters' },
        { label: 'Wooden Pots',        slug: 'wooden-pots' },
        { label: 'Metal Planters',     slug: 'metal-planters' },
        { label: 'Plant Stands',       slug: 'plant-stands' },
        { label: 'Decorative Planters',slug: 'decorative-planters' },
      ],
    },
    {
      label: 'Plant Care', slug: 'plant-care', icon: '🧪', color: '#f4f8f4',
      sub: [
        { label: 'Potting Mix',   slug: 'potting-mix' },
        { label: 'Fertilizers',   slug: 'fertilizers' },
        { label: 'Garden Tools',  slug: 'garden-tools' },
        { label: 'Watering',      slug: 'watering-tools' },
        { label: 'Pest Control',  slug: 'pest-control' },
        { label: 'Pebbles',       slug: 'pebbles' },
        { label: 'Garden Decor',  slug: 'garden-decor' },
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

  readonly footerLinks = [
    {
      title: 'Shop',
      links: [
        { label: 'All Plants',        route: '/products?category=plants' },
        { label: 'Seeds',             route: '/products?category=seeds' },
        { label: 'Pots & Planters',   route: '/products?category=pots-planters' },
        { label: 'Plant Care',        route: '/products?category=plant-care' },
        { label: 'Gifts & Combos',    route: '/products?category=gifts-combos' },
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

  readonly socials = [
    {
      label: 'Instagram', url: 'https://www.instagram.com/lagaao.official/',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    },
    {
      label: 'Email', url: 'mailto:info@lagaao.com',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#fff"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
    },
    {
      label: 'YouTube', url: 'https://youtube.com',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#fff"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    },
    {
      label: 'WhatsApp', url: 'https://wa.me/919834656144',
      svg: `<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
    },
  ];

  ngOnInit(): void {
    this.cart.load().subscribe();
    this.wishlist.load();
    this.wallet.loadBalance();
  }
}

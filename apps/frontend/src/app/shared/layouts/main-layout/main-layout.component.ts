import {
  Component, ChangeDetectionStrategy, inject, OnInit, signal, HostListener,
} from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastContainerComponent } from '../../components/toast/toast.component';
import { LoadingService } from '../../../core/services/loading.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { AnnouncementBarComponent } from '../../components/announcement-bar/announcement-bar.component';
import { AiChatComponent } from '../../components/ai-chat/ai-chat.component';

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
            ToastContainerComponent, SearchBarComponent, AnnouncementBarComponent, AiChatComponent],
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
          <button (click)="theme.toggle()"
                  class="flex items-center gap-1 hover:text-white transition-colors">
            <mat-icon class="!text-sm">{{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
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
        <a routerLink="/" class="flex-shrink-0 group">
          <img
            src="/logo.png"
            alt="Lagaao — Plants & Garden"
            class="h-10 w-auto object-contain transition-transform duration-300
                   group-hover:scale-105 drop-shadow-sm"
            style="max-width: 148px;"
          />
        </a>

        <!-- Search (expanded on desktop) -->
        <div class="flex-1 max-w-xl hidden md:block">
          <lg-search-bar class="w-full"></lg-search-bar>
        </div>

        <!-- Right actions -->
        <div class="flex items-center gap-1 ml-auto md:ml-0 flex-shrink-0">

          <!-- Mobile search toggle -->
          <button class="md:hidden w-9 h-9 flex items-center justify-center rounded-lg
                         hover:bg-primary-50 text-primary-700 transition-colors">
            <mat-icon>search</mat-icon>
          </button>

          <!-- Wishlist -->
          <a routerLink="/wishlist"
             class="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg
                    text-text-secondary hover:text-primary-600 hover:bg-primary-50
                    dark:hover:bg-primary-900/30 transition-all text-sm font-medium group">
            <mat-icon class="!text-xl group-hover:scale-110 transition-transform">favorite_border</mat-icon>
            <span class="hidden lg:block">Wishlist</span>
          </a>

          <!-- Account -->
          @if (auth.isLoggedIn()) {
            <a routerLink="/profile"
               class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-text-secondary
                      hover:text-primary-600 hover:bg-primary-50 transition-all text-sm font-medium group">
              <div class="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center
                          text-primary-700 font-bold text-xs group-hover:bg-primary-200 transition-colors">
                {{ (auth.user()?.name ?? '?')[0].toUpperCase() }}
              </div>
              <span class="hidden lg:block">{{ (auth.user()?.name?.split(' ') ?? [''])[0] }}</span>
            </a>
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
              <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <span class="text-white font-bold">L</span>
              </div>
              <span class="font-display font-semibold text-lg text-white">lagaao</span>
            </div>
            <p class="text-sm text-primary-300 leading-relaxed mb-4">
              India's most loved plant store. Bringing nature closer to you, one plant at a time.
            </p>
            <div class="flex gap-3">
              @for (social of socials; track social.icon) {
                <a [href]="social.url"
                   class="w-8 h-8 rounded-full bg-primary-700 hover:bg-primary-500
                          flex items-center justify-center transition-colors">
                  <mat-icon class="!text-sm text-primary-200">{{ social.icon }}</mat-icon>
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
  readonly theme   = inject(ThemeService);
  readonly loading = inject(LoadingService);
  readonly auth    = inject(AuthService);
  readonly cart    = inject(CartService);
  readonly year    = new Date().getFullYear();
  readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 20); }

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
        { label: 'Plant Care Guide',  route: '/blog' },
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
        { label: 'Vendor Login',  route: '/vendor/dashboard' },
      ],
    },
  ];

  readonly socials = [
    { icon: 'photo_camera',   url: '#' },
    { icon: 'facebook',       url: '#' },
    { icon: 'alternate_email',url: '#' },
    { icon: 'play_circle',    url: '#' },
  ];

  ngOnInit(): void {
    this.cart.load().subscribe();
  }
}

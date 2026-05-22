import {
  Component, ChangeDetectionStrategy, inject, OnInit
} from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastContainerComponent } from '../../components/toast/toast.component';
import { LoadingService } from '../../../core/services/loading.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { AnnouncementBarComponent } from '../../components/announcement-bar/announcement-bar.component';
import { AiChatComponent } from '../../components/ai-chat/ai-chat.component';

@Component({
  selector: 'lg-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet, RouterLink,
    MatIconModule, MatButtonModule,
    ToastContainerComponent, SearchBarComponent, AnnouncementBarComponent, AiChatComponent,
  ],
  template: `
    <!-- Announcement bar -->
    <lg-announcement-bar></lg-announcement-bar>

    <!-- Global progress bar -->
    @if (loading.isLoading()) {
      <div class="fixed top-0 left-0 right-0 h-0.5 bg-accent z-[overlay]"></div>
    }

    <!-- Flipkart-style blue sticky header -->
    <header class="fixed top-0 left-0 right-0 z-sticky bg-primary-500 shadow-md"
            style="background: linear-gradient(to right, #2874f0, #1a66e0);">
      <div class="max-w-screen-2xl mx-auto px-3 md:px-6 h-14 flex items-center gap-3 md:gap-5">

        <!-- Logo -->
        <a routerLink="/" class="flex flex-col items-start flex-shrink-0 group min-w-[80px]">
          <span class="text-white font-bold text-xl tracking-tight leading-tight font-display">
            lagaao
          </span>
          <span class="text-[10px] text-yellow-300 italic leading-none font-medium hidden sm:block">
            Explore Plus <span class="text-yellow-400">✦</span>
          </span>
        </a>

        <!-- Search bar -->
        <div class="flex-1 max-w-2xl">
          <lg-search-bar class="w-full"></lg-search-bar>
        </div>

        <!-- Nav actions -->
        <nav class="flex items-center gap-1 flex-shrink-0">

          <!-- Login / Profile -->
          @if (auth.isLoggedIn()) {
            <a routerLink="/profile"
               class="flex items-center gap-1.5 px-3 py-1.5 rounded text-white text-sm font-semibold
                      hover:bg-white/10 transition-colors">
              <mat-icon class="!text-lg">account_circle</mat-icon>
              <span class="hidden md:block max-w-[80px] truncate">{{ auth.user()?.name }}</span>
            </a>
          } @else {
            <a routerLink="/auth/login"
               class="flex items-center gap-1 px-4 py-1.5 rounded text-primary-600 font-bold text-sm
                      bg-white hover:bg-gray-50 transition-colors min-w-[80px] justify-center">
              Login
            </a>
          }

          <!-- Become a Seller -->
          <a routerLink="/sell"
             class="hidden md:flex items-center gap-1 px-3 py-1.5 rounded text-white text-sm font-medium
                    hover:bg-white/10 transition-colors">
            <mat-icon class="!text-base">store</mat-icon>
            <span>Sell</span>
          </a>

          <!-- Dark mode toggle -->
          <button
            class="hidden md:flex items-center justify-center w-9 h-9 rounded
                   text-white hover:bg-white/10 transition-colors"
            (click)="theme.toggle()"
          >
            <mat-icon class="!text-xl">{{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <!-- Wishlist -->
          <a routerLink="/wishlist"
             class="hidden md:flex items-center gap-1 px-3 py-1.5 rounded text-white text-sm font-medium
                    hover:bg-white/10 transition-colors">
            <mat-icon class="!text-xl">favorite_border</mat-icon>
            <span class="hidden lg:block">Wishlist</span>
          </a>

          <!-- Cart -->
          <a routerLink="/cart"
             class="flex items-center gap-1.5 px-3 py-1.5 rounded text-white text-sm font-medium
                    hover:bg-white/10 transition-colors relative">
            <div class="relative">
              <mat-icon class="!text-xl">shopping_cart</mat-icon>
              @if (cart.itemCount() > 0) {
                <span class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-accent text-white
                             text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {{ cart.itemCount() > 9 ? '9+' : cart.itemCount() }}
                </span>
              }
            </div>
            <span class="hidden lg:block">Cart</span>
          </a>

          <!-- Admin -->
          @if (auth.user()?.role === 'admin' || auth.user()?.role === 'super_admin') {
            <a routerLink="/admin/dashboard"
               class="hidden md:flex items-center gap-1 px-3 py-1.5 rounded text-white text-sm
                      hover:bg-white/10 transition-colors">
              <mat-icon class="!text-base">admin_panel_settings</mat-icon>
            </a>
          }
        </nav>
      </div>
    </header>

    <!-- Category nav strip -->
    <div class="fixed top-14 left-0 right-0 z-[99] bg-primary-600 hidden md:block border-b border-primary-700"
         style="background:#1a5dc8;">
      <div class="max-w-screen-2xl mx-auto px-6 flex items-center gap-6 h-9 overflow-x-auto hide-scrollbar">
        @for (cat of navCategories; track cat.label) {
          <a [routerLink]="['/products']" [queryParams]="{ category: cat.slug }"
             class="text-white/90 hover:text-white text-xs font-medium whitespace-nowrap
                    transition-colors hover:underline underline-offset-2 flex items-center gap-1">
            <span>{{ cat.icon }}</span> {{ cat.label }}
          </a>
        }
      </div>
    </div>

    <!-- Main content -->
    <main class="pt-14 md:pt-[92px] min-h-screen bg-[#F1F3F6] dark:bg-[#16213e]">
      <router-outlet></router-outlet>
    </main>

    <!-- Footer -->
    <footer class="bg-[#172337] text-white mt-6">
      <!-- Top section -->
      <div class="border-b border-white/10 py-10">
        <div class="max-w-screen-2xl mx-auto px-4 md:px-6">
          <div class="grid grid-cols-2 md:grid-cols-5 gap-8">
            <!-- About -->
            <div>
              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">About</h4>
              <ul class="space-y-2 text-xs text-gray-400">
                <li><a routerLink="/pages/about" class="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Careers</a></li>
                <li><a routerLink="/blog" class="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            <!-- Help -->
            <div>
              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Help</h4>
              <ul class="space-y-2 text-xs text-gray-400">
                <li><a href="#" class="hover:text-white transition-colors">Payments</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Shipping</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Returns Policy</a></li>
                <li><a routerLink="/pages/contact" class="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <!-- Policy -->
            <div>
              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Policy</h4>
              <ul class="space-y-2 text-xs text-gray-400">
                <li><a routerLink="/pages/privacy" class="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a routerLink="/pages/terms" class="hover:text-white transition-colors">Terms of Use</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Sitemap</a></li>
              </ul>
            </div>
            <!-- Social -->
            <div>
              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Social</h4>
              <ul class="space-y-2 text-xs text-gray-400">
                <li><a href="#" class="hover:text-white transition-colors flex items-center gap-1.5"><mat-icon class="!text-sm">facebook</mat-icon> Facebook</a></li>
                <li><a href="#" class="hover:text-white transition-colors flex items-center gap-1.5"><mat-icon class="!text-sm">alternate_email</mat-icon> Twitter</a></li>
                <li><a href="#" class="hover:text-white transition-colors flex items-center gap-1.5"><mat-icon class="!text-sm">photo_camera</mat-icon> Instagram</a></li>
                <li><a href="#" class="hover:text-white transition-colors flex items-center gap-1.5"><mat-icon class="!text-sm">play_circle</mat-icon> YouTube</a></li>
              </ul>
            </div>
            <!-- Mail us -->
            <div>
              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Sell on Lagaao</h4>
              <ul class="space-y-2 text-xs text-gray-400">
                <li><a routerLink="/sell" class="hover:text-white transition-colors">Become a Seller</a></li>
                <li><a routerLink="/vendor/dashboard" class="hover:text-white transition-colors">Seller Dashboard</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Advertise</a></li>
                <li><a href="#" class="hover:text-white transition-colors">Seller Help</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="py-4">
        <div class="max-w-screen-2xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between
                    items-center gap-3 text-xs text-gray-500">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
              <span class="text-white font-bold text-xs">L</span>
            </div>
            <span class="font-semibold text-white">lagaao.com</span>
            <span>&copy; {{ year }} — All rights reserved</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap justify-center">
            <span class="flex items-center gap-1">
              <mat-icon class="!text-sm text-green-400">lock</mat-icon>
              SSL Secured
            </span>
            <span class="text-gray-600">|</span>
            <span>Trusted by 1M+ shoppers</span>
          </div>
        </div>
      </div>
    </footer>

    <!-- Toast notifications -->
    <lg-toast-container></lg-toast-container>

    <!-- AI Chat widget -->
    <lg-ai-chat></lg-ai-chat>
  `,
  styles: [`
    :host { display: contents; }
  `]
})
export class MainLayoutComponent implements OnInit {
  readonly theme   = inject(ThemeService);
  readonly loading = inject(LoadingService);
  readonly auth    = inject(AuthService);
  readonly cart    = inject(CartService);
  readonly year    = new Date().getFullYear();

  readonly navCategories = [
    { label: 'Electronics',    slug: 'electronics',  icon: '📱' },
    { label: 'TVs & Appliances', slug: 'appliances',  icon: '📺' },
    { label: "Men's Fashion",  slug: 'mens-fashion',  icon: '👔' },
    { label: "Women's Fashion",slug: 'womens-fashion', icon: '👗' },
    { label: 'Home & Furniture', slug: 'home',        icon: '🛋️' },
    { label: 'Beauty',         slug: 'beauty',        icon: '💄' },
    { label: 'Grocery',        slug: 'grocery',       icon: '🛒' },
    { label: 'Sports',         slug: 'sports',        icon: '⚽' },
    { label: 'Books',          slug: 'books',         icon: '📚' },
    { label: 'Toys',           slug: 'toys',          icon: '🧸' },
  ];

  ngOnInit(): void {
    this.cart.load().subscribe();
  }
}

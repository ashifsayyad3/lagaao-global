import {
  Component, ChangeDetectionStrategy, inject
} from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastContainerComponent } from '../../components/toast/toast.component';
import { LoadingService } from '../../../core/services/loading.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'lg-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet, RouterLink,
    MatIconModule, MatButtonModule,
    ToastContainerComponent,
  ],
  template: `
    <!-- Global progress bar -->
    @if (loading.isLoading()) {
      <div class="fixed top-0 left-0 right-0 h-0.5 bg-primary-600 z-[overlay] animate-pulse"></div>
    }

    <!-- Sticky Navbar -->
    <header class="glass-nav fixed top-0 left-0 right-0 z-sticky h-16">
      <div class="max-w-screen-2xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4">

        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-2 flex-shrink-0">
          <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <span class="text-white font-bold text-sm">L</span>
          </div>
          <span class="font-display font-bold text-xl gradient-text hidden sm:block">lagaao</span>
        </a>

        <!-- Search bar (desktop) -->
        <div class="flex-1 max-w-xl hidden md:flex items-center">
          <div class="w-full relative">
            <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted !w-5 !h-5 !text-xl">
              search
            </mat-icon>
            <input
              type="search"
              placeholder="Search products, brands, categories..."
              class="w-full pl-10 pr-4 h-10 bg-surface-100 dark:bg-surface-800
                     border border-border-default rounded-full text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     transition-all placeholder:text-text-muted"
              routerLink="/search"
              readonly
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1">
          <!-- Theme toggle -->
          <button
            class="w-9 h-9 rounded-full flex items-center justify-center
                   hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            (click)="theme.toggle()"
            [attr.aria-label]="'Switch to ' + (theme.theme() === 'dark' ? 'light' : 'dark') + ' mode'"
          >
            <mat-icon class="text-text-secondary">
              {{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}
            </mat-icon>
          </button>

          <!-- Wishlist -->
          <button
            routerLink="/wishlist"
            class="w-9 h-9 rounded-full flex items-center justify-center
                   hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <mat-icon class="text-text-secondary">favorite_border</mat-icon>
          </button>

          <!-- Cart -->
          <button
            routerLink="/cart"
            class="w-9 h-9 rounded-full flex items-center justify-center
                   hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative"
          >
            <mat-icon class="text-text-secondary">shopping_bag</mat-icon>
            <span class="absolute top-1 right-1 w-4 h-4 bg-accent text-white
                         text-[10px] font-bold rounded-full flex items-center justify-center">
              2
            </span>
          </button>

          <!-- Profile / Auth -->
          @if (auth.isLoggedIn()) {
            <a routerLink="/profile"
               class="ml-1 w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent
                      flex items-center justify-center text-white text-sm font-bold">
              {{ auth.user()?.name?.[0]?.toUpperCase() }}
            </a>
          } @else {
            <button
              routerLink="/auth/login"
              class="ml-1 h-9 px-3 rounded-full bg-primary-600 hover:bg-primary-700
                     text-white text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <mat-icon class="!text-base !w-4 !h-4">person</mat-icon>
              <span class="hidden sm:block">Sign In</span>
            </button>
          }
        </div>
      </div>
    </header>

    <!-- Main content with top padding for navbar -->
    <main class="pt-16 min-h-screen bg-bg-base">
      <router-outlet></router-outlet>
    </main>

    <!-- Footer -->
    <footer class="bg-surface-900 text-text-inverted py-12 mt-16">
      <div class="max-w-screen-2xl mx-auto px-4 md:px-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <span class="text-white font-bold text-xs">L</span>
              </div>
              <span class="font-display font-bold text-lg text-white">lagaao</span>
            </div>
            <p class="text-sm text-gray-400 leading-relaxed">
              Your one-stop marketplace for everything. Shop smart, live better.
            </p>
          </div>
          <div>
            <h4 class="font-semibold text-white mb-3 text-sm">Shop</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a href="#" class="hover:text-white transition-colors">Electronics</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Fashion</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Home & Kitchen</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Sports</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold text-white mb-3 text-sm">Sellers</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a href="#" class="hover:text-white transition-colors">Sell on Lagaao</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Vendor Dashboard</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Seller Policies</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold text-white mb-3 text-sm">Support</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a href="#" class="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Returns</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between
                    items-center gap-4 text-xs text-gray-500">
          <p>&copy; {{ year }} Lagaao.com — All rights reserved</p>
          <div class="flex gap-4">
            <a href="#" class="hover:text-gray-300">Privacy</a>
            <a href="#" class="hover:text-gray-300">Terms</a>
            <a href="#" class="hover:text-gray-300">Cookies</a>
          </div>
        </div>
      </div>
    </footer>

    <!-- Toast notifications -->
    <lg-toast-container></lg-toast-container>
  `,
})
export class MainLayoutComponent {
  readonly theme   = inject(ThemeService);
  readonly loading = inject(LoadingService);
  readonly auth    = inject(AuthService);
  readonly year    = new Date().getFullYear();
}

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastContainerComponent } from '../../components/toast/toast.component';

@Component({
  selector: 'lg-auth-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, MatIconModule, ToastContainerComponent],
  template: `
    <div class="min-h-screen flex">
      <!-- Left decorative panel (desktop) -->
      <div class="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-700 via-primary-600 to-accent overflow-hidden">
        <div class="absolute inset-0 opacity-20"
             style="background-image: url(&quot;data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;)">
        </div>
        <div class="relative z-10 flex flex-col justify-center px-16 text-white">
          <a routerLink="/" class="flex items-center gap-3 mb-12">
            <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span class="text-white font-bold text-lg">L</span>
            </div>
            <span class="font-display font-bold text-2xl">lagaao</span>
          </a>
          <h1 class="font-display text-4xl font-bold leading-tight mb-4">
            India's Smartest<br>Marketplace
          </h1>
          <p class="text-white/70 text-lg leading-relaxed max-w-md">
            Millions of products. Thousands of sellers. One seamless experience powered by AI.
          </p>
        </div>
      </div>

      <!-- Right auth panel -->
      <div class="flex-1 flex flex-col justify-center items-center px-6 py-12
                  bg-bg-base min-h-screen">
        <!-- Mobile logo -->
        <div class="lg:hidden mb-8 text-center">
          <a routerLink="/" class="inline-flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <span class="text-white font-bold">L</span>
            </div>
            <span class="font-display font-bold text-xl gradient-text">lagaao</span>
          </a>
        </div>

        <!-- Theme toggle -->
        <button
          class="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center
                 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          (click)="theme.toggle()"
        >
          <mat-icon class="text-text-secondary">
            {{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}
          </mat-icon>
        </button>

        <div class="w-full max-w-md animate-fade-in">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>

    <lg-toast-container></lg-toast-container>
  `,
})
export class AuthLayoutComponent {
  readonly theme = inject(ThemeService);
}

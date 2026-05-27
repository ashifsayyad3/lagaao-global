import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { WebVitalsService } from './core/services/web-vitals.service';
import { PwaInstallBannerComponent } from './shared/components/pwa-install-banner/pwa-install-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PwaInstallBannerComponent],
  template: `
    <router-outlet></router-outlet>
    <lg-pwa-install-banner></lg-pwa-install-banner>
  `,
})
export class App implements OnInit {
  readonly #theme      = inject(ThemeService);
  readonly #auth       = inject(AuthService);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #vitals     = inject(WebVitalsService); // auto-starts CWV collection

  ngOnInit(): void {
    if (!isPlatformBrowser(this.#platformId)) return;

    // Hydrate user profile from localStorage on every page load
    this.#auth.hydrate();

    // Silently refresh the access token if we have a stored user.
    // The refresh token lives in an httpOnly cookie — this call renews it.
    if (this.#auth.isLoggedIn()) {
      this.#auth.refresh().subscribe({ error: () => { /* cookie expired — user stays logged out */ } });
    }
  }
}

import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class App implements OnInit {
  readonly #theme      = inject(ThemeService);
  readonly #auth       = inject(AuthService);
  readonly #platformId = inject(PLATFORM_ID);

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

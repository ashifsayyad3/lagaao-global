import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, UserDTO } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'lg-google-callback',
  standalone: true,
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center">
      <div style="text-align:center;font-family:var(--font-sans)">
        <div style="font-size:2.5rem;margin-bottom:16px">🌿</div>
        <p style="color:var(--text-muted);font-size:.9375rem">Signing you in with Google…</p>
      </div>
    </div>
  `,
})
export class GoogleCallbackComponent implements OnInit {
  readonly #route     = inject(ActivatedRoute);
  readonly #router    = inject(Router);
  readonly #auth      = inject(AuthService);
  readonly #toast     = inject(ToastService);
  readonly #api       = inject(ApiService);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  ngOnInit(): void {
    if (!this.#isBrowser) return;

    const token = this.#route.snapshot.queryParamMap.get('token');
    const error = this.#route.snapshot.queryParamMap.get('error');

    if (error || !token) {
      this.#toast.error('Google sign-in failed. Please try again.');
      this.#router.navigate(['/auth/login']);
      return;
    }

    // Store token so the HTTP interceptor attaches it to /auth/me
    this.#auth.setAccessToken(token);

    this.#api.get<{ data: UserDTO }>('/auth/me').subscribe({
      next: res => {
        this.#auth.handleGoogleCallback(token, res.data);
        this.#toast.success('Welcome to Lagaao!');
        this.#router.navigate(['/']);
      },
      error: () => {
        this.#toast.error('Google sign-in failed. Please try again.');
        this.#router.navigate(['/auth/login']);
      },
    });
  }
}

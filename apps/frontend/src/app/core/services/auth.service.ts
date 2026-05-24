import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';
export interface UserDTO {
  id: number; name: string; email: string; phone?: string;
  role: 'customer' | 'vendor' | 'admin' | 'super_admin';
  avatar?: string; createdAt: string;
}

export interface AuthState {
  user:        UserDTO | null;
  accessToken: string | null;
  loading:     boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #api       = inject(ApiService);
  readonly #router    = inject(Router);
  readonly #toast     = inject(ToastService);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly #state = signal<AuthState>({
    user:        null,
    accessToken: null,
    loading:     false,
  });

  readonly user         = computed(() => this.#state().user);
  readonly accessToken  = computed(() => this.#state().accessToken);
  readonly isLoggedIn   = computed(() => !!this.#state().user);
  readonly isLoading    = computed(() => this.#state().loading);

  register(data: { name: string; email: string; password: string; phone?: string }): Observable<unknown> {
    return this.#api.post('/auth/register', data);
  }

  verifyOtp(email: string, otp: string): Observable<{ data: { accessToken: string; user: UserDTO } }> {
    return this.#api
      .post<{ data: { accessToken: string; user: UserDTO } }>('/auth/verify-otp', { email, otp })
      .pipe(tap(res => this.#setAuth(res.data.accessToken, res.data.user)));
  }

  login(email: string, password: string): Observable<{ data: { accessToken: string; user: UserDTO } }> {
    return this.#api
      .post<{ data: { accessToken: string; user: UserDTO } }>('/auth/login', { email, password })
      .pipe(tap(res => this.#setAuth(res.data.accessToken, res.data.user)));
  }

  refresh(): Observable<{ data: { accessToken: string; user: UserDTO } }> {
    return this.#api
      .post<{ data: { accessToken: string; user: UserDTO } }>('/auth/refresh', {})
      .pipe(tap(res => this.#setAuth(res.data.accessToken, res.data.user)));
  }

  logout(): void {
    this.#api.post('/auth/logout', {}).subscribe({
      complete: () => {
        this.#clearAuth();
        this.#router.navigate(['/']);
      },
      error: () => {
        this.#clearAuth();
        this.#router.navigate(['/']);
      },
    });
  }

  loginWithGoogle(): void {
    if (this.#isBrowser) {
      window.location.href = `${environment.apiUrl}/api/v1/auth/google`;
    }
  }

  handleGoogleCallback(token: string, user: UserDTO): void {
    this.#state.set({ user, accessToken: token, loading: false });
    if (this.#isBrowser) localStorage.setItem('lg_user', JSON.stringify(user));
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.#api.post('/auth/forgot-password', { email });
  }

  resendOtp(email: string): Observable<unknown> {
    return this.#api.post('/auth/resend-otp', { email });
  }

  setAccessToken(token: string): void {
    this.#state.update(s => ({ ...s, accessToken: token }));
  }

  #setAuth(token: string, user: UserDTO): void {
    this.#state.set({ user, accessToken: token, loading: false });
    if (this.#isBrowser) localStorage.setItem('lg_user', JSON.stringify(user));
  }

  #clearAuth(): void {
    this.#state.set({ user: null, accessToken: null, loading: false });
    if (this.#isBrowser) localStorage.removeItem('lg_user');
  }

  hydrate(): void {
    if (!this.#isBrowser) return;
    const saved = localStorage.getItem('lg_user');
    if (saved) {
      const user = JSON.parse(saved) as UserDTO;
      this.#state.update(s => ({ ...s, user }));
    }
  }
}

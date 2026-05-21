import {
  Component, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'lg-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, MatIconModule, ButtonComponent],
  template: `
    <div>
      <h2 class="font-display text-3xl font-bold text-text-primary mb-1">Welcome back</h2>
      <p class="text-text-secondary mb-8">Sign in to your Lagaao account</p>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">Email address</label>
          <input
            formControlName="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            class="input-field"
            [class.border-red-500]="emailErr"
          />
          @if (emailErr) {
            <p class="mt-1 text-xs text-red-500">{{ emailErr }}</p>
          }
        </div>

        <!-- Password -->
        <div>
          <div class="flex justify-between mb-1.5">
            <label class="text-sm font-medium text-text-primary">Password</label>
            <a routerLink="/auth/forgot-password" class="text-xs text-primary-600 hover:underline">
              Forgot password?
            </a>
          </div>
          <div class="relative">
            <input
              formControlName="password"
              [type]="showPw() ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              class="input-field pr-10"
              [class.border-red-500]="passwordErr"
            />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    (click)="showPw.update(v => !v)">
              <mat-icon class="!text-xl">{{ showPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </div>
          @if (passwordErr) {
            <p class="mt-1 text-xs text-red-500">{{ passwordErr }}</p>
          }
        </div>

        <!-- Error message -->
        @if (errorMsg()) {
          <div class="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3">
            <p class="text-sm text-red-600 dark:text-red-400">{{ errorMsg() }}</p>
          </div>
        }

        <lg-button
          type="submit"
          variant="primary"
          size="lg"
          [fullWidth]="true"
          [loading]="loading()"
        >
          Sign in
        </lg-button>

        <!-- Divider -->
        <div class="flex items-center gap-3 py-1">
          <div class="flex-1 h-px bg-border-default"></div>
          <span class="text-xs text-text-muted">or continue with</span>
          <div class="flex-1 h-px bg-border-default"></div>
        </div>

        <!-- Social login (Phase 2 placeholder) -->
        <button type="button"
                class="w-full h-11 flex items-center justify-center gap-3 rounded-lg border
                       border-border-strong bg-bg-base hover:bg-surface-50 dark:hover:bg-surface-800
                       transition-colors text-sm font-medium text-text-primary">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-text-secondary">
        No account?
        <a routerLink="/auth/register" class="text-primary-600 font-semibold hover:underline ml-1">
          Create one free
        </a>
      </p>
    </div>
  `,
  styles: [`
    .input-field {
      width: 100%; height: 2.75rem; padding: 0 1rem;
      border-radius: 0.5rem; border: 1px solid var(--border-default);
      background: var(--bg-base); color: var(--text-primary);
      font-size: 0.875rem; transition: all 150ms;
      &::placeholder { color: var(--text-muted); }
      &:focus { outline: none; ring: 2px; border-color: transparent; box-shadow: 0 0 0 2px var(--color-primary); }
    }
  `],
})
export class LoginComponent {
  readonly #auth   = inject(AuthService);
  readonly #router = inject(Router);
  readonly #toast  = inject(ToastService);
  readonly #fb     = inject(FormBuilder);

  readonly loading  = signal(false);
  readonly errorMsg = signal('');
  readonly showPw   = signal(false);

  form = this.#fb.nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get emailErr(): string | null {
    const c = this.form.controls.email;
    if (!c.dirty || !c.errors) return null;
    if (c.errors['required']) return 'Email is required';
    if (c.errors['email'])    return 'Enter a valid email';
    return null;
  }

  get passwordErr(): string | null {
    const c = this.form.controls.password;
    if (!c.dirty || !c.errors) return null;
    if (c.errors['required'])   return 'Password is required';
    if (c.errors['minlength'])  return 'At least 8 characters required';
    return null;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set('');
    const { email, password } = this.form.getRawValue();

    this.#auth.login(email, password).subscribe({
      next: () => {
        this.#toast.success('Welcome back!');
        this.#router.navigate(['/']);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Login failed');
        this.loading.set(false);
      },
    });
  }
}

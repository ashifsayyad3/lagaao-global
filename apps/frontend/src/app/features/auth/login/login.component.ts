import {
  Component, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'lg-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, MatIconModule],
  styles: [`
    :host { display: block; }

    .form-heading {
      font-family: var(--font-display);
      font-size: 1.625rem; font-weight: 600;
      color: var(--text-primary); margin: 0 0 4px;
    }
    .form-sub { font-size: .9375rem; color: var(--text-muted); margin: 0 0 28px; }

    .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 16px; }
    .field-row { display: flex; align-items: center; justify-content: space-between; }
    .field label { font-size: .8125rem; font-weight: 600; color: var(--text-secondary); }

    .inp-wrap { position: relative; }
    .inp {
      width: 100%; height: 46px; padding: 0 44px 0 14px;
      border: 1.5px solid var(--border-default); border-radius: 12px;
      font-family: var(--font-sans); font-size: .9375rem;
      color: var(--text-primary); background: var(--bg-subtle);
      outline: none; transition: border-color 150ms, background 150ms;
    }
    .inp:focus { border-color: var(--color-primary); background: var(--bg-base); }
    .inp.error { border-color: var(--color-error); }
    .inp::placeholder { color: var(--text-muted); }

    .inp-icon {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: var(--text-muted); display: flex; align-items: center;
      transition: color 150ms;
    }
    .inp-icon:hover { color: var(--text-primary); }

    .field-err { font-size: .75rem; color: var(--color-error); margin-top: 2px; }
    .forgot-link { font-size: .75rem; color: var(--color-primary); font-weight: 600; text-decoration: none; }
    .forgot-link:hover { text-decoration: underline; }

    .error-box {
      background: rgba(192,57,43,.06); border: 1px solid rgba(192,57,43,.2);
      border-radius: 10px; padding: 10px 14px;
      font-size: .875rem; color: var(--color-error);
      margin-bottom: 14px;
    }

    .submit-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; height: 50px; border: none; border-radius: 14px;
      background: var(--color-primary); color: #fff;
      font-family: var(--font-sans); font-size: 1rem; font-weight: 700;
      cursor: pointer; transition: background 150ms, transform 150ms, box-shadow 150ms;
      margin-bottom: 20px;
    }
    .submit-btn:hover:not(:disabled) {
      background: var(--color-primary-dark);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(61,107,69,.28);
    }
    .submit-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }

    .divider {
      display: flex; align-items: center; gap: 12px;
      font-size: .8125rem; color: var(--text-muted);
      margin-bottom: 16px;
    }
    .divider::before, .divider::after {
      content: ''; flex: 1; height: 1px; background: var(--border-default);
    }

    .google-btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; height: 46px;
      border: 1.5px solid var(--border-default); border-radius: 12px;
      background: var(--bg-base); font-family: var(--font-sans);
      font-size: .9375rem; font-weight: 500; color: var(--text-primary);
      cursor: pointer; transition: border-color 150ms, box-shadow 150ms;
      margin-bottom: 24px;
    }
    .google-btn:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }

    .bottom-link { text-align: center; font-size: .875rem; color: var(--text-muted); }
    .bottom-link a { color: var(--color-primary); font-weight: 700; text-decoration: none; margin-left: 4px; }
    .bottom-link a:hover { text-decoration: underline; }
  `],
  template: `
    <h2 class="form-heading">Welcome back 🌿</h2>
    <p class="form-sub">Sign in to your Lagaao account</p>

    <form [formGroup]="form" (ngSubmit)="submit()">

      <!-- Email -->
      <div class="field">
        <label for="login-email">Email address</label>
        <div class="inp-wrap">
          <input id="login-email" formControlName="email" type="email"
                 autocomplete="email" placeholder="you@example.com"
                 class="inp" [class.error]="emailErr" />
          <span class="inp-icon" style="pointer-events:none">
            <mat-icon style="font-size:18px;width:18px;height:18px">mail_outline</mat-icon>
          </span>
        </div>
        @if (emailErr) { <span class="field-err">{{ emailErr }}</span> }
      </div>

      <!-- Password -->
      <div class="field">
        <div class="field-row">
          <label for="login-pw">Password</label>
          <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
        </div>
        <div class="inp-wrap">
          <input id="login-pw" formControlName="password"
                 [type]="showPw() ? 'text' : 'password'"
                 autocomplete="current-password" placeholder="••••••••"
                 class="inp" [class.error]="passwordErr" />
          <button type="button" class="inp-icon" (click)="showPw.update(v => !v)">
            <mat-icon style="font-size:18px;width:18px;height:18px">
              {{ showPw() ? 'visibility_off' : 'visibility' }}
            </mat-icon>
          </button>
        </div>
        @if (passwordErr) { <span class="field-err">{{ passwordErr }}</span> }
      </div>

      @if (errorMsg()) {
        <div class="error-box">{{ errorMsg() }}</div>
      }

      <button type="submit" class="submit-btn" [disabled]="loading()">
        @if (loading()) {
          <mat-icon style="font-size:18px;width:18px;height:18px;animation:spin 1s linear infinite">refresh</mat-icon>
          Signing in…
        } @else {
          Sign in
        }
      </button>
    </form>

    <div class="divider">or continue with</div>

    <button type="button" class="google-btn">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>

    <p class="bottom-link">
      Don't have an account?
      <a routerLink="/auth/register">Create one free</a>
    </p>
  `,
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
    if (c.errors['email'])    return 'Enter a valid email address';
    return null;
  }

  get passwordErr(): string | null {
    const c = this.form.controls.password;
    if (!c.dirty || !c.errors) return null;
    if (c.errors['required'])  return 'Password is required';
    if (c.errors['minlength']) return 'At least 8 characters required';
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
      error: err => {
        this.errorMsg.set(err.error?.message ?? 'Login failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}

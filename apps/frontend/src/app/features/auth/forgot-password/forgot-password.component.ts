import {
  Component, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'lg-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, MatIconModule],
  styles: [`
    :host { display: block; }

    .back-btn {
      display:inline-flex; align-items:center; gap:4px;
      font-size:.8125rem; color:var(--text-muted); background:none; border:none;
      cursor:pointer; text-decoration:none; margin-bottom:24px;
      transition:color 150ms;
    }
    .back-btn:hover { color:var(--color-primary); }

    .form-heading { font-family:var(--font-display); font-size:1.625rem; font-weight:600; color:var(--text-primary); margin:0 0 6px; }
    .form-sub { font-size:.9375rem; color:var(--text-muted); margin:0 0 28px; line-height:1.6; }

    .field { display:flex; flex-direction:column; gap:5px; margin-bottom:20px; }
    .field label { font-size:.8125rem; font-weight:600; color:var(--text-secondary); }

    .inp {
      width:100%; height:46px; padding:0 14px;
      border:1.5px solid var(--border-default); border-radius:12px;
      font-family:var(--font-sans); font-size:.9375rem;
      color:var(--text-primary); background:var(--bg-subtle);
      outline:none; transition:border-color 150ms, background 150ms;
    }
    .inp:focus { border-color:var(--color-primary); background:#fff; }
    .inp::placeholder { color:var(--text-muted); }

    .submit-btn {
      display:flex; align-items:center; justify-content:center; gap:8px;
      width:100%; height:50px; border:none; border-radius:14px;
      background:var(--color-primary); color:#fff;
      font-family:var(--font-sans); font-size:1rem; font-weight:700;
      cursor:pointer; transition:background 150ms, transform 150ms, box-shadow 150ms;
    }
    .submit-btn:hover:not(:disabled) { background:var(--color-primary-dark); transform:translateY(-1px); box-shadow:0 6px 20px rgba(61,107,69,.28); }
    .submit-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }

    /* Success state */
    .success-icon {
      width:72px; height:72px; border-radius:50%;
      background:var(--color-primary-100);
      display:flex; align-items:center; justify-content:center;
      margin:0 auto 20px;
    }
    .success-heading { font-family:var(--font-display); font-size:1.5rem; font-weight:600; color:var(--text-primary); text-align:center; margin:0 0 8px; }
    .success-sub { font-size:.9375rem; color:var(--text-muted); text-align:center; margin:0 0 28px; line-height:1.7; }
    .back-to-login {
      display:flex; align-items:center; justify-content:center; gap:6px;
      width:100%; height:46px; border:1.5px solid var(--border-default); border-radius:12px;
      background:#fff; font-family:var(--font-sans); font-size:.9375rem; font-weight:600;
      color:var(--text-primary); text-decoration:none; transition:border-color 150ms;
    }
    .back-to-login:hover { border-color:var(--color-primary); color:var(--color-primary); }
  `],
  template: `
    @if (!sent()) {
      <a routerLink="/auth/login" class="back-btn">
        <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
        Back to sign in
      </a>

      <h2 class="form-heading">Forgot password?</h2>
      <p class="form-sub">
        No worries! Enter your email address and we'll send you a link to reset your password.
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label for="fp-email">Email address</label>
          <input id="fp-email" formControlName="email" type="email"
                 placeholder="you@example.com" class="inp" autocomplete="email" />
        </div>

        <button type="submit" class="submit-btn" [disabled]="form.invalid || loading()">
          @if (loading()) {
            <mat-icon style="font-size:18px;width:18px;height:18px;animation:spin 1s linear infinite">refresh</mat-icon>
            Sending…
          } @else {
            Send reset link
          }
        </button>
      </form>

    } @else {
      <!-- Success state -->
      <div>
        <div class="success-icon">
          <mat-icon style="font-size:32px;width:32px;height:32px;color:var(--color-primary)">check_circle</mat-icon>
        </div>
        <h2 class="success-heading">Email sent!</h2>
        <p class="success-sub">
          If an account exists for <strong style="color:var(--text-primary)">{{ email }}</strong>,
          you'll receive a password reset link shortly.<br>
          Check your spam folder if you don't see it.
        </p>
        <a routerLink="/auth/login" class="back-to-login">
          <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
          Back to sign in
        </a>
      </div>
    }
  `,
})
export class ForgotPasswordComponent {
  readonly #auth  = inject(AuthService);
  readonly #toast = inject(ToastService);
  readonly #fb    = inject(FormBuilder);

  readonly loading = signal(false);
  readonly sent    = signal(false);
  email = '';

  form = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.email = this.form.value.email!;
    this.#auth.forgotPassword(this.email).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => { this.loading.set(false); this.sent.set(true); },
    });
  }
}

import {
  Component, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'lg-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, MatIconModule, ButtonComponent],
  template: `
    @if (!sent()) {
      <div class="animate-fade-in">
        <button routerLink="/auth/login"
                class="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
          <mat-icon class="!text-base">arrow_back</mat-icon>
          Back to sign in
        </button>

        <h2 class="font-display text-3xl font-bold text-text-primary mb-1">Forgot password?</h2>
        <p class="text-text-secondary mb-8">
          Enter your email and we'll send you a reset link.
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">Email address</label>
            <input formControlName="email" type="email" placeholder="you@example.com"
                   class="input-field" />
          </div>

          <lg-button type="submit" variant="primary" size="lg" [fullWidth]="true" [loading]="loading()">
            Send reset link
          </lg-button>
        </form>
      </div>

    } @else {
      <div class="animate-fade-in text-center">
        <div class="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-6">
          <mat-icon class="!text-3xl text-green-600">check_circle</mat-icon>
        </div>
        <h2 class="font-display text-2xl font-bold text-text-primary mb-2">Check your email</h2>
        <p class="text-text-secondary mb-8">
          If an account exists for <strong>{{ email }}</strong>, a reset link has been sent.
        </p>
        <a routerLink="/auth/login" class="text-primary-600 font-medium hover:underline">
          Back to sign in
        </a>
      </div>
    }
  `,
  styles: [`.input-field { width:100%; height:2.75rem; padding:0 1rem; border-radius:0.5rem; border:1px solid var(--border-default); background:var(--bg-base); color:var(--text-primary); font-size:0.875rem; transition:all 150ms; } .input-field:focus { outline:none; box-shadow:0 0 0 2px var(--color-primary); border-color:transparent; }`],
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
      error: () => { this.loading.set(false); this.sent.set(true); }, // Always show success
    });
  }
}

import {
  Component, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';

function strongPassword(c: AbstractControl): ValidationErrors | null {
  const v = c.value as string;
  if (!v) return null;
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v)) {
    return { weak: true };
  }
  return null;
}

@Component({
  selector: 'lg-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, FormsModule, MatIconModule, ButtonComponent],
  template: `
    @if (!otpSent()) {
      <!-- Registration Form -->
      <div class="animate-fade-in">
        <h2 class="font-display text-3xl font-bold text-text-primary mb-1">Create account</h2>
        <p class="text-text-secondary mb-8">Join millions of smart shoppers on Lagaao</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">Full name</label>
            <input formControlName="name" type="text" placeholder="Asif Sayyad"
                   class="input-field" [class.border-red-500]="err('name')" />
            @if (err('name')) { <p class="mt-1 text-xs text-red-500">{{ err('name') }}</p> }
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">Email address</label>
            <input formControlName="email" type="email" placeholder="you@example.com"
                   class="input-field" [class.border-red-500]="err('email')" />
            @if (err('email')) { <p class="mt-1 text-xs text-red-500">{{ err('email') }}</p> }
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">
              Phone <span class="text-text-muted font-normal">(optional)</span>
            </label>
            <div class="flex gap-2">
              <span class="h-11 px-3 flex items-center rounded-lg border border-border-default
                           bg-surface-100 dark:bg-surface-800 text-sm text-text-secondary">
                +91
              </span>
              <input formControlName="phone" type="tel" placeholder="9876543210"
                     class="input-field flex-1" [class.border-red-500]="err('phone')" />
            </div>
            @if (err('phone')) { <p class="mt-1 text-xs text-red-500">{{ err('phone') }}</p> }
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">Password</label>
            <div class="relative">
              <input formControlName="password" [type]="showPw() ? 'text' : 'password'"
                     placeholder="Min 8 chars, upper, lower, number"
                     class="input-field pr-10" [class.border-red-500]="err('password')" />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                      (click)="showPw.update(v => !v)">
                <mat-icon class="!text-xl">{{ showPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            <!-- Strength bar -->
            <div class="mt-2 flex gap-1">
              @for (i of [1,2,3,4]; track i) {
                <div class="h-1 flex-1 rounded-full transition-colors"
                     [class]="strengthColor(i)"></div>
              }
            </div>
            @if (err('password')) { <p class="mt-1 text-xs text-red-500">{{ err('password') }}</p> }
          </div>

          @if (errorMsg()) {
            <div class="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 p-3">
              <p class="text-sm text-red-600 dark:text-red-400">{{ errorMsg() }}</p>
            </div>
          }

          <lg-button type="submit" variant="primary" size="lg" [fullWidth]="true" [loading]="loading()">
            Create account
          </lg-button>
        </form>

        <p class="mt-6 text-center text-sm text-text-secondary">
          Already have an account?
          <a routerLink="/auth/login" class="text-primary-600 font-semibold hover:underline ml-1">Sign in</a>
        </p>
      </div>

    } @else {
      <!-- OTP Verification -->
      <div class="animate-fade-in">
        <div class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center mx-auto mb-6">
          <mat-icon class="!text-3xl text-primary-600">mark_email_read</mat-icon>
        </div>
        <h2 class="font-display text-3xl font-bold text-text-primary mb-1 text-center">
          Check your email
        </h2>
        <p class="text-text-secondary mb-8 text-center">
          We've sent a 6-digit OTP to <strong>{{ form.value.email }}</strong>
        </p>

        <form (ngSubmit)="submitOtp()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5 text-center">
              Enter OTP
            </label>
            <input
              [(ngModel)]="otp" name="otp"
              type="text" inputmode="numeric" maxlength="6"
              placeholder="• • • • • •"
              class="input-field text-center text-2xl tracking-[0.5em] font-mono"
            />
          </div>

          @if (otpError()) {
            <div class="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 p-3">
              <p class="text-sm text-red-600 dark:text-red-400 text-center">{{ otpError() }}</p>
            </div>
          }

          <lg-button type="submit" variant="primary" size="lg" [fullWidth]="true" [loading]="loading()">
            Verify & continue
          </lg-button>

          <button type="button"
                  class="w-full text-sm text-text-secondary hover:text-text-primary text-center py-2"
                  (click)="resendOtp()">
            Didn't receive it?
            <span class="text-primary-600 font-medium ml-1">Resend OTP</span>
          </button>
        </form>
      </div>
    }
  `,
  styles: [`
    .input-field {
      width: 100%; height: 2.75rem; padding: 0 1rem;
      border-radius: 0.5rem; border: 1px solid var(--border-default);
      background: var(--bg-base); color: var(--text-primary);
      font-size: 0.875rem; transition: all 150ms;
      &::placeholder { color: var(--text-muted); }
      &:focus { outline: none; box-shadow: 0 0 0 2px var(--color-primary); border-color: transparent; }
    }
  `],
})
export class RegisterComponent {
  readonly #auth   = inject(AuthService);
  readonly #router = inject(Router);
  readonly #toast  = inject(ToastService);
  readonly #fb     = inject(FormBuilder);

  readonly loading  = signal(false);
  readonly errorMsg = signal('');
  readonly otpError = signal('');
  readonly otpSent  = signal(false);
  readonly showPw   = signal(false);

  otp = '';

  form = this.#fb.nonNullable.group({
    name:     ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    phone:    ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), strongPassword]],
  });

  err(field: string): string | null {
    const c = this.form.get(field)!;
    if (!c.dirty || !c.errors) return null;
    if (c.errors['required'])   return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    if (c.errors['minlength'])  return `Too short`;
    if (c.errors['email'])      return 'Enter a valid email';
    if (c.errors['pattern'])    return 'Invalid format';
    if (c.errors['weak'])       return 'Add uppercase, lowercase and a number';
    return null;
  }

  strengthColor(i: number): string {
    const pw  = this.form.value.password ?? '';
    const str = this.#passwordStrength(pw);
    if (str < i) return 'bg-surface-200 dark:bg-surface-700';
    if (str === 1) return 'bg-red-500';
    if (str === 2) return 'bg-amber-500';
    if (str === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  #passwordStrength(pw: string): number {
    let s = 0;
    if (pw.length >= 8)               s++;
    if (/[A-Z]/.test(pw))             s++;
    if (/[0-9]/.test(pw))             s++;
    if (/[^A-Za-z0-9]/.test(pw))      s++;
    return s;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set('');
    const { name, email, password, phone } = this.form.getRawValue();

    this.#auth.register({ name, email, password, phone: phone || undefined }).subscribe({
      next: () => {
        this.loading.set(false);
        this.otpSent.set(true);
        this.#toast.info('OTP sent', `Check your email at ${email}`);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message ?? 'Registration failed');
        this.loading.set(false);
      },
    });
  }

  submitOtp(): void {
    if (this.otp.length !== 6 || this.loading()) return;

    this.loading.set(true);
    this.otpError.set('');

    this.#auth.verifyOtp(this.form.value.email!, this.otp).subscribe({
      next: () => {
        this.#toast.success('Account created!', 'Welcome to Lagaao');
        this.#router.navigate(['/']);
      },
      error: (err) => {
        this.otpError.set(err.error?.message ?? 'Invalid OTP');
        this.loading.set(false);
      },
    });
  }

  resendOtp(): void {
    this.#auth.resendOtp(this.form.value.email!).subscribe({
      next: () => this.#toast.info('OTP resent'),
    });
  }
}

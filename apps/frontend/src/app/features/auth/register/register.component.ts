import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder, Validators, ReactiveFormsModule, FormsModule,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

function strongPassword(c: AbstractControl): ValidationErrors | null {
  const v = c.value as string;
  if (!v) return null;
  return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v) ? null : { weak: true };
}

@Component({
  selector: 'lg-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, FormsModule, MatIconModule],
  styles: [`
    :host { display: block; }

    .form-heading { font-family:var(--font-display); font-size:1.625rem; font-weight:600; color:var(--text-primary); margin:0 0 4px; }
    .form-sub { font-size:.9375rem; color:var(--text-muted); margin:0 0 24px; }

    .field { display:flex; flex-direction:column; gap:5px; margin-bottom:14px; }
    .field label { font-size:.8125rem; font-weight:600; color:var(--text-secondary); }

    .inp-wrap { position:relative; }
    .inp {
      width:100%; height:46px; padding:0 14px;
      border:1.5px solid var(--border-default); border-radius:12px;
      font-family:var(--font-sans); font-size:.9375rem;
      color:var(--text-primary); background:var(--bg-subtle);
      outline:none; transition:border-color 150ms, background 150ms;
    }
    .inp:focus { border-color:var(--color-primary); background:var(--bg-base); }
    .inp.error { border-color:var(--color-error); }
    .inp::placeholder { color:var(--text-muted); }
    .inp.pr { padding-right:44px; }

    .inp-icon {
      position:absolute; right:12px; top:50%; transform:translateY(-50%);
      background:none; border:none; cursor:pointer;
      color:var(--text-muted); display:flex; align-items:center;
      transition:color 150ms;
    }
    .inp-icon:hover { color:var(--text-primary); }

    .phone-wrap { display:flex; gap:8px; }
    .dial-code {
      height:46px; padding:0 12px;
      border:1.5px solid var(--border-default); border-radius:12px;
      background:var(--bg-subtle); font-family:var(--font-sans);
      font-size:.9375rem; color:var(--text-secondary);
      display:flex; align-items:center; flex-shrink:0;
    }

    .field-err { font-size:.75rem; color:var(--color-error); }

    /* Password strength bar */
    .strength-bar { display:flex; gap:4px; margin-top:6px; }
    .strength-seg { flex:1; height:3px; border-radius:9999px; background:var(--border-default); transition:background 250ms; }

    .error-box { background:rgba(192,57,43,.06); border:1px solid rgba(192,57,43,.2); border-radius:10px; padding:10px 14px; font-size:.875rem; color:var(--color-error); margin-bottom:14px; }

    .submit-btn {
      display:flex; align-items:center; justify-content:center; gap:8px;
      width:100%; height:50px; border:none; border-radius:14px;
      background:var(--color-primary); color:#fff;
      font-family:var(--font-sans); font-size:1rem; font-weight:700;
      cursor:pointer; transition:background 150ms, transform 150ms, box-shadow 150ms;
      margin-top:4px; margin-bottom:20px;
    }
    .submit-btn:hover:not(:disabled) { background:var(--color-primary-dark); transform:translateY(-1px); box-shadow:0 6px 20px rgba(61,107,69,.28); }
    .submit-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }

    .bottom-link { text-align:center; font-size:.875rem; color:var(--text-muted); }
    .bottom-link a { color:var(--color-primary); font-weight:700; text-decoration:none; margin-left:4px; }
    .bottom-link a:hover { text-decoration:underline; }

    .divider { display:flex; align-items:center; gap:12px; font-size:.8125rem; color:var(--text-muted); margin-bottom:16px; }
    .divider::before, .divider::after { content:''; flex:1; height:1px; background:var(--border-default); }

    .google-btn {
      display:flex; align-items:center; justify-content:center; gap:10px;
      width:100%; height:46px;
      border:1.5px solid var(--border-default); border-radius:12px;
      background:var(--bg-base); font-family:var(--font-sans);
      font-size:.9375rem; font-weight:500; color:var(--text-primary);
      cursor:pointer; transition:border-color 150ms, box-shadow 150ms, background 150ms;
      margin-bottom:20px;
    }
    .google-btn:hover { border-color:var(--color-primary); background:var(--bg-subtle); box-shadow:0 2px 8px rgba(61,107,69,.12); }

    /* OTP screen */
    .otp-icon {
      width:64px; height:64px; border-radius:18px;
      background:var(--color-primary-100);
      display:flex; align-items:center; justify-content:center;
      margin:0 auto 20px;
    }
    .otp-heading { font-family:var(--font-display); font-size:1.5rem; font-weight:600; color:var(--text-primary); text-align:center; margin:0 0 6px; }
    .otp-sub { font-size:.875rem; color:var(--text-muted); text-align:center; margin:0 0 28px; }

    .otp-input {
      width:100%; height:60px; padding:0 14px;
      border:1.5px solid var(--border-default); border-radius:14px;
      font-family:var(--font-mono); font-size:1.75rem; font-weight:700;
      color:var(--text-primary); background:var(--bg-subtle);
      text-align:center; letter-spacing:.5em; outline:none;
      transition:border-color 150ms, background 150ms;
    }
    .otp-input:focus { border-color:var(--color-primary); background:var(--bg-base); }

    .resend-btn { background:none; border:none; cursor:pointer; font-family:var(--font-sans); font-size:.875rem; }
  `],
  template: `
    @if (!otpSent()) {
      <!-- ── Registration form ─────────────────── -->
      <h2 class="form-heading">Create your account 🌱</h2>
      <p class="form-sub">Join thousands of plant lovers on Lagaao</p>

      <form [formGroup]="form" (ngSubmit)="submit()">

        <div class="field">
          <label for="reg-name">Full name</label>
          <div class="inp-wrap">
            <input id="reg-name" formControlName="name" type="text"
                   placeholder="Rahul Sharma" class="inp" [class.error]="err('name')" />
          </div>
          @if (err('name')) { <span class="field-err">{{ err('name') }}</span> }
        </div>

        <div class="field">
          <label for="reg-email">Email address</label>
          <div class="inp-wrap">
            <input id="reg-email" formControlName="email" type="email"
                   placeholder="you@example.com" class="inp" [class.error]="err('email')" />
          </div>
          @if (err('email')) { <span class="field-err">{{ err('email') }}</span> }
        </div>

        <div class="field">
          <label for="reg-phone">
            Phone <span style="font-weight:400;color:var(--text-muted)">(optional)</span>
          </label>
          <div class="phone-wrap">
            <span class="dial-code">🇮🇳 +91</span>
            <input id="reg-phone" formControlName="phone" type="tel"
                   placeholder="9876543210" class="inp" style="flex:1" [class.error]="err('phone')" />
          </div>
          @if (err('phone')) { <span class="field-err">{{ err('phone') }}</span> }
        </div>

        <div class="field">
          <label for="reg-pw">Password</label>
          <div class="inp-wrap">
            <input id="reg-pw" formControlName="password"
                   [type]="showPw() ? 'text' : 'password'"
                   placeholder="Min 8 chars, upper, lower & number"
                   class="inp pr" [class.error]="err('password')" />
            <button type="button" class="inp-icon" (click)="showPw.update(v => !v)">
              <mat-icon style="font-size:18px;width:18px;height:18px">
                {{ showPw() ? 'visibility_off' : 'visibility' }}
              </mat-icon>
            </button>
          </div>
          <!-- Strength bar -->
          <div class="strength-bar">
            @for (i of [1,2,3,4]; track i) {
              <div class="strength-seg" [style.background]="strengthSegColor(i)"></div>
            }
          </div>
          @if (err('password')) { <span class="field-err">{{ err('password') }}</span> }
        </div>

        @if (errorMsg()) {
          <div class="error-box">{{ errorMsg() }}</div>
        }

        <!-- Referral code -->
        @if (referralApplied()) {
          <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;
                      background:rgba(22,163,74,.08);border:1px solid rgba(22,163,74,.25);margin-bottom:12px">
            <mat-icon style="color:#16a34a;font-size:18px;width:18px;height:18px">card_giftcard</mat-icon>
            <span style="font-size:.8125rem;color:#15803d;font-weight:600">
              Referral code <strong>{{ referralCode }}</strong> applied — you'll get ₹50 on first order!
            </span>
          </div>
        } @else {
          <div class="field">
            <label for="reg-ref" style="font-size:.8125rem;font-weight:600;color:var(--text-secondary)">
              Referral code
              <span style="font-weight:400;color:var(--text-muted)">(optional)</span>
            </label>
            <input id="reg-ref" [(ngModel)]="referralCode" [ngModelOptions]="{standalone:true}"
                   type="text" placeholder="e.g. A3F91C42" style="text-transform:uppercase"
                   class="inp" />
          </div>
        }

        <button type="submit" class="submit-btn" [disabled]="loading()">
          @if (loading()) {
            <mat-icon style="font-size:18px;width:18px;height:18px;animation:spin 1s linear infinite">refresh</mat-icon>
            Creating account…
          } @else {
            Create account
          }
        </button>
      </form>

      <div class="divider">or continue with</div>

      <button type="button" class="google-btn" (click)="loginWithGoogle()">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p class="bottom-link">
        Already have an account?
        <a routerLink="/auth/login">Sign in</a>
      </p>

    } @else {
      <!-- ── OTP verification ───────────────────── -->
      <div>
        <div class="otp-icon">
          <mat-icon style="font-size:28px;width:28px;height:28px;color:var(--color-primary)">mark_email_read</mat-icon>
        </div>
        <h2 class="otp-heading">Check your email</h2>
        <p class="otp-sub">
          We've sent a 6-digit code to<br>
          <strong style="color:var(--text-primary)">{{ form.value.email }}</strong>
        </p>

        <form (ngSubmit)="submitOtp()">
          <div class="field">
            <input [(ngModel)]="otp" name="otp"
                   type="text" inputmode="numeric" maxlength="6"
                   placeholder="· · · · · ·"
                   class="otp-input" />
          </div>

          @if (otpError()) {
            <div class="error-box">{{ otpError() }}</div>
          }

          <button type="submit" class="submit-btn" [disabled]="otp.length !== 6 || loading()">
            @if (loading()) {
              <mat-icon style="font-size:18px;width:18px;height:18px;animation:spin 1s linear infinite">refresh</mat-icon>
              Verifying…
            } @else {
              Verify & Continue
            }
          </button>
        </form>

        <p class="bottom-link">
          Didn't receive it?
          <button class="resend-btn" style="color:var(--color-primary);font-weight:700" (click)="resendOtp()">
            Resend OTP
          </button>
        </p>
      </div>
    }
  `,
})
export class RegisterComponent implements OnInit {
  readonly #auth   = inject(AuthService);
  readonly #router = inject(Router);
  readonly #toast  = inject(ToastService);
  readonly #fb     = inject(FormBuilder);
  readonly #route  = inject(ActivatedRoute);

  loginWithGoogle(): void { this.#auth.loginWithGoogle(); }

  readonly loading      = signal(false);
  readonly errorMsg     = signal('');
  readonly otpError     = signal('');
  readonly otpSent      = signal(false);
  readonly showPw       = signal(false);
  readonly referralApplied = signal(false);

  otp          = '';
  referralCode = '';

  ngOnInit() {
    const ref = this.#route.snapshot.queryParamMap.get('ref');
    if (ref) { this.referralCode = ref; this.referralApplied.set(true); }
  }

  form = this.#fb.nonNullable.group({
    name:     ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    phone:    ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), strongPassword]],
  });

  err(field: string): string | null {
    const c = this.form.get(field)!;
    if (!c.dirty || !c.errors) return null;
    if (c.errors['required'])  return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    if (c.errors['minlength']) return 'Too short';
    if (c.errors['email'])     return 'Enter a valid email';
    if (c.errors['pattern'])   return 'Enter a valid 10-digit mobile number';
    if (c.errors['weak'])      return 'Must include uppercase, lowercase and a number';
    return null;
  }

  strengthSegColor(i: number): string {
    const pw  = this.form.value.password ?? '';
    const str = this.#strength(pw);
    if (i > str) return 'var(--border-default)';
    if (str === 1) return '#c0392b';
    if (str === 2) return '#d4880a';
    if (str === 3) return '#f59e0b';
    return 'var(--color-primary)';
  }

  #strength(pw: string): number {
    let s = 0;
    if (pw.length >= 8)          s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.errorMsg.set('');
    const { name, email, password, phone } = this.form.getRawValue();
    this.#auth.register({
      name, email, password,
      phone:        phone || undefined,
      referralCode: this.referralCode || undefined,
    }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.otpSent.set(true);
        if (res?.data?.devOtp) {
          this.otp = res.data.devOtp;
          this.#toast.info('Dev mode — OTP auto-filled', `OTP: ${res.data.devOtp}`);
        } else {
          this.#toast.info('OTP sent', `Check your email at ${email}`);
        }
      },
      error: (err: any) => {
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
        this.#toast.success('Account created!', 'Welcome to Lagaao 🌿');
        this.#router.navigate(['/']);
      },
      error: err => {
        this.otpError.set(err.error?.message ?? 'Invalid or expired OTP');
        this.loading.set(false);
      },
    });
  }

  resendOtp(): void {
    this.#auth.resendOtp(this.form.value.email!).subscribe({
      next: () => this.#toast.info('OTP resent', 'Check your inbox'),
    });
  }
}

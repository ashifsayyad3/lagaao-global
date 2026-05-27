import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const BASE    = `${environment.apiUrl}/api/v1/auth/mfa`;
const API_BASE = `${environment.apiUrl}/api/v1`;

type Step = 'idle' | 'setup' | 'enable' | 'backup' | 'disable';

@Component({
  selector: 'lg-profile-security',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule],
  template: `
<div class="max-w-xl mx-auto p-6 space-y-6">

  <div>
    <h1 class="text-xl font-bold text-text-primary">Security</h1>
    <p class="text-sm text-text-muted mt-0.5">Manage two-factor authentication for your account</p>
  </div>

  <!-- MFA status card -->
  <div class="rounded-2xl border border-border-default bg-bg-base p-5 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center"
             [class.bg-green-100]="mfaEnabled()"
             [class.bg-surface-50]="!mfaEnabled()">
          <mat-icon [class.text-green-600]="mfaEnabled()" [class.text-text-muted]="!mfaEnabled()">
            {{ mfaEnabled() ? 'verified_user' : 'security' }}
          </mat-icon>
        </div>
        <div>
          <p class="font-semibold text-text-primary text-sm">Two-Factor Authentication</p>
          <p class="text-xs mt-0.5"
             [class.text-green-600]="mfaEnabled()"
             [class.text-text-muted]="!mfaEnabled()">
            {{ mfaEnabled() ? 'Enabled — your account is protected' : 'Disabled — add extra security' }}
          </p>
        </div>
      </div>

      @if (mfaEnabled()) {
        <button (click)="startDisable()"
                class="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50">
          Disable
        </button>
      } @else {
        <button (click)="startSetup()" [disabled]="loading()"
                class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
          Enable 2FA
        </button>
      }
    </div>

    @if (mfaEnabled()) {
      <div class="border-t border-border-default pt-4">
        <button (click)="startRegenBackup()"
                class="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:underline">
          <mat-icon class="text-base">refresh</mat-icon>
          Regenerate backup codes
        </button>
      </div>
    }
  </div>

  <!-- ── Setup: QR code ───────────────────────────────────────── -->
  @if (step() === 'setup') {
    <div class="rounded-2xl border border-border-default bg-bg-base p-5 space-y-4">
      <h2 class="font-semibold text-text-primary">Scan QR Code</h2>
      <p class="text-sm text-text-secondary">
        Scan this code with your authenticator app (Google Authenticator, Authy, etc.)
      </p>

      @if (qrCode()) {
        <div class="flex justify-center">
          <img [src]="qrCode()!" alt="QR Code" class="w-48 h-48 border border-border-default rounded-xl p-2" />
        </div>
      }

      <details class="text-xs text-text-muted">
        <summary class="cursor-pointer hover:text-text-primary">Can't scan? Enter code manually</summary>
        <code class="block mt-2 bg-surface-50 rounded-lg px-3 py-2 font-mono break-all select-all">{{ manualSecret() }}</code>
      </details>

      <div class="space-y-2">
        <label class="text-xs font-medium text-text-secondary">Enter the 6-digit code to confirm</label>
        <input [(ngModel)]="otpCode" type="text" inputmode="numeric" maxlength="6"
               placeholder="000000" autocomplete="one-time-code"
               class="w-full border border-border-default rounded-xl px-4 py-2.5 text-xl font-mono
                      tracking-widest text-center bg-bg-base focus:outline-none focus:ring-2 focus:ring-primary-300" />
      </div>

      @if (error()) { <p class="text-xs text-red-500">{{ error() }}</p> }

      <div class="flex gap-2">
        <button (click)="cancelStep()"
                class="flex-1 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-surface-50">
          Cancel
        </button>
        <button (click)="confirmEnable()" [disabled]="loading() || otpCode.length < 6"
                class="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
          {{ loading() ? 'Verifying…' : 'Enable 2FA' }}
        </button>
      </div>
    </div>
  }

  <!-- ── Backup codes shown once after enable ─────────────────── -->
  @if (step() === 'backup') {
    <div class="rounded-2xl border border-green-200 bg-green-50 p-5 space-y-4">
      <div class="flex items-center gap-2">
        <mat-icon class="text-green-600">check_circle</mat-icon>
        <h2 class="font-semibold text-green-800">2FA Enabled!</h2>
      </div>
      <p class="text-sm text-green-700">
        Save these backup codes somewhere safe. Each code can only be used once if you lose access to your authenticator.
      </p>
      <div class="grid grid-cols-2 gap-2">
        @for (code of backupCodes(); track code) {
          <code class="bg-white rounded-lg px-3 py-2 text-sm font-mono text-text-primary border border-green-200 select-all">
            {{ code }}
          </code>
        }
      </div>
      <button (click)="copyBackupCodes()"
              class="flex items-center gap-1.5 text-sm text-green-700 font-medium hover:underline">
        <mat-icon class="text-base">content_copy</mat-icon>
        Copy all codes
      </button>
      <button (click)="cancelStep()"
              class="w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold">
        Done
      </button>
    </div>
  }

  <!-- ── Disable 2FA ───────────────────────────────────────────── -->
  @if (step() === 'disable') {
    <div class="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-4">
      <h2 class="font-semibold text-red-800">Disable Two-Factor Authentication</h2>
      <p class="text-sm text-red-700">Enter your authenticator code or a backup code to confirm.</p>

      <input [(ngModel)]="otpCode" type="text" inputmode="numeric" maxlength="8"
             placeholder="000000 or backup code" autocomplete="one-time-code"
             class="w-full border border-red-200 rounded-xl px-4 py-2.5 text-lg font-mono
                    tracking-widest text-center bg-white focus:outline-none focus:ring-2 focus:ring-red-300" />

      @if (error()) { <p class="text-xs text-red-600">{{ error() }}</p> }

      <div class="flex gap-2">
        <button (click)="cancelStep()"
                class="flex-1 py-2.5 rounded-xl border border-red-200 text-sm text-red-600 hover:bg-red-100">
          Cancel
        </button>
        <button (click)="confirmDisable()" [disabled]="loading() || !otpCode.trim()"
                class="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50">
          {{ loading() ? 'Disabling…' : 'Disable 2FA' }}
        </button>
      </div>
    </div>
  }

  <!-- ── Regenerate backup codes ──────────────────────────────── -->
  @if (step() === 'enable') {
    <div class="rounded-2xl border border-border-default bg-bg-base p-5 space-y-4">
      <h2 class="font-semibold text-text-primary">Regenerate Backup Codes</h2>
      <p class="text-sm text-text-secondary">Enter your current authenticator code to get new backup codes.</p>

      <input [(ngModel)]="otpCode" type="text" inputmode="numeric" maxlength="6"
             placeholder="000000" autocomplete="one-time-code"
             class="w-full border border-border-default rounded-xl px-4 py-2.5 text-xl font-mono
                    tracking-widest text-center bg-bg-base focus:outline-none focus:ring-2 focus:ring-primary-300" />

      @if (error()) { <p class="text-xs text-red-500">{{ error() }}</p> }

      <div class="flex gap-2">
        <button (click)="cancelStep()"
                class="flex-1 py-2.5 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-surface-50">
          Cancel
        </button>
        <button (click)="confirmRegenBackup()" [disabled]="loading() || otpCode.length < 6"
                class="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
          {{ loading() ? 'Generating…' : 'Regenerate' }}
        </button>
      </div>
    </div>
  }

  <!-- WhatsApp opt-in card -->
  <div class="rounded-2xl border border-border-default bg-bg-base p-5 space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <mat-icon class="text-green-600">chat</mat-icon>
        </div>
        <div>
          <p class="font-semibold text-text-primary text-sm">WhatsApp Notifications</p>
          <p class="text-xs text-text-muted mt-0.5">Receive order updates on WhatsApp</p>
        </div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" [(ngModel)]="waOptIn" (change)="saveWaOptIn()" class="sr-only peer" />
        <div class="w-11 h-6 bg-border-default rounded-full peer transition-colors peer-checked:bg-green-500
                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                    peer-checked:after:translate-x-5"></div>
      </label>
    </div>
    <p class="text-xs text-text-muted">
      We'll send order placed, shipped, out for delivery, and delivered updates to your registered phone number via WhatsApp.
      Standard messaging rates may apply.
    </p>
  </div>

</div>
  `,
})
export class ProfileSecurityComponent implements OnInit {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  mfaEnabled   = signal(false);
  step         = signal<Step>('idle');
  loading      = signal(false);
  error        = signal('');
  qrCode       = signal('');
  manualSecret = signal('');
  backupCodes  = signal<string[]>([]);
  otpCode      = '';

  waOptIn = false;

  ngOnInit() {
    this.mfaEnabled.set(!!this.#auth.user()?.mfaEnabled);
    // Load WhatsApp opt-in preference
    this.#http.get<{ success: boolean; data: { whatsappOptIn: boolean } }>(
      `${API_BASE}/users/me/preferences`
    ).subscribe({ next: r => { this.waOptIn = r.data?.whatsappOptIn ?? false; } });
  }

  saveWaOptIn() {
    this.#http.patch(`${API_BASE}/users/me/preferences`, { whatsappOptIn: this.waOptIn }).subscribe();
  }

  startSetup() {
    this.loading.set(true);
    this.error.set('');
    this.#http.get<{ success: boolean; data: { qrCodeDataUrl: string; secret: string } }>(
      `${BASE}/setup`
    ).subscribe({
      next: r => {
        this.qrCode.set(r.data.qrCodeDataUrl);
        this.manualSecret.set(r.data.secret);
        this.otpCode = '';
        this.step.set('setup');
        this.loading.set(false);
      },
      error: e => { this.error.set(e.error?.message ?? 'Error'); this.loading.set(false); },
    });
  }

  confirmEnable() {
    if (this.otpCode.length < 6) return;
    this.loading.set(true);
    this.error.set('');
    this.#http.post<{ success: boolean; data: { backupCodes: string[] } }>(
      `${BASE}/enable`, { token: this.otpCode }
    ).subscribe({
      next: r => {
        this.mfaEnabled.set(true);
        this.backupCodes.set(r.data.backupCodes);
        this.step.set('backup');
        this.loading.set(false);
      },
      error: e => { this.error.set(e.error?.message ?? 'Invalid code'); this.loading.set(false); },
    });
  }

  startDisable() { this.otpCode = ''; this.error.set(''); this.step.set('disable'); }

  confirmDisable() {
    this.loading.set(true);
    this.error.set('');
    this.#http.post(`${BASE}/disable`, { token: this.otpCode }).subscribe({
      next: () => { this.mfaEnabled.set(false); this.step.set('idle'); this.loading.set(false); },
      error: e => { this.error.set(e.error?.message ?? 'Invalid code'); this.loading.set(false); },
    });
  }

  startRegenBackup() { this.otpCode = ''; this.error.set(''); this.step.set('enable'); }

  confirmRegenBackup() {
    this.loading.set(true);
    this.error.set('');
    this.#http.post<{ success: boolean; data: { backupCodes: string[] } }>(
      `${BASE}/backup-codes`, { token: this.otpCode }
    ).subscribe({
      next: r => {
        this.backupCodes.set(r.data.backupCodes);
        this.step.set('backup');
        this.loading.set(false);
      },
      error: e => { this.error.set(e.error?.message ?? 'Invalid code'); this.loading.set(false); },
    });
  }

  cancelStep() { this.step.set('idle'); this.otpCode = ''; this.error.set(''); }

  copyBackupCodes() {
    navigator.clipboard.writeText(this.backupCodes().join('\n'));
  }
}

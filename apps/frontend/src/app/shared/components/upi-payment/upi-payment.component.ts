import {
  ChangeDetectionStrategy, Component, inject, signal, output, input, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type UpiSubMethod = 'app' | 'qr' | 'id';
export type UpiApp = 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'other';
export type UpiState = 'select' | 'id-entry' | 'qr' | 'verifying' | 'waiting' | 'success' | 'failed';

export interface UpiPaymentResult {
  method: UpiSubMethod;
  upiId?: string;
  app?: UpiApp;
}

@Component({
  selector: 'lg-upi-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="upi-root">

  <!-- ── State: App / QR / ID selection ───────────────────────── -->
  @if (state() === 'select') {
    <div class="upi-apps animate-fade-in-scale">

      <!-- App shortcuts -->
      <p class="upi-section-label">Pay with UPI app</p>
      <div class="upi-app-grid">
        @for (app of upiApps; track app.id) {
          <button class="upi-app-btn" (click)="selectApp(app.id)">
            <div class="upi-app-icon" [style.background]="app.bg">
              <span class="upi-app-emoji">{{ app.emoji }}</span>
            </div>
            <span class="upi-app-name">{{ app.name }}</span>
          </button>
        }
      </div>

      <div class="upi-divider"><span>or</span></div>

      <!-- Secondary options -->
      <div class="upi-alt-row">
        <button class="upi-alt-btn" (click)="state.set('id-entry')">
          <div class="upi-alt-icon" style="background:#eff6ff;color:#2563eb">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>
            </svg>
          </div>
          <div>
            <div class="upi-alt-label">Enter UPI ID</div>
            <div class="upi-alt-sub">yourname&#64;upi</div>
          </div>
          <svg class="upi-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <button class="upi-alt-btn" (click)="state.set('qr')">
          <div class="upi-alt-icon" style="background:#f0fdf4;color:#16a34a">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="4" height="4"/>
            </svg>
          </div>
          <div>
            <div class="upi-alt-label">Scan & Pay QR</div>
            <div class="upi-alt-sub">Open any UPI app and scan</div>
          </div>
          <svg class="upi-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  }

  <!-- ── State: UPI ID entry ────────────────────────────────────── -->
  @if (state() === 'id-entry') {
    <div class="upi-panel animate-slide-in-up">
      <button class="upi-back-btn" (click)="state.set('select')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <div class="upi-id-form">
        <div class="upi-id-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
        </div>
        <p class="upi-id-title">Enter your UPI ID</p>
        <p class="upi-id-sub">Your bank UPI handle e.g. 9876543210&#64;ybl</p>

        <div class="upi-input-wrap" [class.error]="upiIdError()">
          <input
            class="upi-input"
            [(ngModel)]="upiId"
            placeholder="yourname&#64;upi"
            autocomplete="off"
            autocorrect="off"
            (keydown.enter)="verifyUpiId()"
            [disabled]="state() === 'verifying'"
          />
          @if (upiId) {
            <button class="upi-clear-btn" (click)="upiId = ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          }
        </div>
        @if (upiIdError()) {
          <p class="upi-error-msg animate-slide-in-up">{{ upiIdError() }}</p>
        }

        <button
          class="upi-verify-btn"
          [disabled]="!upiId || verifying()"
          (click)="verifyUpiId()"
        >
          @if (verifying()) {
            <span class="upi-spinner"></span>
            Verifying…
          } @else {
            Verify & Pay
          }
        </button>

        <div class="upi-common-ids">
          <p class="upi-section-label" style="margin-bottom:8px">Common UPI handles</p>
          <div class="upi-handle-chips">
            @for (h of commonHandles; track h) {
              <button class="upi-handle-chip" (click)="appendHandle(h)">{{ h }}</button>
            }
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ── State: QR code ────────────────────────────────────────── -->
  @if (state() === 'qr') {
    <div class="upi-panel animate-slide-in-up">
      <button class="upi-back-btn" (click)="state.set('select')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>

      <div class="upi-qr-wrap">
        <div class="upi-qr-badge">Scan with any UPI app</div>

        <!-- QR placeholder — in production this is generated from Razorpay -->
        <div class="upi-qr-box">
          <svg class="upi-qr-svg" viewBox="0 0 200 200" fill="currentColor">
            <!-- Outer frame corners -->
            <rect x="10" y="10" width="50" height="8" rx="2"/>
            <rect x="10" y="10" width="8" height="50" rx="2"/>
            <rect x="140" y="10" width="50" height="8" rx="2"/>
            <rect x="182" y="10" width="8" height="50" rx="2"/>
            <rect x="10" y="182" width="50" height="8" rx="2"/>
            <rect x="10" y="140" width="8" height="50" rx="2"/>
            <rect x="140" y="182" width="50" height="8" rx="2"/>
            <rect x="182" y="140" width="8" height="50" rx="2"/>
            <!-- Inner blocks (simulated QR pattern) -->
            <rect x="24" y="24" width="36" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="6"/>
            <rect x="32" y="32" width="20" height="20" rx="1"/>
            <rect x="140" y="24" width="36" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="6"/>
            <rect x="148" y="32" width="20" height="20" rx="1"/>
            <rect x="24" y="140" width="36" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="6"/>
            <rect x="32" y="148" width="20" height="20" rx="1"/>
            <!-- Lagaao logo center -->
            <rect x="85" y="85" width="30" height="30" rx="6" fill="#3d6b45"/>
            <text x="100" y="104" font-size="14" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold">L</text>
            <!-- Random dots -->
            @for (d of qrDots; track d.x) {
              <rect [attr.x]="d.x" [attr.y]="d.y" width="6" height="6" rx="1"/>
            }
          </svg>
        </div>

        <div class="upi-qr-amount">
          ₹{{ amount() | number:'1.2-2' }}
        </div>
        <p class="upi-qr-hint">QR expires in <span class="upi-qr-timer">{{ qrTimer() }}</span></p>

        <button class="upi-verify-btn" (click)="confirmQrPayment()">
          I've completed the payment
        </button>
      </div>
    </div>
  }

  <!-- ── State: Verifying / Processing ─────────────────────────── -->
  @if (state() === 'verifying' || state() === 'waiting') {
    <div class="upi-processing animate-fade-in-scale">
      <div class="upi-processing-ring">
        <div class="upi-processing-spinner"></div>
        <div class="upi-processing-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3d6b45" stroke-width="1.5"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>
        </div>
      </div>
      <p class="upi-processing-title">
        {{ state() === 'verifying' ? 'Verifying UPI ID…' : 'Waiting for payment…' }}
      </p>
      <p class="upi-processing-sub">
        {{ state() === 'verifying'
            ? 'Checking your UPI handle with the bank'
            : 'Complete the payment in your UPI app. Do not close this window.' }}
      </p>
      @if (state() === 'waiting') {
        <button class="upi-back-btn" style="margin-top:16px" (click)="state.set('select')">
          Try a different method
        </button>
      }
    </div>
  }

  <!-- ── State: App-selected (waiting for deep link) ───────────── -->
  @if (state() === 'select' && selectedApp()) {
    <!-- Overlay handled by parent selecting via app button -->
  }

</div>
  `,
  styles: [`
    :host { display: block; }

    .upi-root { padding: 4px 0; }

    /* ── Section label ──────────────────────────────────────────── */
    .upi-section-label {
      font-size: .75rem; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: .06em; margin: 0 0 12px;
    }

    /* ── App grid ───────────────────────────────────────────────── */
    .upi-apps { display: flex; flex-direction: column; }

    .upi-app-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
    }

    .upi-app-btn {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 14px 8px;
      border: 1.5px solid var(--border-default);
      border-radius: var(--radius-lg);
      background: var(--surface-1);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-out);

      &:hover {
        border-color: var(--color-primary);
        background: var(--color-primary-50);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
      &:active { transform: translateY(0); }
    }

    .upi-app-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .upi-app-emoji { font-size: 22px; line-height: 1; }
    .upi-app-name  { font-size: .75rem; font-weight: 600; color: var(--text-secondary); text-align: center; }

    /* ── Divider ────────────────────────────────────────────────── */
    .upi-divider {
      display: flex; align-items: center; gap: .75rem;
      margin: 16px 0;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--border-default); }
      span { font-size: .8125rem; color: var(--text-muted); }
    }

    /* ── Alt buttons ────────────────────────────────────────────── */
    .upi-alt-row { display: flex; flex-direction: column; gap: 8px; }

    .upi-alt-btn {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px;
      border: 1.5px solid var(--border-default);
      border-radius: var(--radius-lg);
      background: var(--surface-1);
      cursor: pointer;
      text-align: left;
      transition: all var(--duration-fast) var(--ease-out);

      &:hover {
        border-color: var(--color-primary);
        background: var(--color-primary-50);
      }
    }

    .upi-alt-icon {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .upi-alt-label { font-size: .9375rem; font-weight: 600; color: var(--text-primary); }
    .upi-alt-sub   { font-size: .75rem; color: var(--text-muted); margin-top: 1px; }
    .upi-chevron   { margin-left: auto; color: var(--text-muted); flex-shrink: 0; }

    /* ── Panel (ID entry / QR) ──────────────────────────────────── */
    .upi-panel { display: flex; flex-direction: column; gap: 4px; }

    .upi-back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: .875rem; font-weight: 600; color: var(--text-muted);
      background: none; border: none; cursor: pointer; padding: 0;
      transition: color var(--duration-fast);
      margin-bottom: 12px;
      &:hover { color: var(--color-primary); }
    }

    /* ── ID entry ───────────────────────────────────────────────── */
    .upi-id-form {
      display: flex; flex-direction: column; align-items: center;
      gap: 4px; text-align: center; padding: 8px 0;
    }

    .upi-id-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: var(--color-primary-50); color: var(--color-primary);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }
    .upi-id-title { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .upi-id-sub   { font-size: .875rem; color: var(--text-muted); margin: 0 0 16px; }

    .upi-input-wrap {
      position: relative; width: 100%; max-width: 360px;
      &.error .upi-input { border-color: var(--color-error); }
    }

    .upi-input {
      width: 100%; height: 52px;
      padding: 0 44px 0 16px;
      font-size: 1rem; font-family: var(--font-mono);
      background: var(--surface-1);
      border: 2px solid var(--border-default);
      border-radius: var(--radius-lg);
      color: var(--text-primary);
      outline: none;
      text-align: center;
      letter-spacing: .02em;
      transition: border-color var(--duration-fast);
      &:focus { border-color: var(--color-primary); }
      &::placeholder { font-family: var(--font-sans); color: var(--text-muted); letter-spacing: 0; }
      &:disabled { opacity: .5; }
    }

    .upi-clear-btn {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: var(--text-muted);
      display: flex; align-items: center; justify-content: center;
      width: 24px; height: 24px;
      &:hover { color: var(--text-primary); }
    }

    .upi-error-msg {
      font-size: .8125rem; font-weight: 600; color: var(--color-error);
      margin: 4px 0 0;
    }

    .upi-verify-btn {
      display: inline-flex; align-items: center; gap: 8px;
      width: 100%; max-width: 360px; height: 52px;
      margin-top: 12px;
      justify-content: center;
      background: var(--gradient-primary);
      color: #fff; border: none; border-radius: var(--radius-lg);
      font-family: var(--font-sans); font-size: 1rem; font-weight: 700;
      cursor: pointer; box-shadow: var(--shadow-primary);
      transition: filter var(--duration-fast), transform var(--duration-fast);

      &:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }
      &:active:not(:disabled) { transform: translateY(0); }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }

    .upi-spinner {
      width: 18px; height: 18px; border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      animation: upi-spin .7s linear infinite;
    }
    @keyframes upi-spin { to { transform: rotate(360deg); } }

    /* ── Common handles ─────────────────────────────────────────── */
    .upi-common-ids { margin-top: 16px; width: 100%; text-align: left; }

    .upi-handle-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .upi-handle-chip {
      padding: 4px 12px; border-radius: var(--radius-pill);
      border: 1px solid var(--border-default);
      background: var(--surface-2);
      font-size: .8125rem; font-weight: 500; color: var(--text-secondary);
      cursor: pointer; font-family: var(--font-mono);
      transition: all var(--duration-fast);
      &:hover { border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-50); }
    }

    /* ── QR ─────────────────────────────────────────────────────── */
    .upi-qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0; }

    .upi-qr-badge {
      font-size: .75rem; font-weight: 700; color: var(--color-primary);
      background: var(--color-primary-50); border: 1px solid var(--color-primary-100);
      border-radius: var(--radius-pill); padding: 4px 14px;
    }

    .upi-qr-box {
      width: 200px; height: 200px; border-radius: 16px;
      border: 2px solid var(--border-default);
      background: var(--surface-1);
      display: flex; align-items: center; justify-content: center;
      box-shadow: var(--shadow-md);
      padding: 4px;
    }

    .upi-qr-svg { width: 100%; height: 100%; color: var(--text-primary); }

    .upi-qr-amount { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); letter-spacing: -.03em; }
    .upi-qr-hint   { font-size: .8125rem; color: var(--text-muted); margin: 0; }
    .upi-qr-timer  { font-weight: 700; color: var(--color-primary); }

    /* ── Processing ─────────────────────────────────────────────── */
    .upi-processing { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; text-align: center; gap: 8px; }

    .upi-processing-ring {
      position: relative; width: 80px; height: 80px; margin-bottom: 8px;
    }
    .upi-processing-spinner {
      position: absolute; inset: 0;
      border-radius: 50%;
      border: 3px solid var(--border-default);
      border-top-color: var(--color-primary);
      animation: upi-spin 1s linear infinite;
    }
    .upi-processing-icon {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .upi-processing-title { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .upi-processing-sub   { font-size: .875rem; color: var(--text-muted); max-width: 28ch; margin: 0; }
  `],
})
export class UpiPaymentComponent {
  readonly amount = input<number>(0);

  /** Emits when user completes UPI entry (parent calls payment API) */
  readonly confirmed = output<UpiPaymentResult>();
  /** Emits when user cancels back */
  readonly cancelled = output<void>();

  readonly state       = signal<UpiState>('select');
  readonly selectedApp = signal<UpiApp | null>(null);
  readonly verifying   = signal(false);
  readonly upiIdError  = signal('');
  readonly qrTimer     = signal('04:59');

  upiId = '';

  #qrInterval: ReturnType<typeof setInterval> | null = null;

  readonly upiApps = [
    { id: 'gpay'    as UpiApp, name: 'Google Pay',  emoji: '🟢', bg: '#f0fdf4' },
    { id: 'phonepe' as UpiApp, name: 'PhonePe',     emoji: '🟣', bg: '#faf5ff' },
    { id: 'paytm'   as UpiApp, name: 'Paytm',       emoji: '🔵', bg: '#eff6ff' },
    { id: 'bhim'    as UpiApp, name: 'BHIM UPI',    emoji: '🇮🇳', bg: '#fff7ed' },
  ];

  readonly commonHandles = ['@okicici', '@okhdfcbank', '@oksbi', '@okaxis', '@ybl', '@ibl', '@paytm'];

  readonly qrDots = this.#generateQrDots();

  selectApp(app: UpiApp): void {
    this.selectedApp.set(app);
    this.state.set('waiting');
    this.confirmed.emit({ method: 'app', app });
  }

  appendHandle(h: string): void {
    const base = this.upiId.includes('@') ? this.upiId.split('@')[0] : this.upiId;
    this.upiId = base + h;
  }

  verifyUpiId(): void {
    const id = this.upiId.trim();
    if (!id) return;

    const upiRegex = /^[\w.\-]+@[\w]+$/;
    if (!upiRegex.test(id)) {
      this.upiIdError.set('Invalid UPI ID format. Example: name@ybl');
      return;
    }
    this.upiIdError.set('');
    this.verifying.set(true);
    this.state.set('verifying');

    // Simulate verification — parent handles real API call
    setTimeout(() => {
      this.verifying.set(false);
      this.confirmed.emit({ method: 'id', upiId: id });
    }, 2000);
  }

  confirmQrPayment(): void {
    this.state.set('waiting');
    this.confirmed.emit({ method: 'qr' });
  }

  startQrTimer(): void {
    let seconds = 299;
    this.#qrInterval = setInterval(() => {
      seconds--;
      if (seconds <= 0) { clearInterval(this.#qrInterval!); return; }
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      this.qrTimer.set(`${m}:${s}`);
    }, 1000);
  }

  #generateQrDots(): Array<{ x: number; y: number }> {
    const dots: Array<{ x: number; y: number }> = [];
    const seed = [
      [70,10],[80,10],[100,10],[110,10],[70,20],[90,20],[110,20],
      [10,70],[30,70],[50,70],[10,80],[40,80],[60,80],[10,90],[20,90],[50,90],
      [70,70],[80,70],[100,70],[110,70],[70,80],[90,80],[110,80],
      [70,90],[80,90],[100,90],[110,90],[70,100],[90,100],
      [10,100],[30,100],[50,100],[10,110],[20,110],[40,110],
      [80,110],[90,110],[100,110],[110,110],[80,120],[100,120],
      [10,120],[30,120],[50,120],
      [70,130],[90,130],[110,130],[80,140],[100,140],[110,140],
      [10,130],[20,130],[40,130],[50,130],[10,140],[30,140],
      [10,150],[20,150],[40,150],[50,150],[10,160],[30,160],
    ];
    return seed.map(([x, y]) => ({ x, y }));
  }
}

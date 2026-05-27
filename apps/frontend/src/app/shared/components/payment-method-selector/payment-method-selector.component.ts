import {
  ChangeDetectionStrategy, Component, model, output, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UpiPaymentComponent, UpiPaymentResult } from '../upi-payment/upi-payment.component';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';

export interface CardDetails {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

export interface PaymentSelection {
  method: PaymentMethod;
  upiResult?: UpiPaymentResult;
  card?: CardDetails;
  bank?: string;
}

interface PaymentOption {
  key: PaymentMethod;
  label: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  logos: string[];     // emoji or text logos
  recommended?: boolean;
}

@Component({
  selector: 'lg-payment-method-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, UpiPaymentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="pms-root">

  <!-- ── Method tabs ──────────────────────────────────────────── -->
  <div class="pms-methods">
    @for (opt of options; track opt.key) {
      <div
        class="pms-method-card"
        [class.selected]="selected() === opt.key"
        [class.recommended]="opt.recommended"
        (click)="selectMethod(opt.key)"
        role="radio"
        [attr.aria-checked]="selected() === opt.key"
      >
        <!-- Radio dot -->
        <div class="pms-radio" [class.active]="selected() === opt.key">
          @if (selected() === opt.key) {
            <div class="pms-radio-dot"></div>
          }
        </div>

        <!-- Content -->
        <div class="pms-method-content">
          <div class="pms-method-top">
            <span class="pms-method-label">{{ opt.label }}</span>
            @if (opt.badge) {
              <span class="pms-method-badge" [style.background]="opt.badgeColor ?? 'var(--color-warning-bg)'"
                    [style.color]="'var(--color-warning)'">{{ opt.badge }}</span>
            }
            @if (opt.recommended) {
              <span class="pms-recommended-badge">Recommended</span>
            }
          </div>
          <div class="pms-method-sub">{{ opt.subtitle }}</div>
          <div class="pms-logos">
            @for (logo of opt.logos; track logo) {
              <span class="pms-logo">{{ logo }}</span>
            }
          </div>
        </div>

        <!-- Chevron -->
        @if (selected() === opt.key) {
          <svg class="pms-chevron-down" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        }
      </div>

      <!-- ── Expanded panel ────────────────────────────────────── -->
      @if (selected() === opt.key) {
        <div class="pms-expanded animate-slide-in-up">

          <!-- UPI panel -->
          @if (opt.key === 'upi') {
            <lg-upi-payment
              [amount]="amount()"
              (confirmed)="onUpiConfirmed($event)"
            />
          }

          <!-- Card panel -->
          @if (opt.key === 'card') {
            <div class="pms-card-form">
              <div class="pms-card-preview" [class.flipped]="cardFocused() === 'cvv'">
                <div class="pms-card-front">
                  <div class="pms-card-chip">
                    <svg width="32" height="24" viewBox="0 0 32 24">
                      <rect width="32" height="24" rx="4" fill="#fbbf24"/>
                      <rect x="6" y="4" width="20" height="16" rx="2" fill="none" stroke="#d97706" stroke-width="1.5"/>
                      <line x1="6" y1="12" x2="26" y2="12" stroke="#d97706" stroke-width="1.5"/>
                      <line x1="16" y1="4" x2="16" y2="20" stroke="#d97706" stroke-width="1.5"/>
                    </svg>
                  </div>
                  <div class="pms-card-number-display">{{ formattedCardNumber() || '•••• •••• •••• ••••' }}</div>
                  <div class="pms-card-bottom">
                    <div>
                      <div class="pms-card-field-label">Card Holder</div>
                      <div class="pms-card-field-val">{{ cardDetails.name || 'YOUR NAME' }}</div>
                    </div>
                    <div>
                      <div class="pms-card-field-label">Expires</div>
                      <div class="pms-card-field-val">{{ cardDetails.expiry || 'MM/YY' }}</div>
                    </div>
                  </div>
                </div>
                <div class="pms-card-back">
                  <div class="pms-card-stripe"></div>
                  <div class="pms-cvv-row">
                    <div class="pms-cvv-label">CVV</div>
                    <div class="pms-cvv-val">{{ cardDetails.cvv ? '•'.repeat(cardDetails.cvv.length) : '•••' }}</div>
                  </div>
                </div>
              </div>

              <div class="pms-card-fields">
                <div class="pms-field">
                  <label>Card Number</label>
                  <input
                    class="pms-input"
                    [value]="formattedCardNumber()"
                    (input)="onCardNumberInput($event)"
                    (focus)="cardFocused.set('number')"
                    (blur)="cardFocused.set('')"
                    placeholder="1234  5678  9012  3456"
                    maxlength="19"
                    inputmode="numeric"
                  />
                </div>
                <div class="pms-field">
                  <label>Name on Card</label>
                  <input class="pms-input" [(ngModel)]="cardDetails.name"
                         (focus)="cardFocused.set('name')" (blur)="cardFocused.set('')"
                         placeholder="Rahul Sharma" autocomplete="cc-name" />
                </div>
                <div class="pms-field-row">
                  <div class="pms-field">
                    <label>Expiry Date</label>
                    <input class="pms-input" [(ngModel)]="cardDetails.expiry"
                           (input)="onExpiryInput($event)"
                           (focus)="cardFocused.set('expiry')" (blur)="cardFocused.set('')"
                           placeholder="MM / YY" maxlength="7" inputmode="numeric" />
                  </div>
                  <div class="pms-field">
                    <label>CVV
                      <svg style="width:13px;height:13px;vertical-align:middle;margin-left:3px;color:var(--text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    </label>
                    <input class="pms-input" [(ngModel)]="cardDetails.cvv"
                           (focus)="cardFocused.set('cvv')" (blur)="cardFocused.set('')"
                           placeholder="•••" maxlength="4" inputmode="numeric" type="password" />
                  </div>
                </div>
                <p class="pms-secure-note">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  256-bit SSL encrypted. We never store your card details.
                </p>
              </div>
            </div>
          }

          <!-- Net Banking panel -->
          @if (opt.key === 'netbanking') {
            <div class="pms-netbanking">
              <div class="pms-bank-grid">
                @for (bank of popularBanks; track bank.id) {
                  <button
                    class="pms-bank-btn"
                    [class.selected]="selectedBank() === bank.id"
                    (click)="selectedBank.set(bank.id)"
                  >
                    <span class="pms-bank-emoji">{{ bank.emoji }}</span>
                    <span class="pms-bank-name">{{ bank.name }}</span>
                  </button>
                }
              </div>
              <div class="pms-field" style="margin-top:12px">
                <label>Or choose another bank</label>
                <select class="pms-input" [(ngModel)]="otherBank" (change)="selectedBank.set(otherBank)">
                  <option value="">Select bank</option>
                  @for (b of allBanks; track b) {
                    <option [value]="b">{{ b }}</option>
                  }
                </select>
              </div>
            </div>
          }

          <!-- COD panel -->
          @if (opt.key === 'cod') {
            <div class="pms-cod">
              <div class="pms-cod-icon">💵</div>
              <p class="pms-cod-title">Cash on Delivery</p>
              <p class="pms-cod-sub">Pay ₹{{ amount() | number:'1.0-0' }} cash when your order arrives.</p>
              <div class="pms-cod-fee">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                A handling fee of <strong>₹20</strong> is added for COD orders.
              </div>
              <div class="pms-cod-checklist">
                @for (item of codChecklist; track item) {
                  <div class="pms-cod-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {{ item }}
                  </div>
                }
              </div>
            </div>
          }

          <!-- Wallet panel -->
          @if (opt.key === 'wallet') {
            <div class="pms-wallet">
              <div class="pms-wallet-balance">
                <span class="pms-wallet-label">Available Balance</span>
                <span class="pms-wallet-amount">₹{{ walletBalance | number:'1.2-2' }}</span>
              </div>
              @if (walletBalance < amount()) {
                <div class="pms-wallet-low">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  Insufficient balance. You need ₹{{ (amount() - walletBalance) | number:'1.2-2' }} more.
                </div>
              }
            </div>
          }

        </div>
      }
    }
  </div>

</div>
  `,
  styles: [`
    :host { display: block; }

    /* ── Root ──────────────────────────────────────────────────── */
    .pms-root { display: flex; flex-direction: column; gap: 8px; }

    /* ── Method card ───────────────────────────────────────────── */
    .pms-methods { display: flex; flex-direction: column; gap: 8px; }

    .pms-method-card {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 16px;
      border: 1.5px solid var(--border-default);
      border-radius: var(--radius-xl);
      background: var(--surface-1);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-out);

      &:hover:not(.selected) {
        border-color: var(--border-strong);
        background: var(--surface-2);
      }

      &.selected {
        border-color: var(--color-primary);
        background: var(--color-primary-50);
      }

      &.recommended {
        order: -1;
      }
    }

    .pms-radio {
      width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
      border: 2px solid var(--border-strong);
      display: flex; align-items: center; justify-content: center;
      margin-top: 2px;
      transition: border-color var(--duration-fast);

      &.active { border-color: var(--color-primary); }
    }
    .pms-radio-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--color-primary);
      animation: pms-pop .15s var(--ease-spring, ease-out);
    }
    @keyframes pms-pop {
      from { transform: scale(0); }
      to   { transform: scale(1); }
    }

    .pms-method-content { flex: 1; min-width: 0; }
    .pms-method-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .pms-method-label { font-size: .9375rem; font-weight: 600; color: var(--text-primary); }
    .pms-method-sub   { font-size: .8125rem; color: var(--text-muted); margin-top: 2px; }

    .pms-method-badge {
      font-size: .6875rem; font-weight: 700; padding: 2px 8px;
      border-radius: var(--radius-pill); white-space: nowrap;
    }
    .pms-recommended-badge {
      font-size: .6875rem; font-weight: 700; padding: 2px 8px;
      border-radius: var(--radius-pill); background: var(--color-primary-50);
      color: var(--color-primary); border: 1px solid var(--color-primary-100);
    }

    .pms-logos { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px; }
    .pms-logo {
      font-size: .6875rem; font-weight: 700; padding: 2px 7px;
      border-radius: 4px; background: var(--surface-2); color: var(--text-muted);
      border: 1px solid var(--border-default);
    }

    .pms-chevron-down { color: var(--color-primary); margin-left: auto; flex-shrink: 0; margin-top: 2px; }

    /* ── Expanded panel ─────────────────────────────────────────── */
    .pms-expanded {
      padding: 16px;
      border: 1.5px solid var(--color-primary-100);
      border-top: none;
      border-radius: 0 0 var(--radius-xl) var(--radius-xl);
      background: var(--surface-1);
      margin-top: -10px;
      padding-top: 22px;
    }

    /* ── Card form ──────────────────────────────────────────────── */
    .pms-card-form { display: flex; flex-direction: column; gap: 20px; }

    .pms-card-preview {
      width: 100%; max-width: 340px; height: 190px; margin: 0 auto;
      border-radius: 18px; position: relative;
      transform-style: preserve-3d;
      transition: transform .6s var(--ease-out);

      &.flipped { transform: rotateY(180deg); }
    }

    .pms-card-front, .pms-card-back {
      position: absolute; inset: 0; border-radius: 18px;
      backface-visibility: hidden; -webkit-backface-visibility: hidden;
    }

    .pms-card-front {
      background: linear-gradient(135deg, #1e3a2f 0%, #3d6b45 60%, #5a8f64 100%);
      color: #fff; padding: 20px 24px;
      display: flex; flex-direction: column; justify-content: space-between;
      box-shadow: var(--shadow-lg);
    }

    .pms-card-back {
      background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
      transform: rotateY(180deg);
      padding: 24px 0 20px;
      box-shadow: var(--shadow-lg);
    }

    .pms-card-chip { margin-bottom: 8px; }

    .pms-card-number-display {
      font-size: 1.125rem; font-family: var(--font-mono); letter-spacing: .18em;
      font-weight: 700;
    }

    .pms-card-bottom { display: flex; gap: 32px; }
    .pms-card-field-label { font-size: .6rem; opacity: .7; text-transform: uppercase; letter-spacing: .1em; }
    .pms-card-field-val   { font-size: .875rem; font-weight: 700; font-family: var(--font-mono); }

    .pms-card-stripe { height: 40px; background: #111; margin-bottom: 16px; }
    .pms-cvv-row { display: flex; align-items: center; gap: 12px; padding: 0 24px; }
    .pms-cvv-label { color: #aaa; font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; }
    .pms-cvv-val {
      flex: 1; background: #f5f5f5; border-radius: 4px;
      padding: 8px 12px; font-family: var(--font-mono); letter-spacing: .2em;
      color: #333; text-align: right;
    }

    /* ── Card fields ────────────────────────────────────────────── */
    .pms-card-fields { display: flex; flex-direction: column; gap: 14px; }
    .pms-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .pms-field { display: flex; flex-direction: column; gap: 6px; }
    .pms-field label { font-size: .8125rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; }

    .pms-input {
      width: 100%; height: 48px; padding: 0 14px;
      border: 1.5px solid var(--border-default); border-radius: var(--radius-lg);
      font-family: var(--font-sans); font-size: .9375rem; color: var(--text-primary);
      background: var(--surface-1); outline: none;
      transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
      &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px var(--color-focus-ring);
      }
      &::placeholder { color: var(--text-muted); }
    }
    select.pms-input { cursor: pointer; }

    .pms-secure-note {
      display: flex; align-items: center; gap: 6px;
      font-size: .75rem; color: var(--text-muted); margin: 0;
    }

    /* ── Net banking ────────────────────────────────────────────── */
    .pms-netbanking { display: flex; flex-direction: column; gap: 0; }

    .pms-bank-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }

    .pms-bank-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 12px 8px; border-radius: var(--radius-lg);
      border: 1.5px solid var(--border-default); background: var(--surface-1);
      cursor: pointer; transition: all var(--duration-fast) var(--ease-out);
      &:hover { border-color: var(--color-primary); background: var(--color-primary-50); }
      &.selected { border-color: var(--color-primary); background: var(--color-primary-50); }
    }
    .pms-bank-emoji { font-size: 20px; }
    .pms-bank-name  { font-size: .75rem; font-weight: 600; color: var(--text-secondary); text-align: center; }

    /* ── COD ────────────────────────────────────────────────────── */
    .pms-cod {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 8px 0; text-align: center;
    }
    .pms-cod-icon  { font-size: 40px; line-height: 1; }
    .pms-cod-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .pms-cod-sub   { font-size: .875rem; color: var(--text-muted); margin: 0; }
    .pms-cod-fee {
      display: flex; align-items: center; gap: 6px;
      font-size: .8125rem; color: var(--color-warning);
      background: var(--color-warning-bg); border-radius: var(--radius-md);
      padding: 8px 14px; border: 1px solid rgba(217,119,6,.2);
    }
    .pms-cod-checklist { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; text-align: left; width: 100%; max-width: 280px; }
    .pms-cod-check { display: flex; align-items: center; gap: 8px; font-size: .875rem; color: var(--text-secondary); }

    /* ── Wallet ─────────────────────────────────────────────────── */
    .pms-wallet { padding: 12px 0; }
    .pms-wallet-balance {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 16px; background: var(--color-primary-50);
      border: 1px solid var(--color-primary-100); border-radius: var(--radius-lg);
    }
    .pms-wallet-label  { font-size: .875rem; font-weight: 600; color: var(--text-secondary); }
    .pms-wallet-amount { font-size: 1.25rem; font-weight: 800; color: var(--color-primary); }
    .pms-wallet-low {
      display: flex; align-items: center; gap: 8px;
      margin-top: 10px; padding: 10px 14px;
      background: var(--color-warning-bg); border: 1px solid rgba(217,119,6,.2);
      border-radius: var(--radius-md); font-size: .8125rem; color: var(--color-warning);
    }
  `],
})
export class PaymentMethodSelectorComponent {
  readonly selected  = model<PaymentMethod>('upi');
  readonly amount    = model<number>(0);

  readonly confirmed = output<PaymentSelection>();

  readonly selectedBank = signal('');
  readonly cardFocused  = signal('');

  cardDetails: CardDetails = { number: '', name: '', expiry: '', cvv: '' };
  otherBank = '';
  walletBalance = 247.50;

  readonly formattedCardNumber = computed(() => {
    const raw = this.cardDetails.number.replace(/\D/g, '').substring(0, 16);
    return raw.replace(/(.{4})/g, '$1  ').trim();
  });

  readonly options: PaymentOption[] = [
    {
      key: 'upi',
      label: 'UPI',
      subtitle: 'Instant payment via GPay, PhonePe, Paytm & more',
      recommended: true,
      logos: ['GPay', 'PhonePe', 'Paytm', 'BHIM'],
    },
    {
      key: 'card',
      label: 'Credit / Debit Card',
      subtitle: 'Visa, Mastercard, RuPay, AmEx accepted',
      logos: ['Visa', 'MC', 'RuPay', 'AmEx'],
    },
    {
      key: 'netbanking',
      label: 'Net Banking',
      subtitle: 'All major Indian banks supported',
      logos: ['SBI', 'HDFC', 'ICICI', 'Axis', '+50'],
    },
    {
      key: 'wallet',
      label: 'Lagaao Wallet',
      subtitle: `Balance: ₹${this.walletBalance.toFixed(2)}`,
      logos: ['💳 Wallet'],
    },
    {
      key: 'cod',
      label: 'Cash on Delivery',
      subtitle: 'Pay when your order arrives',
      badge: '+₹20 fee',
      logos: ['💵 Cash'],
    },
  ];

  readonly popularBanks = [
    { id: 'sbi',   name: 'SBI',   emoji: '🏦' },
    { id: 'hdfc',  name: 'HDFC',  emoji: '🏧' },
    { id: 'icici', name: 'ICICI', emoji: '🏦' },
    { id: 'axis',  name: 'Axis',  emoji: '🏦' },
    { id: 'kotak', name: 'Kotak', emoji: '🏦' },
    { id: 'bob',   name: 'BoB',   emoji: '🏦' },
    { id: 'pnb',   name: 'PNB',   emoji: '🏦' },
    { id: 'yes',   name: 'Yes',   emoji: '🏦' },
  ];

  readonly allBanks = [
    'Canara Bank', 'Union Bank', 'Bank of India', 'Central Bank',
    'Indian Bank', 'UCO Bank', 'IDBI Bank', 'Federal Bank',
    'South Indian Bank', 'Karnataka Bank', 'IndusInd Bank', 'IDFC First',
  ];

  readonly codChecklist = [
    'Keep exact change ready',
    'Inspect package before signing',
    'Returns accepted within 7 days',
  ];

  selectMethod(method: PaymentMethod): void {
    this.selected.set(method);
  }

  onUpiConfirmed(result: UpiPaymentResult): void {
    this.confirmed.emit({ method: 'upi', upiResult: result });
  }

  onCardNumberInput(e: Event): void {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '').substring(0, 16);
    this.cardDetails.number = raw;
    (e.target as HTMLInputElement).value = raw.replace(/(.{4})/g, '$1  ').trim();
  }

  onExpiryInput(e: Event): void {
    let val = (e.target as HTMLInputElement).value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) val = val.substring(0, 2) + ' / ' + val.substring(2);
    this.cardDetails.expiry = val;
    (e.target as HTMLInputElement).value = val;
  }

  getSelection(): PaymentSelection {
    return {
      method: this.selected(),
      card:   this.selected() === 'card' ? { ...this.cardDetails } : undefined,
      bank:   this.selected() === 'netbanking' ? this.selectedBank() : undefined,
    };
  }
}

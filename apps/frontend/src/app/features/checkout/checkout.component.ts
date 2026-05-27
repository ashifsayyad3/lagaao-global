import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed,
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CartService, PriceSummary } from '../../core/services/cart.service';
import { OrderService, PaymentMethod } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RazorpayService } from '../../core/services/razorpay.service';
import { WalletService } from '../../core/services/wallet.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import {
  PaymentMethodSelectorComponent,
  PaymentSelection,
} from '../../shared/components/payment-method-selector/payment-method-selector.component';

type Step = 'address' | 'payment' | 'review';

interface AddressForm {
  fullName: string; phone: string;
  line1: string; line2: string;
  city: string; state: string; pincode: string;
}

@Component({
  selector: 'lg-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, MatIconModule, CurrencyInrPipe, PaymentMethodSelectorComponent],
  styles: [`
    :host { display: block; }
    .page { max-width: 1080px; margin: 0 auto; padding: 24px 24px 80px; }

    /* ── Breadcrumb ────────────────────────────── */
    .breadcrumb { display:flex; align-items:center; gap:4px; font-size:.8125rem; color:var(--text-muted); margin-bottom:24px; }
    .breadcrumb a { color:var(--text-muted); text-decoration:none; transition:color 150ms; }
    .breadcrumb a:hover { color:var(--color-primary); }

    /* ── Page heading ──────────────────────────── */
    .page-heading { font-family:var(--font-display); font-size:1.75rem; font-weight:600; color:var(--text-primary); margin:0 0 28px; }

    /* ── Stepper ───────────────────────────────── */
    .stepper { display:flex; align-items:center; margin-bottom:32px; }
    .step-item { display:flex; align-items:center; gap:10px; }
    .step-connector { flex:1; height:1px; background:var(--border-default); margin:0 12px; min-width:32px; transition:background 300ms; }
    .step-connector.done { background:var(--color-primary); }

    .step-circle {
      width:36px; height:36px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:.875rem; font-weight:700;
      border:2px solid var(--border-default);
      background:#fff; color:var(--text-muted);
      transition:all 200ms; flex-shrink:0;
    }
    .step-circle.active { border-color:var(--color-primary); background:var(--color-primary); color:#fff; }
    .step-circle.done   { border-color:var(--color-primary); background:var(--color-primary-50); color:var(--color-primary); }

    .step-label { font-size:.8125rem; font-weight:600; color:var(--text-muted); white-space:nowrap; }
    .step-label.active { color:var(--color-primary); }
    .step-label.done   { color:var(--text-secondary); }

    /* ── Main grid ─────────────────────────────── */
    .checkout-grid { display:grid; grid-template-columns:1fr; gap:24px; align-items:start; }
    @media(min-width:1024px){ .checkout-grid { grid-template-columns:1fr 340px; } }

    /* ── Step card ─────────────────────────────── */
    .step-card {
      background:#fff; border:1px solid var(--border-default); border-radius:20px;
      padding:28px;
    }
    .step-card-heading { font-family:var(--font-display); font-size:1.25rem; font-weight:600; color:var(--text-primary); margin:0 0 24px; }

    /* ── Form fields ───────────────────────────── */
    .form-grid { display:grid; grid-template-columns:1fr; gap:16px; }
    @media(min-width:560px){ .form-grid { grid-template-columns:1fr 1fr; } }
    .col-span-2 { grid-column:1/-1; }

    .field { display:flex; flex-direction:column; gap:5px; }
    .field label { font-size:.8125rem; font-weight:600; color:var(--text-secondary); }
    .field input, .field select {
      height:44px; padding:0 14px;
      border:1.5px solid var(--border-default); border-radius:11px;
      font-family:var(--font-sans); font-size:.875rem; color:var(--text-primary);
      background:var(--bg-subtle); outline:none; width:100%;
      transition:border-color 150ms, background 150ms;
    }
    .field input:focus, .field select:focus {
      border-color:var(--color-primary); background:#fff;
    }
    .field input::placeholder { color:var(--text-muted); }

    /* ── Payment methods ───────────────────────── */
    .payment-list { display:flex; flex-direction:column; gap:10px; }
    .pay-option {
      display:flex; align-items:center; gap:14px; padding:16px;
      border:1.5px solid var(--border-default); border-radius:14px;
      cursor:pointer; transition:border-color 150ms, background 150ms;
    }
    .pay-option:hover { border-color:var(--color-primary-200); }
    .pay-option.active { border-color:var(--color-primary); background:var(--color-primary-50); }
    .pay-icon { width:40px; height:40px; border-radius:10px; background:var(--bg-subtle); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .pay-label { font-size:.9375rem; font-weight:600; color:var(--text-primary); }
    .pay-desc  { font-size:.75rem; color:var(--text-muted); }
    .pay-badge {
      margin-left:auto; padding:2px 10px; border-radius:9999px;
      font-size:.75rem; font-weight:700;
      background:rgba(212,136,10,.12); color:var(--color-warning);
    }

    /* ── Review summaries ──────────────────────── */
    .review-box {
      background:var(--bg-subtle); border:1px solid var(--border-default); border-radius:12px; padding:14px 16px;
    }
    .review-box-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .review-box-label { font-size:.6875rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); }
    .edit-link { font-size:.75rem; color:var(--color-primary); font-weight:600; background:none; border:none; cursor:pointer; }

    .review-items { display:flex; flex-direction:column; gap:10px; }
    .review-item  { display:flex; align-items:center; gap:10px; }
    .review-item-img { width:48px; height:48px; border-radius:9px; object-fit:cover; background:var(--bg-subtle); flex-shrink:0; }
    .review-item-name { flex:1; font-size:.875rem; font-weight:500; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .review-item-qty  { font-size:.75rem; color:var(--text-muted); }
    .review-item-price{ font-size:.875rem; font-weight:700; color:var(--text-primary); }

    /* ── Step nav buttons ──────────────────────── */
    .step-actions { display:flex; justify-content:space-between; align-items:center; margin-top:24px; }

    .btn-back {
      display:flex; align-items:center; gap:6px; height:44px; padding:0 18px;
      border:1.5px solid var(--border-default); border-radius:11px;
      background:#fff; font-family:var(--font-sans); font-size:.875rem; font-weight:600;
      color:var(--text-secondary); cursor:pointer; transition:border-color 150ms;
    }
    .btn-back:hover { border-color:var(--color-primary); color:var(--color-primary); }

    .btn-next {
      display:flex; align-items:center; gap:8px; height:44px; padding:0 24px;
      border:none; border-radius:11px;
      background:var(--color-primary); color:#fff;
      font-family:var(--font-sans); font-size:.9375rem; font-weight:700;
      cursor:pointer; transition:background 150ms, transform 150ms;
    }
    .btn-next:hover:not(:disabled) { background:var(--color-primary-dark); transform:translateY(-1px); }
    .btn-next:disabled { opacity:.5; cursor:not-allowed; transform:none; }

    .btn-place {
      display:flex; align-items:center; justify-content:center; gap:8px;
      width:100%; height:52px; border:none; border-radius:14px;
      background:var(--color-primary); color:#fff;
      font-family:var(--font-sans); font-size:1rem; font-weight:700;
      cursor:pointer; transition:background 150ms, transform 150ms, box-shadow 150ms;
      margin-top:4px;
    }
    .btn-place:hover:not(:disabled) { background:var(--color-primary-dark); transform:translateY(-1px); box-shadow:0 6px 20px rgba(61,107,69,.3); }
    .btn-place:disabled { opacity:.5; cursor:not-allowed; transform:none; }

    /* ── Price panel ───────────────────────────── */
    .price-panel {
      background:#fff; border:1px solid var(--border-default); border-radius:20px;
      padding:22px; display:flex; flex-direction:column; gap:14px;
    }
    @media(min-width:1024px){ .price-panel { position:sticky; top:88px; } }

    .price-panel-heading { font-family:var(--font-display); font-size:1rem; font-weight:600; color:var(--text-primary); margin:0; }
    .price-rows { display:flex; flex-direction:column; gap:9px; font-size:.875rem; }
    .price-row  { display:flex; justify-content:space-between; color:var(--text-secondary); }
    .price-row.saving { color:var(--color-primary); }
    .price-row.cod    { color:var(--color-warning); }
    .price-divider { height:1px; background:var(--border-default); }
    .price-total { display:flex; justify-content:space-between; font-size:1.0625rem; font-weight:700; color:var(--text-primary); }

    .secure-note { display:flex; align-items:center; gap:6px; font-size:.75rem; color:var(--text-muted); justify-content:center; }
  `],
  template: `
    <div class="page">

      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/">Home</a>
        <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
        <a routerLink="/cart">Cart</a>
        <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
        <span style="color:var(--text-primary);font-weight:500">Checkout</span>
      </nav>

      <h1 class="page-heading">Checkout</h1>

      <!-- Stepper -->
      <div class="stepper">
        @for (s of steps; track s.key; let i = $index; let last = $last) {
          <div class="step-item" style="cursor:pointer" (click)="goToStep(s.key)">
            <div class="step-circle"
                 [class.active]="currentStep() === s.key"
                 [class.done]="isCompleted(s.key) && currentStep() !== s.key">
              @if (isCompleted(s.key) && currentStep() !== s.key) {
                <mat-icon style="font-size:16px;width:16px;height:16px">check</mat-icon>
              } @else {
                {{ i + 1 }}
              }
            </div>
            <span class="step-label"
                  [class.active]="currentStep() === s.key"
                  [class.done]="isCompleted(s.key) && currentStep() !== s.key">
              {{ s.label }}
            </span>
          </div>
          @if (!last) {
            <div class="step-connector" [class.done]="isCompleted(s.key)"></div>
          }
        }
      </div>

      <div class="checkout-grid">

        <!-- ── Step content ──────────────────────── -->
        <div>

          <!-- Step 1: Address -->
          @if (currentStep() === 'address') {
            <div class="step-card">
              <h2 class="step-card-heading">📍 Delivery Address</h2>
              <div class="form-grid">
                <div class="field col-span-2">
                  <label>Full Name *</label>
                  <input [(ngModel)]="address.fullName" placeholder="Rahul Sharma" />
                </div>
                <div class="field">
                  <label>Phone Number *</label>
                  <input [(ngModel)]="address.phone" type="tel" placeholder="9876543210" />
                </div>
                <div class="field">
                  <label>Pincode *</label>
                  <input [(ngModel)]="address.pincode" placeholder="400001" maxlength="6" />
                </div>
                <div class="field col-span-2">
                  <label>Address Line 1 *</label>
                  <input [(ngModel)]="address.line1" placeholder="House / Flat / Building / Wing" />
                </div>
                <div class="field col-span-2">
                  <label>Address Line 2 <span style="font-weight:400;color:var(--text-muted)">(optional)</span></label>
                  <input [(ngModel)]="address.line2" placeholder="Street / Landmark / Area" />
                </div>
                <div class="field">
                  <label>City *</label>
                  <input [(ngModel)]="address.city" placeholder="Mumbai" />
                </div>
                <div class="field">
                  <label>State *</label>
                  <select [(ngModel)]="address.state">
                    <option value="">Select state</option>
                    @for (s of indianStates; track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="step-actions">
                <a routerLink="/cart" class="btn-back">
                  <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
                  Back to Cart
                </a>
                <button class="btn-next" [disabled]="!isAddressValid()" (click)="nextStep()">
                  Continue to Payment
                  <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          }

          <!-- Step 2: Payment -->
          @if (currentStep() === 'payment') {
            <lg-payment-method-selector
              [(selected)]="paymentMethod"
              [amount]="finalTotal()"
              (confirmed)="onPaymentConfirmed($event)"
            />
            <div class="step-actions" style="margin-top:16px">
              <button class="btn-back" (click)="goToStep('address')">
                <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
                Back
              </button>
            </div>
          }

          <!-- Step 3: Review -->
          @if (currentStep() === 'review') {
            <div class="step-card">
              <h2 class="step-card-heading">✅ Review Your Order</h2>

              <div style="display:flex;flex-direction:column;gap:14px">

                <!-- Address summary -->
                <div class="review-box">
                  <div class="review-box-head">
                    <span class="review-box-label">Delivery Address</span>
                    <button class="edit-link" (click)="goToStep('address')">Edit</button>
                  </div>
                  <p style="font-size:.9375rem;font-weight:600;color:var(--text-primary);margin:0 0 2px">
                    {{ address.fullName }} &nbsp;·&nbsp; {{ address.phone }}
                  </p>
                  <p style="font-size:.875rem;color:var(--text-secondary);margin:0">
                    {{ address.line1 }}{{ address.line2 ? ', ' + address.line2 : '' }},
                    {{ address.city }}, {{ address.state }} – {{ address.pincode }}
                  </p>
                </div>

                <!-- Payment summary -->
                <div class="review-box">
                  <div class="review-box-head">
                    <span class="review-box-label">Payment</span>
                    <button class="edit-link" (click)="goToStep('payment')">Edit</button>
                  </div>
                  <p style="font-size:.9375rem;font-weight:600;color:var(--text-primary);margin:0 0 2px">
                    {{ paymentMethodLabel() }}
                  </p>
                  @if (paymentSelection()?.upiResult?.upiId) {
                    <p style="font-size:.8125rem;color:var(--text-muted);margin:0">
                      {{ paymentSelection()!.upiResult!.upiId }}
                    </p>
                  }
                  @if (paymentSelection()?.upiResult?.app) {
                    <p style="font-size:.8125rem;color:var(--text-muted);margin:0">
                      via {{ paymentSelection()!.upiResult!.app }}
                    </p>
                  }
                </div>

                <!-- Items -->
                @if ((cartSvc.cart()?.items?.length ?? 0) > 0) {
                  <div class="review-box">
                    <div class="review-box-head">
                      <span class="review-box-label">Items ({{ cartSvc.cart()!.items.length }})</span>
                    </div>
                    <div class="review-items">
                      @for (item of cartSvc.cart()!.items; track item.id) {
                        <div class="review-item">
                          <img class="review-item-img"
                               [src]="item.image || '/assets/placeholder.png'"
                               [alt]="item.productName" />
                          <div style="flex:1;min-width:0">
                            <div class="review-item-name">{{ item.productName }}</div>
                            <div class="review-item-qty">Qty: {{ item.qty }}</div>
                          </div>
                          <div class="review-item-price">{{ item.lineTotal | currencyInr }}</div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <button class="btn-place" [disabled]="placing()" (click)="placeOrder()">
                  @if (placing()) {
                    <mat-icon style="font-size:20px;width:20px;height:20px;animation:spin 1s linear infinite">refresh</mat-icon>
                    Placing order…
                  } @else {
                    <mat-icon style="font-size:20px;width:20px;height:20px">lock</mat-icon>
                    Place Order · {{ finalTotal() | currencyInr }}
                  }
                </button>

                <p style="text-align:center;font-size:.75rem;color:var(--text-muted)">
                  By placing this order you agree to our
                  <a href="#" style="color:var(--color-primary)">Terms & Conditions</a>
                </p>
              </div>
            </div>
          }
        </div>

        <!-- ── Price summary panel ───────────────── -->
        <div class="price-panel">
          <h3 class="price-panel-heading">Price Details</h3>

          @if (pricing()) {
            <div class="price-rows">
              <div class="price-row">
                <span>Subtotal</span>
                <span>{{ pricing()!.subtotal | currencyInr }}</span>
              </div>
              @if (pricing()!.discount > 0) {
                <div class="price-row saving">
                  <span>Discount</span>
                  <span>−{{ pricing()!.discount | currencyInr }}</span>
                </div>
              }
              <div class="price-row" [class.saving]="pricing()!.shipping === 0">
                <span>Delivery</span>
                <span>{{ pricing()!.shipping === 0 ? 'FREE' : (pricing()!.shipping | currencyInr) }}</span>
              </div>
              @if (paymentMethod() === 'cod') {
                <div class="price-row cod">
                  <span>COD fee</span><span>+₹20</span>
                </div>
              }
              @if (walletSvc.balance() > 0) {
                <div style="margin:10px 0;padding:10px 12px;background:var(--bg-subtle);
                             border-radius:10px;border:1.5px solid var(--border-default)">
                  <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:.875rem">
                    <input type="checkbox" [checked]="useWallet()" (change)="useWallet.set(!useWallet())"
                           style="width:16px;height:16px;accent-color:var(--color-primary)" />
                    <mat-icon style="font-size:16px;width:16px;height:16px;color:var(--color-primary)">
                      account_balance_wallet
                    </mat-icon>
                    <span style="flex:1;color:var(--text-primary);font-weight:500">
                      Use Wallet Balance
                      <span style="color:var(--text-muted);font-weight:400">
                        ({{ walletSvc.balance() | currencyInr }} available)
                      </span>
                    </span>
                  </label>
                  @if (useWallet() && walletDeduction() > 0) {
                    <div style="margin-top:6px;font-size:.8125rem;color:var(--color-primary);font-weight:600;padding-left:26px">
                      −{{ walletDeduction() | currencyInr }} will be deducted from wallet
                    </div>
                  }
                </div>
              }
              @if (useWallet() && walletDeduction() > 0) {
                <div class="price-row saving">
                  <span>Wallet Discount</span>
                  <span>−{{ walletDeduction() | currencyInr }}</span>
                </div>
              }
              @if (loyaltySvc.balance() > 0) {
                <div style="margin:10px 0;padding:10px 12px;background:var(--bg-subtle);
                             border-radius:10px;border:1.5px solid var(--border-default)">
                  <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:.875rem">
                    <input type="checkbox" [checked]="useLoyalty()" (change)="useLoyalty.set(!useLoyalty())"
                           style="width:16px;height:16px;accent-color:var(--color-primary)" />
                    <mat-icon style="font-size:16px;width:16px;height:16px;color:var(--color-primary)">stars</mat-icon>
                    <span style="flex:1;color:var(--text-primary);font-weight:500">
                      Use Loyalty Points
                      <span style="color:var(--text-muted);font-weight:400">
                        ({{ loyaltySvc.balance() }} pts available)
                      </span>
                    </span>
                  </label>
                  @if (useLoyalty() && loyaltyDeduction() > 0) {
                    <div style="margin-top:6px;font-size:.8125rem;color:var(--color-primary);font-weight:600;padding-left:26px">
                      −{{ loyaltyDeduction() | currencyInr }} ({{ loyaltyPointsUsed() }} pts used)
                    </div>
                  }
                </div>
              }
              @if (useLoyalty() && loyaltyDeduction() > 0) {
                <div class="price-row saving">
                  <span>Loyalty Discount</span>
                  <span>−{{ loyaltyDeduction() | currencyInr }}</span>
                </div>
              }
              <div class="price-divider"></div>
              <div class="price-total">
                <span>Total</span>
                <span>{{ finalTotal() | currencyInr }}</span>
              </div>
              @if (pricing()!.savings > 0) {
                <div style="text-align:center;font-size:.8125rem;color:var(--color-primary);font-weight:600;
                             background:var(--color-primary-50);border-radius:9px;padding:8px">
                  🌿 You save {{ pricing()!.savings | currencyInr }}!
                </div>
              }
            </div>
          }

          <div class="secure-note">
            <mat-icon style="font-size:14px;width:14px;height:14px;color:var(--color-primary)">lock</mat-icon>
            100% Secure Checkout
          </div>

          <!-- Payment icons -->
          <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
            @for (icon of paymentIcons; track icon) {
              <span style="font-size:11px;padding:3px 8px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:6px;color:var(--text-muted);font-weight:600">
                {{ icon }}
              </span>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  readonly cartSvc    = inject(CartService);
  readonly #orderSvc  = inject(OrderService);
  readonly #auth      = inject(AuthService);
  readonly #toast     = inject(ToastService);
  readonly #router    = inject(Router);
  readonly #razorpay  = inject(RazorpayService);
  readonly walletSvc  = inject(WalletService);
  readonly loyaltySvc = inject(LoyaltyService);

  readonly currentStep      = signal<Step>('address');
  readonly paymentMethod    = signal<PaymentMethod>('upi');
  readonly pricing          = signal<PriceSummary | null>(null);
  readonly placing          = signal(false);
  readonly completed        = signal<Set<Step>>(new Set());
  readonly paymentSelection = signal<PaymentSelection | null>(null);
  readonly useWallet        = signal(false);
  readonly useLoyalty       = signal(false);

  address: AddressForm = {
    fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
  };

  readonly steps = [
    { key: 'address' as Step, label: 'Address'  },
    { key: 'payment' as Step, label: 'Payment'  },
    { key: 'review'  as Step, label: 'Review'   },
  ];

  readonly paymentMethods = [
    { key: 'upi'        as PaymentMethod, label: 'UPI',                  icon: 'account_balance_wallet', desc: 'GPay, PhonePe, Paytm and more' },
    { key: 'card'       as PaymentMethod, label: 'Credit / Debit Card',  icon: 'credit_card',            desc: 'Visa, Mastercard, RuPay' },
    { key: 'netbanking' as PaymentMethod, label: 'Net Banking',          icon: 'account_balance',        desc: 'All major banks supported' },
    { key: 'cod'        as PaymentMethod, label: 'Cash on Delivery',     icon: 'payments',               desc: 'Pay when your order arrives' },
  ];

  readonly paymentIcons = ['UPI', 'Visa', 'MC', 'RuPay', 'NetBanking'];

  readonly indianStates = [
    'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
    'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
    'Uttarakhand','West Bengal',
  ];

  readonly selectedPaymentMethod = computed(() =>
    this.paymentMethods.find(m => m.key === this.paymentMethod())
  );

  readonly paymentMethodLabel = computed(() => {
    const sel = this.paymentSelection();
    if (sel) {
      const labels: Record<string, string> = {
        upi: 'UPI', card: 'Credit / Debit Card',
        netbanking: 'Net Banking', cod: 'Cash on Delivery', wallet: 'Wallet',
      };
      return labels[sel.method] ?? sel.method;
    }
    return this.selectedPaymentMethod()?.label ?? 'UPI';
  });

  readonly walletDeduction = computed(() => {
    if (!this.useWallet()) return 0;
    const base = (this.pricing()?.total ?? 0) + (this.paymentMethod() === 'cod' ? 20 : 0);
    return Math.min(this.walletSvc.balance(), base);
  });

  /** Max 20% of order total redeemable via loyalty points (100 pts = ₹1) */
  readonly loyaltyDeduction = computed(() => {
    if (!this.useLoyalty()) return 0;
    const base      = (this.pricing()?.total ?? 0) + (this.paymentMethod() === 'cod' ? 20 : 0);
    const maxRupees = Math.floor(base * 0.2);
    const rupees    = Math.floor(this.loyaltySvc.balance() / 100);
    return Math.min(maxRupees, rupees);
  });

  readonly loyaltyPointsUsed = computed(() => this.loyaltyDeduction() * 100);

  readonly finalTotal = computed(() => {
    const base = this.pricing()?.total ?? 0;
    const withCod = this.paymentMethod() === 'cod' ? base + 20 : base;
    return Math.max(0, withCod - this.walletDeduction() - this.loyaltyDeduction());
  });

  ngOnInit(): void {
    if (!this.cartSvc.cart()) {
      this.cartSvc.load().subscribe({ next: () => this.loadPricing() });
    } else {
      this.loadPricing();
    }
    const user = this.#auth.user();
    if (user) {
      this.address.fullName = user.name ?? '';
      this.address.phone    = (user as any).phone ?? '';
    }
    if (this.#auth.isLoggedIn()) {
      this.walletSvc.loadBalance();
      this.loyaltySvc.loadBalance();
    }
  }

  loadPricing(): void {
    this.cartSvc.getPriceSummary(this.pricing()?.couponCode ?? undefined)
      .subscribe({ next: r => this.pricing.set(r.data) });
  }

  isAddressValid(): boolean {
    const a = this.address;
    return !!(a.fullName && a.phone && a.line1 && a.city && a.state && a.pincode);
  }

  isCompleted(step: Step): boolean { return this.completed().has(step); }

  nextStep(): void {
    const order: Step[] = ['address', 'payment', 'review'];
    const idx = order.indexOf(this.currentStep());
    this.completed.update(s => { s.add(this.currentStep()); return new Set(s); });
    if (idx < order.length - 1) this.currentStep.set(order[idx + 1]);
  }

  onPaymentConfirmed(selection: PaymentSelection): void {
    this.paymentSelection.set(selection);
    this.paymentMethod.set(selection.method as PaymentMethod);
    this.nextStep();
  }

  goToStep(step: Step): void {
    const order: Step[] = ['address', 'payment', 'review'];
    const target  = order.indexOf(step);
    const current = order.indexOf(this.currentStep());
    if (target <= current || this.isCompleted(step)) this.currentStep.set(step);
  }

  placeOrder(): void {
    this.placing.set(true);
    const a   = this.address;
    const sel = this.paymentSelection();

    // Step 1: create the order in our backend
    this.#orderSvc.placeOrder({
      shippingAddress: {
        fullName: a.fullName, phone: a.phone,
        line1: a.line1, line2: a.line2 || undefined,
        city: a.city, state: a.state, pincode: a.pincode, country: 'India',
      },
      paymentMethod:   this.paymentMethod(),
      upiId:           sel?.upiResult?.upiId ?? undefined,
      couponCode:      this.pricing()?.couponCode ?? undefined,
      sessionId:       this.cartSvc.sessionId,
      useWallet:       this.useWallet(),
      walletAmount:    this.walletDeduction() > 0 ? this.walletDeduction() : undefined,
    }).subscribe({
      next: async r => {
        const order = r.data;

        // COD — no online payment needed
        if (this.paymentMethod() === 'cod') {
          this.placing.set(false);
          this.cartSvc.cart.set(null);
          this.#toast.success('Order placed!', order.orderNumber);
          this.#router.navigate(['/orders', order.id]);
          return;
        }

        // Online payment — open Razorpay modal
        const user = this.#auth.user();
        try {
          await this.#razorpay.pay({
            orderId:     order.id,
            name:        user?.name ?? a.fullName,
            email:       (user as { email?: string })?.email ?? '',
            phone:       a.phone,
            description: `Order #${order.orderNumber}`,
          });
          this.placing.set(false);
          this.cartSvc.cart.set(null);
          this.#toast.success('Payment successful! 🎉', `Order #${order.orderNumber} confirmed`);
          this.#router.navigate(['/orders', order.id]);
        } catch (payErr: unknown) {
          this.placing.set(false);
          const msg = payErr instanceof Error ? payErr.message : 'Payment failed';
          if (msg === 'Payment cancelled by user') {
            this.#toast.error('Payment cancelled', 'Your order is saved. You can retry payment from Orders.');
          } else {
            this.#toast.error('Payment failed', msg);
          }
          // Navigate to order so user can retry
          this.#router.navigate(['/orders', order.id]);
        }
      },
      error: err => {
        this.placing.set(false);
        this.#toast.error('Order failed', err?.error?.message ?? 'Please try again');
      },
    });
  }
}

import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed,
} from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { CartService, PriceSummary } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

type Step = 'address' | 'payment' | 'review';
type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod';

interface AddressForm {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

@Component({
  selector: 'lg-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule, MatIconModule,
    CurrencyInrPipe, ButtonComponent, BadgeComponent,
  ],
  template: `
    <div class="max-w-screen-lg mx-auto px-4 md:px-6 py-8">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-text-muted mb-6">
        <a routerLink="/" class="hover:text-text-primary">Home</a>
        <mat-icon class="!text-base">chevron_right</mat-icon>
        <a routerLink="/cart" class="hover:text-text-primary">Cart</a>
        <mat-icon class="!text-base">chevron_right</mat-icon>
        <span class="text-text-primary">Checkout</span>
      </nav>

      <!-- Stepper -->
      <div class="flex items-center gap-0 mb-8">
        @for (s of steps; track s.key; let i = $index; let last = $last) {
          <div class="flex items-center gap-2"
               [class.flex-1]="!last">
            <div class="flex items-center gap-2 cursor-pointer" (click)="goToStep(s.key)">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                   [class.bg-primary-600]="currentStep() === s.key || isCompleted(s.key)"
                   [class.text-white]="currentStep() === s.key || isCompleted(s.key)"
                   [class.bg-surface-100]="currentStep() !== s.key && !isCompleted(s.key)"
                   [class.text-text-muted]="currentStep() !== s.key && !isCompleted(s.key)">
                @if (isCompleted(s.key)) {
                  <mat-icon class="!text-base">check</mat-icon>
                } @else {
                  {{ i + 1 }}
                }
              </div>
              <span class="text-sm font-medium hidden sm:block"
                    [class.text-primary-600]="currentStep() === s.key"
                    [class.text-text-secondary]="currentStep() !== s.key">
                {{ s.label }}
              </span>
            </div>
            @if (!last) {
              <div class="flex-1 h-px bg-border-default mx-2"></div>
            }
          </div>
        }
      </div>

      <div class="grid lg:grid-cols-3 gap-8 items-start">

        <!-- Step content -->
        <div class="lg:col-span-2">

          <!-- Step 1: Address -->
          @if (currentStep() === 'address') {
            <div class="rounded-2xl border border-border-default bg-bg-base p-6">
              <h2 class="font-display font-bold text-lg text-text-primary mb-5">Delivery Address</h2>

              <div class="grid sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-text-secondary mb-1">Full Name *</label>
                  <input [(ngModel)]="address.fullName" class="form-input" placeholder="John Doe" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-secondary mb-1">Phone *</label>
                  <input [(ngModel)]="address.phone" class="form-input" placeholder="9876543210" type="tel" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-secondary mb-1">Pincode *</label>
                  <input [(ngModel)]="address.pincode" class="form-input" placeholder="400001" maxlength="6" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-text-secondary mb-1">Address Line 1 *</label>
                  <input [(ngModel)]="address.line1" class="form-input" placeholder="House / Flat / Building" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-text-secondary mb-1">Address Line 2</label>
                  <input [(ngModel)]="address.line2" class="form-input" placeholder="Street / Landmark (optional)" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-secondary mb-1">City *</label>
                  <input [(ngModel)]="address.city" class="form-input" placeholder="Mumbai" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-secondary mb-1">State *</label>
                  <select [(ngModel)]="address.state" class="form-input">
                    <option value="">Select state</option>
                    @for (s of indianStates; track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="flex justify-end mt-6">
                <lg-button variant="primary" size="lg" suffixIcon="arrow_forward"
                           [disabled]="!isAddressValid()" (click)="nextStep()">
                  Continue to Payment
                </lg-button>
              </div>
            </div>
          }

          <!-- Step 2: Payment -->
          @if (currentStep() === 'payment') {
            <div class="rounded-2xl border border-border-default bg-bg-base p-6">
              <h2 class="font-display font-bold text-lg text-text-primary mb-5">Payment Method</h2>

              <div class="space-y-3">
                @for (method of paymentMethods; track method.key) {
                  <label
                    class="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all"
                    [class.border-primary-500]="paymentMethod() === method.key"
                    [class.bg-primary-50]="paymentMethod() === method.key"
                    [class.border-border-default]="paymentMethod() !== method.key"
                    [class.hover:border-primary-200]="paymentMethod() !== method.key"
                  >
                    <input type="radio" name="payment" [value]="method.key"
                           [checked]="paymentMethod() === method.key"
                           (change)="paymentMethod.set(method.key)"
                           class="accent-primary-600" />
                    <mat-icon class="text-text-secondary">{{ method.icon }}</mat-icon>
                    <div class="flex-1">
                      <p class="font-medium text-text-primary text-sm">{{ method.label }}</p>
                      <p class="text-xs text-text-muted">{{ method.desc }}</p>
                    </div>
                    @if (method.key === 'cod') {
                      <lg-badge variant="warning">+₹20 fee</lg-badge>
                    }
                  </label>
                }
              </div>

              <div class="flex justify-between mt-6">
                <lg-button variant="outline" prefixIcon="arrow_back" (click)="goToStep('address')">
                  Back
                </lg-button>
                <lg-button variant="primary" size="lg" suffixIcon="arrow_forward" (click)="nextStep()">
                  Review Order
                </lg-button>
              </div>
            </div>
          }

          <!-- Step 3: Review -->
          @if (currentStep() === 'review') {
            <div class="rounded-2xl border border-border-default bg-bg-base p-6 space-y-6">
              <h2 class="font-display font-bold text-lg text-text-primary">Review Your Order</h2>

              <!-- Delivery address summary -->
              <div class="p-4 rounded-xl bg-surface-50 border border-border-default">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Delivery To</p>
                  <button class="text-xs text-primary-600 hover:underline" (click)="goToStep('address')">Edit</button>
                </div>
                <p class="font-medium text-text-primary text-sm">{{ address.fullName }} · {{ address.phone }}</p>
                <p class="text-sm text-text-secondary">{{ address.line1 }}{{ address.line2 ? ', ' + address.line2 : '' }}, {{ address.city }}, {{ address.state }} — {{ address.pincode }}</p>
              </div>

              <!-- Payment method summary -->
              <div class="p-4 rounded-xl bg-surface-50 border border-border-default">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Payment</p>
                  <button class="text-xs text-primary-600 hover:underline" (click)="goToStep('payment')">Edit</button>
                </div>
                <p class="font-medium text-text-primary text-sm capitalize">
                  {{ selectedPaymentMethod()?.label }}
                </p>
              </div>

              <!-- Items -->
              <div>
                <p class="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Items</p>
                <div class="space-y-3">
                  @for (item of cartSvc.cart()!.items; track item.id) {
                    <div class="flex items-center gap-3">
                      <img [src]="item.image || '/assets/placeholder.png'" [alt]="item.productName"
                           class="w-12 h-12 rounded-lg object-cover bg-surface-100" />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-text-primary truncate">{{ item.productName }}</p>
                        <p class="text-xs text-text-muted">Qty: {{ item.qty }}</p>
                      </div>
                      <p class="text-sm font-semibold text-text-primary">{{ item.lineTotal | currencyInr }}</p>
                    </div>
                  }
                </div>
              </div>

              <lg-button variant="primary" size="lg" [fullWidth]="true"
                         prefixIcon="lock" [loading]="placing()" (click)="placeOrder()">
                Place Order · {{ (pricing()?.total ?? 0) | currencyInr }}
              </lg-button>

              <p class="text-xs text-text-muted text-center">
                By placing this order, you agree to our
                <a href="#" class="text-primary-600 hover:underline">Terms & Conditions</a>
              </p>
            </div>
          }
        </div>

        <!-- Price summary -->
        <div class="rounded-2xl border border-border-default bg-bg-base p-5 space-y-3 sticky top-20">
          <h3 class="font-semibold text-text-primary">Price Details</h3>
          @if (pricing()) {
            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-text-secondary">
                <span>Subtotal</span><span>{{ pricing()!.subtotal | currencyInr }}</span>
              </div>
              @if (pricing()!.discount > 0) {
                <div class="flex justify-between text-green-600">
                  <span>Discount</span><span>−{{ pricing()!.discount | currencyInr }}</span>
                </div>
              }
              <div class="flex justify-between text-text-secondary">
                <span>Shipping</span>
                @if (pricing()!.shipping === 0) {
                  <span class="text-green-600">FREE</span>
                } @else {
                  <span>{{ pricing()!.shipping | currencyInr }}</span>
                }
              </div>
              @if (paymentMethod() === 'cod') {
                <div class="flex justify-between text-amber-600">
                  <span>COD fee</span><span>₹20</span>
                </div>
              }
              <div class="border-t border-border-default pt-2 flex justify-between font-bold text-text-primary">
                <span>Total</span>
                <span>{{ finalTotal() | currencyInr }}</span>
              </div>
              @if (pricing()!.savings > 0) {
                <p class="text-xs text-green-600 font-medium text-center pt-1">
                  You save {{ pricing()!.savings | currencyInr }}!
                </p>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-input {
      width: 100%; height: 2.5rem; padding: 0 0.75rem; border-radius: 0.625rem;
      border: 1px solid var(--border-default); background: var(--bg-base);
      color: var(--text-primary); font-size: 0.875rem;
    }
    .form-input:focus { outline: none; box-shadow: 0 0 0 2px var(--color-primary); border-color: transparent; }
  `],
})
export class CheckoutComponent implements OnInit {
  readonly cartSvc    = inject(CartService);
  readonly #orderSvc  = inject(OrderService);
  readonly #auth      = inject(AuthService);
  readonly #toast     = inject(ToastService);
  readonly #router    = inject(Router);

  readonly currentStep   = signal<Step>('address');
  readonly paymentMethod = signal<PaymentMethod>('upi');
  readonly pricing       = signal<PriceSummary | null>(null);
  readonly placing       = signal(false);
  readonly completed     = signal<Set<Step>>(new Set());

  address: AddressForm = {
    fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
  };

  readonly steps = [
    { key: 'address' as Step, label: 'Address' },
    { key: 'payment' as Step, label: 'Payment' },
    { key: 'review'  as Step, label: 'Review'  },
  ];

  readonly paymentMethods = [
    { key: 'upi'        as PaymentMethod, label: 'UPI',         icon: 'account_balance_wallet', desc: 'Pay via any UPI app' },
    { key: 'card'       as PaymentMethod, label: 'Credit / Debit Card', icon: 'credit_card', desc: 'Visa, Mastercard, RuPay' },
    { key: 'netbanking' as PaymentMethod, label: 'Net Banking',  icon: 'account_balance',        desc: 'All major banks supported' },
    { key: 'cod'        as PaymentMethod, label: 'Cash on Delivery', icon: 'payments',           desc: 'Pay when you receive' },
  ];

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

  readonly finalTotal = computed(() => {
    const base = this.pricing()?.total ?? 0;
    return this.paymentMethod() === 'cod' ? base + 20 : base;
  });

  ngOnInit(): void {
    if (!this.cartSvc.cart()) {
      this.cartSvc.load().subscribe({ next: () => this.loadPricing() });
    } else {
      this.loadPricing();
    }

    // Pre-fill name/phone from auth
    const user = this.#auth.user();
    if (user) {
      this.address.fullName = user.name ?? '';
      this.address.phone    = user.phone ?? '';
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

  isCompleted(step: Step): boolean {
    return this.completed().has(step);
  }

  nextStep(): void {
    const order: Step[] = ['address', 'payment', 'review'];
    const idx = order.indexOf(this.currentStep());
    this.completed.update(s => { s.add(this.currentStep()); return new Set(s); });
    if (idx < order.length - 1) this.currentStep.set(order[idx + 1]);
  }

  goToStep(step: Step): void {
    const order: Step[] = ['address', 'payment', 'review'];
    const target = order.indexOf(step);
    const current = order.indexOf(this.currentStep());
    if (target <= current || this.isCompleted(step)) {
      this.currentStep.set(step);
    }
  }

  placeOrder(): void {
    this.placing.set(true);
    const a = this.address;
    this.#orderSvc.placeOrder({
      shippingAddress: {
        fullName: a.fullName,
        phone:    a.phone,
        line1:    a.line1,
        line2:    a.line2 || undefined,
        city:     a.city,
        state:    a.state,
        pincode:  a.pincode,
        country:  'India',
      },
      paymentMethod: this.paymentMethod(),
      couponCode:    this.pricing()?.couponCode ?? undefined,
      sessionId:     this.cartSvc.sessionId,
    }).subscribe({
      next: r => {
        this.placing.set(false);
        this.cartSvc.cart.set(null);
        this.#toast.success('Order placed!', r.data.orderNumber);
        this.#router.navigate(['/orders', r.data.id]);
      },
      error: err => {
        this.placing.set(false);
        this.#toast.error('Order failed', err?.error?.message ?? 'Please try again');
      },
    });
  }
}

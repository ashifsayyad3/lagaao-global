import {
  Component, ChangeDetectionStrategy, inject, signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { VendorService } from '../../../core/services/vendor.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'lg-become-seller',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, MatIconModule, ButtonComponent],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 md:px-6 py-12">

      @if (!auth.isLoggedIn()) {
        <!-- Not logged in CTA -->
        <div class="max-w-lg mx-auto text-center py-16">
          <div class="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-6">
            <mat-icon class="!text-4xl text-primary-600">store</mat-icon>
          </div>
          <h1 class="font-display text-3xl font-bold text-text-primary mb-3">Sell on Lagaao</h1>
          <p class="text-text-secondary mb-8">
            Join thousands of sellers and grow your business. Sign in to start your vendor journey.
          </p>
          <lg-button variant="primary" size="lg" routerLink="/auth/login" prefixIcon="login">
            Sign In to Apply
          </lg-button>
        </div>

      } @else if (submitted()) {
        <!-- Success state -->
        <div class="max-w-lg mx-auto text-center py-16">
          <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <mat-icon class="!text-4xl text-green-600">check_circle</mat-icon>
          </div>
          <h2 class="font-display text-2xl font-bold text-text-primary mb-3">Application Submitted!</h2>
          <p class="text-text-secondary mb-2">
            We've received your vendor application for <strong>{{ storeName }}</strong>.
          </p>
          <p class="text-text-secondary mb-8">
            Our team will review it within 2–3 business days and notify you by email.
          </p>
          <lg-button variant="primary" routerLink="/">Back to Home</lg-button>
        </div>

      } @else {
        <div class="grid lg:grid-cols-2 gap-12 items-start">

          <!-- Benefits -->
          <div>
            <h1 class="font-display text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Start Selling on Lagaao
            </h1>
            <p class="text-text-secondary text-lg mb-10">
              Join India's fastest-growing marketplace and reach millions of buyers.
            </p>

            <div class="space-y-6">
              @for (benefit of benefits; track benefit.icon) {
                <div class="flex gap-4">
                  <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <mat-icon class="text-primary-600">{{ benefit.icon }}</mat-icon>
                  </div>
                  <div>
                    <h3 class="font-semibold text-text-primary">{{ benefit.title }}</h3>
                    <p class="text-sm text-text-secondary mt-0.5">{{ benefit.desc }}</p>
                  </div>
                </div>
              }
            </div>

            <div class="mt-10 p-5 rounded-2xl bg-surface-50 border border-border-default">
              <p class="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Platform Fee</p>
              <div class="flex items-baseline gap-2">
                <span class="font-display text-3xl font-bold text-primary-600">10%</span>
                <span class="text-text-muted">commission per sale</span>
              </div>
              <p class="text-xs text-text-muted mt-1">No listing fees. No monthly charges. Pay only when you sell.</p>
            </div>
          </div>

          <!-- Application form -->
          <div class="rounded-2xl border border-border-default bg-bg-base p-8">
            <h2 class="font-display text-xl font-bold text-text-primary mb-6">Apply as a Seller</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Store Name *</label>
                <input [(ngModel)]="storeName" class="form-input" placeholder="My Awesome Store" />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">What do you sell? *</label>
                <textarea [(ngModel)]="description" rows="3"
                          class="form-input !h-auto pt-2"
                          placeholder="Describe your products and business..."></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-text-secondary mb-1">GSTIN (optional)</label>
                  <input [(ngModel)]="gstin" class="form-input" placeholder="22AAAAA0000A1Z5" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-text-secondary mb-1">PAN (optional)</label>
                  <input [(ngModel)]="pan" class="form-input" placeholder="AAAAA0000A" />
                </div>
              </div>

              <!-- Agreement -->
              <label class="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="agreed" class="mt-0.5 accent-primary-600" />
                <span class="text-sm text-text-secondary">
                  I agree to the
                  <a href="#" class="text-primary-600 hover:underline">Seller Terms & Conditions</a>
                  and confirm that all provided information is accurate.
                </span>
              </label>
            </div>

            @if (error()) {
              <p class="mt-3 text-sm text-red-600">{{ error() }}</p>
            }

            <lg-button
              variant="primary" size="lg" [fullWidth]="true"
              prefixIcon="store" class="mt-6"
              [disabled]="!storeName.trim() || !description.trim() || !agreed"
              [loading]="submitting()"
              (click)="submit()"
            >
              Submit Application
            </lg-button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .form-input { width: 100%; height: 2.5rem; padding: 0 0.75rem; border-radius: 0.625rem; border: 1px solid var(--border-default); background: var(--bg-base); color: var(--text-primary); font-size: 0.875rem; }
    .form-input:focus { outline: none; box-shadow: 0 0 0 2px var(--color-primary); border-color: transparent; }
  `],
})
export class BecomeSellerComponent {
  readonly auth       = inject(AuthService);
  readonly #vendor    = inject(VendorService);
  readonly #toast     = inject(ToastService);
  readonly #router    = inject(Router);

  storeName   = '';
  description = '';
  gstin       = '';
  pan         = '';
  agreed      = false;

  readonly submitted   = signal(false);
  readonly submitting  = signal(false);
  readonly error       = signal<string | null>(null);

  readonly benefits = [
    { icon: 'groups',          title: 'Reach Millions', desc: 'Access Lagaao\'s growing customer base across India.' },
    { icon: 'payments',        title: 'Weekly Payouts',  desc: 'Get paid every week directly to your bank account.' },
    { icon: 'analytics',       title: 'Smart Dashboard', desc: 'Real-time sales analytics and inventory insights.' },
    { icon: 'local_shipping',  title: 'Shipping Support', desc: 'Integrated logistics partners at negotiated rates.' },
  ];

  submit(): void {
    if (!this.agreed) return;
    this.submitting.set(true);
    this.error.set(null);
    this.#vendor.apply({
      storeName:   this.storeName.trim(),
      description: this.description.trim(),
      gstin:       this.gstin.trim() || undefined,
    }).subscribe({
      next: () => { this.submitting.set(false); this.submitted.set(true); },
      error: err => {
        this.submitting.set(false);
        this.error.set(err?.error?.message ?? 'Submission failed. Please try again.');
      },
    });
  }
}

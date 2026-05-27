import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, NgClass, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';

const BASE = `${environment.apiUrl}/api/v1/affiliates`;

interface Conversion {
  id: number;
  orderId: number;
  orderTotal: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  createdAt: string;
}

interface AffiliateStats {
  id: number;
  code: string;
  affiliateUrl: string;
  status: 'pending' | 'active' | 'suspended';
  commissionRate: number;
  totalClicks: number;
  totalEarnings: number;
  paidOut: number;
  pendingEarnings: number;
  approvedEarnings: number;
  balance: number;
  conversions: Conversion[];
}

@Component({
  selector: 'lg-profile-affiliate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe, NgClass, CurrencyInrPipe, DecimalPipe],
  template: `
<div class="max-w-2xl mx-auto p-6 space-y-6">

  <div>
    <h1 class="text-xl font-bold text-text-primary">Affiliate Program</h1>
    <p class="text-sm text-text-muted mt-0.5">Earn commission by referring customers to Lagaao</p>
  </div>

  @if (loading()) {
    <div class="space-y-3">
      @for (i of [1,2,3]; track i) {
        <div class="h-20 rounded-2xl bg-surface-50 animate-pulse"></div>
      }
    </div>
  } @else if (!stats()) {

    <!-- Apply panel -->
    <div class="rounded-2xl border border-border-default bg-bg-base p-8 text-center space-y-4">
      <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
        <mat-icon class="text-primary-600 text-3xl">campaign</mat-icon>
      </div>
      <h2 class="text-lg font-bold text-text-primary">Become an Affiliate</h2>
      <p class="text-sm text-text-muted max-w-sm mx-auto">
        Share your unique link and earn {{ defaultRate }}% commission on every order placed through it.
        Commissions are approved after order delivery.
      </p>
      <button (click)="apply()" [disabled]="applying()"
              class="px-6 py-3 rounded-xl bg-primary-600 text-white font-medium text-sm
                     hover:bg-primary-700 transition-colors disabled:opacity-50">
        {{ applying() ? 'Applying…' : 'Apply Now' }}
      </button>
    </div>

  } @else {

    <!-- Status banner -->
    @if (stats()!.status === 'pending') {
      <div class="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
        <mat-icon class="text-base">hourglass_empty</mat-icon>
        Your application is under review. We'll notify you once approved.
      </div>
    }
    @if (stats()!.status === 'suspended') {
      <div class="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-2 text-sm text-red-800">
        <mat-icon class="text-base">block</mat-icon>
        Your affiliate account has been suspended. Please contact support.
      </div>
    }

    <!-- Stats grid -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="rounded-2xl border border-border-default bg-bg-base p-4 text-center">
        <p class="text-2xl font-bold text-text-primary">{{ stats()!.totalClicks }}</p>
        <p class="text-xs text-text-muted mt-1">Total Clicks</p>
      </div>
      <div class="rounded-2xl border border-border-default bg-bg-base p-4 text-center">
        <p class="text-2xl font-bold text-blue-600">{{ stats()!.conversions.length }}</p>
        <p class="text-xs text-text-muted mt-1">Conversions</p>
      </div>
      <div class="rounded-2xl border border-border-default bg-bg-base p-4 text-center">
        <p class="text-2xl font-bold text-primary-600">{{ stats()!.commissionRate }}%</p>
        <p class="text-xs text-text-muted mt-1">Commission Rate</p>
      </div>
      <div class="rounded-2xl border border-border-default bg-bg-base p-4 text-center">
        <p class="text-2xl font-bold text-green-600">{{ stats()!.balance | currencyInr }}</p>
        <p class="text-xs text-text-muted mt-1">Balance</p>
      </div>
    </div>

    <!-- Affiliate link card -->
    @if (stats()!.status === 'active') {
      <div class="rounded-2xl border border-primary-200 bg-primary-50 p-5 space-y-4">
        <h2 class="font-semibold text-primary-800 text-sm">Your Affiliate Link</h2>
        <div class="flex gap-2">
          <div class="flex-1 bg-white rounded-xl border border-primary-200 px-4 py-2.5 font-mono text-sm
                       text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
            {{ stats()!.affiliateUrl }}
          </div>
          <button (click)="copyLink()"
                  class="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium
                         flex items-center gap-1.5 hover:bg-primary-700 transition-colors">
            <mat-icon class="text-base">{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
            {{ copied() ? 'Copied!' : 'Copy' }}
          </button>
        </div>
        <div class="flex gap-2 items-center">
          <span class="text-xs text-primary-700 font-medium">Code:</span>
          <span class="font-mono text-sm font-bold text-primary-800 tracking-widest">{{ stats()!.code }}</span>
        </div>
        <!-- WhatsApp share -->
        <a [href]="waUrl()" target="_blank"
           class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500 text-white text-xs font-medium">
          <mat-icon class="text-sm">chat</mat-icon> Share on WhatsApp
        </a>
      </div>
    }

    <!-- Earnings breakdown -->
    <div class="rounded-2xl border border-border-default bg-bg-base p-5 space-y-3">
      <h2 class="font-semibold text-sm text-text-primary">Earnings Breakdown</h2>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-text-muted">Total Earned</span>
          <span class="font-semibold text-text-primary">{{ stats()!.totalEarnings | currencyInr }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-text-muted">Pending (awaiting delivery)</span>
          <span class="text-amber-600 font-medium">{{ stats()!.pendingEarnings | currencyInr }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-text-muted">Approved (unpaid)</span>
          <span class="text-blue-600 font-medium">{{ stats()!.approvedEarnings | currencyInr }}</span>
        </div>
        <div class="flex justify-between border-t border-border-default pt-2">
          <span class="text-text-muted">Paid Out</span>
          <span class="text-green-600 font-semibold">{{ stats()!.paidOut | currencyInr }}</span>
        </div>
      </div>
    </div>

    <!-- Conversions list -->
    @if (stats()!.conversions.length > 0) {
      <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
        <div class="px-5 py-3 bg-surface-50 border-b border-border-default">
          <h2 class="text-sm font-semibold text-text-primary">Recent Conversions</h2>
        </div>
        <div class="divide-y divide-border-default">
          @for (c of stats()!.conversions; track c.id) {
            <div class="flex items-center justify-between px-5 py-3">
              <div>
                <p class="text-sm font-medium text-text-primary">Order #{{ c.orderId }}</p>
                <p class="text-xs text-text-muted">{{ c.createdAt | date:'dd MMM yyyy' }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-text-primary">+{{ c.commissionAmount | currencyInr }}</p>
                <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="{
                        'bg-amber-100 text-amber-700':  c.status === 'pending',
                        'bg-blue-100  text-blue-700':   c.status === 'approved',
                        'bg-green-100 text-green-700':  c.status === 'paid',
                        'bg-red-100   text-red-700':    c.status === 'cancelled'
                      }">
                  {{ c.status | titlecase }}
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    }

  }
</div>
  `,
})
export class ProfileAffiliateComponent implements OnInit {
  readonly #http  = inject(HttpClient);
  readonly #toast = inject(ToastService);

  loading  = signal(true);
  applying = signal(false);
  copied   = signal(false);
  stats    = signal<AffiliateStats | null>(null);

  readonly defaultRate = 5;

  ngOnInit() { this.load(); }

  load() {
    this.#http.get<{ data: AffiliateStats | null }>(`${BASE}/me`).subscribe({
      next:  r => { this.stats.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  apply() {
    this.applying.set(true);
    this.#http.post<{ data: AffiliateStats }>(`${BASE}/apply`, {}).subscribe({
      next: r => {
        this.stats.set(r.data as any);
        this.#toast.show('Application submitted! We\'ll review it shortly.', 'success');
        this.applying.set(false);
        this.load();
      },
      error: (e) => {
        this.#toast.show(e?.error?.message ?? 'Failed to apply', 'error');
        this.applying.set(false);
      },
    });
  }

  copyLink() {
    navigator.clipboard.writeText(this.stats()!.affiliateUrl).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  waUrl(): string {
    const url  = this.stats()?.affiliateUrl ?? '';
    const text = encodeURIComponent(`Shop on Lagaao and get amazing plants! Use my link: ${url}`);
    return `https://wa.me/?text=${text}`;
  }
}

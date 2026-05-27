import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';

const BASE = `${environment.apiUrl}/api/v1/loyalty`;

interface LoyaltyEntry {
  id: number;
  points: number;
  type: 'earn' | 'redeem' | 'expire' | 'admin';
  description: string;
  createdAt: string;
}

interface LoyaltyData {
  balance: number;
  history: LoyaltyEntry[];
  total: number;
  page: number;
  limit: number;
}

@Component({
  selector: 'lg-profile-loyalty',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe, NgClass, CurrencyInrPipe],
  template: `
<div class="max-w-2xl mx-auto p-6 space-y-6">

  <div>
    <h1 class="text-xl font-bold text-text-primary">Loyalty Points</h1>
    <p class="text-sm text-text-muted mt-0.5">Earn points on every order and redeem for discounts</p>
  </div>

  @if (loading()) {
    <div class="space-y-3">
      @for (i of [1,2,3]; track i) {
        <div class="h-20 rounded-2xl bg-surface-50 animate-pulse"></div>
      }
    </div>
  } @else if (data()) {

    <!-- Balance card -->
    <div class="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-primary-200">Your Balance</p>
          <p class="text-4xl font-bold mt-1">{{ data()!.balance }}<span class="text-xl font-medium text-primary-200 ml-1">pts</span></p>
          <p class="text-sm text-primary-200 mt-1">≈ {{ (data()!.balance / 100) | currencyInr }} redeemable value</p>
        </div>
        <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
          <mat-icon class="text-white text-3xl">stars</mat-icon>
        </div>
      </div>
    </div>

    <!-- How it works -->
    <div class="grid grid-cols-3 gap-3">
      @for (step of howItWorks; track step.label) {
        <div class="rounded-2xl border border-border-default bg-bg-base p-4 text-center space-y-2">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
            <mat-icon class="text-primary-600 text-base">{{ step.icon }}</mat-icon>
          </div>
          <p class="text-xs font-semibold text-text-primary">{{ step.label }}</p>
          <p class="text-xs text-text-muted">{{ step.desc }}</p>
        </div>
      }
    </div>

    <!-- History -->
    @if (data()!.history.length > 0) {
      <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
        <div class="px-5 py-3 bg-surface-50 border-b border-border-default">
          <h2 class="text-sm font-semibold text-text-primary">Points History</h2>
        </div>
        <div class="divide-y divide-border-default">
          @for (entry of data()!.history; track entry.id) {
            <div class="flex items-center justify-between px-5 py-3.5">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                     [ngClass]="{
                       'bg-green-100':  entry.type === 'earn',
                       'bg-red-100':    entry.type === 'redeem',
                       'bg-amber-100':  entry.type === 'expire',
                       'bg-blue-100':   entry.type === 'admin'
                     }">
                  <mat-icon class="text-base"
                            [ngClass]="{
                              'text-green-600':  entry.type === 'earn',
                              'text-red-600':    entry.type === 'redeem',
                              'text-amber-600':  entry.type === 'expire',
                              'text-blue-600':   entry.type === 'admin'
                            }">
                    {{ entry.type === 'earn' ? 'add_circle' : entry.type === 'redeem' ? 'remove_circle' : entry.type === 'expire' ? 'timer_off' : 'admin_panel_settings' }}
                  </mat-icon>
                </div>
                <div>
                  <p class="text-sm font-medium text-text-primary">{{ entry.description }}</p>
                  <p class="text-xs text-text-muted">{{ entry.createdAt | date:'dd MMM yyyy, h:mm a' }}</p>
                </div>
              </div>
              <span class="text-sm font-bold"
                    [ngClass]="entry.points > 0 ? 'text-green-600' : 'text-red-600'">
                {{ entry.points > 0 ? '+' : '' }}{{ entry.points }} pts
              </span>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="text-center py-10 text-text-muted">
        <mat-icon class="text-4xl">stars</mat-icon>
        <p class="mt-2 text-sm">No points yet. Place an order to start earning!</p>
      </div>
    }
  }
</div>
  `,
})
export class ProfileLoyaltyComponent implements OnInit {
  readonly #http = inject(HttpClient);

  loading = signal(true);
  data    = signal<LoyaltyData | null>(null);

  readonly howItWorks = [
    { icon: 'shopping_bag', label: 'Place an order',   desc: 'Earn 1 pt for every ₹10 spent' },
    { icon: 'stars',        label: 'Collect points',   desc: 'Points valid for 1 year' },
    { icon: 'redeem',       label: 'Redeem at checkout', desc: '100 pts = ₹1 discount (up to 20%)' },
  ];

  ngOnInit() {
    this.#http.get<LoyaltyData>(`${BASE}/me`).subscribe({
      next:  d => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

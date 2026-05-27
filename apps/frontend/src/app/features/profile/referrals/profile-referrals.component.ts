import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';

const BASE = `${environment.apiUrl}/api/v1/referrals`;

interface ReferralEntry {
  id: number; status: string; rewardAmount: number; rewardedAt: string | null;
  referred: { id: number; name: string; createdAt: string };
}

interface ReferralStats {
  code: string; referralUrl: string;
  totalReferrals: number; converted: number; totalEarned: number;
  referrals: ReferralEntry[];
}

@Component({
  selector: 'lg-profile-referrals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, DatePipe, CurrencyInrPipe],
  template: `
<div class="max-w-2xl mx-auto p-6 space-y-6">

  <div>
    <h1 class="text-xl font-bold text-text-primary">Referral Program</h1>
    <p class="text-sm text-text-muted mt-0.5">Invite friends and earn wallet credits</p>
  </div>

  @if (loading()) {
    <div class="space-y-3">
      @for (i of [1,2,3]; track i) {
        <div class="h-24 rounded-2xl bg-surface-50 animate-pulse"></div>
      }
    </div>
  } @else if (stats()) {

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

    <!-- Referral link card -->
    <div class="rounded-2xl border border-primary-200 bg-primary-50 p-5 space-y-4">
      <h2 class="font-semibold text-primary-800 text-sm">Your Referral Link</h2>

      <div class="flex gap-2">
        <div class="flex-1 bg-white rounded-xl border border-primary-200 px-4 py-2.5 font-mono text-sm text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
          {{ stats()!.referralUrl }}
        </div>
        <button (click)="copyLink()"
                class="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium flex items-center gap-1.5 hover:bg-primary-700 transition-colors">
          <mat-icon class="text-base">{{ copied() ? 'check' : 'content_copy' }}</mat-icon>
          {{ copied() ? 'Copied!' : 'Copy' }}
        </button>
      </div>

      <div class="flex gap-2 flex-wrap">
        <span class="text-xs text-primary-700 font-medium">Code:</span>
        <span class="font-mono text-sm font-bold text-primary-800 tracking-widest">{{ stats()!.code }}</span>
      </div>

      <!-- Share buttons -->
      <div class="flex gap-2">
        <a [href]="whatsappShareUrl()" target="_blank"
           class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500 text-white text-xs font-medium">
          <mat-icon class="text-sm">chat</mat-icon> WhatsApp
        </a>
        @if (canShare) {
        <button (click)="shareNative()"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-medium">
          <mat-icon class="text-sm">share</mat-icon> Share
        </button>
        }
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-3 gap-3">
      <div class="rounded-2xl border border-border-default bg-bg-base p-4 text-center">
        <p class="text-2xl font-bold text-text-primary">{{ stats()!.totalReferrals }}</p>
        <p class="text-xs text-text-muted mt-1">Friends Invited</p>
      </div>
      <div class="rounded-2xl border border-border-default bg-bg-base p-4 text-center">
        <p class="text-2xl font-bold text-green-600">{{ stats()!.converted }}</p>
        <p class="text-xs text-text-muted mt-1">Converted</p>
      </div>
      <div class="rounded-2xl border border-border-default bg-bg-base p-4 text-center">
        <p class="text-2xl font-bold text-primary-600">{{ stats()!.totalEarned | currencyInr }}</p>
        <p class="text-xs text-text-muted mt-1">Total Earned</p>
      </div>
    </div>

    <!-- Referrals list -->
    @if (stats()!.referrals.length > 0) {
      <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
        <div class="px-5 py-3 bg-surface-50 border-b border-border-default">
          <h2 class="text-sm font-semibold text-text-primary">Referred Friends</h2>
        </div>
        <div class="divide-y divide-border-default">
          @for (r of stats()!.referrals; track r.id) {
            <div class="flex items-center justify-between px-5 py-3">
              <div>
                <p class="text-sm font-medium text-text-primary">{{ r.referred.name }}</p>
                <p class="text-xs text-text-muted">Joined {{ r.referred.createdAt | date:'dd MMM yyyy' }}</p>
              </div>
              <div class="text-right">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-green-100]="r.status === 'rewarded'"
                      [class.text-green-700]="r.status === 'rewarded'"
                      [class.bg-amber-100]="r.status === 'pending'"
                      [class.text-amber-700]="r.status === 'pending'"
                      [class.bg-blue-100]="r.status === 'converted'"
                      [class.text-blue-700]="r.status === 'converted'">
                  {{ r.status === 'rewarded' ? 'Rewarded' : r.status === 'converted' ? 'Placed order' : 'Signed up' }}
                </span>
                @if (r.status === 'rewarded') {
                  <p class="text-xs text-green-600 font-semibold mt-0.5">+{{ r.rewardAmount | currencyInr }}</p>
                }
              </div>
            </div>
          }
        </div>
      </div>
    } @else {
      <div class="text-center py-10 text-text-muted">
        <mat-icon class="text-4xl">group_add</mat-icon>
        <p class="mt-2 text-sm">No referrals yet. Share your link to get started!</p>
      </div>
    }
  }
</div>
  `,
})
export class ProfileReferralsComponent implements OnInit {
  readonly #http = inject(HttpClient);

  loading = signal(true);
  stats   = signal<ReferralStats | null>(null);
  copied  = signal(false);

  readonly canShare = typeof navigator !== 'undefined' && !!navigator.share;

  readonly howItWorks = [
    { icon: 'share',      label: 'Share your link', desc: 'Send your unique referral link to friends' },
    { icon: 'person_add', label: 'Friend signs up',  desc: 'They register using your link' },
    { icon: 'wallet',     label: 'Both earn ₹',      desc: 'You get ₹100, they get ₹50 on first order' },
  ];

  whatsappShareUrl = computed(() => {
    if (!this.stats()) return '';
    const text = encodeURIComponent(
      `Hey! Join Lagaao — India's best plant marketplace. Use my referral link and get ₹50 off your first order: ${this.stats()!.referralUrl}`
    );
    return `https://wa.me/?text=${text}`;
  });

  ngOnInit() {
    this.#http.get<{ success: boolean; data: ReferralStats }>(`${BASE}/me`).subscribe({
      next:  r => { this.stats.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  copyLink() {
    navigator.clipboard.writeText(this.stats()!.referralUrl).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  shareNative() {
    navigator.share?.({
      title: 'Join Lagaao',
      text:  'Get ₹50 off your first order on Lagaao!',
      url:   this.stats()!.referralUrl,
    });
  }
}

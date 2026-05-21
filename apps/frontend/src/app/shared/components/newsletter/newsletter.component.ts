import {
  Component, signal, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CmsService } from '../../../core/services/cms.service';

@Component({
  selector: 'lg-newsletter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule],
  template: `
    <div class="bg-gradient-to-br from-primary-600 to-accent rounded-2xl p-8 text-white text-center">
      <mat-icon class="!text-4xl !w-10 !h-10 mb-3">mail_outline</mat-icon>
      <h3 class="font-display text-2xl font-bold mb-2">Stay in the loop</h3>
      <p class="text-white/80 mb-6 text-sm">Deals, launches, and insider tips — delivered to your inbox.</p>

      @if (success()) {
        <div class="flex items-center justify-center gap-2 bg-white/20 rounded-xl px-4 py-3">
          <mat-icon>check_circle</mat-icon>
          <span class="font-medium">You're subscribed!</span>
        </div>
      } @else {
        <form class="flex gap-2 max-w-sm mx-auto" (ngSubmit)="submit()">
          <input
            [(ngModel)]="email" name="email" type="email" required
            placeholder="you@example.com"
            class="flex-1 rounded-xl px-4 py-2.5 bg-white/20 border border-white/30
                   placeholder-white/60 text-white text-sm focus:outline-none focus:border-white"
          />
          <button
            type="submit"
            [disabled]="loading()"
            class="px-5 py-2.5 bg-white text-primary-700 font-semibold rounded-xl
                   hover:bg-white/90 transition-colors text-sm disabled:opacity-60"
          >
            {{ loading() ? 'Subscribing…' : 'Subscribe' }}
          </button>
        </form>
        @if (error()) {
          <p class="mt-2 text-sm text-white/80">{{ error() }}</p>
        }
      }
    </div>
  `,
})
export class NewsletterComponent {
  readonly #cms = inject(CmsService);
  email   = '';
  loading = signal(false);
  success = signal(false);
  error   = signal<string | null>(null);

  submit() {
    if (!this.email) return;
    this.loading.set(true);
    this.error.set(null);
    this.#cms.subscribe(this.email).subscribe({
      next:  () => { this.success.set(true); this.loading.set(false); },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Subscription failed. Try again.');
        this.loading.set(false);
      },
    });
  }
}

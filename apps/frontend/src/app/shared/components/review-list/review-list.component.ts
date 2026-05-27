import {
  Component, ChangeDetectionStrategy, inject, signal, input, OnInit, computed,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { ReviewFormComponent, ReviewResult } from '../review-form/review-form.component';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface ReviewsResponse {
  success: boolean;
  data: ReviewResult[];
  meta: {
    page: number; limit: number; total: number; totalPages: number;
    avgRating: number;
    distribution: Record<string, number>;
  };
}

@Component({
  selector: 'lg-review-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, StarRatingComponent, ReviewFormComponent],
  styles: [`
    :host { display: block; }

    .section-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; margin-bottom: 24px;
    }
    .section-title {
      font-family: var(--font-display); font-size: 1.25rem;
      font-weight: 700; color: var(--text-primary); margin: 0;
    }

    /* ── Rating summary ──────────────────────────── */
    .rating-summary {
      background: var(--bg-subtle); border-radius: 16px;
      padding: 20px 24px; display: flex;
      gap: 28px; align-items: center;
      margin-bottom: 24px; flex-wrap: wrap;
    }
    .avg-score {
      text-align: center; flex-shrink: 0;
    }
    .avg-number {
      font-size: 3rem; font-weight: 800;
      color: var(--text-primary); line-height: 1;
    }
    .avg-total {
      font-size: .8125rem; color: var(--text-muted); margin-top: 4px;
    }
    .bars { flex: 1; min-width: 180px; }
    .bar-row {
      display: flex; align-items: center; gap: 8px;
      font-size: .75rem; color: var(--text-secondary);
      margin-bottom: 5px;
    }
    .bar-track {
      flex: 1; height: 6px; background: var(--border-default);
      border-radius: 99px; overflow: hidden;
    }
    .bar-fill {
      height: 100%; background: #f59e0b; border-radius: 99px;
      transition: width 400ms ease;
    }
    .bar-count { width: 24px; text-align: right; }

    /* ── Sort bar ────────────────────────────────── */
    .sort-bar {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 20px; flex-wrap: wrap;
    }
    .sort-label { font-size: .8125rem; color: var(--text-muted); }
    .sort-btn {
      padding: 5px 14px; border-radius: 99px;
      border: 1.5px solid var(--border-default);
      background: none; font-size: .8125rem; font-weight: 600;
      color: var(--text-secondary); cursor: pointer;
      transition: border-color 150ms, background 150ms, color 150ms;
    }
    .sort-btn.active {
      border-color: var(--color-primary);
      background: var(--color-primary-50);
      color: var(--color-primary);
    }

    /* ── Write review button ─────────────────────── */
    .write-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 20px;
      background: var(--color-primary); color: #fff;
      border: none; border-radius: 10px;
      font-size: .875rem; font-weight: 600;
      cursor: pointer; transition: background 150ms;
      white-space: nowrap;
    }
    .write-btn:hover { background: var(--color-primary-dark); }

    /* ── Review card ─────────────────────────────── */
    .review-card {
      border-bottom: 1px solid var(--border-default);
      padding: 20px 0;
    }
    .review-card:last-child { border-bottom: none; }
    .review-header {
      display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px;
    }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--color-primary-50);
      display: flex; align-items: center; justify-content: center;
      font-size: .875rem; font-weight: 700; color: var(--color-primary);
      flex-shrink: 0; overflow: hidden;
    }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .reviewer-name {
      font-size: .9375rem; font-weight: 600; color: var(--text-primary);
    }
    .review-date { font-size: .75rem; color: var(--text-muted); margin-top: 1px; }
    .verified-badge {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: .6875rem; font-weight: 700;
      color: var(--color-primary); margin-left: 8px;
    }
    .review-title {
      font-weight: 600; color: var(--text-primary);
      font-size: .9375rem; margin: 8px 0 4px;
    }
    .review-body { font-size: .875rem; color: var(--text-secondary); line-height: 1.6; }
    .review-images {
      display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;
    }
    .review-img {
      width: 72px; height: 72px; border-radius: 8px;
      object-fit: cover; cursor: pointer;
      border: 1.5px solid var(--border-default);
    }

    .helpful-row {
      display: flex; align-items: center; gap: 8px;
      margin-top: 12px; font-size: .8125rem; color: var(--text-muted);
    }
    .helpful-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: 99px;
      border: 1px solid var(--border-default);
      background: none; font-size: .75rem; color: var(--text-muted);
      cursor: pointer; transition: border-color 150ms, color 150ms;
    }
    .helpful-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

    /* Vendor reply */
    .vendor-reply {
      margin-top: 12px;
      background: var(--bg-subtle); border-left: 3px solid var(--color-primary);
      border-radius: 0 10px 10px 0; padding: 10px 14px;
      font-size: .8125rem;
    }
    .vendor-reply-label {
      font-weight: 700; color: var(--color-primary); margin-bottom: 4px;
    }

    /* Load more */
    .load-more {
      text-align: center; margin-top: 20px;
    }
    .load-more-btn {
      padding: 10px 28px; border-radius: 10px;
      border: 1.5px solid var(--border-default);
      background: none; font-size: .875rem; font-weight: 600;
      color: var(--text-secondary); cursor: pointer;
      transition: border-color 150ms;
    }
    .load-more-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .load-more-btn:disabled { opacity: .5; cursor: not-allowed; }

    /* Empty */
    .empty {
      text-align: center; padding: 40px 20px;
      color: var(--text-muted); font-size: .9375rem;
    }
  `],
  template: `
    <div>
      <!-- Header row -->
      <div class="section-head">
        <h2 class="section-title">Customer Reviews</h2>
        @if (isLoggedIn() && !showForm()) {
          <button class="write-btn" (click)="showForm.set(true)">
            <mat-icon style="font-size:16px;width:16px;height:16px">edit</mat-icon>
            Write a Review
          </button>
        }
      </div>

      <!-- Review form -->
      @if (showForm()) {
        <div style="margin-bottom:24px">
          <lg-review-form
            [productId]="productId()"
            [orderId]="orderId()"
            (reviewSubmitted)="onReviewSubmitted($event)"
            (cancelled)="showForm.set(false)"
          />
        </div>
      }

      <!-- Rating summary -->
      @if (meta()?.total) {
        <div class="rating-summary">
          <div class="avg-score">
            <div class="avg-number">{{ meta()!.avgRating }}</div>
            <lg-star-rating [value]="meta()!.avgRating" [size]="16" />
            <p class="avg-total">{{ meta()!.total }} review{{ meta()!.total !== 1 ? 's' : '' }}</p>
          </div>
          <div class="bars">
            @for (star of [5,4,3,2,1]; track star) {
              <div class="bar-row">
                <span>{{ star }}★</span>
                <div class="bar-track">
                  <div class="bar-fill"
                       [style.width.%]="barPct(star)"></div>
                </div>
                <span class="bar-count">{{ meta()!.distribution[star] ?? 0 }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Sort options -->
      @if ((reviews().length || loading()) && meta()?.total) {
        <div class="sort-bar">
          <span class="sort-label">Sort by:</span>
          @for (opt of sortOptions; track opt.value) {
            <button class="sort-btn" [class.active]="sort() === opt.value"
                    (click)="changeSort(opt.value)">{{ opt.label }}</button>
          }
        </div>
      }

      <!-- Reviews list -->
      @for (review of reviews(); track review.id) {
        <div class="review-card">
          <div class="review-header">
            <div class="avatar">
              @if (review.reviewer?.avatar) {
                <img [src]="review.reviewer.avatar" [alt]="review.reviewer.name" />
              } @else {
                {{ review.reviewer?.name?.charAt(0)?.toUpperCase() ?? '?' }}
              }
            </div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span class="reviewer-name">{{ review.reviewer?.name ?? 'Anonymous' }}</span>
                @if (review.verifiedPurchase) {
                  <span class="verified-badge">
                    <mat-icon style="font-size:11px;width:11px;height:11px">verified</mat-icon>
                    Verified Purchase
                  </span>
                }
              </div>
              <div class="review-date">{{ review.createdAt | date:'d MMM yyyy' }}</div>
            </div>
            <lg-star-rating [value]="review.rating" [size]="15" />
          </div>

          @if (review.title) {
            <p class="review-title">{{ review.title }}</p>
          }
          @if (review.body) {
            <p class="review-body">{{ review.body }}</p>
          }

          <!-- Review images -->
          @if ($any(review).images?.length) {
            <div class="review-images">
              @for (img of $any(review).images; track img) {
                <img class="review-img" [src]="img" alt="review image" />
              }
            </div>
          }

          <!-- Helpful -->
          <div class="helpful-row">
            <button class="helpful-btn" (click)="markHelpful(review.id)">
              <mat-icon style="font-size:12px;width:12px;height:12px">thumb_up</mat-icon>
              Helpful ({{ $any(review).helpfulCount ?? 0 }})
            </button>
          </div>

          <!-- Vendor reply -->
          @if ($any(review).vendorReply) {
            <div class="vendor-reply">
              <div class="vendor-reply-label">Seller Response</div>
              <p style="margin:0;color:var(--text-secondary)">{{ $any(review).vendorReply }}</p>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !reviews().length) {
        <div class="empty">
          <mat-icon style="font-size:40px;width:40px;height:40px;display:block;margin:0 auto 8px">
            rate_review
          </mat-icon>
          No reviews yet. Be the first to review this product!
        </div>
      }

      <!-- Load more -->
      @if (hasMore()) {
        <div class="load-more">
          <button class="load-more-btn" [disabled]="loading()" (click)="loadMore()">
            {{ loading() ? 'Loading…' : 'Load More Reviews' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class ReviewListComponent implements OnInit {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(AuthService);

  readonly productId = input.required<number>();
  readonly orderId   = input<number | undefined>(undefined);

  readonly reviews  = signal<ReviewResult[]>([]);
  readonly meta     = signal<ReviewsResponse['meta'] | null>(null);
  readonly loading  = signal(false);
  readonly showForm = signal(false);
  readonly sort     = signal('newest');

  readonly isLoggedIn = computed(() => this.#auth.isLoggedIn());
  readonly hasMore    = computed(() => {
    const m = this.meta();
    return m ? m.page < m.totalPages : false;
  });

  private page = 1;

  readonly sortOptions = [
    { value: 'newest',  label: 'Newest'   },
    { value: 'highest', label: 'Highest'  },
    { value: 'lowest',  label: 'Lowest'   },
    { value: 'helpful', label: 'Most Helpful' },
  ];

  ngOnInit(): void { this.load(1); }

  load(page: number): void {
    this.loading.set(true);
    this.#http.get<ReviewsResponse>(
      `${environment.apiUrl}/api/v1/products/${this.productId()}/reviews`,
      { params: { page: String(page), limit: '10', sort: this.sort() } },
    ).subscribe({
      next: r => {
        if (r.success) {
          this.reviews.update(prev => page === 1 ? r.data : [...prev, ...r.data]);
          this.meta.set(r.meta);
          this.page = page;
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMore(): void { this.load(this.page + 1); }

  changeSort(value: string): void {
    this.sort.set(value);
    this.load(1);
  }

  onReviewSubmitted(review: ReviewResult): void {
    this.reviews.update(r => [review, ...r]);
    this.meta.update(m => m ? { ...m, total: m.total + 1 } : m);
    this.showForm.set(false);
  }

  markHelpful(reviewId: number): void {
    this.#http.post(
      `${environment.apiUrl}/api/v1/reviews/${reviewId}/helpful`, {},
    ).subscribe();
    // Optimistic update
    this.reviews.update(r => r.map(rev =>
      rev.id === reviewId
        ? { ...rev, helpfulCount: ((rev as ReviewResult & { helpfulCount?: number }).helpfulCount ?? 0) + 1 }
        : rev,
    ));
  }

  barPct(star: number): number {
    const m = this.meta();
    if (!m?.total) return 0;
    return Math.round(((m.distribution[star] ?? 0) / m.total) * 100);
  }
}

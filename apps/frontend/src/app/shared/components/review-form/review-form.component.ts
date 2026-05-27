import {
  Component, ChangeDetectionStrategy, inject, signal, input, output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { environment } from '../../../../environments/environment';

export interface ReviewSubmission {
  productId: number;
  rating:    number;
  title:     string;
  body:      string;
}

export interface ReviewResult {
  id:               number;
  rating:           number;
  title:            string | null;
  body:             string | null;
  verifiedPurchase: boolean;
  createdAt:        string;
  reviewer:         { id: number; name: string; avatar: string | null };
}

@Component({
  selector: 'lg-review-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, StarRatingComponent],
  styles: [`
    :host { display: block; }

    .form-card {
      background: var(--bg-base);
      border: 1.5px solid var(--border-default);
      border-radius: 16px;
      padding: 24px;
    }
    .form-heading {
      font-family: var(--font-display);
      font-size: 1.0625rem; font-weight: 600;
      color: var(--text-primary); margin: 0 0 20px;
      display: flex; align-items: center; gap: 8px;
    }

    .rating-row {
      display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
    }
    .rating-label {
      font-size: .875rem; font-weight: 600; color: var(--text-secondary);
    }
    .rating-desc {
      font-size: .8125rem; color: var(--color-warning); font-weight: 600;
    }

    .field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
    .field label { font-size: .8125rem; font-weight: 600; color: var(--text-secondary); }
    .field input, .field textarea {
      padding: 10px 14px;
      border: 1.5px solid var(--border-default); border-radius: 10px;
      font-family: var(--font-sans); font-size: .875rem;
      color: var(--text-primary); background: var(--bg-subtle);
      outline: none; resize: vertical; width: 100%;
      transition: border-color 150ms;
    }
    .field input:focus, .field textarea:focus {
      border-color: var(--color-primary); background: var(--bg-base);
    }

    .char-count {
      font-size: .6875rem; color: var(--text-muted);
      text-align: right; margin-top: 2px;
    }

    .actions {
      display: flex; align-items: center; gap: 12px; margin-top: 20px;
    }
    .btn-submit {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 24px;
      background: var(--color-primary); color: #fff;
      border: none; border-radius: 10px;
      font-size: .9375rem; font-weight: 600;
      cursor: pointer; transition: background 150ms;
    }
    .btn-submit:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }
    .btn-cancel {
      padding: 10px 18px;
      background: none; border: 1.5px solid var(--border-default);
      border-radius: 10px; font-size: .875rem; font-weight: 600;
      color: var(--text-secondary); cursor: pointer;
      transition: border-color 150ms;
    }
    .btn-cancel:hover { border-color: var(--color-primary); color: var(--color-primary); }

    .error-msg {
      display: flex; align-items: center; gap: 6px;
      color: var(--color-danger, #dc2626); font-size: .8125rem;
      background: rgba(220,38,38,.06); border-radius: 8px;
      padding: 8px 12px; margin-top: 12px;
    }

    .success-state {
      text-align: center; padding: 32px 24px;
    }
    .success-icon {
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--color-primary-50);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
      color: var(--color-primary);
    }
    .success-title {
      font-family: var(--font-display); font-size: 1.125rem; font-weight: 600;
      color: var(--text-primary); margin: 0 0 4px;
    }
    .success-sub { font-size: .875rem; color: var(--text-muted); margin: 0; }
  `],
  template: `
    <div class="form-card">

      @if (submitted()) {
        <!-- Success state -->
        <div class="success-state">
          <div class="success-icon">
            <mat-icon style="font-size:28px;width:28px;height:28px">check_circle</mat-icon>
          </div>
          <p class="success-title">Thank you for your review!</p>
          <p class="success-sub">Your feedback helps other plant lovers choose wisely. 🌿</p>
        </div>

      } @else {
        <h3 class="form-heading">
          <mat-icon style="font-size:20px;width:20px;height:20px;color:var(--color-warning)">star</mat-icon>
          Write a Review
        </h3>

        <!-- Star picker -->
        <div class="rating-row">
          <span class="rating-label">Your Rating</span>
          <lg-star-rating
            [value]="rating()"
            [size]="28"
            [interactive]="true"
            (ratingChange)="rating.set($event)"
          />
          @if (rating() > 0) {
            <span class="rating-desc">{{ ratingLabel() }}</span>
          }
        </div>

        <!-- Title -->
        <div class="field">
          <label>Review Title <span style="font-weight:400;color:var(--text-muted)">(optional)</span></label>
          <input type="text"
                 [(ngModel)]="title"
                 placeholder="Summarise your experience…"
                 maxlength="160" />
        </div>

        <!-- Body -->
        <div class="field">
          <label>Your Review</label>
          <textarea [(ngModel)]="body"
                    rows="4"
                    placeholder="What did you like or dislike? How did the plant arrive?"
                    maxlength="2000"></textarea>
          <span class="char-count">{{ body.length }} / 2000</span>
        </div>

        <!-- Error -->
        @if (error()) {
          <div class="error-msg">
            <mat-icon style="font-size:16px;width:16px;height:16px">error</mat-icon>
            {{ error() }}
          </div>
        }

        <!-- Actions -->
        <div class="actions">
          <button class="btn-submit"
                  [disabled]="rating() === 0 || saving()"
                  (click)="submit()">
            @if (saving()) {
              <mat-icon style="font-size:16px;width:16px;height:16px;animation:spin 1s linear infinite">
                refresh
              </mat-icon>
              Submitting…
            } @else {
              <mat-icon style="font-size:16px;width:16px;height:16px">send</mat-icon>
              Submit Review
            }
          </button>
          <button class="btn-cancel" (click)="cancelled.emit()">Cancel</button>
        </div>
      }
    </div>
  `,
})
export class ReviewFormComponent {
  readonly #http = inject(HttpClient);

  readonly productId = input.required<number>();
  readonly orderId   = input<number | undefined>(undefined);

  readonly reviewSubmitted = output<ReviewResult>();
  readonly cancelled       = output<void>();

  readonly rating    = signal(0);
  readonly saving    = signal(false);
  readonly error     = signal('');
  readonly submitted = signal(false);

  title = '';
  body  = '';

  readonly ratingLabel = () => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[this.rating()] ?? '';
  };

  submit(): void {
    if (this.rating() === 0) return;
    this.saving.set(true);
    this.error.set('');

    const payload: Record<string, unknown> = {
      rating: this.rating(),
      title:  this.title.trim() || undefined,
      body:   this.body.trim()  || undefined,
    };
    if (this.orderId()) payload['orderId'] = this.orderId();

    this.#http.post<{ success: boolean; data: ReviewResult; message: string }>(
      `${environment.apiUrl}/api/v1/products/${this.productId()}/reviews`,
      payload,
      { withCredentials: true },
    ).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.submitted.set(true);
          this.reviewSubmitted.emit(r.data);
        } else {
          this.error.set(r.message ?? 'Submission failed');
        }
      },
      error: err => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Could not submit review. Please try again.');
      },
    });
  }
}

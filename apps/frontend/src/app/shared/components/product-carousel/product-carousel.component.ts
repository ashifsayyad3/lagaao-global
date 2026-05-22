import {
  Component, Input, ChangeDetectionStrategy,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';
import { AiProduct } from '../../../core/services/ai.service';

@Component({
  selector: 'lg-product-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe, DecimalPipe],
  styles: [`
    :host { display: block; }

    .carousel-card {
      flex-shrink: 0;
      width: 176px;
      border-radius: 14px;
      background: #fff;
      border: 1px solid var(--border-default);
      box-shadow: var(--shadow-card);
      overflow: hidden;
      text-decoration: none;
      transition: box-shadow 280ms ease, transform 280ms ease;
    }
    .carousel-card:hover {
      box-shadow: var(--shadow-card-hover);
      transform: translateY(-3px);
    }

    .card-img {
      height: 160px;
      background: var(--bg-subtle);
      overflow: hidden;
    }
    .card-img img {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 350ms ease;
    }
    .carousel-card:hover .card-img img { transform: scale(1.06); }

    .card-info { padding: 10px 12px 12px; }

    .card-name {
      font-size: .8125rem;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-rating {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-top: 4px;
    }

    .card-price {
      display: flex;
      align-items: baseline;
      gap: 5px;
      margin-top: 6px;
      flex-wrap: wrap;
    }
    .price-main { font-size: .875rem; font-weight: 700; color: var(--text-primary); }
    .price-mrp  { font-size: .75rem; color: var(--text-muted); text-decoration: line-through; }

    .view-all {
      font-size: .8125rem;
      color: var(--color-primary);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 2px;
      text-decoration: none;
      transition: color 150ms ease;
    }
    .view-all:hover { color: var(--color-primary-dark); }
  `],
  template: `
    <section style="padding: 32px 0;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h2 style="font-family:var(--font-display);font-size:1.375rem;font-weight:600;color:var(--text-primary);margin:0">
          {{ title }}
        </h2>
        @if (viewAllLink) {
          <a [routerLink]="viewAllLink" class="view-all">
            View all
            <mat-icon style="font-size:16px;width:16px;height:16px">chevron_right</mat-icon>
          </a>
        }
      </div>

      <div style="display:flex;gap:14px;overflow-x:auto;padding-bottom:8px"
           class="hide-scrollbar">
        @for (p of products; track p.id) {
          <a [routerLink]="['/products', p.slug]" class="carousel-card">
            <div class="card-img">
              @if (p.images?.[0]?.url) {
                <img [src]="p.images![0].url" [alt]="p.name" />
              } @else {
                <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted)">
                  <mat-icon style="font-size:32px;width:32px;height:32px">eco</mat-icon>
                </div>
              }
            </div>
            <div class="card-info">
              <p class="card-name">{{ p.name }}</p>
              @if (p.rating) {
                <div class="card-rating">
                  <mat-icon style="font-size:11px;width:11px;height:11px;color:#f59e0b">star</mat-icon>
                  <span style="font-size:11px;color:var(--text-muted)">{{ p.rating | number: '1.1-1' }}</span>
                </div>
              }
              <div class="card-price">
                <span class="price-main">{{ (p.salePrice ?? p.basePrice) | currencyInr }}</span>
                @if (p.salePrice && p.salePrice < p.basePrice) {
                  <span class="price-mrp">{{ p.basePrice | currencyInr }}</span>
                }
              </div>
            </div>
          </a>
        }
      </div>
    </section>
  `,
})
export class ProductCarouselComponent {
  @Input() title = 'Recommended';
  @Input() products: AiProduct[] = [];
  @Input() viewAllLink: string | null = null;
}

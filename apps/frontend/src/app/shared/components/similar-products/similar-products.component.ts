import {
  Component, ChangeDetectionStrategy, inject, input, OnChanges, signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RecommendationsService, RecommendedProduct } from '../../../core/services/recommendations.service';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';

@Component({
  selector: 'lg-similar-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, DecimalPipe, CurrencyInrPipe],
  template: `
@if (products().length > 0) {
  <section class="space-y-4">
    <h2 class="text-lg font-bold text-text-primary">{{ title() }}</h2>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      @for (p of products(); track p.id) {
        <a [routerLink]="['/products', p.slug]"
           class="group rounded-2xl border border-border-default bg-bg-base overflow-hidden
                  hover:shadow-md transition-shadow">
          <div class="aspect-square bg-surface-50 overflow-hidden">
            @if (p.thumbnail) {
              <img [src]="p.thumbnail" [alt]="p.name"
                   class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            } @else {
              <div class="w-full h-full flex items-center justify-center">
                <mat-icon class="text-4xl text-text-muted">eco</mat-icon>
              </div>
            }
          </div>
          <div class="p-3 space-y-1">
            <p class="text-sm font-medium text-text-primary line-clamp-2 leading-snug">{{ p.name }}</p>
            <div class="flex items-center gap-1">
              <span class="text-base font-bold text-text-primary">{{ p.price | currencyInr }}</span>
              @if (p.mrp > p.price) {
                <span class="text-xs text-text-muted line-through">{{ p.mrp | currencyInr }}</span>
              }
            </div>
            @if (p.avgRating > 0) {
              <div class="flex items-center gap-1">
                <mat-icon style="font-size:13px;width:13px;height:13px;color:#f59e0b">star</mat-icon>
                <span class="text-xs text-text-muted">{{ p.avgRating | number:'1.1-1' }} ({{ p.reviewCount }})</span>
              </div>
            }
          </div>
        </a>
      }
    </div>
  </section>
}
  `,
})
export class SimilarProductsComponent implements OnChanges {
  readonly #recSvc = inject(RecommendationsService);

  productId = input<number | null>(null);
  title     = input('Similar Products');

  products = signal<RecommendedProduct[]>([]);

  ngOnChanges(): void {
    const id = this.productId();
    if (!id) return;
    this.#recSvc.getForProduct(id).subscribe({
      next:  r => this.products.set(r.data),
      error: () => {},
    });
  }
}

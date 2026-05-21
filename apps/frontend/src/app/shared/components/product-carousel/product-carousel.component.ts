import {
  Component, Input, ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';
import { AiProduct } from '../../../core/services/ai.service';

@Component({
  selector: 'lg-product-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe],
  template: `
    <section class="py-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-display text-xl font-bold text-text-primary">{{ title }}</h2>
        @if (viewAllLink) {
          <a [routerLink]="viewAllLink"
             class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View all <mat-icon class="!text-base">chevron_right</mat-icon>
          </a>
        }
      </div>
      <div class="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
        @for (p of products; track p.id) {
          <a [routerLink]="['/products', p.slug]"
             class="flex-shrink-0 w-44 card overflow-hidden hover:shadow-card-hover transition-shadow group">
            <div class="h-40 bg-surface-100 dark:bg-surface-800 overflow-hidden">
              @if (p.images?.[0]?.url) {
                <img [src]="p.images![0].url" [alt]="p.name"
                     class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              } @else {
                <div class="w-full h-full flex items-center justify-center">
                  <mat-icon class="!text-3xl text-text-secondary/30">image</mat-icon>
                </div>
              }
            </div>
            <div class="p-3">
              <p class="text-sm font-medium text-text-primary line-clamp-2 leading-tight">{{ p.name }}</p>
              <div class="flex items-center gap-1 mt-1">
                <mat-icon class="!text-xs !w-3 !h-3 text-amber-400">star</mat-icon>
                <span class="text-xs text-text-secondary">{{ p.rating | number: '1.1-1' }}</span>
              </div>
              <div class="mt-1.5 flex items-baseline gap-1.5">
                <span class="text-sm font-bold text-text-primary">
                  {{ (p.salePrice ?? p.basePrice) | currencyInr }}
                </span>
                @if (p.salePrice && p.salePrice < p.basePrice) {
                  <span class="text-xs text-text-secondary line-through">{{ p.basePrice | currencyInr }}</span>
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

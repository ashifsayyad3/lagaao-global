import {
  Component, ChangeDetectionStrategy, inject, OnInit, input
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { RecommendationsService } from '../../../core/services/recommendations.service';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';

@Component({
  selector: 'lg-you-may-like',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe, DecimalPipe],
  template: `
@if (recSvc.forUser().length > 0) {
  <section class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-text-primary">{{ title() }}</h2>
      <a routerLink="/products" class="text-sm text-primary-600 hover:underline">View all</a>
    </div>
    <div class="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
      @for (p of recSvc.forUser(); track p.id) {
        <a [routerLink]="['/products', p.slug]"
           class="group flex-shrink-0 w-44 rounded-2xl border border-border-default bg-bg-base overflow-hidden
                  hover:shadow-md transition-shadow snap-start">
          <div class="aspect-square bg-surface-50 overflow-hidden">
            @if (p.thumbnail) {
              <img [src]="p.thumbnail" [alt]="p.name"
                   class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            } @else {
              <div class="w-full h-full flex items-center justify-center">
                <mat-icon class="text-3xl text-text-muted">eco</mat-icon>
              </div>
            }
          </div>
          <div class="p-3 space-y-1">
            <p class="text-xs font-medium text-text-primary line-clamp-2 leading-snug">{{ p.name }}</p>
            <div class="flex items-center gap-1 flex-wrap">
              <span class="text-sm font-bold text-text-primary">{{ p.price | currencyInr }}</span>
              @if (p.mrp > p.price) {
                <span class="text-xs text-text-muted line-through">{{ p.mrp | currencyInr }}</span>
              }
            </div>
            @if (p.avgRating > 0) {
              <div class="flex items-center gap-0.5">
                <mat-icon style="font-size:12px;width:12px;height:12px;color:#f59e0b">star</mat-icon>
                <span class="text-xs text-text-muted">{{ p.avgRating | number:'1.1-1' }}</span>
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
export class YouMayLikeComponent implements OnInit {
  readonly recSvc = inject(RecommendationsService);

  title = input('You May Also Like');

  ngOnInit(): void {
    if (this.recSvc.forUser().length === 0) {
      this.recSvc.loadForUser();
    }
  }
}

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SkeletonCardComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'lg-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonCardComponent],
  template: `
    <div class="max-w-screen-2xl mx-auto px-4 md:px-6 py-8">
      <h1 class="font-display text-2xl font-bold text-text-primary mb-6">All Products</h1>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        @for (i of items; track i) {
          <lg-skeleton-card></lg-skeleton-card>
        }
      </div>
    </div>
  `,
})
export class ProductListComponent {
  items = Array.from({ length: 20 }, (_, i) => i);
}

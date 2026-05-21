import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'lg-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonComponent],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 md:px-6 py-8">
      <div class="grid lg:grid-cols-2 gap-10">
        <lg-skeleton height="480px" borderRadius="1rem"></lg-skeleton>
        <div class="space-y-4">
          <lg-skeleton height="2rem" width="70%"></lg-skeleton>
          <lg-skeleton height="1rem" width="40%"></lg-skeleton>
          <lg-skeleton height="1.5rem" width="30%"></lg-skeleton>
          <lg-skeleton height="3rem"></lg-skeleton>
        </div>
      </div>
    </div>
  `,
})
export class ProductDetailComponent {}

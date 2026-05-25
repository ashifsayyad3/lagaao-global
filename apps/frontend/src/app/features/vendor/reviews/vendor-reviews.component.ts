import { Component, ChangeDetectionStrategy } from '@angular/core';
import { VendorPlaceholderComponent } from '../shared/vendor-placeholder.component';

@Component({
  selector: 'lg-vendor-reviews',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VendorPlaceholderComponent],
  template: `<lg-vendor-placeholder title="Product Reviews" icon="star_outline"></lg-vendor-placeholder>`,
})
export class VendorReviewsComponent {}

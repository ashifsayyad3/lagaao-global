import { Component, ChangeDetectionStrategy } from '@angular/core';
import { VendorPlaceholderComponent } from '../shared/vendor-placeholder.component';

@Component({
  selector: 'lg-vendor-support',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VendorPlaceholderComponent],
  template: `<lg-vendor-placeholder title="Support Center" icon="support_agent"></lg-vendor-placeholder>`,
})
export class VendorSupportComponent {}

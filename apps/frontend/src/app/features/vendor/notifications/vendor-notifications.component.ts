import { Component, ChangeDetectionStrategy } from '@angular/core';
import { VendorPlaceholderComponent } from '../shared/vendor-placeholder.component';

@Component({
  selector: 'lg-vendor-notifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VendorPlaceholderComponent],
  template: `<lg-vendor-placeholder title="Notifications" icon="notifications"></lg-vendor-placeholder>`,
})
export class VendorNotificationsComponent {}

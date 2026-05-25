import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminPlaceholderComponent } from '../shared/admin-placeholder.component';

@Component({
  selector: 'lg-admin-vendors',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminPlaceholderComponent],
  template: `<lg-admin-placeholder title="Vendors" icon="storefront" description="Approve and manage marketplace vendors"></lg-admin-placeholder>`,
})
export class AdminVendorsComponent {}

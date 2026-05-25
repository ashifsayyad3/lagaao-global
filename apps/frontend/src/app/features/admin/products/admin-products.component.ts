import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminPlaceholderComponent } from '../shared/admin-placeholder.component';

@Component({
  selector: 'lg-admin-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminPlaceholderComponent],
  template: `<lg-admin-placeholder title="All Products" icon="inventory_2" description="Browse and manage all platform products"></lg-admin-placeholder>`,
})
export class AdminProductsComponent {}

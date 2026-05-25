import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminPlaceholderComponent } from '../shared/admin-placeholder.component';

@Component({
  selector: 'lg-admin-cms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminPlaceholderComponent],
  template: `<lg-admin-placeholder title="Content Management" icon="web" description="Banners, blog, pages, and SEO"></lg-admin-placeholder>`,
})
export class AdminCmsComponent {}

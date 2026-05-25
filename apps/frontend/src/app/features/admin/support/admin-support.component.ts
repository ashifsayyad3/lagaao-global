import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminPlaceholderComponent } from '../shared/admin-placeholder.component';

@Component({
  selector: 'lg-admin-support',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminPlaceholderComponent],
  template: `<lg-admin-placeholder title="Support" icon="support_agent" description="Tickets, inbox, and customer complaints"></lg-admin-placeholder>`,
})
export class AdminSupportComponent {}

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminPlaceholderComponent } from '../shared/admin-placeholder.component';

@Component({
  selector: 'lg-admin-system',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminPlaceholderComponent],
  template: `<lg-admin-placeholder title="System" icon="settings" description="Settings, config, API keys, and health"></lg-admin-placeholder>`,
})
export class AdminSystemComponent {}

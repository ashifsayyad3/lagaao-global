import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AdminPlaceholderComponent } from '../shared/admin-placeholder.component';

@Component({
  selector: 'lg-admin-payments',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminPlaceholderComponent],
  template: `<lg-admin-placeholder title="Payments & Finance" icon="account_balance" description="Transactions, payouts, and settlements"></lg-admin-placeholder>`,
})
export class AdminPaymentsComponent {}

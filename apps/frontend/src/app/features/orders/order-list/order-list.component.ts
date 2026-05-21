import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lg-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-screen-xl mx-auto px-4 py-8">
      <h1 class="font-display text-2xl font-bold text-text-primary">My Orders</h1>
      <p class="text-text-secondary mt-2">Order history — Phase 6</p>
    </div>
  `,
})
export class OrderListComponent {}

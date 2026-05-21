import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lg-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="skeleton"
      [style.width]="width"
      [style.height]="height"
      [style.border-radius]="borderRadius"
    ></div>
  `,
})
export class SkeletonComponent {
  @Input() width  = '100%';
  @Input() height = '1rem';
  @Input() borderRadius = 'var(--radius-md)';
}

// ─── Convenience presets ──────────────────────────────────────

@Component({
  selector: 'lg-skeleton-card',
  standalone: true,
  imports: [SkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-xl overflow-hidden border border-border-default p-4 space-y-3">
      <lg-skeleton height="200px" borderRadius="0.5rem"></lg-skeleton>
      <lg-skeleton height="1rem" width="60%"></lg-skeleton>
      <lg-skeleton height="0.875rem" width="80%"></lg-skeleton>
      <lg-skeleton height="0.875rem" width="40%"></lg-skeleton>
      <div class="flex justify-between items-center pt-1">
        <lg-skeleton height="1.5rem" width="30%"></lg-skeleton>
        <lg-skeleton height="2rem"   width="5rem" borderRadius="0.5rem"></lg-skeleton>
      </div>
    </div>
  `,
})
export class SkeletonCardComponent {}

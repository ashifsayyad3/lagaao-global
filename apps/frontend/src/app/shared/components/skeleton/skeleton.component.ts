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
  styles: [`
    :host { display: block; }
    .card {
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--border-default);
      background: #fff;
      padding: 0 0 14px;
    }
    .img-ph {
      width: 100%;
      aspect-ratio: 1;
      background: var(--bg-subtle);
      margin-bottom: 14px;
    }
    .body { padding: 0 14px; display: flex; flex-direction: column; gap: 8px; }
    .row  { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
  `],
  template: `
    <div class="card">
      <div class="img-ph skeleton"></div>
      <div class="body">
        <lg-skeleton height="14px" width="75%"></lg-skeleton>
        <lg-skeleton height="12px" width="50%"></lg-skeleton>
        <lg-skeleton height="12px" width="35%"></lg-skeleton>
        <div class="row">
          <lg-skeleton height="20px" width="30%"></lg-skeleton>
          <lg-skeleton height="34px" width="90px" borderRadius="9999px"></lg-skeleton>
        </div>
      </div>
    </div>
  `,
})
export class SkeletonCardComponent {}

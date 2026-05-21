import {
  Component, Input, ChangeDetectionStrategy, computed, input,
} from '@angular/core';

@Component({
  selector: 'lg-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.viewBox]="'0 0 ' + w + ' ' + h" [attr.width]="w" [attr.height]="h"
         class="overflow-visible">
      <!-- Area fill -->
      <defs>
        <linearGradient [id]="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   [attr.stop-color]="color" stop-opacity="0.3" />
          <stop offset="100%" [attr.stop-color]="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      @if (areaPath()) {
        <path [attr.d]="areaPath()" [attr.fill]="'url(#' + gradId + ')'" />
      }
      @if (linePath()) {
        <path [attr.d]="linePath()" fill="none" [attr.stroke]="color" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" />
      }
    </svg>
  `,
})
export class SparklineChartComponent {
  @Input() values: number[] = [];
  @Input() color  = '#6366f1';
  @Input() w      = 200;
  @Input() h      = 60;

  readonly gradId = `grad-${Math.random().toString(36).slice(2)}`;

  linePath = computed(() => {
    const { values, w, h } = this;
    if (!values.length) return '';
    const max = Math.max(...values) || 1;
    const min = Math.min(...values);
    const range = max - min || 1;
    const pad = 4;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * (w - 2 * pad) + pad;
      const y = h - pad - ((v - min) / range) * (h - 2 * pad);
      return `${x},${y}`;
    });
    return 'M ' + pts.join(' L ');
  });

  areaPath = computed(() => {
    const line = this.linePath();
    if (!line) return '';
    const { w, h } = this;
    const pad = 4;
    return `${line} L ${w - pad},${h - pad} L ${pad},${h - pad} Z`;
  });
}

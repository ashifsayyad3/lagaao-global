import {
  Component, Input, ChangeDetectionStrategy, computed,
} from '@angular/core';

export interface ChartSeries { label: string; values: number[]; color: string }

@Component({
  selector: 'lg-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="w-full" [attr.height]="H">
        <defs>
          @for (s of series; track s.label) {
            <linearGradient [id]="'area-' + s.label" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   [attr.stop-color]="s.color" stop-opacity="0.2" />
              <stop offset="100%" [attr.stop-color]="s.color" stop-opacity="0" />
            </linearGradient>
          }
        </defs>

        <!-- Y-axis grid lines -->
        @for (tick of yTicks(); track $index) {
          <line
            [attr.x1]="PAD_L" [attr.y1]="yScale(tick)"
            [attr.x2]="W - PAD_R" [attr.y2]="yScale(tick)"
            stroke="currentColor" stroke-opacity="0.08" stroke-width="1"
          />
          <text [attr.x]="PAD_L - 6" [attr.y]="yScale(tick) + 4"
                text-anchor="end" font-size="10" fill="currentColor" opacity="0.5">
            {{ formatY(tick) }}
          </text>
        }

        <!-- Area fills -->
        @for (s of series; track s.label) {
          <path [attr.d]="areaPath(s)" [attr.fill]="'url(#area-' + s.label + ')'" />
        }

        <!-- Lines -->
        @for (s of series; track s.label) {
          <path [attr.d]="linePath(s)" fill="none" [attr.stroke]="s.color"
                stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        }

        <!-- X-axis labels (every nth) -->
        @for (lbl of xLabels(); track $index) {
          <text [attr.x]="lbl.x" [attr.y]="H - 2"
                text-anchor="middle" font-size="9" fill="currentColor" opacity="0.45">
            {{ lbl.text }}
          </text>
        }
      </svg>

      <!-- Legend -->
      @if (series.length > 1) {
        <div class="flex gap-4 mt-2 justify-end">
          @for (s of series; track s.label) {
            <div class="flex items-center gap-1.5 text-xs text-text-secondary">
              <span class="w-3 h-0.5 rounded-full inline-block" [style.background]="s.color"></span>
              {{ s.label }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class LineChartComponent {
  @Input() series: ChartSeries[] = [];
  @Input() labels: string[] = [];
  @Input() formatY: (v: number) => string = (v) => String(v);

  readonly W     = 600;
  readonly H     = 200;
  readonly PAD_L = 48;
  readonly PAD_R = 12;
  readonly PAD_T = 16;
  readonly PAD_B = 24;

  private get allValues(): number[] {
    return this.series.flatMap(s => s.values);
  }

  private get maxVal(): number { return Math.max(...this.allValues, 1); }
  private get minVal(): number { return Math.min(...this.allValues, 0); }

  yScale(v: number): number {
    const range = this.maxVal - this.minVal || 1;
    return this.PAD_T + (1 - (v - this.minVal) / range) * (this.H - this.PAD_T - this.PAD_B);
  }

  xPos(i: number, total: number): number {
    return this.PAD_L + (i / Math.max(total - 1, 1)) * (this.W - this.PAD_L - this.PAD_R);
  }

  yTicks = computed(() => {
    const max = this.maxVal;
    const step = max / 4;
    return [0, 1, 2, 3, 4].map(i => Math.round(step * i));
  });

  xLabels = computed(() => {
    const count = this.labels.length;
    const step  = Math.ceil(count / 6);
    return this.labels
      .map((text, i) => ({ text, x: this.xPos(i, count), show: i % step === 0 }))
      .filter(l => l.show);
  });

  linePath(s: ChartSeries): string {
    if (!s.values.length) return '';
    const total = s.values.length;
    return s.values
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${this.xPos(i, total)},${this.yScale(v)}`)
      .join(' ');
  }

  areaPath(s: ChartSeries): string {
    if (!s.values.length) return '';
    const line  = this.linePath(s);
    const total = s.values.length;
    const baseY = this.H - this.PAD_B;
    const x0    = this.xPos(0, total);
    const xN    = this.xPos(total - 1, total);
    return `${line} L ${xN},${baseY} L ${x0},${baseY} Z`;
  }
}

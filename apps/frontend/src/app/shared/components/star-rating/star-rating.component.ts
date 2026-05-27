import {
  Component, ChangeDetectionStrategy, input, output, signal, computed,
} from '@angular/core';

@Component({
  selector: 'lg-star-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host { display: inline-flex; align-items: center; gap: 2px; }

    .star {
      cursor: default;
      font-size: 20px;
      line-height: 1;
      transition: transform 120ms;
      user-select: none;
    }
    :host([interactive]) .star {
      cursor: pointer;
    }
    :host([interactive]) .star:hover {
      transform: scale(1.2);
    }

    .filled  { color: #f59e0b; }  /* amber-400 */
    .half    { color: #f59e0b; }
    .empty   { color: #d1d5db; }  /* gray-300 */

    .count {
      font-size: .8125rem;
      color: var(--text-muted);
      margin-left: 4px;
    }
  `],
  template: `
    @for (s of stars(); track s.index) {
      <span class="star"
            [class.filled]="s.type === 'full'"
            [class.half]="s.type === 'half'"
            [class.empty]="s.type === 'empty'"
            [style.font-size.px]="size()"
            (mouseenter)="interactive() ? hovered.set(s.index) : null"
            (mouseleave)="interactive() ? hovered.set(0) : null"
            (click)="interactive() ? select(s.index) : null">
        {{ s.type === 'full' ? '★' : s.type === 'half' ? '⯨' : '☆' }}
      </span>
    }
    @if (showCount() && count() > 0) {
      <span class="count">({{ count() }})</span>
    }
  `,
  host: {
    '[attr.interactive]': 'interactive() ? "" : null',
  },
})
export class StarRatingComponent {
  readonly value       = input<number>(0);    // 0-5, supports decimals
  readonly size        = input<number>(18);
  readonly interactive = input<boolean>(false);
  readonly showCount   = input<boolean>(false);
  readonly count       = input<number>(0);

  readonly ratingChange = output<number>();

  readonly hovered = signal(0);

  readonly stars = computed(() => {
    const effective = this.interactive() && this.hovered() ? this.hovered() : this.value();
    return Array.from({ length: 5 }, (_, i) => {
      const pos = i + 1;
      const type = effective >= pos ? 'full'
        : effective >= pos - 0.5 ? 'half'
        : 'empty';
      return { index: pos, type };
    });
  });

  select(index: number): void {
    this.ratingChange.emit(index);
  }
}

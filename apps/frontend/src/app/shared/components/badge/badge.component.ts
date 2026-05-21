import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

@Component({
  selector: 'lg-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="computedClass">
      <ng-content></ng-content>
    </span>
  `,
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() dot = false;

  get computedClass(): string {
    const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium';
    const variantMap: Record<BadgeVariant, string> = {
      default: 'bg-surface-100 text-text-secondary dark:bg-surface-800',
      primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
      success: 'bg-green-100  text-green-700  dark:bg-green-900 dark:text-green-300',
      warning: 'bg-amber-100  text-amber-700  dark:bg-amber-900 dark:text-amber-300',
      error:   'bg-red-100    text-red-700    dark:bg-red-900 dark:text-red-300',
      info:    'bg-cyan-100   text-cyan-700   dark:bg-cyan-900 dark:text-cyan-300',
    };
    return `${base} ${variantMap[this.variant]}`;
  }
}

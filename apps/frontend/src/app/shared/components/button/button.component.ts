import {
  Component, Input, HostBinding, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
export type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'lg-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="computedClass"
      class="relative inline-flex items-center justify-center font-medium
             transition-all duration-150 focus-visible:ring-2 focus-visible:ring-offset-2
             select-none"
    >
      @if (loading) {
        <mat-spinner diameter="16" class="mr-2 opacity-70"></mat-spinner>
      } @else if (prefixIcon) {
        <span class="material-symbols-outlined mr-1.5 text-[1.1em]">{{ prefixIcon }}</span>
      }
      <ng-content></ng-content>
      @if (suffixIcon && !loading) {
        <span class="material-symbols-outlined ml-1.5 text-[1.1em]">{{ suffixIcon }}</span>
      }
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading  = false;
  @Input() fullWidth = false;
  @Input() rounded  = false;
  @Input() prefixIcon?: string;
  @Input() suffixIcon?: string;

  get computedClass(): string {
    return [
      this.#variantClass(),
      this.#sizeClass(),
      this.fullWidth  ? 'w-full' : '',
      this.rounded    ? 'rounded-full' : 'rounded-lg',
      (this.disabled || this.loading) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
    ].filter(Boolean).join(' ');
  }

  #variantClass(): string {
    const map: Record<ButtonVariant, string> = {
      primary:   'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 shadow-elevation-1',
      secondary: 'bg-surface-100 text-text-primary hover:bg-surface-200 focus-visible:ring-primary-500 dark:bg-surface-800 dark:hover:bg-surface-700',
      outline:   'border border-border-strong bg-transparent text-primary-600 hover:bg-primary-50 focus-visible:ring-primary-500 dark:hover:bg-primary-950',
      ghost:     'bg-transparent text-text-secondary hover:bg-surface-100 focus-visible:ring-primary-500 dark:hover:bg-surface-800',
      danger:    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-elevation-1',
      accent:    'bg-accent text-white hover:bg-accent-dark focus-visible:ring-orange-500 shadow-elevation-1',
    };
    return map[this.variant];
  }

  #sizeClass(): string {
    const map: Record<ButtonSize, string> = {
      xs: 'h-7  px-2.5 text-xs gap-1',
      sm: 'h-8  px-3   text-sm gap-1.5',
      md: 'h-10 px-4   text-sm gap-2',
      lg: 'h-11 px-5   text-base gap-2',
      xl: 'h-12 px-6   text-base gap-2',
    };
    return map[this.size];
  }
}

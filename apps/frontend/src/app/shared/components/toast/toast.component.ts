import {
  Component, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'lg-toast-container',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('toast', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
  template: `
    <div class="fixed top-4 right-4 z-[toast] flex flex-col gap-2 pointer-events-none"
         aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          @toast
          class="pointer-events-auto max-w-sm w-full glass-strong rounded-xl shadow-xl
                 border overflow-hidden"
          [class]="borderClass(toast)"
          role="alert"
        >
          <div class="flex items-start gap-3 p-4">
            <span class="material-symbols-outlined mt-0.5 flex-shrink-0" [class]="iconClass(toast)">
              {{ iconName(toast) }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-sm text-text-primary">{{ toast.title }}</p>
              @if (toast.message) {
                <p class="text-xs text-text-secondary mt-0.5">{{ toast.message }}</p>
              }
            </div>
            <button
              class="flex-shrink-0 p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800
                     transition-colors"
              (click)="toastService.dismiss(toast.id)"
              aria-label="Dismiss"
            >
              <span class="material-symbols-outlined text-text-muted" style="font-size:18px">close</span>
            </button>
          </div>
          <!-- Progress bar -->
          <div class="h-0.5 w-full bg-surface-100 dark:bg-surface-800">
            <div
              class="h-full"
              [class]="progressClass(toast)"
              [style.animation]="'toastProgress ' + toast.duration + 'ms linear forwards'"
            ></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes toastProgress {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  iconName(t: Toast): string {
    const map = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };
    return map[t.type];
  }

  iconClass(t: Toast): string {
    const map = {
      success: 'text-green-500',
      error:   'text-red-500',
      warning: 'text-amber-500',
      info:    'text-blue-500',
    };
    return map[t.type];
  }

  borderClass(t: Toast): string {
    const map = {
      success: 'border-green-200 dark:border-green-800',
      error:   'border-red-200   dark:border-red-800',
      warning: 'border-amber-200 dark:border-amber-800',
      info:    'border-blue-200  dark:border-blue-800',
    };
    return map[t.type];
  }

  progressClass(t: Toast): string {
    const map = {
      success: 'bg-green-500',
      error:   'bg-red-500',
      warning: 'bg-amber-500',
      info:    'bg-blue-500',
    };
    return map[t.type];
  }
}

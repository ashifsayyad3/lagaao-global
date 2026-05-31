import {
  Component, ChangeDetectionStrategy, inject, computed,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'lg-toast-container',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('toast', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px) scale(0.96)' }),
        animate('280ms cubic-bezier(0.16,1,0.3,1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
      transition(':leave', [
        animate('180ms cubic-bezier(0.4,0,1,1)',
          style({ opacity: 0, transform: 'translateY(8px) scale(0.96)' })),
      ]),
    ]),
  ],
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column-reverse;
      gap: 10px;
      pointer-events: none;
      max-width: 360px;
      width: calc(100vw - 32px);
    }

    .toast {
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background: var(--bg-base, #fff);
      border-radius: 14px;
      box-shadow: 0 4px 24px rgba(0,0,0,.10), 0 1px 4px rgba(0,0,0,.06);
      overflow: hidden;
      border-left: 4px solid transparent;
    }
    .toast.success { border-left-color: #22c55e; }
    .toast.error   { border-left-color: #ef4444; }
    .toast.warning { border-left-color: #f59e0b; }
    .toast.info    { border-left-color: #3b82f6; }

    .toast-body {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 14px 14px 16px;
    }

    .toast-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .toast.success .toast-icon { background: #f0fdf4; color: #16a34a; }
    .toast.error   .toast-icon { background: #fef2f2; color: #dc2626; }
    .toast.warning .toast-icon { background: #fffbeb; color: #d97706; }
    .toast.info    .toast-icon { background: #eff6ff; color: #2563eb; }

    .toast-text { flex: 1; min-width: 0; padding-top: 2px; }
    .toast-title {
      font-family: var(--font-sans, system-ui);
      font-size: .875rem;
      font-weight: 600;
      color: var(--text-primary, #111);
      line-height: 1.3;
      margin: 0;
    }
    .toast-msg {
      font-size: .8125rem;
      color: var(--text-muted, #6b7280);
      margin: 2px 0 0;
      line-height: 1.4;
    }

    .toast-close {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 7px;
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted, #9ca3af);
      transition: background 150ms, color 150ms;
      margin-top: 1px;
    }
    .toast-close:hover {
      background: var(--bg-subtle, #f5f5f5);
      color: var(--text-primary, #111);
    }

    /* Progress bar */
    .toast-progress {
      height: 3px;
      background: var(--bg-subtle, #f3f4f6);
    }
    .toast-progress-fill {
      height: 100%;
      animation: toastProgress linear forwards;
    }
    .toast.success .toast-progress-fill { background: #22c55e; }
    .toast.error   .toast-progress-fill { background: #ef4444; }
    .toast.warning .toast-progress-fill { background: #f59e0b; }
    .toast.info    .toast-progress-fill { background: #3b82f6; }

    @keyframes toastProgress {
      from { width: 100%; }
      to   { width: 0%; }
    }

    @media (max-width: 480px) {
      .toast-stack {
        bottom: 16px;
        right: 12px;
        left: 12px;
        width: auto;
      }
    }
  `],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (t of visible(); track t.id) {
        <div
          @toast
          class="toast"
          [class]="t.type"
          role="alert"
        >
          <div class="toast-body">
            <!-- Icon -->
            <div class="toast-icon">
              <mat-icon style="font-size:20px;width:20px;height:20px">{{ iconFor(t) }}</mat-icon>
            </div>

            <!-- Text -->
            <div class="toast-text">
              <p class="toast-title">{{ t.title }}</p>
              @if (t.message) {
                <p class="toast-msg">{{ t.message }}</p>
              }
            </div>

            <!-- Close -->
            <button class="toast-close" (click)="svc.dismiss(t.id)" aria-label="Close">
              <mat-icon style="font-size:16px;width:16px;height:16px">close</mat-icon>
            </button>
          </div>

          <!-- Progress -->
          <div class="toast-progress">
            <div
              class="toast-progress-fill"
              [style.animation-duration]="t.duration + 'ms'"
            ></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly svc     = inject(ToastService);
  readonly visible = computed(() => this.svc.toasts().slice(-4));

  iconFor(t: Toast): string {
    const map: Record<string, string> = {
      success: 'check_circle',
      error:   'cancel',
      warning: 'warning',
      info:    'info',
    };
    return map[t.type] ?? 'notifications';
  }
}

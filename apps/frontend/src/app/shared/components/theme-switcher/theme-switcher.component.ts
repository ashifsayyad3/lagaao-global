import {
  ChangeDetectionStrategy, Component, inject, input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';

@Component({
  selector: 'lg-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'icon') {
      <!-- Single-button icon toggle (header compact mode) -->
      <button
        class="theme-icon-btn"
        [class.dark]="svc.isDark()"
        (click)="svc.toggle()"
        [title]="svc.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
        aria-label="Toggle theme"
      >
        <span class="theme-icon-btn__track">
          <span class="theme-icon-btn__thumb"></span>
        </span>
        <svg class="icon sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg class="icon moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    } @else {
      <!-- 3-way segmented control (settings / dropdown) -->
      <div class="theme-segment" role="group" aria-label="Theme mode">
        @for (opt of options; track opt.mode) {
          <button
            class="theme-segment__btn"
            [class.active]="svc.mode() === opt.mode"
            (click)="svc.setMode(opt.mode)"
            [title]="opt.label"
            [attr.aria-pressed]="svc.mode() === opt.mode"
          >
            <span class="theme-segment__icon" [innerHTML]="opt.icon"></span>
            @if (variant() === 'full') {
              <span class="theme-segment__label">{{ opt.label }}</span>
            }
          </button>
        }
      </div>
    }
  `,
  styles: [`
    /* ── Icon toggle button ──────────────────────────────────── */
    .theme-icon-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: var(--radius-pill);
      background: var(--surface-2);
      border: 1px solid var(--border-default);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-out);
      color: var(--text-secondary);
      overflow: hidden;

      &:hover {
        background: var(--surface-3);
        border-color: var(--border-strong);
        color: var(--text-primary);
        transform: scale(1.05);
      }

      &:active { transform: scale(0.96); }
    }

    .icon {
      width: 18px;
      height: 18px;
      position: absolute;
      transition: all var(--duration-base) var(--ease-spring);
    }

    .sun  { opacity: 1;  transform: scale(1)   rotate(0deg);   }
    .moon { opacity: 0;  transform: scale(0.5) rotate(-90deg); }

    .dark {
      .sun  { opacity: 0; transform: scale(0.5) rotate(90deg); }
      .moon { opacity: 1; transform: scale(1)   rotate(0deg);  }
    }

    /* ── 3-way segmented control ─────────────────────────────── */
    .theme-segment {
      display: inline-flex;
      gap: 2px;
      background: var(--surface-2);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-pill);
      padding: 3px;
    }

    .theme-segment__btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border: none;
      border-radius: var(--radius-pill);
      background: transparent;
      cursor: pointer;
      font-size: .8125rem;
      font-weight: 500;
      color: var(--text-muted);
      transition: all var(--duration-fast) var(--ease-out);
      white-space: nowrap;

      &:hover:not(.active) {
        color: var(--text-secondary);
        background: var(--color-hover);
      }

      &.active {
        background: var(--surface-1);
        color: var(--text-primary);
        box-shadow: var(--shadow-sm);
      }
    }

    .theme-segment__icon {
      display: inline-flex;
      width: 16px;
      height: 16px;
      ::ng-deep svg { width: 100%; height: 100%; }
    }

    .theme-segment__label {
      font-size: .8125rem;
    }
  `],
})
export class ThemeSwitcherComponent {
  readonly svc = inject(ThemeService);

  /** 'icon' = single toggle button | 'segment' = 3-way compact | 'full' = 3-way with labels */
  readonly variant = input<'icon' | 'segment' | 'full'>('icon');

  readonly options: Array<{ mode: ThemeMode; label: string; icon: string }> = [
    {
      mode: 'light',
      label: 'Light',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>`,
    },
    {
      mode: 'system',
      label: 'System',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>`,
    },
    {
      mode: 'dark',
      label: 'Dark',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>`,
    },
  ];
}

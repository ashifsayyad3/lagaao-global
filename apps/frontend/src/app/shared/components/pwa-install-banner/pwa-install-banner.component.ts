import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'lg-pwa-install-banner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pwa.canInstall() && !dismissed()) {
      <div class="pwa-banner" role="banner" aria-label="Install Lagaao app">
        <div class="pwa-banner__icon">
          <img src="/icons/icon-72x72.png" alt="Lagaao" width="40" height="40" loading="lazy" />
        </div>
        <div class="pwa-banner__text">
          <strong>Install Lagaao</strong>
          <span>Add to home screen for faster access</span>
        </div>
        <div class="pwa-banner__actions">
          <button class="pwa-banner__install" (click)="install()">Install</button>
          <button class="pwa-banner__close" (click)="dismiss()" aria-label="Dismiss">✕</button>
        </div>
      </div>
    }

    @if (pwa.updateAvailable()) {
      <div class="pwa-update-bar" role="alert">
        <span>🎉 New version available!</span>
        <button (click)="pwa.applyUpdate()">Update now</button>
      </div>
    }

    @if (!pwa.isOnline()) {
      <div class="pwa-offline-bar" role="alert">
        <span>📶 You're offline — showing cached content</span>
      </div>
    }
  `,
  styles: [`
    .pwa-banner {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      background: var(--color-surface, #fff);
      border-top: 3px solid var(--color-primary, #6366f1);
      box-shadow: 0 -2px 8px rgba(0,0,0,.12);
      position: fixed; bottom: 0; left: 0; right: 0;
      z-index: 9999;
    }
    .pwa-banner__text { flex: 1; display: flex; flex-direction: column; font-size: 13px; }
    .pwa-banner__text strong { font-size: 14px; font-weight: 600; }
    .pwa-banner__actions { display: flex; align-items: center; gap: 8px; }
    .pwa-banner__install {
      background: var(--color-primary, #6366f1); color: #fff;
      border: none; border-radius: 6px; padding: 6px 16px;
      font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .pwa-banner__close {
      background: none; border: none; font-size: 16px;
      cursor: pointer; color: var(--color-text-muted, #888); padding: 4px 8px;
    }
    .pwa-update-bar {
      display: flex; align-items: center; justify-content: center; gap: 16px;
      padding: 10px 16px;
      background: #ecfdf5; border-bottom: 2px solid #10b981;
      font-size: 13px; font-weight: 500;
    }
    .pwa-update-bar button {
      background: #10b981; color: #fff; border: none;
      border-radius: 6px; padding: 4px 14px; cursor: pointer; font-size: 13px;
    }
    .pwa-offline-bar {
      display: flex; align-items: center; justify-content: center;
      padding: 8px 16px;
      background: #fef3c7; border-bottom: 2px solid #f59e0b;
      font-size: 13px; font-weight: 500; color: #92400e;
    }
  `],
})
export class PwaInstallBannerComponent {
  readonly pwa = inject(PwaService);
  readonly dismissed = signal(false);

  dismiss(): void { this.dismissed.set(true); }

  async install(): Promise<void> {
    await this.pwa.promptInstall();
  }
}

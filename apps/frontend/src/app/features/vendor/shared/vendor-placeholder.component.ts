import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lg-vendor-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                min-height:60vh;text-align:center;padding:40px 24px">
      <div style="width:72px;height:72px;border-radius:20px;
                  background:linear-gradient(135deg,#dcfce7,#bbf7d0);
                  display:flex;align-items:center;justify-content:center;margin-bottom:20px">
        <mat-icon style="font-size:36px;width:36px;height:36px;color:#16a34a">{{ icon() }}</mat-icon>
      </div>
      <h2 style="font-family:var(--font-display);font-size:1.375rem;font-weight:700;
                 color:var(--text-primary);margin:0 0 8px">{{ title() }}</h2>
      <p style="font-size:.9375rem;color:var(--text-muted);margin:0 0 4px;max-width:420px">
        This module is being built. Coming in the next phase.
      </p>
      <p style="font-size:.8125rem;color:var(--text-muted);margin:0 0 28px">
        Phase 2 implementation in progress.
      </p>
      <a routerLink="/vendor" style="display:inline-flex;align-items:center;gap:6px;
         padding:10px 24px;background:var(--color-primary);color:#fff;
         border-radius:9999px;font-size:.875rem;font-weight:600;text-decoration:none;transition:opacity 150ms"
         onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
        <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
        Back to Dashboard
      </a>
    </div>
  `,
})
export class VendorPlaceholderComponent {
  readonly title = input('Coming Soon');
  readonly icon  = input('construction');
}

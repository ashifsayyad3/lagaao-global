import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../core/services/theme.service';
import { ToastContainerComponent } from '../../components/toast/toast.component';
import { LgLogoComponent } from '../../components/logo/logo.component';

@Component({
  selector: 'lg-auth-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, MatIconModule, ToastContainerComponent, LgLogoComponent],
  styles: [`
    :host { display: block; }

    .auth-wrap { min-height: 100vh; display: flex; }

    /* ── Left botanical panel ────────────────────── */
    .left-panel {
      display: none;
      width: 50%;
      position: relative;
      overflow: hidden;
      background: linear-gradient(160deg, #1e3326 0%, #2a4d31 45%, #3d6b45 100%);
    }
    @media (min-width: 1024px) { .left-panel { display: flex; flex-direction: column; justify-content: space-between; } }

    /* Leaf pattern overlay */
    .leaf-bg {
      position: absolute; inset: 0; opacity: .07;
      background-image: url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 10 C30 10 10 40 10 60 C10 80 30 110 60 110 C90 110 110 80 110 60 C110 40 90 10 60 10Z' fill='%23ffffff' fill-opacity='.3'/%3E%3Cpath d='M60 10 L60 110 M10 60 L110 60' stroke='%23ffffff' stroke-width='1' stroke-opacity='.2'/%3E%3C/svg%3E");
      background-size: 120px 120px;
    }

    /* Floating botanical decorations */
    .deco-circle {
      position: absolute; border-radius: 50%;
      background: rgba(255,255,255,.06);
    }

    .panel-content { position: relative; z-index: 1; padding: 48px 56px; }

    .panel-content lg-logo { margin-bottom: 64px; }

    .panel-headline {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(2rem, 3vw, 2.75rem);
      font-weight: 600;
      color: #fff;
      line-height: 1.2;
      margin: 0 0 20px;
    }
    .panel-headline em { font-style: italic; color: rgba(255,255,255,.75); }

    .panel-sub { font-size: 1rem; color: rgba(255,255,255,.65); line-height: 1.7; max-width: 360px; margin: 0; }

    /* Feature pills on left panel */
    .feature-list { list-style: none; padding: 0; margin: 40px 0 0; display: flex; flex-direction: column; gap: 16px; }
    .feature-item { display: flex; align-items: center; gap: 12px; }
    .feature-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,.12);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .feature-text { font-size: .9375rem; color: rgba(255,255,255,.8); font-weight: 500; }

    /* Testimonial card at bottom of left panel */
    .panel-footer { position: relative; z-index: 1; padding: 0 56px 48px; }
    .testimonial {
      background: rgba(255,255,255,.1);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 16px;
      padding: 20px;
    }
    .testimonial p { font-size: .875rem; color: rgba(255,255,255,.85); line-height: 1.6; margin: 0 0 12px; font-style: italic; }
    .testimonial-author { display: flex; align-items: center; gap: 10px; }
    .testimonial-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: .875rem; font-weight: 700; color: #fff;
    }
    .testimonial-name { font-size: .8125rem; font-weight: 600; color: rgba(255,255,255,.9); }
    .testimonial-role { font-size: .75rem; color: rgba(255,255,255,.5); }

    /* ── Right form panel ────────────────────────── */
    .right-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      background: #f2f7f2;
      min-height: 100vh;
      position: relative;
    }
    :host-context(.dark) .right-panel {
      background: #111a13;
    }

    .mobile-logo { display: flex; margin-bottom: 32px; }
    @media (min-width: 1024px) { .mobile-logo { display: none; } }

    .theme-btn {
      position: absolute; top: 16px; right: 16px;
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(255,255,255,.8); border: 1px solid var(--border-default);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--text-muted);
      transition: background 150ms;
    }
    .theme-btn:hover { background: var(--bg-muted); }

    .form-card {
      width: 100%; max-width: 440px;
      background: #ffffff;
      border: 1px solid rgba(0,0,0,.07);
      border-radius: 24px;
      padding: 36px 36px 32px;
      box-shadow: 0 8px 40px rgba(30,58,35,.10), 0 2px 12px rgba(30,58,35,.05);
      animation: fadeUp .4s cubic-bezier(0.16,1,0.3,1) both;
    }
    :host-context(.dark) .form-card {
      background: #1a2a1e;
      border-color: rgba(255,255,255,.08);
      box-shadow: 0 8px 40px rgba(0,0,0,.4), 0 2px 12px rgba(0,0,0,.25);
    }

    .back-home {
      display: flex; align-items: center; gap: 4px;
      font-size: .8125rem; color: var(--text-muted);
      text-decoration: none; margin-top: 20px;
      transition: color 150ms;
    }
    .back-home:hover { color: var(--color-primary); }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
  template: `
    <div class="auth-wrap">

      <!-- ── Left botanical panel ─────────────── -->
      <div class="left-panel">
        <div class="leaf-bg"></div>

        <!-- Decorative circles -->
        <div class="deco-circle" style="width:300px;height:300px;top:-100px;right:-80px"></div>
        <div class="deco-circle" style="width:200px;height:200px;bottom:100px;left:-60px"></div>

        <div class="panel-content">
          <lg-logo variant="white" size="38px"></lg-logo>

          <h1 class="panel-headline">
            Grow Something<br><em>Beautiful Today</em>
          </h1>
          <p class="panel-sub">
            India's premier destination for plants, seeds, pots, and everything your garden needs — delivered with care.
          </p>

          <ul class="feature-list">
            <li class="feature-item">
              <div class="feature-icon">
                <mat-icon style="font-size:18px;width:18px;height:18px;color:#fff">local_florist</mat-icon>
              </div>
              <span class="feature-text">1,000+ plant varieties curated by experts</span>
            </li>
            <li class="feature-item">
              <div class="feature-icon">
                <mat-icon style="font-size:18px;width:18px;height:18px;color:#fff">local_shipping</mat-icon>
              </div>
              <span class="feature-text">Safe, eco-friendly packaging & fast delivery</span>
            </li>
            <li class="feature-item">
              <div class="feature-icon">
                <mat-icon style="font-size:18px;width:18px;height:18px;color:#fff">support_agent</mat-icon>
              </div>
              <span class="feature-text">Plant care experts available 7 days a week</span>
            </li>
          </ul>
        </div>

        <div class="panel-footer">
          <div class="testimonial">
            <p>"My balcony looks like a jungle now — in the best way! The plants arrived perfectly packed and the care guide was super helpful."</p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">P</div>
              <div>
                <div class="testimonial-name">Priya Menon</div>
                <div class="testimonial-role">Plant parent · Mumbai</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Right form panel ──────────────────── -->
      <div class="right-panel">

        <button class="theme-btn" (click)="theme.toggle()" aria-label="Toggle theme">
          <mat-icon style="font-size:18px;width:18px;height:18px">
            {{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}
          </mat-icon>
        </button>

        <div class="mobile-logo">
          <lg-logo size="34px"></lg-logo>
        </div>

        <div class="form-card">
          <router-outlet></router-outlet>
        </div>

        <a routerLink="/" class="back-home">
          <mat-icon style="font-size:14px;width:14px;height:14px">arrow_back</mat-icon>
          Back to homepage
        </a>
      </div>
    </div>

    <lg-toast-container></lg-toast-container>
  `,
})
export class AuthLayoutComponent {
  readonly theme = inject(ThemeService);
}

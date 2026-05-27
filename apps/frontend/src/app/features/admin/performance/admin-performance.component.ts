import {
  ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WebVitalsService, VitalMetric } from '../../../core/services/web-vitals.service';
import { HttpClient } from '@angular/common/http';

interface ServerVital { name: string; p75: number; avg: number; count: number; }

const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000], CLS: [0.1, 0.25], INP: [200, 500],
  FID: [100, 300],   TTFB: [800, 1800], FCP: [1800, 3000],
};

@Component({
  selector: 'lg-admin-performance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
<div class="perf-page">

  <div class="page-header">
    <div>
      <h1 class="page-title">Performance Center</h1>
      <p class="page-sub">Core Web Vitals, bundle health, and render metrics</p>
    </div>
    <button class="btn btn-outline" (click)="refresh()"><mat-icon>refresh</mat-icon> Refresh</button>
  </div>

  <!-- Current session vitals (live from this browser) -->
  <div class="section-card">
    <h3 class="section-title"><mat-icon>monitor</mat-icon> This Session (Live CWV)</h3>
    <div class="vitals-grid">
      @for (v of localVitals(); track v.name) {
        <div class="vital-card" [class]="ratingClass(v.name, v.value)">
          <div class="vital-label">{{ v.name }}</div>
          <div class="vital-value">{{ formatValue(v) }}</div>
          <div class="vital-rating" [class]="ratingClass(v.name, v.value)">{{ v.rating | titlecase }}</div>
          <div class="vital-unit">{{ v.unit }}</div>
        </div>
      }
      @if (localVitals().length === 0) {
        <p class="empty">Metrics are collected as you navigate — browse the storefront to populate data.</p>
      }
    </div>
  </div>

  <!-- Server-aggregated (p75 across all users) -->
  <div class="section-card">
    <h3 class="section-title"><mat-icon>group</mat-icon> Aggregated (All Users, p75)</h3>
    @if (serverLoading()) { <div class="loading-bar"></div> }
    <div class="vitals-grid">
      @for (v of serverVitals(); track v.name) {
        <div class="vital-card" [class]="serverRatingClass(v)">
          <div class="vital-label">{{ v.name }}</div>
          <div class="vital-value">{{ v.name === 'CLS' ? v.p75.toFixed(3) : v.p75 + 'ms' }}</div>
          <div class="vital-rating" [class]="serverRatingClass(v)">{{ serverRating(v) }}</div>
          <div class="vital-unit">{{ v.count }} samples · avg {{ v.name === 'CLS' ? v.avg.toFixed(3) : v.avg + 'ms' }}</div>
        </div>
      }
      @if (serverVitals().length === 0 && !serverLoading()) {
        <p class="empty">No aggregated data yet — data arrives via sendBeacon from user browsers.</p>
      }
    </div>
  </div>

  <!-- CWV guidance -->
  <div class="section-card">
    <h3 class="section-title"><mat-icon>lightbulb</mat-icon> CWV Targets (Google 2024)</h3>
    <div class="targets-grid">
      @for (t of targets; track t.name) {
        <div class="target-row">
          <span class="target-name">{{ t.name }}</span>
          <span class="target-good">✓ Good: {{ t.good }}</span>
          <span class="target-poor">✗ Poor: {{ t.poor }}</span>
          <span class="target-desc">{{ t.desc }}</span>
        </div>
      }
    </div>
  </div>

  <!-- Angular bundle tips -->
  <div class="section-card">
    <h3 class="section-title"><mat-icon>build_circle</mat-icon> Angular Performance Checklist</h3>
    <div class="checklist">
      @for (item of checklist; track item.title) {
        <div class="check-item" [class.done]="item.done">
          <mat-icon>{{ item.done ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
          <div>
            <div class="check-title">{{ item.title }}</div>
            <div class="check-desc">{{ item.desc }}</div>
          </div>
        </div>
      }
    </div>
  </div>

</div>
  `,
  styles: [`
    .perf-page { padding: 24px; max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; }
    .page-sub { color: var(--text-muted); font-size: .875rem; margin: 0; }

    .section-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.08); margin-bottom: 20px; }
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 600; margin: 0 0 16px; }
    .section-title mat-icon { color: var(--color-primary, #6366f1); }

    .vitals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
    .vital-card { border-radius: 10px; padding: 16px; text-align: center; border: 2px solid transparent; }
    .vital-card.good { background: #f0fdf4; border-color: #bbf7d0; }
    .vital-card.needs-improvement { background: #fffbeb; border-color: #fde68a; }
    .vital-card.poor { background: #fef2f2; border-color: #fecaca; }
    .vital-label { font-weight: 700; font-size: .875rem; }
    .vital-value { font-size: 1.5rem; font-weight: 800; margin: 6px 0; }
    .vital-unit { font-size: .7rem; color: var(--text-muted); }
    .vital-rating { font-size: .75rem; font-weight: 700; text-transform: uppercase; }
    .vital-rating.good { color: #16a34a; }
    .vital-rating.needs-improvement { color: #d97706; }
    .vital-rating.poor { color: #dc2626; }

    .empty { color: var(--text-muted); font-size: .875rem; }
    .loading-bar { height: 3px; background: linear-gradient(90deg, var(--color-primary,#6366f1) 0%, transparent 100%); border-radius: 2px; margin-bottom: 12px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

    .targets-grid { display: flex; flex-direction: column; gap: 8px; }
    .target-row { display: flex; align-items: center; gap: 16px; padding: 10px 12px; background: var(--bg-subtle, #f5f5f5); border-radius: 8px; font-size: .8125rem; flex-wrap: wrap; }
    .target-name { font-weight: 700; min-width: 50px; }
    .target-good { color: #16a34a; font-weight: 600; }
    .target-poor { color: #dc2626; font-weight: 600; }
    .target-desc { color: var(--text-muted); flex: 1; }

    .checklist { display: flex; flex-direction: column; gap: 12px; }
    .check-item { display: flex; gap: 12px; align-items: flex-start; padding: 12px; border-radius: 8px; border: 1px solid var(--border, #e5e7eb); }
    .check-item.done { background: #f0fdf4; border-color: #bbf7d0; }
    .check-item mat-icon { color: #d1d5db; flex-shrink: 0; }
    .check-item.done mat-icon { color: #16a34a; }
    .check-title { font-weight: 600; font-size: .875rem; }
    .check-desc { font-size: .8125rem; color: var(--text-muted); margin-top: 2px; }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; border: none; transition: all 150ms; }
    .btn-outline { background: #fff; color: var(--color-primary, #6366f1); border: 1.5px solid var(--color-primary, #6366f1); }
  `],
})
export class AdminPerformanceComponent implements OnInit {
  readonly #vitals = inject(WebVitalsService);
  readonly #http   = inject(HttpClient);

  readonly localVitals  = this.#vitals.metrics;
  readonly serverVitals = signal<ServerVital[]>([]);
  readonly serverLoading = signal(false);

  readonly targets = [
    { name: 'LCP',  good: '≤ 2.5s', poor: '> 4s',   desc: 'Largest Contentful Paint — perceived load speed' },
    { name: 'CLS',  good: '≤ 0.1',  poor: '> 0.25', desc: 'Cumulative Layout Shift — visual stability' },
    { name: 'INP',  good: '≤ 200ms',poor: '> 500ms', desc: 'Interaction to Next Paint — responsiveness (2024)' },
    { name: 'TTFB', good: '≤ 800ms',poor: '> 1.8s',  desc: 'Time to First Byte — server response' },
    { name: 'FCP',  good: '≤ 1.8s', poor: '> 3s',   desc: 'First Contentful Paint — initial render' },
  ];

  readonly checklist = [
    { title: 'Angular SSR enabled',          desc: 'Server-side rendering for fast initial load', done: true },
    { title: 'Service Worker (PWA)',          desc: 'ngsw-worker.js caches app shell and assets', done: true },
    { title: 'Route-level lazy loading',      desc: 'loadComponent/loadChildren in app.routes.ts', done: true },
    { title: 'Selective preloading',          desc: 'SelectivePreloadStrategy preloads data.preload routes', done: true },
    { title: 'OnPush change detection',       desc: 'All shared components use OnPush', done: true },
    { title: 'Lazy image loading',            desc: 'LazyImgDirective uses IntersectionObserver', done: true },
    { title: 'View Transitions API',          desc: 'withViewTransitions() in router config', done: true },
    { title: 'HTTP/2 push via Nginx',         desc: 'Nginx serves with gzip and 7-day asset cache', done: true },
    { title: 'Image optimization (WebP/AVIF)',desc: 'Use webp/avif formats for product images', done: false },
    { title: 'Critical CSS inlined',          desc: 'Inline above-fold CSS to eliminate render-blocking', done: false },
    { title: 'Font subsetting',              desc: 'Load only required Unicode ranges for fonts', done: false },
  ];

  ngOnInit(): void {
    this.#loadServerVitals();
  }

  refresh(): void {
    this.#loadServerVitals();
  }

  #loadServerVitals(): void {
    this.serverLoading.set(true);
    this.#http.get<any>('/api/v1/admin/seo/vitals').subscribe({
      next: r => { this.serverVitals.set(r.data ?? []); this.serverLoading.set(false); },
      error: () => this.serverLoading.set(false),
    });
  }

  ratingClass(name: string, value: number): string {
    const [good, poor] = THRESHOLDS[name] ?? [500, 1000];
    return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
  }

  serverRatingClass(v: ServerVital): string {
    return this.ratingClass(v.name, v.p75);
  }

  serverRating(v: ServerVital): string {
    const c = this.serverRatingClass(v);
    return c === 'good' ? 'Good' : c === 'needs-improvement' ? 'Needs Work' : 'Poor';
  }

  formatValue(v: VitalMetric): string {
    return v.unit === 'score' ? v.value.toFixed(3) : `${v.value}`;
  }
}

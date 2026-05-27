import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface VitalMetric {
  name:   'LCP' | 'CLS' | 'INP' | 'FID' | 'TTFB' | 'FCP';
  value:  number;
  rating: 'good' | 'needs-improvement' | 'poor';
  unit:   'ms' | 'score';
}

/** Thresholds per Google Core Web Vitals 2024 */
const THRESHOLDS: Record<VitalMetric['name'], [number, number]> = {
  LCP:  [2500, 4000],  // ms
  CLS:  [0.1,  0.25],  // score
  INP:  [200,  500],   // ms
  FID:  [100,  300],   // ms
  TTFB: [800,  1800],  // ms
  FCP:  [1800, 3000],  // ms
};

function rate(name: VitalMetric['name'], value: number): VitalMetric['rating'] {
  const [good, poor] = THRESHOLDS[name];
  return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
}

@Injectable({ providedIn: 'root' })
export class WebVitalsService {
  readonly #platformId = inject(PLATFORM_ID);

  readonly metrics = signal<VitalMetric[]>([]);

  constructor() {
    if (!isPlatformBrowser(this.#platformId)) return;
    this.#observe();
  }

  #observe(): void {
    // TTFB — from Navigation Timing
    this.#onLoad(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (nav) this.#record('TTFB', nav.responseStart - nav.requestStart, 'ms');
    });

    // FCP
    this.#observePaint('first-contentful-paint', 'FCP');

    // LCP
    this.#observeLcp();

    // CLS
    this.#observeCls();

    // INP (replaces FID in CWV 2024) — polyfill via event timing
    this.#observeInp();
  }

  #record(name: VitalMetric['name'], value: number, unit: VitalMetric['unit']): void {
    this.metrics.update(prev => {
      const next = prev.filter(m => m.name !== name);
      return [...next, { name, value: Math.round(value * 10) / 10, rating: rate(name, value), unit }];
    });
    // Beacon to analytics
    this.#beacon(name, value);
  }

  #onLoad(fn: () => void): void {
    if (document.readyState === 'complete') {
      fn();
    } else {
      window.addEventListener('load', fn, { once: true });
    }
  }

  #observePaint(paintName: string, metric: 'FCP'): void {
    try {
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === paintName) {
            this.#record(metric, entry.startTime, 'ms');
            obs.disconnect();
          }
        }
      });
      obs.observe({ type: 'paint', buffered: true });
    } catch { /* PerformanceObserver not supported */ }
  }

  #observeLcp(): void {
    try {
      let lcpValue = 0;
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          lcpValue = entry.startTime;
        }
      });
      obs.observe({ type: 'largest-contentful-paint', buffered: true });
      // Finalize on user interaction or visibility change
      const finalize = () => {
        if (lcpValue > 0) this.#record('LCP', lcpValue, 'ms');
        obs.disconnect();
      };
      ['click', 'keydown', 'scroll'].forEach(ev =>
        document.addEventListener(ev, finalize, { once: true, passive: true }),
      );
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') finalize();
      }, { once: true });
    } catch { /* not supported */ }
  }

  #observeCls(): void {
    try {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries: PerformanceEntry[] = [];

      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            const firstEntry = sessionEntries[0];
            const lastEntry  = sessionEntries[sessionEntries.length - 1];
            if (sessionEntries.length === 0
                || entry.startTime - lastEntry.startTime < 1000
                || entry.startTime - firstEntry.startTime < 5000) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }
            if (sessionValue > clsValue) clsValue = sessionValue;
          }
        }
      });
      obs.observe({ type: 'layout-shift', buffered: true });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.#record('CLS', clsValue, 'score');
          obs.disconnect();
        }
      }, { once: true });
    } catch { /* not supported */ }
  }

  #observeInp(): void {
    try {
      let maxInp = 0;
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          const duration = entry.processingEnd - entry.startTime;
          if (duration > maxInp) maxInp = duration;
        }
      });
      obs.observe({ type: 'event', buffered: true, durationThreshold: 16 } as any);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && maxInp > 0) {
          this.#record('INP', maxInp, 'ms');
          obs.disconnect();
        }
      }, { once: true });
    } catch { /* not supported */ }
  }

  #beacon(name: string, value: number): void {
    try {
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon('/api/v1/analytics/vitals', JSON.stringify({
          name, value, url: location.href, ts: Date.now(),
        }));
      }
    } catch { /* silent */ }
  }

  /** Snapshot for admin performance panel */
  getSnapshot(): VitalMetric[] {
    return this.metrics();
  }
}

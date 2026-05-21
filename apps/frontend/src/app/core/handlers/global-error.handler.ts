import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  readonly #toast  = inject(ToastService);
  readonly #zone   = inject(NgZone);

  handleError(error: unknown): void {
    const message = this.#extractMessage(error);

    // Always log to console in dev; in prod, send to monitoring
    if (!environment.production) {
      console.error('[GlobalErrorHandler]', error);
    } else {
      // In production, send to a monitoring endpoint (extend later with Sentry etc.)
      this.#reportToMonitoring(error);
    }

    // Show toast for unhandled runtime errors (not HTTP errors — those are handled by errorInterceptor)
    if (!this.#isHttpError(error)) {
      this.#zone.run(() => {
        this.#toast.error('Something went wrong', message);
      });
    }
  }

  #extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'An unexpected error occurred';
  }

  #isHttpError(error: unknown): boolean {
    return !!(error && typeof error === 'object' && 'status' in error);
  }

  #reportToMonitoring(error: unknown): void {
    // Placeholder: integrate Sentry / Datadog / custom endpoint here
    try {
      const payload = {
        message:   this.#extractMessage(error),
        stack:     error instanceof Error ? error.stack : undefined,
        url:       window.location.href,
        userAgent: navigator.userAgent,
        ts:        new Date().toISOString(),
      };
      // navigator.sendBeacon('/api/v1/monitoring/error', JSON.stringify(payload));
      console.error('[Monitoring]', payload);
    } catch { /* never throw from error handler */ }
  }
}

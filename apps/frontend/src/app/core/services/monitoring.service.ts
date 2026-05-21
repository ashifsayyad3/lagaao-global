import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface HealthCheck {
  status:  'ok' | 'degraded';
  ts:      string;
  env:     string;
  version: string;
  uptime:  number;
  checks:  Record<string, 'ok' | 'degraded' | 'down'>;
}

@Injectable({ providedIn: 'root' })
export class MonitoringService {
  readonly #http = inject(HttpClient);

  getHealth() {
    // Call without /api/v1 prefix — health is at root
    const base = environment.apiUrl.replace('/api/v1', '');
    return this.#http.get<HealthCheck>(`${base}/health`);
  }
}

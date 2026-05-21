import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

// Preload routes that have `data.preload: true` after a short delay.
// High-traffic pages (products, search) are preloaded; auth/admin are not.
@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload']) {
      // Small delay so initial bundle takes priority
      return timer(2000).pipe(mergeMap(() => load()));
    }
    return of(null);
  }
}

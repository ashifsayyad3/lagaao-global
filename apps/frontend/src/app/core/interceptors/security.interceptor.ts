import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Enforce API-only requests and add security request headers.
export const securityInterceptor: HttpInterceptorFn = (req, next) => {
  // Only attach security headers for calls to our own API
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const secured = req.clone({
    setHeaders: {
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control':    req.method === 'GET' ? 'no-cache' : 'no-store',
    },
  });

  return next(secured);
};

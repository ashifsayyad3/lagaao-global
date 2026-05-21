import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const msg = err.error?.message ?? err.message ?? 'An unexpected error occurred';

      if (err.status === 0) {
        toast.error('Network Error', 'Please check your connection');
      } else if (err.status >= 500) {
        toast.error('Server Error', msg);
      } else if (err.status === 422) {
        // Validation errors — let feature handle them
      } else if (err.status !== 401 && err.status !== 403) {
        toast.error('Error', msg);
      }

      return throwError(() => err);
    }),
  );
};

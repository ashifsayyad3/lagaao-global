import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const vendorGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.createUrlTree(['/auth/login']);

  const role = auth.user()?.role;
  if (role === 'vendor' || role === 'super_admin' || role === 'admin') return true;

  return router.createUrlTree(['/sell']);
};

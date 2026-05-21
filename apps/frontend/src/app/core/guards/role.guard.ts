import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(roles: string[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const user   = auth.user();

    if (!user) return router.createUrlTree(['/auth/login']);
    if (roles.includes(user.role)) return true;
    return router.createUrlTree(['/']);
  };
}

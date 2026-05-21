import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../shared/utils/jwt.util';
import { AppError } from './errorHandler.middleware';
import { isTokenBlocked } from './security.middleware';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401));
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);

    // Check token blocklist (covers force-logout / password change)
    const jti = `${payload.sub}:${payload.iat ?? 0}`;
    if (await isTokenBlocked(jti)) {
      next(new AppError('Token has been revoked', 401));
      return;
    }

    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}

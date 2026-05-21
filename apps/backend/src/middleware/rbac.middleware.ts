import { Request, Response, NextFunction } from 'express';
import { Role, ROLE_HIERARCHY } from '../shared/types/roles';
import { AppError } from './errorHandler.middleware';

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const userLevel    = ROLE_HIERARCHY[req.user.role];
    const requiredMin  = Math.min(...roles.map(r => ROLE_HIERARCHY[r]));

    if (userLevel < requiredMin) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
}

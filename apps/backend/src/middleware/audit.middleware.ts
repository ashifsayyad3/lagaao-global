import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function auditLog(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    logger.info('api_request', {
      method:   req.method,
      url:      req.originalUrl,
      status:   res.statusCode,
      ms:       Date.now() - start,
      userId:   req.user?.id,
      ip:       req.ip,
    });
  });

  next();
}

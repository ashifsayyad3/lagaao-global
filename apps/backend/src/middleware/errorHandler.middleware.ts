import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { fail } from '../shared/utils/response.util';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly errors?: unknown[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    fail(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    fail(res, 'Validation failed', 422, [(err as any).errors?.map((e: any) => e.message)]);
    return;
  }

  logger.error('Unhandled error', { err: err.message, stack: err.stack, url: req.url });
  fail(res, 'Internal server error', 500);
}

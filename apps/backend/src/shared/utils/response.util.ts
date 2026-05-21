import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?:   T;
  message?: string;
  errors?:  unknown[];
  meta?: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

export function ok<T>(res: Response, data: T, message?: string, status = 200): Response {
  return res.status(status).json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function created<T>(res: Response, data: T, message = 'Created'): Response {
  return ok(res, data, message, 201);
}

export function paginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
): Response {
  return res.status(200).json({
    success: true,
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  } satisfies ApiResponse<T[]>);
}

export function fail(res: Response, message: string, status = 400, errors?: unknown[]): Response {
  return res.status(status).json({ success: false, message, errors } satisfies ApiResponse);
}

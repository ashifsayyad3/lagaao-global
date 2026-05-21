import { Request } from 'express';

export interface PaginationOptions {
  page:   number;
  limit:  number;
  offset: number;
}

export function getPagination(req: Request, defaultLimit = 20): PaginationOptions {
  const page  = Math.max(1, parseInt(String(req.query['page']  ?? 1), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? defaultLimit), 10)));
  return { page, limit, offset: (page - 1) * limit };
}

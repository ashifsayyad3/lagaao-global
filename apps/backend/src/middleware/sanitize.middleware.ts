import { Request, Response, NextFunction } from 'express';

// Strip common XSS vectors from string values recursively.
// Runs before route handlers so stored data is always clean.
function sanitizeValue(val: unknown): unknown {
  if (typeof val === 'string') {
    return val
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(v)]),
    );
  }
  return val;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body)  req.body  = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query) as typeof req.query;
  next();
}

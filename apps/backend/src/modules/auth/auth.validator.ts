import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { fail } from '../../shared/utils/response.util';

// ─── Schemas ──────────────────────────────────────────────────

export const registerSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email(),
  phone:    z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number').optional(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must have uppercase, lowercase and a number',
  ),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must have uppercase, lowercase and a number',
  ),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must have uppercase, lowercase and a number',
  ),
});

// ─── Middleware factory ────────────────────────────────────────

export function validate<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      fail(res, 'Validation failed', 422,
        result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ok, created } from '../../shared/utils/response.util';
import { env } from '../../config/env';

const REFRESH_COOKIE = 'lg_refresh';

function cookieOptions(expiry: Date) {
  return {
    httpOnly:  true,
    secure:    env.NODE_ENV === 'production',
    sameSite:  'lax' as const,
    expires:   expiry,
    path:      '/api/v1/auth',
  };
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, phone } = req.body;
      const result = await authService.register(name, email, password, phone);
      created(res, result, 'Registration successful. Please verify your email with the OTP sent.');
    } catch (e) { next(e); }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const tokens = await authService.verifyOtp(email, otp);
      res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshTokenExpiry));
      ok(res, { accessToken: tokens.accessToken, user: tokens.user }, 'Email verified');
    } catch (e) { next(e); }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const tokens = await authService.login(
        email, password,
        req.ip,
        req.headers['user-agent'],
      );
      res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshTokenExpiry));
      ok(res, { accessToken: tokens.accessToken, user: tokens.user }, 'Login successful');
    } catch (e) { next(e); }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const raw = req.cookies?.[REFRESH_COOKIE];
      if (!raw) { res.status(401).json({ success: false, message: 'No refresh token' }); return; }

      const tokens = await authService.refresh(raw, req.ip, req.headers['user-agent']);
      res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshTokenExpiry));
      ok(res, { accessToken: tokens.accessToken, user: tokens.user });
    } catch (e) { next(e); }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const raw = req.cookies?.[REFRESH_COOKIE];
      if (raw) await authService.logout(raw);
      res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
      ok(res, null, 'Logged out');
    } catch (e) { next(e); }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email);
      ok(res, null, 'If that email exists, a reset link has been sent.');
    } catch (e) { next(e); }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      const email = req.body.email;
      await authService.resetPassword(email, token, password);
      ok(res, null, 'Password reset successful');
    } catch (e) { next(e); }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resendOtp(req.body.email);
      ok(res, null, 'OTP resent if email exists');
    } catch (e) { next(e); }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await (await import('../../models')).User.findByPk(req.user!.id);
      if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
      ok(res, user.toJSON());
    } catch (e) { next(e); }
  }
}

export const authController = new AuthController();

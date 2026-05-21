import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import { User, RefreshToken } from '../../models';
import {
  signAccessToken, signRefreshToken, hashToken, generateOtp
} from '../../shared/utils/jwt.util';
import { AppError } from '../../middleware/errorHandler.middleware';
import { Role } from '../../shared/types/roles';

const OTP_TTL      = 10 * 60;       // 10 minutes
const OTP_ATTEMPTS = 5;

export interface AuthTokens {
  accessToken:        string;
  refreshToken:       string;
  refreshTokenExpiry: Date;
  user:               Record<string, unknown>;
}

export class AuthService {
  // ─── Register ──────────────────────────────────────────────
  async register(
    name: string,
    email: string,
    password: string,
    phone?: string,
  ): Promise<{ userId: number; email: string }> {
    const exists = await User.findOne({ where: { email } });
    if (exists) throw new AppError('Email already registered', 409);

    const user = await User.create({
      name,
      email,
      phone:        phone ?? null,
      passwordHash: password,           // hashed by BeforeCreate hook
      role:         Role.CUSTOMER,
      isVerified:   false,
      isActive:     true,
    });

    await this.#sendOtp(email);
    return { userId: user.id, email };
  }

  // ─── Verify OTP ────────────────────────────────────────────
  async verifyOtp(email: string, otp: string): Promise<AuthTokens> {
    const key      = `otp:${email}`;
    const attKey   = `otp_attempts:${email}`;
    const attempts = parseInt(await redis.get(attKey) ?? '0', 10);

    if (attempts >= OTP_ATTEMPTS) {
      throw new AppError('Too many OTP attempts. Request a new OTP.', 429);
    }

    const stored = await redis.get(key);
    if (!stored || stored !== otp) {
      await redis.incr(attKey);
      await redis.expire(attKey, OTP_TTL);
      throw new AppError('Invalid or expired OTP', 400);
    }

    await redis.del(key);
    await redis.del(attKey);

    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    user.isVerified = true;
    user.lastLoginAt = new Date();
    await user.save();

    return this.#issueTokens(user);
  }

  // ─── Login ─────────────────────────────────────────────────
  async login(email: string, password: string, ip?: string, ua?: string): Promise<AuthTokens> {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError('Invalid credentials', 401);
    if (!user.isActive) throw new AppError('Account deactivated', 403);

    const valid = await user.comparePassword(password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    if (!user.isVerified) {
      await this.#sendOtp(email);
      throw new AppError('Email not verified. A new OTP has been sent.', 403);
    }

    user.lastLoginAt = new Date();
    await user.save();

    logger.info('user_login', { userId: user.id, ip });
    return this.#issueTokens(user, ip, ua);
  }

  // ─── Refresh Token ─────────────────────────────────────────
  async refresh(rawToken: string, ip?: string, ua?: string): Promise<AuthTokens> {
    const hash = hashToken(rawToken);
    const record = await RefreshToken.findOne({ where: { tokenHash: hash } });

    if (!record || record.isExpired()) {
      if (record) await record.destroy();
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.findByPk(record.userId);
    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);

    // Rotate: delete old, issue new
    await record.destroy();
    return this.#issueTokens(user, ip, ua);
  }

  // ─── Logout ────────────────────────────────────────────────
  async logout(rawToken: string): Promise<void> {
    const hash = hashToken(rawToken);
    await RefreshToken.destroy({ where: { tokenHash: hash } });
  }

  // ─── Forgot Password ───────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ where: { email } });
    if (!user) return; // Silent — don't reveal existence

    const token   = generateOtp() + generateOtp(); // 12-char token
    const key     = `reset_pw:${email}`;
    await redis.setEx(key, OTP_TTL, token);

    logger.info('password_reset_requested', { email });
    // In production: send email with token
    // await emailService.sendPasswordReset(email, token);
  }

  // ─── Reset Password ────────────────────────────────────────
  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    const key    = `reset_pw:${email}`;
    const stored = await redis.get(key);
    if (!stored || stored !== token) throw new AppError('Invalid or expired reset token', 400);

    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    user.passwordHash = newPassword;
    await user.save();
    await redis.del(key);

    // Invalidate all refresh tokens for this user
    await RefreshToken.destroy({ where: { userId: user.id } });
  }

  // ─── Resend OTP ────────────────────────────────────────────
  async resendOtp(email: string): Promise<void> {
    const user = await User.findOne({ where: { email } });
    if (!user) return;
    await this.#sendOtp(email);
  }

  // ─── Private helpers ───────────────────────────────────────
  async #sendOtp(email: string): Promise<void> {
    const otp = generateOtp();
    await redis.setEx(`otp:${email}`, OTP_TTL, otp);
    logger.info('otp_sent', { email, otp }); // Replace with real email in production
  }

  async #issueTokens(user: User, ip?: string, ua?: string): Promise<AuthTokens> {
    const accessToken = signAccessToken({
      sub:   user.id,
      email: user.email,
      role:  user.role,
    });

    const { raw, hash, expiry } = signRefreshToken();

    await RefreshToken.create({
      userId:     user.id,
      tokenHash:  hash,
      expiresAt:  expiry,
      ipAddress:  ip ?? null,
      userAgent:  ua ?? null,
    });

    return {
      accessToken,
      refreshToken:       raw,
      refreshTokenExpiry: expiry,
      user:               user.toJSON() as Record<string, unknown>,
    };
  }
}

export const authService = new AuthService();

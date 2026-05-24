import https from 'https';
import bcrypt from 'bcryptjs';
import { QueryTypes } from 'sequelize';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import { User, RefreshToken, sequelize } from '../../models';
import {
  signAccessToken, signRefreshToken, hashToken, generateOtp
} from '../../shared/utils/jwt.util';
import { AppError } from '../../middleware/errorHandler.middleware';
import { Role } from '../../shared/types/roles';

const OTP_TTL      = 10 * 60;       // 10 minutes (seconds)
const OTP_ATTEMPTS = 5;

// ── In-memory fallback when Redis is unavailable ──────────────
interface MemEntry { value: string; expiry: number; }
const memStore = new Map<string, MemEntry>();

async function kSet(key: string, value: string, ttlSec: number): Promise<void> {
  try {
    if (redis.isReady) { await redis.setEx(key, ttlSec, value); return; }
  } catch { /* fall through */ }
  memStore.set(key, { value, expiry: Date.now() + ttlSec * 1000 });
}

async function kGet(key: string): Promise<string | null> {
  try {
    if (redis.isReady) return await redis.get(key);
  } catch { /* fall through */ }
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) { memStore.delete(key); return null; }
  return entry.value;
}

async function kDel(...keys: string[]): Promise<void> {
  try {
    if (redis.isReady) { await redis.del(keys); return; }
  } catch { /* fall through */ }
  keys.forEach(k => memStore.delete(k));
}

async function kIncr(key: string): Promise<number> {
  try {
    if (redis.isReady) return await redis.incr(key);
  } catch { /* fall through */ }
  const entry = memStore.get(key);
  const cur = entry && Date.now() <= entry.expiry ? parseInt(entry.value, 10) : 0;
  const next = cur + 1;
  memStore.set(key, { value: String(next), expiry: Date.now() + OTP_TTL * 1000 });
  return next;
}

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
  ): Promise<{ userId: number; email: string; devOtp?: string }> {
    const exists = await User.findOne({ where: { email } });
    if (exists) throw new AppError('Email already registered', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      phone:        phone ?? null,
      passwordHash,
      role:         Role.CUSTOMER,
      isVerified:   false,
      isActive:     true,
    });

    const otp = await this.#sendOtp(email);
    const result: { userId: number; email: string; devOtp?: string } = { userId: user.id, email };
    if (env.NODE_ENV === 'development') result.devOtp = otp;
    return result;
  }

  // ─── Verify OTP ────────────────────────────────────────────
  async verifyOtp(email: string, otp: string): Promise<AuthTokens> {
    const key      = `otp:${email}`;
    const attKey   = `otp_attempts:${email}`;
    const attempts = parseInt((await kGet(attKey)) ?? '0', 10);

    if (attempts >= OTP_ATTEMPTS) {
      throw new AppError('Too many OTP attempts. Request a new OTP.', 429);
    }

    const stored = await kGet(key);
    if (!stored || stored !== otp) {
      await kIncr(attKey);
      throw new AppError('Invalid or expired OTP', 400);
    }

    await kDel(key, attKey);

    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    user.isVerified = true;
    user.lastLoginAt = new Date();
    await user.save();

    return this.#issueTokens(user);
  }

  // ─── Login ─────────────────────────────────────────────────
  async login(email: string, password: string, ip?: string, ua?: string): Promise<AuthTokens> {
    // Use raw query to bypass ORM column-mapping issues with underscored fields
    type RawUser = {
      id: number; name: string; email: string; phone: string | null;
      password_hash: string | null; role: string; avatar: string | null;
      is_verified: number; is_active: number; mfa_enabled: number;
      last_login_at: string | null;
    };
    const results = await sequelize.query<RawUser>(
      `SELECT id, name, email, phone, password_hash, role, avatar, is_verified, is_active, mfa_enabled, last_login_at
       FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
      { replacements: [email], type: QueryTypes.SELECT }
    );
    const raw = results[0];
    if (!raw) throw new AppError('Invalid credentials', 401);
    if (!raw.is_active) throw new AppError('Account deactivated', 403);

    const valid = raw.password_hash ? await bcrypt.compare(password, raw.password_hash) : false;
    if (!valid) throw new AppError('Invalid credentials', 401);

    if (!raw.is_verified) {
      await this.#sendOtp(email);
      throw new AppError('Email not verified. A new OTP has been sent.', 403);
    }

    const user = await User.findByPk(raw.id);
    if (!user) throw new AppError('Invalid credentials', 401);

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
    await kSet(key, token, OTP_TTL);

    logger.info('password_reset_requested', { email, devToken: env.NODE_ENV === 'development' ? token : undefined });
    // In production: send email with token
    // await emailService.sendPasswordReset(email, token);
  }

  // ─── Reset Password ────────────────────────────────────────
  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    const key    = `reset_pw:${email}`;
    const stored = await kGet(key);
    if (!stored || stored !== token) throw new AppError('Invalid or expired reset token', 400);

    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    await kDel(key);

    // Invalidate all refresh tokens for this user
    await RefreshToken.destroy({ where: { userId: user.id } });
  }

  // ─── Resend OTP ────────────────────────────────────────────
  async resendOtp(email: string): Promise<{ devOtp?: string }> {
    const user = await User.findOne({ where: { email } });
    if (!user) return {};
    const otp = await this.#sendOtp(email);
    return env.NODE_ENV === 'development' ? { devOtp: otp } : {};
  }

  // ─── Google OAuth ──────────────────────────────────────────
  getGoogleAuthUrl(redirectUri: string): string {
    if (!env.GOOGLE_CLIENT_ID) throw new AppError('Google login not configured', 501);
    const params = new URLSearchParams({
      client_id:     env.GOOGLE_CLIENT_ID,
      redirect_uri:  redirectUri,
      response_type: 'code',
      scope:         'openid email profile',
      access_type:   'offline',
      prompt:        'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async loginWithGoogle(code: string, redirectUri: string, ip?: string, ua?: string): Promise<AuthTokens> {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new AppError('Google login not configured', 501);
    }

    // Exchange code for tokens
    const tokenRes = await this.#fetchJson<{
      access_token: string; id_token: string; error?: string;
    }>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }).toString(),
    });

    if (tokenRes.error) throw new AppError('Google token exchange failed', 400);

    // Fetch Google profile
    const profile = await this.#fetchJson<{
      sub: string; email: string; name: string; picture: string; email_verified: boolean;
    }>(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    });

    if (!profile.email_verified) throw new AppError('Google email not verified', 400);

    let user = await User.findOne({ where: { email: profile.email } });
    if (!user) {
      const randomPw = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
      user = await User.create({
        name:         profile.name,
        email:        profile.email,
        phone:        null,
        passwordHash: randomPw,
        role:         Role.CUSTOMER,
        isVerified:   true,
        isActive:     true,
        avatar:       profile.picture,
      });
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    if (!user.isActive) throw new AppError('Account deactivated', 403);
    user.lastLoginAt = new Date();
    await user.save();

    logger.info('google_login', { userId: user.id, email: user.email, ip });
    return this.#issueTokens(user, ip, ua);
  }

  async #fetchJson<T>(url: string, options: { method?: string; headers?: Record<string,string>; body?: string } = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const reqOptions = {
        hostname: u.hostname,
        path:     u.pathname + u.search,
        method:   options.method ?? 'GET',
        headers:  options.headers ?? {},
      };
      const req = https.request(reqOptions, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON')); } });
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  // ─── Private helpers ───────────────────────────────────────
  async #sendOtp(email: string): Promise<string> {
    const otp = generateOtp();
    await kSet(`otp:${email}`, otp, OTP_TTL);
    logger.info('otp_sent', { email, otp }); // In production: send via email
    return otp;
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

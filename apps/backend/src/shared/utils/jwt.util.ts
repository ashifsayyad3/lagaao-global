import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { Role } from '../types/roles';

export interface AccessTokenPayload {
  sub:   number;
  email: string;
  role:  Role;
}

export interface TokenPair {
  accessToken:        string;
  refreshToken:       string;
  refreshTokenHash:   string;
  refreshTokenExpiry: Date;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt.sign as any)(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer:    'lagaao.com',
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt.verify as any)(token, env.JWT_SECRET, {
    issuer: 'lagaao.com',
  }) as AccessTokenPayload;
}

export function signRefreshToken(): { raw: string; hash: string; expiry: Date } {
  const raw   = crypto.randomBytes(64).toString('hex');
  const hash  = crypto.createHash('sha256').update(raw).digest('hex');
  const days  = parseInt(env.JWT_REFRESH_EXPIRES_IN.replace('d', ''), 10) || 7;
  const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return { raw, hash, expiry };
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

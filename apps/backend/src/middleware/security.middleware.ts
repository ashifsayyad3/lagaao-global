import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

// ─── Token blocklist (logout / force-expire) ──────────────────
const BLOCK_PREFIX = 'blocked_token:';
const BLOCK_TTL    = 15 * 60; // match access token lifetime

export async function blockToken(jti: string): Promise<void> {
  await redis.setEx(`${BLOCK_PREFIX}${jti}`, BLOCK_TTL, '1').catch(() => {});
}

export async function isTokenBlocked(jti: string): Promise<boolean> {
  const val = await redis.get(`${BLOCK_PREFIX}${jti}`).catch(() => null);
  return val === '1';
}

// ─── Suspicious IP tracker ────────────────────────────────────
const SUSPECT_PREFIX = 'suspect:';
const SUSPECT_LIMIT  = 50;   // failed requests per window
const SUSPECT_WINDOW = 60 * 15; // 15 min

export async function trackFailure(ip: string): Promise<boolean> {
  const key   = `${SUSPECT_PREFIX}${ip}`;
  const count = await redis.incr(key).catch(() => 0);
  if (count === 1) await redis.expire(key, SUSPECT_WINDOW).catch(() => {});
  if (count > SUSPECT_LIMIT) {
    logger.warn('Suspicious IP detected', { ip, failureCount: count });
    return true; // is suspicious
  }
  return false;
}

export async function resetFailures(ip: string): Promise<void> {
  await redis.del(`${SUSPECT_PREFIX}${ip}`).catch(() => {});
}

// ─── Suspicious activity middleware ───────────────────────────
export function suspiciousActivityGuard(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? 'unknown';

  // Track 4xx responses from this IP
  res.on('finish', () => {
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      trackFailure(ip).catch(() => {});
    }
  });

  next();
}

// ─── Security event logger ────────────────────────────────────
export function logSecurityEvent(
  event: string,
  req: Request,
  extra?: Record<string, unknown>,
): void {
  logger.warn('security_event', {
    event,
    ip:     req.ip,
    method: req.method,
    url:    req.originalUrl,
    userId: req.user?.id,
    ua:     req.headers['user-agent'],
    ...extra,
  });
}

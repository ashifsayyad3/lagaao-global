import { redis } from '../../config/redis';
import { logger } from '../../config/logger';

const DEFAULT_TTL = 60 * 5; // 5 minutes

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL,
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // Redis miss or error — fall through to fetcher
  }

  const data = await fetcher();

  try {
    await redis.setEx(key, ttl, JSON.stringify(data));
  } catch (e) {
    logger.warn('Cache write failed', { key, e });
  }

  return data;
}

export async function invalidate(...keys: string[]): Promise<void> {
  if (!keys.length) return;
  await redis.del(keys).catch(() => {});
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(keys);
  } catch { /* non-critical */ }
}

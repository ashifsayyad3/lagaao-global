import { createClient } from 'redis';
import { env } from './env';
import { logger } from './logger';

export const redis = createClient({
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    connectTimeout: 3000,
    reconnectStrategy: false,  // don't auto-reconnect
  },
  password: env.REDIS_PASS || undefined,
});

redis.on('error', () => {});  // suppress unhandled error events
redis.on('connect', () => logger.info(`Redis connected — ${env.REDIS_HOST}:${env.REDIS_PORT}`));

export async function connectRedis(): Promise<void> {
  try {
    await Promise.race([
      redis.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);
  } catch {
    logger.warn('Redis unavailable — caching disabled');
  }
}

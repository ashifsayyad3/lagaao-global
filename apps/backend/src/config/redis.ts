import { createClient } from 'redis';
import { env } from './env';
import { logger } from './logger';

export const redis = createClient({
  socket: { host: env.REDIS_HOST, port: env.REDIS_PORT },
  password: env.REDIS_PASS || undefined,
});

redis.on('error', (err) => logger.error('Redis error', { err }));
redis.on('connect', () => logger.info(`Redis connected — ${env.REDIS_HOST}:${env.REDIS_PORT}`));

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

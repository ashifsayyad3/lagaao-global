import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV:  z.enum(['development', 'production', 'test']).default('development'),
  PORT:      z.coerce.number().default(3000),
  FRONTEND_URL: z.string().default('http://localhost:4200'),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASS: z.string(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASS: z.string().optional(),

  JWT_SECRET:           z.string().min(32),
  JWT_EXPIRES_IN:       z.string().default('15m'),
  JWT_REFRESH_SECRET:   z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  SMTP_HOST:  z.string().optional(),
  SMTP_PORT:  z.coerce.number().default(587),
  SMTP_USER:  z.string().optional(),
  SMTP_PASS:  z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@lagaao.com'),

  OPENAI_API_KEY: z.string().optional(),

  ELASTIC_NODE:     z.string().default('http://localhost:9200'),
  ELASTIC_USERNAME: z.string().optional(),
  ELASTIC_PASSWORD: z.string().optional(),

  RAZORPAY_KEY_ID:     z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  GOOGLE_CLIENT_ID:     z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

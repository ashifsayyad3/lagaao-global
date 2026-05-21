import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env';
import { logger } from './config/logger';
import { connectDB } from './config/database';
import { connectRedis } from './config/redis';
import { errorHandler } from './middleware/errorHandler.middleware';
import { globalRateLimit } from './middleware/rateLimit.middleware';

// ─── Express App ──────────────────────────────────────────────
const app  = express();
const http = createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────
export const io = new SocketServer(http, {
  cors: { origin: env.FRONTEND_URL, credentials: true },
});

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => logger.debug(`Socket disconnected: ${socket.id}`));
});

// ─── Security & Middleware ────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(compression() as express.RequestHandler);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalRateLimit);

// ─── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), env: env.NODE_ENV });
});

// ─── API Routes (mounted per phase) ──────────────────────────
// Phase 2+: app.use('/api/v1/auth',    authRouter);
// Phase 3+: app.use('/api/v1/products', productRouter);

// ─── 404 ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error handler ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDB();
  await connectRedis();

  http.listen(env.PORT, () => {
    logger.info(`🚀 Lagaao API running on http://localhost:${env.PORT}`);
    logger.info(`   Environment: ${env.NODE_ENV}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', { err });
  process.exit(1);
});

export default app;

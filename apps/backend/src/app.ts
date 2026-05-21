import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env';
import { logger } from './config/logger';
import { connectDB } from './models';
import { connectRedis } from './config/redis';
import { connectES } from './config/elasticsearch';
import { errorHandler } from './middleware/errorHandler.middleware';
import { globalRateLimit } from './middleware/rateLimit.middleware';
import { auditLog } from './middleware/audit.middleware';
import authRoutes       from './modules/auth/auth.routes';
import usersRoutes      from './modules/users/users.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import brandsRoutes     from './modules/brands/brands.routes';
import productsRoutes   from './modules/products/products.routes';
import inventoryRoutes  from './modules/inventory/inventory.routes';
import searchRoutes     from './modules/search/search.routes';
import cartRoutes       from './modules/cart/cart.routes';
import couponRoutes     from './modules/coupon/coupon.routes';
import checkoutRoutes   from './modules/checkout/checkout.routes';
import ordersRoutes, { adminOrdersRouter } from './modules/orders/orders.routes';
import vendorPublicRoutes, { vendorRouter, adminVendorRouter } from './modules/vendor/vendor.routes';
import cmsRoutes, { adminCmsRouter } from './modules/cms/cms.routes';
import aiRoutes        from './modules/ai/ai.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

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
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(compression() as any);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(cookieParser() as any);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalRateLimit);
app.use(auditLog);

// ─── Health ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), env: env.NODE_ENV });
});

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/v1/auth',        authRoutes);
app.use('/api/v1/users',       usersRoutes);
app.use('/api/v1/categories',  categoriesRoutes);
app.use('/api/v1/brands',      brandsRoutes);
app.use('/api/v1/products',    productsRoutes);
app.use('/api/v1/inventory',   inventoryRoutes);
app.use('/api/v1/search',      searchRoutes);
app.use('/api/v1/cart',        cartRoutes);
app.use('/api/v1/coupons',     couponRoutes);
app.use('/api/v1/checkout',    checkoutRoutes);
app.use('/api/v1/orders',      ordersRoutes);
app.use('/api/v1/admin/orders',   adminOrdersRouter);
app.use('/api/v1/vendors',        vendorPublicRoutes);
app.use('/api/v1/vendor',         vendorRouter);
app.use('/api/v1/admin/vendors',  adminVendorRouter);
app.use('/api/v1/cms',            cmsRoutes);
app.use('/api/v1/admin/cms',      adminCmsRouter);
app.use('/api/v1/ai',             aiRoutes);
app.use('/api/v1/admin/analytics', analyticsRoutes);

// ─── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error handler ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDB();
  await connectRedis();
  await connectES();

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

import 'reflect-metadata';
import path    from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDB } from './models';
import { connectRedis, redis } from './config/redis';
import { connectES, esClient } from './config/elasticsearch';
import { errorHandler } from './middleware/errorHandler.middleware';
import { globalRateLimit } from './middleware/rateLimit.middleware';
import { auditLog } from './middleware/audit.middleware';
import { sanitizeInput } from './middleware/sanitize.middleware';
import { suspiciousActivityGuard } from './middleware/security.middleware';
import authRoutes            from './modules/auth/auth.routes';
import usersRoutes           from './modules/users/users.routes';
import categoriesRoutes      from './modules/categories/categories.routes';
import brandsRoutes          from './modules/brands/brands.routes';
import productsRoutes        from './modules/products/products.routes';
import inventoryRoutes       from './modules/inventory/inventory.routes';
import searchRoutes          from './modules/search/search.routes';
import cartRoutes            from './modules/cart/cart.routes';
import couponRoutes          from './modules/coupon/coupon.routes';
import checkoutRoutes        from './modules/checkout/checkout.routes';
import ordersRoutes, { adminOrdersRouter } from './modules/orders/orders.routes';
import vendorPublicRoutes, { vendorRouter, adminVendorRouter } from './modules/vendor/vendor.routes';
import cmsRoutes, { adminCmsRouter } from './modules/cms/cms.routes';
import aiRoutes              from './modules/ai/ai.routes';
import analyticsRoutes       from './modules/analytics/analytics.routes';
import emailAdminRoutes      from './modules/email/email.routes';
import notificationRoutes, { adminNotificationsRouter } from './modules/notifications/notification.routes';
import trackingRoutes        from './modules/tracking/tracking.routes';
import crmRoutes             from './modules/crm/crm.routes';
import { seoPublicRoutes, seoAdminRoutes } from './modules/seo/seo.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import uploadsRoutes  from './modules/uploads/uploads.routes';
import reviewsRoutes  from './modules/reviews/reviews.routes';
import { wishlistRoutes } from './modules/wishlist/wishlist.routes';
import { walletRoutes, adminWalletRouter } from './modules/wallet/wallet.routes';
import { returnsRoutes, adminReturnsRouter } from './modules/returns/returns.routes';
import { supportRoutes, adminSupportRouter } from './modules/support/support.routes';
import { invoiceRoutes } from './modules/invoice/invoice.routes';
import { shiprocketRoutes } from './modules/shiprocket/shiprocket.routes';
import { flashSalesRouter, adminFlashSalesRouter } from './modules/flash-sales/flash-sales.routes';
import { referralRoutes, adminReferralRouter }     from './modules/referral/referral.routes';
import { loyaltyRouter, adminLoyaltyRouter }       from './modules/loyalty/loyalty.routes';
import { recommendationsRouter }                   from './modules/recommendations/recommendations.routes';
import { adminFraudRouter }                        from './modules/fraud/fraud.routes';
import { affiliateRouter, adminAffiliateRouter }   from './modules/affiliate/affiliate.routes';

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

// ─── Security ─────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'"],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'"],
      fontSrc:     ["'self'", 'https:'],
      objectSrc:   ["'none'"],
      frameSrc:    ["'none'"],
      upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // needed for some image CDNs
  hsts: env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
}));
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(compression() as any);
// Capture raw body for Razorpay webhook HMAC verification
app.use((req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => {
  if (req.path === '/api/v1/payments/webhook') {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => { raw += chunk; });
    req.on('end', () => {
      (req as unknown as Record<string, string>)['rawBody'] = raw;
      next();
    });
  } else {
    next();
  }
});
app.use(express.json({ limit: '2mb' }));  // tightened from 10mb
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(cookieParser() as any);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalRateLimit);
app.use(sanitizeInput);
app.use(suspiciousActivityGuard);
app.use(auditLog);

// ─── Health ────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const checks: Record<string, 'ok' | 'degraded' | 'down'> = {};

  // MySQL
  try {
    const { sequelize } = await import('./models');
    await sequelize.authenticate();
    checks['mysql'] = 'ok';
  } catch { checks['mysql'] = 'down'; }

  // Redis
  try {
    await redis.ping();
    checks['redis'] = 'ok';
  } catch { checks['redis'] = 'degraded'; }

  // Elasticsearch
  checks['elasticsearch'] = esClient ? 'ok' : 'degraded';

  const allOk = Object.values(checks).every(v => v === 'ok');
  res.status(allOk ? 200 : 503).json({
    status:  allOk ? 'ok' : 'degraded',
    ts:      new Date().toISOString(),
    env:     env.NODE_ENV,
    version: process.env['npm_package_version'] ?? '1.0.0',
    uptime:  Math.floor(process.uptime()),
    checks,
  });
});

// ─── Swagger UI ───────────────────────────────────────────────
// Disable Helmet's CSP for /docs so Swagger assets load correctly
app.use('/docs', (_req, _res, next) => {
  _res.removeHeader('Content-Security-Policy');
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Lagaao API Docs',
  swaggerOptions: { persistAuthorization: true },
}));
app.get('/docs.json', (_req, res) => res.json(swaggerSpec));

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/v1/auth',            authRoutes);
app.use('/api/v1/users',           usersRoutes);
app.use('/api/v1/categories',      categoriesRoutes);
app.use('/api/v1/brands',          brandsRoutes);
app.use('/api/v1/products',        productsRoutes);
app.use('/api/v1/inventory',       inventoryRoutes);
app.use('/api/v1/search',          searchRoutes);
app.use('/api/v1/cart',            cartRoutes);
app.use('/api/v1/coupons',         couponRoutes);
app.use('/api/v1/checkout',        checkoutRoutes);
app.use('/api/v1/orders',          ordersRoutes);
app.use('/api/v1/admin/orders',    adminOrdersRouter);
app.use('/api/v1/vendors',         vendorPublicRoutes);
app.use('/api/v1/vendor',          vendorRouter);
app.use('/api/v1/admin/vendors',   adminVendorRouter);
app.use('/api/v1/cms',             cmsRoutes);
app.use('/api/v1/admin/cms',       adminCmsRouter);
app.use('/api/v1/ai',              aiRoutes);
app.use('/api/v1/admin/analytics',      analyticsRoutes);
app.use('/api/v1/admin/email',          emailAdminRoutes);
app.use('/api/v1/notifications',        notificationRoutes);
app.use('/api/v1/admin/notifications',  adminNotificationsRouter);
app.use('/api/v1/admin/tracking',       trackingRoutes);
app.use('/api/v1/admin/crm',            crmRoutes);
app.use('/api/v1',                      seoPublicRoutes);
app.use('/api/v1/admin/seo',            seoAdminRoutes);
app.use('/api/v1/payments',             paymentsRoutes);
app.use('/api/v1/admin/payments',       paymentsRoutes);
app.use('/api/v1/uploads',             uploadsRoutes);
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));
app.use('/api/v1',                     reviewsRoutes);
app.use('/api/v1/wishlist',            wishlistRoutes);
app.use('/api/v1/wallet',             walletRoutes);
app.use('/api/v1/admin/wallets',      adminWalletRouter);
app.use('/api/v1/returns',            returnsRoutes);
app.use('/api/v1/admin/returns',      adminReturnsRouter);
app.use('/api/v1/support',            supportRoutes);
app.use('/api/v1/admin/support',      adminSupportRouter);
app.use('/api/v1',                    invoiceRoutes);
app.use('/api/v1',                    shiprocketRoutes);
app.use('/api/v1/flash-sales',        flashSalesRouter);
app.use('/api/v1/admin/flash-sales',  adminFlashSalesRouter);
app.use('/api/v1/referrals',          referralRoutes);
app.use('/api/v1/admin/referrals',    adminReferralRouter);
app.use('/api/v1/loyalty',            loyaltyRouter);
app.use('/api/v1/admin/loyalty',      adminLoyaltyRouter);
app.use('/api/v1/recommendations',    recommendationsRouter);
app.use('/api/v1/admin/fraud',        adminFraudRouter);
app.use('/api/v1/affiliates',         affiliateRouter);
app.use('/api/v1/admin/affiliates',   adminAffiliateRouter);

// ─── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error handler ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  await connectDB();
  await connectRedis().catch((err) =>
    logger.warn('Redis unavailable — caching and sessions degraded', { err }),
  );
  await connectES();

  http.listen(env.PORT, () => {
    logger.info(`Lagaao API running on http://localhost:${env.PORT}`);
    logger.info(`  Environment: ${env.NODE_ENV}`);
  });
}

bootstrap().catch((err) => {
  logger.error('Bootstrap failed', { err });
  process.exit(1);
});

export default app;

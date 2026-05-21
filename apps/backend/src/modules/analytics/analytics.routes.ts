import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize as requireRole } from '../../middleware/rbac.middleware';
import { ok } from '../../shared/utils/response.util';
import * as analytics from './analytics.service';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await analytics.getSummary()); } catch (e) { next(e); }
});

router.get('/revenue-trend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Math.min(Number(req.query['days'] ?? 30), 90);
    ok(res, await analytics.getRevenueTrend(days));
  } catch (e) { next(e); }
});

router.get('/user-trend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Math.min(Number(req.query['days'] ?? 30), 90);
    ok(res, await analytics.getUserTrend(days));
  } catch (e) { next(e); }
});

router.get('/top-products', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await analytics.getTopProducts(Number(req.query['limit'] ?? 10))); } catch (e) { next(e); }
});

router.get('/top-vendors', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await analytics.getTopVendors(Number(req.query['limit'] ?? 10))); } catch (e) { next(e); }
});

router.get('/order-status', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await analytics.getOrderStatusBreakdown()); } catch (e) { next(e); }
});

router.get('/category-breakdown', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await analytics.getCategoryBreakdown()); } catch (e) { next(e); }
});

router.get('/recent-orders', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await analytics.getRecentOrders(Number(req.query['limit'] ?? 10))); } catch (e) { next(e); }
});

export default router;


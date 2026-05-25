import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize as requireRole } from '../../middleware/rbac.middleware';
import { ok } from '../../shared/utils/response.util';
import { Role } from '../../shared/types/roles';
import * as analytics from './analytics.service';

const router = Router();
router.use(authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN));

router.get('/summary', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await analytics.getSummary()); } catch (e) { next(e); }
});

router.get('/revenue-trend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Math.min(Number(req.query['days'] ?? 30), 90);
    const raw = await analytics.getRevenueTrend(days);
    // Normalize to { date, value } shape expected by admin dashboard
    ok(res, raw.map((r: any) => ({ date: r.date, value: r.revenue ?? r.value ?? 0 })));
  } catch (e) { next(e); }
});

router.get('/user-trend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = Math.min(Number(req.query['days'] ?? 30), 90);
    ok(res, await analytics.getUserTrend(days));
  } catch (e) { next(e); }
});

router.get('/top-products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = await analytics.getTopProducts(Number(req.query['limit'] ?? 10)) as any[];
    ok(res, raw.map(r => ({
      id: r.productId, name: r.name, slug: r.slug,
      sales: Number(r.unitsSold ?? 0), revenue: Number(r.revenue ?? 0),
    })));
  } catch (e) { next(e); }
});

router.get('/top-vendors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = await analytics.getTopVendors(Number(req.query['limit'] ?? 10)) as any[];
    ok(res, raw.map(r => ({
      id: r.vendorId, storeName: r.storeName, storeSlug: r.storeSlug,
      orders: Number(r.orderCount ?? 0), revenue: Number(r.revenue ?? 0),
    })));
  } catch (e) { next(e); }
});

router.get('/order-status', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await analytics.getOrderStatusBreakdown()); } catch (e) { next(e); }
});

router.get('/category-breakdown', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = await analytics.getCategoryBreakdown() as any[];
    ok(res, raw.map(r => ({
      category: r.categoryName ?? r.category,
      count: Number(r.units ?? r.count ?? 0),
      revenue: Number(r.revenue ?? 0),
    })));
  } catch (e) { next(e); }
});

router.get('/recent-orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = await analytics.getRecentOrders(Number(req.query['limit'] ?? 10)) as any[];
    ok(res, raw.map(r => ({
      id: r.id, orderNumber: r.orderNumber, status: r.status,
      total: Number(r.total ?? 0), createdAt: r.createdAt,
      customerName: r.user?.name ?? null,
    })));
  } catch (e) { next(e); }
});

export default router;


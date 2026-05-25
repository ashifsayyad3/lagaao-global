import { Router, Request, Response, NextFunction } from 'express';
import { vendorService } from './vendor.service';
import { ok, created, paginated } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { getPagination } from '../../shared/utils/paginate.util';
import { Role } from '../../shared/types/roles';

const router = Router();

// ─── Public routes ────────────────────────────────────────────
// GET /api/v1/vendors  — list active stores
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await vendorService.listStores(req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

// GET /api/v1/vendors/:storeSlug  — public store page
router.get('/:storeSlug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await vendorService.getStore(req.params['storeSlug']!));
  } catch (err) { next(err); }
});

// ─── Vendor routes (require vendor/admin role) ────────────────
const vendorRouter = Router();
vendorRouter.use(authenticate, authorize(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN));

// POST /api/v1/vendor/apply  — vendor onboarding
vendorRouter.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    created(res, await vendorService.apply(req.user!.id, req.body), 'Application submitted');
  } catch (err) { next(err); }
});

// GET /api/v1/vendor/profile
vendorRouter.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await vendorService.getMyProfile(req.user!.id));
  } catch (err) { next(err); }
});

// PATCH /api/v1/vendor/profile
vendorRouter.patch('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await vendorService.updateProfile(req.user!.id, req.body));
  } catch (err) { next(err); }
});

// GET /api/v1/vendor/dashboard
vendorRouter.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await vendorService.getDashboardStats(req.user!.id));
  } catch (err) { next(err); }
});

// GET /api/v1/vendor/products
vendorRouter.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await vendorService.getVendorProducts(req.user!.id, req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

// GET /api/v1/vendor/orders
vendorRouter.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await vendorService.getVendorOrders(req.user!.id, req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

// GET /api/v1/vendor/orders/:id
vendorRouter.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await vendorService.getOrderDetail(req.user!.id, Number(req.params['id'])));
  } catch (err) { next(err); }
});

// PATCH /api/v1/vendor/orders/:id/tracking
vendorRouter.patch('/orders/:id/tracking', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await vendorService.addOrderTracking(req.user!.id, Number(req.params['id']), req.body));
  } catch (err) { next(err); }
});

// PATCH /api/v1/vendor/orders/items/:itemId/status
vendorRouter.patch('/orders/items/:itemId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, note } = req.body as { status: string; note?: string };
    ok(res, await vendorService.updateOrderItemStatus(req.user!.id, Number(req.params['itemId']), status as any, note));
  } catch (err) { next(err); }
});

// ─── Payments & Earnings ──────────────────────────────────────
// GET /api/v1/vendor/payments/overview
vendorRouter.get('/payments/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await vendorService.getEarningsOverview(req.user!.id));
  } catch (err) { next(err); }
});

// GET /api/v1/vendor/payments/transactions
vendorRouter.get('/payments/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await vendorService.getTransactions(req.user!.id, req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

// GET /api/v1/vendor/payments/payouts
vendorRouter.get('/payments/payouts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await vendorService.getPayouts(req.user!.id, req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

// POST /api/v1/vendor/payments/payout-request
vendorRouter.post('/payments/payout-request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body as { amount: number };
    created(res, await vendorService.requestPayout(req.user!.id, amount), 'Payout request submitted');
  } catch (err) { next(err); }
});

// ─── Analytics ────────────────────────────────────────────────
vendorRouter.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await vendorService.getAnalytics(req.user!.id)); }
  catch (err) { next(err); }
});

// ─── Inventory ────────────────────────────────────────────────
vendorRouter.get('/inventory', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 30);
    const { rows, count } = await vendorService.getVendorInventory(req.user!.id, req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

vendorRouter.post('/inventory/:variantId/adjust', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, qtyChange, note } = req.body;
    ok(res, await vendorService.adjustInventory(req.user!.id, Number(req.params['variantId']), type, qtyChange, note), 'Inventory adjusted');
  } catch (err) { next(err); }
});

vendorRouter.patch('/inventory/:variantId/threshold', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { threshold } = req.body as { threshold: number };
    ok(res, await vendorService.setLowStockThreshold(req.user!.id, Number(req.params['variantId']), threshold));
  } catch (err) { next(err); }
});

vendorRouter.get('/inventory/low-stock', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await vendorService.getVendorLowStock(req.user!.id)); }
  catch (err) { next(err); }
});

// ─── Customers ────────────────────────────────────────────────
vendorRouter.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await vendorService.getVendorCustomers(req.user!.id, req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

// ─── Coupons ──────────────────────────────────────────────────
vendorRouter.get('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await vendorService.getVendorCoupons(req.user!.id, req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

vendorRouter.post('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await vendorService.createVendorCoupon(req.user!.id, req.body), 'Coupon created'); }
  catch (err) { next(err); }
});

vendorRouter.patch('/coupons/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await vendorService.toggleVendorCoupon(req.user!.id, Number(req.params['id']))); }
  catch (err) { next(err); }
});

vendorRouter.delete('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { await vendorService.deleteVendorCoupon(req.user!.id, Number(req.params['id'])); ok(res, null, 'Coupon deleted'); }
  catch (err) { next(err); }
});

// ─── Reviews (product stats) ──────────────────────────────────
vendorRouter.get('/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await vendorService.getVendorProductStats(req.user!.id, req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

// ─── Product CRUD ─────────────────────────────────────────────
vendorRouter.post('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    created(res, await vendorService.createProduct(req.user!.id, req.body), 'Product created');
  } catch (err) { next(err); }
});

vendorRouter.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await vendorService.getProduct(req.user!.id, Number(req.params['id'])));
  } catch (err) { next(err); }
});

vendorRouter.patch('/products/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body as { status: 'draft' | 'active' | 'inactive' | 'archived' };
    ok(res, await vendorService.updateProductStatus(req.user!.id, Number(req.params['id']), status));
  } catch (err) { next(err); }
});

vendorRouter.patch('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await vendorService.updateProduct(req.user!.id, Number(req.params['id']), req.body));
  } catch (err) { next(err); }
});

vendorRouter.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await vendorService.deleteProduct(req.user!.id, Number(req.params['id']));
    ok(res, null, 'Product archived');
  } catch (err) { next(err); }
});

// ─── Admin vendor management ──────────────────────────────────
const adminVendorRouter = Router();
adminVendorRouter.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN));

// GET /api/v1/admin/vendors
adminVendorRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await vendorService.adminList(req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/vendors/:id/status
adminVendorRouter.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body as { status: 'active' | 'rejected' | 'suspended' };
    ok(res, await vendorService.adminApprove(Number(req.params['id']), status));
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/vendors/:id/commission
adminVendorRouter.patch('/:id/commission', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { commissionRate } = req.body as { commissionRate: number };
    ok(res, await vendorService.adminUpdateCommission(Number(req.params['id']), commissionRate));
  } catch (err) { next(err); }
});

export { vendorRouter, adminVendorRouter };
export default router;

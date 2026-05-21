import { Router, Request, Response, NextFunction } from 'express';
import { vendorService } from './vendor.service';
import { ok, created, paginated } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { getPagination } from '../../shared/utils/paginate.util';

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
vendorRouter.use(authenticate, authorize('vendor', 'admin', 'super_admin'));

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

// ─── Admin vendor management ──────────────────────────────────
const adminVendorRouter = Router();
adminVendorRouter.use(authenticate, authorize('admin', 'super_admin'));

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

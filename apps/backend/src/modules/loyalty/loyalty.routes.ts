import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize }    from '../../middleware/rbac.middleware';
import { Role }         from '../../shared/types/roles';
import { loyaltyService } from './loyalty.service';
import { ok, paginated }  from '../../shared/utils/response.util';
import { getPagination }  from '../../shared/utils/paginate.util';

const router = Router();
router.use(authenticate);

/** GET /api/v1/loyalty/me — balance + paginated history */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const [balance, { rows, count }] = await Promise.all([
      loyaltyService.getBalance(req.user!.id),
      loyaltyService.getHistory(req.user!.id, page, limit),
    ]);
    ok(res, { balance, history: rows, total: count, page, limit });
  } catch (e) { next(e); }
});

/** POST /api/v1/loyalty/redeem — called from checkout to lock in redemption */
router.post('/redeem', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { points, orderId } = req.body as { points: number; orderId: number };
    const discount = await loyaltyService.redeem(req.user!.id, points, orderId);
    ok(res, { discount, pointsUsed: points });
  } catch (e) { next(e); }
});

// ── Admin ────────────────────────────────────────────────────────────────────
const admin = Router();
admin.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN));

/** GET /api/v1/admin/loyalty */
admin.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await loyaltyService.adminList(page, limit);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

/** POST /api/v1/admin/loyalty/adjust */
admin.post('/adjust', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, points, description } = req.body as { userId: number; points: number; description: string };
    await loyaltyService.adjust(userId, points, description);
    ok(res, { message: 'Balance adjusted' });
  } catch (e) { next(e); }
});

/** POST /api/v1/admin/loyalty/expire — manual trigger */
admin.post('/expire', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expired = await loyaltyService.expire();
    ok(res, { expired });
  } catch (e) { next(e); }
});

export { router as loyaltyRouter, admin as adminLoyaltyRouter };

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize }    from '../../middleware/rbac.middleware';
import { Role }         from '../../shared/types/roles';
import { affiliateService } from './affiliate.service';
import { ok, created, paginated } from '../../shared/utils/response.util';
import { getPagination }          from '../../shared/utils/paginate.util';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/affiliates/track/:code
 * Records a click, sets an httpOnly cookie, then redirects to frontend.
 */
router.get('/track/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code     = req.params['code']!;
    const ip       = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip;
    const referrer = req.headers['referer'] ?? req.query['ref'] as string ?? '';
    const ua       = req.headers['user-agent'] ?? '';

    const aff = await affiliateService.trackClick(code, ip, referrer, ua);

    if (aff) {
      // 30-day cookie so the conversion can be recorded at checkout
      res.cookie('aff_code', code, {
        maxAge:   30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure:   process.env['NODE_ENV'] === 'production',
      });
    }

    const dest = req.query['to'] as string ?? process.env['FRONTEND_URL'] ?? 'https://lagaao.com';
    res.redirect(302, dest);
  } catch (e) { next(e); }
});

// ── Authenticated user ────────────────────────────────────────────────────────

router.use(authenticate);

/** POST /api/v1/affiliates/apply */
router.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aff = await affiliateService.apply(req.user!.id);
    created(res, aff, 'Affiliate application submitted');
  } catch (e) { next(e); }
});

/** GET /api/v1/affiliates/me */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await affiliateService.getMyStats(req.user!.id));
  } catch (e) { next(e); }
});

// ── Admin ─────────────────────────────────────────────────────────────────────

const admin = Router();
admin.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN));

/** GET /api/v1/admin/affiliates */
admin.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await affiliateService.adminList(page, limit);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

/** PATCH /api/v1/admin/affiliates/:id */
admin.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, commissionRate, notes } = req.body;
    const aff = await affiliateService.updateStatus(
      parseInt(req.params['id']!, 10), status, commissionRate, notes
    );
    ok(res, aff);
  } catch (e) { next(e); }
});

/** GET /api/v1/admin/affiliates/conversions */
admin.get('/conversions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await affiliateService.getPendingConversions(page, limit);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

/** POST /api/v1/admin/affiliates/conversions/approve — batch approve delivered */
admin.post('/conversions/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const approved = await affiliateService.approveConversions();
    ok(res, { approved });
  } catch (e) { next(e); }
});

/** POST /api/v1/admin/affiliates/:id/payout */
admin.post('/:id/payout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const total = await affiliateService.markPaid(parseInt(req.params['id']!, 10));
    ok(res, { paid: total });
  } catch (e) { next(e); }
});

export { router as affiliateRouter, admin as adminAffiliateRouter };

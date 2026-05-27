import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize }    from '../../middleware/rbac.middleware';
import { Role }         from '../../shared/types/roles';
import { referralService } from './referral.service';
import { ok, paginated }   from '../../shared/utils/response.util';
import { getPagination }   from '../../shared/utils/paginate.util';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────────

/** GET /api/v1/referrals/r/:code — redirect to frontend registration with code */
router.get('/r/:code', (req: Request, res: Response) => {
  const { FRONTEND_URL } = process.env;
  res.redirect(302, `${FRONTEND_URL ?? 'http://localhost:4200'}/auth/register?ref=${req.params['code']}`);
});

/** GET /api/v1/referrals/validate/:code — check if code is valid */
router.get('/validate/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const valid = await referralService.validateCode(req.params['code']!);
    res.json({ success: true, data: { valid } });
  } catch (e) { next(e); }
});

// ── Authenticated ────────────────────────────────────────────────────────────

router.use(authenticate);

/** GET /api/v1/referrals/me — my stats + referral list */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await referralService.getStats(req.user!.id)); }
  catch (e) { next(e); }
});

/** POST /api/v1/referrals/generate — get or create my referral code */
router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = await referralService.generateCode(req.user!.id);
    ok(res, { code, referralUrl: `https://lagaao.com/ref/${code}` });
  } catch (e) { next(e); }
});

// ── Admin ────────────────────────────────────────────────────────────────────

const admin = Router();
admin.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN));

/** GET /api/v1/admin/referrals */
admin.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await referralService.adminList(page, limit);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

export { router as referralRoutes, admin as adminReferralRouter };

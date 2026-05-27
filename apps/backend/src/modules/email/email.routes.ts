import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize }    from '../../middleware/rbac.middleware';
import { ok, paginated } from '../../shared/utils/response.util';
import { Role }          from '../../shared/types/roles';
import { emailService }  from './email.service';

const router = Router();
router.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN));

// GET /api/v1/admin/email/logs
router.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { count, rows, page, limit } = await emailService.getLogs(req);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

// GET /api/v1/admin/email/stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await emailService.getStats()); } catch (e) { next(e); }
});

// POST /api/v1/admin/email/retry/:id
router.post('/retry/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const log = await emailService.retryFailed(Number(req.params['id']));
    ok(res, log, 'Email retry queued');
  } catch (e) { next(e); }
});

export default router;

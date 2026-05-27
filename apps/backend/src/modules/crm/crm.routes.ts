import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize }    from '../../middleware/rbac.middleware';
import { ok, paginated } from '../../shared/utils/response.util';
import { Role }        from '../../shared/types/roles';
import { crmService }  from './crm.service';

const router = Router();
router.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN));

// GET /api/v1/admin/crm/customers
router.get('/customers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { count, rows, page, limit } = await crmService.getCustomers(req);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

// GET /api/v1/admin/crm/customers/:id
router.get('/customers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await crmService.getCustomerDetail(Number(req.params['id'])));
  } catch (e) { next(e); }
});

// GET /api/v1/admin/crm/segments
router.get('/segments', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await crmService.getSegmentCounts()); } catch (e) { next(e); }
});

// GET /api/v1/admin/crm/activity
router.get('/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { count, rows, page, limit } = await crmService.getActivityLogs(req);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

export default router;

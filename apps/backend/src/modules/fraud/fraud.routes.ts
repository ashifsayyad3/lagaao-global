import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize }    from '../../middleware/rbac.middleware';
import { Role }         from '../../shared/types/roles';
import { fraudService } from './fraud.service';
import { ok, paginated } from '../../shared/utils/response.util';
import { getPagination } from '../../shared/utils/paginate.util';

const router = Router();
router.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN));

/** GET /api/v1/admin/fraud — fraud queue */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await fraudService.getFraudQueue(page, limit);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

/** POST /api/v1/admin/fraud/:id/approve */
router.post('/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fraudService.approveOrder(parseInt(req.params['id']!, 10));
    ok(res, { message: 'Order approved' });
  } catch (e) { next(e); }
});

/** POST /api/v1/admin/fraud/:id/reject */
router.post('/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fraudService.rejectOrder(parseInt(req.params['id']!, 10));
    ok(res, { message: 'Order rejected' });
  } catch (e) { next(e); }
});

export { router as adminFraudRouter };

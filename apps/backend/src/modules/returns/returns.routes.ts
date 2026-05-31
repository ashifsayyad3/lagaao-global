import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { Role } from '../../shared/types/roles';
import { returnsService } from './returns.service';
import { ok, created } from '../../shared/utils/response.util';

const router = Router();

/** POST /api/v1/returns — create return request */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await returnsService.create(req.user!.id, req.body);
    res.status(201).json(created(r, 'Return request submitted'));
  } catch (e) { next(e); }
});

/** GET /api/v1/returns — list my returns */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await returnsService.listForUser(req.user!.id, req);
    res.json(ok(result));
  } catch (e) { next(e); }
});

/** GET /api/v1/returns/:id — get single return */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await returnsService.getOne(Number(req.params['id']), req.user!.id);
    res.json(ok(r));
  } catch (e) { next(e); }
});

export { router as returnsRoutes };

// ── Admin routes ──────────────────────────────────────────────
const adminRouter = Router();

/** GET /api/v1/admin/returns */
adminRouter.get('/', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await returnsService.adminList(req);
      res.json(ok(result));
    } catch (e) { next(e); }
  });

/** PATCH /api/v1/admin/returns/:id */
adminRouter.patch('/:id', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const r = await returnsService.adminUpdate(Number(req.params['id']), req.user!.id, req.body);
      res.json(ok(r, 'Return request updated'));
    } catch (e) { next(e); }
  });

export { adminRouter as adminReturnsRouter };

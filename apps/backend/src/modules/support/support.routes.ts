import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { Role } from '../../shared/types/roles';
import { supportService } from './support.service';
import { ok, created } from '../../shared/utils/response.util';

// ── Customer routes ───────────────────────────────────────────
const router = Router();

/** POST /api/v1/support — open ticket */
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await supportService.create(req.user!.id, req.body);
    res.status(201).json(created(ticket, 'Ticket created'));
  } catch (e) { next(e); }
});

/** GET /api/v1/support — list my tickets */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await supportService.listForUser(req.user!.id, req);
    res.json(ok(result));
  } catch (e) { next(e); }
});

/** GET /api/v1/support/:id — get ticket with messages */
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await supportService.getOne(Number(req.params['id']), req.user!.id, false);
    res.json(ok(ticket));
  } catch (e) { next(e); }
});

/** POST /api/v1/support/:id/messages — reply */
router.post('/:id/messages', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const msg = await supportService.addMessage(
      Number(req.params['id']), req.user!.id, false, req.body,
    );
    res.status(201).json(created(msg, 'Message sent'));
  } catch (e) { next(e); }
});

export { router as supportRoutes };

// ── Admin routes ──────────────────────────────────────────────
const adminRouter = Router();

/** GET /api/v1/admin/support */
adminRouter.get('/', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await supportService.adminList(req);
      res.json(ok(result));
    } catch (e) { next(e); }
  });

/** GET /api/v1/admin/support/:id */
adminRouter.get('/:id', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticket = await supportService.getOne(Number(req.params['id']), 0, true);
      res.json(ok(ticket));
    } catch (e) { next(e); }
  });

/** PATCH /api/v1/admin/support/:id */
adminRouter.patch('/:id', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticket = await supportService.adminUpdate(Number(req.params['id']), req.body);
      res.json(ok(ticket, 'Ticket updated'));
    } catch (e) { next(e); }
  });

/** POST /api/v1/admin/support/:id/messages */
adminRouter.post('/:id/messages', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const msg = await supportService.addMessage(
        Number(req.params['id']), req.user!.id, true, req.body,
      );
      res.status(201).json(created(msg, 'Reply sent'));
    } catch (e) { next(e); }
  });

export { adminRouter as adminSupportRouter };

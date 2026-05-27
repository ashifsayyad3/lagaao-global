import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { Role } from '../../shared/types/roles';
import { flashSalesService } from './flash-sales.service';
import { ok, created } from '../../shared/utils/response.util';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────────

/** GET /api/v1/flash-sales  — active sales with items */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await flashSalesService.getActive() }); }
  catch (e) { next(e); }
});

// ── Admin ────────────────────────────────────────────────────────────────────

const admin = Router();
admin.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN));

/** GET /api/v1/admin/flash-sales */
admin.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await flashSalesService.adminList() }); }
  catch (e) { next(e); }
});

/** GET /api/v1/admin/flash-sales/:id */
admin.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await flashSalesService.adminGet(Number(req.params['id']))); }
  catch (e) { next(e); }
});

/** POST /api/v1/admin/flash-sales */
admin.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await flashSalesService.create(req.body), 'Flash sale created'); }
  catch (e) { next(e); }
});

/** PATCH /api/v1/admin/flash-sales/:id */
admin.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await flashSalesService.update(Number(req.params['id']), req.body)); }
  catch (e) { next(e); }
});

/** DELETE /api/v1/admin/flash-sales/:id */
admin.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { await flashSalesService.remove(Number(req.params['id'])); ok(res, null, 'Deleted'); }
  catch (e) { next(e); }
});

/** POST /api/v1/admin/flash-sales/:id/items */
admin.post('/:id/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await flashSalesService.addItem(Number(req.params['id']), req.body);
    created(res, item, 'Item added');
  }
  catch (e) { next(e); }
});

/** DELETE /api/v1/admin/flash-sales/:id/items/:itemId */
admin.delete('/:id/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await flashSalesService.removeItem(Number(req.params['id']), Number(req.params['itemId']));
    ok(res, null, 'Item removed');
  }
  catch (e) { next(e); }
});

export { router as flashSalesRouter, admin as adminFlashSalesRouter };

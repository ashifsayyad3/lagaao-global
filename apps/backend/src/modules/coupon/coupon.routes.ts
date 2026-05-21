import { Router, Request, Response, NextFunction } from 'express';
import { couponService } from './coupon.service';
import { ok, created } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';

const router = Router();

router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotal } = req.body as { code: string; subtotal: number };
    if (!code || subtotal === undefined) { res.status(400).json({ success: false, message: 'code and subtotal required' }); return; }
    const result = await couponService.validate(code, subtotal);
    ok(res, result);
  } catch (err) { next(err); }
});

router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await couponService.list()); } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await couponService.create(req.body)); } catch (err) { next(err); }
});

router.patch('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await couponService.toggle(Number(req.params['id']), req.body.isActive);
    ok(res, { message: 'Updated' });
  } catch (err) { next(err); }
});

export default router;

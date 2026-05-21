import { Router, Request, Response, NextFunction } from 'express';
import { couponService } from './coupon.service';
import { ok } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';

const router = Router();

// POST /api/v1/coupons/validate  { code, subtotal }
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotal } = req.body as { code: string; subtotal: number };
    if (!code || subtotal === undefined) {
      res.status(400).json({ success: false, message: 'code and subtotal required' }); return;
    }
    const result = await couponService.validate(code, subtotal);
    res.json(ok(result));
  } catch (err) { next(err); }
});

// Admin-only routes
router.use(authenticate, authorize('admin', 'super_admin'));

// GET /api/v1/coupons
router.get('/', async (_req, res, next) => {
  try {
    const list = await couponService.list();
    res.json(ok(list));
  } catch (err) { next(err); }
});

// POST /api/v1/coupons
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await couponService.create(req.body);
    res.status(201).json(ok(coupon));
  } catch (err) { next(err); }
});

// PATCH /api/v1/coupons/:id/toggle
router.patch('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive } = req.body as { isActive: boolean };
    await couponService.toggle(Number(req.params['id']), isActive);
    res.json(ok({ message: 'Updated' }));
  } catch (err) { next(err); }
});

export default router;

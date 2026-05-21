import { Router, Request, Response, NextFunction } from 'express';
import { checkoutService } from './checkout.service';
import { ok } from '../../shared/utils/response.util';

const router = Router();

function getIdentity(req: Request): { userId: number | null; sessionId: string | null } {
  const userId    = req.user?.id ?? null;
  const sessionId = (req.headers['x-session-id'] as string) || (req.cookies?.['lg_session'] as string) || null;
  return { userId, sessionId };
}

// GET /api/v1/checkout/summary?coupon=CODE
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const couponCode = req.query['coupon'] as string | undefined;
    const summary = await checkoutService.priceSummary(userId, sessionId, couponCode);
    res.json(ok(summary));
  } catch (err) { next(err); }
});

export default router;

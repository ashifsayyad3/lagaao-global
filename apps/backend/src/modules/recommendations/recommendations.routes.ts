import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { recommendationsService } from './recommendations.service';
import { ok } from '../../shared/utils/response.util';

const router = Router();

/** GET /api/v1/recommendations/product/:id — similar / bought-together */
router.get('/product/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await recommendationsService.forProduct(
      parseInt(req.params['id']!, 10),
      parseInt(req.query['limit'] as string || '8', 10),
    );
    ok(res, data);
  } catch (e) { next(e); }
});

/** GET /api/v1/recommendations/user — personalised (auth required) */
router.get('/user', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await recommendationsService.forUser(
      req.user!.id,
      parseInt(req.query['limit'] as string || '12', 10),
    );
    ok(res, data);
  } catch (e) { next(e); }
});

/** GET /api/v1/recommendations/bestsellers — public fallback */
router.get('/bestsellers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await recommendationsService.bestSellers(
      parseInt(req.query['limit'] as string || '12', 10),
    );
    ok(res, data);
  } catch (e) { next(e); }
});

export { router as recommendationsRouter };

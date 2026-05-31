import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { wishlistService } from './wishlist.service';
import { ok, created } from '../../shared/utils/response.util';

const router = Router();

/** GET /api/v1/wishlist — list items */
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await wishlistService.list(req.user!.id, req);
    res.json(ok(result));
  } catch (e) { next(e); }
});

/** GET /api/v1/wishlist/count — get count */
router.get('/count', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await wishlistService.count(req.user!.id);
    res.json(ok({ count }));
  } catch (e) { next(e); }
});

/** POST /api/v1/wishlist/check — check which product IDs are wishlisted */
router.post('/check', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productIds } = req.body as { productIds: number[] };
    const wishlisted = await wishlistService.check(req.user!.id, productIds ?? []);
    res.json(ok({ wishlisted }));
  } catch (e) { next(e); }
});

/** POST /api/v1/wishlist/:productId — add to wishlist */
router.post('/:productId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await wishlistService.add(req.user!.id, Number(req.params['productId']));
    res.status(201).json(created(item, 'Added to wishlist'));
  } catch (e) { next(e); }
});

/** DELETE /api/v1/wishlist/:productId — remove from wishlist */
router.delete('/:productId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await wishlistService.remove(req.user!.id, Number(req.params['productId']));
    res.json(ok(null, 'Removed from wishlist'));
  } catch (e) { next(e); }
});

export { router as wishlistRoutes };

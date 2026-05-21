import { Router, Request, Response, NextFunction } from 'express';
import { cartService } from './cart.service';
import { ok } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

function getIdentity(req: Request): { userId: number | null; sessionId: string | null } {
  const userId    = req.user?.id ?? null;
  const sessionId = (req.headers['x-session-id'] as string) || (req.cookies?.['lg_session'] as string) || null;
  return { userId, sessionId };
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const cart = await cartService.getCart(userId, sessionId);
    ok(res, cart);
  } catch (err) { next(err); }
});

router.post('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const { productId, variantId = null, qty = 1 } = req.body as {
      productId: number; variantId?: number | null; qty?: number;
    };
    if (!productId) { res.status(400).json({ success: false, message: 'productId required' }); return; }
    const cart = await cartService.addItem(userId, sessionId, productId, variantId, qty);
    ok(res, cart);
  } catch (err) { next(err); }
});

router.patch('/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const itemId = Number(req.params['itemId']);
    const { qty } = req.body as { qty: number };
    const cart = await cartService.updateItem(userId, sessionId, itemId, qty);
    ok(res, cart);
  } catch (err) { next(err); }
});

router.delete('/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    const itemId = Number(req.params['itemId']);
    const cart = await cartService.removeItem(userId, sessionId, itemId);
    ok(res, cart);
  } catch (err) { next(err); }
});

router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sessionId } = getIdentity(req);
    await cartService.clearCart(userId, sessionId);
    ok(res, { message: 'Cart cleared' });
  } catch (err) { next(err); }
});

router.post('/merge', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId    = req.user!.id;
    const sessionId = (req.headers['x-session-id'] as string) || (req.cookies?.['lg_session'] as string);
    if (sessionId) await cartService.mergeGuestCart(sessionId, userId);
    const cart = await cartService.getCart(userId, null);
    ok(res, cart);
  } catch (err) { next(err); }
});

export default router;

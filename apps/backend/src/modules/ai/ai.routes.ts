import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize as requireRole } from '../../middleware/rbac.middleware';
import { ok, created } from '../../shared/utils/response.util';
import { apiRateLimit } from '../../middleware/rateLimit.middleware';
import { Role } from '../../shared/types/roles';
import * as ai from './ai.service';

const router = Router();

// â”€â”€â”€ Recently viewed (track + fetch) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/recently-viewed/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = Number(req.params['productId']);
    const userId    = (req as any).user?.id as number | undefined;
    const sessionId = req.headers['x-session-id'] as string | undefined;
    await ai.trackView(productId, userId, sessionId);
    ok(res, null);
  } catch (e) { next(e); }
});

router.get('/recently-viewed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId    = (req as any).user?.id as number | undefined;
    const sessionId = req.headers['x-session-id'] as string | undefined;
    const products  = await ai.getRecentlyViewed(userId, sessionId, 8);
    ok(res, products);
  } catch (e) { next(e); }
});

// â”€â”€â”€ Recommendations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get('/recommendations/also-bought/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await ai.getAlsoBought(Number(req.params['productId']));
    ok(res, products);
  } catch (e) { next(e); }
});

router.get('/recommendations/for-you', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId   = (req as any).user.id as number;
    const products = await ai.getPersonalised(userId);
    ok(res, products);
  } catch (e) { next(e); }
});

// â”€â”€â”€ AI Chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post('/chat', apiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages } = req.body as { messages: ai.ChatMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, message: 'messages array required' });
      return;
    }
    const userId = (req as any).user?.id as number | undefined;
    const result = await ai.chat(messages, userId);
    ok(res, result);
  } catch (e) { next(e); }
});

// â”€â”€â”€ AI Description Generator (vendor / admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.post(
  '/generate-description',
  authenticate,
  requireRole(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  apiRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productName, category, features, tone } = req.body as {
        productName: string;
        category:    string;
        features:    string;
        tone?:       'professional' | 'casual' | 'luxury';
      };
      if (!productName || !category || !features) {
        res.status(400).json({ success: false, message: 'productName, category and features required' });
        return;
      }
      const result = await ai.generateDescription(productName, category, features, tone);
      ok(res, result);
    } catch (e) { next(e); }
  },
);

export default router;


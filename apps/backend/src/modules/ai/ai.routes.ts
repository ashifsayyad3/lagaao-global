import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ok, created } from '../../shared/utils/response.util';
import { apiRateLimit } from '../../middleware/rateLimit.middleware';
import * as ai from './ai.service';

const router = Router();

// ─── Recently viewed (track + fetch) ─────────────────────────
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

// ─── Recommendations ──────────────────────────────────────────
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

// ─── AI Chat ──────────────────────────────────────────────────
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

// ─── AI Description Generator (vendor / admin) ────────────────
router.post(
  '/generate-description',
  authenticate,
  requireRole('vendor'),
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

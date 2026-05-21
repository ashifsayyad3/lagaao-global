import { Router, Request, Response, NextFunction } from 'express';
import { searchService } from './search.service';
import { ok } from '../../shared/utils/response.util';
import { apiRateLimit } from '../../middleware/rateLimit.middleware';

const router = Router();

router.get('/', apiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await searchService.search(req);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.get('/suggest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query['q'] ?? '').trim();
    ok(res, { suggestions: await searchService.suggest(q) });
  } catch (err) { next(err); }
});

router.get('/trending', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, { trending: await searchService.trending(10) });
  } catch (err) { next(err); }
});

router.post('/ai', apiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body as { query?: string };
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      res.status(400).json({ success: false, message: 'query must be at least 2 characters' }); return;
    }
    req.query['q'] = query.trim();
    const result = await searchService.aiSearch(query.trim(), req);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

export default router;

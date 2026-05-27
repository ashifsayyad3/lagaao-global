import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize as requireRole } from '../../middleware/rbac.middleware';
import { Role } from '../../shared/types/roles';
import { ok, created } from '../../shared/utils/response.util';
import * as seo from './seo.service';

const router = Router();

// ─── Sitemap (public) ─────────────────────────────────────────────────────────
router.get('/sitemap.xml', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const xml = await seo.generateSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (e) { next(e); }
});

// ─── Web vitals beacon (public POST — no auth, called by sendBeacon) ──────────
router.post('/analytics/vitals', (req: Request, res: Response) => {
  try {
    const body = req.body as { name?: string; value?: number; url?: string; ts?: number };
    if (body.name && typeof body.value === 'number') {
      seo.recordVital({ name: body.name, value: body.value, url: body.url ?? '', ts: body.ts ?? Date.now() });
    }
    res.status(204).end();
  } catch { res.status(204).end(); }
});

// ─── Admin-only routes ────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireRole(Role.ADMIN, Role.SUPER_ADMIN));

// SEO meta CRUD
adminRouter.get('/meta',       async (req, res, next) => { try { ok(res, await seo.listSeoMeta(req)); } catch (e) { next(e); } });
adminRouter.post('/meta',      async (req, res, next) => { try { created(res, await seo.upsertSeoMeta(req.body)); } catch (e) { next(e); } });
adminRouter.put('/meta/:id',   async (req, res, next) => { try { ok(res, await seo.upsertSeoMeta({ ...req.body, id: Number(req.params['id']) })); } catch (e) { next(e); } });
adminRouter.delete('/meta/:id', async (req, res, next) => { try { await seo.deleteSeoMeta(Number(req.params['id'])); ok(res, null); } catch (e) { next(e); } });

// Redirects
adminRouter.get('/redirects',       async (req, res, next) => { try { ok(res, await seo.listRedirects(req)); } catch (e) { next(e); } });
adminRouter.post('/redirects',      async (req, res, next) => { try { const { fromPath, toPath, statusCode } = req.body; created(res, await seo.createRedirect(fromPath, toPath, statusCode)); } catch (e) { next(e); } });
adminRouter.put('/redirects/:id',   async (req, res, next) => { try { ok(res, await seo.updateRedirect(Number(req.params['id']), req.body)); } catch (e) { next(e); } });
adminRouter.delete('/redirects/:id', async (req, res, next) => { try { await seo.deleteRedirect(Number(req.params['id'])); ok(res, null); } catch (e) { next(e); } });

// Stats & vitals
adminRouter.get('/stats',  async (_req, res, next) => { try { ok(res, await seo.getSeoStats()); } catch (e) { next(e); } });
adminRouter.get('/vitals', (_req, res) => { ok(res, seo.getVitalsAggregated()); });

export { router as seoPublicRoutes, adminRouter as seoAdminRoutes };

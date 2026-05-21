import { Router } from 'express';
import { productsService } from './products.service';
import { ok, created, paginated } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { Role } from '../../shared/types/roles';

const router = Router();

// ─── Public ───────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const r = await productsService.list(req);
    paginated(res, r.rows, r.page, r.limit, r.count);
  } catch (e) { next(e); }
});

router.get('/featured', async (req, res, next) => {
  try { ok(res, await productsService.getFeatured(+((req.query['limit'] as string) ?? 10))); }
  catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try { ok(res, await productsService.findBySlug(req.params['slug'])); }
  catch (e) { next(e); }
});

router.get('/:id/related', async (req, res, next) => {
  try { ok(res, await productsService.getRelated(+req.params['id'])); }
  catch (e) { next(e); }
});

// ─── Admin / Vendor ───────────────────────────────────────────
router.post('/', authenticate, authorize(Role.VENDOR), async (req, res, next) => {
  try {
    const p = await productsService.create({ ...req.body, createdBy: req.user!.id });
    created(res, p);
  } catch (e) { next(e); }
});

router.patch('/:id', authenticate, authorize(Role.VENDOR), async (req, res, next) => {
  try { ok(res, await productsService.update(+req.params['id'], req.body)); }
  catch (e) { next(e); }
});

router.post('/:id/publish', authenticate, authorize(Role.VENDOR), async (req, res, next) => {
  try { ok(res, await productsService.publish(+req.params['id']), 'Published'); }
  catch (e) { next(e); }
});

router.post('/:id/unpublish', authenticate, authorize(Role.VENDOR), async (req, res, next) => {
  try { ok(res, await productsService.unpublish(+req.params['id']), 'Unpublished'); }
  catch (e) { next(e); }
});

router.delete('/:id', authenticate, authorize(Role.ADMIN), async (req, res, next) => {
  try { await productsService.remove(+req.params['id']); ok(res, null, 'Deleted'); }
  catch (e) { next(e); }
});

export default router;

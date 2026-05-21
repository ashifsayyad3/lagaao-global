import { Router } from 'express';
import { brandsService } from './brands.service';
import { ok, created, paginated } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { Role } from '../../shared/types/roles';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const r = await brandsService.list(req);
    paginated(res, r.rows, r.page, r.limit, r.count);
  } catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try { ok(res, await brandsService.findBySlug(req.params['slug'])); }
  catch (e) { next(e); }
});

router.post('/', authenticate, authorize(Role.ADMIN), async (req, res, next) => {
  try { created(res, await brandsService.create(req.body)); }
  catch (e) { next(e); }
});

router.patch('/:id', authenticate, authorize(Role.ADMIN), async (req, res, next) => {
  try { ok(res, await brandsService.update(+req.params['id'], req.body)); }
  catch (e) { next(e); }
});

router.delete('/:id', authenticate, authorize(Role.ADMIN), async (req, res, next) => {
  try { await brandsService.remove(+req.params['id']); ok(res, null, 'Deleted'); }
  catch (e) { next(e); }
});

export default router;

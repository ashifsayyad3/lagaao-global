import { Router, Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import { ok, created } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { Role } from '../../shared/types/roles';

const router = Router();

router.get('/', async (_req, res, next) => {
  try { ok(res, await categoriesService.getTree()); }
  catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try { ok(res, await categoriesService.findBySlug(req.params['slug'])); }
  catch (e) { next(e); }
});

router.post('/', authenticate, authorize(Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await categoriesService.create(req.body)); }
  catch (e) { next(e); }
});

router.patch('/:id', authenticate, authorize(Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await categoriesService.update(+req.params['id'], req.body), 'Updated'); }
  catch (e) { next(e); }
});

router.delete('/:id', authenticate, authorize(Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try { await categoriesService.remove(+req.params['id']); ok(res, null, 'Deleted'); }
  catch (e) { next(e); }
});

export default router;

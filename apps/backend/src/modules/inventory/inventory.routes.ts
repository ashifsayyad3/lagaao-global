import { Router } from 'express';
import { inventoryService } from './inventory.service';
import { ok } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { Role } from '../../shared/types/roles';

const router = Router();

router.use(authenticate, authorize(Role.VENDOR));

router.get('/alerts', async (_req, res, next) => {
  try { ok(res, await inventoryService.getLowStockAlerts()); }
  catch (e) { next(e); }
});

router.get('/variant/:variantId', async (req, res, next) => {
  try { ok(res, await inventoryService.getByVariant(+req.params['variantId'])); }
  catch (e) { next(e); }
});

router.get('/variant/:variantId/logs', async (req, res, next) => {
  try { ok(res, await inventoryService.getLogs(+req.params['variantId'])); }
  catch (e) { next(e); }
});

router.post('/variant/:variantId/adjust', async (req, res, next) => {
  try {
    const { type, qtyChange, note } = req.body;
    const inv = await inventoryService.adjust(
      +req.params['variantId'], type, qtyChange,
      { note, createdBy: req.user!.id },
    );
    ok(res, inv, 'Inventory adjusted');
  } catch (e) { next(e); }
});

export default router;

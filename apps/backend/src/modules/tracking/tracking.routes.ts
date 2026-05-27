import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize }    from '../../middleware/rbac.middleware';
import { ok, created, paginated } from '../../shared/utils/response.util';
import { Role }             from '../../shared/types/roles';
import { trackingService }  from './tracking.service';
import type { ShipmentStatus } from '../../models/shipment.model';

const router = Router();
router.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN, Role.VENDOR));

// GET /api/v1/admin/tracking/shipments
router.get('/shipments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { count, rows, page, limit } = await trackingService.getShipments(req);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

// GET /api/v1/admin/tracking/stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await trackingService.getStats()); } catch (e) { next(e); }
});

// GET /api/v1/admin/tracking/shipments/:id
router.get('/shipments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    ok(res, await trackingService.getById(Number(req.params['id'])));
  } catch (e) { next(e); }
});

// POST /api/v1/admin/tracking/shipments
router.post('/shipments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, courier, trackingNumber, estimatedDelivery } = req.body as {
      orderId: number; courier: string; trackingNumber?: string; estimatedDelivery?: string;
    };
    if (!orderId || !courier) { res.status(400).json({ success: false, message: 'orderId and courier required' }); return; }
    const shipment = await trackingService.createShipment({
      orderId, courier, trackingNumber,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
    });
    created(res, shipment, 'Shipment created');
  } catch (e) { next(e); }
});

// PATCH /api/v1/admin/tracking/shipments/:id
router.patch('/shipments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, event } = req.body as { status: ShipmentStatus; event?: { status: string; location?: string; remark?: string } };
    const shipment = await trackingService.updateStatus(
      Number(req.params['id']),
      status,
      event ? { ...event, timestamp: new Date().toISOString() } : undefined,
    );
    ok(res, shipment, 'Shipment updated');
  } catch (e) { next(e); }
});

// GET /api/v1/admin/tracking/order/:orderId
router.get('/order/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const shipment = await trackingService.getByOrderId(Number(req.params['orderId']));
    ok(res, shipment);
  } catch (e) { next(e); }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';
import { ok, created, paginated } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { getPagination } from '../../shared/utils/paginate.util';

const router = Router();

// All customer routes require auth
router.use(authenticate);

// POST /api/v1/orders  — place order
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await ordersService.createOrder(req.user!.id, req.body);
    created(res, order, 'Order placed successfully');
  } catch (err) { next(err); }
});

// GET /api/v1/orders  — list my orders
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 10);
    const { rows, count } = await ordersService.getOrders(req.user!.id, req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

// GET /api/v1/orders/:id  — get order detail
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await ordersService.getOrder(Number(req.params['id']), req.user!.id);
    ok(res, order);
  } catch (err) { next(err); }
});

// GET /api/v1/orders/number/:orderNumber  — get by order number
router.get('/number/:orderNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await ordersService.getOrderByNumber(req.params['orderNumber']!, req.user!.id);
    ok(res, order);
  } catch (err) { next(err); }
});

// POST /api/v1/orders/:id/cancel
router.post('/:id/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason = 'Cancelled by customer' } = req.body as { reason?: string };
    const order = await ordersService.cancelOrder(Number(req.params['id']), req.user!.id, reason);
    ok(res, order, 'Order cancelled');
  } catch (err) { next(err); }
});

// ─── Admin routes ──────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, authorize('admin', 'super_admin'));

// GET /api/v1/admin/orders
adminRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = getPagination(req, 20);
    const { rows, count } = await ordersService.adminListOrders(req);
    paginated(res, rows, page, limit, count);
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/orders/:id/status
adminRouter.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, note, trackingNumber, courier } = req.body as {
      status: string; note?: string; trackingNumber?: string; courier?: string;
    };
    if (!status) { res.status(400).json({ success: false, message: 'status required' }); return; }
    const order = await ordersService.updateStatus(
      Number(req.params['id']),
      status as import('../../models/order.model').OrderStatus,
      req.user!.id,
      note,
      trackingNumber,
      courier,
    );
    ok(res, order, 'Status updated');
  } catch (err) { next(err); }
});

export { adminRouter as adminOrdersRouter };
export default router;

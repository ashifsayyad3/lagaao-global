import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { Role } from '../../shared/types/roles';
import { shiprocketService } from './shiprocket.service';
import { ok } from '../../shared/utils/response.util';
import { logger } from '../../config/logger';

const router = Router();

// ── Webhook (no auth — validated by IP or secret header) ──────
/**
 * POST /api/v1/shiprocket/webhook
 * Shiprocket sends tracking status updates here.
 */
router.post('/shiprocket/webhook', async (req: Request, res: Response) => {
  try {
    await shiprocketService.handleWebhook(req.body as Record<string, unknown>);
    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Shiprocket webhook error', err);
    res.status(200).json({ status: 'ignored' }); // always 200 to avoid Shiprocket retries
  }
});

// ── Admin routes ──────────────────────────────────────────────

/**
 * POST /api/v1/admin/shiprocket/orders/:id/create
 * Push a confirmed order to Shiprocket.
 */
router.post('/admin/orders/:id/create', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await shiprocketService.createOrder(Number(req.params['id']));
      res.json(ok(order, 'Order pushed to Shiprocket'));
    } catch (e) { next(e); }
  });

/**
 * POST /api/v1/admin/shiprocket/orders/:id/awb
 * Assign courier and generate AWB for an order.
 */
router.post('/admin/orders/:id/awb', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await shiprocketService.generateAwb(Number(req.params['id']));
      res.json(ok(order, `AWB generated: ${order.awbCode}`));
    } catch (e) { next(e); }
  });

/**
 * GET /api/v1/admin/shiprocket/track/:awb
 * Get live tracking info for an AWB code.
 */
router.get('/admin/shiprocket/track/:awb', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await shiprocketService.track(req.params['awb']!);
      res.json(ok(data));
    } catch (e) { next(e); }
  });

/**
 * POST /api/v1/admin/shiprocket/orders/:id/cancel
 * Cancel a Shiprocket order.
 */
router.post('/admin/orders/:id/cancel', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await shiprocketService.cancelOrder(Number(req.params['id']));
      res.json(ok(null, 'Shiprocket order cancelled'));
    } catch (e) { next(e); }
  });

// ── Customer: track by AWB ─────────────────────────────────────
/**
 * GET /api/v1/track/:awb
 * Public tracking — no auth required.
 */
router.get('/track/:awb', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await shiprocketService.track(req.params['awb']!);
    res.json(ok(data));
  } catch (e) { next(e); }
});

export { router as shiprocketRoutes };

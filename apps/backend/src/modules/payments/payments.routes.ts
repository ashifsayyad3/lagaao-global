import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { paymentsService } from './payments.service';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize }    from '../../middleware/rbac.middleware';
import { Role }         from '../../shared/types/roles';
import { ok, created, paginated, fail } from '../../shared/utils/response.util';
import { getPagination } from '../../shared/utils/paginate.util';
import { logger } from '../../config/logger';

const router = Router();

// ── Validation helper ─────────────────────────────────────────
function validate(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { fail(res, 'Validation failed', 422, errors.array()); return false; }
  return true;
}

// ─────────────────────────────────────────────────────────────
// CUSTOMER ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/payments/create-order
 * Creates a Razorpay order for an existing Lagaao order.
 * Frontend calls this before opening the Razorpay checkout modal.
 */
router.post(
  '/create-order',
  authenticate,
  [body('orderId').isInt({ min: 1 }).withMessage('orderId must be a positive integer')],
  async (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req, res)) return;
    try {
      const result = await paymentsService.createPaymentOrder(
        Number(req.body.orderId),
        req.user!.id,
      );
      ok(res, result, 'Payment order created');
    } catch (err) { next(err); }
  },
);

/**
 * POST /api/v1/payments/verify
 * Called by frontend after Razorpay modal success.
 * Verifies HMAC signature and marks order as paid.
 */
router.post(
  '/verify',
  authenticate,
  [
    body('orderId').isInt({ min: 1 }),
    body('razorpayOrderId').notEmpty().withMessage('razorpayOrderId required'),
    body('razorpayPaymentId').notEmpty().withMessage('razorpayPaymentId required'),
    body('razorpaySignature').notEmpty().withMessage('razorpaySignature required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req, res)) return;
    try {
      const order = await paymentsService.verifyPayment({
        orderId:           Number(req.body.orderId),
        razorpayOrderId:   req.body.razorpayOrderId,
        razorpayPaymentId: req.body.razorpayPaymentId,
        razorpaySignature: req.body.razorpaySignature,
      });
      ok(res, order, 'Payment verified successfully');
    } catch (err) { next(err); }
  },
);

/**
 * GET /api/v1/payments/order/:orderId
 * Returns payment transaction for an order (customer can only see own order).
 */
router.get(
  '/order/:orderId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tx = await paymentsService.getByOrder(Number(req.params['orderId']));
      if (!tx) return fail(res, 'No payment record found', 404);
      ok(res, tx);
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// WEBHOOK — No auth middleware; verified via HMAC signature
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/payments/webhook
 * Razorpay webhook endpoint.
 * IMPORTANT: Must be registered with raw body parser (not JSON) so we can
 * compute HMAC over the exact bytes Razorpay sent.
 */
router.post(
  '/webhook',
  (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    if (!signature) return fail(res, 'Missing signature', 400);

    // rawBody is attached by the raw body middleware in app.ts
    const rawBody = (req as unknown as Record<string, string>)['rawBody'] ?? JSON.stringify(req.body);

    paymentsService.handleWebhook(rawBody, signature)
      .then(() => res.json({ received: true }))
      .catch((err) => {
        logger.error('Webhook processing error', { err });
        next(err);
      });
  },
);

// ─────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/payments
 * List all payment transactions (paginated).
 */
router.get(
  '/',
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  [query('status').optional().isString()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = getPagination(req, 20);
      const status = req.query['status'] as string | undefined;
      const { rows, count } = await paymentsService.listTransactions(page, limit, status);
      paginated(res, rows, page, limit, count);
    } catch (err) { next(err); }
  },
);

/**
 * POST /api/v1/admin/payments/:orderId/refund
 * Admin-initiated refund.
 */
router.post(
  '/:orderId/refund',
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  [
    param('orderId').isInt({ min: 1 }),
    body('amount').optional().isFloat({ min: 1 }),
    body('reason').optional().isString().trim(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req, res)) return;
    try {
      const tx = await paymentsService.refundPayment({
        orderId: Number(req.params['orderId']),
        amount:  req.body.amount ? Number(req.body.amount) : undefined,
        reason:  req.body.reason,
      });
      ok(res, tx, 'Refund initiated');
    } catch (err) { next(err); }
  },
);

export default router;

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler.middleware';
import { Order, PaymentTransaction } from '../../models';
import type { PaymentMethod, PaymentStatus } from '../../models/order.model';
import type { TxMethod } from '../../models/paymentTransaction.model';

// ─── Razorpay client (lazy — only if keys are configured) ─────
function getRazorpay(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Payment gateway not configured', 503);
  }
  return new Razorpay({
    key_id:     env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export interface CreatePaymentOrderResult {
  razorpayOrderId: string;
  amount:          number;   // in paise
  currency:        string;
  keyId:           string;
  orderId:         number;
  orderNumber:     string;
}

export interface VerifyPaymentInput {
  orderId:            number;
  razorpayOrderId:    string;
  razorpayPaymentId:  string;
  razorpaySignature:  string;
}

export interface RefundInput {
  orderId:  number;
  amount?:  number;          // partial refund amount in INR; omit for full refund
  reason?:  string;
}

export class PaymentsService {

  /**
   * Step 1 — called by frontend before opening Razorpay modal.
   * Creates a Razorpay order and persists a PaymentTransaction record.
   */
  async createPaymentOrder(
    orderId: number,
    userId:  number,
  ): Promise<CreatePaymentOrderResult> {
    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) throw new AppError('Order not found', 404);

    if (order.paymentStatus === 'paid') {
      throw new AppError('Order is already paid', 400);
    }
    if (order.paymentMethod === 'cod') {
      throw new AppError('COD orders do not require online payment', 400);
    }

    const rz = getRazorpay();
    const amountPaise = Math.round(Number(order.total) * 100);

    const rzOrder = await rz.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  order.orderNumber,
      notes: {
        orderId:     String(orderId),
        orderNumber: order.orderNumber,
        userId:      String(userId),
      },
    });

    // Persist / upsert transaction record
    const [tx] = await PaymentTransaction.findOrCreate({
      where: { orderId },
      defaults: {
        orderId,
        userId,
        razorpayOrderId: rzOrder.id,
        amount:   Number(order.total),
        currency: 'INR',
        method:   order.paymentMethod as TxMethod,
        status:   'created',
        metadata: { rzOrder },
      },
    });

    // If re-initiating, update the Razorpay order ID
    if (tx.razorpayOrderId !== rzOrder.id) {
      await tx.update({ razorpayOrderId: rzOrder.id, status: 'created', metadata: { rzOrder } });
    }

    return {
      razorpayOrderId: rzOrder.id,
      amount:          amountPaise,
      currency:        'INR',
      keyId:           env.RAZORPAY_KEY_ID!,
      orderId,
      orderNumber:     order.orderNumber,
    };
  }

  /**
   * Step 2 — called by frontend after Razorpay checkout success.
   * Verifies HMAC signature and marks order as paid.
   */
  async verifyPayment(input: VerifyPaymentInput): Promise<Order> {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    // HMAC verification
    const body      = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected  = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expected !== razorpaySignature) {
      logger.warn('Razorpay signature mismatch', { orderId, razorpayPaymentId });
      throw new AppError('Payment verification failed — invalid signature', 400);
    }

    const tx = await PaymentTransaction.findOne({ where: { orderId } });
    if (!tx) throw new AppError('Transaction record not found', 404);

    const order = await Order.findByPk(orderId);
    if (!order) throw new AppError('Order not found', 404);

    // Idempotency — already captured
    if (tx.status === 'captured') return order;

    await tx.update({
      razorpayPaymentId,
      razorpaySignature,
      status:   'captured',
      metadata: { ...((tx.metadata as Record<string, unknown>) ?? {}), capturedAt: new Date().toISOString() },
    });

    await order.update({
      paymentStatus: 'paid' as PaymentStatus,
      paymentRef:    razorpayPaymentId,
      status:        'confirmed',
    });

    logger.info(`Payment captured: order #${order.orderNumber}, pay_id=${razorpayPaymentId}`);
    return order.reload();
  }

  /**
   * Webhook handler — called by Razorpay with event payloads.
   * Verifies X-Razorpay-Signature header before processing.
   */
  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      logger.warn('Webhook received but RAZORPAY_WEBHOOK_SECRET not set — skipping verification');
      return;
    }

    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      throw new AppError('Webhook signature mismatch', 400);
    }

    const payload = JSON.parse(rawBody) as {
      event: string;
      payload: {
        payment?: { entity: Record<string, unknown> };
        refund?:  { entity: Record<string, unknown> };
      };
    };

    logger.info(`Razorpay webhook: ${payload.event}`);

    switch (payload.event) {

      case 'payment.captured': {
        const entity        = payload.payload.payment!.entity;
        const rzOrderId     = entity['order_id'] as string;
        const rzPaymentId   = entity['id'] as string;

        const tx = await PaymentTransaction.findOne({ where: { razorpayOrderId: rzOrderId } });
        if (!tx || tx.status === 'captured') break;

        await tx.update({ razorpayPaymentId: rzPaymentId, status: 'captured', metadata: entity });
        await Order.update(
          { paymentStatus: 'paid', paymentRef: rzPaymentId, status: 'confirmed' },
          { where: { id: tx.orderId } },
        );
        logger.info(`Webhook captured: order_id=${tx.orderId}`);
        break;
      }

      case 'payment.failed': {
        const entity      = payload.payload.payment!.entity;
        const rzOrderId   = entity['order_id'] as string;
        const errCode     = (entity['error_code'] ?? '') as string;
        const errDesc     = (entity['error_description'] ?? '') as string;

        const tx = await PaymentTransaction.findOne({ where: { razorpayOrderId: rzOrderId } });
        if (!tx) break;

        await tx.update({ status: 'failed', errorCode: errCode, errorDescription: errDesc, metadata: entity });
        await Order.update(
          { paymentStatus: 'failed' },
          { where: { id: tx.orderId } },
        );
        logger.warn(`Payment failed: order_id=${tx.orderId}, reason=${errDesc}`);
        break;
      }

      case 'refund.created':
      case 'refund.processed': {
        const entity    = payload.payload.refund!.entity;
        const rzPayId   = entity['payment_id'] as string;
        const refundId  = entity['id'] as string;
        const refundAmt = Number(entity['amount']) / 100;

        const tx = await PaymentTransaction.findOne({ where: { razorpayPaymentId: rzPayId } });
        if (!tx) break;

        await tx.update({
          status:       'refunded',
          refundId,
          refundAmount: refundAmt,
          refundedAt:   new Date(),
          metadata:     entity,
        });
        await Order.update(
          { paymentStatus: 'refunded', status: 'refunded' },
          { where: { id: tx.orderId } },
        );
        logger.info(`Refund processed: order_id=${tx.orderId}, refund_id=${refundId}`);
        break;
      }

      default:
        logger.debug(`Unhandled Razorpay event: ${payload.event}`);
    }
  }

  /**
   * Admin-triggered refund via Razorpay API.
   */
  async refundPayment(input: RefundInput): Promise<PaymentTransaction> {
    const { orderId, amount, reason } = input;

    const tx = await PaymentTransaction.findOne({ where: { orderId } });
    if (!tx) throw new AppError('No payment transaction found for this order', 404);
    if (tx.status !== 'captured') throw new AppError('Only captured payments can be refunded', 400);
    if (!tx.razorpayPaymentId) throw new AppError('No Razorpay payment ID on record', 400);

    const order = await Order.findByPk(orderId);
    if (!order) throw new AppError('Order not found', 404);

    const rz = getRazorpay();
    const refundAmountPaise = amount
      ? Math.round(amount * 100)
      : Math.round(Number(order.total) * 100);

    const refund = await rz.payments.refund(tx.razorpayPaymentId, {
      amount: refundAmountPaise,
      notes:  { reason: reason ?? 'Admin refund', orderId: String(orderId) },
    });

    const refundAmountInr = refundAmountPaise / 100;
    const isPartial = refundAmountInr < Number(order.total);

    await tx.update({
      status:       isPartial ? 'partially_refunded' : 'refunded',
      refundId:     refund.id,
      refundAmount: refundAmountInr,
      refundedAt:   new Date(),
      metadata:     { ...((tx.metadata as Record<string, unknown>) ?? {}), refund },
    });

    await order.update({
      paymentStatus: 'refunded' as PaymentStatus,
      status:        isPartial ? order.status : 'refunded',
    });

    logger.info(`Refund initiated: order_id=${orderId}, refund_id=${refund.id}`);
    return tx.reload();
  }

  /** Admin — list all transactions paginated */
  async listTransactions(page = 1, limit = 20, status?: string): Promise<{
    rows: PaymentTransaction[];
    count: number;
  }> {
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    return PaymentTransaction.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      include: [
        { model: Order, attributes: ['orderNumber', 'total', 'paymentMethod'] },
      ],
    });
  }

  /** Get transaction by order ID */
  async getByOrder(orderId: number): Promise<PaymentTransaction | null> {
    return PaymentTransaction.findOne({ where: { orderId } });
  }
}

export const paymentsService = new PaymentsService();

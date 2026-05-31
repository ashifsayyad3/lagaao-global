import { Request } from 'express';
import { ReturnRequest, ReturnReason, ReturnStatus, RefundMethod } from '../../models/returnRequest.model';
import { Order, OrderItem } from '../../models/index';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getPagination } from '../../shared/utils/paginate.util';
import { walletService } from '../wallet/wallet.service';
import { whatsappService } from '../whatsapp/whatsapp.service';

// Optional Razorpay — reuse instance from payments module if available
let razorpay: import('razorpay') | null = null;
try {
  const Razorpay = require('razorpay');
  const { env } = require('../../config/env');
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  }
} catch { /* optional */ }

const RETURN_INCLUDE = [
  { association: 'customer', attributes: ['id', 'name', 'email'] },
  { association: 'reviewer', attributes: ['id', 'name'] },
  {
    model: Order,
    attributes: ['id', 'orderNumber', 'total', 'paymentMethod', 'paymentStatus'],
  },
];

export class ReturnsService {
  /** Customer: create a return request */
  async create(userId: number, input: {
    orderId: number;
    orderItemId?: number;
    reason: ReturnReason;
    description?: string;
    images?: string[];
  }): Promise<ReturnRequest> {
    // Verify order belongs to user and is delivered
    const order = await Order.findOne({ where: { id: input.orderId, userId } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'delivered') throw new AppError('Returns are only allowed for delivered orders', 400);

    // Check for duplicate pending/active return
    const existing = await ReturnRequest.findOne({
      where: {
        orderId: input.orderId,
        userId,
        ...(input.orderItemId ? { orderItemId: input.orderItemId } : {}),
      },
    });
    if (existing && !['rejected', 'closed'].includes(existing.status)) {
      throw new AppError('A return request already exists for this item', 409);
    }

    return ReturnRequest.create({
      orderId:     input.orderId,
      orderItemId: input.orderItemId ?? null,
      userId,
      reason:      input.reason,
      description: input.description ?? null,
      images:      input.images ?? null,
      status:      'pending',
    });
  }

  /** Customer: list their return requests */
  async listForUser(userId: number, req: Request) {
    const { limit, offset, page } = getPagination(req, 10);
    const { count, rows } = await ReturnRequest.findAndCountAll({
      where: { userId },
      include: RETURN_INCLUDE,
      limit, offset,
      order: [['createdAt', 'DESC']],
    });
    return { requests: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  /** Customer: get single return request */
  async getOne(id: number, userId: number): Promise<ReturnRequest> {
    const r = await ReturnRequest.findOne({ where: { id, userId }, include: RETURN_INCLUDE });
    if (!r) throw new AppError('Return request not found', 404);
    return r;
  }

  /** Admin: list all return requests */
  async adminList(req: Request) {
    const { limit, offset, page } = getPagination(req, 20);
    const status = (req.query['status'] as ReturnStatus | undefined);
    const { count, rows } = await ReturnRequest.findAndCountAll({
      where: status ? { status } : {},
      include: RETURN_INCLUDE,
      limit, offset,
      order: [['createdAt', 'DESC']],
    });
    return { requests: rows, meta: { page, limit, total: count, totalPages: Math.ceil(count / limit) } };
  }

  /** Admin: update return status */
  async adminUpdate(id: number, adminId: number, input: {
    status: ReturnStatus;
    adminNote?: string;
    refundMethod?: RefundMethod;
    refundAmount?: number;
    pickupDate?: string;
  }): Promise<ReturnRequest> {
    const request = await ReturnRequest.findByPk(id, {
      include: [{ model: Order }],
    });
    if (!request) throw new AppError('Return request not found', 404);

    await request.update({
      status:       input.status,
      adminNote:    input.adminNote ?? request.adminNote,
      refundMethod: input.refundMethod ?? request.refundMethod,
      refundAmount: input.refundAmount ?? request.refundAmount,
      pickupDate:   input.pickupDate ?? request.pickupDate,
      reviewedBy:   adminId,
      reviewedAt:   new Date(),
    });

    // If approved → process refund
    if (input.status === 'refund_initiated') {
      await this.#processRefund(request);
    }

    return request.reload({ include: RETURN_INCLUDE });
  }

  /** Process refund — wallet or Razorpay */
  async #processRefund(request: ReturnRequest): Promise<void> {
    const refundAmount = Number(request.refundAmount);
    if (!refundAmount || refundAmount <= 0) return;

    if (request.refundMethod === 'wallet') {
      await walletService.credit({
        userId:        request.userId,
        amount:        refundAmount,
        type:          'refund',
        description:   `Refund for Return #${request.id}`,
        referenceType: 'return_request',
        referenceId:   request.id,
      });
      await request.update({ status: 'refund_completed', refundId: `WALLET-${request.id}` });

      // WhatsApp notification
      const order = request.order as Order;
      if (order) {
        const addr = order.shippingAddress as Record<string, string>;
        whatsappService.refundInitiated({
          phone:       addr['phone'],
          name:        addr['fullName'] ?? 'Customer',
          orderNumber: order.orderNumber,
          amount:      refundAmount,
        }).catch(() => {});
      }
      return;
    }

    // Original payment method — Razorpay refund
    if (!razorpay) {
      throw new AppError('Payment gateway not configured for refunds', 500);
    }
    const order = request.order as Order;
    if (!order) throw new AppError('Order not found for refund', 404);

    // Find Razorpay payment ID from payment_transactions
    const { PaymentTransaction } = await import('../../models/index');
    const tx = await PaymentTransaction.findOne({
      where: { orderId: order.id, status: 'captured' },
      order: [['createdAt', 'DESC']],
    });
    if (!tx?.razorpayPaymentId) {
      throw new AppError('No captured payment found for this order', 400);
    }

    const refund = await (razorpay as unknown as { payments: { refund: (id: string, opts: object) => Promise<{ id: string }> } })
      .payments.refund(tx.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100), // paise
        notes: { returnRequestId: String(request.id) },
      });

    await request.update({ status: 'refund_completed', refundId: refund.id });
    await tx.update({ status: 'refunded', refundId: refund.id, refundAmount: refundAmount, refundedAt: new Date() });
  }
}

export const returnsService = new ReturnsService();

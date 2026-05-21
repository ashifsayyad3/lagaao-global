import { Op } from 'sequelize';
import {
  sequelize,
  Order, OrderItem, OrderStatusHistory,
  Cart, CartItem,
  Product, ProductImage, ProductVariant, Inventory,
  Coupon,
} from '../../models';
import { inventoryService } from '../inventory/inventory.service';
import { couponService } from '../coupon/coupon.service';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getPagination } from '../../shared/utils/paginate.util';
import type { Request } from 'express';
import type { OrderStatus, PaymentMethod } from '../../models/order.model';

const TAX_RATE      = 0.18;
const FREE_SHIPPING = 499;
const FLAT_SHIPPING = 49;
const COD_FEE       = 20;

export interface CreateOrderInput {
  shippingAddress: {
    fullName: string; phone: string; line1: string; line2?: string;
    city: string; state: string; pincode: string; country?: string;
  };
  paymentMethod: PaymentMethod;
  couponCode?:   string;
  sessionId?:    string;
}

const ORDER_INCLUDE = [
  {
    model: OrderItem,
    include: [
      { model: Product, attributes: ['id', 'name', 'slug'] },
      { model: ProductVariant, attributes: ['id', 'sku', 'attributes'], required: false },
    ],
  },
  { model: OrderStatusHistory, limit: 20, order: [['createdAt', 'DESC']] as [string, string][] },
];

export class OrdersService {

  async createOrder(userId: number, input: CreateOrderInput): Promise<Order> {
    // Load cart
    const cartWhere = input.sessionId
      ? { [Op.or]: [{ userId }, { sessionId: input.sessionId }] }
      : { userId };

    const cart = await Cart.findOne({
      where: cartWhere,
      include: [{
        model: CartItem,
        include: [
          { model: Product, attributes: ['id', 'name', 'slug', 'basePrice', 'salePrice', 'status'] },
          {
            model: ProductVariant,
            attributes: ['id', 'sku', 'price', 'salePrice', 'attributes', 'image'],
            include: [{ model: Inventory, attributes: ['qtyAvailable', 'isOutOfStock'] }],
            required: false,
          },
          { model: ProductImage, separate: true, limit: 1, where: { isPrimary: true }, required: false },
        ],
      }],
    });

    if (!cart || !cart.items?.length) throw new AppError('Your cart is empty', 400);

    // Validate all items
    for (const item of cart.items) {
      if (item.product?.status !== 'active') {
        throw new AppError(`"${item.product?.name}" is no longer available`, 400);
      }
      if (item.variant?.inventory?.isOutOfStock) {
        throw new AppError(`"${item.product?.name}" is out of stock`, 400);
      }
    }

    // Calculate pricing
    const subtotal = cart.items.reduce((sum, item) => {
      const ep = item.variant
        ? (item.variant.salePrice ? Number(item.variant.salePrice) : Number(item.variant.price))
        : (item.product?.salePrice ? Number(item.product.salePrice) : Number(item.product?.basePrice ?? item.price));
      return sum + ep * item.qty;
    }, 0);

    let discount = 0;
    if (input.couponCode) {
      const coupon = await couponService.validate(input.couponCode, subtotal).catch(() => null);
      if (coupon) discount = coupon.discount;
    }

    const afterDiscount = subtotal - discount;
    let shipping = afterDiscount >= FREE_SHIPPING ? 0 : FLAT_SHIPPING;
    if (input.paymentMethod === 'cod') shipping += COD_FEE;

    const tax   = Math.round((afterDiscount / (1 + TAX_RATE)) * TAX_RATE * 100) / 100;
    const total = afterDiscount + shipping;

    const order = await sequelize.transaction(async (t) => {
      // Create order
      const newOrder = await Order.create({
        userId,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        couponCode:      input.couponCode ?? null,
        paymentMethod:   input.paymentMethod,
        paymentStatus:   input.paymentMethod === 'cod' ? 'pending' : 'pending',
        shippingAddress: { ...input.shippingAddress, country: input.shippingAddress.country ?? 'India' },
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 days
      }, { transaction: t });

      // Create order items and reserve inventory
      for (const item of cart.items) {
        const ep = item.variant
          ? (item.variant.salePrice ? Number(item.variant.salePrice) : Number(item.variant.price))
          : (item.product?.salePrice ? Number(item.product.salePrice) : Number(item.product?.basePrice ?? item.price));

        await OrderItem.create({
          orderId:      newOrder.id,
          productId:    item.productId,
          variantId:    item.variantId,
          productName:  item.product?.name ?? '',
          sku:          item.variant?.sku ?? null,
          variantAttrs: item.variant?.attributes ?? null,
          image:        item.variant?.image ?? item.product?.images?.[0]?.url ?? null,
          qty:          item.qty,
          unitPrice:    ep,
          lineTotal:    ep * item.qty,
        }, { transaction: t });

        // Reserve inventory
        if (item.variantId) {
          await inventoryService.reserve(item.variantId, item.qty, newOrder.id);
        }
      }

      // Record initial status
      await OrderStatusHistory.create({
        orderId:    newOrder.id,
        fromStatus: '',
        toStatus:   'pending',
        note:       'Order placed',
        changedBy:  userId,
      }, { transaction: t });

      // Mark coupon used
      if (input.couponCode) {
        await couponService.markUsed(input.couponCode).catch(() => {});
      }

      // Clear cart
      await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

      return newOrder;
    });

    return Order.findByPk(order.id, { include: ORDER_INCLUDE }) as Promise<Order>;
  }

  async getOrders(userId: number, req: Request): Promise<{ rows: Order[]; count: number }> {
    const { limit, offset } = getPagination(req, 10);
    const status = req.query['status'] as string | undefined;
    const where: Record<string, unknown> = { userId };
    if (status) where['status'] = status;

    return Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: OrderItem }],
      distinct: true,
    });
  }

  async getOrder(orderId: number, userId: number): Promise<Order> {
    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async getOrderByNumber(orderNumber: string, userId: number): Promise<Order> {
    const order = await Order.findOne({
      where: { orderNumber, userId },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new AppError('Order not found', 404);
    return order;
  }

  async cancelOrder(orderId: number, userId: number, reason: string): Promise<Order> {
    const order = await this.getOrder(orderId, userId);

    const cancellable: OrderStatus[] = ['pending', 'confirmed'];
    if (!cancellable.includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    await sequelize.transaction(async (t) => {
      const prev = order.status;
      await order.update({ status: 'cancelled', cancelReason: reason }, { transaction: t });

      await OrderStatusHistory.create({
        orderId: order.id, fromStatus: prev, toStatus: 'cancelled',
        note: reason, changedBy: userId,
      }, { transaction: t });

      // Release reserved inventory
      for (const item of order.items ?? []) {
        if (item.variantId) {
          await inventoryService.release(item.variantId, item.qty).catch(() => {});
        }
      }
    });

    return this.getOrder(orderId, userId);
  }

  // Admin: update order status
  async updateStatus(
    orderId: number,
    status: OrderStatus,
    adminId: number,
    note?: string,
    trackingNumber?: string,
    courier?: string,
  ): Promise<Order> {
    const order = await Order.findByPk(orderId, { include: ORDER_INCLUDE });
    if (!order) throw new AppError('Order not found', 404);

    const prev = order.status;
    const updates: Partial<Order> = { status };
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    if (courier)        updates.courier        = courier;
    if (status === 'delivered') {
      updates.deliveredAt   = new Date();
      (updates as Record<string, unknown>).paymentStatus = 'paid';
    }
    if (status === 'shipped' && !order.trackingNumber && trackingNumber) {
      updates.trackingNumber = trackingNumber;
    }

    await sequelize.transaction(async (t) => {
      await order.update(updates, { transaction: t });
      await OrderStatusHistory.create({
        orderId: order.id, fromStatus: prev, toStatus: status,
        note: note ?? null, changedBy: adminId,
      }, { transaction: t });

      // Confirm inventory sale on delivery
      if (status === 'delivered') {
        for (const item of order.items ?? []) {
          if (item.variantId) {
            await inventoryService.confirmSale(item.variantId, item.qty, order.id, adminId).catch(() => {});
          }
        }
      }
    });

    return Order.findByPk(orderId, { include: ORDER_INCLUDE }) as Promise<Order>;
  }

  // Admin: list all orders
  async adminListOrders(req: Request): Promise<{ rows: Order[]; count: number }> {
    const { limit, offset } = getPagination(req, 20);
    const status  = req.query['status']  as string | undefined;
    const userId  = req.query['userId']  as string | undefined;
    const search  = req.query['q']       as string | undefined;
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (userId) where['userId'] = userId;
    if (search) where['orderNumber'] = { [Op.like]: `%${search}%` };

    return Order.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: OrderItem }],
      distinct: true,
    });
  }
}

export const ordersService = new OrdersService();

import { Op, QueryTypes } from 'sequelize';
import { sequelize, Order, User } from '../../models';
import { Shipment, ShipmentStatus, TrackingEvent } from '../../models/shipment.model';
import { getPagination } from '../../shared/utils/paginate.util';
import { AppError } from '../../middleware/errorHandler.middleware';
import type { Request } from 'express';

class TrackingService {

  async createShipment(opts: {
    orderId:          number;
    courier:          string;
    trackingNumber?:  string;
    estimatedDelivery?: Date;
  }): Promise<Shipment> {
    const existing = await Shipment.findOne({ where: { orderId: opts.orderId } });
    if (existing) {
      await existing.update({
        courier:          opts.courier,
        trackingNumber:   opts.trackingNumber ?? existing.trackingNumber,
        estimatedDelivery: opts.estimatedDelivery ?? existing.estimatedDelivery,
        status:           'label_created',
      });
      return existing;
    }
    return Shipment.create({
      orderId:          opts.orderId,
      courier:          opts.courier,
      trackingNumber:   opts.trackingNumber ?? null,
      estimatedDelivery: opts.estimatedDelivery ?? null,
      status:           'label_created',
      failedAttempts:   0,
    });
  }

  async updateStatus(id: number, status: ShipmentStatus, event?: TrackingEvent): Promise<Shipment> {
    const shipment = await Shipment.findByPk(id, { include: [Order] });
    if (!shipment) throw new AppError('Shipment not found', 404);

    const updates: Partial<{ status: ShipmentStatus; deliveredAt: Date; failedAttempts: number; eventsJson: string }> = { status };

    if (status === 'delivered') updates.deliveredAt = new Date();
    if (status === 'failed_delivery') updates.failedAttempts = shipment.failedAttempts + 1;

    if (event) {
      shipment.addEvent(event);
      updates.eventsJson = shipment.eventsJson!;
    }

    await shipment.update(updates);
    return shipment;
  }

  async getShipments(req: Request) {
    const { page, limit, offset } = getPagination(req, 20);
    const where: Record<string, unknown> = {};

    if (req.query['status']) where['status'] = req.query['status'];
    if (req.query['courier']) where['courier'] = req.query['courier'];

    const { count, rows } = await Shipment.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit, offset,
      include: [{
        model: Order,
        attributes: ['id', 'orderNumber'],
        include: [{ model: User, attributes: ['id', 'name', 'email'], required: false }],
        required: false,
      }],
    });

    return {
      count,
      rows: rows.map(s => ({
        id:               s.id,
        orderId:          s.orderId,
        courier:          s.courier,
        trackingNumber:   s.trackingNumber,
        awbNumber:        s.awbNumber,
        status:           s.status,
        estimatedDelivery: s.estimatedDelivery,
        deliveredAt:      s.deliveredAt,
        failedAttempts:   s.failedAttempts,
        events:           s.events,
        createdAt:        s.createdAt,
        updatedAt:        s.updatedAt,
        order: s.order ? {
          orderNumber: s.order.orderNumber,
          user:        (s.order as any).user ? { name: (s.order as any).user.name } : null,
        } : null,
      })),
      page,
      limit,
    };
  }

  async getById(id: number): Promise<Shipment> {
    const s = await Shipment.findByPk(id, {
      include: [{ model: Order, include: [{ model: User, attributes: ['id', 'name', 'email'], required: false }] }],
    });
    if (!s) throw new AppError('Shipment not found', 404);
    return s;
  }

  async getByOrderId(orderId: number): Promise<Shipment | null> {
    return Shipment.findOne({ where: { orderId } });
  }

  async getStats() {
    const rows = await sequelize.query<{
      status: string; cnt: number;
    }>(
      `SELECT status, COUNT(*) AS cnt FROM shipments WHERE deleted_at IS NULL GROUP BY status`,
      { type: QueryTypes.SELECT },
    );

    const map: Record<string, number> = {};
    rows.forEach(r => { map[r.status] = Number(r.cnt); });

    const total     = Object.values(map).reduce((a, b) => a + b, 0);
    const delivered = map['delivered'] ?? 0;
    const inTransit = (map['in_transit'] ?? 0) + (map['out_for_delivery'] ?? 0) + (map['picked_up'] ?? 0);
    const failed    = map['failed_delivery'] ?? 0;
    const returned  = map['returned'] ?? 0;

    // Avg delivery days for delivered shipments
    const avgRows = await sequelize.query<{ avg_days: number }>(
      `SELECT AVG(DATEDIFF(delivered_at, created_at)) AS avg_days
       FROM shipments WHERE status = 'delivered' AND delivered_at IS NOT NULL AND deleted_at IS NULL`,
      { type: QueryTypes.SELECT },
    );
    const avgDeliveryDays = Number(avgRows[0]?.avg_days ?? 0);

    return { total, delivered, inTransit, failed, returned, avgDeliveryDays };
  }
}

export const trackingService = new TrackingService();

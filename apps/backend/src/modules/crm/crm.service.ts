import { Op, QueryTypes } from 'sequelize';
import { sequelize, User, Order, OrderItem } from '../../models';
import { getPagination } from '../../shared/utils/paginate.util';
import type { Request } from 'express';

function deriveSegment(totalOrders: number, totalSpent: number, lastOrderDaysAgo: number | null): string {
  if (totalOrders >= 5 || totalSpent >= 5000)   return 'vip';
  if (lastOrderDaysAgo === null)                 return 'new';
  if (lastOrderDaysAgo > 90)                     return 'churned';
  if (lastOrderDaysAgo > 60)                     return 'at_risk';
  if (totalOrders >= 2)                          return 'regular';
  return 'new';
}

class CrmService {

  async getCustomers(req: Request) {
    const { page, limit, offset } = getPagination(req, 20);
    const where: Record<string, unknown> = { role: 'customer' };
    if (req.query['q']) {
      const q = String(req.query['q']);
      where[Op.or as unknown as string] = [
        { name:  { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where, attributes: ['id', 'name', 'email', 'phone', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit, offset,
    });

    // Enrich with order stats
    const enriched = await Promise.all(rows.map(async (u) => {
      const [stats] = await sequelize.query<{
        total_orders: number; total_spent: number; last_order: string | null;
      }>(
        `SELECT COUNT(*) AS total_orders, COALESCE(SUM(total),0) AS total_spent,
                MAX(created_at) AS last_order
         FROM orders WHERE user_id = :uid AND status != 'cancelled' AND deleted_at IS NULL`,
        { replacements: { uid: u.id }, type: QueryTypes.SELECT },
      );

      const totalOrders = Number(stats?.total_orders ?? 0);
      const totalSpent  = Number(stats?.total_spent  ?? 0);
      const lastOrderAt = stats?.last_order ?? null;
      const daysAgo     = lastOrderAt
        ? Math.floor((Date.now() - new Date(lastOrderAt).getTime()) / 86400000)
        : null;
      const ltv         = Math.round(totalSpent * 1.2); // simple LTV estimate
      const segment     = deriveSegment(totalOrders, totalSpent, daysAgo);

      return {
        id: u.id, name: u.name, email: u.email, phone: u.phone,
        totalOrders, totalSpent, ltv, segment,
        lastOrderAt, joinedAt: u.createdAt,
      };
    }));

    return { count, rows: enriched, page, limit };
  }

  async getCustomerDetail(userId: number) {
    const user = await User.findByPk(userId, { attributes: ['id','name','email','phone','createdAt'] });
    if (!user) return null;

    const [stats] = await sequelize.query<{
      total_orders: number; total_spent: number; last_order: string | null;
    }>(
      `SELECT COUNT(*) AS total_orders, COALESCE(SUM(total),0) AS total_spent,
              MAX(created_at) AS last_order
       FROM orders WHERE user_id = :uid AND status != 'cancelled' AND deleted_at IS NULL`,
      { replacements: { uid: userId }, type: QueryTypes.SELECT },
    );

    const recentOrders = await Order.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'orderNumber', 'status', 'total', 'createdAt'],
    });

    const totalOrders = Number(stats?.total_orders ?? 0);
    const totalSpent  = Number(stats?.total_spent  ?? 0);
    const lastOrderAt = stats?.last_order ?? null;
    const daysAgo     = lastOrderAt ? Math.floor((Date.now() - new Date(lastOrderAt).getTime()) / 86400000) : null;
    const ltv         = Math.round(totalSpent * 1.2);
    const segment     = deriveSegment(totalOrders, totalSpent, daysAgo);

    return {
      ...user.toJSON(),
      totalOrders, totalSpent, ltv, segment, lastOrderAt,
      joinedAt: user.createdAt, recentOrders,
    };
  }

  async getSegmentCounts() {
    const rows = await sequelize.query<{ segment: string; cnt: number }>(
      `SELECT
         CASE
           WHEN (SELECT COUNT(*) FROM orders o2 WHERE o2.user_id = u.id AND o2.status != 'cancelled' AND o2.deleted_at IS NULL) >= 5
             OR (SELECT COALESCE(SUM(total),0) FROM orders o3 WHERE o3.user_id = u.id AND o3.status != 'cancelled' AND o3.deleted_at IS NULL) >= 5000
           THEN 'vip'
           WHEN (SELECT MAX(created_at) FROM orders o4 WHERE o4.user_id = u.id AND o4.deleted_at IS NULL) < DATE_SUB(NOW(), INTERVAL 90 DAY)
           THEN 'churned'
           WHEN (SELECT MAX(created_at) FROM orders o5 WHERE o5.user_id = u.id AND o5.deleted_at IS NULL) < DATE_SUB(NOW(), INTERVAL 60 DAY)
           THEN 'at_risk'
           WHEN (SELECT COUNT(*) FROM orders o6 WHERE o6.user_id = u.id AND o6.deleted_at IS NULL) >= 2
           THEN 'regular'
           ELSE 'new'
         END AS segment,
         COUNT(*) AS cnt
       FROM users u
       WHERE u.role = 'customer' AND u.deleted_at IS NULL
       GROUP BY segment`,
      { type: QueryTypes.SELECT },
    );
    return rows.map(r => ({ segment: r.segment, count: Number(r.cnt) }));
  }

  async getActivityLogs(req: Request) {
    const { page, limit, offset } = getPagination(req, 50);
    // Activity derived from order creation events
    const { count, rows } = await Order.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit, offset,
      include: [{ model: User, attributes: ['id', 'name', 'email'], required: false }],
      attributes: ['id', 'orderNumber', 'status', 'total', 'createdAt'],
    });
    return {
      count,
      rows: rows.map(o => ({
        id:       o.id,
        action:   `Order ${o.status} — #${o.orderNumber}`,
        total:    o.total,
        status:   o.status,
        customer: (o as any).user?.name ?? 'Guest',
        email:    (o as any).user?.email ?? '',
        time:     o.createdAt,
      })),
      page,
      limit,
    };
  }
}

export const crmService = new CrmService();

import { QueryTypes } from 'sequelize';
import { Op } from 'sequelize';
import { sequelize } from '../../models';
import {
  User, Order, OrderItem, Product, VendorProfile,
  NewsletterSubscriber,
} from '../../models';

// ─── Helpers ──────────────────────────────────────────────────
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateLabel(d: Date): string {
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function buildDateRange(days: number): { date: string; value: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const d = daysAgo(days - 1 - i);
    return { date: formatDateLabel(d), value: 0 };
  });
}

// ─── Summary KPI cards ────────────────────────────────────────
export async function getSummary() {
  const now    = new Date();
  const today  = daysAgo(0);
  const month  = daysAgo(30);
  const pMonth = daysAgo(60);

  const [
    totalUsers,
    totalOrders,
    totalRevenue,
    totalProducts,
    totalVendors,
    totalSubscribers,
    newUsersThisMonth,
    newUsersPrevMonth,
    revenueThisMonth,
    revenuePrevMonth,
    ordersThisMonth,
    ordersPrevMonth,
  ] = await Promise.all([
    User.count(),
    Order.count({ where: { status: { [Op.ne]: 'cancelled' } } }),
    Order.sum('total', { where: { status: { [Op.ne]: 'cancelled' } } }),
    Product.count({ where: { status: 'active' } }),
    VendorProfile.count({ where: { status: 'active' } }),
    NewsletterSubscriber.count({ where: { isActive: true } }),
    User.count({ where: { createdAt: { [Op.gte]: month } } }),
    User.count({ where: { createdAt: { [Op.between]: [pMonth, month] } } }),
    Order.sum('total',     { where: { createdAt: { [Op.gte]: month }, status: { [Op.ne]: 'cancelled' } } }),
    Order.sum('total',     { where: { createdAt: { [Op.between]: [pMonth, month] }, status: { [Op.ne]: 'cancelled' } } }),
    Order.count(           { where: { createdAt: { [Op.gte]: month }, status: { [Op.ne]: 'cancelled' } } }),
    Order.count(           { where: { createdAt: { [Op.between]: [pMonth, month] }, status: { [Op.ne]: 'cancelled' } } }),
  ]);

  function pctChange(curr: number, prev: number) {
    if (!prev) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  return {
    totalUsers,
    totalOrders,
    totalRevenue:  Number(totalRevenue ?? 0),
    totalProducts,
    totalVendors,
    totalSubscribers,
    revenueThisMonth:   Number(revenueThisMonth  ?? 0),
    ordersThisMonth,
    revenueChange:  pctChange(Number(revenueThisMonth ?? 0),  Number(revenuePrevMonth ?? 0)),
    ordersChange:   pctChange(ordersThisMonth,  ordersPrevMonth),
    usersChange:    pctChange(newUsersThisMonth, newUsersPrevMonth),
  };
}

// ─── Revenue over last N days ─────────────────────────────────
export async function getRevenueTrend(days = 30) {
  const from = daysAgo(days - 1);

  const rows = await sequelize.query<{ day: string; revenue: number; orders: number }>(
    `SELECT DATE(created_at) AS day,
            SUM(total)       AS revenue,
            COUNT(*)         AS orders
     FROM   orders
     WHERE  created_at >= :from
       AND  deleted_at IS NULL
       AND  status != 'cancelled'
     GROUP  BY DATE(created_at)
     ORDER  BY day ASC`,
    { replacements: { from }, type: QueryTypes.SELECT },
  );

  const map = new Map(rows.map(r => [r.day, r]));
  const series = buildDateRange(days).map(slot => {
    const isoDay = `${new Date().getFullYear()}-${slot.date.split('/').reverse().join('-')}`;
    const match  = rows.find(r => r.day === isoDay);
    return { date: slot.date, revenue: Number(match?.revenue ?? 0), orders: Number(match?.orders ?? 0) };
  });

  return series;
}

// ─── User signups over last N days ───────────────────────────
export async function getUserTrend(days = 30) {
  const from = daysAgo(days - 1);

  const rows = await sequelize.query<{ day: string; signups: number }>(
    `SELECT DATE(created_at) AS day, COUNT(*) AS signups
     FROM   users
     WHERE  created_at >= :from AND deleted_at IS NULL
     GROUP  BY DATE(created_at)
     ORDER  BY day ASC`,
    { replacements: { from }, type: QueryTypes.SELECT },
  );

  return buildDateRange(days).map(slot => {
    const isoDay = `${new Date().getFullYear()}-${slot.date.split('/').reverse().join('-')}`;
    const match  = rows.find(r => r.day === isoDay);
    return { date: slot.date, signups: Number(match?.signups ?? 0) };
  });
}

// ─── Top products by revenue ──────────────────────────────────
export async function getTopProducts(limit = 10) {
  return sequelize.query<{
    productId: number; name: string; slug: string;
    revenue: number; unitsSold: number;
  }>(
    `SELECT oi.product_id     AS productId,
            p.name,
            p.slug,
            SUM(oi.line_total) AS revenue,
            SUM(oi.qty)        AS unitsSold
     FROM   order_items oi
     JOIN   products    p  ON p.id = oi.product_id
     JOIN   orders      o  ON o.id = oi.order_id
     WHERE  o.status != 'cancelled'
       AND  o.deleted_at IS NULL
     GROUP  BY oi.product_id, p.name, p.slug
     ORDER  BY revenue DESC
     LIMIT  :limit`,
    { replacements: { limit }, type: QueryTypes.SELECT },
  );
}

// ─── Top vendors by revenue ───────────────────────────────────
export async function getTopVendors(limit = 10) {
  return sequelize.query<{
    vendorId: number; storeName: string; storeSlug: string;
    revenue: number; orderCount: number;
  }>(
    `SELECT vp.id          AS vendorId,
            vp.store_name  AS storeName,
            vp.store_slug  AS storeSlug,
            SUM(oi.line_total) AS revenue,
            COUNT(DISTINCT oi.order_id) AS orderCount
     FROM   order_items oi
     JOIN   products    p  ON p.id = oi.product_id AND p.vendor_id IS NOT NULL
     JOIN   vendor_profiles vp ON vp.id = p.vendor_id
     JOIN   orders      o  ON o.id = oi.order_id AND o.status != 'cancelled' AND o.deleted_at IS NULL
     GROUP  BY vp.id, vp.store_name, vp.store_slug
     ORDER  BY revenue DESC
     LIMIT  :limit`,
    { replacements: { limit }, type: QueryTypes.SELECT },
  );
}

// ─── Order status breakdown ────────────────────────────────────
export async function getOrderStatusBreakdown() {
  const rows = await sequelize.query<{ status: string; count: number }>(
    `SELECT status, COUNT(*) AS count
     FROM   orders
     WHERE  deleted_at IS NULL
     GROUP  BY status`,
    { type: QueryTypes.SELECT },
  );
  return rows.map(r => ({ status: r.status, count: Number(r.count) }));
}

// ─── Category revenue breakdown ───────────────────────────────
export async function getCategoryBreakdown() {
  return sequelize.query<{ categoryName: string; revenue: number; units: number }>(
    `SELECT c.name            AS categoryName,
            SUM(oi.line_total) AS revenue,
            SUM(oi.qty)        AS units
     FROM   order_items oi
     JOIN   products    p  ON p.id = oi.product_id
     JOIN   categories  c  ON c.id = p.category_id
     JOIN   orders      o  ON o.id = oi.order_id AND o.status != 'cancelled' AND o.deleted_at IS NULL
     GROUP  BY c.id, c.name
     ORDER  BY revenue DESC
     LIMIT  10`,
    { type: QueryTypes.SELECT },
  );
}

// ─── Recent orders feed ───────────────────────────────────────
export async function getRecentOrders(limit = 10) {
  return Order.findAll({
    order: [['createdAt', 'DESC']],
    limit,
    include: [
      { model: User, attributes: ['id', 'name', 'email'] },
    ],
    attributes: ['id', 'orderNumber', 'total', 'status', 'createdAt'],
  });
}

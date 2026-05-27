import { Op, literal } from 'sequelize';
import { sequelize } from '../../models/index';
import { LoyaltyPoint, LoyaltyType } from '../../models/loyaltyPoint.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middleware/errorHandler.middleware';

// 1 point = ₹0.01  →  100 points = ₹1
// Earn rate: 1 point per ₹10 spent  →  points = Math.floor(orderTotal / 10)
// Redeem cap: max 20% of order total (in paise equivalent: points * 0.01)
const EARN_RATE    = 10;   // ₹10 per point
const REDEEM_RATE  = 100;  // 100 points = ₹1
const EXPIRY_DAYS  = 365;  // earned points expire in 1 year

export const loyaltyService = {

  /** Earn points for an order delivery */
  async earn(
    userId: number,
    orderTotal: number,
    description: string,
    referenceType = 'order',
    referenceId?: number,
  ): Promise<void> {
    const points = Math.floor(orderTotal / EARN_RATE);
    if (points <= 0) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

    await sequelize.transaction(async t => {
      await LoyaltyPoint.create({
        userId, points, type: 'earn', description, referenceType, referenceId, expiresAt,
      }, { transaction: t });

      await User.increment('loyaltyBalance', { by: points, where: { id: userId }, transaction: t });
    });
  },

  /** Redeem points at checkout — returns rupee discount amount */
  async redeem(userId: number, points: number, orderId: number): Promise<number> {
    if (points <= 0) throw new AppError('Points must be > 0', 400);

    const user = await User.findByPk(userId, { attributes: ['id', 'loyaltyBalance'] });
    if (!user) throw new AppError('User not found', 404);
    if ((user as any).loyaltyBalance < points) throw new AppError('Insufficient loyalty points', 400);

    const discount = Math.floor(points / REDEEM_RATE); // rupees

    await sequelize.transaction(async t => {
      await LoyaltyPoint.create({
        userId, points: -points, type: 'redeem',
        description: `Redeemed at order #${orderId}`,
        referenceType: 'order', referenceId: orderId,
      }, { transaction: t });

      await User.decrement('loyaltyBalance', { by: points, where: { id: userId }, transaction: t });
    });

    return discount;
  },

  /** Get current balance */
  async getBalance(userId: number): Promise<number> {
    const user = await User.findByPk(userId, { attributes: ['loyaltyBalance'] });
    return (user as any)?.loyaltyBalance ?? 0;
  },

  /** Paginated history */
  async getHistory(userId: number, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await LoyaltyPoint.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { rows, count };
  },

  /** Admin: adjust points manually */
  async adjust(userId: number, points: number, description: string): Promise<void> {
    const user = await User.findByPk(userId, { attributes: ['id', 'loyaltyBalance'] });
    if (!user) throw new AppError('User not found', 404);

    const newBalance = ((user as any).loyaltyBalance ?? 0) + points;
    if (newBalance < 0) throw new AppError('Adjustment would result in negative balance', 400);

    await sequelize.transaction(async t => {
      await LoyaltyPoint.create({
        userId, points, type: 'admin', description,
      }, { transaction: t });
      if (points > 0) {
        await User.increment('loyaltyBalance', { by: points,  where: { id: userId }, transaction: t });
      } else {
        await User.decrement('loyaltyBalance', { by: -points, where: { id: userId }, transaction: t });
      }
    });
  },

  /** Expire points past their expiry date (run via cron) */
  async expire(): Promise<number> {
    const now = new Date();

    // Find users with active unexpired earn entries
    const expiring = await LoyaltyPoint.findAll({
      where: {
        type: 'earn',
        expiresAt: { [Op.lte]: now },
        // Only if user still has balance — rough guard
      },
      attributes: ['userId', [literal('SUM(points)'), 'totalExpiring']],
      group: ['userId'],
      raw: true,
    }) as any[];

    let expired = 0;
    for (const row of expiring) {
      const pts = parseInt(row.totalExpiring, 10);
      if (pts <= 0) continue;

      const user = await User.findByPk(row.userId, { attributes: ['id', 'loyaltyBalance'] });
      if (!user) continue;
      const deduct = Math.min(pts, (user as any).loyaltyBalance ?? 0);
      if (deduct <= 0) continue;

      await sequelize.transaction(async t => {
        await LoyaltyPoint.create({
          userId: row.userId, points: -deduct, type: 'expire',
          description: 'Points expired',
        }, { transaction: t });
        await User.decrement('loyaltyBalance', { by: deduct, where: { id: row.userId }, transaction: t });
        // Mark original earn entries deleted so they don't re-trigger
        await LoyaltyPoint.destroy({
          where: { userId: row.userId, type: 'earn', expiresAt: { [Op.lte]: now } },
          transaction: t,
        });
      });
      expired += deduct;
    }
    return expired;
  },

  /** Admin list */
  async adminList(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await LoyaltyPoint.findAndCountAll({
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { rows, count };
  },

  REDEEM_RATE,
  EARN_RATE,
};

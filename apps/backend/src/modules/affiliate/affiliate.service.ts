import { Op } from 'sequelize';
import { sequelize } from '../../models/index';
import { Affiliate, AffiliateClick, AffiliateConversion } from '../../models/affiliate.model';
import { User }  from '../../models/user.model';
import { Order } from '../../models/order.model';
import { AppError } from '../../middleware/errorHandler.middleware';
import { randomBytes } from 'crypto';

const DEFAULT_RATE = 5; // 5%

export const affiliateService = {

  // ── Public / user ─────────────────────────────────────────────────────────

  /** Record a click and return the affiliate for cookie setting */
  async trackClick(code: string, ip?: string, referrerUrl?: string, userAgent?: string): Promise<Affiliate | null> {
    const aff = await Affiliate.findOne({ where: { code, status: 'active' } });
    if (!aff) return null;

    await AffiliateClick.create({ affiliateId: aff.id, ip: ip ?? null, referrerUrl: referrerUrl ?? null, userAgent: userAgent ?? null });
    await Affiliate.increment('totalClicks', { by: 1, where: { id: aff.id } });
    return aff;
  },

  /** Called from order creation when affiliate cookie is present */
  async recordConversion(orderId: number, code: string, orderTotal: number): Promise<void> {
    const aff = await Affiliate.findOne({ where: { code, status: 'active' } });
    if (!aff) return;

    // Idempotent — one conversion per order
    const existing = await AffiliateConversion.findOne({ where: { orderId } });
    if (existing) return;

    const commissionAmount = parseFloat(((orderTotal * Number(aff.commissionRate)) / 100).toFixed(2));

    await AffiliateConversion.create({
      affiliateId:      aff.id,
      orderId,
      orderTotal,
      commissionAmount,
      status: 'pending',
    });
  },

  /** Apply to become an affiliate */
  async apply(userId: number): Promise<Affiliate> {
    const existing = await Affiliate.findOne({ where: { userId } });
    if (existing) throw new AppError('You already have an affiliate account', 400);

    const code = randomBytes(5).toString('hex').toUpperCase(); // 10-char hex
    return Affiliate.create({ userId, code, commissionRate: DEFAULT_RATE, status: 'pending' });
  },

  /** Get my affiliate stats */
  async getMyStats(userId: number) {
    const aff = await Affiliate.findOne({
      where: { userId },
      include: [
        { model: AffiliateConversion, order: [['createdAt', 'DESC']], limit: 20 },
      ],
    });
    if (!aff) return null;

    const pendingEarnings = await AffiliateConversion.sum('commission_amount', {
      where: { affiliateId: aff.id, status: 'pending' },
    }) ?? 0;
    const approvedEarnings = await AffiliateConversion.sum('commission_amount', {
      where: { affiliateId: aff.id, status: 'approved' },
    }) ?? 0;

    return {
      id:               aff.id,
      code:             aff.code,
      affiliateUrl:     `${process.env['FRONTEND_URL'] ?? 'https://lagaao.com'}/aff/${aff.code}`,
      status:           aff.status,
      commissionRate:   aff.commissionRate,
      totalClicks:      aff.totalClicks,
      totalEarnings:    aff.totalEarnings,
      paidOut:          aff.paidOut,
      pendingEarnings,
      approvedEarnings,
      balance:          Number(aff.totalEarnings) - Number(aff.paidOut),
      conversions:      aff.conversions ?? [],
    };
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

  async adminList(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await Affiliate.findAndCountAll({
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { rows, count };
  },

  async updateStatus(id: number, status: 'active' | 'suspended', commissionRate?: number, notes?: string): Promise<Affiliate> {
    const aff = await Affiliate.findByPk(id);
    if (!aff) throw new AppError('Affiliate not found', 404);
    const updates: Partial<Affiliate> = { status };
    if (commissionRate !== undefined) (updates as any).commissionRate = commissionRate;
    if (notes !== undefined)          (updates as any).notes          = notes;
    await aff.update(updates);
    return aff;
  },

  /** Approve pending conversions for delivered orders */
  async approveConversions(): Promise<number> {
    // Find pending conversions whose order is delivered
    const pending = await AffiliateConversion.findAll({
      where: { status: 'pending' },
      include: [{ model: Order, attributes: ['id', 'status'] }],
    });

    let approved = 0;
    for (const conv of pending) {
      if ((conv as any).order?.status === 'delivered') {
        await sequelize.transaction(async t => {
          await conv.update({ status: 'approved' }, { transaction: t });
          await Affiliate.increment('totalEarnings', {
            by: conv.commissionAmount,
            where: { id: conv.affiliateId },
            transaction: t,
          });
        });
        approved++;
      }
    }
    return approved;
  },

  /** Mark approved conversions as paid and record paidOut */
  async markPaid(affiliateId: number): Promise<number> {
    const aff = await Affiliate.findByPk(affiliateId);
    if (!aff) throw new AppError('Affiliate not found', 404);

    const approved = await AffiliateConversion.findAll({
      where: { affiliateId, status: 'approved' },
    });
    if (!approved.length) throw new AppError('No approved conversions to pay', 400);

    const total = approved.reduce((s, c) => s + Number(c.commissionAmount), 0);

    await sequelize.transaction(async t => {
      for (const conv of approved) {
        await conv.update({ status: 'paid' }, { transaction: t });
      }
      await Affiliate.increment('paidOut', { by: total, where: { id: affiliateId }, transaction: t });
    });

    return total;
  },

  async getPendingConversions(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await AffiliateConversion.findAndCountAll({
      where: { status: ['pending', 'approved'] },
      include: [
        { model: Affiliate, include: [{ model: User, attributes: ['id', 'name', 'email'] }] },
        { model: Order, attributes: ['id', 'orderNumber', 'status', 'total'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    return { rows, count };
  },
};

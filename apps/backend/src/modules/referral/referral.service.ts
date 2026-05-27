import crypto from 'crypto';
import { Op } from 'sequelize';
import { Referral } from '../../models/referral.model';
import { User } from '../../models/user.model';
import { Order } from '../../models/order.model';
import { walletService } from '../wallet/wallet.service';
import { AppError } from '../../middleware/errorHandler.middleware';
import { logger } from '../../config/logger';
import type { Transaction } from 'sequelize';

// Reward amounts (configurable)
const REFERRER_REWARD = 100;   // ₹100 wallet credit to referrer
const REFEREE_REWARD  = 50;    // ₹50 wallet credit to new user on first order

export class ReferralService {

  /** Generate a unique 8-char alphanumeric code */
  async generateCode(userId: number): Promise<string> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.referralCode) return user.referralCode;

    let code: string;
    let attempts = 0;
    do {
      code = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F91C42"
      attempts++;
      if (attempts > 20) throw new AppError('Could not generate unique referral code', 500);
    } while (await User.findOne({ where: { referralCode: code } }));

    await user.update({ referralCode: code });
    return code;
  }

  /** Called at registration — record that this user was referred */
  async recordReferral(referredUserId: number, code: string): Promise<void> {
    const referrer = await User.findOne({ where: { referralCode: code.toUpperCase() } });
    if (!referrer) return; // invalid code — silently ignore

    if (referrer.id === referredUserId) return; // can't refer yourself

    // Idempotent — only create if not already exists
    const existing = await Referral.findOne({ where: { referredId: referredUserId } });
    if (existing) return;

    await Referral.create({
      referrerId:   referrer.id,
      referredId:   referredUserId,
      code:         code.toUpperCase(),
      status:       'pending',
      rewardAmount: REFERRER_REWARD,
    });
    logger.info(`Referral recorded: user ${referredUserId} referred by ${referrer.id} (code: ${code})`);
  }

  /** Called on a user's first completed order — rewards both parties */
  async processFirstOrderReward(userId: number, t?: Transaction): Promise<void> {
    // Only trigger on first ever order
    const orderCount = await Order.count({ where: { userId } });
    if (orderCount > 1) return; // this is not their first order

    const referral = await Referral.findOne({
      where: { referredId: userId, status: 'pending' },
    });
    if (!referral) return; // no referral on record

    // Credit referrer
    await walletService.credit({
      userId:        referral.referrerId,
      amount:        Number(referral.rewardAmount),
      type:          'cashback',
      description:   `Referral reward — friend made their first order`,
      referenceType: 'referral',
      referenceId:   referral.id,
    });

    // Credit referee (the new user)
    await walletService.credit({
      userId:        userId,
      amount:        REFEREE_REWARD,
      type:          'cashback',
      description:   `Welcome reward for joining via referral`,
      referenceType: 'referral',
      referenceId:   referral.id,
    });

    await referral.update({ status: 'rewarded', rewardedAt: new Date() });
    logger.info(`Referral rewarded: referrer ${referral.referrerId} +₹${referral.rewardAmount}, referee ${userId} +₹${REFEREE_REWARD}`);
  }

  /** User: get own referral stats */
  async getStats(userId: number): Promise<{
    code: string;
    referralUrl: string;
    totalReferrals: number;
    converted: number;
    totalEarned: number;
    referrals: Referral[];
  }> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found', 404);

    const code = user.referralCode ?? await this.generateCode(userId);

    const referrals = await Referral.findAll({
      where: { referrerId: userId },
      include: [{ model: User, as: 'referred', attributes: ['id', 'name', 'createdAt'] }],
      order: [['createdAt', 'DESC']],
    });

    const converted   = referrals.filter(r => r.status === 'rewarded').length;
    const totalEarned = referrals
      .filter(r => r.status === 'rewarded')
      .reduce((sum, r) => sum + Number(r.rewardAmount), 0);

    return {
      code,
      referralUrl:    `https://lagaao.com/ref/${code}`,
      totalReferrals: referrals.length,
      converted,
      totalEarned,
      referrals,
    };
  }

  /** Validate a referral code exists (used in registration) */
  async validateCode(code: string): Promise<boolean> {
    const user = await User.findOne({ where: { referralCode: code.toUpperCase() } });
    return !!user;
  }

  /** Admin: list all referrals */
  async adminList(page = 1, limit = 20): Promise<{ rows: Referral[]; count: number }> {
    const offset = (page - 1) * limit;
    return Referral.findAndCountAll({
      include: [
        { model: User, as: 'referrer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'referred', attributes: ['id', 'name', 'email', 'createdAt'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
  }
}

export const referralService = new ReferralService();

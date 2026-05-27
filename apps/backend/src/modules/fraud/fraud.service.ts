import { Op } from 'sequelize';
import { Order } from '../../models/order.model';
import { User }  from '../../models/user.model';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface FraudResult {
  score:     number;        // 0–100
  flags:     string[];
  riskLevel: RiskLevel;
  action:    'pass' | 'review' | 'hold';
}

interface FraudInput {
  userId:          number;
  ipAddress?:      string;
  total:           number;
  paymentMethod:   string;
  shippingAddress: Record<string, string>;
  billingAddress?: Record<string, string>;
}

// Score thresholds
const HOLD_THRESHOLD   = 70;
const REVIEW_THRESHOLD = 40;

// Individual rule weights
const RULES = {
  HIGH_VELOCITY_IP:       35, // >3 orders/hour same IP
  HIGH_VELOCITY_USER:     25, // >5 orders/day same user
  NEW_ACCOUNT_HIGH_VALUE: 20, // account <24h + order >₹2000
  COD_HIGH_VALUE:         20, // COD above ₹3000
  MULTIPLE_ADDRESSES:     15, // >3 distinct shipping addresses in 30 days
  LARGE_SINGLE_ORDER:     10, // single order >₹10000
  FAILED_PAYMENT_HISTORY: 15, // >2 failed payments this week
} as const;

export const fraudService = {

  async evaluate(input: FraudInput): Promise<FraudResult> {
    const flags: string[] = [];
    let score = 0;

    const now   = new Date();
    const hour  = new Date(now.getTime() - 60 * 60 * 1000);
    const day   = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const week  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ── Rule 1: IP velocity ────────────────────────────────────────────────
    if (input.ipAddress) {
      const ipOrders = await Order.count({
        where: {
          ipAddress:  input.ipAddress,
          createdAt:  { [Op.gte]: hour },
          deletedAt:  null,
        } as any,
      });
      if (ipOrders >= 3) {
        score += RULES.HIGH_VELOCITY_IP;
        flags.push(`IP velocity: ${ipOrders + 1} orders/hour from ${input.ipAddress}`);
      }
    }

    // ── Rule 2: User order velocity ────────────────────────────────────────
    const dailyOrders = await Order.count({
      where: { userId: input.userId, createdAt: { [Op.gte]: day } },
    });
    if (dailyOrders >= 5) {
      score += RULES.HIGH_VELOCITY_USER;
      flags.push(`User velocity: ${dailyOrders + 1} orders today`);
    }

    // ── Rule 3: New account + high value ──────────────────────────────────
    const user = await User.findByPk(input.userId, { attributes: ['createdAt'] });
    if (user) {
      const accountAge = now.getTime() - new Date((user as any).createdAt).getTime();
      const isNew = accountAge < 24 * 60 * 60 * 1000; // < 24 hours
      if (isNew && input.total > 2000) {
        score += RULES.NEW_ACCOUNT_HIGH_VALUE;
        flags.push(`New account (<24h) with high-value order ₹${input.total}`);
      }
    }

    // ── Rule 4: COD high value ────────────────────────────────────────────
    if (input.paymentMethod === 'cod' && input.total > 3000) {
      score += RULES.COD_HIGH_VALUE;
      flags.push(`COD order above ₹3000 (₹${input.total})`);
    }

    // ── Rule 5: Multiple shipping addresses ───────────────────────────────
    const recentAddresses = await Order.findAll({
      where: { userId: input.userId, createdAt: { [Op.gte]: month } },
      attributes: ['shippingAddress'],
      raw: true,
    });
    const uniquePincodes = new Set(
      recentAddresses.map(o => {
        const addr = (o as any).shippingAddress;
        return typeof addr === 'string' ? JSON.parse(addr).pincode : addr?.pincode;
      }).filter(Boolean)
    );
    if (uniquePincodes.size > 3) {
      score += RULES.MULTIPLE_ADDRESSES;
      flags.push(`${uniquePincodes.size} distinct delivery pincodes in 30 days`);
    }

    // ── Rule 6: Large single order ────────────────────────────────────────
    if (input.total > 10000) {
      score += RULES.LARGE_SINGLE_ORDER;
      flags.push(`Large single order: ₹${input.total}`);
    }

    // ── Rule 7: Failed payment history ────────────────────────────────────
    const failedPayments = await Order.count({
      where: {
        userId:        input.userId,
        paymentStatus: 'failed',
        createdAt:     { [Op.gte]: week },
      },
    });
    if (failedPayments >= 2) {
      score += RULES.FAILED_PAYMENT_HISTORY;
      flags.push(`${failedPayments} failed payments this week`);
    }

    // ── Score cap and action mapping ──────────────────────────────────────
    score = Math.min(score, 100);

    let riskLevel: RiskLevel;
    let action: FraudResult['action'];

    if (score >= HOLD_THRESHOLD) {
      riskLevel = 'high';
      action    = 'hold';
    } else if (score >= REVIEW_THRESHOLD) {
      riskLevel = 'medium';
      action    = 'review';
    } else {
      riskLevel = 'low';
      action    = 'pass';
    }

    return { score, flags, riskLevel, action };
  },

  /** Admin: approve a held order — set status back to 'pending' */
  async approveOrder(orderId: number): Promise<void> {
    await Order.update(
      { status: 'pending', riskLevel: 'low' } as any,
      { where: { id: orderId } }
    );
  },

  /** Admin: reject (cancel) a held order */
  async rejectOrder(orderId: number): Promise<void> {
    await Order.update(
      { status: 'cancelled' } as any,
      { where: { id: orderId } }
    );
  },

  /** Fraud queue: orders in fraud_review or high risk */
  async getFraudQueue(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await Order.findAndCountAll({
      where: {
        [Op.or]: [
          { status: 'fraud_review' },
          { riskLevel: 'high' } as any,
          { riskLevel: 'medium' } as any,
        ],
      },
      order: [['fraudScore', 'DESC']],
      limit,
      offset,
    });
    return { rows, count };
  },
};

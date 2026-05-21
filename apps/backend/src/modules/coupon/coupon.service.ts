import { Op } from 'sequelize';
import { Coupon } from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';

export interface CouponResult {
  code:         string;
  type:         string;
  value:        number;
  discount:     number;
  description:  string;
}

export class CouponService {

  async validate(code: string, subtotal: number): Promise<CouponResult> {
    const coupon = await Coupon.findOne({
      where: {
        code:     code.toUpperCase().trim(),
        isActive: true,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } },
        ],
      },
    });

    if (!coupon) throw new AppError('Invalid or expired coupon code', 400);

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new AppError('This coupon has reached its usage limit', 400);
    }

    const minOrder = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;
    if (subtotal < minOrder) {
      throw new AppError(`Minimum order value of ₹${minOrder} required for this coupon`, 400);
    }

    let discount: number;
    if (coupon.type === 'percent') {
      discount = (subtotal * Number(coupon.value)) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else {
      discount = Math.min(Number(coupon.value), subtotal);
    }

    discount = Math.round(discount * 100) / 100;

    const description = coupon.type === 'percent'
      ? `${coupon.value}% off${coupon.maxDiscount ? ` (up to ₹${coupon.maxDiscount})` : ''}`
      : `₹${coupon.value} off`;

    return {
      code:        coupon.code,
      type:        coupon.type,
      value:       Number(coupon.value),
      discount,
      description,
    };
  }

  async markUsed(code: string): Promise<void> {
    await Coupon.increment('usedCount', { where: { code: code.toUpperCase().trim() } });
  }

  async create(data: {
    code: string; type: 'percent' | 'fixed'; value: number;
    minOrderValue?: number; maxDiscount?: number;
    maxUses?: number; maxUsesPerUser?: number; expiresAt?: Date;
  }): Promise<Coupon> {
    return Coupon.create({ ...data, code: data.code.toUpperCase().trim(), isActive: true });
  }

  async list(): Promise<Coupon[]> {
    return Coupon.findAll({ order: [['createdAt', 'DESC']] });
  }

  async toggle(id: number, isActive: boolean): Promise<void> {
    await Coupon.update({ isActive }, { where: { id } });
  }
}

export const couponService = new CouponService();

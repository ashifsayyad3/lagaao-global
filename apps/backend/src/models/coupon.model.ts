import {
  Table, Column, Model, DataType,
} from 'sequelize-typescript';

export type CouponType = 'percent' | 'fixed';

@Table({ tableName: 'coupons', paranoid: true })
export class Coupon extends Model {
  @Column({ type: DataType.STRING(64), allowNull: false, unique: true })
  code!: string;

  @Column({ type: DataType.ENUM('percent', 'fixed'), allowNull: false })
  type!: CouponType;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  value!: number;

  // Minimum order value to use this coupon
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true, defaultValue: 0 })
  minOrderValue!: number | null;

  // Maximum discount cap (for percent coupons)
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  maxDiscount!: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  maxUses!: number | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  usedCount!: number;

  // Max uses per user
  @Column({ type: DataType.INTEGER, allowNull: true, defaultValue: 1 })
  maxUsesPerUser!: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  expiresAt!: Date | null;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  isActive!: boolean;
}

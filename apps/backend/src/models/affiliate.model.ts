import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo, HasMany,
  CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { User }  from './user.model';
import { Order } from './order.model';

export type AffiliateStatus    = 'pending' | 'active' | 'suspended';
export type ConversionStatus   = 'pending' | 'approved' | 'paid' | 'cancelled';

// ── Affiliate ─────────────────────────────────────────────────────────────────

@Table({ tableName: 'affiliates', underscored: true, paranoid: true })
export class Affiliate extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.STRING(32), allowNull: false, unique: true })
  declare code: string;

  @Column({ type: DataType.DECIMAL(5, 2), allowNull: false, defaultValue: 5.00 })
  declare commissionRate: number;

  @Column({ type: DataType.ENUM('pending', 'active', 'suspended'), defaultValue: 'pending' })
  declare status: AffiliateStatus;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare totalClicks: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare totalEarnings: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, defaultValue: 0 })
  declare paidOut: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

  @HasMany(() => AffiliateClick)
  declare clicks: AffiliateClick[];

  @HasMany(() => AffiliateConversion)
  declare conversions: AffiliateConversion[];

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;
}

// ── AffiliateClick ────────────────────────────────────────────────────────────

@Table({ tableName: 'affiliate_clicks', underscored: true, paranoid: false, timestamps: false })
export class AffiliateClick extends Model {
  @ForeignKey(() => Affiliate)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare affiliateId: number;

  @BelongsTo(() => Affiliate)
  declare affiliate: Affiliate;

  @Column({ type: DataType.STRING(45), allowNull: true })
  declare ip: string | null;

  @Column({ type: DataType.STRING(512), allowNull: true })
  declare referrerUrl: string | null;

  @Column({ type: DataType.STRING(512), allowNull: true })
  declare userAgent: string | null;

  @CreatedAt declare createdAt: Date;
}

// ── AffiliateConversion ───────────────────────────────────────────────────────

@Table({ tableName: 'affiliate_conversions', underscored: true, paranoid: true })
export class AffiliateConversion extends Model {
  @ForeignKey(() => Affiliate)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare affiliateId: number;

  @BelongsTo(() => Affiliate)
  declare affiliate: Affiliate;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  declare orderId: number;

  @BelongsTo(() => Order)
  declare order: Order;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare orderTotal: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare commissionAmount: number;

  @Column({ type: DataType.ENUM('pending', 'approved', 'paid', 'cancelled'), defaultValue: 'pending' })
  declare status: ConversionStatus;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;
}

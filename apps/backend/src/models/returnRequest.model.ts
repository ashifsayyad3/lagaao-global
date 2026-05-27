import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo,
  CreatedAt, UpdatedAt, DeletedAt, AllowNull, Default,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Order } from './order.model';

export type ReturnReason =
  | 'damaged' | 'wrong_item' | 'not_as_described'
  | 'changed_mind' | 'quality_issue' | 'other';

export type ReturnStatus =
  | 'pending' | 'under_review' | 'approved' | 'rejected'
  | 'pickup_scheduled' | 'picked_up' | 'refund_initiated' | 'refund_completed' | 'closed';

export type RefundMethod = 'original' | 'wallet';

@Table({ tableName: 'return_requests', underscored: true, paranoid: true })
export class ReturnRequest extends Model {
  @ForeignKey(() => Order)
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare orderId: number;

  @BelongsTo(() => Order)
  declare order: Order;

  @AllowNull(true)
  @Column(DataType.INTEGER.UNSIGNED)
  declare orderItemId: number | null;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare userId: number;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'customer' })
  declare customer: User;

  @AllowNull(false)
  @Column(DataType.ENUM('damaged', 'wrong_item', 'not_as_described', 'changed_mind', 'quality_issue', 'other'))
  declare reason: ReturnReason;

  @Column(DataType.TEXT)
  declare description: string | null;

  @Column(DataType.JSON)
  declare images: string[] | null;

  @AllowNull(false)
  @Default('pending')
  @Column(DataType.ENUM('pending', 'under_review', 'approved', 'rejected',
    'pickup_scheduled', 'picked_up', 'refund_initiated', 'refund_completed', 'closed'))
  declare status: ReturnStatus;

  @Column(DataType.ENUM('original', 'wallet'))
  declare refundMethod: RefundMethod | null;

  @Column(DataType.DECIMAL(12, 2))
  declare refundAmount: number | null;

  @Column(DataType.STRING(64))
  declare refundId: string | null;

  @Column(DataType.TEXT)
  declare adminNote: string | null;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER.UNSIGNED)
  declare reviewedBy: number | null;

  @BelongsTo(() => User, { foreignKey: 'reviewedBy', as: 'reviewer' })
  declare reviewer: User;

  @Column(DataType.DATE)
  declare reviewedAt: Date | null;

  @Column(DataType.DATEONLY)
  declare pickupDate: string | null;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date;
}

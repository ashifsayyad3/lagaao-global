import {
  Table, Column, Model, DataType, BelongsTo, ForeignKey,
} from 'sequelize-typescript';
import { User } from './user.model';

export type EmailStatus = 'queued' | 'sent' | 'failed';
export type EmailType =
  | 'welcome' | 'order_confirmed' | 'order_shipped' | 'order_delivered'
  | 'order_cancelled' | 'payment_receipt' | 'refund_processed'
  | 'password_reset' | 'otp' | 'vendor_approved' | 'vendor_rejected'
  | 'newsletter' | 'campaign' | 'broadcast';

@Table({ tableName: 'email_logs', timestamps: true, paranoid: false })
export class EmailLog extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare userId: number | null;

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare type: EmailType;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare toEmail: string;

  @Column({ type: DataType.STRING(500), allowNull: false })
  declare subject: string;

  @Column({ type: DataType.ENUM('queued', 'sent', 'failed'), defaultValue: 'queued' })
  declare status: EmailStatus;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare messageId: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare errorMessage: string | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare retryCount: number;

  @Column({ type: DataType.DATE, allowNull: true })
  declare sentAt: Date | null;

  // Metadata: orderId, vendorId, etc. stored as JSON string
  @Column({ type: DataType.TEXT, allowNull: true })
  declare metadata: string | null;

  @BelongsTo(() => User)
  declare user: User;
}

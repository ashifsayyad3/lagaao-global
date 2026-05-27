import {
  Table, Column, Model, DataType,
  BelongsTo, ForeignKey,
} from 'sequelize-typescript';
import { User }  from './user.model';
import { Order } from './order.model';

export type TxStatus =
  | 'created'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type TxMethod = 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';

@Table({ tableName: 'payment_transactions', paranoid: false, timestamps: true })
export class PaymentTransaction extends Model {

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  orderId!: number;

  @BelongsTo(() => Order)
  order!: Order;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  /** Razorpay order ID  (order_XXXX) */
  @Column({ type: DataType.STRING(100), allowNull: true, unique: true })
  razorpayOrderId!: string | null;

  /** Razorpay payment ID (pay_XXXX) — set after capture */
  @Column({ type: DataType.STRING(100), allowNull: true, unique: true })
  razorpayPaymentId!: string | null;

  /** HMAC signature returned by Razorpay checkout */
  @Column({ type: DataType.STRING(256), allowNull: true })
  razorpaySignature!: string | null;

  /** Amount in INR (paise / 100) */
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  amount!: number;

  @Column({ type: DataType.STRING(8), allowNull: false, defaultValue: 'INR' })
  currency!: string;

  @Column({
    type: DataType.ENUM('upi', 'card', 'netbanking', 'cod', 'wallet'),
    allowNull: false,
  })
  method!: TxMethod;

  @Column({
    type: DataType.ENUM('created', 'captured', 'failed', 'refunded', 'partially_refunded'),
    allowNull: false,
    defaultValue: 'created',
  })
  status!: TxStatus;

  /** Razorpay refund ID (rfnd_XXXX) */
  @Column({ type: DataType.STRING(100), allowNull: true })
  refundId!: string | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  refundAmount!: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  refundedAt!: Date | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  errorCode!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  errorDescription!: string | null;

  /** Full webhook / API response payload for audit */
  @Column({ type: DataType.JSON, allowNull: true })
  metadata!: Record<string, unknown> | null;
}

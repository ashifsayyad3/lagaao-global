import {
  Table, Column, Model, DataType,
  BelongsTo, ForeignKey, HasMany, BeforeCreate,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Product } from './product.model';
import { ProductVariant } from './productVariant.model';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refund_requested'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';

function generateOrderNumber(): string {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LG-${ts}-${rand}`;
}

@Table({ tableName: 'orders', paranoid: true })
export class Order extends Model {
  @Column({ type: DataType.STRING(32), allowNull: false, unique: true })
  orderNumber!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({
    type: DataType.ENUM(
      'pending','confirmed','processing','shipped',
      'out_for_delivery','delivered','cancelled','refund_requested','refunded',
    ),
    defaultValue: 'pending',
  })
  status!: OrderStatus;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  subtotal!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  discount!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  shipping!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  tax!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  total!: number;

  @Column({ type: DataType.STRING(64), allowNull: true })
  couponCode!: string | null;

  // Delivery address snapshot
  @Column({ type: DataType.JSON, allowNull: false })
  shippingAddress!: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };

  @Column({ type: DataType.ENUM('upi','card','netbanking','cod','wallet'), allowNull: false })
  paymentMethod!: PaymentMethod;

  @Column({ type: DataType.ENUM('pending','paid','failed','refunded'), defaultValue: 'pending' })
  paymentStatus!: PaymentStatus;

  @Column({ type: DataType.STRING(128), allowNull: true })
  paymentRef!: string | null;

  // Shipping / tracking
  @Column({ type: DataType.STRING(128), allowNull: true })
  trackingNumber!: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  courier!: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  estimatedDelivery!: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  deliveredAt!: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  cancelReason!: string | null;

  @HasMany(() => OrderItem)
  items!: OrderItem[];

  @HasMany(() => OrderStatusHistory)
  statusHistory!: OrderStatusHistory[];

  @BeforeCreate
  static assignOrderNumber(order: Order): void {
    if (!order.orderNumber) order.orderNumber = generateOrderNumber();
  }
}

@Table({ tableName: 'order_items', paranoid: false, timestamps: true })
export class OrderItem extends Model {
  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  orderId!: number;

  @BelongsTo(() => Order)
  order!: Order;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId!: number;

  @BelongsTo(() => Product)
  product!: Product;

  @ForeignKey(() => ProductVariant)
  @Column({ type: DataType.INTEGER, allowNull: true })
  variantId!: number | null;

  @BelongsTo(() => ProductVariant)
  variant!: ProductVariant | null;

  // Snapshots at time of order
  @Column({ type: DataType.STRING(255), allowNull: false })
  productName!: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  sku!: string | null;

  @Column({ type: DataType.JSON, allowNull: true })
  variantAttrs!: Record<string, string> | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  image!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: false })
  qty!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  unitPrice!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  lineTotal!: number;

  @Column({ type: DataType.ENUM(
    'pending','confirmed','processing','shipped',
    'out_for_delivery','delivered','cancelled','refund_requested','refunded',
  ), defaultValue: 'pending' })
  status!: OrderStatus;
}

@Table({ tableName: 'order_status_history', paranoid: false, timestamps: true })
export class OrderStatusHistory extends Model {
  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  orderId!: number;

  @BelongsTo(() => Order)
  order!: Order;

  @Column({ type: DataType.STRING(50), allowNull: false })
  fromStatus!: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  toStatus!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  note!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  changedBy!: number | null;
}

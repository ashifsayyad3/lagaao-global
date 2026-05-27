import {
  Table, Column, Model, DataType,
  BelongsTo, ForeignKey,
} from 'sequelize-typescript';
import { User }          from './user.model';
import { Product }       from './product.model';
import { Order }         from './order.model';
import { VendorProfile } from './vendor.model';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

@Table({ tableName: 'reviews', paranoid: false, timestamps: true })
export class Review extends Model {

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'reviewer' })
  reviewer!: User;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId!: number;

  @BelongsTo(() => Product)
  product!: Product;

  @ForeignKey(() => VendorProfile)
  @Column({ type: DataType.INTEGER, allowNull: true })
  vendorId!: number | null;

  @BelongsTo(() => VendorProfile)
  vendor!: VendorProfile | null;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: true })
  orderId!: number | null;

  @BelongsTo(() => Order)
  order!: Order | null;

  /** Star rating 1–5 */
  @Column({ type: DataType.TINYINT, allowNull: false })
  rating!: number;

  @Column({ type: DataType.STRING(160), allowNull: true })
  title!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  body!: string | null;

  /** Array of uploaded image URLs */
  @Column({ type: DataType.JSON, allowNull: true })
  images!: string[] | null;

  /** True if this review came from a confirmed order */
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  verifiedPurchase!: boolean;

  /** Number of "helpful" votes */
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  helpfulCount!: number;

  @Column({
    type: DataType.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'approved',
  })
  status!: ReviewStatus;

  /** Vendor response text */
  @Column({ type: DataType.TEXT, allowNull: true })
  vendorReply!: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  vendorReplyAt!: Date | null;
}

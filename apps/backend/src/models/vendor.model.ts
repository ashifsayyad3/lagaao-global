import {
  Table, Column, Model, DataType, BelongsTo, ForeignKey, HasMany,
} from 'sequelize-typescript';
import { User } from './user.model';

export type VendorStatus = 'pending' | 'active' | 'suspended' | 'rejected';

@Table({ tableName: 'vendor_profiles', paranoid: true })
export class VendorProfile extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({ type: DataType.STRING(120), allowNull: false })
  storeName!: string;

  @Column({ type: DataType.STRING(140), allowNull: false, unique: true })
  storeSlug!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  logo!: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  banner!: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  website!: string | null;

  // Business details
  @Column({ type: DataType.STRING(20), allowNull: true })
  gstin!: string | null;

  @Column({ type: DataType.STRING(20), allowNull: true })
  pan!: string | null;

  @Column({ type: DataType.JSON, allowNull: true })
  bankDetails!: {
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
  } | null;

  @Column({ type: DataType.JSON, allowNull: true })
  address!: {
    line1: string; line2?: string; city: string;
    state: string; pincode: string;
  } | null;

  // Platform commission percentage (default 10%)
  @Column({ type: DataType.DECIMAL(5, 2), defaultValue: 10 })
  commissionRate!: number;

  @Column({
    type: DataType.ENUM('pending', 'active', 'suspended', 'rejected'),
    defaultValue: 'pending',
  })
  status!: VendorStatus;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isVerified!: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  totalProducts!: number;

  @Column({ type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  totalRevenue!: number;

  @Column({ type: DataType.DECIMAL(3, 2), defaultValue: 0 })
  rating!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  reviewCount!: number;

  @HasMany(() => VendorPayout)
  payouts!: VendorPayout[];
}

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

@Table({ tableName: 'vendor_payouts', paranoid: false, timestamps: true })
export class VendorPayout extends Model {
  @ForeignKey(() => VendorProfile)
  @Column({ type: DataType.INTEGER, allowNull: false })
  vendorId!: number;

  @BelongsTo(() => VendorProfile)
  vendor!: VendorProfile;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  amount!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  commission!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  netAmount!: number;

  @Column({
    type: DataType.ENUM('pending', 'processing', 'paid', 'failed'),
    defaultValue: 'pending',
  })
  status!: PayoutStatus;

  @Column({ type: DataType.STRING(128), allowNull: true })
  reference!: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  paidAt!: Date | null;

  // Period the payout covers
  @Column({ type: DataType.DATE, allowNull: true })
  periodFrom!: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  periodTo!: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  note!: string | null;
}

import {
  Table, Column, Model, DataType, BelongsTo, ForeignKey, Default,
} from 'sequelize-typescript';
import { User } from './user.model';

export type ReferralStatus = 'pending' | 'converted' | 'rewarded' | 'cancelled';

@Table({ tableName: 'referrals', paranoid: false, timestamps: true })
export class Referral extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  referrerId!: number;

  @BelongsTo(() => User, { foreignKey: 'referrerId', as: 'referrer' })
  referrer!: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  referredId!: number;

  @BelongsTo(() => User, { foreignKey: 'referredId', as: 'referred' })
  referred!: User;

  @Column({ type: DataType.STRING(16), allowNull: false })
  code!: string;

  @Default('pending')
  @Column({ type: DataType.ENUM('pending', 'converted', 'rewarded', 'cancelled') })
  status!: ReferralStatus;

  @Default(0)
  @Column({ type: DataType.DECIMAL(10, 2) })
  rewardAmount!: number;

  @Column({ type: DataType.DATE, allowNull: true })
  rewardedAt!: Date | null;
}

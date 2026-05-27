import {
  Table, Column, Model, DataType,
  ForeignKey, BelongsTo, CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { User } from './user.model';

export type LoyaltyType = 'earn' | 'redeem' | 'expire' | 'admin';

@Table({ tableName: 'loyalty_points', underscored: true, paranoid: true })
export class LoyaltyPoint extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare points: number;

  @Column({ type: DataType.ENUM('earn', 'redeem', 'expire', 'admin'), allowNull: false })
  declare type: LoyaltyType;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare description: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  declare referenceType: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare referenceId: number | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare expiresAt: Date | null;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;
}

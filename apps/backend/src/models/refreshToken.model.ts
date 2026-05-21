import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';

@Table({ tableName: 'refresh_tokens', timestamps: true, updatedAt: false })
export class RefreshToken extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  tokenHash!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  expiresAt!: Date;

  @Column({ type: DataType.STRING(50), allowNull: true })
  ipAddress!: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  userAgent!: string | null;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}

import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany,
  CreatedAt, UpdatedAt, AllowNull, Default, Unique,
} from 'sequelize-typescript';
import { User } from './user.model';

export type WalletTxType =
  | 'credit' | 'debit' | 'refund' | 'cashback' | 'admin_credit' | 'admin_debit';

@Table({ tableName: 'wallets', underscored: true, paranoid: false })
export class Wallet extends Model {
  @ForeignKey(() => User)
  @Unique
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  declare balance: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  declare totalCredited: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  declare totalDebited: number;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isFrozen: boolean;

  @HasMany(() => WalletTransaction)
  declare transactions: WalletTransaction[];

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

@Table({ tableName: 'wallet_transactions', underscored: true, paranoid: false })
export class WalletTransaction extends Model {
  @ForeignKey(() => Wallet)
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare walletId: number;

  @BelongsTo(() => Wallet)
  declare wallet: Wallet;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @AllowNull(false)
  @Column(DataType.ENUM('credit', 'debit', 'refund', 'cashback', 'admin_credit', 'admin_debit'))
  declare type: WalletTxType;

  @AllowNull(false)
  @Column(DataType.DECIMAL(12, 2))
  declare amount: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(12, 2))
  declare balanceAfter: number;

  @Column(DataType.STRING(255))
  declare description: string | null;

  @Column(DataType.STRING(50))
  declare referenceType: string | null;

  @Column(DataType.INTEGER.UNSIGNED)
  declare referenceId: number | null;

  @Column(DataType.JSON)
  declare meta: Record<string, unknown> | null;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

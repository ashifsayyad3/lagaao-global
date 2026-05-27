import {
  Table, Column, Model, DataType, HasMany,
} from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import { Role } from '../shared/types/roles';
import type { RefreshToken } from './refreshToken.model';
import type { Address } from './address.model';

@Table({ tableName: 'users', paranoid: true, underscored: true })
export class User extends Model {
  @Column({ type: DataType.STRING(100), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(200), allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  phone!: string | null;

  @Column({ field: 'password_hash', type: DataType.STRING(255), allowNull: true })
  passwordHash!: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(Role)),
    defaultValue: Role.CUSTOMER,
    allowNull: false,
  })
  role!: Role;

  @Column({ type: DataType.STRING(500), allowNull: true })
  avatar!: string | null;

  @Column({ field: 'is_verified', type: DataType.BOOLEAN, defaultValue: false })
  isVerified!: boolean;

  @Column({ field: 'is_active', type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;

  @Column({ field: 'mfa_enabled', type: DataType.BOOLEAN, defaultValue: false })
  mfaEnabled!: boolean;

  @Column({ field: 'mfa_secret', type: DataType.STRING(100), allowNull: true })
  mfaSecret!: string | null;

  @Column({ field: 'mfa_backup_codes', type: DataType.JSON, allowNull: true })
  mfaBackupCodes!: string[] | null;

  @Column({ field: 'whatsapp_opt_in', type: DataType.BOOLEAN, defaultValue: true })
  whatsappOptIn!: boolean;

  @Column({ field: 'referral_code', type: DataType.STRING(16), allowNull: true, unique: true })
  referralCode!: string | null;

  @Column({ field: 'loyalty_balance', type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  loyaltyBalance!: number;

  @Column({ field: 'google_id', type: DataType.STRING(100), allowNull: true })
  googleId!: string | null;

  @Column({ field: 'last_login_at', type: DataType.DATE, allowNull: true })
  lastLoginAt!: Date | null;

  // ─── Associations ─────────────────────────────────────────
  @HasMany(() => require('./refreshToken.model').RefreshToken)
  refreshTokens!: RefreshToken[];

  @HasMany(() => require('./address.model').Address)
  addresses!: Address[];

  // ─── Instance methods ─────────────────────────────────────
  async comparePassword(plain: string): Promise<boolean> {
    const hash = (this.getDataValue('password_hash') ?? this.passwordHash) as string | null;
    if (!hash) return false;
    return bcrypt.compare(plain, hash);
  }

  toJSON(): object {
    const v = super.toJSON() as Record<string, unknown>;
    delete v['passwordHash'];
    delete v['mfaSecret'];
    delete v['mfaBackupCodes'];
    return v;
  }
}

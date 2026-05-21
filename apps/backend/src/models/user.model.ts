import {
  Table, Column, Model, DataType, HasMany, BeforeCreate, BeforeUpdate
} from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import { Role } from '../shared/types/roles';
import type { RefreshToken } from './refreshToken.model';
import type { Address } from './address.model';

@Table({ tableName: 'users', paranoid: true })
export class User extends Model {
  @Column({ type: DataType.STRING(100), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(200), allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING(20), allowNull: true })
  phone!: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  passwordHash!: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(Role)),
    defaultValue: Role.CUSTOMER,
    allowNull: false,
  })
  role!: Role;

  @Column({ type: DataType.STRING(500), allowNull: true })
  avatar!: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isVerified!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  mfaEnabled!: boolean;

  @Column({ type: DataType.STRING(100), allowNull: true })
  mfaSecret!: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  googleId!: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  lastLoginAt!: Date | null;

  // ─── Associations ─────────────────────────────────────────
  @HasMany(() => require('./refreshToken.model').RefreshToken)
  refreshTokens!: RefreshToken[];

  @HasMany(() => require('./address.model').Address)
  addresses!: Address[];

  // ─── Instance methods ─────────────────────────────────────
  async comparePassword(plain: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(plain, this.passwordHash);
  }

  toJSON(): object {
    const v = super.toJSON() as Record<string, unknown>;
    delete v['passwordHash'];
    delete v['mfaSecret'];
    return v;
  }

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User): Promise<void> {
    if (instance.changed('passwordHash') && instance.passwordHash) {
      instance.passwordHash = await bcrypt.hash(instance.passwordHash, 12);
    }
  }
}

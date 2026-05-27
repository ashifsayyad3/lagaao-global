import {
  Table, Column, Model, DataType, BelongsTo, ForeignKey,
} from 'sequelize-typescript';
import { User } from './user.model';

export type StorageType = 'local' | 's3';

@Table({ tableName: 'media_files', paranoid: false, timestamps: true })
export class MediaFile extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column({ type: DataType.STRING(255), allowNull: false })
  originalName!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  fileName!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  mimeType!: string;

  /** File size in bytes */
  @Column({ type: DataType.INTEGER, allowNull: false })
  size!: number;

  @Column({ type: DataType.ENUM('local', 's3'), allowNull: false, defaultValue: 'local' })
  storage!: StorageType;

  /** Public-accessible URL */
  @Column({ type: DataType.STRING(1000), allowNull: false })
  url!: string;

  /** Absolute disk path (local only) */
  @Column({ type: DataType.STRING(1000), allowNull: true })
  path!: string | null;

  /** S3 bucket name */
  @Column({ type: DataType.STRING(255), allowNull: true })
  bucket!: string | null;

  /** S3 object key */
  @Column({ type: DataType.STRING(1000), allowNull: true })
  key!: string | null;

  /** Optional entity association e.g. 'product', 'banner', 'blog' */
  @Column({ type: DataType.STRING(64), allowNull: true })
  entityType!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  entityId!: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  width!: number | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  height!: number | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  altText!: string | null;
}

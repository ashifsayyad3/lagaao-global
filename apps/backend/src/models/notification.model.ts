import {
  Table, Column, Model, DataType, BelongsTo, ForeignKey,
} from 'sequelize-typescript';
import { User } from './user.model';

export type NotificationChannel = 'in_app' | 'push' | 'sms' | 'email';
export type NotificationStatus  = 'pending' | 'sent' | 'failed' | 'read';

@Table({ tableName: 'notifications', timestamps: true, paranoid: false })
export class Notification extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true }) // null = broadcast to all
  declare userId: number | null;

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare type: string; // order_update, payment, promo, system, vendor

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare body: string;

  @Column({ type: DataType.ENUM('in_app', 'push', 'sms', 'email'), defaultValue: 'in_app' })
  declare channel: NotificationChannel;

  @Column({ type: DataType.ENUM('pending', 'sent', 'failed', 'read'), defaultValue: 'pending' })
  declare status: NotificationStatus;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isRead: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare data: string | null; // JSON payload

  @Column({ type: DataType.DATE, allowNull: true })
  declare readAt: Date | null;

  @BelongsTo(() => User)
  declare user: User;
}

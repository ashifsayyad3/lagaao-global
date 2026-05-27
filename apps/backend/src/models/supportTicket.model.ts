import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany,
  CreatedAt, UpdatedAt, DeletedAt, AllowNull, Default,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Order } from './order.model';

export type TicketCategory = 'order' | 'payment' | 'delivery' | 'product' | 'return' | 'account' | 'other';
export type TicketStatus   = 'open' | 'pending_customer' | 'pending_admin' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SenderRole     = 'customer' | 'admin';

@Table({ tableName: 'support_tickets', underscored: true, paranoid: true })
export class SupportTicket extends Model {
  @AllowNull(false)
  @Column(DataType.STRING(20))
  declare ticketNumber: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare userId: number;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'customer' })
  declare customer: User;

  @ForeignKey(() => Order)
  @Column(DataType.INTEGER.UNSIGNED)
  declare orderId: number | null;

  @BelongsTo(() => Order)
  declare order: Order;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  declare subject: string;

  @AllowNull(false)
  @Default('other')
  @Column(DataType.ENUM('order', 'payment', 'delivery', 'product', 'return', 'account', 'other'))
  declare category: TicketCategory;

  @AllowNull(false)
  @Default('open')
  @Column(DataType.ENUM('open', 'pending_customer', 'pending_admin', 'resolved', 'closed'))
  declare status: TicketStatus;

  @AllowNull(false)
  @Default('medium')
  @Column(DataType.ENUM('low', 'medium', 'high', 'urgent'))
  declare priority: TicketPriority;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER.UNSIGNED)
  declare assignedTo: number | null;

  @BelongsTo(() => User, { foreignKey: 'assignedTo', as: 'assignee' })
  declare assignee: User;

  @Column(DataType.DATE)
  declare resolvedAt: Date | null;

  @HasMany(() => SupportMessage)
  declare messages: SupportMessage[];

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date;
}

@Table({ tableName: 'support_messages', underscored: true, timestamps: true })
export class SupportMessage extends Model {
  @ForeignKey(() => SupportTicket)
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare ticketId: number;

  @BelongsTo(() => SupportTicket)
  declare ticket: SupportTicket;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare senderId: number;

  @BelongsTo(() => User, { foreignKey: 'senderId', as: 'sender' })
  declare sender: User;

  @AllowNull(false)
  @Column(DataType.ENUM('customer', 'admin'))
  declare senderRole: SenderRole;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare body: string;

  @Column(DataType.JSON)
  declare attachments: string[] | null;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare isInternal: boolean;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

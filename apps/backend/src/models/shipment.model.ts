import {
  Table, Column, Model, DataType, BelongsTo, ForeignKey,
} from 'sequelize-typescript';
import { Order } from './order.model';

export type ShipmentStatus =
  | 'pending'
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'returned'
  | 'cancelled';

export interface TrackingEvent {
  timestamp: string;
  status:    string;
  location?: string;
  remark?:   string;
}

@Table({ tableName: 'shipments', timestamps: true, paranoid: true })
export class Shipment extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  declare id: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare orderId: number;

  @Column({ type: DataType.STRING(100), allowNull: false, defaultValue: 'pending' })
  declare courier: string;

  @Column({ type: DataType.STRING(200), allowNull: true })
  declare trackingNumber: string | null;

  @Column({ type: DataType.STRING(100), allowNull: true })
  declare awbNumber: string | null;

  @Column({
    type: DataType.ENUM(
      'pending', 'label_created', 'picked_up', 'in_transit',
      'out_for_delivery', 'delivered', 'failed_delivery', 'returned', 'cancelled',
    ),
    defaultValue: 'pending',
  })
  declare status: ShipmentStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  declare estimatedDelivery: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deliveredAt: Date | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  declare failedAttempts: number;

  // JSON array of TrackingEvent
  @Column({ type: DataType.TEXT('medium'), allowNull: true })
  declare eventsJson: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

  // Virtual: parsed events
  get events(): TrackingEvent[] {
    try { return this.eventsJson ? JSON.parse(this.eventsJson) : []; }
    catch { return []; }
  }

  addEvent(event: TrackingEvent): void {
    const existing = this.events;
    existing.unshift(event);
    this.eventsJson = JSON.stringify(existing);
  }

  @BelongsTo(() => Order)
  declare order: Order;
}

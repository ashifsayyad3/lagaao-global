import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, AfterUpdate
} from 'sequelize-typescript';
import { ProductVariant } from './productVariant.model';

@Table({ tableName: 'inventory', paranoid: false, timestamps: true, updatedAt: true })
export class Inventory extends Model {
  @ForeignKey(() => ProductVariant)
  @Column({ type: DataType.INTEGER, allowNull: false, unique: true })
  variantId!: number;

  @BelongsTo(() => ProductVariant)
  variant!: ProductVariant;

  @Column({ type: DataType.STRING(100), allowNull: true, defaultValue: 'default' })
  warehouseId!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  qtyOnHand!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  qtyReserved!: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  lowStockThreshold!: number;

  @HasMany(() => InventoryLog)
  logs!: InventoryLog[];

  get qtyAvailable(): number {
    return Math.max(0, this.qtyOnHand - this.qtyReserved);
  }

  get isLowStock(): boolean {
    return this.qtyAvailable > 0 && this.qtyAvailable <= this.lowStockThreshold;
  }

  get isOutOfStock(): boolean {
    return this.qtyAvailable <= 0;
  }
}

export type InventoryLogType =
  | 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage' | 'transfer';

@Table({ tableName: 'inventory_logs', paranoid: false, updatedAt: false })
export class InventoryLog extends Model {
  @ForeignKey(() => Inventory)
  @Column({ type: DataType.INTEGER, allowNull: false })
  inventoryId!: number;

  @Column({
    type: DataType.ENUM('purchase','sale','adjustment','return','damage','transfer'),
    allowNull: false,
  })
  type!: InventoryLogType;

  @Column({ type: DataType.INTEGER, allowNull: false })
  qtyChange!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  qtyBefore!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  qtyAfter!: number;

  @Column({ type: DataType.STRING(50), allowNull: true })
  referenceType!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  referenceId!: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  note!: string | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  createdBy!: number | null;
}

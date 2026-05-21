import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasOne
} from 'sequelize-typescript';
import { Product } from './product.model';
import { Inventory } from './inventory.model';

@Table({ tableName: 'product_variants', paranoid: true })
export class ProductVariant extends Model {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId!: number;

  @BelongsTo(() => Product)
  product!: Product;

  @Column({ type: DataType.STRING(100), allowNull: false, unique: true })
  sku!: string;

  @Column({ type: DataType.STRING(100), allowNull: true })
  barcode!: string | null;

  @Column({ type: DataType.STRING(200), allowNull: true })
  name!: string | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  price!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  salePrice!: number | null;

  // JSON object of attribute slug → value, e.g. { color: "red", size: "L" }
  @Column({ type: DataType.JSON, allowNull: true })
  attributes!: Record<string, string> | null;

  @Column({ type: DataType.DECIMAL(8, 3), allowNull: true })
  weight!: number | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  image!: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive!: boolean;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  sortOrder!: number;

  @HasOne(() => Inventory)
  inventory!: Inventory;

  get effectivePrice(): number {
    return this.salePrice !== null ? Number(this.salePrice) : Number(this.price);
  }
}

import {
  Table, Column, Model, DataType, HasMany,
  BelongsTo, ForeignKey, Default,
} from 'sequelize-typescript';
import { Product } from './product.model';
import { ProductVariant } from './productVariant.model';

@Table({ tableName: 'flash_sales', paranoid: true })
export class FlashSale extends Model {
  @Column({ type: DataType.STRING(255), allowNull: false })
  name!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description!: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  bannerImage!: string | null;

  @Column({ type: DataType.DATE, allowNull: false })
  startAt!: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  endAt!: Date;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isActive!: boolean;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  maxPerUser!: number | null;

  @HasMany(() => FlashSaleItem)
  items!: FlashSaleItem[];

  /** True if the sale is currently live */
  get isLive(): boolean {
    const now = Date.now();
    return this.isActive && new Date(this.startAt).getTime() <= now && new Date(this.endAt).getTime() > now;
  }
}

@Table({ tableName: 'flash_sale_items', paranoid: false, timestamps: true })
export class FlashSaleItem extends Model {
  @ForeignKey(() => FlashSale)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  flashSaleId!: number;

  @BelongsTo(() => FlashSale)
  flashSale!: FlashSale;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  productId!: number;

  @BelongsTo(() => Product)
  product!: Product;

  @ForeignKey(() => ProductVariant)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  variantId!: number | null;

  @BelongsTo(() => ProductVariant)
  variant!: ProductVariant | null;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  salePrice!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  originalPrice!: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  stockLimit!: number | null;

  @Default(0)
  @Column({ type: DataType.INTEGER.UNSIGNED })
  sold!: number;

  get remaining(): number | null {
    return this.stockLimit != null ? Math.max(0, this.stockLimit - this.sold) : null;
  }

  get discountPct(): number {
    if (!this.originalPrice || this.originalPrice === 0) return 0;
    return Math.round((1 - Number(this.salePrice) / Number(this.originalPrice)) * 100);
  }
}

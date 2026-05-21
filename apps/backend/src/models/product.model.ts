import {
  Table, Column, Model, DataType,
  BelongsTo, ForeignKey, HasMany
} from 'sequelize-typescript';
import { Category } from './category.model';
import { Brand } from './brand.model';
import { ProductVariant } from './productVariant.model';
import { ProductImage } from './productImage.model';
// VendorProfile imported lazily to avoid circular deps — vendorId stored as plain FK below

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived';

@Table({ tableName: 'products', paranoid: true })
export class Product extends Model {
  @Column({ type: DataType.STRING(255), allowNull: false })
  name!: string;

  @Column({ type: DataType.STRING(280), allowNull: false, unique: true })
  slug!: string;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  description!: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  shortDescription!: string | null;

  @ForeignKey(() => Category)
  @Column({ type: DataType.INTEGER, allowNull: false })
  categoryId!: number;

  @BelongsTo(() => Category)
  category!: Category;

  @ForeignKey(() => Brand)
  @Column({ type: DataType.INTEGER, allowNull: true })
  brandId!: number | null;

  @BelongsTo(() => Brand)
  brand!: Brand | null;

  @Column({
    type: DataType.ENUM('draft', 'active', 'inactive', 'archived'),
    defaultValue: 'draft',
  })
  status!: ProductStatus;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isFeatured!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isDigital!: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  hasVariants!: boolean;

  // Pricing (base — overridden by variants if hasVariants)
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false, defaultValue: 0 })
  basePrice!: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  salePrice!: number | null;

  @Column({ type: DataType.DECIMAL(5, 2), defaultValue: 18 })
  taxRate!: number;

  // SEO
  @Column({ type: DataType.STRING(255), allowNull: true })
  metaTitle!: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  metaDescription!: string | null;

  // Misc
  @Column({ type: DataType.JSON, allowNull: true })
  tags!: string[] | null;

  @Column({ type: DataType.DECIMAL(8, 3), allowNull: true })
  weight!: number | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  reviewCount!: number;

  @Column({ type: DataType.DECIMAL(3, 2), defaultValue: 0 })
  rating!: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  createdBy!: number | null;

  // Marketplace: null = platform product, non-null = vendor product
  @Column({ type: DataType.INTEGER, allowNull: true })
  vendorId!: number | null;

  @HasMany(() => ProductVariant)
  variants!: ProductVariant[];

  @HasMany(() => ProductImage)
  images!: ProductImage[];

  get effectivePrice(): number {
    return this.salePrice !== null ? Number(this.salePrice) : Number(this.basePrice);
  }

  get discountPct(): number {
    if (!this.salePrice || !this.basePrice) return 0;
    return Math.round((1 - Number(this.salePrice) / Number(this.basePrice)) * 100);
  }
}

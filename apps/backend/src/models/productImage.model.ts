import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo
} from 'sequelize-typescript';
import { Product } from './product.model';

@Table({ tableName: 'product_images', paranoid: false, timestamps: false })
export class ProductImage extends Model {
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId!: number;

  @BelongsTo(() => Product)
  product!: Product;

  @Column({ type: DataType.STRING(1000), allowNull: false })
  url!: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  alt!: string | null;

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  sortOrder!: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isPrimary!: boolean;
}

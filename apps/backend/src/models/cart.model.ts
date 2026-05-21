import {
  Table, Column, Model, DataType,
  BelongsTo, ForeignKey, HasMany,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Product } from './product.model';
import { ProductVariant } from './productVariant.model';

@Table({ tableName: 'carts', paranoid: true })
export class Cart extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  userId!: number | null;

  @BelongsTo(() => User)
  user!: User;

  @Column({ type: DataType.STRING(128), allowNull: true })
  sessionId!: string | null;

  @HasMany(() => CartItem)
  items!: CartItem[];
}

@Table({ tableName: 'cart_items', paranoid: false, timestamps: true })
export class CartItem extends Model {
  @ForeignKey(() => Cart)
  @Column({ type: DataType.INTEGER, allowNull: false })
  cartId!: number;

  @BelongsTo(() => Cart)
  cart!: Cart;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false })
  productId!: number;

  @BelongsTo(() => Product)
  product!: Product;

  @ForeignKey(() => ProductVariant)
  @Column({ type: DataType.INTEGER, allowNull: true })
  variantId!: number | null;

  @BelongsTo(() => ProductVariant)
  variant!: ProductVariant | null;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  qty!: number;

  // Snapshot price at time of add (base price of variant or product)
  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  price!: number;
}

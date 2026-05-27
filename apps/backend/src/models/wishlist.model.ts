import {
  Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany,
  CreatedAt, UpdatedAt, DeletedAt, AllowNull, Default,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Product } from './product.model';

@Table({ tableName: 'wishlists', underscored: true, paranoid: true })
export class Wishlist extends Model {
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @AllowNull(false)
  @Default('My Wishlist')
  @Column(DataType.STRING(120))
  declare name: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isDefault: boolean;

  @HasMany(() => WishlistItem)
  declare items: WishlistItem[];

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date;
}

@Table({ tableName: 'wishlist_items', underscored: true, timestamps: true })
export class WishlistItem extends Model {
  @ForeignKey(() => Wishlist)
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare wishlistId: number;

  @BelongsTo(() => Wishlist)
  declare wishlist: Wishlist;

  @ForeignKey(() => Product)
  @AllowNull(false)
  @Column(DataType.INTEGER.UNSIGNED)
  declare productId: number;

  @BelongsTo(() => Product)
  declare product: Product;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

import { Sequelize } from 'sequelize-typescript';
import { env } from '../config/env';
import { logger } from '../config/logger';

import { User }            from './user.model';
import { Address }         from './address.model';
import { RefreshToken }    from './refreshToken.model';
import { Category }        from './category.model';
import { Brand }           from './brand.model';
import { Attribute, AttributeValue } from './attribute.model';
import { Product }         from './product.model';
import { ProductImage }    from './productImage.model';
import { ProductVariant }  from './productVariant.model';
import { Inventory, InventoryLog } from './inventory.model';
import { Cart, CartItem } from './cart.model';
import { Coupon } from './coupon.model';
import { Order, OrderItem, OrderStatusHistory } from './order.model';
import { VendorProfile, VendorPayout } from './vendor.model';

export const sequelize = new Sequelize({
  dialect:  'mysql',
  host:     env.DB_HOST,
  port:     env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASS,
  models: [
    User, Address, RefreshToken,
    Category, Brand, Attribute, AttributeValue,
    Product, ProductImage, ProductVariant,
    Inventory, InventoryLog,
    Cart, CartItem, Coupon,
    Order, OrderItem, OrderStatusHistory,
    VendorProfile, VendorPayout,
  ],
  logging: env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
  define: {
    underscored:     true,
    timestamps:      true,
    paranoid:        true,
    freezeTableName: false,
  },
});

export {
  User, Address, RefreshToken,
  Category, Brand, Attribute, AttributeValue,
  Product, ProductImage, ProductVariant,
  Inventory, InventoryLog,
  Cart, CartItem, Coupon,
  Order, OrderItem, OrderStatusHistory,
  VendorProfile, VendorPayout,
};

export async function connectDB(): Promise<void> {
  await sequelize.authenticate();
  if (env.NODE_ENV !== 'production') {
    await sequelize.sync({ alter: true });
  }
  logger.info(`MySQL connected — ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
}

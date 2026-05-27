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
import {
  Banner, Announcement, NewsletterSubscriber, BlogPost, CmsPage,
} from './cms.model';
import { EmailLog }    from './emailLog.model';
import { Notification } from './notification.model';
import { Shipment }    from './shipment.model';
import { SeoMeta }     from './seoMeta.model';
import { RedirectRule } from './redirectRule.model';
import { PaymentTransaction } from './paymentTransaction.model';
import { MediaFile }          from './mediaFile.model';
import { Review }             from './review.model';
import { Wishlist, WishlistItem } from './wishlist.model';
import { Wallet, WalletTransaction } from './wallet.model';
import { ReturnRequest } from './returnRequest.model';
import { SupportTicket, SupportMessage } from './supportTicket.model';
import { FlashSale, FlashSaleItem } from './flashSale.model';
import { Referral } from './referral.model';
import { LoyaltyPoint } from './loyaltyPoint.model';
import { Affiliate, AffiliateClick, AffiliateConversion } from './affiliate.model';

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
    Banner, Announcement, NewsletterSubscriber, BlogPost, CmsPage,
    EmailLog, Notification, Shipment,
    SeoMeta, RedirectRule,
    PaymentTransaction,
    MediaFile,
    Review,
    Wishlist, WishlistItem,
    Wallet, WalletTransaction,
    ReturnRequest,
    SupportTicket, SupportMessage,
    FlashSale, FlashSaleItem,
    Referral,
    LoyaltyPoint,
    Affiliate, AffiliateClick, AffiliateConversion,
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
  Banner, Announcement, NewsletterSubscriber, BlogPost, CmsPage,
  EmailLog, Notification, Shipment,
  SeoMeta, RedirectRule,
  PaymentTransaction,
  MediaFile,
  Review,
  Wishlist, WishlistItem,
  Wallet, WalletTransaction,
  ReturnRequest,
  SupportTicket, SupportMessage,
  FlashSale, FlashSaleItem,
  Referral,
  LoyaltyPoint,
  Affiliate, AffiliateClick, AffiliateConversion,
};

export async function connectDB(): Promise<void> {
  await sequelize.authenticate();
  logger.info(`MySQL connected — ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
}

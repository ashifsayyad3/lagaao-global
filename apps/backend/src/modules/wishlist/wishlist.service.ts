import { Request } from 'express';
import { Op } from 'sequelize';
import { Wishlist, WishlistItem, Product, ProductImage } from '../../models/index';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getPagination } from '../../shared/utils/paginate.util';

export class WishlistService {
  /** Get or create the user's default wishlist */
  async #getDefault(userId: number): Promise<Wishlist> {
    const [wishlist] = await Wishlist.findOrCreate({
      where: { userId, isDefault: true },
      defaults: { userId, name: 'My Wishlist', isDefault: true },
    });
    return wishlist;
  }

  /** Add a product to wishlist */
  async add(userId: number, productId: number): Promise<WishlistItem> {
    const wishlist = await this.#getDefault(userId);
    const [item, created] = await WishlistItem.findOrCreate({
      where: { wishlistId: wishlist.id, productId },
      defaults: { wishlistId: wishlist.id, productId },
    });
    if (!created) throw new AppError('Product already in wishlist', 409);
    return item;
  }

  /** Remove a product from wishlist */
  async remove(userId: number, productId: number): Promise<void> {
    const wishlist = await this.#getDefault(userId);
    const deleted = await WishlistItem.destroy({
      where: { wishlistId: wishlist.id, productId },
    });
    if (!deleted) throw new AppError('Product not in wishlist', 404);
  }

  /** List all wishlist items for a user */
  async list(userId: number, req: Request) {
    const wishlist = await this.#getDefault(userId);
    const { limit, offset, page } = getPagination(req, 20);

    const { count, rows } = await WishlistItem.findAndCountAll({
      where: { wishlistId: wishlist.id },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'slug', 'price', 'comparePrice', 'rating', 'reviewCount', 'stock'],
        include: [{
          model: ProductImage,
          attributes: ['url', 'altText', 'isPrimary'],
          where: { isPrimary: true },
          required: false,
          limit: 1,
        }],
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      items: rows,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /** Check if a list of product IDs are wishlisted by the user */
  async check(userId: number, productIds: number[]): Promise<number[]> {
    const wishlist = await Wishlist.findOne({ where: { userId, isDefault: true } });
    if (!wishlist) return [];
    const items = await WishlistItem.findAll({
      where: { wishlistId: wishlist.id, productId: { [Op.in]: productIds } },
      attributes: ['productId'],
    });
    return items.map(i => i.productId);
  }

  /** Get count of wishlisted items */
  async count(userId: number): Promise<number> {
    const wishlist = await Wishlist.findOne({ where: { userId, isDefault: true } });
    if (!wishlist) return 0;
    return WishlistItem.count({ where: { wishlistId: wishlist.id } });
  }
}

export const wishlistService = new WishlistService();

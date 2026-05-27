import { QueryTypes } from 'sequelize';
import { sequelize } from '../../models/index';
import { Product } from '../../models/product.model';
import { cached, invalidate } from '../../shared/utils/cache.util';

const TTL = 300; // 5 min cache

export interface RecommendedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  thumbnail: string | null;
  avgRating: number;
  reviewCount: number;
  score: number;
}

export const recommendationsService = {

  /**
   * Products frequently bought together with a given product.
   * Uses co-purchase counts from order_items.
   */
  async forProduct(productId: number, limit = 8): Promise<RecommendedProduct[]> {
    return cached(`rec:product:${productId}:${limit}`, async () => {
      const rows = await sequelize.query<RecommendedProduct>(`
        SELECT
          p.id,
          p.name,
          p.slug,
          p.price,
          p.mrp,
          (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail,
          COALESCE(AVG(r.rating), 0)  AS avgRating,
          COUNT(DISTINCT r.id)        AS reviewCount,
          COUNT(DISTINCT co.id)       AS score
        FROM order_items oi
        JOIN orders o       ON o.id = oi.order_id AND o.deleted_at IS NULL
        JOIN order_items co ON co.order_id = o.id AND co.product_id != :productId
        JOIN products p     ON p.id = co.product_id AND p.deleted_at IS NULL AND p.is_active = 1
        LEFT JOIN reviews r ON r.product_id = p.id AND r.deleted_at IS NULL
        WHERE oi.product_id = :productId
        GROUP BY p.id
        ORDER BY score DESC
        LIMIT :limit
      `, {
        replacements: { productId, limit },
        type: QueryTypes.SELECT,
      });

      if (rows.length >= 4) return rows;

      // Fallback: same category products
      const product = await Product.findByPk(productId, { attributes: ['categoryId'] });
      if (!product) return rows;

      const extras = await sequelize.query<RecommendedProduct>(`
        SELECT
          p.id, p.name, p.slug, p.price, p.mrp,
          (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail,
          COALESCE(AVG(r.rating), 0) AS avgRating,
          COUNT(DISTINCT r.id)       AS reviewCount,
          COALESCE(SUM(oi.qty), 0)   AS score
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o        ON o.id = oi.order_id AND o.deleted_at IS NULL
        LEFT JOIN reviews r       ON r.product_id = p.id AND r.deleted_at IS NULL
        WHERE p.category_id = :categoryId
          AND p.id != :productId
          AND p.is_active = 1
          AND p.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY score DESC, avgRating DESC
        LIMIT :limit
      `, {
        replacements: { categoryId: (product as any).categoryId, productId, limit },
        type: QueryTypes.SELECT,
      });

      const seen = new Set(rows.map(r => r.id));
      const merged = [...rows, ...extras.filter(e => !seen.has(e.id))];
      return merged.slice(0, limit);
    }, TTL);
  },

  /**
   * Personalised "you may also like" for a logged-in user.
   * Based on their purchased / wishlisted categories and brands.
   */
  async forUser(userId: number, limit = 12): Promise<RecommendedProduct[]> {
    return cached(`rec:user:${userId}:${limit}`, async () => {
      // 1. Get user's top category_ids from orders + wishlist
      const categoryRows = await sequelize.query<{ categoryId: number; weight: number }>(`
        SELECT category_id AS categoryId, SUM(weight) AS weight FROM (
          SELECT p.category_id, 3 AS weight
          FROM order_items oi
          JOIN orders o  ON o.id = oi.order_id AND o.user_id = :userId AND o.deleted_at IS NULL
          JOIN products p ON p.id = oi.product_id AND p.deleted_at IS NULL
          UNION ALL
          SELECT p.category_id, 1 AS weight
          FROM wishlist_items wi
          JOIN wishlists w ON w.id = wi.wishlist_id AND w.user_id = :userId AND w.deleted_at IS NULL
          JOIN products p  ON p.id = wi.product_id AND p.deleted_at IS NULL
        ) combined
        GROUP BY category_id
        ORDER BY weight DESC
        LIMIT 5
      `, { replacements: { userId }, type: QueryTypes.SELECT });

      // 2. Get already bought product ids to exclude
      const boughtRows = await sequelize.query<{ productId: number }>(`
        SELECT DISTINCT oi.product_id AS productId
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id AND o.user_id = :userId AND o.deleted_at IS NULL
      `, { replacements: { userId }, type: QueryTypes.SELECT });

      const boughtIds = boughtRows.map(r => r.productId);
      const categoryIds = categoryRows.map(r => r.categoryId);

      if (categoryIds.length === 0) return this.bestSellers(limit);

      const excludeClause = boughtIds.length > 0
        ? `AND p.id NOT IN (${boughtIds.join(',')})` : '';

      const rows = await sequelize.query<RecommendedProduct>(`
        SELECT
          p.id, p.name, p.slug, p.price, p.mrp,
          (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail,
          COALESCE(AVG(r.rating), 0) AS avgRating,
          COUNT(DISTINCT r.id)       AS reviewCount,
          COALESCE(SUM(oi.qty), 0)   AS score
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o        ON o.id = oi.order_id AND o.deleted_at IS NULL
        LEFT JOIN reviews r       ON r.product_id = p.id AND r.deleted_at IS NULL
        WHERE p.category_id IN (:categoryIds)
          AND p.is_active = 1
          AND p.deleted_at IS NULL
          ${excludeClause}
        GROUP BY p.id
        ORDER BY score DESC, avgRating DESC
        LIMIT :limit
      `, {
        replacements: { categoryIds, limit },
        type: QueryTypes.SELECT,
      });

      return rows.length >= 4 ? rows : this.bestSellers(limit);
    }, TTL);
  },

  /** Best sellers fallback (guest users / cold start) */
  async bestSellers(limit = 12): Promise<RecommendedProduct[]> {
    return cached(`rec:bestsellers:${limit}`, async () => {
      return sequelize.query<RecommendedProduct>(`
        SELECT
          p.id, p.name, p.slug, p.price, p.mrp,
          (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order LIMIT 1) AS thumbnail,
          COALESCE(AVG(r.rating), 0) AS avgRating,
          COUNT(DISTINCT r.id)       AS reviewCount,
          COALESCE(SUM(oi.qty), 0)   AS score
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o        ON o.id = oi.order_id AND o.deleted_at IS NULL
        LEFT JOIN reviews r       ON r.product_id = p.id AND r.deleted_at IS NULL
        WHERE p.is_active = 1 AND p.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY score DESC, avgRating DESC
        LIMIT :limit
      `, { replacements: { limit }, type: QueryTypes.SELECT });
    }, TTL);
  },

  invalidateUser(userId: number): void {
    invalidate(`rec:user:${userId}:12`).catch(() => {});
    invalidate(`rec:user:${userId}:8`).catch(() => {});
  },

  invalidateProduct(productId: number): void {
    invalidate(`rec:product:${productId}:8`).catch(() => {});
  },
};

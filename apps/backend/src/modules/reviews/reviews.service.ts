import { Op, fn, col } from 'sequelize';
import { sequelize, Review, Product, Order, OrderItem, User } from '../../models';
import { AppError }      from '../../middleware/errorHandler.middleware';
import { getPagination } from '../../shared/utils/paginate.util';
import type { Request }  from 'express';

export interface CreateReviewInput {
  productId:  number;
  orderId?:   number;
  rating:     number;       // 1-5
  title?:     string;
  body?:      string;
  images?:    string[];
}

export interface VendorReplyInput {
  reply: string;
}

const REVIEW_INCLUDE = [
  {
    model: User,
    as: 'reviewer',
    attributes: ['id', 'name', 'avatar'],
  },
];

export class ReviewsService {

  /**
   * Customer creates a review.
   * Rules:
   *  - rating must be 1-5
   *  - one review per user per product
   *  - verifiedPurchase = true if user has a delivered order containing this product
   */
  async create(userId: number, input: CreateReviewInput): Promise<Review> {
    if (input.rating < 1 || input.rating > 5) {
      throw new AppError('Rating must be between 1 and 5', 400);
    }

    const product = await Product.findByPk(input.productId);
    if (!product) throw new AppError('Product not found', 404);

    // Check for duplicate
    const existing = await Review.findOne({ where: { userId, productId: input.productId } });
    if (existing) throw new AppError('You have already reviewed this product', 409);

    // Verify purchase
    let verifiedPurchase = false;
    let orderId          = input.orderId ?? null;
    let vendorId         = (product as Product & { vendorId?: number }).vendorId ?? null;

    if (orderId) {
      const orderItem = await OrderItem.findOne({
        where: { productId: input.productId },
        include: [{ model: Order, where: { id: orderId, userId, status: 'delivered' }, required: true }],
      });
      verifiedPurchase = !!orderItem;
    } else {
      // Auto-detect from delivered orders
      const orderItem = await OrderItem.findOne({
        where: { productId: input.productId },
        include: [{ model: Order, where: { userId, status: 'delivered' }, required: true }],
      });
      if (orderItem) {
        verifiedPurchase = true;
        orderId          = (orderItem as OrderItem & { orderId: number }).orderId;
      }
    }

    const review = await sequelize.transaction(async (t) => {
      const r = await Review.create({
        userId,
        productId:       input.productId,
        vendorId,
        orderId,
        rating:          input.rating,
        title:           input.title?.trim() ?? null,
        body:            input.body?.trim()  ?? null,
        images:          input.images ?? null,
        verifiedPurchase,
        status:          'approved',
      }, { transaction: t });

      // Update product aggregate rating
      await this.#updateProductRating(input.productId, t);
      return r;
    });

    return Review.findByPk(review.id, { include: REVIEW_INCLUDE }) as Promise<Review>;
  }

  /** Paginated list of approved reviews for a product */
  async listForProduct(
    productId: number,
    req: Request,
  ): Promise<{ rows: Review[]; count: number; avgRating: number; distribution: Record<number, number> }> {
    const { limit, offset } = getPagination(req, 10);
    const sort  = (req.query['sort'] as string) ?? 'newest';
    const order: [string, string][] = sort === 'highest' ? [['rating','DESC']]
      : sort === 'lowest' ? [['rating','ASC']]
      : sort === 'helpful' ? [['helpfulCount','DESC']]
      : [['createdAt','DESC']];

    const { rows, count } = await Review.findAndCountAll({
      where:   { productId, status: 'approved' },
      order,
      limit,
      offset,
      include: REVIEW_INCLUDE,
    });

    // Rating distribution (1-5 counts)
    const distRows = await Review.findAll({
      where:      { productId, status: 'approved' },
      attributes: ['rating', [fn('COUNT', col('id')), 'cnt']],
      group:      ['rating'],
      raw:        true,
    }) as unknown as { rating: number; cnt: string }[];

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0, totalCount = 0;
    distRows.forEach(r => {
      distribution[r.rating] = Number(r.cnt);
      totalRating += r.rating * Number(r.cnt);
      totalCount  += Number(r.cnt);
    });
    const avgRating = totalCount ? Math.round((totalRating / totalCount) * 10) / 10 : 0;

    return { rows, count, avgRating, distribution };
  }

  /** Get the authenticated user's review for a product (if any) */
  async getUserReview(userId: number, productId: number): Promise<Review | null> {
    return Review.findOne({
      where:   { userId, productId },
      include: REVIEW_INCLUDE,
    });
  }

  /** Mark a review as helpful */
  async markHelpful(reviewId: number): Promise<void> {
    await Review.increment('helpfulCount', { where: { id: reviewId } });
  }

  /** Vendor replies to a review on their product */
  async vendorReply(reviewId: number, vendorId: number, input: VendorReplyInput): Promise<Review> {
    const review = await Review.findOne({
      where:   { id: reviewId, vendorId },
      include: REVIEW_INCLUDE,
    });
    if (!review) throw new AppError('Review not found or not on your product', 404);
    await review.update({ vendorReply: input.reply.trim(), vendorReplyAt: new Date() });
    return review.reload({ include: REVIEW_INCLUDE });
  }

  // ── Admin ──────────────────────────────────────────────────

  async adminList(req: Request): Promise<{ rows: Review[]; count: number }> {
    const { limit, offset } = getPagination(req, 20);
    const status    = req.query['status']    as string | undefined;
    const productId = req.query['productId'] as string | undefined;
    const where: Record<string, unknown> = {};
    if (status)    where['status']    = status;
    if (productId) where['productId'] = productId;
    return Review.findAndCountAll({
      where,
      order:   [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        ...REVIEW_INCLUDE,
        { model: Product, attributes: ['id', 'name', 'slug'] },
      ],
    });
  }

  async adminUpdateStatus(reviewId: number, status: 'approved' | 'rejected'): Promise<Review> {
    const review = await Review.findByPk(reviewId);
    if (!review) throw new AppError('Review not found', 404);
    const prevStatus = review.status;
    await review.update({ status });
    // Re-compute product rating if status changed
    if (prevStatus !== status) {
      await this.#updateProductRating(review.productId, null);
    }
    return review;
  }

  async adminDelete(reviewId: number): Promise<void> {
    const review = await Review.findByPk(reviewId);
    if (!review) throw new AppError('Review not found', 404);
    const { productId } = review;
    await review.destroy();
    await this.#updateProductRating(productId, null);
  }

  // ── Vendor ─────────────────────────────────────────────────

  async vendorListReviews(
    vendorId: number,
    req: Request,
  ): Promise<{ rows: Review[]; count: number }> {
    const { limit, offset } = getPagination(req, 20);
    return Review.findAndCountAll({
      where:   { vendorId, status: 'approved' },
      order:   [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        ...REVIEW_INCLUDE,
        { model: Product, attributes: ['id', 'name', 'slug'] },
      ],
    });
  }

  // ── Private ────────────────────────────────────────────────

  async #updateProductRating(
    productId: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transaction: any,
  ): Promise<void> {
    const rows = await Review.findAll({
      where:      { productId, status: 'approved' },
      attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'cnt']],
      raw:        true,
    }) as unknown as { avg: string | null; cnt: string }[];

    const avg   = rows[0]?.avg  ? Math.round(Number(rows[0].avg) * 10) / 10 : 0;
    const count = rows[0]?.cnt  ? Number(rows[0].cnt) : 0;

    await Product.update(
      { rating: avg, reviewCount: count },
      { where: { id: productId }, transaction },
    );
  }
}

export const reviewsService = new ReviewsService();

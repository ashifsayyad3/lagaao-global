import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { reviewsService } from './reviews.service';
import { authenticate }   from '../../middleware/auth.middleware';
import { authorize }      from '../../middleware/rbac.middleware';
import { Role }           from '../../shared/types/roles';
import { ok, created, paginated, fail } from '../../shared/utils/response.util';
import { getPagination }  from '../../shared/utils/paginate.util';

const router = Router();

function validate(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { fail(res, 'Validation failed', 422, errors.array()); return false; }
  return true;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC — GET reviews for a product
// GET /api/v1/products/:id/reviews
// ─────────────────────────────────────────────────────────────
router.get(
  '/products/:productId/reviews',
  [
    param('productId').isInt({ min: 1 }),
    query('sort').optional().isIn(['newest','oldest','highest','lowest','helpful']),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req, res)) return;
    try {
      const { page, limit } = getPagination(req, 10);
      const result = await reviewsService.listForProduct(Number(req.params['productId']), req);
      res.json({
        success: true,
        data:    result.rows,
        meta: {
          page, limit,
          total:      result.count,
          totalPages: Math.ceil(result.count / limit),
          avgRating:     result.avgRating,
          distribution:  result.distribution,
        },
      });
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// CUSTOMER — POST review for a product
// POST /api/v1/products/:id/reviews
// ─────────────────────────────────────────────────────────────
router.post(
  '/products/:productId/reviews',
  authenticate,
  [
    param('productId').isInt({ min: 1 }),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('title').optional().isString().trim().isLength({ max: 160 }),
    body('body').optional().isString().trim().isLength({ max: 2000 }),
    body('images').optional().isArray({ max: 5 }),
    body('images.*').optional().isURL(),
    body('orderId').optional().isInt({ min: 1 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req, res)) return;
    try {
      const review = await reviewsService.create(req.user!.id, {
        productId: Number(req.params['productId']),
        orderId:   req.body.orderId ? Number(req.body.orderId) : undefined,
        rating:    Number(req.body.rating),
        title:     req.body.title,
        body:      req.body.body,
        images:    req.body.images,
      });
      created(res, review, 'Review submitted');
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// CUSTOMER — get own review for a product
// GET /api/v1/products/:id/reviews/mine
// ─────────────────────────────────────────────────────────────
router.get(
  '/products/:productId/reviews/mine',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const review = await reviewsService.getUserReview(
        req.user!.id,
        Number(req.params['productId']),
      );
      ok(res, review);
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// PUBLIC — mark a review as helpful
// POST /api/v1/reviews/:id/helpful
// ─────────────────────────────────────────────────────────────
router.post(
  '/reviews/:id/helpful',
  [param('id').isInt({ min: 1 })],
  async (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req, res)) return;
    try {
      await reviewsService.markHelpful(Number(req.params['id']));
      ok(res, null, 'Marked as helpful');
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// VENDOR — reply to a review
// POST /api/v1/vendor/reviews/:id/reply
// ─────────────────────────────────────────────────────────────
router.post(
  '/vendor/reviews/:id/reply',
  authenticate,
  authorize(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  [
    param('id').isInt({ min: 1 }),
    body('reply').notEmpty().isString().trim().isLength({ max: 1000 }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req, res)) return;
    try {
      // Resolve vendor profile ID from user
      const { VendorProfile } = await import('../../models');
      const vp = await VendorProfile.findOne({ where: { userId: req.user!.id } });
      if (!vp) return fail(res, 'Vendor profile not found', 404);
      const review = await reviewsService.vendorReply(
        Number(req.params['id']),
        vp.id,
        { reply: req.body.reply },
      );
      ok(res, review, 'Reply posted');
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// VENDOR — list own product reviews
// GET /api/v1/vendor/reviews
// ─────────────────────────────────────────────────────────────
router.get(
  '/vendor/reviews',
  authenticate,
  authorize(Role.VENDOR, Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = getPagination(req, 20);
      const { VendorProfile } = await import('../../models');
      const vp = await VendorProfile.findOne({ where: { userId: req.user!.id } });
      if (!vp) return fail(res, 'Vendor profile not found', 404);
      const { rows, count } = await reviewsService.vendorListReviews(vp.id, req);
      paginated(res, rows, page, limit, count);
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// ADMIN — list all reviews
// GET /api/v1/admin/reviews
// ─────────────────────────────────────────────────────────────
router.get(
  '/admin/reviews',
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = getPagination(req, 20);
      const { rows, count } = await reviewsService.adminList(req);
      paginated(res, rows, page, limit, count);
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// ADMIN — approve / reject
// PATCH /api/v1/admin/reviews/:id/status
// ─────────────────────────────────────────────────────────────
router.patch(
  '/admin/reviews/:id/status',
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['approved','rejected']),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req, res)) return;
    try {
      const review = await reviewsService.adminUpdateStatus(
        Number(req.params['id']),
        req.body.status,
      );
      ok(res, review, 'Status updated');
    } catch (err) { next(err); }
  },
);

// ─────────────────────────────────────────────────────────────
// ADMIN — delete review
// DELETE /api/v1/admin/reviews/:id
// ─────────────────────────────────────────────────────────────
router.delete(
  '/admin/reviews/:id',
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  [param('id').isInt({ min: 1 })],
  async (req: Request, res: Response, next: NextFunction) => {
    if (!validate(req, res)) return;
    try {
      await reviewsService.adminDelete(Number(req.params['id']));
      ok(res, null, 'Review deleted');
    } catch (err) { next(err); }
  },
);

export default router;

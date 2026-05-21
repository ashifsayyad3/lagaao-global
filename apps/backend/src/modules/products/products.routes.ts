import { Router } from 'express';
import { productsService } from './products.service';
import { ok, created, paginated } from '../../shared/utils/response.util';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { Role } from '../../shared/types/roles';
import { VendorProfile } from '../../models';

const router = Router();

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List products with filters & pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category slug
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [price_asc, price_desc, newest, rating] }
 *     responses:
 *       200:
 *         description: Paginated product list
 *
 * /products/featured:
 *   get:
 *     tags: [Products]
 *     summary: Get featured products
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: List of featured products
 *
 * /products/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Get product detail by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product detail with images, variants, attributes
 *       404:
 *         description: Not found
 *
 * /products/{id}/related:
 *   get:
 *     tags: [Products]
 *     summary: Get related products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Related products array
 *
 * /products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a product (vendor/admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               basePrice:   { type: number }
 *               salePrice:   { type: number }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated product
 *       403:
 *         description: Forbidden
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */

// ─── Public ───────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const r = await productsService.list(req);
    paginated(res, r.rows, r.page, r.limit, r.count);
  } catch (e) { next(e); }
});

router.get('/featured', async (req, res, next) => {
  try { ok(res, await productsService.getFeatured(+((req.query['limit'] as string) ?? 10))); }
  catch (e) { next(e); }
});

router.get('/:slug', async (req, res, next) => {
  try { ok(res, await productsService.findBySlug(req.params['slug'])); }
  catch (e) { next(e); }
});

router.get('/:id/related', async (req, res, next) => {
  try { ok(res, await productsService.getRelated(+req.params['id'])); }
  catch (e) { next(e); }
});

// ─── Admin / Vendor ───────────────────────────────────────────
router.post('/', authenticate, authorize(Role.VENDOR), async (req, res, next) => {
  try {
    let vendorId: number | null = null;
    if (req.user!.role === Role.VENDOR) {
      const vp = await VendorProfile.findOne({ where: { userId: req.user!.id, status: 'active' } });
      if (!vp) { res.status(403).json({ success: false, message: 'Vendor account is not active' }); return; }
      vendorId = vp.id;
    }
    const p = await productsService.create({ ...req.body, createdBy: req.user!.id, vendorId });
    created(res, p);
  } catch (e) { next(e); }
});

router.patch('/:id', authenticate, authorize(Role.VENDOR), async (req, res, next) => {
  try { ok(res, await productsService.update(+req.params['id'], req.body)); }
  catch (e) { next(e); }
});

router.post('/:id/publish', authenticate, authorize(Role.VENDOR), async (req, res, next) => {
  try { ok(res, await productsService.publish(+req.params['id']), 'Published'); }
  catch (e) { next(e); }
});

router.post('/:id/unpublish', authenticate, authorize(Role.VENDOR), async (req, res, next) => {
  try { ok(res, await productsService.unpublish(+req.params['id']), 'Unpublished'); }
  catch (e) { next(e); }
});

router.delete('/:id', authenticate, authorize(Role.ADMIN), async (req, res, next) => {
  try { await productsService.remove(+req.params['id']); ok(res, null, 'Deleted'); }
  catch (e) { next(e); }
});

export default router;

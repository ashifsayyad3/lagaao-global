import { Op, QueryTypes, fn, col, literal } from 'sequelize';
import {
  VendorProfile, VendorPayout,
  User, Product, ProductImage, ProductVariant, Category, Brand,
  OrderItem, Order, OrderStatusHistory, Inventory, InventoryLog, Coupon,
  sequelize,
} from '../../models';
import type { OrderStatus } from '../../models/order.model';
import type { InventoryLogType } from '../../models/inventory.model';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getPagination } from '../../shared/utils/paginate.util';
import type { Request } from 'express';

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class VendorService {

  // ─── Onboarding ────────────────────────────────────────────────
  async apply(userId: number, data: {
    storeName: string;
    description?: string;
    gstin?: string;
    pan?: string;
    address?: VendorProfile['address'];
  }): Promise<VendorProfile> {
    const existing = await VendorProfile.findOne({ where: { userId } });
    if (existing) throw new AppError('You already have a vendor profile', 400);

    const baseSlug = toSlug(data.storeName);
    let slug = baseSlug;
    let n = 1;
    while (await VendorProfile.findOne({ where: { storeSlug: slug } })) {
      slug = `${baseSlug}-${n++}`;
    }

    return VendorProfile.create({
      userId,
      storeName:   data.storeName,
      storeSlug:   slug,
      description: data.description ?? null,
      gstin:       data.gstin ?? null,
      pan:         data.pan ?? null,
      address:     data.address ?? null,
      status:      'pending',
    });
  }

  async getMyProfile(userId: number): Promise<VendorProfile> {
    const vendor = await VendorProfile.findOne({
      where: { userId },
      include: [{ model: User, attributes: ['id', 'name', 'email', 'phone'] }],
    });
    if (!vendor) throw new AppError('Vendor profile not found', 404);
    return vendor;
  }

  async updateProfile(userId: number, data: Partial<{
    storeName: string; description: string; logo: string; banner: string;
    website: string; gstin: string; pan: string;
    bankDetails: VendorProfile['bankDetails']; address: VendorProfile['address'];
  }>): Promise<VendorProfile> {
    const vendor = await VendorProfile.findOne({ where: { userId } });
    if (!vendor) throw new AppError('Vendor profile not found', 404);
    if (vendor.status === 'suspended') throw new AppError('Account is suspended', 403);
    return vendor.update(data);
  }

  // ─── Public store page ─────────────────────────────────────────
  async getStore(storeSlug: string): Promise<{ vendor: VendorProfile; products: Product[] }> {
    const vendor = await VendorProfile.findOne({
      where: { storeSlug, status: 'active' },
      include: [{ model: User, attributes: ['id', 'name'] }],
    });
    if (!vendor) throw new AppError('Store not found', 404);

    const products = await Product.findAll({
      where: { vendorId: vendor.id, status: 'active' },
      limit: 24,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Category, attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, separate: true, limit: 1, where: { isPrimary: true }, required: false },
      ],
    });

    return { vendor, products };
  }

  async listStores(req: Request): Promise<{ rows: VendorProfile[]; count: number }> {
    const { limit, offset } = getPagination(req, 20);
    const q = req.query['q'] as string | undefined;
    const where: Record<string, unknown> = { status: 'active' };
    if (q) where['storeName'] = { [Op.like]: `%${q}%` };

    return VendorProfile.findAndCountAll({
      where,
      limit,
      offset,
      order: [['totalRevenue', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name'] }],
    });
  }

  // ─── Vendor dashboard stats ────────────────────────────────────
  async getDashboardStats(userId: number): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    pendingOrders: number;
    revenueThisMonth: number;
    recentOrders: unknown[];
  }> {
    const vendor = await this.getMyProfile(userId);

    const [totalProducts, orderStats, monthStats, recentOrders] = await Promise.all([
      Product.count({ where: { vendorId: vendor.id, status: 'active' } }),

      OrderItem.findAll({
        attributes: ['qty', 'lineTotal', 'status'],
        include: [{
          model: Product,
          attributes: [],
          where: { vendorId: vendor.id },
          required: true,
        }],
      }),

      OrderItem.findAll({
        attributes: ['lineTotal'],
        include: [{
          model: Product,
          attributes: [],
          where: { vendorId: vendor.id },
          required: true,
        }, {
          model: Order,
          attributes: [],
          where: {
            createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            status: { [Op.notIn]: ['cancelled', 'refunded'] },
          },
          required: true,
        }],
      }),

      OrderItem.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [{
          model: Product,
          attributes: ['id', 'name', 'slug'],
          where: { vendorId: vendor.id },
          required: true,
        }, {
          model: Order,
          attributes: ['id', 'orderNumber', 'status', 'createdAt'],
          required: true,
        }],
      }),
    ]);

    const totalRevenue = orderStats
      .filter(o => !['cancelled', 'refunded'].includes(o.status))
      .reduce((s, o) => s + Number(o.lineTotal), 0);

    const totalOrders  = new Set(orderStats.map(o => (o as OrderItem & { order?: Order }).order?.id)).size;
    const pendingOrders = orderStats.filter(o =>
      ['pending', 'confirmed', 'processing'].includes(o.status)
    ).length;
    const revenueThisMonth = monthStats.reduce((s, o) => s + Number(o.lineTotal), 0);

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      pendingOrders,
      revenueThisMonth,
      recentOrders: recentOrders.map(o => o.toJSON()),
    };
  }

  // ─── Vendor products ───────────────────────────────────────────
  async getVendorProducts(userId: number, req: Request): Promise<{ rows: Product[]; count: number }> {
    const vendor = await this.getMyProfile(userId);
    const { limit, offset } = getPagination(req, 20);
    const status = req.query['status'] as string | undefined;
    const where: Record<string, unknown> = { vendorId: vendor.id };
    if (status) where['status'] = status;

    return Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Category, attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, separate: true, limit: 1, where: { isPrimary: true }, required: false },
      ],
      distinct: true,
    });
  }

  // ─── Vendor orders ─────────────────────────────────────────────
  async getVendorOrders(userId: number, req: Request): Promise<{ rows: OrderItem[]; count: number }> {
    const vendor = await this.getMyProfile(userId);
    const { limit, offset } = getPagination(req, 20);
    const status = req.query['status'] as string | undefined;

    const itemWhere: Record<string, unknown> = {};
    if (status) itemWhere['status'] = status;

    return OrderItem.findAndCountAll({
      where: itemWhere,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'slug', 'vendorId'],
          where: { vendorId: vendor.id },
          required: true,
        },
        {
          model: Order,
          attributes: ['id', 'orderNumber', 'status', 'createdAt', 'shippingAddress', 'paymentMethod', 'paymentStatus'],
          required: true,
        },
      ],
      distinct: true,
    });
  }

  // ─── Admin: vendor management ──────────────────────────────────
  async adminList(req: Request): Promise<{ rows: VendorProfile[]; count: number }> {
    const { limit, offset } = getPagination(req, 20);
    const status = req.query['status'] as string | undefined;
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;

    return VendorProfile.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      distinct: true,
    });
  }

  async adminApprove(vendorId: number, status: 'active' | 'rejected' | 'suspended'): Promise<VendorProfile> {
    const vendor = await VendorProfile.findByPk(vendorId);
    if (!vendor) throw new AppError('Vendor not found', 404);
    return vendor.update({ status, isVerified: status === 'active' });
  }

  async adminUpdateCommission(vendorId: number, commissionRate: number): Promise<VendorProfile> {
    const vendor = await VendorProfile.findByPk(vendorId);
    if (!vendor) throw new AppError('Vendor not found', 404);
    return vendor.update({ commissionRate });
  }

  // ─── Vendor product CRUD ───────────────────────────────────────

  async #loadProduct(productId: number, vendorId: number): Promise<Product> {
    const p = await Product.findOne({
      where: { id: productId, vendorId },
      include: [
        { model: Category, attributes: ['id', 'name', 'slug'] },
        { model: Brand,    attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, separate: true, order: [['sort_order', 'ASC']] as any },
        { model: ProductVariant, where: { isActive: true }, required: false },
      ],
    });
    if (!p) throw new AppError('Product not found', 404);
    return p;
  }

  async createProduct(userId: number, data: {
    name: string; slug?: string; sku?: string;
    description?: string; shortDescription?: string;
    categoryId: number; brandId?: number;
    basePrice: number; salePrice?: number; taxRate?: number;
    status?: 'draft' | 'active' | 'inactive';
    metaTitle?: string; metaDescription?: string; tags?: string[];
    hasVariants?: boolean;
    images?: { url: string; alt?: string; isPrimary?: boolean; sortOrder?: number }[];
    variants?: { sku: string; name?: string; price: number; salePrice?: number; attributes?: Record<string, string>; image?: string }[];
  }): Promise<Product> {
    const vendor = await this.getMyProfile(userId);
    if (vendor.status !== 'active') throw new AppError('Your store is not active yet', 403);

    let slug = data.slug ? toSlug(data.slug) : toSlug(data.name);
    let n = 1;
    while (await Product.findOne({ where: { slug }, paranoid: false })) {
      slug = `${toSlug(data.name)}-${n++}`;
    }

    const product = await Product.create({
      name:             data.name,
      slug,
      description:      data.description     ?? null,
      shortDescription: data.shortDescription ?? null,
      categoryId:       data.categoryId,
      brandId:          data.brandId          ?? null,
      basePrice:        data.basePrice,
      salePrice:        data.salePrice        ?? null,
      taxRate:          data.taxRate          ?? 18,
      status:           data.status           ?? 'draft',
      metaTitle:        data.metaTitle        ?? null,
      metaDescription:  data.metaDescription  ?? null,
      tags:             data.tags             ?? null,
      hasVariants:      data.hasVariants      ?? false,
      vendorId:         vendor.id,
      createdBy:        userId,
    });

    if (data.images?.length) {
      await ProductImage.bulkCreate(
        data.images.map((img, i) => ({
          productId: product.id, url: img.url, alt: img.alt ?? null,
          isPrimary: img.isPrimary ?? i === 0, sortOrder: img.sortOrder ?? i,
        })),
      );
    }

    if (data.hasVariants && data.variants?.length) {
      await ProductVariant.bulkCreate(
        data.variants.map((v, i) => ({
          productId: product.id, sku: v.sku, name: v.name ?? null,
          price: v.price, salePrice: v.salePrice ?? null,
          attributes: v.attributes ?? null, image: v.image ?? null, sortOrder: i,
        })),
      );
    }

    await vendor.increment('totalProducts');
    return this.#loadProduct(product.id, vendor.id);
  }

  async getProduct(userId: number, productId: number): Promise<Product> {
    const vendor = await this.getMyProfile(userId);
    return this.#loadProduct(productId, vendor.id);
  }

  async updateProduct(userId: number, productId: number, data: {
    name?: string; slug?: string; description?: string; shortDescription?: string;
    categoryId?: number; brandId?: number | null;
    basePrice?: number; salePrice?: number | null; taxRate?: number;
    status?: 'draft' | 'active' | 'inactive';
    metaTitle?: string; metaDescription?: string; tags?: string[];
    hasVariants?: boolean;
    images?: { url: string; alt?: string; isPrimary?: boolean; sortOrder?: number }[];
    variants?: { sku: string; name?: string; price: number; salePrice?: number; attributes?: Record<string, string>; image?: string }[];
  }): Promise<Product> {
    const vendor  = await this.getMyProfile(userId);
    const product = await Product.findOne({ where: { id: productId, vendorId: vendor.id } });
    if (!product) throw new AppError('Product not found', 404);

    const updates: Record<string, unknown> = { ...data };
    if (data.name && data.name !== product.name && !data.slug) {
      let slug = toSlug(data.name);
      let n = 1;
      while (await Product.findOne({ where: { slug }, paranoid: false })) slug = `${toSlug(data.name)}-${n++}`;
      updates['slug'] = slug;
    }
    delete updates['images'];
    delete updates['variants'];
    await product.update(updates);

    if (data.images !== undefined) {
      await ProductImage.destroy({ where: { productId: product.id } });
      if (data.images.length) {
        await ProductImage.bulkCreate(
          data.images.map((img, i) => ({
            productId: product.id, url: img.url, alt: img.alt ?? null,
            isPrimary: img.isPrimary ?? i === 0, sortOrder: img.sortOrder ?? i,
          })),
        );
      }
    }

    if (data.variants !== undefined) {
      await ProductVariant.destroy({ where: { productId: product.id }, force: true });
      if (data.variants.length) {
        await ProductVariant.bulkCreate(
          data.variants.map((v, i) => ({
            productId: product.id, sku: v.sku, name: v.name ?? null,
            price: v.price, salePrice: v.salePrice ?? null,
            attributes: v.attributes ?? null, image: v.image ?? null, sortOrder: i,
          })),
        );
      }
    }

    return this.#loadProduct(product.id, vendor.id);
  }

  async deleteProduct(userId: number, productId: number): Promise<void> {
    const vendor  = await this.getMyProfile(userId);
    const product = await Product.findOne({ where: { id: productId, vendorId: vendor.id } });
    if (!product) throw new AppError('Product not found', 404);
    await product.update({ status: 'archived' });
    if (product.status === 'active') await vendor.decrement('totalProducts');
  }

  async updateProductStatus(
    userId: number, productId: number,
    status: 'draft' | 'active' | 'inactive' | 'archived',
  ): Promise<Product> {
    const vendor  = await this.getMyProfile(userId);
    const product = await Product.findOne({ where: { id: productId, vendorId: vendor.id } });
    if (!product) throw new AppError('Product not found', 404);
    const wasActive = product.status === 'active';
    await product.update({ status });
    if (wasActive && status !== 'active') await vendor.decrement('totalProducts');
    if (!wasActive && status === 'active') await vendor.increment('totalProducts');
    return this.#loadProduct(productId, vendor.id);
  }

  // ─── Vendor order detail ───────────────────────────────────────
  async getOrderDetail(userId: number, orderId: number): Promise<Record<string, unknown>> {
    const vendor = await this.getMyProfile(userId);

    const vendorItems = await OrderItem.findAll({
      where: { orderId },
      include: [{
        model: Product,
        where:    { vendorId: vendor.id },
        required: true,
        attributes: ['id', 'name', 'slug'],
      }],
    });
    if (!vendorItems.length) throw new AppError('Order not found', 404);

    const order = await Order.findByPk(orderId, {
      include: [
        { model: User, attributes: ['id', 'name', 'email', 'phone'] },
        { model: OrderStatusHistory, order: [['createdAt', 'ASC']] as any },
      ],
    });
    if (!order) throw new AppError('Order not found', 404);

    return { ...order.toJSON(), items: vendorItems.map(i => i.toJSON()) };
  }

  async updateOrderItemStatus(
    userId: number,
    itemId: number,
    status: OrderStatus,
    note?: string,
  ): Promise<OrderItem> {
    const vendor = await this.getMyProfile(userId);

    const item = await OrderItem.findOne({
      where:   { id: itemId },
      include: [
        { model: Product, where: { vendorId: vendor.id }, required: true, attributes: ['id'] },
        { model: Order,   attributes: ['id'] },
      ],
    });
    if (!item) throw new AppError('Order item not found', 404);

    const allowed = this.#allowedTransitions(item.status);
    if (!allowed.includes(status)) {
      throw new AppError(`Cannot transition from '${item.status}' to '${status}'`, 400);
    }

    const prev = item.status;
    await item.update({ status });

    await OrderStatusHistory.create({
      orderId:    item.orderId,
      fromStatus: prev,
      toStatus:   status,
      note:       note ?? null,
      changedBy:  userId,
    });

    return item;
  }

  async addOrderTracking(
    userId: number,
    orderId: number,
    data: { trackingNumber: string; courier: string; estimatedDelivery?: string },
  ): Promise<Record<string, unknown>> {
    const vendor = await this.getMyProfile(userId);

    const hasItems = await OrderItem.findOne({
      where:   { orderId },
      include: [{ model: Product, where: { vendorId: vendor.id }, required: true }],
    });
    if (!hasItems) throw new AppError('Order not found', 404);

    const order = await Order.findByPk(orderId);
    if (!order) throw new AppError('Order not found', 404);

    await order.update({
      trackingNumber:    data.trackingNumber,
      courier:           data.courier,
      estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
    });

    return this.getOrderDetail(userId, orderId);
  }

  // ─── Payments & Earnings ──────────────────────────────────────

  async getEarningsOverview(userId: number): Promise<Record<string, unknown>> {
    const vendor = await this.getMyProfile(userId);
    const rate = Number(vendor.commissionRate) / 100;

    // Gross from all delivered order items for this vendor
    const deliveredItems = await OrderItem.findAll({
      include: [{ model: Product, where: { vendorId: vendor.id }, required: true, attributes: [] }],
      where: { status: 'delivered' },
    });
    const grossEarned = deliveredItems.reduce((sum, i) => sum + Number(i.lineTotal), 0);
    const commissionDeducted = grossEarned * rate;
    const netEarned = grossEarned - commissionDeducted;

    // Already paid out
    const paidPayouts = await VendorPayout.findAll({ where: { vendorId: vendor.id, status: 'paid' } });
    const totalPaid = paidPayouts.reduce((sum, p) => sum + Number(p.netAmount), 0);

    // Pending payouts
    const pendingPayouts = await VendorPayout.findAll({
      where: { vendorId: vendor.id, status: ['pending', 'processing'] },
    });
    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.netAmount), 0);

    const available = Math.max(0, netEarned - totalPaid - pendingAmount);

    return {
      grossEarned,
      commissionDeducted,
      netEarned,
      totalPaid,
      pendingAmount,
      available,
      commissionRate: vendor.commissionRate,
    };
  }

  async getTransactions(userId: number, req: Request): Promise<{ rows: unknown[]; count: number }> {
    const vendor = await this.getMyProfile(userId);
    const { page, limit, offset } = getPagination(req, 20);
    const rate = Number(vendor.commissionRate) / 100;

    const { rows, count } = await OrderItem.findAndCountAll({
      include: [
        { model: Product, where: { vendorId: vendor.id }, required: true, attributes: ['id', 'name', 'slug'] },
        { model: Order, attributes: ['id', 'orderNumber', 'createdAt', 'paymentStatus'] },
      ],
      where: { status: 'delivered' },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const enriched = rows.map(item => {
      const gross = Number(item.lineTotal);
      const commission = gross * rate;
      return {
        ...item.toJSON(),
        gross,
        commission: parseFloat(commission.toFixed(2)),
        net: parseFloat((gross - commission).toFixed(2)),
      };
    });

    return { rows: enriched, count };
  }

  async getPayouts(userId: number, req: Request): Promise<{ rows: VendorPayout[]; count: number }> {
    const vendor = await this.getMyProfile(userId);
    const { limit, offset } = getPagination(req, 20);
    return VendorPayout.findAndCountAll({
      where: { vendorId: vendor.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
  }

  async requestPayout(userId: number, amount: number): Promise<VendorPayout> {
    const vendor = await this.getMyProfile(userId);
    const overview = await this.getEarningsOverview(userId) as any;
    if (amount > overview.available) throw new AppError('Requested amount exceeds available balance', 400);
    if (amount < 100) throw new AppError('Minimum payout amount is ₹100', 400);
    const rate = Number(vendor.commissionRate) / 100;
    const commission = parseFloat((amount * rate).toFixed(2));
    return VendorPayout.create({
      vendorId: vendor.id,
      amount,
      commission,
      netAmount: parseFloat((amount - commission).toFixed(2)),
      status: 'pending',
    } as any);
  }

  // ─── Analytics ────────────────────────────────────────────────

  async getAnalytics(userId: number): Promise<Record<string, unknown>> {
    const vendor = await this.getMyProfile(userId);
    const rate = Number(vendor.commissionRate) / 100;
    const vendorId = vendor.id;

    // Revenue by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const revenueRows = await sequelize.query<{ month: string; gross: number; orders: number }>(
      `SELECT DATE_FORMAT(oi.created_at, '%Y-%m') AS month,
              SUM(oi.line_total) AS gross,
              COUNT(DISTINCT oi.order_id) AS orders
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE p.vendor_id = :vendorId
         AND oi.status = 'delivered'
         AND oi.created_at >= :from
       GROUP BY month
       ORDER BY month ASC`,
      { replacements: { vendorId, from: twelveMonthsAgo }, type: QueryTypes.SELECT },
    );

    // Top products by revenue
    const topProducts = await sequelize.query<{ productId: number; name: string; revenue: number; unitsSold: number }>(
      `SELECT oi.product_id AS productId, p.name, SUM(oi.line_total) AS revenue, SUM(oi.qty) AS unitsSold
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE p.vendor_id = :vendorId AND oi.status = 'delivered'
       GROUP BY oi.product_id, p.name
       ORDER BY revenue DESC
       LIMIT 10`,
      { replacements: { vendorId }, type: QueryTypes.SELECT },
    );

    // Order status breakdown
    const statusBreakdown = await sequelize.query<{ status: string; count: number }>(
      `SELECT oi.status, COUNT(*) AS count
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE p.vendor_id = :vendorId
       GROUP BY oi.status`,
      { replacements: { vendorId }, type: QueryTypes.SELECT },
    );

    // Total stats
    const allDelivered = await OrderItem.findAll({
      include: [{ model: Product, where: { vendorId }, required: true, attributes: [] }],
      where: { status: 'delivered' },
    });
    const grossTotal = allDelivered.reduce((s, i) => s + Number(i.lineTotal), 0);

    return {
      revenueByMonth: revenueRows.map(r => ({
        month: r.month,
        gross: Number(r.gross),
        net: Number(r.gross) * (1 - rate),
        orders: Number(r.orders),
      })),
      topProducts: topProducts.map(r => ({
        ...r,
        revenue: Number(r.revenue),
        unitsSold: Number(r.unitsSold),
      })),
      statusBreakdown: statusBreakdown.map(r => ({ status: r.status, count: Number(r.count) })),
      totals: {
        grossRevenue: grossTotal,
        netRevenue: grossTotal * (1 - rate),
        ordersDelivered: allDelivered.length,
      },
    };
  }

  // ─── Vendor inventory ──────────────────────────────────────────

  async getVendorInventory(userId: number, req: Request): Promise<{ rows: unknown[]; count: number }> {
    const vendor = await this.getMyProfile(userId);
    const { limit, offset } = getPagination(req, 30);
    const q = (req.query['q'] as string) ?? '';

    const { rows: variants, count } = await ProductVariant.findAndCountAll({
      include: [
        {
          model: Product,
          where: {
            vendorId: vendor.id,
            ...(q ? { name: { [Op.like]: `%${q}%` } } : {}),
          },
          required: true,
          attributes: ['id', 'name', 'slug'],
        },
        { model: Inventory, required: false },
      ],
      limit,
      offset,
      order: [['id', 'ASC']],
    });

    return { rows: variants.map(v => v.toJSON()), count };
  }

  async adjustInventory(
    userId: number,
    variantId: number,
    type: InventoryLogType,
    qtyChange: number,
    note?: string,
  ): Promise<unknown> {
    const vendor = await this.getMyProfile(userId);
    // Verify variant belongs to this vendor
    const variant = await ProductVariant.findOne({
      where: { id: variantId },
      include: [{ model: Product, where: { vendorId: vendor.id }, required: true }],
    });
    if (!variant) throw new AppError('Variant not found', 404);

    return sequelize.transaction(async (t) => {
      let inv = await Inventory.findOne({ where: { variantId }, transaction: t, lock: true });
      if (!inv) {
        inv = await Inventory.create({ variantId, qtyOnHand: 0, qtyReserved: 0, lowStockThreshold: 5 } as any, { transaction: t });
      }
      const qtyBefore = inv.qtyOnHand;
      const qtyAfter  = qtyBefore + qtyChange;
      if (qtyAfter < 0) throw new AppError('Insufficient stock', 400);
      inv.qtyOnHand = qtyAfter;
      await inv.save({ transaction: t });
      await InventoryLog.create({
        inventoryId: inv.id, type, qtyChange, qtyBefore, qtyAfter,
        note: note ?? null, createdBy: userId,
      } as any, { transaction: t });
      return inv.toJSON();
    });
  }

  async setLowStockThreshold(userId: number, variantId: number, threshold: number): Promise<unknown> {
    const vendor = await this.getMyProfile(userId);
    const variant = await ProductVariant.findOne({
      where: { id: variantId },
      include: [{ model: Product, where: { vendorId: vendor.id }, required: true }],
    });
    if (!variant) throw new AppError('Variant not found', 404);
    let inv = await Inventory.findOne({ where: { variantId } });
    if (!inv) inv = await Inventory.create({ variantId, qtyOnHand: 0, qtyReserved: 0, lowStockThreshold: threshold } as any);
    else { inv.lowStockThreshold = threshold; await inv.save(); }
    return inv.toJSON();
  }

  async getVendorLowStock(userId: number): Promise<unknown[]> {
    const vendor = await this.getMyProfile(userId);
    const variants = await ProductVariant.findAll({
      include: [
        { model: Product, where: { vendorId: vendor.id }, required: true, attributes: ['id', 'name'] },
        { model: Inventory, required: true },
      ],
    });
    return variants
      .filter(v => {
        const inv = (v as any).inventory as Inventory;
        return inv && (inv.isLowStock || inv.isOutOfStock);
      })
      .map(v => v.toJSON());
  }

  // ─── Customers ────────────────────────────────────────────────

  async getVendorCustomers(userId: number, req: Request): Promise<{ rows: unknown[]; count: number }> {
    const vendor = await this.getMyProfile(userId);
    const { limit, offset } = getPagination(req, 20);
    const q = (req.query['q'] as string) ?? '';

    // Get unique customers who ordered from this vendor (delivered items)
    const customerIds = await sequelize.query<{ userId: number }>(
      `SELECT DISTINCT o.user_id AS userId
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE p.vendor_id = :vendorId AND oi.status = 'delivered'`,
      { replacements: { vendorId: vendor.id }, type: QueryTypes.SELECT },
    );
    const ids = customerIds.map(r => r.userId);
    if (!ids.length) return { rows: [], count: 0 };

    const where: any = { id: ids };
    if (q) where['name'] = { [Op.like]: `%${q}%` };

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: ['id', 'name', 'email', 'phone', 'createdAt'],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Enrich with order stats
    const enriched = await Promise.all(rows.map(async u => {
      const stats = await sequelize.query<{ totalOrders: number; totalSpend: number }>(
        `SELECT COUNT(DISTINCT oi.order_id) AS totalOrders, SUM(oi.line_total) AS totalSpend
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN orders o ON o.id = oi.order_id
         WHERE p.vendor_id = :vendorId AND o.user_id = :userId AND oi.status = 'delivered'`,
        { replacements: { vendorId: vendor.id, userId: u.id }, type: QueryTypes.SELECT },
      );
      return {
        ...u.toJSON(),
        totalOrders: Number(stats[0]?.totalOrders ?? 0),
        totalSpend:  Number(stats[0]?.totalSpend ?? 0),
      };
    }));

    return { rows: enriched, count };
  }

  // ─── Coupons (vendor-created) ─────────────────────────────────
  // Note: Coupon model has no vendorId — vendor coupons are tracked by description prefix 'VND:<vendorId>:'

  async getVendorCoupons(userId: number, req: Request): Promise<{ rows: Coupon[]; count: number }> {
    const vendor = await this.getMyProfile(userId);
    const { limit, offset } = getPagination(req, 20);
    return Coupon.findAndCountAll({
      where: { code: { [Op.like]: `VND${vendor.id}-%` } },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
  }

  async createVendorCoupon(userId: number, data: {
    codeSuffix: string; type: 'percent' | 'fixed'; value: number;
    minOrderValue?: number; maxDiscount?: number; maxUses?: number;
    maxUsesPerUser?: number; expiresAt?: string;
  }): Promise<Coupon> {
    const vendor = await this.getMyProfile(userId);
    const code = `VND${vendor.id}-${data.codeSuffix.toUpperCase()}`;
    const existing = await Coupon.findOne({ where: { code } });
    if (existing) throw new AppError('Coupon code already exists', 409);
    return Coupon.create({
      code,
      type: data.type,
      value: data.value,
      minOrderValue: data.minOrderValue ?? null,
      maxDiscount: data.maxDiscount ?? null,
      maxUses: data.maxUses ?? null,
      maxUsesPerUser: data.maxUsesPerUser ?? 1,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: true,
    } as any);
  }

  async toggleVendorCoupon(userId: number, couponId: number): Promise<Coupon> {
    const vendor = await this.getMyProfile(userId);
    const coupon = await Coupon.findOne({
      where: { id: couponId, code: { [Op.like]: `VND${vendor.id}-%` } },
    });
    if (!coupon) throw new AppError('Coupon not found', 404);
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return coupon;
  }

  async deleteVendorCoupon(userId: number, couponId: number): Promise<void> {
    const vendor = await this.getMyProfile(userId);
    const coupon = await Coupon.findOne({
      where: { id: couponId, code: { [Op.like]: `VND${vendor.id}-%` } },
    });
    if (!coupon) throw new AppError('Coupon not found', 404);
    await coupon.destroy();
  }

  // ─── Reviews ──────────────────────────────────────────────────

  async getVendorProductStats(userId: number, req: Request): Promise<{ rows: unknown[]; count: number }> {
    const vendor = await this.getMyProfile(userId);
    const { limit, offset } = getPagination(req, 20);
    const { rows, count } = await Product.findAndCountAll({
      where: { vendorId: vendor.id },
      attributes: ['id', 'name', 'slug', 'status', 'basePrice', 'rating', 'reviewCount'],
      include: [{ model: ProductImage, where: { isPrimary: true }, required: false, attributes: ['url'] }],
      order: [['reviewCount', 'DESC']],
      limit,
      offset,
    });
    return { rows: rows.map(r => r.toJSON()), count };
  }

  #allowedTransitions(current: OrderStatus): OrderStatus[] {
    const map: Partial<Record<OrderStatus, OrderStatus[]>> = {
      pending:          ['confirmed', 'cancelled'],
      confirmed:        ['processing', 'cancelled'],
      processing:       ['shipped'],
      shipped:          ['out_for_delivery'],
      out_for_delivery: ['delivered'],
      delivered:        ['refund_requested'],
      refund_requested: ['refunded'],
    };
    return map[current] ?? [];
  }
}

export const vendorService = new VendorService();

import { Op } from 'sequelize';
import {
  VendorProfile, VendorPayout,
  User, Product, ProductImage, Category, Brand,
  OrderItem, Order,
} from '../../models';
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
}

export const vendorService = new VendorService();

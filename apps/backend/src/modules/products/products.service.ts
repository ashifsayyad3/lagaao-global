import { Op, WhereOptions, Order } from 'sequelize';
import type { Includeable } from 'sequelize';
import {
  Product, ProductVariant, ProductImage,
  Category, Brand, Inventory
} from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getPagination } from '../../shared/utils/paginate.util';
import { Request } from 'express';

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const PRODUCT_INCLUDE: Includeable[] = [
  { model: Category, attributes: ['id', 'name', 'slug'] },
  { model: Brand,    attributes: ['id', 'name', 'slug', 'logo'] },
  { model: ProductImage, separate: true, order: [['sort_order', 'ASC']] as Order },
  {
    model: ProductVariant,
    where: { isActive: true },
    required: false,
    include: [{ model: Inventory }],
  },
];

export class ProductsService {
  async list(req: Request) {
    const { limit, offset, page } = getPagination(req, 24);
    const { categoryId, category, brandId, minPrice, maxPrice, featured, sort, q } = req.query;

    const where: WhereOptions = { status: 'active' };

    // support both categoryId (integer) and category (slug)
    if (categoryId) {
      where['categoryId'] = categoryId;
    } else if (category) {
      const cat = await Category.findOne({ where: { slug: category } });
      if (cat) where['categoryId'] = cat.id;
    }

    if (brandId)    where['brandId']    = brandId;
    if (featured)   where['isFeatured'] = true;
    if (q)          where['name']       = { [Op.like]: `%${q}%` };
    if (minPrice || maxPrice) {
      where['basePrice'] = {
        ...(minPrice ? { [Op.gte]: minPrice } : {}),
        ...(maxPrice ? { [Op.lte]: maxPrice } : {}),
      };
    }

    const orderMap: Record<string, Order> = {
      rating:     [['rating',    'DESC']] as Order,
      price_asc:  [['basePrice', 'ASC']]  as Order,
      price_desc: [['basePrice', 'DESC']] as Order,
      newest:     [['createdAt', 'DESC']] as Order,
      popular:    [['reviewCount', 'DESC']] as Order,
    };
    const order: Order = orderMap[sort as string] ?? [['createdAt', 'DESC']] as Order;

    const { count, rows } = await Product.findAndCountAll({
      where, limit, offset,
      include: PRODUCT_INCLUDE,
      order,
      distinct: true,
    });

    return { rows, count, page, limit };
  }

  async findBySlug(slug: string): Promise<Product> {
    const p = await Product.findOne({
      where:   { slug, status: 'active' },
      include: PRODUCT_INCLUDE,
    });
    if (!p) throw new AppError('Product not found', 404);
    return p;
  }

  async findById(id: number): Promise<Product> {
    const p = await Product.findByPk(id, { include: PRODUCT_INCLUDE });
    if (!p) throw new AppError('Product not found', 404);
    return p;
  }

  async create(data: {
    name: string; categoryId: number; brandId?: number;
    description?: string; shortDescription?: string;
    basePrice: number; salePrice?: number; taxRate?: number;
    tags?: string[]; weight?: number; isDigital?: boolean;
    metaTitle?: string; metaDescription?: string;
    images?: { url: string; alt?: string; isPrimary?: boolean }[];
    variants?: {
      sku: string; price: number; salePrice?: number;
      attributes?: Record<string, string>; stock?: number;
    }[];
    createdBy?: number;
  }): Promise<Product> {
    let slug = toSlug(data.name);

    // Ensure unique slug
    const existing = await Product.count({ where: { slug } });
    if (existing > 0) slug = `${slug}-${Date.now()}`;

    const product = await Product.create({
      ...data,
      slug,
      status:      'draft',
      hasVariants: (data.variants?.length ?? 0) > 0,
    });

    // Create images
    if (data.images?.length) {
      await ProductImage.bulkCreate(
        data.images.map((img, i) => ({ ...img, productId: product.id, sortOrder: i })),
      );
    }

    // Create variants + inventory
    if (data.variants?.length) {
      for (const v of data.variants) {
        const variant = await ProductVariant.create({ ...v, productId: product.id });
        await Inventory.create({ variantId: variant.id, qtyOnHand: v.stock ?? 0 });
      }
    } else {
      // Single-variant product — create default variant
      const variant = await ProductVariant.create({
        productId: product.id,
        sku:       `${slug.toUpperCase().slice(0, 8)}-001`,
        price:     data.basePrice,
        salePrice: data.salePrice ?? null,
      });
      await Inventory.create({ variantId: variant.id, qtyOnHand: 0 });
    }

    return this.findById(product.id);
  }

  async update(id: number, data: Partial<Product>): Promise<Product> {
    const p = await Product.findByPk(id);
    if (!p) throw new AppError('Product not found', 404);
    await p.update(data);
    return this.findById(id);
  }

  async publish(id: number): Promise<Product> {
    return this.update(id, { status: 'active' } as Partial<Product>);
  }

  async unpublish(id: number): Promise<Product> {
    return this.update(id, { status: 'inactive' } as Partial<Product>);
  }

  async remove(id: number): Promise<void> {
    const p = await Product.findByPk(id);
    if (!p) throw new AppError('Product not found', 404);
    await p.update({ status: 'archived' });
    await p.destroy();
  }

  async getFeatured(limit = 10): Promise<Product[]> {
    return Product.findAll({
      where:   { isFeatured: true, status: 'active' },
      limit,
      include: PRODUCT_INCLUDE,
      order:   [['createdAt', 'DESC']],
    });
  }

  async getRelated(productId: number, limit = 8): Promise<Product[]> {
    const p = await Product.findByPk(productId);
    if (!p) return [];
    return Product.findAll({
      where:   { categoryId: p.categoryId, status: 'active', id: { [Op.ne]: productId } },
      limit,
      include: PRODUCT_INCLUDE,
    });
  }
}

export const productsService = new ProductsService();

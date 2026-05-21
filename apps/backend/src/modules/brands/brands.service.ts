import { Brand } from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';
import { getPagination } from '../../shared/utils/paginate.util';
import { Request } from 'express';

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class BrandsService {
  async list(req: Request) {
    const { limit, offset, page } = getPagination(req);
    const { count, rows } = await Brand.findAndCountAll({
      where: { isActive: true },
      limit, offset,
      order: [['name', 'ASC']],
    });
    return { rows, count, page, limit };
  }

  async findBySlug(slug: string): Promise<Brand> {
    const b = await Brand.findOne({ where: { slug, isActive: true } });
    if (!b) throw new AppError('Brand not found', 404);
    return b;
  }

  async create(data: { name: string; logo?: string; description?: string }): Promise<Brand> {
    const slug = toSlug(data.name);
    const exists = await Brand.findOne({ where: { slug } });
    if (exists) throw new AppError('Brand already exists', 409);
    return Brand.create({ ...data, slug, isActive: true });
  }

  async update(id: number, data: Partial<Brand>): Promise<Brand> {
    const b = await Brand.findByPk(id);
    if (!b) throw new AppError('Brand not found', 404);
    await b.update(data);
    return b;
  }

  async remove(id: number): Promise<void> {
    const b = await Brand.findByPk(id);
    if (!b) throw new AppError('Brand not found', 404);
    await b.destroy();
  }
}

export const brandsService = new BrandsService();

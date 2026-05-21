import { Category } from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class CategoriesService {
  async getTree(): Promise<unknown[]> {
    const all = await Category.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });

    const map = new Map<number, Record<string, unknown>>();
    const roots: Record<string, unknown>[] = [];

    for (const c of all) {
      const obj = { ...c.toJSON(), children: [] as unknown[] };
      map.set(c.id, obj);
    }
    for (const [id, obj] of map) {
      const parentId = obj['parentId'] as number | null;
      if (parentId && map.has(parentId)) {
        (map.get(parentId)!['children'] as unknown[]).push(obj);
      } else {
        roots.push(obj);
      }
    }
    return roots;
  }

  async findBySlug(slug: string): Promise<Category> {
    const cat = await Category.findOne({ where: { slug, isActive: true } });
    if (!cat) throw new AppError('Category not found', 404);
    return cat;
  }

  async create(data: {
    name: string; parentId?: number | null; image?: string; sortOrder?: number;
  }): Promise<Category> {
    const slug = toSlug(data.name);
    const exists = await Category.findOne({ where: { slug } });
    if (exists) throw new AppError('Category with this name already exists', 409);
    return Category.create({ ...data, slug, isActive: true });
  }

  async update(id: number, data: Partial<{ name: string; isActive: boolean; sortOrder: number; image: string }>): Promise<Category> {
    const cat = await Category.findByPk(id);
    if (!cat) throw new AppError('Category not found', 404);
    await cat.update(data);
    return cat;
  }

  async remove(id: number): Promise<void> {
    const cat = await Category.findByPk(id);
    if (!cat) throw new AppError('Category not found', 404);
    await cat.destroy();
  }
}

export const categoriesService = new CategoriesService();

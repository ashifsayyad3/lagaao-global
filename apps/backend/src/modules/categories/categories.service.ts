import { Category } from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';
import { cached, invalidate } from '../../shared/utils/cache.util';

const TREE_KEY = 'cat:tree';
const TTL      = 60 * 10; // 10 min

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export class CategoriesService {
  async getTree(): Promise<unknown[]> {
    return cached(TREE_KEY, async () => {
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
      for (const [, obj] of map) {
        const parentId = obj['parentId'] as number | null;
        if (parentId && map.has(parentId)) {
          (map.get(parentId)!['children'] as unknown[]).push(obj);
        } else {
          roots.push(obj);
        }
      }
      return roots;
    }, TTL);
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
    const cat = await Category.create({ ...data, slug, isActive: true });
    await invalidate(TREE_KEY);
    return cat;
  }

  async update(id: number, data: Partial<{ name: string; isActive: boolean; sortOrder: number; image: string }>): Promise<Category> {
    const cat = await Category.findByPk(id);
    if (!cat) throw new AppError('Category not found', 404);
    await cat.update(data);
    await invalidate(TREE_KEY);
    return cat;
  }

  async remove(id: number): Promise<void> {
    const cat = await Category.findByPk(id);
    if (!cat) throw new AppError('Category not found', 404);
    await cat.destroy();
    await invalidate(TREE_KEY);
  }
}

export const categoriesService = new CategoriesService();

import { Request } from 'express';
import { Op } from 'sequelize';
import { SeoMeta }     from '../../models/seoMeta.model';
import { RedirectRule } from '../../models/redirectRule.model';
import { Product }     from '../../models/product.model';
import { Category }    from '../../models/category.model';
import { sequelize }   from '../../models/index';

const SITE_URL = 'https://lagaao.com';

// ─── SeoMeta CRUD ─────────────────────────────────────────────────────────────

export async function listSeoMeta(req: Request) {
  const page  = Math.max(1, Number(req.query['page']  ?? 1));
  const limit = Math.min(100, Number(req.query['limit'] ?? 20));
  const type  = req.query['entityType'] as string | undefined;
  const where: any = type ? { entityType: type } : {};

  const { count, rows } = await SeoMeta.findAndCountAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });
  return { items: rows, total: count, page, limit };
}

export async function getSeoMeta(entityType: string, entityId?: number, path?: string) {
  const where: any = { entityType };
  if (entityId !== undefined) where.entityId = entityId;
  if (path)                   where.path     = path;
  return SeoMeta.findOne({ where });
}

export async function upsertSeoMeta(data: Partial<SeoMeta> & { entityType: string }) {
  const where: any = { entityType: data.entityType };
  if (data.entityId !== undefined) where.entityId = data.entityId;
  if (data.path)                   where.path     = data.path;

  const [record] = await SeoMeta.upsert({ ...data } as any);
  return record;
}

export async function deleteSeoMeta(id: number) {
  const row = await SeoMeta.findByPk(id);
  if (!row) throw new Error('Not found');
  await row.destroy();
}

// ─── Redirect Rules ───────────────────────────────────────────────────────────

export async function listRedirects(req: Request) {
  const page  = Math.max(1, Number(req.query['page']  ?? 1));
  const limit = Math.min(200, Number(req.query['limit'] ?? 50));
  const { count, rows } = await RedirectRule.findAndCountAll({
    order: [['hitCount', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });
  return { items: rows, total: count, page, limit };
}

export async function createRedirect(fromPath: string, toPath: string, statusCode = 301) {
  return RedirectRule.create({ fromPath, toPath, statusCode, isActive: true } as any);
}

export async function updateRedirect(id: number, data: Partial<{ fromPath: string; toPath: string; statusCode: number; isActive: boolean }>) {
  const row = await RedirectRule.findByPk(id);
  if (!row) throw new Error('Not found');
  return row.update(data);
}

export async function deleteRedirect(id: number) {
  const row = await RedirectRule.findByPk(id);
  if (!row) throw new Error('Not found');
  await row.destroy();
}

// ─── Sitemap.xml generation ───────────────────────────────────────────────────

export async function generateSitemap(): Promise<string> {
  const [products, categories] = await Promise.all([
    Product.findAll({
      where: { status: 'published' },
      attributes: ['slug', 'updatedAt'],
      limit: 10000,
    }),
    Category.findAll({
      attributes: ['slug', 'updatedAt'],
    }),
  ]);

  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/products', priority: '0.9', changefreq: 'daily' },
    { loc: '/about', priority: '0.5', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
  ];

  const urls: string[] = [];

  for (const page of staticPages) {
    urls.push(`  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>
  </url>`);
  }

  for (const cat of categories) {
    urls.push(`  <url>
    <loc>${SITE_URL}/products?category=${cat.slug}</loc>
    <lastmod>${(cat.updatedAt as Date).toISOString().split('T')[0]}</lastmod>
    <priority>0.8</priority>
    <changefreq>daily</changefreq>
  </url>`);
  }

  for (const p of products) {
    urls.push(`  <url>
    <loc>${SITE_URL}/products/${p.get('slug')}</loc>
    <lastmod>${(p.get('updatedAt') as Date).toISOString().split('T')[0]}</lastmod>
    <priority>0.7</priority>
    <changefreq>weekly</changefreq>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// ─── SEO Analytics ────────────────────────────────────────────────────────────

export async function getSeoStats() {
  const [total, noIndex, withImage, withKeywords] = await Promise.all([
    SeoMeta.count(),
    SeoMeta.count({ where: { noIndex: true } }),
    SeoMeta.count({ where: { ogImage: { [Op.not]: null } } }),
    SeoMeta.count({ where: { keywords: { [Op.not]: null } } }),
  ]);
  const coverageRate = total > 0 ? Math.round((withImage / total) * 100) : 0;
  return { total, noIndex, withImage, withKeywords, coverageRate };
}

// ─── Web Vitals ingestion ─────────────────────────────────────────────────────

const vitalsBuffer: Array<{ name: string; value: number; url: string; ts: number }> = [];

export function recordVital(data: { name: string; value: number; url: string; ts: number }) {
  vitalsBuffer.push(data);
  if (vitalsBuffer.length > 1000) vitalsBuffer.shift(); // rolling window
}

export function getVitalsAggregated() {
  const map: Record<string, number[]> = {};
  for (const v of vitalsBuffer) {
    if (!map[v.name]) map[v.name] = [];
    map[v.name].push(v.value);
  }
  return Object.entries(map).map(([name, values]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    return { name, p75: Math.round(p75), avg: Math.round(avg), count: values.length };
  });
}

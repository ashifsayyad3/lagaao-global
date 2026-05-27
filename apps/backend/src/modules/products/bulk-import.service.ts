import { parse } from 'csv-parse/sync';
import { Op } from 'sequelize';
import { Product, Category, Brand } from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';
import { logger } from '../../config/logger';

// ─── Expected CSV columns (case-insensitive header matching) ──────────────────
// name*, category*, basePrice*, sku, description, brand, comparePrice,
// taxRate, hsnCode, status, isFeatured, tags, weight

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function norm(h: string): string {
  return h.toLowerCase().replace(/[\s_-]+/g, '');
}

const REQUIRED = ['name', 'category', 'baseprice'];

export interface BulkImportResult {
  imported: number;
  updated:  number;
  skipped:  number;
  errors:   { row: number; sku?: string; name?: string; error: string }[];
}

export async function bulkImportProducts(
  csvBuffer: Buffer,
): Promise<BulkImportResult> {
  // ── Parse CSV ────────────────────────────────────────────────────────────────
  let records: Record<string, string>[];
  try {
    records = parse(csvBuffer, {
      columns: (headers: string[]) => headers.map(norm),
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  } catch (err) {
    throw new AppError(`CSV parse error: ${(err as Error).message}`, 400);
  }

  if (!records.length) throw new AppError('CSV is empty', 400);

  // Validate required headers
  const firstRow = records[0];
  for (const req of REQUIRED) {
    if (!(req in firstRow)) {
      throw new AppError(`Missing required column: ${req}`, 400);
    }
  }

  // ── Pre-load categories and brands for the whole file ────────────────────────
  const catNames  = [...new Set(records.map(r => r['category']).filter(Boolean))];
  const brandNames = [...new Set(records.map(r => r['brand']).filter(Boolean))];

  const cats  = await Category.findAll({ where: { name: { [Op.in]: catNames } } });
  const brands = await Brand.findAll({ where: { name: { [Op.in]: brandNames } } });

  const catMap  = new Map(cats.map(c => [c.name.toLowerCase(), c.id]));
  const brandMap = new Map(brands.map(b => [b.name.toLowerCase(), b.id]));

  const result: BulkImportResult = { imported: 0, updated: 0, skipped: 0, errors: [] };

  for (let i = 0; i < records.length; i++) {
    const r    = records[i];
    const rowNum = i + 2; // 1-based + header row

    const name      = r['name']?.trim();
    const catStr    = r['category']?.trim();
    const priceStr  = r['baseprice']?.trim();

    // ── Validate required fields ────────────────────────────────────────────
    if (!name)     { result.errors.push({ row: rowNum, error: 'name is required' });     result.skipped++; continue; }
    if (!catStr)   { result.errors.push({ row: rowNum, name, error: 'category is required' }); result.skipped++; continue; }
    if (!priceStr) { result.errors.push({ row: rowNum, name, error: 'basePrice is required' }); result.skipped++; continue; }

    const basePrice = parseFloat(priceStr);
    if (isNaN(basePrice) || basePrice < 0) {
      result.errors.push({ row: rowNum, name, error: `Invalid basePrice: ${priceStr}` });
      result.skipped++;
      continue;
    }

    const categoryId = catMap.get(catStr.toLowerCase());
    if (!categoryId) {
      result.errors.push({ row: rowNum, name, error: `Category not found: ${catStr}` });
      result.skipped++;
      continue;
    }

    // Optional fields
    const sku          = r['sku']?.trim()          || null;
    const brandStr     = r['brand']?.trim()        || null;
    const comparePrice = r['compareprice']         ? parseFloat(r['compareprice'])  : null;
    const taxRate      = r['taxrate']              ? parseFloat(r['taxrate'])        : 18;
    const hsnCode      = r['hsncode']?.trim()      || '0602';
    const description  = r['description']?.trim()  || null;
    const statusRaw    = r['status']?.trim()        || 'active';
    const status       = ['active', 'inactive', 'draft'].includes(statusRaw) ? statusRaw : 'active';
    const isFeatured   = r['isfeatured']?.toLowerCase() === 'true';
    const weight       = r['weight']               ? parseFloat(r['weight'])         : null;
    const tagsRaw      = r['tags']?.trim()         || '';
    const tags         = tagsRaw ? tagsRaw.split('|').map(t => t.trim()).filter(Boolean) : null;

    const brandId = brandStr ? (brandMap.get(brandStr.toLowerCase()) ?? null) : null;

    const slug = toSlug(name) + (sku ? `-${toSlug(sku)}` : '');

    try {
      if (sku) {
        // Upsert by SKU
        const [, created] = await Product.upsert({
          name, slug, description, categoryId, brandId,
          basePrice, salePrice: comparePrice,
          taxRate: isNaN(taxRate) ? 18 : taxRate,
          hsnCode, status, isFeatured,
          weight: weight && !isNaN(weight) ? weight : null,
          tags,
        });
        if (created) result.imported++; else result.updated++;
      } else {
        // Find-or-create by name + categoryId
        const existing = await Product.findOne({ where: { name, categoryId } });
        if (existing) {
          await existing.update({
            description, brandId, basePrice,
            salePrice: comparePrice,
            taxRate: isNaN(taxRate) ? 18 : taxRate,
            hsnCode, status, isFeatured,
            weight: weight && !isNaN(weight) ? weight : null,
            tags,
          });
          result.updated++;
        } else {
          await Product.create({
            name, slug, description, categoryId, brandId,
            basePrice, salePrice: comparePrice,
            taxRate: isNaN(taxRate) ? 18 : taxRate,
            hsnCode, status, isFeatured,
            weight: weight && !isNaN(weight) ? weight : null,
            tags,
          });
          result.imported++;
        }
      }
    } catch (err) {
      const msg = (err as Error).message ?? 'Unknown error';
      logger.warn(`Bulk import row ${rowNum} failed: ${msg}`);
      result.errors.push({ row: rowNum, sku: sku ?? undefined, name, error: msg });
      result.skipped++;
    }
  }

  logger.info(`Bulk import done: +${result.imported} created, ~${result.updated} updated, ${result.skipped} skipped`);
  return result;
}

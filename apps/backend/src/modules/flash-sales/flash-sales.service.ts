import { Op, literal } from 'sequelize';
import type { Transaction } from 'sequelize';
import { FlashSale, FlashSaleItem } from '../../models/flashSale.model';
import { Product, ProductImage, ProductVariant } from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';
import { cached, invalidate } from '../../shared/utils/cache.util';
import { logger } from '../../config/logger';

const CACHE_KEY = 'flash_sales:active';
const CACHE_TTL = 60; // 1 minute

const ITEM_INCLUDE = [
  {
    model: Product,
    attributes: ['id', 'name', 'slug', 'basePrice'],
    include: [{ model: ProductImage, attributes: ['url'], limit: 1, order: [['sort_order', 'ASC']] }],
  },
  { model: ProductVariant, attributes: ['id', 'sku', 'attributes'], required: false },
];

export class FlashSalesService {
  // ── Public ──────────────────────────────────────────────────────────────────

  /** Get all currently active flash sales (cached) */
  async getActive(): Promise<FlashSale[]> {
    return cached(CACHE_KEY, () => this.#queryActive(), CACHE_TTL);
  }

  async #queryActive(): Promise<FlashSale[]> {
    const now = new Date();
    return FlashSale.findAll({
      where: { isActive: true, startAt: { [Op.lte]: now }, endAt: { [Op.gt]: now } },
      include: [{ model: FlashSaleItem, include: ITEM_INCLUDE }],
      order: [['endAt', 'ASC']],
    });
  }

  /** Check if a product/variant has a flash sale price right now */
  async getFlashPrice(productId: number, variantId: number | null): Promise<FlashSaleItem | null> {
    const now = new Date();
    return FlashSaleItem.findOne({
      where: {
        productId,
        variantId: variantId ?? null,
      },
      include: [{
        model: FlashSale,
        where: { isActive: true, startAt: { [Op.lte]: now }, endAt: { [Op.gt]: now } },
        required: true,
      }],
    });
  }

  /** Atomically increment sold count; throws if stock exhausted */
  async claimStock(flashSaleItemId: number, qty: number, t?: Transaction): Promise<void> {
    const item = await FlashSaleItem.findByPk(flashSaleItemId, { lock: true, transaction: t });
    if (!item) return;
    if (item.stockLimit != null && item.sold + qty > item.stockLimit) {
      throw new AppError('Flash sale stock exhausted for this item', 400);
    }
    await item.increment('sold', { by: qty, transaction: t });
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  async adminList(): Promise<FlashSale[]> {
    return FlashSale.findAll({
      include: [{ model: FlashSaleItem, include: ITEM_INCLUDE }],
      order: [['startAt', 'DESC']],
      paranoid: false,
    });
  }

  async adminGet(id: number): Promise<FlashSale> {
    const sale = await FlashSale.findByPk(id, {
      include: [{ model: FlashSaleItem, include: ITEM_INCLUDE }],
    });
    if (!sale) throw new AppError('Flash sale not found', 404);
    return sale;
  }

  async create(input: {
    name: string; description?: string; bannerImage?: string;
    startAt: string; endAt: string; isActive?: boolean; maxPerUser?: number;
  }): Promise<FlashSale> {
    if (new Date(input.startAt) >= new Date(input.endAt)) {
      throw new AppError('startAt must be before endAt', 400);
    }
    const sale = await FlashSale.create(input);
    await invalidate(CACHE_KEY);
    logger.info(`Flash sale created: ${sale.id} "${sale.name}"`);
    return sale;
  }

  async update(id: number, input: Partial<{
    name: string; description: string; bannerImage: string;
    startAt: string; endAt: string; isActive: boolean; maxPerUser: number;
  }>): Promise<FlashSale> {
    const sale = await FlashSale.findByPk(id);
    if (!sale) throw new AppError('Flash sale not found', 404);
    await sale.update(input);
    await invalidate(CACHE_KEY);
    return sale.reload({ include: [{ model: FlashSaleItem, include: ITEM_INCLUDE }] });
  }

  async remove(id: number): Promise<void> {
    const sale = await FlashSale.findByPk(id);
    if (!sale) throw new AppError('Flash sale not found', 404);
    await sale.destroy();
    await invalidate(CACHE_KEY);
  }

  async addItem(flashSaleId: number, input: {
    productId: number; variantId?: number | null;
    salePrice: number; originalPrice: number;
    stockLimit?: number | null;
  }): Promise<FlashSaleItem> {
    const sale = await FlashSale.findByPk(flashSaleId);
    if (!sale) throw new AppError('Flash sale not found', 404);

    const [item] = await FlashSaleItem.upsert({
      flashSaleId,
      productId:     input.productId,
      variantId:     input.variantId ?? null,
      salePrice:     input.salePrice,
      originalPrice: input.originalPrice,
      stockLimit:    input.stockLimit ?? null,
      sold:          0,
    });
    await invalidate(CACHE_KEY);
    return item.reload({ include: ITEM_INCLUDE });
  }

  async removeItem(flashSaleId: number, itemId: number): Promise<void> {
    const item = await FlashSaleItem.findOne({ where: { id: itemId, flashSaleId } });
    if (!item) throw new AppError('Item not found', 404);
    await item.destroy();
    await invalidate(CACHE_KEY);
  }
}

export const flashSalesService = new FlashSalesService();

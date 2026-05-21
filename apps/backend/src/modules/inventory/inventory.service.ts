import { sequelize, Inventory, InventoryLog, ProductVariant } from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';
import type { InventoryLogType } from '../../models/inventory.model';

export class InventoryService {
  async getByVariant(variantId: number): Promise<Inventory> {
    const inv = await Inventory.findOne({ where: { variantId } });
    if (!inv) throw new AppError('Inventory record not found', 404);
    return inv;
  }

  async adjust(
    variantId: number,
    type: InventoryLogType,
    qtyChange: number,
    opts: { referenceType?: string; referenceId?: number; note?: string; createdBy?: number } = {},
  ): Promise<Inventory> {
    return sequelize.transaction(async (t) => {
      const inv = await Inventory.findOne({ where: { variantId }, transaction: t, lock: true });
      if (!inv) throw new AppError('Inventory not found', 404);

      const qtyBefore = inv.qtyOnHand;
      const qtyAfter  = qtyBefore + qtyChange;

      if (qtyAfter < 0) throw new AppError('Insufficient stock', 400);

      inv.qtyOnHand = qtyAfter;
      await inv.save({ transaction: t });

      await InventoryLog.create({
        inventoryId:   inv.id,
        type,
        qtyChange,
        qtyBefore,
        qtyAfter,
        referenceType: opts.referenceType ?? null,
        referenceId:   opts.referenceId   ?? null,
        note:          opts.note          ?? null,
        createdBy:     opts.createdBy     ?? null,
      }, { transaction: t });

      return inv;
    });
  }

  // Reserve stock (when order placed)
  async reserve(variantId: number, qty: number, orderId: number): Promise<void> {
    const inv = await Inventory.findOne({ where: { variantId } });
    if (!inv) throw new AppError('Inventory not found', 404);
    if (inv.qtyAvailable < qty) throw new AppError('Insufficient available stock', 400);
    inv.qtyReserved += qty;
    await inv.save();
  }

  // Release reservation (cancel or refund)
  async release(variantId: number, qty: number): Promise<void> {
    const inv = await Inventory.findOne({ where: { variantId } });
    if (!inv) throw new AppError('Inventory not found', 404);
    inv.qtyReserved = Math.max(0, inv.qtyReserved - qty);
    await inv.save();
  }

  // Confirm sale (reduce onHand, clear reservation)
  async confirmSale(variantId: number, qty: number, orderId: number, userId?: number): Promise<void> {
    await this.adjust(variantId, 'sale', -qty, {
      referenceType: 'order', referenceId: orderId, createdBy: userId,
    });
    await this.release(variantId, qty);
  }

  async getLowStockAlerts(): Promise<Inventory[]> {
    const all = await Inventory.findAll({
      include: [{ model: ProductVariant }],
    });
    return all.filter(i => i.isLowStock || i.isOutOfStock);
  }

  async getLogs(variantId: number): Promise<InventoryLog[]> {
    const inv = await Inventory.findOne({ where: { variantId } });
    if (!inv) throw new AppError('Not found', 404);
    return InventoryLog.findAll({
      where: { inventoryId: inv.id },
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
  }
}

export const inventoryService = new InventoryService();

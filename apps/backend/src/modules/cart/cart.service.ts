import { sequelize, Cart, CartItem, Product, ProductVariant, ProductImage, Inventory } from '../../models';
import { AppError } from '../../middleware/errorHandler.middleware';

const CART_INCLUDE = [
  {
    model: CartItem,
    include: [
      {
        model: Product,
        attributes: ['id', 'name', 'slug', 'basePrice', 'salePrice', 'status'],
        include: [
          { model: ProductImage, attributes: ['url', 'isPrimary'], separate: true, limit: 3, required: false },
        ],
      },
      {
        model: ProductVariant,
        attributes: ['id', 'name', 'sku', 'price', 'salePrice', 'attributes', 'image'],
        include: [{ model: Inventory, attributes: ['qtyOnHand', 'qtyReserved', 'lowStockThreshold'] }],
        required: false,
      },
    ],
  },
];

export interface CartSummary {
  id:           number;
  items:        CartItemDTO[];
  subtotal:     number;
  itemCount:    number;
}

export interface CartItemDTO {
  id:           number;
  productId:    number;
  productName:  string;
  productSlug:  string;
  variantId:    number | null;
  variantName:  string | null;
  variantAttrs: Record<string, string> | null;
  sku:          string | null;
  image:        string;
  price:        number;
  effectivePrice: number;
  qty:          number;
  lineTotal:    number;
  isOutOfStock: boolean;
}

export class CartService {

  async getOrCreate(userId: number | null, sessionId: string | null): Promise<Cart> {
    if (!userId && !sessionId) throw new AppError('Cart identity required', 400);

    const where = userId ? { userId } : { sessionId };
    let cart = await Cart.findOne({ where, include: CART_INCLUDE });
    if (!cart) {
      cart = await Cart.create(userId ? { userId } : { sessionId });
      cart = await Cart.findByPk(cart.id, { include: CART_INCLUDE }) as Cart;
    }
    return cart;
  }

  async getCart(userId: number | null, sessionId: string | null): Promise<CartSummary> {
    const cart = await this.getOrCreate(userId, sessionId);
    return this.#toSummary(cart);
  }

  async addItem(
    userId: number | null,
    sessionId: string | null,
    productId: number,
    variantId: number | null,
    qty: number,
  ): Promise<CartSummary> {
    const cart = await this.getOrCreate(userId, sessionId);

    // Validate product exists and is active
    const product = await Product.findOne({
      where: { id: productId, status: 'active' },
    });
    if (!product) throw new AppError('Product not found or unavailable', 404);

    // Resolve price
    let price: number;
    let inventory: Inventory | null = null;

    if (variantId) {
      const variant = await ProductVariant.findOne({
        where: { id: variantId, productId },
        include: [{ model: Inventory }],
      });
      if (!variant) throw new AppError('Variant not found', 404);
      inventory = variant.inventory ?? null;
      price = variant.salePrice ? Number(variant.salePrice) : Number(variant.price);
    } else {
      price = product.salePrice ? Number(product.salePrice) : Number(product.basePrice);
    }

    if (inventory?.isOutOfStock) throw new AppError('This item is out of stock', 400);

    const maxQty = inventory ? inventory.qtyAvailable : 99;
    if (qty > maxQty) throw new AppError(`Only ${maxQty} units available`, 400);

    // Upsert cart item
    const existing = await CartItem.findOne({
      where: { cartId: cart.id, productId, variantId: variantId ?? null },
    });

    if (existing) {
      const newQty = Math.min(existing.qty + qty, maxQty);
      await existing.update({ qty: newQty, price });
    } else {
      await CartItem.create({ cartId: cart.id, productId, variantId, qty, price });
    }

    return this.getCart(userId, sessionId);
  }

  async updateItem(
    userId: number | null,
    sessionId: string | null,
    itemId: number,
    qty: number,
  ): Promise<CartSummary> {
    const cart = await this.getOrCreate(userId, sessionId);
    const item = await CartItem.findOne({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new AppError('Cart item not found', 404);

    if (qty <= 0) {
      await item.destroy();
    } else {
      await item.update({ qty });
    }

    return this.getCart(userId, sessionId);
  }

  async removeItem(
    userId: number | null,
    sessionId: string | null,
    itemId: number,
  ): Promise<CartSummary> {
    return this.updateItem(userId, sessionId, itemId, 0);
  }

  async clearCart(userId: number | null, sessionId: string | null): Promise<void> {
    const cart = await Cart.findOne({ where: userId ? { userId } : { sessionId } });
    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id } });
    }
  }

  // Merge guest cart into user cart after login
  async mergeGuestCart(sessionId: string, userId: number): Promise<void> {
    const guestCart = await Cart.findOne({ where: { sessionId }, include: [{ model: CartItem }] });
    if (!guestCart || !guestCart.items?.length) return;

    const userCart = await this.getOrCreate(userId, null);

    await sequelize.transaction(async (t) => {
      for (const guestItem of guestCart.items) {
        const existing = userCart.items?.find(
          i => i.productId === guestItem.productId && i.variantId === guestItem.variantId,
        );
        if (existing) {
          await existing.update({ qty: existing.qty + guestItem.qty }, { transaction: t });
        } else {
          await CartItem.create(
            { cartId: userCart.id, productId: guestItem.productId, variantId: guestItem.variantId, qty: guestItem.qty, price: guestItem.price },
            { transaction: t },
          );
        }
      }
      await CartItem.destroy({ where: { cartId: guestCart.id }, transaction: t });
      await guestCart.destroy({ transaction: t });
    });
  }

  #toSummary(cart: Cart): CartSummary {
    const items: CartItemDTO[] = (cart.items ?? []).map(item => {
      const product  = item.product;
      const variant  = item.variant ?? null;
      const primaryImg = product?.images?.find(i => i.isPrimary) ?? product?.images?.[0];
      const image    = variant?.image ?? primaryImg?.url ?? '';
      const ep       = variant
        ? (variant.salePrice ? Number(variant.salePrice) : Number(variant.price))
        : (product?.salePrice ? Number(product.salePrice) : Number(product?.basePrice ?? item.price));

      return {
        id:            item.id,
        productId:     item.productId,
        productName:   product?.name ?? '',
        productSlug:   product?.slug ?? '',
        variantId:     item.variantId,
        variantName:   variant?.name ?? null,
        variantAttrs:  variant?.attributes ?? null,
        sku:           variant?.sku ?? null,
        image,
        price:         Number(item.price),
        effectivePrice: ep,
        qty:           item.qty,
        lineTotal:     ep * item.qty,
        isOutOfStock:  variant?.inventory ? variant.inventory.isOutOfStock : false,
      };
    });

    const subtotal  = items.reduce((s, i) => s + i.lineTotal, 0);
    const itemCount = items.reduce((s, i) => s + i.qty, 0);

    return { id: cart.id, items, subtotal, itemCount };
  }
}

export const cartService = new CartService();

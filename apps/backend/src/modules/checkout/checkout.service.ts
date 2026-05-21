import { cartService } from '../cart/cart.service';
import { couponService } from '../coupon/coupon.service';

const TAX_RATE       = 0.18;   // 18% GST (included in price, displayed separately)
const FREE_SHIPPING  = 499;    // Free shipping above ₹499
const FLAT_SHIPPING  = 49;     // ₹49 flat rate below threshold

export interface PriceSummary {
  subtotal:      number;
  discount:      number;
  couponCode:    string | null;
  couponDesc:    string | null;
  shipping:      number;
  tax:           number;       // GST portion already included in subtotal
  total:         number;
  itemCount:     number;
  savings:       number;       // discount + free shipping value
}

export class CheckoutService {

  async priceSummary(
    userId: number | null,
    sessionId: string | null,
    couponCode?: string,
  ): Promise<PriceSummary> {
    const cart = await cartService.getCart(userId, sessionId);
    const subtotal  = cart.subtotal;
    const itemCount = cart.itemCount;

    // Coupon
    let discount    = 0;
    let couponDesc: string | null = null;
    let appliedCode: string | null = null;

    if (couponCode) {
      const result = await couponService.validate(couponCode, subtotal);
      discount    = result.discount;
      couponDesc  = result.description;
      appliedCode = result.code;
    }

    const afterDiscount = subtotal - discount;
    const shipping = afterDiscount >= FREE_SHIPPING ? 0 : FLAT_SHIPPING;

    // GST is included in the price — we back-calculate for display
    const tax = Math.round((afterDiscount / (1 + TAX_RATE)) * TAX_RATE * 100) / 100;

    const total = Math.max(0, afterDiscount + shipping);

    const shippingSavings = subtotal >= FREE_SHIPPING ? 0 : (afterDiscount >= FREE_SHIPPING ? FLAT_SHIPPING : 0);
    const savings = discount + shippingSavings;

    return { subtotal, discount, couponCode: appliedCode, couponDesc, shipping, tax, total, itemCount, savings };
  }
}

export const checkoutService = new CheckoutService();

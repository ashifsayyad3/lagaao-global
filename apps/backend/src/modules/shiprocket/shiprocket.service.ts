import { env } from '../../config/env';
import { Order, OrderItem, OrderStatusHistory } from '../../models/index';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../config/logger';

const BASE = 'https://apiv2.shiprocket.in/v1/external';

interface SrToken { token: string; expiresAt: number }
interface SrOrderResult { order_id: number; shipment_id: number; awb_code?: string; courier_name?: string }

// In-memory token cache (survives PM2 restarts via re-auth)
let _tokenCache: SrToken | null = null;

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json() as T & { message?: string; error?: string };
  if (!res.ok) {
    const msg = (body as Record<string, string>).message
      ?? (body as Record<string, string>).error
      ?? `Shiprocket error ${res.status}`;
    throw new AppError(msg, res.status);
  }
  return body;
}

export class ShiprocketService {
  /** Get a valid bearer token, refreshing if needed */
  async #token(): Promise<string> {
    if (_tokenCache && _tokenCache.expiresAt > Date.now() + 60_000) {
      return _tokenCache.token;
    }

    if (!env.SHIPROCKET_EMAIL || !env.SHIPROCKET_PASSWORD) {
      throw new AppError('Shiprocket credentials not configured', 500);
    }

    const data = await fetchJson<{ token: string }>(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.SHIPROCKET_EMAIL, password: env.SHIPROCKET_PASSWORD }),
    });

    // Token is valid for 24h — cache for 23h
    _tokenCache = { token: data.token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 };
    logger.info('Shiprocket: token refreshed');
    return data.token;
  }

  #headers(token: string): Record<string, string> {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  /** Create a Shiprocket order from an existing DB order */
  async createOrder(orderId: number): Promise<Order> {
    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderItem }],
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.shiprocketOrderId) throw new AppError('Shipment already created for this order', 409);

    const addr = order.shippingAddress as Record<string, string>;
    const token = await this.#token();

    const payload = {
      order_id:        order.orderNumber,
      order_date:      new Date(order.createdAt).toISOString().slice(0, 10),
      pickup_location: 'Primary',
      channel_id:      env.SHIPROCKET_CHANNEL_ID ?? undefined,
      billing_customer_name:  addr['fullName'] ?? addr['name'] ?? 'Customer',
      billing_last_name:      '',
      billing_address:        addr['line1'] ?? '',
      billing_address_2:      addr['line2'] ?? '',
      billing_city:           addr['city'] ?? '',
      billing_pincode:        addr['pincode'] ?? '',
      billing_state:          addr['state'] ?? '',
      billing_country:        addr['country'] ?? 'India',
      billing_email:          'support@lagaao.com',
      billing_phone:          addr['phone'] ?? '',
      shipping_is_billing:    true,
      order_items: (order.items as OrderItem[]).map(item => ({
        name:      item.productName,
        sku:       item.sku ?? `SKU-${item.productId}`,
        units:     item.qty,
        selling_price: Number(item.unitPrice),
        discount:  0,
        tax:       '',
        hsn:       602,
      })),
      payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      shipping_charges: Number(order.shipping),
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: Number(order.discount),
      sub_total: Number(order.subtotal),
      length: 10, breadth: 10, height: 10, weight: 0.5,
    };

    const result = await fetchJson<SrOrderResult>(`${BASE}/orders/create/adhoc`, {
      method: 'POST',
      headers: this.#headers(token),
      body: JSON.stringify(payload),
    });

    await order.update({
      shiprocketOrderId:    String(result.order_id),
      shiprocketShipmentId: String(result.shipment_id),
      status: 'processing',
    });

    // Record status history
    await OrderStatusHistory.create({
      orderId:    order.id,
      fromStatus: order.status,
      toStatus:   'processing',
      note:       `Pushed to Shiprocket. Order ID: ${result.order_id}`,
      changedBy:  0,
    });

    logger.info(`Shiprocket order created: ${result.order_id} for order ${order.orderNumber}`);
    return order.reload();
  }

  /** Assign courier and generate AWB */
  async generateAwb(orderId: number): Promise<Order> {
    const order = await Order.findByPk(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (!order.shiprocketShipmentId) throw new AppError('No Shiprocket shipment found', 400);
    if (order.awbCode) throw new AppError('AWB already assigned', 409);

    const token = await this.#token();

    // Get cheapest available courier
    const couriers = await fetchJson<{
      data: { available_courier_companies: { courier_company_id: number; courier_name: string }[] }
    }>(`${BASE}/courier/serviceability/?pickup_postcode=400001&delivery_postcode=400002&weight=0.5&cod=${order.paymentMethod === 'cod' ? 1 : 0}`, {
      headers: this.#headers(token),
    });

    const courierId = couriers.data?.available_courier_companies?.[0]?.courier_company_id;
    if (!courierId) throw new AppError('No courier available for this route', 400);

    const awbResult = await fetchJson<{ awb_assign_status: number; response: { data: { awb_code: string; courier_name: string; tracking_url?: string } } }>(
      `${BASE}/courier/assign/awb`, {
        method: 'POST',
        headers: this.#headers(token),
        body: JSON.stringify({ shipment_id: [order.shiprocketShipmentId], courier_id: courierId }),
      });

    const awbData = awbResult.response?.data;
    await order.update({
      awbCode:    awbData.awb_code,
      courierName: awbData.courier_name,
      trackingUrl: awbData.tracking_url ?? `https://shiprocket.co/tracking/${awbData.awb_code}`,
      status:     'shipped',
    });

    await OrderStatusHistory.create({
      orderId:    order.id,
      fromStatus: 'processing',
      toStatus:   'shipped',
      note:       `AWB: ${awbData.awb_code} | Courier: ${awbData.courier_name}`,
      changedBy:  0,
    });

    return order.reload();
  }

  /** Track a shipment by AWB */
  async track(awb: string): Promise<Record<string, unknown>> {
    const token = await this.#token();
    return fetchJson(`${BASE}/courier/track/awb/${awb}`, { headers: this.#headers(token) });
  }

  /** Cancel a Shiprocket order */
  async cancelOrder(orderId: number): Promise<void> {
    const order = await Order.findByPk(orderId);
    if (!order?.shiprocketOrderId) return;

    const token = await this.#token();
    await fetchJson(`${BASE}/orders/cancel`, {
      method: 'POST',
      headers: this.#headers(token),
      body: JSON.stringify({ ids: [Number(order.shiprocketOrderId)] }),
    });
    logger.info(`Shiprocket order ${order.shiprocketOrderId} cancelled`);
  }

  /** Handle Shiprocket status webhook */
  async handleWebhook(payload: Record<string, unknown>): Promise<void> {
    const awb    = payload['awb'] as string | undefined;
    const srStatus = (payload['current_status'] as string | undefined)?.toLowerCase() ?? '';

    if (!awb) return;

    const order = await Order.findOne({ where: { awbCode: awb } });
    if (!order) return;

    let newStatus: string | null = null;
    if (srStatus.includes('delivered'))         newStatus = 'delivered';
    else if (srStatus.includes('out for delivery')) newStatus = 'out_for_delivery';
    else if (srStatus.includes('in transit') || srStatus.includes('shipped')) newStatus = 'shipped';
    else if (srStatus.includes('rto') || srStatus.includes('return')) newStatus = 'cancelled';

    if (!newStatus || newStatus === order.status) return;

    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === 'delivered') updates['deliveredAt'] = new Date();

    await order.update(updates);
    await OrderStatusHistory.create({
      orderId:    order.id,
      fromStatus: order.status,
      toStatus:   newStatus,
      note:       `Shiprocket webhook: ${payload['current_status']}`,
      changedBy:  0,
    });

    logger.info(`Order ${order.orderNumber} → ${newStatus} via Shiprocket webhook`);
  }
}

export const shiprocketService = new ShiprocketService();

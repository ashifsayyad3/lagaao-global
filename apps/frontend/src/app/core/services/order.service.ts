import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing' | 'shipped'
  | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refund_requested' | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet';

export interface OrderItem {
  id:           number;
  productId:    number;
  variantId:    number | null;
  productName:  string;
  sku:          string | null;
  variantAttrs: Record<string, string> | null;
  image:        string | null;
  qty:          number;
  unitPrice:    number;
  lineTotal:    number;
  status:       OrderStatus;
  product?:     { id: number; name: string; slug: string };
}

export interface StatusHistory {
  id:         number;
  fromStatus: string;
  toStatus:   string;
  note:       string | null;
  createdAt:  string;
}

export interface ShippingAddress {
  fullName: string;
  phone:    string;
  line1:    string;
  line2?:   string;
  city:     string;
  state:    string;
  pincode:  string;
  country:  string;
}

export interface Order {
  id:               number;
  orderNumber:      string;
  status:           OrderStatus;
  subtotal:         number;
  discount:         number;
  shipping:         number;
  tax:              number;
  total:            number;
  couponCode:       string | null;
  shippingAddress:  ShippingAddress;
  paymentMethod:    PaymentMethod;
  paymentStatus:    PaymentStatus;
  paymentRef:       string | null;
  trackingNumber:   string | null;
  courier:          string | null;
  estimatedDelivery: string | null;
  deliveredAt:      string | null;
  cancelReason:     string | null;
  items:            OrderItem[];
  statusHistory:    StatusHistory[];
  createdAt:        string;
}

export interface PlaceOrderInput {
  shippingAddress: ShippingAddress;
  paymentMethod:   PaymentMethod;
  upiId?:          string;
  couponCode?:     string;
  sessionId?:      string;
  useWallet?:      boolean;
  walletAmount?:   number;
}

export interface OrdersPage {
  success: boolean;
  data:    Order[];
  meta:    { page: number; limit: number; total: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  readonly #http = inject(HttpClient);
  readonly #base = `${environment.apiUrl}/api/v1/orders`;

  placeOrder(input: PlaceOrderInput): Observable<{ success: boolean; data: Order }> {
    return this.#http.post<{ success: boolean; data: Order }>(this.#base, input);
  }

  getOrders(page = 1, status?: string): Observable<OrdersPage> {
    let p = new HttpParams().set('page', page).set('limit', 10);
    if (status) p = p.set('status', status);
    return this.#http.get<OrdersPage>(this.#base, { params: p });
  }

  getOrder(id: number): Observable<{ success: boolean; data: Order }> {
    return this.#http.get<{ success: boolean; data: Order }>(`${this.#base}/${id}`);
  }

  cancelOrder(id: number, reason: string): Observable<{ success: boolean; data: Order }> {
    return this.#http.post<{ success: boolean; data: Order }>(`${this.#base}/${id}/cancel`, { reason });
  }
}

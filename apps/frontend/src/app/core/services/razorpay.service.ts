import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaymentOrderResult {
  razorpayOrderId: string;
  amount:          number;
  currency:        string;
  keyId:           string;
  orderId:         number;
  orderNumber:     string;
}

export interface VerifyResult {
  success: boolean;
  data:    { id: number; orderNumber: string; paymentStatus: string };
  message: string;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

@Injectable({ providedIn: 'root' })
export class RazorpayService {
  readonly #http   = inject(HttpClient);
  readonly #apiUrl = `${environment.apiUrl}/api/v1/payments`;

  /** Lazy-load Razorpay checkout.js once */
  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) { resolve(); return; }
      const script   = document.createElement('script');
      script.src     = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload  = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.head.appendChild(script);
    });
  }

  /**
   * Complete payment flow:
   * 1. Create backend order → get Razorpay order ID
   * 2. Open Razorpay modal
   * 3. On success → verify signature with backend
   *
   * Returns the verified order data or throws on failure / cancellation.
   */
  async pay(params: {
    orderId:     number;
    name:        string;
    email:       string;
    phone:       string;
    description: string;
  }): Promise<VerifyResult['data']> {
    await this.loadScript();

    // Step 1: create Razorpay order
    const res = await firstValueFrom(
      this.#http.post<{ success: boolean; data: PaymentOrderResult }>(
        `${this.#apiUrl}/create-order`,
        { orderId: params.orderId },
        { withCredentials: true },
      ),
    );

    if (!res.success) throw new Error('Could not initiate payment');
    const { razorpayOrderId, amount, currency, keyId, orderNumber } = res.data;

    // Step 2: open Razorpay modal
    return new Promise<VerifyResult['data']>((resolve, reject) => {
      const options: Record<string, unknown> = {
        key:          keyId,
        amount,
        currency,
        name:         'Lagaao',
        description:  params.description || `Order #${orderNumber}`,
        order_id:     razorpayOrderId,
        prefill: {
          name:    params.name,
          email:   params.email,
          contact: params.phone,
        },
        theme:        { color: '#3d6b45' },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user')),
        },
        handler: async (response: {
          razorpay_order_id:   string;
          razorpay_payment_id: string;
          razorpay_signature:  string;
        }) => {
          try {
            // Step 3: verify with backend
            const verifyRes = await firstValueFrom(
              this.#http.post<VerifyResult>(
                `${this.#apiUrl}/verify`,
                {
                  orderId:           params.orderId,
                  razorpayOrderId:   response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
                { withCredentials: true },
              ),
            );
            if (verifyRes.success) resolve(verifyRes.data);
            else reject(new Error(verifyRes.message ?? 'Verification failed'));
          } catch (err) {
            reject(err);
          }
        },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    });
  }
}

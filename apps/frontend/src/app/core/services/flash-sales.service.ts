import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface FlashSaleItem {
  id: number; flashSaleId: number;
  productId: number; variantId: number | null;
  salePrice: number; originalPrice: number;
  stockLimit: number | null; sold: number;
  product?: { id: number; name: string; slug: string; basePrice: number };
}

export interface FlashSale {
  id: number; name: string; description: string | null;
  bannerImage: string | null;
  startAt: string; endAt: string;
  isActive: boolean; maxPerUser: number | null;
  items: FlashSaleItem[];
}

@Injectable({ providedIn: 'root' })
export class FlashSalesService {
  readonly #http = inject(HttpClient);
  readonly #base = `${environment.apiUrl}/api/v1/flash-sales`;

  readonly sales    = signal<FlashSale[]>([]);
  readonly loaded   = signal(false);

  readonly activeSale = computed(() => this.sales()[0] ?? null);

  load(): void {
    if (this.loaded()) return;
    this.#http.get<{ success: boolean; data: FlashSale[] }>(this.#base).subscribe({
      next: r => { this.sales.set(r.data ?? []); this.loaded.set(true); },
    });
  }

  /** Get flash price for a specific product/variant combo */
  getFlashItem(productId: number, variantId: number | null = null): FlashSaleItem | null {
    for (const sale of this.sales()) {
      const item = sale.items.find(i =>
        i.productId === productId && i.variantId === variantId
      );
      if (item) return item;
    }
    return null;
  }
}

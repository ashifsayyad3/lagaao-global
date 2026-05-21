import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface CategoryNode {
  id: number; name: string; slug: string; image?: string;
  parentId: number | null; sortOrder: number;
  children: CategoryNode[];
}

export interface Brand {
  id: number; name: string; slug: string; logo?: string;
}

export interface ProductImage {
  id: number; url: string; alt?: string; isPrimary: boolean; sortOrder: number;
}

export interface ProductVariant {
  id: number; sku: string; name?: string; price: number; salePrice?: number;
  attributes?: Record<string, string>; image?: string;
  inventory?: { qtyAvailable: number; qtyOnHand: number; isLowStock: boolean; isOutOfStock: boolean };
}

export interface Product {
  id: number; name: string; slug: string; description?: string;
  shortDescription?: string; basePrice: number; salePrice?: number;
  taxRate: number; status: string; isFeatured: boolean; isDigital: boolean;
  hasVariants: boolean; rating: number; reviewCount: number; tags?: string[];
  category: { id: number; name: string; slug: string };
  brand?: Brand; images: ProductImage[]; variants: ProductVariant[];
  createdAt: string;
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  readonly #api = inject(ApiService);

  readonly categories  = signal<CategoryNode[]>([]);
  readonly brands      = signal<Brand[]>([]);

  getProducts(params: Record<string, string | number> = {}): Observable<ProductListResponse> {
    return this.#api.get<ProductListResponse>('/products', params);
  }

  getProduct(slug: string): Observable<{ data: Product }> {
    return this.#api.get<{ data: Product }>(`/products/${slug}`);
  }

  getFeatured(limit = 10): Observable<{ data: Product[] }> {
    return this.#api.get<{ data: Product[] }>('/products/featured', { limit });
  }

  getRelated(productId: number): Observable<{ data: Product[] }> {
    return this.#api.get<{ data: Product[] }>(`/products/${productId}/related`);
  }

  loadCategories(): Observable<{ data: CategoryNode[] }> {
    return this.#api.get<{ data: CategoryNode[] }>('/categories').pipe(
      tap(res => this.categories.set(res.data)),
    );
  }

  loadBrands(): Observable<{ data: Brand[] }> {
    return this.#api.get<{ data: Brand[] }>('/brands').pipe(
      tap(res => this.brands.set(res.data)),
    );
  }

  getPrimaryImage(p: Product): string {
    const primary = p.images?.find(i => i.isPrimary);
    return primary?.url ?? p.images?.[0]?.url ?? 'assets/images/placeholder.jpg';
  }

  getEffectivePrice(p: Product): number {
    return p.salePrice ?? p.basePrice;
  }

  getDiscountPct(p: Product): number {
    if (!p.salePrice || !p.basePrice) return 0;
    return Math.round((1 - p.salePrice / p.basePrice) * 100);
  }
}

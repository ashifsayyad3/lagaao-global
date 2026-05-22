import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SearchResult {
  id:               number;
  name:             string;
  slug:             string;
  shortDescription?: string;
  effectivePrice:   number;
  basePrice:        number;
  salePrice?:       number;
  discountPct:      number;
  rating:           number;
  reviewCount:      number;
  categoryName:     string;
  categorySlug:     string;
  brandName?:       string;
  primaryImage:     string;
  isFeatured:       boolean;
  tags:             string[];
  score?:           number;
}

export interface SearchFacets {
  categories: { id: number; name: string; slug: string; count: number }[];
  brands:     { id: number; name: string; slug: string; count: number }[];
  priceRange: { min: number; max: number };
}

export interface SearchResponse {
  success:    boolean;
  hits:       SearchResult[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  facets:     SearchFacets;
  took?:      number;
}

export interface SearchParams {
  q?:          string;
  categoryId?: number;
  brandId?:    number;
  minPrice?:   number;
  maxPrice?:   number;
  featured?:   boolean;
  sort?:       string;
  page?:       number;
  limit?:      number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly #http      = inject(HttpClient);
  readonly #base      = `${environment.apiUrl}/api/v1/search`;
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly recentSearches = signal<string[]>(this.#loadRecent());

  search(params: SearchParams): Observable<SearchResponse> {
    let p = new HttpParams();
    if (params.q)          p = p.set('q',          params.q);
    if (params.categoryId) p = p.set('categoryId', params.categoryId);
    if (params.brandId)    p = p.set('brandId',    params.brandId);
    if (params.minPrice)   p = p.set('minPrice',   params.minPrice);
    if (params.maxPrice)   p = p.set('maxPrice',   params.maxPrice);
    if (params.featured)   p = p.set('featured',   'true');
    if (params.sort)       p = p.set('sort',        params.sort);
    if (params.page)       p = p.set('page',        params.page);
    if (params.limit)      p = p.set('limit',       params.limit);
    return this.#http.get<SearchResponse>(this.#base, { params: p });
  }

  suggest(q: string): Observable<{ success: boolean; data: { suggestions: string[] } }> {
    return this.#http.get<{ success: boolean; data: { suggestions: string[] } }>(
      `${this.#base}/suggest`, { params: new HttpParams().set('q', q) }
    );
  }

  trending(): Observable<{ success: boolean; data: { trending: string[] } }> {
    return this.#http.get<{ success: boolean; data: { trending: string[] } }>(`${this.#base}/trending`);
  }

  aiSearch(query: string, page = 1, limit = 12): Observable<SearchResponse> {
    return this.#http.post<SearchResponse>(`${this.#base}/ai`, { query, page, limit });
  }

  saveRecent(q: string): void {
    if (!this.#isBrowser) return;
    const trimmed = q.trim();
    if (!trimmed) return;
    const existing = this.#loadRecent().filter(s => s !== trimmed);
    const updated  = [trimmed, ...existing].slice(0, 8);
    localStorage.setItem('lg_recent_searches', JSON.stringify(updated));
    this.recentSearches.set(updated);
  }

  clearRecent(): void {
    if (!this.#isBrowser) return;
    localStorage.removeItem('lg_recent_searches');
    this.recentSearches.set([]);
  }

  #loadRecent(): string[] {
    if (!this.#isBrowser) return [];
    try {
      return JSON.parse(localStorage.getItem('lg_recent_searches') ?? '[]');
    } catch { return []; }
  }
}

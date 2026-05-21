import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {
  SearchService, SearchResult, SearchFacets, SearchParams,
} from '../../core/services/search.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';

@Component({
  selector: 'lg-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatIconModule,
    ProductCardComponent, SkeletonCardComponent, BadgeComponent, CurrencyInrPipe,
  ],
  template: `
    <div class="max-w-screen-2xl mx-auto px-4 md:px-6 py-8">

      <!-- Header row -->
      <div class="flex items-center gap-4 mb-6">
        <div class="flex-1">
          @if (query()) {
            <h1 class="font-display text-xl font-bold text-text-primary">
              Results for "<span class="text-primary-600">{{ query() }}</span>"
            </h1>
            @if (!loading()) {
              <p class="text-sm text-text-muted mt-0.5">
                {{ total() }} result{{ total() !== 1 ? 's' : '' }}
                @if (took() !== undefined) { <span class="ml-1">({{ took() }}ms)</span> }
              </p>
            }
          } @else {
            <h1 class="font-display text-xl font-bold text-text-primary">Search</h1>
          }
        </div>

        <!-- AI Search toggle -->
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all"
          [class.bg-primary-600]="aiMode()"
          [class.text-white]="aiMode()"
          [class.border-primary-600]="aiMode()"
          [class.border-border-default]="!aiMode()"
          [class.text-text-secondary]="!aiMode()"
          (click)="toggleAI()"
        >
          <mat-icon class="!text-base">auto_awesome</mat-icon>
          AI Search
        </button>
      </div>

      <div class="flex gap-6">
        <!-- Sidebar -->
        <aside class="hidden lg:block w-60 flex-shrink-0 space-y-6">

          <!-- Categories facet -->
          @if (facets().categories.length > 0) {
            <div>
              <h3 class="font-semibold text-text-primary mb-3 text-sm">Categories</h3>
              <ul class="space-y-1">
                @for (cat of facets().categories; track cat.slug) {
                  <li>
                    <button
                      class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors"
                      [class.bg-primary-50]="selectedCategory() === cat.slug"
                      [class.text-primary-700]="selectedCategory() === cat.slug"
                      [class.text-text-secondary]="selectedCategory() !== cat.slug"
                      [class.hover:bg-surface-100]="selectedCategory() !== cat.slug"
                      (click)="filterCategory(cat.slug)"
                    >
                      <span>{{ cat.name }}</span>
                      @if (cat.count > 0) {
                        <span class="text-xs text-text-muted">{{ cat.count }}</span>
                      }
                    </button>
                  </li>
                }
              </ul>
            </div>
          }

          <!-- Brands facet -->
          @if (facets().brands.length > 0) {
            <div>
              <h3 class="font-semibold text-text-primary mb-3 text-sm">Brands</h3>
              <ul class="space-y-1 max-h-48 overflow-y-auto">
                @for (brand of facets().brands; track brand.slug) {
                  <li>
                    <label class="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                                  hover:bg-surface-100 text-sm text-text-secondary">
                      <input type="checkbox" class="rounded accent-primary-600"
                             [checked]="selectedBrand() === brand.slug"
                             (change)="filterBrand(brand.slug)" />
                      {{ brand.name }}
                    </label>
                  </li>
                }
              </ul>
            </div>
          }

          <!-- Price range -->
          <div>
            <h3 class="font-semibold text-text-primary mb-3 text-sm">Price Range</h3>
            <div class="flex items-center gap-2">
              <input [(ngModel)]="minPrice" type="number" placeholder="Min"
                     class="filter-input" (change)="applyFilters()" />
              <span class="text-text-muted text-xs">—</span>
              <input [(ngModel)]="maxPrice" type="number" placeholder="Max"
                     class="filter-input" (change)="applyFilters()" />
            </div>
          </div>

          <button class="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2"
                  (click)="clearFilters()">
            Clear filters
          </button>
        </aside>

        <!-- Main -->
        <div class="flex-1 min-w-0">

          <!-- Sort toolbar -->
          <div class="flex items-center justify-between mb-4 gap-4">
            <div class="flex flex-wrap gap-2">
              @if (selectedCategory()) {
                <lg-badge variant="primary">
                  {{ selectedCategory() }}
                  <button (click)="filterCategory(null)" class="ml-1">×</button>
                </lg-badge>
              }
              @if (selectedBrand()) {
                <lg-badge variant="primary">
                  {{ selectedBrand() }}
                  <button (click)="filterBrand(null)" class="ml-1">×</button>
                </lg-badge>
              }
              @if (minPrice || maxPrice) {
                <lg-badge variant="primary">
                  {{ minPrice ?? 0 | currencyInr }} — {{ maxPrice ?? 0 | currencyInr }}
                  <button (click)="minPrice = null; maxPrice = null; applyFilters()" class="ml-1">×</button>
                </lg-badge>
              }
            </div>

            @if (!aiMode()) {
              <select [(ngModel)]="sort" (change)="applyFilters()"
                      class="h-9 px-3 pr-8 rounded-lg border border-border-default bg-bg-base
                             text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 ml-auto">
                <option value="relevance">Most Relevant</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            }
          </div>

          <!-- AI mode hint -->
          @if (aiMode()) {
            <div class="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-primary-50 border border-primary-100 text-sm text-primary-700">
              <mat-icon class="!text-base">auto_awesome</mat-icon>
              AI semantic search finds products by meaning, not just keywords.
            </div>
          }

          <!-- Results grid -->
          @if (loading()) {
            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (i of skeletons; track i) { <lg-skeleton-card></lg-skeleton-card> }
            </div>
          } @else if (results().length === 0) {
            <div class="flex flex-col items-center py-20 text-center">
              <mat-icon class="!text-6xl text-text-muted mb-4">search_off</mat-icon>
              <h3 class="font-display text-xl font-semibold text-text-primary mb-2">
                No results found
              </h3>
              <p class="text-text-secondary mb-6">
                @if (query()) {
                  We couldn't find anything for "<strong>{{ query() }}</strong>". Try different keywords.
                } @else {
                  Enter a search term above to get started.
                }
              </p>
              @if (query()) {
                <button
                  class="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"
                  (click)="toggleAI()"
                >
                  Try AI Search instead
                </button>
              }
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (item of results(); track item.id) {
                <lg-product-card [product]="toProduct(item)" class="animate-fade-in"></lg-product-card>
              }
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="flex justify-center items-center gap-2 mt-10">
                <button class="pagination-btn" [disabled]="page() === 1" (click)="goToPage(page() - 1)">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                @for (p of pageNumbers(); track p) {
                  <button class="pagination-btn"
                          [class.bg-primary-600]="p === page()"
                          [class.text-white]="p === page()"
                          (click)="goToPage(p)">{{ p }}</button>
                }
                <button class="pagination-btn" [disabled]="page() === totalPages()" (click)="goToPage(page() + 1)">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-input { width: 100%; height: 2.25rem; padding: 0 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border-default); background: var(--bg-base); color: var(--text-primary); font-size: 0.875rem; }
    .filter-input:focus { outline: none; box-shadow: 0 0 0 2px var(--color-primary); }
    .pagination-btn { min-width: 2.25rem; height: 2.25rem; padding: 0 0.5rem; border-radius: 0.5rem; border: 1px solid var(--border-default); background: var(--bg-base); color: var(--text-primary); font-size: 0.875rem; display: inline-flex; align-items: center; justify-content: center; transition: all 150ms; }
    .pagination-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
    .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `],
})
export class SearchComponent implements OnInit {
  readonly #searchSvc = inject(SearchService);
  readonly #route     = inject(ActivatedRoute);
  readonly #router    = inject(Router);

  readonly results    = signal<SearchResult[]>([]);
  readonly facets     = signal<SearchFacets>({ categories: [], brands: [], priceRange: { min: 0, max: 0 } });
  readonly loading    = signal(false);
  readonly total      = signal(0);
  readonly page       = signal(1);
  readonly totalPages = signal(1);
  readonly took       = signal<number | undefined>(undefined);
  readonly aiMode     = signal(false);

  readonly query           = signal('');
  readonly selectedCategory = signal<string | null>(null);
  readonly selectedBrand    = signal<string | null>(null);
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sort = 'relevance';

  readonly skeletons = Array.from({ length: 12 }, (_, i) => i);

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur   = this.page();
    const pages: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
    return pages;
  });

  ngOnInit(): void {
    this.#route.queryParams.subscribe(params => {
      this.query.set(params['q'] ?? '');
      this.page.set(1);
      this.doSearch();
    });
  }

  doSearch(): void {
    if (!this.query()) { this.results.set([]); this.total.set(0); return; }

    this.loading.set(true);
    const params: SearchParams = {
      q:    this.query(),
      page: this.page(),
      limit: 24,
      sort: this.sort !== 'relevance' ? this.sort : undefined,
    };
    if (this.minPrice)              params.minPrice   = this.minPrice;
    if (this.maxPrice)              params.maxPrice   = this.maxPrice;

    const obs = this.aiMode()
      ? this.#searchSvc.aiSearch(this.query(), this.page(), 24)
      : this.#searchSvc.search(params);

    obs.subscribe({
      next: res => {
        this.results.set(res.hits);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.facets.set(res.facets);
        this.took.set(res.took);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterCategory(slug: string | null): void {
    this.selectedCategory.set(slug);
    this.page.set(1);
    this.doSearch();
  }

  filterBrand(slug: string | null): void {
    this.selectedBrand.set(slug);
    this.page.set(1);
    this.doSearch();
  }

  applyFilters(): void {
    this.page.set(1);
    this.doSearch();
  }

  clearFilters(): void {
    this.selectedCategory.set(null);
    this.selectedBrand.set(null);
    this.minPrice = null;
    this.maxPrice = null;
    this.sort = 'relevance';
    this.page.set(1);
    this.doSearch();
  }

  toggleAI(): void {
    this.aiMode.update(v => !v);
    this.page.set(1);
    this.doSearch();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.doSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toProduct(r: SearchResult): import('../../core/services/product.service').Product {
    return {
      id:               r.id,
      name:             r.name,
      slug:             r.slug,
      shortDescription: r.shortDescription,
      basePrice:        r.basePrice,
      salePrice:        r.salePrice ?? null,
      rating:           r.rating,
      reviewCount:      r.reviewCount,
      isFeatured:       r.isFeatured,
      tags:             r.tags,
      hasVariants:      false,
      status:           'active',
      images:           r.primaryImage ? [{ id: 0, url: r.primaryImage, isPrimary: true, sortOrder: 0, alt: r.name }] : [],
      category:         { id: 0, name: r.categoryName, slug: r.categorySlug, children: [] },
      brand:            r.brandName ? { id: 0, name: r.brandName, slug: '', isActive: true } : undefined,
    } as unknown as import('../../core/services/product.service').Product;
  }
}

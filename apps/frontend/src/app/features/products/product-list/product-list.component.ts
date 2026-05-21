import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ProductService, Product, CategoryNode } from '../../../core/services/product.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { SkeletonCardComponent } from '../../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';

@Component({
  selector: 'lg-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule,
    MatIconModule, MatSelectModule,
    ProductCardComponent, SkeletonCardComponent, BadgeComponent, CurrencyInrPipe,
  ],
  template: `
    <div class="max-w-screen-2xl mx-auto px-4 md:px-6 py-8">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-text-muted mb-6">
        <a routerLink="/" class="hover:text-text-primary transition-colors">Home</a>
        <mat-icon class="!text-base">chevron_right</mat-icon>
        <span class="text-text-primary">Products</span>
        @if (activeCategory()) {
          <mat-icon class="!text-base">chevron_right</mat-icon>
          <span class="text-text-primary">{{ activeCategory()?.name }}</span>
        }
      </nav>

      <div class="flex gap-6">
        <!-- Sidebar Filters -->
        <aside class="hidden lg:block w-60 flex-shrink-0 space-y-6">
          <!-- Categories -->
          <div>
            <h3 class="font-semibold text-text-primary mb-3 text-sm">Categories</h3>
            <ul class="space-y-1">
              <li>
                <button
                  class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  [class.bg-primary-50]="!selectedCategory"
                  [class.text-primary-700]="!selectedCategory"
                  [class.text-text-secondary]="!!selectedCategory"
                  [class.hover:bg-surface-100]="!!selectedCategory"
                  (click)="filterByCategory(null)"
                >
                  All Categories
                </button>
              </li>
              @for (cat of productSvc.categories(); track cat.id) {
                <li>
                  <button
                    class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                    [class.bg-primary-50]="selectedCategory === cat.slug"
                    [class.text-primary-700]="selectedCategory === cat.slug"
                    [class.text-text-secondary]="selectedCategory !== cat.slug"
                    [class.hover:bg-surface-100]="selectedCategory !== cat.slug"
                    (click)="filterByCategory(cat.slug)"
                  >
                    {{ cat.name }}
                  </button>
                </li>
              }
            </ul>
          </div>

          <!-- Price range -->
          <div>
            <h3 class="font-semibold text-text-primary mb-3 text-sm">Price Range</h3>
            <div class="flex items-center gap-2">
              <input [(ngModel)]="minPrice" type="number" placeholder="Min"
                     class="filter-input" (change)="applyFilters()" />
              <span class="text-text-muted">—</span>
              <input [(ngModel)]="maxPrice" type="number" placeholder="Max"
                     class="filter-input" (change)="applyFilters()" />
            </div>
          </div>

          <!-- Brands -->
          @if (productSvc.brands().length > 0) {
            <div>
              <h3 class="font-semibold text-text-primary mb-3 text-sm">Brands</h3>
              <ul class="space-y-1 max-h-48 overflow-y-auto">
                @for (brand of productSvc.brands(); track brand.id) {
                  <li>
                    <label class="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                                  hover:bg-surface-100 text-sm text-text-secondary">
                      <input type="checkbox" class="rounded accent-primary-600"
                             [checked]="selectedBrands.has(brand.slug)"
                             (change)="toggleBrand(brand.slug)" />
                      {{ brand.name }}
                    </label>
                  </li>
                }
              </ul>
            </div>
          }

          <button
            class="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2"
            (click)="clearFilters()">
            Clear all filters
          </button>
        </aside>

        <!-- Main content -->
        <div class="flex-1 min-w-0">
          <!-- Toolbar -->
          <div class="flex items-center justify-between mb-6 gap-4">
            <div>
              <h1 class="font-display text-xl font-bold text-text-primary">
                {{ activeCategory()?.name ?? 'All Products' }}
              </h1>
              @if (!loading()) {
                <p class="text-sm text-text-muted mt-0.5">
                  {{ total() }} product{{ total() !== 1 ? 's' : '' }}
                </p>
              }
            </div>

            <div class="flex items-center gap-3">
              <!-- Sort -->
              <select [(ngModel)]="sort" (change)="applyFilters()"
                      class="h-9 px-3 pr-8 rounded-lg border border-border-default bg-bg-base
                             text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>

              <!-- Grid toggle (mobile) -->
              <button class="lg:hidden p-2 rounded-lg border border-border-default"
                      (click)="showFilters.update(v => !v)">
                <mat-icon class="!text-xl text-text-secondary">tune</mat-icon>
              </button>
            </div>
          </div>

          <!-- Active filter chips -->
          @if (hasActiveFilters()) {
            <div class="flex flex-wrap gap-2 mb-4">
              @if (selectedCategory) {
                <lg-badge variant="primary">
                  {{ activeCategory()?.name }}
                  <button (click)="filterByCategory(null)" class="ml-1">×</button>
                </lg-badge>
              }
              @if (minPrice || maxPrice) {
                <lg-badge variant="primary">
                  {{ minPrice ?? 0 | currencyInr }} — {{ maxPrice ?? 0 | currencyInr }}
                  <button (click)="minPrice = null; maxPrice = null; applyFilters()" class="ml-1">×</button>
                </lg-badge>
              }
            </div>
          }

          <!-- Product grid -->
          @if (loading()) {
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (i of skeletons; track i) {
                <lg-skeleton-card></lg-skeleton-card>
              }
            </div>
          } @else if (products().length === 0) {
            <div class="flex flex-col items-center justify-center py-20 text-center">
              <mat-icon class="!text-6xl text-text-muted mb-4">search_off</mat-icon>
              <h3 class="font-display text-xl font-semibold text-text-primary mb-2">No products found</h3>
              <p class="text-text-secondary mb-6">Try adjusting your filters or search differently</p>
              <button class="text-primary-600 font-medium hover:underline" (click)="clearFilters()">
                Clear all filters
              </button>
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              @for (product of products(); track product.id) {
                <lg-product-card [product]="product" class="animate-fade-in"></lg-product-card>
              }
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="flex justify-center items-center gap-2 mt-10">
                <button
                  class="pagination-btn"
                  [disabled]="currentPage() === 1"
                  (click)="goToPage(currentPage() - 1)"
                >
                  <mat-icon>chevron_left</mat-icon>
                </button>

                @for (p of pageNumbers(); track p) {
                  <button
                    class="pagination-btn"
                    [class.bg-primary-600]="p === currentPage()"
                    [class.text-white]="p === currentPage()"
                    (click)="goToPage(p)"
                  >{{ p }}</button>
                }

                <button
                  class="pagination-btn"
                  [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(currentPage() + 1)"
                >
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
export class ProductListComponent implements OnInit {
  readonly productSvc   = inject(ProductService);
  readonly #route       = inject(ActivatedRoute);

  readonly products     = signal<Product[]>([]);
  readonly loading      = signal(true);
  readonly total        = signal(0);
  readonly currentPage  = signal(1);
  readonly totalPages   = signal(1);
  readonly showFilters  = signal(false);

  selectedCategory: string | null = null;
  selectedBrands   = new Set<string>();
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sort = '';

  readonly skeletons = Array.from({ length: 12 }, (_, i) => i);

  activeCategory = computed(() =>
    this.selectedCategory
      ? this.productSvc.categories().find(c => c.slug === this.selectedCategory) ?? null
      : null,
  );

  hasActiveFilters = computed(() =>
    !!this.selectedCategory || !!this.minPrice || !!this.maxPrice || this.selectedBrands.size > 0,
  );

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const cur   = this.currentPage();
    const pages: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    this.productSvc.loadCategories().subscribe();
    this.productSvc.loadBrands().subscribe();

    this.#route.queryParams.subscribe(params => {
      if (params['category']) this.selectedCategory = params['category'];
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    const params: Record<string, string | number> = {
      page:  this.currentPage(),
      limit: 24,
    };
    if (this.selectedCategory) {
      const cat = this.productSvc.categories().find(c => c.slug === this.selectedCategory);
      if (cat) params['categoryId'] = cat.id;
    }
    if (this.minPrice) params['minPrice'] = this.minPrice;
    if (this.maxPrice) params['maxPrice'] = this.maxPrice;

    this.productSvc.getProducts(params).subscribe({
      next: res => {
        this.products.set(res.data);
        this.total.set(res.meta.total);
        this.totalPages.set(res.meta.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterByCategory(slug: string | null): void {
    this.selectedCategory = slug;
    this.currentPage.set(1);
    this.loadProducts();
  }

  toggleBrand(slug: string): void {
    if (this.selectedBrands.has(slug)) this.selectedBrands.delete(slug);
    else this.selectedBrands.add(slug);
    this.applyFilters();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  clearFilters(): void {
    this.selectedCategory = null;
    this.selectedBrands.clear();
    this.minPrice = null;
    this.maxPrice = null;
    this.sort = '';
    this.currentPage.set(1);
    this.loadProducts();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.currentPage.set(p);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

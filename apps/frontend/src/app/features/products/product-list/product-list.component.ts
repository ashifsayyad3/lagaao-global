import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProductService, Product } from '../../../core/services/product.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { SkeletonCardComponent } from '../../../shared/components/skeleton/skeleton.component';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';

@Component({
  selector: 'lg-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, FormsModule,
    MatIconModule,
    ProductCardComponent, SkeletonCardComponent, CurrencyInrPipe,
  ],
  styles: [`
    :host { display: block; }

    /* ── Layout ───────────────────────────────────── */
    :host {
      background: var(--bg-subtle);
      display: block;
    }
    .page-wrap {
      max-width: 1440px;
      margin: 0 auto;
      padding: 24px 24px 64px;
    }

    /* ── Breadcrumb ───────────────────────────────── */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: .8125rem;
      color: var(--text-muted);
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .breadcrumb a {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 150ms;
    }
    .breadcrumb a:hover { color: var(--color-primary); }
    .breadcrumb .crumb-current { color: var(--text-primary); font-weight: 500; }

    /* ── Body layout ─────────────────────────────── */
    .body-layout {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }

    /* ── Sidebar ──────────────────────────────────── */
    .sidebar {
      width: 240px;
      flex-shrink: 0;
      display: none;
    }
    @media (min-width: 1024px) {
      .sidebar { display: block; }
    }

    .filter-card {
      background: var(--bg-base);
      border: 1px solid var(--border-default);
      border-radius: 16px;
      overflow: hidden;
    }

    .filter-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px;
      border-bottom: 1px solid var(--border-default);
    }
    .filter-title {
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .filter-clear {
      font-size: .75rem;
      color: var(--color-primary);
      font-weight: 600;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: opacity 150ms;
    }
    .filter-clear:hover { opacity: .7; }

    .filter-section { border-bottom: 1px solid var(--border-default); }
    .filter-section:last-child { border-bottom: none; }

    .filter-section-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: none;
      border: none;
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: .8125rem;
      font-weight: 600;
      color: var(--text-primary);
      letter-spacing: .02em;
      text-transform: uppercase;
      transition: background 150ms;
    }
    .filter-section-btn:hover { background: var(--bg-subtle); }

    .filter-body { padding: 4px 18px 14px; }

    .cat-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border: none;
      border-radius: 9999px;
      background: none;
      font-family: var(--font-sans);
      font-size: .8125rem;
      color: var(--text-secondary);
      cursor: pointer;
      text-align: left;
      transition: background 150ms, color 150ms;
    }
    .cat-btn:hover { background: var(--bg-subtle); color: var(--text-primary); }
    .cat-btn.active {
      background: var(--color-primary-100);
      color: var(--color-primary-dark);
      font-weight: 600;
    }
    .cat-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--color-sage);
      flex-shrink: 0;
    }

    .brand-label {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
      font-size: .8125rem;
      color: var(--text-secondary);
      transition: background 150ms;
    }
    .brand-label:hover { background: var(--bg-subtle); }
    .brand-label input[type="checkbox"] {
      accent-color: var(--color-primary);
      width: 14px; height: 14px;
    }

    .price-inputs {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .price-inp {
      flex: 1;
      height: 36px;
      padding: 0 10px;
      border: 1.5px solid var(--border-default);
      border-radius: 9px;
      font-family: var(--font-sans);
      font-size: .8125rem;
      color: var(--text-primary);
      background: var(--bg-subtle);
      outline: none;
      transition: border-color 150ms;
    }
    .price-inp:focus { border-color: var(--color-primary); background: #fff; }
    .price-inp::placeholder { color: var(--text-muted); }
    .price-sep { color: var(--text-muted); font-size: .75rem; flex-shrink: 0; }

    /* ── Main content ─────────────────────────────── */
    .main-content { flex: 1; min-width: 0; }

    /* ── Toolbar ──────────────────────────────────── */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 12px;
      flex-wrap: wrap;
    }

    .toolbar-left h1 {
      font-family: var(--font-display);
      font-size: 1.625rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 2px;
    }
    .toolbar-left p {
      font-size: .8125rem;
      color: var(--text-muted);
      margin: 0;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sort-select {
      height: 38px;
      padding: 0 32px 0 14px;
      border: 1.5px solid var(--border-default);
      border-radius: 9999px;
      background-color: var(--bg-base);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238a9e8d'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      -webkit-appearance: none;
      appearance: none;
      font-family: var(--font-sans);
      font-size: .8125rem;
      color: var(--text-primary);
      cursor: pointer;
      outline: none;
      transition: border-color 150ms;
    }
    .sort-select:focus { border-color: var(--color-primary); }

    .view-btn {
      width: 38px; height: 38px;
      border: 1.5px solid var(--border-default);
      border-radius: 9px;
      background: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-muted);
      transition: border-color 150ms, color 150ms, background 150ms;
    }
    .view-btn:hover, .view-btn.active {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: var(--color-primary-50);
    }

    .filter-toggle-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 38px;
      padding: 0 16px;
      border: 1.5px solid var(--border-default);
      border-radius: 9999px;
      background: var(--bg-base);
      font-family: var(--font-sans);
      font-size: .8125rem;
      font-weight: 500;
      color: var(--text-primary);
      cursor: pointer;
      transition: border-color 150ms;
    }
    .filter-toggle-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    @media (min-width: 1024px) { .filter-toggle-btn { display: none; } }

    /* ── Active filter chips ──────────────────────── */
    .chip-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 28px;
      padding: 0 10px;
      background: var(--color-primary-100);
      color: var(--color-primary-dark);
      border-radius: 9999px;
      font-size: .75rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 150ms;
    }
    .filter-chip:hover { background: var(--color-primary-200); }

    /* ── Product grid ─────────────────────────────── */
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (min-width: 640px) {
      .grid-4 { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 1024px) {
      .grid-4 { grid-template-columns: repeat(3, 1fr); }
    }
    @media (min-width: 1280px) {
      .grid-4 { grid-template-columns: repeat(4, 1fr); }
    }

    /* List view */
    .grid-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .grid-list lg-product-card { display: block; }

    /* ── Empty state ──────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 0;
      text-align: center;
    }
    .empty-icon {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .empty-state h3 {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
    }
    .empty-state p { font-size: .875rem; color: var(--text-muted); margin: 0 0 20px; }
    .empty-state button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 20px;
      background: var(--color-primary);
      color: #fff;
      border: none;
      border-radius: 9999px;
      font-family: var(--font-sans);
      font-size: .875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 150ms;
    }
    .empty-state button:hover { background: var(--color-primary-dark); }

    /* ── Pagination ───────────────────────────────── */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 6px;
      margin-top: 40px;
    }
    .pg-btn {
      min-width: 36px; height: 36px;
      padding: 0 8px;
      border-radius: 9px;
      border: 1.5px solid var(--border-default);
      background: var(--bg-base);
      color: var(--text-secondary);
      font-family: var(--font-sans);
      font-size: .875rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color 150ms, color 150ms, background 150ms;
    }
    .pg-btn:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    .pg-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #fff;
      font-weight: 700;
    }
    .pg-btn:disabled { opacity: .35; cursor: not-allowed; }

    /* ── Card entrance animation ─────────────────── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Mobile filter drawer ─────────────────────── */
    .filter-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.35);
      z-index: 300;
      animation: fade-in .2s ease;
    }
    .filter-drawer {
      position: fixed;
      left: 0; top: 0; bottom: 0;
      width: 300px;
      background: var(--bg-base);
      z-index: 301;
      overflow-y: auto;
      box-shadow: var(--shadow-xl);
      animation: slide-in .25s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes slide-in {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px;
      border-bottom: 1px solid var(--border-default);
      position: sticky; top: 0;
      background: var(--bg-base);
      z-index: 1;
    }
  `],
  template: `
    <div class="page-wrap">

      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/">Home</a>
        <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
        @if (activeCategory()) {
          <a routerLink="/products">Products</a>
          <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
          <span class="crumb-current">{{ activeCategory()!.name }}</span>
        } @else {
          <span class="crumb-current">All Products</span>
        }
      </nav>

      <div class="body-layout">

        <!-- Desktop Sidebar -->
        <aside class="sidebar">
          <div class="filter-card">
            <div class="filter-header">
              <span class="filter-title">Filters</span>
              @if (hasActiveFilters()) {
                <button class="filter-clear" (click)="clearFilters()">Clear all</button>
              }
            </div>

            <!-- Categories -->
            <div class="filter-section">
              <button class="filter-section-btn" (click)="catOpen.update(v => !v)">
                <span>Category</span>
                <mat-icon style="font-size:16px;width:16px;height:16px;transition:transform 200ms"
                          [style.transform]="catOpen() ? 'rotate(180deg)' : 'none'">expand_more</mat-icon>
              </button>
              @if (catOpen()) {
                <div class="filter-body">
                  <button class="cat-btn" [class.active]="!selectedCategory" (click)="filterByCategory(null)">
                    <span class="cat-dot"></span> All Plants & Seeds
                  </button>
                  @for (cat of productSvc.categories(); track cat.id) {
                    <button class="cat-btn" [class.active]="selectedCategory === cat.slug"
                            (click)="filterByCategory(cat.slug)">
                      <span class="cat-dot"></span> {{ cat.name }}
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Price range -->
            <div class="filter-section">
              <button class="filter-section-btn" (click)="priceOpen.update(v => !v)">
                <span>Price Range</span>
                <mat-icon style="font-size:16px;width:16px;height:16px;transition:transform 200ms"
                          [style.transform]="priceOpen() ? 'rotate(180deg)' : 'none'">expand_more</mat-icon>
              </button>
              @if (priceOpen()) {
                <div class="filter-body">
                  <div class="price-inputs">
                    <input class="price-inp" [(ngModel)]="minPrice" type="number" placeholder="₹ Min"
                           (change)="applyFilters()" />
                    <span class="price-sep">–</span>
                    <input class="price-inp" [(ngModel)]="maxPrice" type="number" placeholder="₹ Max"
                           (change)="applyFilters()" />
                  </div>
                </div>
              }
            </div>

            <!-- Brands -->
            @if (productSvc.brands().length > 0) {
              <div class="filter-section">
                <button class="filter-section-btn" (click)="brandOpen.update(v => !v)">
                  <span>Brand</span>
                  <mat-icon style="font-size:16px;width:16px;height:16px;transition:transform 200ms"
                            [style.transform]="brandOpen() ? 'rotate(180deg)' : 'none'">expand_more</mat-icon>
                </button>
                @if (brandOpen()) {
                  <div class="filter-body" style="max-height:220px;overflow-y:auto">
                    @for (brand of productSvc.brands(); track brand.id) {
                      <label class="brand-label">
                        <input type="checkbox"
                               [checked]="selectedBrands.has(brand.slug)"
                               (change)="toggleBrand(brand.slug)" />
                        {{ brand.name }}
                      </label>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </aside>

        <!-- Main content -->
        <div class="main-content">

          <!-- Toolbar -->
          <div class="toolbar">
            <div class="toolbar-left">
              <h1>{{ activeCategory()?.name ?? 'All Plants & Seeds' }}</h1>
              @if (!loading()) {
                <p>{{ total() }} product{{ total() !== 1 ? 's' : '' }} found</p>
              }
            </div>

            <div class="toolbar-right">
              <!-- Mobile filter toggle -->
              <button class="filter-toggle-btn" (click)="showFilters.set(true)">
                <mat-icon style="font-size:16px;width:16px;height:16px">tune</mat-icon>
                Filters
                @if (hasActiveFilters()) {
                  <span style="background:var(--color-accent);color:#fff;font-size:10px;font-weight:700;
                               width:16px;height:16px;border-radius:50%;display:flex;align-items:center;
                               justify-content:center;flex-shrink:0">
                    {{ activeFilterCount() }}
                  </span>
                }
              </button>

              <!-- Sort -->
              <select class="sort-select" [(ngModel)]="sort" (change)="applyFilters()">
                <option value="">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="popular">Most Popular</option>
              </select>

              <!-- View toggle -->
              <div style="display:flex;gap:4px">
                <button class="view-btn" [class.active]="viewMode() === 'grid'" (click)="viewMode.set('grid')"
                        title="Grid view">
                  <mat-icon style="font-size:18px;width:18px;height:18px">grid_view</mat-icon>
                </button>
                <button class="view-btn" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')"
                        title="List view">
                  <mat-icon style="font-size:18px;width:18px;height:18px">view_list</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Active filter chips -->
          @if (hasActiveFilters()) {
            <div class="chip-bar">
              @if (selectedCategory) {
                <button class="filter-chip" (click)="filterByCategory(null)">
                  {{ activeCategory()?.name }}
                  <mat-icon style="font-size:12px;width:12px;height:12px">close</mat-icon>
                </button>
              }
              @if (minPrice || maxPrice) {
                <button class="filter-chip" (click)="minPrice = null; maxPrice = null; applyFilters()">
                  {{ (minPrice ?? 0) | currencyInr }} – {{ (maxPrice ?? '∞') }}
                  <mat-icon style="font-size:12px;width:12px;height:12px">close</mat-icon>
                </button>
              }
              @for (b of selectedBrandsArray(); track b) {
                <button class="filter-chip" (click)="toggleBrand(b)">
                  {{ b }}
                  <mat-icon style="font-size:12px;width:12px;height:12px">close</mat-icon>
                </button>
              }
            </div>
          }

          <!-- Product grid -->
          @if (loading()) {
            <div class="grid-4">
              @for (i of skeletons; track i) {
                <lg-skeleton-card></lg-skeleton-card>
              }
            </div>

          } @else if (products().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <mat-icon style="font-size:36px;width:36px;height:36px;color:var(--color-sage)">eco</mat-icon>
              </div>
              <h3>No plants found</h3>
              <p>Try adjusting your filters or browsing all categories</p>
              <button (click)="clearFilters()">
                <mat-icon style="font-size:16px;width:16px;height:16px">refresh</mat-icon>
                Clear filters
              </button>
            </div>

          } @else {
            <div [class]="viewMode() === 'grid' ? 'grid-4' : 'grid-list'">
              @for (product of products(); track product.id) {
                <lg-product-card [product]="product" style="animation:fadeUp .4s both"
                                 [style.animation-delay.ms]="$index * 40"></lg-product-card>
              }
            </div>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="pagination">
                <button class="pg-btn" [disabled]="currentPage() === 1"
                        (click)="goToPage(currentPage() - 1)">
                  <mat-icon style="font-size:18px;width:18px;height:18px">chevron_left</mat-icon>
                </button>

                @if (pageNumbers()[0] > 1) {
                  <button class="pg-btn" (click)="goToPage(1)">1</button>
                  @if (pageNumbers()[0] > 2) {
                    <span style="color:var(--text-muted);padding:0 4px">…</span>
                  }
                }

                @for (p of pageNumbers(); track p) {
                  <button class="pg-btn" [class.active]="p === currentPage()"
                          (click)="goToPage(p)">{{ p }}</button>
                }

                @if (pageNumbers()[pageNumbers().length - 1] < totalPages()) {
                  @if (pageNumbers()[pageNumbers().length - 1] < totalPages() - 1) {
                    <span style="color:var(--text-muted);padding:0 4px">…</span>
                  }
                  <button class="pg-btn" (click)="goToPage(totalPages())">{{ totalPages() }}</button>
                }

                <button class="pg-btn" [disabled]="currentPage() === totalPages()"
                        (click)="goToPage(currentPage() + 1)">
                  <mat-icon style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
                </button>
              </div>
            }
          }
        </div>
      </div>

    </div>

    <!-- Mobile filter overlay -->
    @if (showFilters()) {
      <div class="filter-overlay" (click)="showFilters.set(false)"></div>
      <div class="filter-drawer">
        <div class="drawer-header">
          <span style="font-family:var(--font-display);font-size:1.125rem;font-weight:600">Filters</span>
          <button style="background:none;border:none;cursor:pointer;color:var(--text-muted)"
                  (click)="showFilters.set(false)">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Category list in drawer -->
        <div style="padding:14px 18px;border-bottom:1px solid var(--border-default)">
          <p style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                    color:var(--text-muted);margin:0 0 10px">Category</p>
          <button class="cat-btn" [class.active]="!selectedCategory" (click)="filterByCategory(null); showFilters.set(false)">
            <span class="cat-dot"></span> All Plants & Seeds
          </button>
          @for (cat of productSvc.categories(); track cat.id) {
            <button class="cat-btn" [class.active]="selectedCategory === cat.slug"
                    (click)="filterByCategory(cat.slug); showFilters.set(false)">
              <span class="cat-dot"></span> {{ cat.name }}
            </button>
          }
        </div>

        <!-- Price in drawer -->
        <div style="padding:14px 18px">
          <p style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
                    color:var(--text-muted);margin:0 0 10px">Price Range</p>
          <div class="price-inputs">
            <input class="price-inp" [(ngModel)]="minPrice" type="number" placeholder="₹ Min"
                   (change)="applyFilters()" />
            <span class="price-sep">–</span>
            <input class="price-inp" [(ngModel)]="maxPrice" type="number" placeholder="₹ Max"
                   (change)="applyFilters()" />
          </div>
        </div>

        <div style="padding:14px 18px;border-top:1px solid var(--border-default)">
          <button class="filter-clear" (click)="clearFilters(); showFilters.set(false)"
                  style="font-size:.875rem">Clear all filters</button>
        </div>
      </div>
    }
  `,
})
export class ProductListComponent implements OnInit {
  readonly productSvc  = inject(ProductService);
  readonly #route      = inject(ActivatedRoute);
  readonly #router     = inject(Router);

  readonly products    = signal<Product[]>([]);
  readonly loading     = signal(true);
  readonly total       = signal(0);
  readonly currentPage = signal(1);
  readonly totalPages  = signal(1);
  readonly showFilters = signal(false);
  readonly viewMode    = signal<'grid' | 'list'>('grid');

  readonly catOpen   = signal(true);
  readonly priceOpen = signal(true);
  readonly brandOpen = signal(false);

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

  activeFilterCount = computed(() => {
    let c = 0;
    if (this.selectedCategory) c++;
    if (this.minPrice || this.maxPrice) c++;
    c += this.selectedBrands.size;
    return c;
  });

  selectedBrandsArray = computed(() => Array.from(this.selectedBrands));

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
    if (this.sort) params['sort'] = this.sort;

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

import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed, effect,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { VendorService } from '../../../core/services/vendor.service';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import type { Product } from '../../../core/services/product.service';

type StatusFilter = 'all' | 'active' | 'draft' | 'inactive' | 'archived';

interface StatusTab { key: StatusFilter; label: string; count: number; }

@Component({
  selector: 'lg-vendor-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FormsModule, MatIconModule, CurrencyInrPipe, SkeletonComponent, BadgeComponent],
  styles: [`
    :host { display: block; }
    .page { padding: 24px 24px 80px; max-width: 1400px; margin: 0 auto; }

    /* ── Page header ─────────────────────────────────── */
    .page-head {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; margin-bottom: 24px;
    }
    .page-head h1 {
      font-family: var(--font-display); font-size: 1.375rem; font-weight: 700;
      color: var(--text-primary); margin: 0 0 2px;
    }
    .page-head p { font-size: .8125rem; color: var(--text-muted); margin: 0; }

    .add-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; background: var(--color-primary); color: #fff;
      border: none; border-radius: 10px; font-size: .875rem; font-weight: 600;
      cursor: pointer; text-decoration: none; transition: background 150ms, transform 150ms;
      white-space: nowrap; flex-shrink: 0;
    }
    .add-btn:hover { background: var(--color-primary-dark); transform: translateY(-1px); }

    /* ── Status tabs ─────────────────────────────────── */
    .status-tabs {
      display: flex; gap: 2px; border-bottom: 1px solid var(--border-default);
      margin-bottom: 20px; overflow-x: auto; scrollbar-width: none;
    }
    .status-tabs::-webkit-scrollbar { display: none; }
    .tab-btn {
      padding: 10px 16px; border: none; background: none; cursor: pointer;
      font-size: .8125rem; font-weight: 500; color: var(--text-muted);
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      white-space: nowrap; transition: color 150ms, border-color 150ms;
      display: flex; align-items: center; gap: 6px;
    }
    .tab-btn:hover { color: var(--text-primary); }
    .tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }
    .tab-count {
      font-size: .6875rem; padding: 1px 7px; border-radius: 9999px;
      background: var(--bg-subtle); color: var(--text-muted);
    }
    .tab-btn.active .tab-count { background: #dcfce7; color: #16a34a; }

    /* ── Toolbar ─────────────────────────────────────── */
    .toolbar {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .search-wrap {
      flex: 1; min-width: 200px; max-width: 360px;
      display: flex; align-items: center; gap: 8px;
      background: #fff; border: 1.5px solid var(--border-default);
      border-radius: 10px; padding: 0 12px; height: 38px;
      transition: border-color 150ms;
    }
    :host-context(.dark) .search-wrap { background: var(--surface-800, #1e2d20); }
    .search-wrap:focus-within { border-color: var(--color-primary); }
    .search-wrap mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--text-muted); flex-shrink: 0; }
    .search-inp {
      flex: 1; border: none; background: none; outline: none;
      font-size: .875rem; color: var(--text-primary);
    }
    .search-inp::placeholder { color: var(--text-muted); }

    .filter-select {
      height: 38px; padding: 0 32px 0 12px; border: 1.5px solid var(--border-default);
      border-radius: 10px; font-size: .8125rem; color: var(--text-secondary);
      background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23888' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E") no-repeat right 10px center;
      appearance: none; cursor: pointer;
    }
    :host-context(.dark) .filter-select { background-color: var(--surface-800, #1e2d20); color: var(--text-primary); }

    /* ── Bulk action bar ─────────────────────────────── */
    .bulk-bar {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      padding: 10px 16px; margin-bottom: 12px;
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
      font-size: .875rem;
    }
    :host-context(.dark) .bulk-bar { background: rgba(37,99,235,.1); border-color: rgba(59,130,246,.3); }
    .bulk-count { font-weight: 600; color: #2563eb; }
    .bulk-actions { display: flex; gap: 8px; margin-left: auto; flex-wrap: wrap; }
    .bulk-btn {
      padding: 6px 14px; border-radius: 8px; border: none; cursor: pointer;
      font-size: .8125rem; font-weight: 500; transition: background 150ms;
    }
    .bulk-btn-danger { background: #fee2e2; color: #dc2626; }
    .bulk-btn-danger:hover { background: #fecaca; }
    .bulk-btn-default { background: var(--bg-subtle); color: var(--text-secondary); }
    .bulk-btn-default:hover { background: var(--border-default); }

    /* ── Table panel ─────────────────────────────────── */
    .table-panel {
      background: #fff; border: 1px solid var(--border-default); border-radius: 16px;
      overflow: hidden;
    }
    :host-context(.dark) .table-panel { background: var(--surface-800, #1e2d20); }

    .table-scroll { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: .8125rem; min-width: 700px; }

    thead th {
      padding: 11px 14px; text-align: left;
      font-size: .6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
      color: var(--text-muted); background: var(--bg-subtle);
      border-bottom: 1px solid var(--border-default); white-space: nowrap;
    }
    thead th:first-child { width: 40px; }

    tbody td {
      padding: 12px 14px; color: var(--text-secondary);
      border-bottom: 1px solid var(--border-default); vertical-align: middle;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: var(--bg-subtle); }

    /* ── Product cell ────────────────────────────────── */
    .prod-cell { display: flex; align-items: center; gap: 10px; }
    .prod-thumb {
      width: 44px; height: 44px; border-radius: 8px; overflow: hidden;
      background: var(--bg-subtle); flex-shrink: 0;
    }
    .prod-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .prod-name {
      font-weight: 500; color: var(--text-primary);
      display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
      max-width: 200px;
    }
    .prod-sku { font-size: .6875rem; color: var(--text-muted); margin-top: 2px; font-family: monospace; }

    .price-main { font-weight: 600; color: var(--text-primary); }
    .price-orig { font-size: .6875rem; color: var(--text-muted); text-decoration: line-through; margin-top: 1px; }
    .price-sale { font-size: .6875rem; color: #16a34a; font-weight: 600; }

    /* ── Action buttons ──────────────────────────────── */
    .action-row { display: flex; align-items: center; gap: 4px; }
    .act-btn {
      width: 30px; height: 30px; border: none; background: none;
      border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); transition: background 150ms, color 150ms; text-decoration: none;
    }
    .act-btn:hover { background: var(--bg-subtle); color: var(--text-primary); }
    .act-btn.danger:hover { background: #fee2e2; color: #dc2626; }

    /* ── Checkbox ────────────────────────────────────── */
    input[type=checkbox] {
      width: 15px; height: 15px; accent-color: var(--color-primary); cursor: pointer;
    }

    /* ── Empty state ─────────────────────────────────── */
    .empty {
      display: flex; flex-direction: column; align-items: center;
      padding: 64px 24px; text-align: center;
    }
    .empty h3 { font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin: 16px 0 8px; }
    .empty p  { font-size: .875rem; color: var(--text-muted); margin: 0 0 24px; }

    /* ── Pagination ──────────────────────────────────── */
    .pagination {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-top: 1px solid var(--border-default);
      font-size: .8125rem; color: var(--text-muted); flex-wrap: wrap; gap: 8px;
    }
    .page-btns { display: flex; gap: 4px; }
    .pg-btn {
      min-width: 34px; height: 34px; padding: 0 8px; border: 1px solid var(--border-default);
      border-radius: 8px; background: #fff; cursor: pointer; font-size: .8125rem;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary); transition: all 150ms;
    }
    :host-context(.dark) .pg-btn { background: var(--surface-900, #151f17); }
    .pg-btn:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
    .pg-btn.current { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .pg-btn:disabled { opacity: .4; cursor: not-allowed; }

    /* ── Status quick-change menu ────────────────────── */
    .status-menu-wrap { position: relative; display: inline-block; }
    .status-menu {
      position: absolute; top: calc(100% + 4px); right: 0; z-index: 50;
      background: #fff; border: 1px solid var(--border-default); border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,.12); min-width: 140px; overflow: hidden;
    }
    :host-context(.dark) .status-menu { background: var(--surface-800, #1e2d20); }
    .status-opt {
      display: flex; align-items: center; gap: 8px; padding: 9px 14px;
      font-size: .8125rem; cursor: pointer; transition: background 150ms;
      color: var(--text-secondary); border: none; background: none; width: 100%; text-align: left;
    }
    .status-opt:hover { background: var(--bg-subtle); color: var(--text-primary); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  `],
  template: `
    <div class="page">

      <!-- Page header -->
      <div class="page-head">
        <div>
          <h1>Product Catalogue</h1>
          <p>Manage your listings, pricing, and inventory.</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a routerLink="/vendor/products/bulk" class="add-btn"
             style="background:var(--bg-subtle);color:var(--text-secondary);border:1.5px solid var(--border-default)">
            <mat-icon style="font-size:16px;width:16px;height:16px">upload_file</mat-icon>
            Bulk Upload
          </a>
          <a routerLink="/vendor/products/new" class="add-btn">
            <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon>
            Add Product
          </a>
        </div>
      </div>

      <!-- Status tabs -->
      <div class="status-tabs">
        @for (tab of statusTabs(); track tab.key) {
          <button class="tab-btn" [class.active]="statusFilter() === tab.key"
                  (click)="setStatus(tab.key)">
            {{ tab.label }}
            <span class="tab-count">{{ tab.count }}</span>
          </button>
        }
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input class="search-inp" [(ngModel)]="searchQuery"
                 placeholder="Search products…"
                 (ngModelChange)="onSearch($event)" />
          @if (searchQuery) {
            <button style="border:none;background:none;cursor:pointer;color:var(--text-muted);padding:0"
                    (click)="searchQuery='';onSearch('')">
              <mat-icon style="font-size:16px;width:16px;height:16px">close</mat-icon>
            </button>
          }
        </div>

        <select class="filter-select" [(ngModel)]="sortBy" (ngModelChange)="reload()">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A–Z</option>
        </select>

        <span style="margin-left:auto;font-size:.8125rem;color:var(--text-muted)">
          {{ meta().total }} product{{ meta().total !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Bulk action bar -->
      @if (selectedIds().size > 0) {
        <div class="bulk-bar">
          <span class="bulk-count">{{ selectedIds().size }} selected</span>
          <div class="bulk-actions">
            <button class="bulk-btn bulk-btn-default" (click)="bulkSetStatus('active')">
              Set Active
            </button>
            <button class="bulk-btn bulk-btn-default" (click)="bulkSetStatus('draft')">
              Set Draft
            </button>
            <button class="bulk-btn bulk-btn-danger" (click)="bulkArchive()">
              Archive Selected
            </button>
            <button class="bulk-btn bulk-btn-default" (click)="clearSelection()">
              Clear
            </button>
          </div>
        </div>
      }

      <!-- Loading skeletons -->
      @if (loading()) {
        <div class="table-panel">
          <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
            @for (i of [0,1,2,3,4,5]; track i) {
              <lg-skeleton height="52px" borderRadius="8px"></lg-skeleton>
            }
          </div>
        </div>

      } @else if (products().length === 0) {
        <div class="table-panel">
          <div class="empty">
            <mat-icon style="font-size:48px;width:48px;height:48px;color:var(--text-muted)">inventory_2</mat-icon>
            @if (searchQuery || statusFilter() !== 'all') {
              <h3>No products found</h3>
              <p>Try adjusting your search or filter criteria.</p>
              <button style="padding:8px 20px;border-radius:8px;border:1.5px solid var(--border-default);
                             background:none;cursor:pointer;font-size:.875rem;color:var(--text-secondary)"
                      (click)="clearFilters()">Clear filters</button>
            } @else {
              <h3>No products yet</h3>
              <p>Start building your catalogue by listing your first product.</p>
              <a routerLink="/vendor/products/new" class="add-btn">
                <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon>
                Add Your First Product
              </a>
            }
          </div>
        </div>

      } @else {
        <div class="table-panel">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" [checked]="allSelected()" (change)="toggleSelectAll()" />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (p of products(); track p.id) {
                  <tr>
                    <!-- Checkbox -->
                    <td>
                      <input type="checkbox"
                             [checked]="selectedIds().has(p.id)"
                             (change)="toggleSelect(p.id)" />
                    </td>

                    <!-- Product -->
                    <td>
                      <div class="prod-cell">
                        <div class="prod-thumb">
                          <img [src]="primaryImage(p)" [alt]="p.name"
                               onerror="this.src='/assets/placeholder.png'" />
                        </div>
                        <div>
                          <div class="prod-name">{{ p.name }}</div>
                          <div class="prod-sku">SKU: {{ getSku(p) }}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Category -->
                    <td style="white-space:nowrap">{{ p.category?.name ?? '—' }}</td>

                    <!-- Price -->
                    <td>
                      @if (p.salePrice) {
                        <div class="price-sale">{{ p.salePrice | currencyInr }}</div>
                        <div class="price-orig">{{ p.basePrice | currencyInr }}</div>
                      } @else {
                        <div class="price-main">{{ p.basePrice | currencyInr }}</div>
                      }
                    </td>

                    <!-- Status -->
                    <td>
                      <div class="status-menu-wrap">
                        <button style="background:none;border:none;cursor:pointer;padding:0"
                                (click)="openStatusMenu(p.id, $event)">
                          <lg-badge [variant]="statusVariant(p.status)">
                            {{ p.status }}
                            <mat-icon style="font-size:10px;width:10px;height:10px">expand_more</mat-icon>
                          </lg-badge>
                        </button>
                        @if (openMenuId() === p.id) {
                          <div class="status-menu">
                            @for (opt of statusOptions; track opt.value) {
                              <button class="status-opt" (click)="setProductStatus(p.id, opt.value)">
                                <span class="status-dot" [style.background]="opt.color"></span>
                                {{ opt.label }}
                              </button>
                            }
                          </div>
                        }
                      </div>
                    </td>

                    <!-- Actions -->
                    <td>
                      <div class="action-row">
                        <a [routerLink]="['/vendor/products', p.id, 'edit']" class="act-btn" title="Edit">
                          <mat-icon style="font-size:16px;width:16px;height:16px">edit</mat-icon>
                        </a>
                        <a [href]="'/products/' + p.slug" target="_blank" class="act-btn" title="View">
                          <mat-icon style="font-size:16px;width:16px;height:16px">open_in_new</mat-icon>
                        </a>
                        <button class="act-btn danger" title="Archive" (click)="archiveProduct(p.id, p.name)">
                          <mat-icon style="font-size:16px;width:16px;height:16px">archive</mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (meta().totalPages > 1) {
            <div class="pagination">
              <span>
                Showing {{ (page()-1)*20+1 }}–{{ Math.min(page()*20, meta().total) }} of {{ meta().total }}
              </span>
              <div class="page-btns">
                <button class="pg-btn" [disabled]="page() === 1" (click)="goPage(page()-1)">
                  <mat-icon style="font-size:16px;width:16px;height:16px">chevron_left</mat-icon>
                </button>
                @for (pg of pageNumbers(); track pg) {
                  <button class="pg-btn" [class.current]="pg === page()" (click)="goPage(pg)">
                    {{ pg }}
                  </button>
                }
                <button class="pg-btn" [disabled]="page() === meta().totalPages" (click)="goPage(page()+1)">
                  <mat-icon style="font-size:16px;width:16px;height:16px">chevron_right</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class VendorProductsComponent implements OnInit {
  readonly #vendor = inject(VendorService);
  readonly #toast  = inject(ToastService);
  readonly #router = inject(Router);

  readonly Math = Math;

  readonly loading    = signal(true);
  readonly products   = signal<Product[]>([]);
  readonly meta       = signal({ total: 0, totalPages: 1, page: 1, limit: 20 });
  readonly page       = signal(1);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly selectedIds  = signal<Set<number>>(new Set());
  readonly openMenuId   = signal<number | null>(null);

  // status counts fetched once per tab change
  readonly statusCounts = signal<Record<StatusFilter, number>>({
    all: 0, active: 0, draft: 0, inactive: 0, archived: 0,
  });

  searchQuery = '';
  sortBy = 'newest';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly allSelected = computed(() => {
    const ids = this.selectedIds();
    return this.products().length > 0 && this.products().every(p => ids.has(p.id));
  });

  readonly statusTabs = computed((): StatusTab[] => {
    const c = this.statusCounts();
    return [
      { key: 'all',      label: 'All',      count: c.all      },
      { key: 'active',   label: 'Active',   count: c.active   },
      { key: 'draft',    label: 'Draft',    count: c.draft    },
      { key: 'inactive', label: 'Inactive', count: c.inactive },
      { key: 'archived', label: 'Archived', count: c.archived },
    ];
  });

  readonly pageNumbers = computed(() => {
    const t = this.meta().totalPages;
    const p = this.page();
    const pages: number[] = [];
    for (let i = Math.max(1, p - 2); i <= Math.min(t, p + 2); i++) pages.push(i);
    return pages;
  });

  readonly statusOptions = [
    { value: 'active'   as const, label: 'Active',   color: '#22c55e' },
    { value: 'draft'    as const, label: 'Draft',    color: '#94a3b8' },
    { value: 'inactive' as const, label: 'Inactive', color: '#f59e0b' },
    { value: 'archived' as const, label: 'Archive',  color: '#ef4444' },
  ];

  ngOnInit(): void {
    this.loadCounts();
    this.reload();
    document.addEventListener('click', () => this.openMenuId.set(null));
  }

  reload(): void {
    this.loading.set(true);
    this.selectedIds.set(new Set());
    this.#vendor.getMyProducts(this.page(), this.statusFilter() !== 'all' ? this.statusFilter() : undefined).subscribe({
      next: r => {
        // client-side search filter if query present
        const q = this.searchQuery.toLowerCase();
        const data = q
          ? r.data.filter(p => p.name.toLowerCase().includes(q) || p.slug.includes(q))
          : r.data;
        this.products.set(data);
        this.meta.set(r.meta);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadCounts(): void {
    // Fetch count for each status in parallel
    const statuses: StatusFilter[] = ['all', 'active', 'draft', 'inactive', 'archived'];
    const counts: Record<StatusFilter, number> = { all: 0, active: 0, draft: 0, inactive: 0, archived: 0 };
    let done = 0;
    statuses.forEach(s => {
      this.#vendor.getMyProducts(1, s !== 'all' ? s : undefined).subscribe({
        next: r => {
          counts[s] = r.meta.total;
          done++;
          if (done === statuses.length) this.statusCounts.set({ ...counts });
        },
        error: () => done++,
      });
    });
  }

  setStatus(s: StatusFilter): void {
    this.statusFilter.set(s);
    this.page.set(1);
    this.reload();
  }

  onSearch(q: string): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.reload(); }, 350);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.statusFilter.set('all');
    this.page.set(1);
    this.reload();
  }

  goPage(p: number): void {
    this.page.set(p);
    this.reload();
  }

  toggleSelect(id: number): void {
    this.selectedIds.update(set => {
      const n = new Set(set);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.products().map(p => p.id)));
    }
  }

  openStatusMenu(id: number, e: Event): void {
    e.stopPropagation();
    this.openMenuId.update(cur => cur === id ? null : id);
  }

  setProductStatus(id: number, status: 'draft' | 'active' | 'inactive' | 'archived'): void {
    this.openMenuId.set(null);
    this.#vendor.updateProductStatus(id, status).subscribe({
      next: r => {
        this.products.update(list => list.map(p => p.id === id ? r.data : p));
        this.#toast.success('Status updated', `Product is now ${status}`);
        this.loadCounts();
      },
      error: err => this.#toast.error('Error', err?.error?.message ?? 'Could not update'),
    });
  }

  archiveProduct(id: number, name: string): void {
    this.#vendor.deleteProduct(id).subscribe({
      next: () => {
        this.products.update(list => list.filter(p => p.id !== id));
        this.meta.update(m => ({ ...m, total: m.total - 1 }));
        this.#toast.success('Archived', name);
        this.loadCounts();
      },
      error: err => this.#toast.error('Error', err?.error?.message ?? 'Could not archive'),
    });
  }

  bulkSetStatus(status: 'active' | 'draft'): void {
    const ids = [...this.selectedIds()];
    let done = 0;
    ids.forEach(id => {
      this.#vendor.updateProductStatus(id, status).subscribe({
        next: r => {
          this.products.update(list => list.map(p => p.id === id ? r.data : p));
          done++;
          if (done === ids.length) {
            this.selectedIds.set(new Set());
            this.#toast.success('Updated', `${ids.length} products set to ${status}`);
            this.loadCounts();
          }
        },
      });
    });
  }

  bulkArchive(): void {
    const ids = [...this.selectedIds()];
    let done = 0;
    ids.forEach(id => {
      this.#vendor.deleteProduct(id).subscribe({
        next: () => {
          done++;
          if (done === ids.length) {
            this.reload();
            this.#toast.success('Archived', `${ids.length} products archived`);
            this.loadCounts();
          }
        },
      });
    });
  }

  primaryImage(p: Product): string {
    const primary = p.images?.find(i => i.isPrimary);
    return primary?.url ?? p.images?.[0]?.url ?? '/assets/placeholder.png';
  }

  statusVariant(s: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
    if (s === 'active')   return 'success';
    if (s === 'inactive') return 'warning';
    if (s === 'archived') return 'error';
    return 'default';
  }

  clearSelection(): void { this.selectedIds.set(new Set()); }

  getSku(p: Product): string { return (p as unknown as Record<string, unknown>)['sku'] as string || '—'; }
}

import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VendorService, ProductReviewStat } from '../../../core/services/vendor.service';

@Component({
  selector: 'lg-vendor-reviews',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CurrencyPipe, RouterLink],
  template: `
<div class="p-6 max-w-7xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Product Reviews</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Monitor ratings and customer feedback across your catalogue</p>
  </div>

  <!-- Summary cards -->
  @if (!loading() && products().length > 0) {
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Products</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ total() }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Avg Rating</p>
        <div class="flex items-center gap-1.5">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ avgRating() }}</p>
          <span class="material-icons text-amber-400 text-[20px]">star</span>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Reviews</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalReviews() }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Highly Rated (4★+)</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ highlyRated() }}</p>
      </div>
    </div>
  }

  <!-- Rating distribution bar chart -->
  @if (!loading() && products().length > 0) {
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">Rating Distribution</h2>
      <div class="space-y-2">
        @for (star of starArray; track star) {
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-0.5 w-16 shrink-0">
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ star }}</span>
              <span class="material-icons text-amber-400 text-[14px]">star</span>
            </div>
            <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div class="h-full bg-amber-400 rounded-full transition-all duration-500"
                   [style.width.%]="ratingBarWidth(star)"></div>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400 w-6 text-right">{{ ratingCount(star) }}</span>
          </div>
        }
      </div>
    </div>
  }

  <!-- Filter + sort -->
  <div class="flex flex-wrap gap-3">
    <div class="relative flex-1 min-w-[200px]">
      <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">search</span>
      <input [(ngModel)]="searchQuery" (ngModelChange)="onSearch()"
        placeholder="Search products…"
        class="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
    </div>
    <select [(ngModel)]="sortBy" (ngModelChange)="applySortAndFilter()"
      class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500">
      <option value="reviewCount_desc">Most Reviewed</option>
      <option value="rating_desc">Highest Rated</option>
      <option value="rating_asc">Lowest Rated</option>
      <option value="reviewCount_asc">Fewest Reviews</option>
    </select>
  </div>

  <!-- Product grid -->
  @if (loading()) {
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (i of [1,2,3,4,5,6]; track i) {
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse h-36"></div>
      }
    </div>
  } @else if (pageSlice().length === 0) {
    <div class="flex flex-col items-center justify-center py-24 gap-3">
      <span class="material-icons text-5xl text-gray-300 dark:text-gray-600">reviews</span>
      <p class="text-gray-500 dark:text-gray-400 text-sm">No products found</p>
    </div>
  } @else {
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (p of pageSlice(); track p.id) {
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-green-400 dark:hover:border-green-600 transition-colors">
          <div class="flex gap-3">
            <div class="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0 flex items-center justify-center overflow-hidden">
              @if (p.images?.[0]?.url) {
                <img [src]="p.images![0].url" [alt]="p.name" class="w-full h-full object-cover" />
              } @else {
                <span class="material-icons text-gray-400 text-[26px]">inventory_2</span>
              }
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-white text-sm truncate">{{ p.name }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ p.basePrice | currency:'INR':'symbol':'1.0-0' }}</p>
              <div class="flex items-center gap-0.5 mt-1.5">
                @for (s of starArray; track s) {
                  <span class="material-icons text-[14px] {{ s <= p.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-600' }}">star</span>
                }
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">{{ p.rating.toFixed(1) }}</span>
              </div>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="material-icons text-gray-400 text-[15px]">chat_bubble_outline</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ p.reviewCount }} review{{ p.reviewCount === 1 ? '' : 's' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-0.5 rounded-full {{ statusClass(p.status) }}">{{ p.status }}</span>
              <a [routerLink]="['/vendor/products', p.id, 'edit']"
                 class="text-xs text-green-600 dark:text-green-400 hover:underline">Edit</a>
            </div>
          </div>

          @if (p.reviewCount > 0) {
            <div class="mt-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
              <div class="h-full rounded-full {{ ratingBarColor(p.rating) }}"
                   [style.width.%]="p.rating / 5 * 100"></div>
            </div>
          } @else {
            <p class="text-xs text-gray-400 mt-2.5 italic">No reviews yet</p>
          }
        </div>
      }
    </div>

    @if (totalPages() > 1) {
      <div class="flex items-center justify-center gap-2 pt-2">
        <button [disabled]="page() === 1" (click)="goPage(page() - 1)"
          class="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 dark:border-gray-600">‹</button>
        @for (n of pageNumbers(); track n) {
          <button (click)="goPage(n)"
            class="px-3 py-1.5 rounded-lg border text-sm transition-colors"
            [class]="n === page() ? 'bg-green-600 text-white border-green-600' : 'dark:border-gray-600 text-gray-700 dark:text-gray-300'">
            {{ n }}
          </button>
        }
        <button [disabled]="page() === totalPages()" (click)="goPage(page() + 1)"
          class="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40 dark:border-gray-600">›</button>
      </div>
    }
  }

</div>
  `,
})
export class VendorReviewsComponent implements OnInit {
  readonly #vendor = inject(VendorService);

  readonly products = signal<ProductReviewStat[]>([]);
  readonly loading  = signal(true);
  readonly total    = signal(0);
  readonly page     = signal(1);
  readonly perPage  = 12;

  readonly avgRating    = computed(() => {
    const rated = this.products().filter(p => p.reviewCount > 0);
    if (!rated.length) return '0.0';
    return (rated.reduce((s, p) => s + p.rating, 0) / rated.length).toFixed(1);
  });
  readonly totalReviews = computed(() => this.products().reduce((s, p) => s + p.reviewCount, 0));
  readonly highlyRated  = computed(() => this.products().filter(p => p.rating >= 4).length);

  readonly filtered = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return q ? this.products().filter(p => p.name.toLowerCase().includes(q)) : this.products();
  });
  readonly totalPages  = computed(() => Math.ceil(this.filtered().length / this.perPage) || 1);
  readonly pageSlice   = computed(() => {
    const s = (this.page() - 1) * this.perPage;
    return this.filtered().slice(s, s + this.perPage);
  });
  readonly pageNumbers = computed(() => {
    const tp = this.totalPages(); const cp = this.page();
    const pages: number[] = [];
    for (let i = Math.max(1, cp - 2); i <= Math.min(tp, cp + 2); i++) pages.push(i);
    return pages;
  });

  readonly starArray = [5, 4, 3, 2, 1];
  searchQuery = '';
  sortBy = 'reviewCount_desc';

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true);
    this.#vendor.getVendorProductStats(1).subscribe({
      next: r => {
        this.products.set(r.data);
        this.total.set(r.meta.total);
        this.applySortAndFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); }, 300);
  }

  applySortAndFilter(): void {
    const [field, dir] = this.sortBy.split('_');
    this.products.update(list => [...list].sort((a, b) => {
      const av = (a as any)[field] as number;
      const bv = (b as any)[field] as number;
      return dir === 'desc' ? bv - av : av - bv;
    }));
    this.page.set(1);
  }

  goPage(p: number): void { this.page.set(p); }

  ratingCount(star: number): number {
    return this.products().filter(p => Math.round(p.rating) === star).length;
  }
  ratingBarWidth(star: number): number {
    const t = this.products().length;
    return t ? (this.ratingCount(star) / t) * 100 : 0;
  }
  ratingBarColor(r: number): string {
    if (r >= 4) return 'bg-green-500';
    if (r >= 3) return 'bg-amber-400';
    return 'bg-red-400';
  }
  statusClass(s: string): string {
    const m: Record<string, string> = {
      active:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
      draft:    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
      inactive: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    };
    return m[s] ?? m['draft'];
  }
}

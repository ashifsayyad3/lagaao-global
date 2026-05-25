import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { VendorService, VendorCustomer } from '../../../core/services/vendor.service';

function avatarColor(name: string): string {
  const colors = [
    'bg-rose-400',
    'bg-orange-400',
    'bg-amber-400',
    'bg-lime-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-violet-500',
  ];
  const index = (name?.charCodeAt(0) ?? 0) % 8;
  return colors[index];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

@Component({
  selector: 'lg-vendor-customers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="p-4 sm:p-6 space-y-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          @if (total() > 0) {
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {{ total() | number }}
            </span>
          }
        </div>
        <div class="relative w-full sm:w-80">
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search customers…"
            class="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            [ngModel]="searchRaw()"
            (ngModelChange)="onSearchInput($event)"
          />
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <!-- Total Customers -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total Customers</p>
            @if (loading()) {
              <div class="mt-1 h-6 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            } @else {
              <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ total() | number }}</p>
            }
          </div>
        </div>

        <!-- Repeat Buyers -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-500 dark:text-gray-400">Repeat Buyers</p>
            @if (loading()) {
              <div class="mt-1 h-6 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            } @else {
              <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ repeatBuyers() }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">from current page only</p>
            }
          </div>
        </div>

        <!-- Total Revenue -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Revenue (this page)</p>
            @if (loading()) {
              <div class="mt-1 h-6 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            } @else {
              <p class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ pageRevenue() | currency:'INR':'symbol':'1.0-0' }}
              </p>
            }
          </div>
        </div>

      </div>

      <!-- Table -->
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">

        <!-- Loading skeleton -->
        @if (loading()) {
          <div class="divide-y divide-gray-100 dark:divide-gray-700">
            @for (i of skeletonRows; track i) {
              <div class="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                  <div class="h-3 bg-gray-100 dark:bg-gray-600 rounded w-56"></div>
                </div>
                <div class="hidden sm:block h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div class="hidden md:block h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-8"></div>
                <div class="hidden lg:block h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div class="hidden xl:block h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div class="h-7 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            }
          </div>
        }

        <!-- Empty state -->
        @else if (customers().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 px-4 text-center">
            <svg class="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">No customers found</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              @if (search()) {
                No customers match <span class="font-medium">"{{ search() }}"</span>. Try a different search term.
              } @else {
                Your customers will appear here once they place their first order.
              }
            </p>
          </div>
        }

        <!-- Data table -->
        @else {
          <!-- Table header -->
          <div class="hidden md:grid grid-cols-[2.5rem_1fr_130px_72px_110px_110px_120px] gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <div></div>
            <div>Customer</div>
            <div>Phone</div>
            <div class="text-center">Orders</div>
            <div class="text-right">Spend</div>
            <div>Since</div>
            <div></div>
          </div>

          <div class="divide-y divide-gray-100 dark:divide-gray-700">
            @for (c of customers(); track c.id) {
              <div class="grid grid-cols-[2.5rem_1fr_auto] md:grid-cols-[2.5rem_1fr_130px_72px_110px_110px_120px] items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">

                <!-- Avatar -->
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 {{ avatarColor(c.name) }}"
                     [ngClass]="avatarColor(c.name)">
                  {{ getInitials(c.name) }}
                </div>

                <!-- Name + email -->
                <div class="min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ c.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ c.email }}</p>
                </div>

                <!-- Phone (hidden on mobile) -->
                <div class="hidden md:block text-sm text-gray-600 dark:text-gray-300 truncate">
                  {{ c.phone || '—' }}
                </div>

                <!-- Orders badge -->
                <div class="hidden md:flex justify-center">
                  <span class="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full text-xs font-semibold"
                    [class]="c.totalOrders > 1
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'">
                    {{ c.totalOrders }}
                  </span>
                </div>

                <!-- Spend -->
                <div class="hidden md:block text-sm font-medium text-gray-900 dark:text-white text-right">
                  {{ c.totalSpend | currency:'INR':'symbol':'1.0-0' }}
                </div>

                <!-- Since -->
                <div class="hidden md:block text-sm text-gray-500 dark:text-gray-400">
                  {{ c.createdAt | date:'d MMM y' }}
                </div>

                <!-- View Orders link -->
                <div class="md:flex justify-end">
                  <a
                    [routerLink]="['/vendor/orders']"
                    [queryParams]="{ customer: c.id }"
                    class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors whitespace-nowrap">
                    View Orders
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>

              </div>
            }
          </div>
        }

      </div>

      <!-- Pagination -->
      @if (!loading() && totalPages() > 1) {
        <div class="flex items-center justify-between flex-wrap gap-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Page {{ currentPage() }} of {{ totalPages() }}
          </p>
          <div class="flex items-center gap-1">
            <button
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() === 1"
              class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            @for (page of visiblePages(); track page) {
              @if (page === -1) {
                <span class="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">…</span>
              } @else {
                <button
                  (click)="goToPage(page)"
                  [class]="page === currentPage()
                    ? 'w-9 h-9 rounded-lg bg-indigo-600 text-white text-sm font-semibold'
                    : 'w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors'">
                  {{ page }}
                </button>
              }
            }

            <button
              (click)="goToPage(currentPage() + 1)"
              [disabled]="currentPage() === totalPages()"
              class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      }

    </div>
  `,
})
export class VendorCustomersComponent implements OnInit {
  private vendorService = inject(VendorService);

  readonly skeletonRows = Array.from({ length: 8 });

  // State
  customers = signal<VendorCustomer[]>([]);
  loading = signal(true);
  total = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  search = signal('');
  searchRaw = signal('');

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Derived
  repeatBuyers = computed(() => this.customers().filter(c => c.totalOrders > 1).length);
  pageRevenue = computed(() => this.customers().reduce((sum, c) => sum + c.totalSpend, 0));

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
      pages.push(p);
    }
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });

  // Expose helpers to template
  avatarColor = avatarColor;
  getInitials = getInitials;

  ngOnInit(): void {
    this.loadCustomers();
  }

  onSearchInput(value: string): void {
    this.searchRaw.set(value);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.search.set(value);
      this.currentPage.set(1);
      this.loadCustomers();
    }, 350);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.loading.set(true);
    const q = this.search().trim() || undefined;
    this.vendorService.getVendorCustomers(this.currentPage(), q).subscribe({
      next: (res) => {
        this.customers.set(res.data);
        this.total.set(res.meta.total);
        this.totalPages.set(res.meta.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.customers.set([]);
        this.loading.set(false);
      },
    });
  }
}

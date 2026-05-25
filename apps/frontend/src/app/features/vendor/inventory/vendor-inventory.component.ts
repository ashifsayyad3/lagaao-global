import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendorService } from '../../../core/services/vendor.service';

interface InventoryVariant {
  id: number;
  sku: string | null;
  name: string | null;
  price: number;
  attributes: Record<string, string> | null;
  product?: { id: number; name: string; slug: string };
  inventory?: {
    id: number;
    variantId: number;
    qtyOnHand: number;
    qtyReserved: number;
    lowStockThreshold: number;
  };
}

interface AdjustPanel {
  variantId: number;
  qtyChange: number;
  type: 'adjustment' | 'purchase' | 'return' | 'damage';
  note: string;
  saving: boolean;
}

interface ThresholdPanel {
  variantId: number;
  threshold: number;
  saving: boolean;
}

@Component({
  selector: 'lg-vendor-inventory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 space-y-5 min-h-screen bg-white dark:bg-gray-900">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <input
          type="text"
          placeholder="Search SKU or product…"
          [ngModel]="searchQuery()"
          (ngModelChange)="onSearchChange($event)"
          class="w-full sm:w-72 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <!-- Low-stock alert banner -->
      @if (lowStockCount() > 0) {
        <div class="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-4 py-3 text-amber-800 dark:text-amber-300 text-sm">
          <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
          </svg>
          <span><strong>{{ lowStockCount() }}</strong> variant{{ lowStockCount() === 1 ? '' : 's' }} are low on stock or out of stock.</span>
        </div>
      }

      <!-- Loading skeleton -->
      @if (loading()) {
        <div class="space-y-2">
          @for (i of skeletonRows; track i) {
            <div class="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
          }
        </div>
      }

      <!-- Table -->
      @if (!loading()) {
        <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
              <tr>
                <th class="px-4 py-3 text-left">Product</th>
                <th class="px-4 py-3 text-left">Variant</th>
                <th class="px-4 py-3 text-right">On Hand</th>
                <th class="px-4 py-3 text-right">Reserved</th>
                <th class="px-4 py-3 text-right">Available</th>
                <th class="px-4 py-3 text-right">Threshold</th>
                <th class="px-4 py-3 text-center">Status</th>
                <th class="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              @for (variant of variants(); track variant.id) {
                <!-- Main row -->
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td class="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium max-w-[160px] truncate">
                    {{ variant.product?.name ?? '—' }}
                  </td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[160px]">
                    <div class="truncate">{{ variant.sku ?? '—' }}</div>
                    @if (variant.attributes) {
                      <div class="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {{ formatAttributes(variant.attributes) }}
                      </div>
                    }
                  </td>
                  <td class="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                    {{ variant.inventory?.qtyOnHand ?? 0 }}
                  </td>
                  <td class="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                    {{ variant.inventory?.qtyReserved ?? 0 }}
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                    {{ available(variant) }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    @if (thresholdPanel()?.variantId === variant.id) {
                      <!-- Inline threshold editor -->
                      <div class="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min="0"
                          [(ngModel)]="thresholdPanelValue"
                          class="w-16 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          (click)="saveThreshold(variant)"
                          [disabled]="thresholdPanel()!.saving"
                          class="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs">
                          {{ thresholdPanel()!.saving ? '…' : 'Save' }}
                        </button>
                        <button (click)="closeThreshold()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs">✕</button>
                      </div>
                    } @else {
                      <button
                        (click)="openThreshold(variant)"
                        class="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs underline underline-offset-2">
                        {{ variant.inventory?.lowStockThreshold ?? 0 }}
                      </button>
                    }
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span [class]="statusClass(variant)" class="inline-block px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ statusLabel(variant) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      (click)="toggleAdjustPanel(variant)"
                      class="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-400 dark:hover:border-indigo-500 text-xs font-medium transition-colors">
                      {{ adjustPanel()?.variantId === variant.id ? 'Close' : 'Adjust' }}
                    </button>
                  </td>
                </tr>

                <!-- Inline adjust panel row -->
                @if (adjustPanel()?.variantId === variant.id) {
                  <tr class="bg-indigo-50 dark:bg-indigo-900/20">
                    <td colspan="8" class="px-4 py-3">
                      <div class="flex flex-wrap items-end gap-3">
                        <div class="flex flex-col gap-1">
                          <label class="text-xs text-gray-500 dark:text-gray-400">Qty Change</label>
                          <input
                            type="number"
                            [(ngModel)]="adjustPanelQty"
                            class="w-24 px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="text-xs text-gray-500 dark:text-gray-400">Type</label>
                          <select
                            [(ngModel)]="adjustPanelType"
                            class="px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="adjustment">Adjustment</option>
                            <option value="purchase">Purchase</option>
                            <option value="return">Return</option>
                            <option value="damage">Damage</option>
                          </select>
                        </div>
                        <div class="flex flex-col gap-1 flex-1 min-w-[160px]">
                          <label class="text-xs text-gray-500 dark:text-gray-400">Note (optional)</label>
                          <input
                            type="text"
                            [(ngModel)]="adjustPanelNote"
                            placeholder="e.g. counted during audit"
                            class="w-full px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          (click)="saveAdjust(variant)"
                          [disabled]="adjustPanel()!.saving"
                          class="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                          {{ adjustPanel()!.saving ? 'Saving…' : 'Save' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }

              @if (variants().length === 0) {
                <tr>
                  <td colspan="8" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No inventory records found.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (meta().totalPages > 1) {
          <div class="flex items-center justify-between pt-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              Page {{ meta().page }} of {{ meta().totalPages }} &mdash; {{ meta().total }} total
            </span>
            <div class="flex gap-1">
              <button
                (click)="goToPage(meta().page - 1)"
                [disabled]="meta().page <= 1"
                class="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                ‹ Prev
              </button>
              @for (p of pageNumbers(); track p) {
                <button
                  (click)="goToPage(p)"
                  [class.bg-indigo-600]="p === meta().page"
                  [class.text-white]="p === meta().page"
                  [class.border-indigo-600]="p === meta().page"
                  class="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  {{ p }}
                </button>
              }
              <button
                (click)="goToPage(meta().page + 1)"
                [disabled]="meta().page >= meta().totalPages"
                class="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Next ›
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class VendorInventoryComponent {
  private vendorService = inject(VendorService);

  // State
  loading = signal(true);
  variants = signal<InventoryVariant[]>([]);
  meta = signal({ total: 0, totalPages: 1, page: 1, limit: 20 });
  searchQuery = signal('');
  lowStockCount = signal(0);

  // Inline panels (only one open at a time per type)
  adjustPanel = signal<AdjustPanel | null>(null);
  thresholdPanel = signal<ThresholdPanel | null>(null);

  // Two-way ngModel bindings for panels (plain properties, not signals)
  adjustPanelQty = 0;
  adjustPanelType: 'adjustment' | 'purchase' | 'return' | 'damage' = 'adjustment';
  adjustPanelNote = '';
  thresholdPanelValue = 0;

  skeletonRows = Array.from({ length: 8 });

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  pageNumbers = computed(() => {
    const total = this.meta().totalPages;
    const current = this.meta().page;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  constructor() {
    // Load inventory on init and load low-stock count
    effect(() => {
      void this.fetchInventory(1, this.searchQuery());
    }, { allowSignalWrites: true });

    void this.fetchLowStock();
  }

  private async fetchInventory(page: number, q?: string): Promise<void> {
    this.loading.set(true);
    try {
      const res = await (this.vendorService.getVendorInventory(page, q || undefined) as Promise<{
        data: InventoryVariant[];
        meta: { total: number; totalPages: number; page: number; limit: number };
      }>);
      this.variants.set(res.data);
      this.meta.set(res.meta);
    } catch {
      // keep previous data on error
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchLowStock(): Promise<void> {
    try {
      const res = await (this.vendorService.getVendorLowStock() as Promise<{ data: InventoryVariant[] }>);
      this.lowStockCount.set(res.data.length);
    } catch {
      // non-critical
    }
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      void this.fetchInventory(1, value);
    }, 350);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.meta().totalPages) return;
    void this.fetchInventory(page, this.searchQuery());
  }

  // ---- Adjust panel ----

  toggleAdjustPanel(variant: InventoryVariant): void {
    if (this.adjustPanel()?.variantId === variant.id) {
      this.adjustPanel.set(null);
      return;
    }
    this.adjustPanelQty = 0;
    this.adjustPanelType = 'adjustment';
    this.adjustPanelNote = '';
    this.adjustPanel.set({ variantId: variant.id, qtyChange: 0, type: 'adjustment', note: '', saving: false });
    this.thresholdPanel.set(null);
  }

  async saveAdjust(variant: InventoryVariant): Promise<void> {
    const panel = this.adjustPanel();
    if (!panel) return;
    this.adjustPanel.set({ ...panel, saving: true });
    try {
      await this.vendorService.adjustInventory(
        variant.id,
        this.adjustPanelType,
        this.adjustPanelQty,
        this.adjustPanelNote || undefined,
      );
      // Refresh row data
      await this.fetchInventory(this.meta().page, this.searchQuery());
      await this.fetchLowStock();
      this.adjustPanel.set(null);
    } catch {
      const cur = this.adjustPanel();
      if (cur) this.adjustPanel.set({ ...cur, saving: false });
    }
  }

  // ---- Threshold panel ----

  openThreshold(variant: InventoryVariant): void {
    this.thresholdPanelValue = variant.inventory?.lowStockThreshold ?? 0;
    this.thresholdPanel.set({ variantId: variant.id, threshold: this.thresholdPanelValue, saving: false });
    this.adjustPanel.set(null);
  }

  closeThreshold(): void {
    this.thresholdPanel.set(null);
  }

  async saveThreshold(variant: InventoryVariant): Promise<void> {
    const panel = this.thresholdPanel();
    if (!panel) return;
    this.thresholdPanel.set({ ...panel, saving: true });
    try {
      await this.vendorService.setLowStockThreshold(variant.id, this.thresholdPanelValue);
      await this.fetchInventory(this.meta().page, this.searchQuery());
      await this.fetchLowStock();
      this.thresholdPanel.set(null);
    } catch {
      const cur = this.thresholdPanel();
      if (cur) this.thresholdPanel.set({ ...cur, saving: false });
    }
  }

  // ---- Helpers ----

  available(variant: InventoryVariant): number {
    return (variant.inventory?.qtyOnHand ?? 0) - (variant.inventory?.qtyReserved ?? 0);
  }

  statusLabel(variant: InventoryVariant): string {
    const avail = this.available(variant);
    const threshold = variant.inventory?.lowStockThreshold ?? 0;
    if (avail <= 0) return 'Out of Stock';
    if (threshold > 0 && avail <= threshold) return 'Low Stock';
    return 'OK';
  }

  statusClass(variant: InventoryVariant): string {
    const label = this.statusLabel(variant);
    if (label === 'Out of Stock') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
    if (label === 'Low Stock') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
  }

  formatAttributes(attrs: Record<string, string>): string {
    return Object.entries(attrs)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
}

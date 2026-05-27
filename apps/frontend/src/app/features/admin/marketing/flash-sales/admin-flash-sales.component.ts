import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';
import { CurrencyInrPipe } from '../../../../shared/pipes/currency-inr.pipe';

const BASE = `${environment.apiUrl}/api/v1/admin/flash-sales`;

interface FsItem {
  id: number; flashSaleId: number;
  productId: number; variantId: number | null;
  salePrice: number; originalPrice: number;
  stockLimit: number | null; sold: number;
  product?: { id: number; name: string; slug: string; basePrice: number };
  variant?: { id: number; sku: string } | null;
}
interface FlashSale {
  id: number; name: string; description: string | null; bannerImage: string | null;
  startAt: string; endAt: string; isActive: boolean; maxPerUser: number | null;
  items: FsItem[];
}

function toLocal(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

@Component({
  selector: 'lg-admin-flash-sales',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, CurrencyInrPipe, DatePipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-text-primary">Flash Sales</h1>
      <p class="text-sm text-text-muted mt-0.5">Time-limited sales with capped stock and deep discounts</p>
    </div>
    <button (click)="openCreate()"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold">
      <mat-icon class="text-base">add</mat-icon> New Flash Sale
    </button>
  </div>

  <!-- List -->
  @if (loading()) {
    <div class="space-y-3">
      @for (i of [1,2,3]; track i) {
        <div class="h-24 rounded-2xl bg-surface-50 animate-pulse"></div>
      }
    </div>
  } @else if (sales().length === 0) {
    <div class="text-center py-16 text-text-muted">
      <mat-icon class="text-5xl">flash_on</mat-icon>
      <p class="mt-2">No flash sales yet</p>
    </div>
  } @else {
    <div class="space-y-3">
      @for (s of sales(); track s.id) {
        <div class="rounded-2xl border border-border-default bg-bg-base p-5">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h2 class="font-semibold text-text-primary">{{ s.name }}</h2>
                @if (isLive(s)) {
                  <span class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span> LIVE
                  </span>
                } @else if (isUpcoming(s)) {
                  <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">Upcoming</span>
                } @else {
                  <span class="px-2 py-0.5 rounded-full bg-surface-50 text-text-muted text-xs font-semibold">Ended</span>
                }
                @if (!s.isActive) {
                  <span class="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs">Disabled</span>
                }
              </div>
              <p class="text-xs text-text-muted mt-1">
                {{ s.startAt | date:'dd MMM yyyy, HH:mm' }} → {{ s.endAt | date:'dd MMM yyyy, HH:mm' }}
              </p>
              <p class="text-xs text-text-secondary mt-1">{{ s.items.length }} product(s)</p>
            </div>
            <div class="flex gap-2">
              <button (click)="openEdit(s)"
                      class="p-2 rounded-lg hover:bg-surface-50 text-text-muted hover:text-primary-600">
                <mat-icon class="text-base">edit</mat-icon>
              </button>
              <button (click)="deleteSale(s.id)"
                      class="p-2 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600">
                <mat-icon class="text-base">delete</mat-icon>
              </button>
            </div>
          </div>

          <!-- Items -->
          @if (s.items.length > 0) {
            <div class="mt-4 flex flex-wrap gap-2">
              @for (item of s.items; track item.id) {
                <div class="flex items-center gap-2 border border-border-default rounded-xl px-3 py-2 text-xs bg-surface-50">
                  <span class="font-medium text-text-primary">{{ item.product?.name }}</span>
                  <span class="text-green-600 font-semibold">{{ item.salePrice | currencyInr }}</span>
                  <span class="line-through text-text-muted">{{ item.originalPrice | currencyInr }}</span>
                  @if (item.stockLimit) {
                    <span class="text-text-muted">{{ item.sold }}/{{ item.stockLimit }}</span>
                  }
                  <button (click)="removeItem(s, item)"
                          class="text-text-muted hover:text-red-500 ml-1">
                    <mat-icon class="text-sm">close</mat-icon>
                  </button>
                </div>
              }
            </div>
          }

          <!-- Add item -->
          <div class="mt-3 flex flex-wrap gap-2 items-end">
            <div>
              <label class="text-xs text-text-muted block mb-1">Product ID</label>
              <input type="number" [(ngModel)]="newItem[s.id].productId" placeholder="Product ID"
                     class="border border-border-default rounded-xl px-3 py-1.5 text-sm bg-bg-base w-28 focus:outline-none" />
            </div>
            <div>
              <label class="text-xs text-text-muted block mb-1">Sale Price</label>
              <input type="number" [(ngModel)]="newItem[s.id].salePrice" placeholder="Sale ₹"
                     class="border border-border-default rounded-xl px-3 py-1.5 text-sm bg-bg-base w-28 focus:outline-none" />
            </div>
            <div>
              <label class="text-xs text-text-muted block mb-1">Original Price</label>
              <input type="number" [(ngModel)]="newItem[s.id].originalPrice" placeholder="Orig ₹"
                     class="border border-border-default rounded-xl px-3 py-1.5 text-sm bg-bg-base w-28 focus:outline-none" />
            </div>
            <div>
              <label class="text-xs text-text-muted block mb-1">Stock Cap</label>
              <input type="number" [(ngModel)]="newItem[s.id].stockLimit" placeholder="∞"
                     class="border border-border-default rounded-xl px-3 py-1.5 text-sm bg-bg-base w-24 focus:outline-none" />
            </div>
            <button (click)="addItem(s)"
                    class="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-medium mb-px">
              + Add Item
            </button>
          </div>
        </div>
      }
    </div>
  }
</div>

<!-- Create / Edit Modal -->
@if (showForm()) {
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
    <div class="bg-bg-base rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-bold text-text-primary">{{ editing() ? 'Edit Flash Sale' : 'New Flash Sale' }}</h2>
        <button (click)="closeForm()" class="p-1 rounded-lg hover:bg-surface-50">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <label class="text-xs text-text-muted block mb-1">Name *</label>
          <input [(ngModel)]="form.name" placeholder="Summer Flash Sale"
                 class="w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-bg-base focus:outline-none focus:ring-2 focus:ring-primary-300" />
        </div>
        <div>
          <label class="text-xs text-text-muted block mb-1">Description</label>
          <textarea [(ngModel)]="form.description" rows="2"
                    class="w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-bg-base focus:outline-none resize-none"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-text-muted block mb-1">Start *</label>
            <input type="datetime-local" [(ngModel)]="form.startAt"
                   class="w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-bg-base focus:outline-none" />
          </div>
          <div>
            <label class="text-xs text-text-muted block mb-1">End *</label>
            <input type="datetime-local" [(ngModel)]="form.endAt"
                   class="w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-bg-base focus:outline-none" />
          </div>
        </div>
        <div>
          <label class="text-xs text-text-muted block mb-1">Max per user (leave blank for unlimited)</label>
          <input type="number" [(ngModel)]="form.maxPerUser" placeholder="e.g. 2"
                 class="w-full border border-border-default rounded-xl px-3 py-2 text-sm bg-bg-base focus:outline-none" />
        </div>
        <label class="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" [(ngModel)]="form.isActive" class="rounded" />
          Active
        </label>
      </div>

      @if (formError()) {
        <p class="text-xs text-red-500">{{ formError() }}</p>
      }

      <div class="flex gap-3 justify-end pt-1">
        <button (click)="closeForm()"
                class="px-4 py-2 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-surface-50">
          Cancel
        </button>
        <button (click)="save()" [disabled]="saving()"
                class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
          {{ saving() ? 'Saving…' : (editing() ? 'Update' : 'Create') }}
        </button>
      </div>
    </div>
  </div>
}
  `,
})
export class AdminFlashSalesComponent implements OnInit {
  readonly #http = inject(HttpClient);

  sales   = signal<FlashSale[]>([]);
  loading = signal(false);

  showForm = signal(false);
  editing  = signal<FlashSale | null>(null);
  saving   = signal(false);
  formError = signal('');

  form = { name: '', description: '', startAt: '', endAt: '', isActive: true, maxPerUser: '' as number | string };

  // per-sale new-item form state (keyed by sale id)
  newItem: Record<number, { productId: number | null; salePrice: number | null; originalPrice: number | null; stockLimit: number | null }> = {};

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.#http.get<{ success: boolean; data: FlashSale[] }>(BASE).subscribe({
      next: r => {
        this.sales.set(r.data ?? []);
        r.data?.forEach(s => { if (!this.newItem[s.id]) this.resetItemForm(s.id); });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isLive(s: FlashSale): boolean {
    const now = Date.now();
    return s.isActive && new Date(s.startAt).getTime() <= now && new Date(s.endAt).getTime() > now;
  }
  isUpcoming(s: FlashSale): boolean {
    return s.isActive && new Date(s.startAt).getTime() > Date.now();
  }

  openCreate() {
    this.editing.set(null);
    this.form = { name: '', description: '', startAt: '', endAt: '', isActive: true, maxPerUser: '' };
    this.formError.set('');
    this.showForm.set(true);
  }

  openEdit(s: FlashSale) {
    this.editing.set(s);
    this.form = {
      name: s.name, description: s.description ?? '',
      startAt: toLocal(s.startAt), endAt: toLocal(s.endAt),
      isActive: s.isActive, maxPerUser: s.maxPerUser ?? '',
    };
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  save() {
    if (!this.form.name || !this.form.startAt || !this.form.endAt) {
      this.formError.set('Name, start and end are required.'); return;
    }
    this.saving.set(true);
    const payload = {
      ...this.form,
      maxPerUser: this.form.maxPerUser !== '' ? Number(this.form.maxPerUser) : null,
      startAt: new Date(this.form.startAt).toISOString(),
      endAt:   new Date(this.form.endAt).toISOString(),
    };
    const req = this.editing()
      ? this.#http.patch<{ success: boolean; data: FlashSale }>(`${BASE}/${this.editing()!.id}`, payload)
      : this.#http.post<{ success: boolean; data: FlashSale }>(BASE, payload);

    req.subscribe({
      next: r => {
        this.saving.set(false);
        this.showForm.set(false);
        if (this.editing()) {
          this.sales.update(list => list.map(s => s.id === r.data.id ? r.data : s));
        } else {
          this.sales.update(list => [r.data, ...list]);
          this.resetItemForm(r.data.id);
        }
      },
      error: e => { this.formError.set(e.error?.message ?? 'Error'); this.saving.set(false); },
    });
  }

  deleteSale(id: number) {
    if (!confirm('Delete this flash sale?')) return;
    this.#http.delete(`${BASE}/${id}`).subscribe({
      next: () => this.sales.update(list => list.filter(s => s.id !== id)),
    });
  }

  addItem(sale: FlashSale) {
    const f = this.newItem[sale.id];
    if (!f.productId || !f.salePrice || !f.originalPrice) return;
    this.#http.post<{ success: boolean; data: FsItem }>(`${BASE}/${sale.id}/items`, {
      productId:     f.productId,
      salePrice:     f.salePrice,
      originalPrice: f.originalPrice,
      stockLimit:    f.stockLimit ?? null,
    }).subscribe({
      next: r => {
        this.sales.update(list => list.map(s =>
          s.id === sale.id ? { ...s, items: [...s.items.filter(i => i.id !== r.data.id), r.data] } : s
        ));
        this.resetItemForm(sale.id);
      },
    });
  }

  removeItem(sale: FlashSale, item: FsItem) {
    this.#http.delete(`${BASE}/${sale.id}/items/${item.id}`).subscribe({
      next: () => this.sales.update(list =>
        list.map(s => s.id === sale.id ? { ...s, items: s.items.filter(i => i.id !== item.id) } : s)
      ),
    });
  }

  private resetItemForm(saleId: number) {
    this.newItem[saleId] = { productId: null, salePrice: null, originalPrice: null, stockLimit: null };
  }
}

import {
  Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FlashSalesService, FlashSale } from '../../../core/services/flash-sales.service';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';

interface Countdown { h: string; m: string; s: string; }

@Component({
  selector: 'lg-flash-sale-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe],
  template: `
@if (sale()) {
  <div class="bg-gradient-to-r from-red-600 to-orange-500 text-white">
    <div class="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">

      <!-- Left: label + name -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5">
          <mat-icon class="text-base animate-bounce">flash_on</mat-icon>
          <span class="text-xs font-bold uppercase tracking-wide">Flash Sale</span>
        </div>
        <span class="font-semibold text-sm">{{ sale()!.name }}</span>
      </div>

      <!-- Centre: countdown -->
      <div class="flex items-center gap-1.5 text-center">
        <span class="text-xs opacity-75 mr-1">Ends in</span>
        @for (unit of countdown(); track unit.label) {
          <div class="bg-white/20 rounded-lg px-2.5 py-1 min-w-[2.5rem]">
            <p class="text-lg font-bold leading-none">{{ unit.value }}</p>
            <p class="text-[10px] opacity-75 mt-0.5">{{ unit.label }}</p>
          </div>
          @if (!$last) { <span class="text-lg font-bold opacity-60">:</span> }
        }
      </div>

      <!-- Right: products strip -->
      <div class="flex items-center gap-2 flex-wrap">
        @for (item of sale()!.items.slice(0, 3); track item.id) {
          <a [routerLink]="['/products', item.product?.slug]"
             class="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-1.5 text-xs transition-colors">
            <span class="font-medium">{{ item.product?.name }}</span>
            <span class="font-bold">{{ item.salePrice | currencyInr }}</span>
            <span class="line-through opacity-60">{{ item.originalPrice | currencyInr }}</span>
          </a>
        }
        @if (sale()!.items.length > 3) {
          <span class="text-xs opacity-75">+{{ sale()!.items.length - 3 }} more</span>
        }
      </div>
    </div>
  </div>
}
  `,
})
export class FlashSaleBannerComponent implements OnInit, OnDestroy {
  readonly #fs = inject(FlashSalesService);

  sale = computed(() => this.#fs.activeSale());

  // Reactive countdown [{ label, value }]
  readonly #tick = signal(0);
  readonly countdown = computed(() => {
    void this.#tick(); // reactive dependency
    const s = this.sale();
    if (!s) return [];
    const ms = Math.max(0, new Date(s.endAt).getTime() - Date.now());
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const sec = totalSec % 60;
    return [
      { label: 'HRS',  value: String(h).padStart(2, '0') },
      { label: 'MIN',  value: String(m).padStart(2, '0') },
      { label: 'SEC',  value: String(sec).padStart(2, '0') },
    ];
  });

  #interval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.#fs.load();
    this.#interval = setInterval(() => this.#tick.update(t => t + 1), 1000);
  }
  ngOnDestroy() { clearInterval(this.#interval); }
}

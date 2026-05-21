import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  #count = signal(0);
  readonly isLoading = computed(() => this.#count() > 0);

  increment(): void { this.#count.update(n => n + 1); }
  decrement(): void { this.#count.update(n => Math.max(0, n - 1)); }
}

import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc        = inject(DOCUMENT);
  private readonly isBrowser  = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<Theme>(this.#loadSaved());

  constructor() {
    effect(() => {
      const t = this.theme();
      this.doc.documentElement.classList.toggle('dark', t === 'dark');
      if (this.isBrowser) {
        localStorage.setItem('lagaao_theme', t);
      }
    });
  }

  toggle(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  set(t: Theme): void {
    this.theme.set(t);
  }

  #loadSaved(): Theme {
    if (!this.isBrowser) return 'light';
    const saved = localStorage.getItem('lagaao_theme') as Theme | null;
    if (saved) return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

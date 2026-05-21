import { Injectable, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);

  readonly theme = signal<Theme>(this.#loadSaved());

  constructor() {
    effect(() => {
      const t = this.theme();
      const html = this.doc.documentElement;
      html.classList.toggle('dark', t === 'dark');
      localStorage.setItem('lagaao_theme', t);
    });
  }

  toggle(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  set(t: Theme): void {
    this.theme.set(t);
  }

  #loadSaved(): Theme {
    if (typeof localStorage === 'undefined') return 'light';
    const saved = localStorage.getItem('lagaao_theme') as Theme | null;
    if (saved) return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

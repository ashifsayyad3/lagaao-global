import {
  Injectable, signal, computed, effect, inject, PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Theme     = 'light' | 'dark';   // resolved, actual applied

const STORAGE_KEY = 'lagaao_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly #doc       = inject(DOCUMENT);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // ── Mode preference (what user chose: light / dark / system) ──
  readonly mode = signal<ThemeMode>(this.#loadSavedMode());

  // ── Effective theme (resolved: what is actually rendered) ──────
  readonly theme = computed<Theme>(() => {
    const m = this.mode();
    if (m !== 'system') return m;
    return this.#systemPreference();
  });

  // ── System OS dark preference ─────────────────────────────────
  readonly #systemPreference = signal<Theme>(this.#detectSystem());

  constructor() {
    // Apply dark class whenever effective theme changes
    effect(() => {
      const dark = this.theme() === 'dark';
      this.#doc.documentElement.classList.toggle('dark', dark);
      this.#doc.documentElement.setAttribute('data-theme', this.theme());
    });

    // Persist mode to localStorage
    effect(() => {
      if (this.#isBrowser) {
        localStorage.setItem(STORAGE_KEY, this.mode());
      }
    });

    // Listen for OS preference changes (for system mode)
    if (this.#isBrowser) {
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', e => {
          this.#systemPreference.set(e.matches ? 'dark' : 'light');
        });
    }
  }

  // ── Public API ─────────────────────────────────────────────────

  /** Set a specific mode: 'light' | 'dark' | 'system' */
  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  /** Toggle between light ↔ dark (ignores system, sets explicit) */
  toggle(): void {
    this.mode.update(m => {
      const current = m === 'system' ? this.#detectSystem() : m;
      return current === 'light' ? 'dark' : 'light';
    });
  }

  /** @deprecated use setMode() — kept for backward compat */
  set(t: Theme): void {
    this.mode.set(t);
  }

  readonly isDark  = computed(() => this.theme() === 'dark');
  readonly isLight = computed(() => this.theme() === 'light');

  // ── Private helpers ────────────────────────────────────────────

  #detectSystem(): Theme {
    if (!this.#isBrowser) return 'light';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  #loadSavedMode(): ThemeMode {
    if (!this.#isBrowser) return 'system';
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system'; // default: follow OS
  }
}

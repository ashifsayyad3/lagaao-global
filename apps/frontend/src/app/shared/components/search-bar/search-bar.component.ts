import {
  Component, ChangeDetectionStrategy, inject, signal, output, Input,
  ElementRef, HostListener, OnInit, OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'lg-search-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, RouterLink],
  styles: [`
    :host { display: block; width: 100%; }

    .search-wrap { position: relative; width: 100%; }

    /* ── Main pill ─────────────────────────────────────────────── */
    .search-field {
      display: flex;
      align-items: center;
      height: 48px;
      border-radius: 9999px;
      background: rgba(255,255,255,.97);
      border: 2px solid transparent;
      box-shadow: 0 4px 20px rgba(61,107,69,.15), 0 1px 4px rgba(61,107,69,.08);
      overflow: hidden;
      transition: border-color 220ms ease, box-shadow 220ms ease, background 220ms ease;
    }
    .search-field:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 4px 28px rgba(61,107,69,.28), 0 0 0 4px rgba(61,107,69,.08);
      background: #fff;
    }

    /* ── Leaf icon prefix ─────────────────────────────────────── */
    .search-prefix {
      padding: 0 4px 0 16px;
      display: flex;
      align-items: center;
      color: var(--color-sage);
      flex-shrink: 0;
    }

    /* ── Text input ───────────────────────────────────────────── */
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      padding: 0 8px;
      font-family: var(--font-sans);
      font-size: .9375rem;
      font-weight: 500;
      color: var(--text-primary);
      height: 100%;
      min-width: 0;
    }
    .search-input::placeholder {
      color: var(--text-muted);
      font-weight: 400;
    }

    /* ── Clear button ─────────────────────────────────────────── */
    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0 6px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      border-radius: 50%;
      transition: color 120ms, background 120ms;
      width: 28px; height: 28px;
      justify-content: center;
    }
    .clear-btn:hover { color: var(--text-primary); background: var(--bg-subtle); }

    /* ── Search CTA button ───────────────────────────────────── */
    .search-btn {
      height: calc(100% - 8px);
      margin: 4px 4px 4px 0;
      padding: 0 20px;
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border-radius: 9999px;
      transition: filter 150ms ease, transform 150ms ease;
      color: #fff;
      font-family: var(--font-sans);
      font-size: .875rem;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .search-btn:hover { filter: brightness(1.08); transform: scale(1.02); }
    .search-btn .btn-label { display: none; }
    @media (min-width: 640px) { .search-btn .btn-label { display: inline; } }

    /* ── Quick-filter chips below bar ────────────────────────── */
    .quick-chips {
      display: flex;
      gap: 6px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 28px;
      padding: 0 12px;
      border-radius: 9999px;
      background: rgba(255,255,255,.75);
      border: 1px solid rgba(255,255,255,.6);
      font-size: .75rem;
      font-weight: 600;
      color: var(--color-primary-dark);
      cursor: pointer;
      transition: background 150ms, border-color 150ms, transform 150ms;
      backdrop-filter: blur(4px);
      text-decoration: none;
      white-space: nowrap;
    }
    .chip:hover {
      background: rgba(255,255,255,.95);
      border-color: var(--color-primary-200);
      transform: translateY(-1px);
    }

    /* ── Dropdown ─────────────────────────────────────────────── */
    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0; right: 0;
      background: #fff;
      border: 1.5px solid var(--border-default);
      border-radius: 20px;
      box-shadow: 0 12px 40px rgba(30,45,34,.14), 0 2px 8px rgba(30,45,34,.06);
      overflow: hidden;
      z-index: 300;
      max-height: 400px;
      overflow-y: auto;
      animation: dd-appear .15s cubic-bezier(.16,1,.3,1);
    }
    @keyframes dd-appear {
      from { opacity:0; transform:translateY(-6px) scale(.98); }
      to   { opacity:1; transform:translateY(0)   scale(1); }
    }

    .dd-header {
      padding: 12px 16px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-default);
    }
    .dd-section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .dd-clear-btn {
      font-size: 11px;
      color: var(--color-primary);
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 600;
      padding: 0;
    }

    .dd-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border: none;
      background: none;
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: .875rem;
      color: var(--text-secondary);
      text-align: left;
      transition: background 100ms ease;
    }
    .dd-item:hover, .dd-item.focused {
      background: var(--color-primary-50);
      color: var(--text-primary);
    }

    .dd-avatar {
      width: 32px; height: 32px;
      border-radius: 10px;
      background: var(--color-primary-100);
      display: flex; align-items: center; justify-content: center;
      font-size: 15px;
      flex-shrink: 0;
    }
    .dd-avatar-icon {
      width: 32px; height: 32px;
      border-radius: 10px;
      background: var(--bg-subtle);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .dd-icon {
      font-size: 15px !important;
      width: 15px !important;
      height: 15px !important;
      color: var(--text-muted);
    }
    .dd-icon-trend { color: var(--color-accent); }

    .dd-text { flex: 1; min-width: 0; }
    .dd-text-main { font-weight: 500; }
    .dd-text-sub { font-size: .75rem; color: var(--text-muted); }

    .dd-divider { height: 1px; background: var(--border-default); margin: 4px 0; }
    .dd-footer {
      padding: 10px 16px;
      font-size: 11.5px;
      color: var(--text-muted);
      text-align: center;
      background: var(--bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
  `],
  template: `
    <div class="search-wrap" #container>

      <!-- ── Search pill ──────────────────────────────────────── -->
      <div class="search-field">
        <span class="search-prefix">
          <mat-icon style="font-size:20px;width:20px;height:20px">eco</mat-icon>
        </span>

        <input
          class="search-input"
          [ngModel]="query()"
          (ngModelChange)="onQueryChange($event)"
          (keydown.enter)="submitSearch()"
          (keydown.arrowDown)="moveFocus(1)"
          (keydown.arrowUp)="moveFocus(-1)"
          (keydown.escape)="closeDropdown()"
          (focus)="onFocus()"
          placeholder="Search plants, seeds, pots, care…"
          autocomplete="off"
          spellcheck="false"
          aria-label="Search"
        />

        @if (query().length > 0) {
          <button class="clear-btn" (click)="clear()" aria-label="Clear">
            <mat-icon class="dd-icon" style="font-size:14px;width:14px;height:14px">close</mat-icon>
          </button>
        }

        <button class="search-btn" (click)="submitSearch()" aria-label="Search">
          <mat-icon style="font-size:18px;width:18px;height:18px">search</mat-icon>
          <span class="btn-label">Search</span>
        </button>
      </div>

      <!-- ── Quick-filter chips ───────────────────────────────── -->
      @if (showChips) {
        <div class="quick-chips">
          @for (chip of quickChips; track chip.label) {
            <a class="chip" [routerLink]="['/products']" [queryParams]="{ category: chip.slug }">
              {{ chip.emoji }} {{ chip.label }}
            </a>
          }
        </div>
      }

      <!-- ── Dropdown ─────────────────────────────────────────── -->
      @if (showDropdown()) {
        <div class="dropdown">

          @if (suggestions().length > 0) {
            <div style="padding:8px 0 0">
              <div class="dd-section-label" style="padding:8px 16px 4px">Suggestions</div>
              @for (s of suggestions(); track s; let i = $index) {
                <button class="dd-item" [class.focused]="focusIndex() === i" (click)="selectSuggestion(s)">
                  <span class="dd-avatar-icon">
                    <mat-icon class="dd-icon">search</mat-icon>
                  </span>
                  <span class="dd-text">
                    <span class="dd-text-main" [innerHTML]="highlight(s)"></span>
                  </span>
                </button>
              }
            </div>
          }

          @if (query().length === 0 && searchSvc.recentSearches().length > 0) {
            <div>
              <div class="dd-header">
                <span class="dd-section-label">Recent Searches</span>
                <button class="dd-clear-btn" (click)="searchSvc.clearRecent()">Clear all</button>
              </div>
              @for (r of searchSvc.recentSearches(); track r) {
                <button class="dd-item" (click)="selectSuggestion(r)">
                  <span class="dd-avatar-icon">
                    <mat-icon class="dd-icon">history</mat-icon>
                  </span>
                  <span class="dd-text dd-text-main">{{ r }}</span>
                </button>
              }
            </div>
          }

          @if (query().length === 0 && searchSvc.recentSearches().length === 0) {
            <div>
              <div class="dd-section-label" style="padding:12px 16px 6px">Popular Searches</div>
              @for (t of trendingItems(); track t.label) {
                <button class="dd-item" (click)="selectSuggestion(t.label)">
                  <span class="dd-avatar" style="font-size:15px">{{ t.emoji }}</span>
                  <span class="dd-text">
                    <div class="dd-text-main">{{ t.label }}</div>
                    <div class="dd-text-sub">{{ t.sub }}</div>
                  </span>
                  <mat-icon class="dd-icon dd-icon-trend" style="font-size:13px;width:13px;height:13px">trending_up</mat-icon>
                </button>
              }
            </div>
          }

          <div class="dd-divider"></div>
          <div class="dd-footer">
            <mat-icon style="font-size:13px;width:13px;height:13px;color:var(--color-sage)">keyboard_return</mat-icon>
            Press Enter to see all results
          </div>
        </div>
      }
    </div>
  `,
})
export class SearchBarComponent implements OnInit, OnDestroy {
  readonly searchSvc = inject(SearchService);
  readonly #router   = inject(Router);
  readonly #el       = inject(ElementRef);

  readonly closed = output<void>();

  /** Show quick-filter chips below the bar (opt-in via host) */
  @Input() showChips = false;

  readonly query        = signal('');
  readonly suggestions  = signal<string[]>([]);
  readonly trending     = signal<string[]>([]);
  readonly showDropdown = signal(false);
  readonly focusIndex   = signal(-1);
  readonly loading      = signal(false);

  readonly quickChips = [
    { label: 'Indoor Plants', emoji: '🪴', slug: 'indoor-plants'   },
    { label: 'Succulents',    emoji: '🌵', slug: 'succulents'       },
    { label: 'Flowering',     emoji: '🌸', slug: 'flowering-plants' },
    { label: 'Medicinal',     emoji: '🌿', slug: 'medicinal'        },
    { label: 'Fruit Plants',  emoji: '🍋', slug: 'fruit-plants'     },
    { label: 'Seeds',         emoji: '🌱', slug: 'seeds'            },
  ];

  readonly trendingItems = signal([
    { emoji: '🪴', label: 'Money Plant',       sub: '2,800+ reviews'  },
    { emoji: '🌵', label: 'Aloe Vera',         sub: '5,600+ reviews'  },
    { emoji: '🌿', label: 'Tulsi',             sub: '7,800+ reviews'  },
    { emoji: '🌱', label: 'Monstera',          sub: '3,700+ reviews'  },
    { emoji: '🌸', label: 'Mogra Jasmine',     sub: '3,200+ reviews'  },
    { emoji: '🍋', label: 'Dwarf Lemon Tree',  sub: '2,300+ reviews'  },
  ]);

  readonly #query$ = new Subject<string>();
  #subs: Subscription[] = [];

  ngOnInit(): void {
    this.#subs.push(
      this.#query$.pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap(q => {
          if (q.length < 2) { this.suggestions.set([]); return of(null); }
          this.loading.set(true);
          return this.searchSvc.suggest(q).pipe(catchError(() => of(null)));
        }),
      ).subscribe(res => {
        this.loading.set(false);
        if (res) this.suggestions.set(res.data?.suggestions ?? []);
      }),
    );

    this.searchSvc.trending().pipe(catchError(() => of(null))).subscribe(res => {
      if (res) this.trending.set(res.data?.trending ?? []);
    });
  }

  ngOnDestroy(): void {
    this.#subs.forEach(s => s.unsubscribe());
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.#el.nativeElement.contains(e.target)) this.closeDropdown();
  }

  onQueryChange(q: string): void {
    this.query.set(q);
    this.focusIndex.set(-1);
    this.#query$.next(q);
    if (!this.showDropdown()) this.showDropdown.set(true);
  }

  onFocus(): void {
    this.showDropdown.set(true);
  }

  moveFocus(dir: 1 | -1): void {
    const max = this.suggestions().length - 1;
    const cur = this.focusIndex();
    const next = Math.max(-1, Math.min(max, cur + dir));
    this.focusIndex.set(next);
    if (next >= 0) this.query.set(this.suggestions()[next]);
  }

  selectSuggestion(s: string): void {
    this.query.set(s);
    this.closeDropdown();
    this.navigate(s);
  }

  submitSearch(): void {
    const q = this.query().trim();
    if (!q) return;
    this.closeDropdown();
    this.navigate(q);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
    this.focusIndex.set(-1);
  }

  clear(): void {
    this.query.set('');
    this.suggestions.set([]);
    this.focusIndex.set(-1);
  }

  highlight(text: string): string {
    const q = this.query();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\\\]{}()*+?.^$|]/g, '\\$&');
    return text.replace(
      new RegExp(`(${escaped})`, 'gi'),
      '<mark style="background:var(--color-primary-100);color:var(--color-primary-dark);border-radius:3px;padding:0 1px">$1</mark>'
    );
  }

  private navigate(q: string): void {
    this.searchSvc.saveRecent(q);
    this.#router.navigate(['/search'], { queryParams: { q } });
    this.closed.emit();
  }
}

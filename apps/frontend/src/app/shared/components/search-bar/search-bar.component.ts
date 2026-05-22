import {
  Component, ChangeDetectionStrategy, inject, signal, output,
  ElementRef, HostListener, OnInit, OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { SearchService } from '../../../core/services/search.service';

@Component({
  selector: 'lg-search-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule],
  styles: [`
    :host { display: block; width: 100%; }

    .search-wrap {
      position: relative;
      width: 100%;
    }

    .search-field {
      display: flex;
      align-items: center;
      height: 42px;
      border-radius: 9999px;
      background: rgba(255,255,255,.95);
      border: 1.5px solid transparent;
      box-shadow: 0 2px 8px rgba(61,107,69,.12);
      overflow: hidden;
      transition: border-color 200ms ease, box-shadow 200ms ease;
    }
    .search-field:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 2px 16px rgba(61,107,69,.2);
      background: #fff;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      padding: 0 14px 0 18px;
      font-family: var(--font-sans);
      font-size: .875rem;
      color: var(--text-primary);
      height: 100%;
    }
    .search-input::placeholder { color: var(--text-muted); }

    .clear-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0 6px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      transition: color 150ms ease;
    }
    .clear-btn:hover { color: var(--text-primary); }

    .search-btn {
      height: 100%;
      padding: 0 16px;
      background: var(--color-primary);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0 9999px 9999px 0;
      transition: background 150ms ease;
    }
    .search-btn:hover { background: var(--color-primary-dark); }

    .dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0; right: 0;
      background: #fff;
      border: 1px solid var(--border-default);
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      z-index: 300;
      max-height: 380px;
      overflow-y: auto;
    }

    .dd-section-label {
      padding: 10px 16px 4px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .dd-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border: none;
      background: none;
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: .875rem;
      color: var(--text-secondary);
      text-align: left;
      transition: background 120ms ease;
    }
    .dd-item:hover, .dd-item.focused { background: var(--bg-subtle); }

    .dd-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      flex-shrink: 0;
      color: var(--text-muted);
    }
    .dd-icon-trend { color: var(--color-accent); }

    .dd-divider { height: 1px; background: var(--border-default); margin: 4px 0; }

    .dd-footer {
      padding: 8px 16px;
      font-size: 11px;
      color: var(--text-muted);
      text-align: center;
    }
  `],
  template: `
    <div class="search-wrap" #container>
      <div class="search-field">
        <input
          class="search-input"
          [(ngModel)]="query"
          (ngModelChange)="onQueryChange($event)"
          (keydown.enter)="submitSearch()"
          (keydown.arrowDown)="moveFocus(1)"
          (keydown.arrowUp)="moveFocus(-1)"
          (keydown.escape)="closeDropdown()"
          (focus)="onFocus()"
          placeholder="Search plants, seeds, pots…"
          autocomplete="off"
          spellcheck="false"
        />

        @if (query.length > 0) {
          <button class="clear-btn" (click)="clear()">
            <mat-icon class="dd-icon">close</mat-icon>
          </button>
        }

        <button class="search-btn" (click)="submitSearch()">
          <mat-icon style="font-size:20px;width:20px;height:20px;color:#fff">search</mat-icon>
        </button>
      </div>

      @if (showDropdown()) {
        <div class="dropdown">

          @if (suggestions().length > 0) {
            <div class="dd-section-label">Suggestions</div>
            @for (s of suggestions(); track s; let i = $index) {
              <button
                class="dd-item"
                [class.focused]="focusIndex() === i"
                (click)="selectSuggestion(s)"
              >
                <mat-icon class="dd-icon">search</mat-icon>
                <span [innerHTML]="highlight(s)"></span>
              </button>
            }
          }

          @if (query.length === 0 && searchSvc.recentSearches().length > 0) {
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px 4px">
                <span class="dd-section-label" style="padding:0">Recent Searches</span>
                <button
                  style="font-size:11px;color:var(--color-primary);background:none;border:none;cursor:pointer"
                  (click)="searchSvc.clearRecent()"
                >Clear</button>
              </div>
              @for (r of searchSvc.recentSearches(); track r) {
                <button class="dd-item" (click)="selectSuggestion(r)">
                  <mat-icon class="dd-icon">history</mat-icon>
                  {{ r }}
                </button>
              }
            </div>
          }

          @if (query.length === 0 && searchSvc.recentSearches().length === 0 && trending().length > 0) {
            <div>
              <div class="dd-section-label">Trending</div>
              @for (t of trending(); track t) {
                <button class="dd-item" (click)="selectSuggestion(t)">
                  <mat-icon class="dd-icon dd-icon-trend">trending_up</mat-icon>
                  {{ t }}
                </button>
              }
            </div>
          }

          <div class="dd-divider"></div>
          <p class="dd-footer">Press Enter to search all results</p>
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

  query        = '';
  readonly suggestions  = signal<string[]>([]);
  readonly trending     = signal<string[]>([]);
  readonly showDropdown = signal(false);
  readonly focusIndex   = signal(-1);
  readonly loading      = signal(false);

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
    if (next >= 0) this.query = this.suggestions()[next];
  }

  selectSuggestion(s: string): void {
    this.query = s;
    this.closeDropdown();
    this.navigate(s);
  }

  submitSearch(): void {
    if (!this.query.trim()) return;
    this.closeDropdown();
    this.navigate(this.query.trim());
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
    this.focusIndex.set(-1);
  }

  clear(): void {
    this.query = '';
    this.suggestions.set([]);
    this.focusIndex.set(-1);
  }

  highlight(text: string): string {
    if (!this.query) return text;
    const escaped = this.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

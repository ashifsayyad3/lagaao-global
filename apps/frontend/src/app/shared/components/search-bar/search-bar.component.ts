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
  template: `
    <div class="relative w-full" #container>
      <div class="flex items-center gap-2 h-10 px-3 rounded-xl border border-border-default
                  bg-surface-50 focus-within:border-primary-400 focus-within:ring-2
                  focus-within:ring-primary-100 transition-all">
        <mat-icon class="!text-lg text-text-muted flex-shrink-0">search</mat-icon>
        <input
          [(ngModel)]="query"
          (ngModelChange)="onQueryChange($event)"
          (keydown.enter)="submitSearch()"
          (keydown.arrowDown)="moveFocus(1)"
          (keydown.arrowUp)="moveFocus(-1)"
          (keydown.escape)="closeDropdown()"
          (focus)="onFocus()"
          placeholder="Search products, brands, categories…"
          class="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
          autocomplete="off"
          spellcheck="false"
        />
        @if (query.length > 0) {
          <button (click)="clear()" class="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors">
            <mat-icon class="!text-base">close</mat-icon>
          </button>
        }
      </div>

      <!-- Dropdown -->
      @if (showDropdown()) {
        <div class="absolute top-full left-0 right-0 mt-1 bg-bg-base border border-border-default
                    rounded-xl shadow-elevation-3 overflow-hidden z-50 max-h-80 overflow-y-auto">

          <!-- Suggestions -->
          @if (suggestions().length > 0) {
            <div class="py-1">
              @for (s of suggestions(); track s; let i = $index) {
                <button
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary
                         hover:bg-surface-100 transition-colors text-left"
                  [class.bg-surface-100]="focusIndex() === i"
                  (click)="selectSuggestion(s)"
                >
                  <mat-icon class="!text-base text-text-muted flex-shrink-0">search</mat-icon>
                  <span [innerHTML]="highlight(s)"></span>
                </button>
              }
            </div>
          }

          <!-- Recent searches (shown when no query) -->
          @if (query.length === 0 && searchSvc.recentSearches().length > 0) {
            <div>
              <div class="flex items-center justify-between px-4 pt-3 pb-1">
                <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Recent</span>
                <button class="text-xs text-primary-600 hover:underline" (click)="searchSvc.clearRecent()">
                  Clear
                </button>
              </div>
              @for (r of searchSvc.recentSearches(); track r) {
                <button
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary
                         hover:bg-surface-100 transition-colors text-left"
                  (click)="selectSuggestion(r)"
                >
                  <mat-icon class="!text-base text-text-muted flex-shrink-0">history</mat-icon>
                  {{ r }}
                </button>
              }
            </div>
          }

          <!-- Trending (shown when no query and no recent) -->
          @if (query.length === 0 && searchSvc.recentSearches().length === 0 && trending().length > 0) {
            <div>
              <div class="px-4 pt-3 pb-1">
                <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Trending</span>
              </div>
              @for (t of trending(); track t) {
                <button
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary
                         hover:bg-surface-100 transition-colors text-left"
                  (click)="selectSuggestion(t)"
                >
                  <mat-icon class="!text-base text-amber-500 flex-shrink-0">trending_up</mat-icon>
                  {{ t }}
                </button>
              }
            </div>
          }
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
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-primary-100 text-primary-700 rounded">$1</mark>');
  }

  private navigate(q: string): void {
    this.searchSvc.saveRecent(q);
    this.#router.navigate(['/search'], { queryParams: { q } });
    this.closed.emit();
  }
}

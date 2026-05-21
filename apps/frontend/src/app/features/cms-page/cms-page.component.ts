import {
  Component, OnInit, signal, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { CmsService, CmsPage } from '../../core/services/cms.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'lg-cms-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, SkeletonComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-10">
      @if (loading()) {
        <div class="space-y-4">
          <lg-skeleton height="32px" width="50%"></lg-skeleton>
          <lg-skeleton height="16px"></lg-skeleton>
          <lg-skeleton height="16px" width="90%"></lg-skeleton>
          <lg-skeleton height="16px" width="75%"></lg-skeleton>
        </div>
      } @else if (!page()) {
        <div class="text-center py-20 text-text-secondary">
          <mat-icon class="!text-5xl !w-12 !h-12 mb-3">error_outline</mat-icon>
          <p class="text-lg font-medium">Page not found</p>
          <a routerLink="/" class="btn-primary mt-4 inline-block">Go home</a>
        </div>
      } @else {
        <h1 class="font-display text-3xl font-bold text-text-primary mb-8">{{ page()!.title }}</h1>
        <div class="prose prose-sm md:prose-base dark:prose-invert max-w-none"
             [innerHTML]="page()!.content"></div>
      }
    </div>
  `,
})
export class CmsPageComponent implements OnInit {
  readonly #cms   = inject(CmsService);
  readonly #route = inject(ActivatedRoute);
  readonly #title = inject(Title);
  readonly #meta  = inject(Meta);

  page    = signal<CmsPage | null>(null);
  loading = signal(true);

  ngOnInit() {
    const slug = this.#route.snapshot.paramMap.get('slug')!;
    this.#cms.getPage(slug).subscribe({
      next: r => {
        this.page.set(r.data);
        this.loading.set(false);
        if (r.data.metaTitle) this.#title.setTitle(r.data.metaTitle);
        if (r.data.metaDescription) {
          this.#meta.updateTag({ name: 'description', content: r.data.metaDescription });
        }
      },
      error: () => this.loading.set(false),
    });
  }
}

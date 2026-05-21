import {
  Component, OnInit, signal, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CmsService, BlogPost } from '../../../core/services/cms.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'lg-blog-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MatIconModule, SkeletonComponent],
  template: `
    <div class="max-w-screen-lg mx-auto px-4 py-10">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="font-display text-3xl font-bold text-text-primary mb-2">Blog</h1>
        <p class="text-text-secondary">Tips, trends, and stories from the Lagaao community.</p>
      </div>

      @if (loading()) {
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (_ of [1,2,3,4,5,6]; track $index) {
            <div class="card overflow-hidden">
              <lg-skeleton height="180px"></lg-skeleton>
              <div class="p-4 space-y-2">
                <lg-skeleton height="20px" width="80%"></lg-skeleton>
                <lg-skeleton height="14px"></lg-skeleton>
                <lg-skeleton height="14px" width="60%"></lg-skeleton>
              </div>
            </div>
          }
        </div>
      } @else if (posts().length === 0) {
        <div class="text-center py-20 text-text-secondary">
          <mat-icon class="!text-5xl !w-12 !h-12 mb-3">article</mat-icon>
          <p class="text-lg font-medium">No posts yet</p>
        </div>
      } @else {
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (post of posts(); track post.id) {
            <a [routerLink]="['/blog', post.slug]"
               class="card overflow-hidden hover:shadow-card-hover transition-shadow group block">
              @if (post.coverImage) {
                <div class="h-48 overflow-hidden">
                  <img [src]="post.coverImage" [alt]="post.title"
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              } @else {
                <div class="h-48 bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                  <mat-icon class="!text-4xl text-text-secondary/30">article</mat-icon>
                </div>
              }
              <div class="p-4">
                @if (post.tags?.length) {
                  <div class="flex flex-wrap gap-1 mb-2">
                    @for (tag of post.tags!.slice(0, 3); track tag) {
                      <span class="text-xs px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-full">
                        {{ tag }}
                      </span>
                    }
                  </div>
                }
                <h2 class="font-semibold text-text-primary line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {{ post.title }}
                </h2>
                @if (post.excerpt) {
                  <p class="text-sm text-text-secondary mt-1 line-clamp-2">{{ post.excerpt }}</p>
                }
                <div class="flex items-center justify-between mt-3 text-xs text-text-secondary">
                  <span>{{ post.publishedAt | date: 'd MMM y' }}</span>
                  <span class="flex items-center gap-1">
                    <mat-icon class="!text-sm !w-3.5 !h-3.5">visibility</mat-icon>
                    {{ post.viewCount }}
                  </span>
                </div>
              </div>
            </a>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex justify-center gap-2 mt-10">
            <button
              class="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-40"
              [disabled]="page() === 1"
              (click)="loadPage(page() - 1)"
            >Previous</button>
            <span class="px-4 py-2 text-sm text-text-secondary">{{ page() }} / {{ totalPages() }}</span>
            <button
              class="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-40"
              [disabled]="page() === totalPages()"
              (click)="loadPage(page() + 1)"
            >Next</button>
          </div>
        }
      }
    </div>
  `,
})
export class BlogListComponent implements OnInit {
  readonly #cms   = inject(CmsService);
  readonly #route = inject(ActivatedRoute);

  posts      = signal<BlogPost[]>([]);
  loading    = signal(true);
  page       = signal(1);
  totalPages = signal(1);

  ngOnInit() {
    this.loadPage(1);
  }

  loadPage(p: number) {
    this.loading.set(true);
    this.page.set(p);
    this.#cms.getPosts(p, 9).subscribe({
      next: r => {
        this.posts.set(r.data.rows);
        this.totalPages.set(Math.ceil(r.data.count / r.data.limit));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

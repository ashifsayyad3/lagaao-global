import {
  Component, OnInit, signal, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CmsService, BlogPost } from '../../../core/services/cms.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'lg-blog-post',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MatIconModule, SkeletonComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-10">
      <a routerLink="/blog"
         class="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary-600 mb-6">
        <mat-icon class="!text-base">arrow_back</mat-icon>
        Back to Blog
      </a>

      @if (loading()) {
        <div class="space-y-4">
          <lg-skeleton height="36px" width="70%"></lg-skeleton>
          <lg-skeleton height="240px"></lg-skeleton>
          <lg-skeleton height="16px"></lg-skeleton>
          <lg-skeleton height="16px" width="90%"></lg-skeleton>
          <lg-skeleton height="16px" width="80%"></lg-skeleton>
        </div>
      } @else if (!post()) {
        <div class="text-center py-20 text-text-secondary">
          <mat-icon class="!text-5xl !w-12 !h-12 mb-3">error_outline</mat-icon>
          <p class="text-lg font-medium">Post not found</p>
          <a routerLink="/blog" class="btn-primary mt-4 inline-block">Browse all posts</a>
        </div>
      } @else {
        <!-- Cover image -->
        @if (post()!.coverImage) {
          <img [src]="post()!.coverImage" [alt]="post()!.title"
               class="w-full h-64 md:h-80 object-cover rounded-2xl mb-8" />
        }

        <!-- Tags -->
        @if (post()!.tags?.length) {
          <div class="flex flex-wrap gap-2 mb-4">
            @for (tag of post()!.tags!; track tag) {
              <a [routerLink]="['/blog']" [queryParams]="{ tag }"
                 class="text-xs px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-full hover:bg-primary-100">
                {{ tag }}
              </a>
            }
          </div>
        }

        <h1 class="font-display text-3xl md:text-4xl font-bold text-text-primary leading-tight mb-4">
          {{ post()!.title }}
        </h1>

        <div class="flex items-center gap-3 text-sm text-text-secondary mb-8 pb-8 border-b border-border">
          <span>{{ post()!.publishedAt | date: 'MMMM d, y' }}</span>
          <span>·</span>
          <span class="flex items-center gap-1">
            <mat-icon class="!text-sm !w-3.5 !h-3.5">visibility</mat-icon>
            {{ post()!.viewCount }} views
          </span>
        </div>

        <!-- Content (rendered as HTML) -->
        <div class="prose prose-sm md:prose-base dark:prose-invert max-w-none"
             [innerHTML]="post()!.content"></div>
      }
    </div>
  `,
})
export class BlogPostComponent implements OnInit {
  readonly #cms   = inject(CmsService);
  readonly #route = inject(ActivatedRoute);

  post    = signal<BlogPost | null>(null);
  loading = signal(true);

  ngOnInit() {
    const slug = this.#route.snapshot.paramMap.get('slug')!;
    this.#cms.getPost(slug).subscribe({
      next:  r => { this.post.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

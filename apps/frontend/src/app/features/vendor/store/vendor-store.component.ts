import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { VendorService, VendorProfile } from '../../../core/services/vendor.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { SkeletonCardComponent, SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import type { Product } from '../../../core/services/product.service';

@Component({
  selector: 'lg-vendor-store',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, ProductCardComponent, SkeletonCardComponent, SkeletonComponent, BadgeComponent],
  template: `
    <div class="max-w-screen-xl mx-auto px-4 md:px-6 py-8">

      @if (loading()) {
        <div class="space-y-6">
          <lg-skeleton height="200px" borderRadius="1rem"></lg-skeleton>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (i of skeletons; track i) { <lg-skeleton-card></lg-skeleton-card> }
          </div>
        </div>

      } @else if (!vendor()) {
        <div class="flex flex-col items-center py-20 text-center">
          <mat-icon class="!text-6xl text-text-muted mb-4">store_mall_directory</mat-icon>
          <h2 class="font-display text-2xl font-bold text-text-primary mb-2">Store not found</h2>
          <a routerLink="/" class="text-primary-600 hover:underline">Back to Home</a>
        </div>

      } @else {
        <!-- Store hero -->
        <div class="rounded-2xl overflow-hidden border border-border-default mb-8">
          <!-- Banner -->
          <div class="h-40 bg-gradient-to-r from-primary-600 to-accent relative"
               [style.backgroundImage]="vendor()!.banner ? 'url(' + vendor()!.banner + ')' : ''"
               [style.backgroundSize]="'cover'"
               [style.backgroundPosition]="'center'">
          </div>

          <!-- Store info bar -->
          <div class="bg-bg-base px-6 py-4 flex items-center gap-5 flex-wrap">
            <div class="w-20 h-20 -mt-12 rounded-2xl border-4 border-bg-base overflow-hidden bg-surface-100 flex-shrink-0">
              @if (vendor()!.logo) {
                <img [src]="vendor()!.logo!" [alt]="vendor()!.storeName" class="w-full h-full object-cover" />
              } @else {
                <div class="w-full h-full bg-primary-100 flex items-center justify-center">
                  <mat-icon class="text-primary-600 !text-3xl">store</mat-icon>
                </div>
              }
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="font-display text-xl font-bold text-text-primary">{{ vendor()!.storeName }}</h1>
                @if (vendor()!.isVerified) {
                  <mat-icon class="!text-base text-blue-500" title="Verified Seller">verified</mat-icon>
                  <lg-badge variant="info">Verified</lg-badge>
                }
              </div>
              @if (vendor()!.description) {
                <p class="text-sm text-text-secondary mt-1 line-clamp-2">{{ vendor()!.description }}</p>
              }
              <div class="flex items-center gap-4 mt-2 text-sm text-text-muted">
                @if (vendor()!.rating > 0) {
                  <span class="flex items-center gap-1">
                    <mat-icon class="!text-sm text-amber-400">star</mat-icon>
                    {{ vendor()!.rating }} ({{ vendor()!.reviewCount }} reviews)
                  </span>
                }
                <span>{{ products().length }} products</span>
              </div>
            </div>

            @if (vendor()!.website) {
              <a [href]="vendor()!.website!" target="_blank" rel="noopener"
                 class="flex items-center gap-1 text-sm text-primary-600 hover:underline">
                <mat-icon class="!text-base">language</mat-icon>
                Website
              </a>
            }
          </div>
        </div>

        <!-- Products -->
        <h2 class="font-display text-lg font-bold text-text-primary mb-4">
          Products <span class="text-text-muted font-normal text-base">({{ products().length }})</span>
        </h2>

        @if (products().length === 0) {
          <div class="flex flex-col items-center py-16 text-center">
            <mat-icon class="!text-5xl text-text-muted mb-3">inventory_2</mat-icon>
            <p class="text-text-secondary">No products listed yet.</p>
          </div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (product of products(); track product.id) {
              <lg-product-card [product]="product" class="animate-fade-in"></lg-product-card>
            }
          </div>
        }
      }
    </div>
  `,
})
export class VendorStoreComponent implements OnInit {
  readonly #route     = inject(ActivatedRoute);
  readonly #vendorSvc = inject(VendorService);

  readonly vendor   = signal<VendorProfile | null>(null);
  readonly products = signal<Product[]>([]);
  readonly loading  = signal(true);
  readonly skeletons = Array.from({ length: 8 }, (_, i) => i);

  ngOnInit(): void {
    this.#route.params.subscribe(p => {
      this.loading.set(true);
      this.#vendorSvc.getStore(p['storeSlug']).subscribe({
        next: r => {
          this.vendor.set(r.data.vendor);
          this.products.set(r.data.products as Product[]);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }
}

import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VendorService, VendorProductInput } from '../../../core/services/vendor.service';
import { ProductService } from '../../../core/services/product.service';
import {
  ImageUploaderComponent,
  UploadedFile,
} from '../../../shared/components/image-uploader/image-uploader.component';

@Component({
  selector: 'lg-vendor-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ImageUploaderComponent],
  template: `
<div class="p-6 max-w-4xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center gap-3">
    <a routerLink="/vendor/products"
       class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500">
      <span class="material-icons text-[20px]">arrow_back</span>
    </a>
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">{{ isEdit() ? 'Edit Product' : 'Add New Product' }}</h1>
      <p class="text-xs text-gray-400 mt-0.5">{{ isEdit() ? 'Update your product details' : 'Fill in the details to list a new product' }}</p>
    </div>
  </div>

  @if (loadingProduct()) {
    <div class="flex items-center justify-center py-32">
      <div class="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  } @else {

    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">

      <!-- Basic info -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <h2 class="font-semibold text-gray-900 dark:text-white text-sm border-b border-gray-100 dark:border-gray-700 pb-2">Basic Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
            <input formControlName="name" type="text" placeholder="e.g. Monstera Deliciosa"
              class="field-input" [class.ring-red-500]="touched('name')" />
            @if (touched('name')) { <p class="text-xs text-red-500 mt-1">Name is required</p> }
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
            <input formControlName="sku" type="text" placeholder="Auto-generated if blank"
              class="field-input" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
            <select formControlName="categoryId" class="field-input" [class.ring-red-500]="touched('categoryId')">
              <option value="">Select category…</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
                @for (child of cat.children; track child.id) {
                  <option [value]="child.id">  └ {{ child.name }}</option>
                }
              }
            </select>
            @if (touched('categoryId')) { <p class="text-xs text-red-500 mt-1">Category is required</p> }
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Base Price (₹) *</label>
            <input formControlName="basePrice" type="number" min="0" placeholder="0.00"
              class="field-input" [class.ring-red-500]="touched('basePrice')" />
            @if (touched('basePrice')) { <p class="text-xs text-red-500 mt-1">Valid price required</p> }
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sale Price (₹)</label>
            <input formControlName="salePrice" type="number" min="0" placeholder="Leave blank if no discount"
              class="field-input" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%)</label>
            <input formControlName="taxRate" type="number" min="0" max="100" placeholder="0"
              class="field-input" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select formControlName="status" class="field-input">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Short Description</label>
          <input formControlName="shortDescription" type="text" placeholder="One-line summary shown in listings"
            class="field-input" />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Description</label>
          <textarea formControlName="description" rows="5" placeholder="Detailed product description…"
            class="field-input resize-none"></textarea>
        </div>
      </div>

      <!-- Images -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <h2 class="font-semibold text-gray-900 dark:text-white text-sm border-b border-gray-100 dark:border-gray-700 pb-2">
          Product Images
        </h2>
        <lg-image-uploader
          [existingUrls]="existingImageUrls()"
          [entityType]="'product'"
          [maxFiles]="10"
          (uploaded)="onImageUploaded($event)"
          (existingRemoved)="onExistingImageRemoved($event)"
        />
      </div>

      <!-- SEO -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <h2 class="font-semibold text-gray-900 dark:text-white text-sm border-b border-gray-100 dark:border-gray-700 pb-2">SEO (Optional)</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Title</label>
            <input formControlName="metaTitle" type="text" class="field-input" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
            <input formControlName="slug" type="text" placeholder="auto-generated" class="field-input" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Description</label>
            <textarea formControlName="metaDescription" rows="2" class="field-input resize-none"></textarea>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex items-center justify-end gap-3">
        @if (error()) {
          <p class="text-sm text-red-600 dark:text-red-400 mr-auto">{{ error() }}</p>
        }
        <a routerLink="/vendor/products"
           class="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Cancel
        </a>
        <button type="submit" [disabled]="saving()"
          class="px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2">
          @if (saving()) {
            <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          }
          {{ isEdit() ? 'Save Changes' : 'Create Product' }}
        </button>
      </div>

    </form>
  }

</div>
  `,
  styles: [`
    .field-input {
      @apply w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500;
    }
    :host-context(.dark) .field-input {
      @apply border-gray-600 bg-gray-700 text-white;
    }
  `],
})
export class VendorProductFormComponent implements OnInit {
  readonly #fb      = inject(FormBuilder);
  readonly #vendor  = inject(VendorService);
  readonly #product = inject(ProductService);
  readonly #route   = inject(ActivatedRoute);
  readonly #router  = inject(Router);

  readonly isEdit         = signal(false);
  readonly loadingProduct = signal(false);
  readonly saving         = signal(false);
  readonly error          = signal('');
  readonly categories     = this.#product.categories;

  /** Tracks uploaded image URLs for the form payload */
  readonly uploadedImages = signal<{ url: string; alt: string; isPrimary: boolean }[]>([]);
  /** Existing image URLs shown in uploader (populated on edit) */
  readonly existingImageUrls = signal<string[]>([]);

  private editId: number | null = null;

  readonly form = this.#fb.group({
    name:             ['', Validators.required],
    slug:             [''],
    sku:              [''],
    description:      [''],
    shortDescription: [''],
    categoryId:       ['', Validators.required],
    basePrice:        [null as number | null, [Validators.required, Validators.min(0)]],
    salePrice:        [null as number | null],
    taxRate:          [0],
    status:           ['draft' as 'draft' | 'active' | 'inactive'],
    metaTitle:        [''],
    metaDescription:  [''],
    images: this.#fb.array([]),
  });

  get images(): FormArray { return this.form.get('images') as FormArray; }

  ngOnInit(): void {
    if (!this.categories().length) {
      this.#product.loadCategories().subscribe();
    }
    const id = this.#route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId = Number(id);
      this.loadingProduct.set(true);
      this.#vendor.getProduct(this.editId).subscribe({
        next: r => {
          const p = r.data as any;
          this.form.patchValue({
            name: p.name, slug: p.slug, sku: p.sku,
            description: p.description, shortDescription: p.shortDescription,
            categoryId: String(p.categoryId), basePrice: p.basePrice,
            salePrice: p.salePrice, taxRate: p.taxRate, status: p.status,
            metaTitle: p.metaTitle, metaDescription: p.metaDescription,
          });
          // Populate existing image URLs for the uploader
          const existingUrls = (p.images ?? []).map((img: { url: string }) => img.url).filter(Boolean);
          this.existingImageUrls.set(existingUrls);
          this.uploadedImages.set(
            (p.images ?? []).map((img: any, i: number) => ({
              url: img.url, alt: img.alt ?? '', isPrimary: i === 0,
            })),
          );
          this.loadingProduct.set(false);
        },
        error: () => this.loadingProduct.set(false),
      });
    }
  }

  /** Called when ImageUploader successfully uploads a file */
  onImageUploaded(file: UploadedFile): void {
    this.uploadedImages.update(imgs => {
      const isPrimary = imgs.length === 0; // first uploaded = primary
      return [...imgs, { url: file.url, alt: file.originalName, isPrimary }];
    });
  }

  /** Called when user removes an existing image in the uploader */
  onExistingImageRemoved(url: string): void {
    this.existingImageUrls.update(urls => urls.filter(u => u !== url));
    this.uploadedImages.update(imgs => imgs.filter(i => i.url !== url));
  }

  addImage(data?: { url?: string; alt?: string; isPrimary?: boolean }): void {
    this.images.push(this.#fb.group({
      url:       [data?.url ?? ''],
      alt:       [data?.alt ?? ''],
      isPrimary: [data?.isPrimary ?? false],
    }));
  }

  removeImage(i: number): void { this.images.removeAt(i); }

  touched(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload: VendorProductInput = {
      name: raw.name!,
      slug: raw.slug || undefined,
      sku: raw.sku || undefined,
      description: raw.description || undefined,
      shortDescription: raw.shortDescription || undefined,
      categoryId: Number(raw.categoryId),
      basePrice: raw.basePrice!,
      salePrice: raw.salePrice ?? null,
      taxRate: raw.taxRate ?? 0,
      status: raw.status as any,
      metaTitle: raw.metaTitle || undefined,
      metaDescription: raw.metaDescription || undefined,
      images: this.uploadedImages().map((img, i) => ({
        url: img.url, alt: img.alt || undefined, isPrimary: i === 0,
      })),
    };
    this.saving.set(true);
    this.error.set('');
    const req$ = this.isEdit() && this.editId
      ? this.#vendor.updateProduct(this.editId, payload)
      : this.#vendor.createProduct(payload);
    req$.subscribe({
      next: () => this.#router.navigate(['/vendor/products']),
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Failed to save product');
        this.saving.set(false);
      },
    });
  }
}

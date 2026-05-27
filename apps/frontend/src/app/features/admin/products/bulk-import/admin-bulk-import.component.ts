import {
  Component, ChangeDetectionStrategy, inject, signal, ElementRef, viewChild
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';

interface ImportResult {
  imported: number;
  updated:  number;
  skipped:  number;
  errors:   { row: number; sku?: string; name?: string; error: string }[];
}

const SAMPLE_CSV = `name,category,basePrice,sku,brand,comparePrice,taxRate,hsnCode,description,status,isFeatured,tags,weight
Rose Plant,Plants,299,ROSE-001,FloraKing,399,18,0602,Beautiful red rose plant,active,true,rose|flowering|garden,0.5
Money Plant,Plants,149,,FloraKing,,5,0602,Easy care money plant,active,false,indoor|low-light,0.3`;

@Component({
  selector: 'lg-admin-bulk-import',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
<div class="p-6 max-w-3xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-text-primary">Bulk Product Import</h1>
    <p class="text-sm text-text-muted mt-1">Upload a CSV file to create or update products in bulk.</p>
  </div>

  <!-- Format guide -->
  <div class="rounded-2xl border border-border-default bg-bg-base p-5 space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="font-semibold text-text-primary text-sm">CSV Format</h2>
      <button (click)="downloadSample()"
              class="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:underline">
        <mat-icon class="text-sm">download</mat-icon>
        Download sample
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="bg-surface-50">
            @for (col of columns; track col.name) {
              <th class="text-left px-3 py-2 text-text-secondary font-medium border-b border-border-default">
                {{ col.name }}
                @if (col.required) { <span class="text-red-500">*</span> }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          <tr>
            @for (col of columns; track col.name) {
              <td class="px-3 py-2 text-text-muted border-b border-border-default whitespace-nowrap">
                {{ col.example }}
              </td>
            }
          </tr>
        </tbody>
      </table>
    </div>
    <p class="text-xs text-text-muted">
      * Required. <code class="bg-surface-50 px-1 rounded">tags</code> separated by <code class="bg-surface-50 px-1 rounded">|</code>.
      If <code class="bg-surface-50 px-1 rounded">sku</code> is provided, rows will be upserted by SKU; otherwise by name+category.
    </p>
  </div>

  <!-- Drop zone -->
  <div #dropZone
       (dragover)="onDragOver($event)"
       (dragleave)="onDragLeave($event)"
       (drop)="onDrop($event)"
       (click)="fileInput.click()"
       [class.border-primary-500]="dragging()"
       [class.bg-primary-50]="dragging()"
       class="rounded-2xl border-2 border-dashed border-border-default bg-bg-base p-10
              flex flex-col items-center justify-center gap-3 cursor-pointer
              hover:border-primary-400 hover:bg-surface-50 transition-colors">

    <mat-icon class="text-4xl text-text-muted">upload_file</mat-icon>

    @if (file()) {
      <p class="text-sm font-semibold text-primary-600">{{ file()!.name }}</p>
      <p class="text-xs text-text-muted">{{ (file()!.size / 1024).toFixed(1) }} KB · Click to change</p>
    } @else {
      <p class="text-sm font-semibold text-text-primary">Drop CSV here or click to browse</p>
      <p class="text-xs text-text-muted">Max 5 MB</p>
    }

    <input #fileInput type="file" accept=".csv,text/csv" class="hidden"
           (change)="onFileChange($event)" />
  </div>

  <!-- Upload button -->
  @if (file() && !result()) {
    <button (click)="upload()" [disabled]="uploading()"
            class="w-full py-3 rounded-2xl bg-primary-600 text-white font-semibold text-sm
                   disabled:opacity-50 flex items-center justify-center gap-2">
      @if (uploading()) {
        <mat-icon class="animate-spin text-base">refresh</mat-icon>
        Importing…
      } @else {
        <mat-icon class="text-base">cloud_upload</mat-icon>
        Import Products
      }
    </button>
  }

  <!-- Error -->
  @if (uploadError()) {
    <div class="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {{ uploadError() }}
    </div>
  }

  <!-- Result -->
  @if (result()) {
    <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden space-y-0">
      <!-- Stats -->
      <div class="grid grid-cols-3 divide-x divide-border-default border-b border-border-default">
        <div class="p-5 text-center">
          <p class="text-2xl font-bold text-green-600">{{ result()!.imported }}</p>
          <p class="text-xs text-text-muted mt-1">Created</p>
        </div>
        <div class="p-5 text-center">
          <p class="text-2xl font-bold text-blue-600">{{ result()!.updated }}</p>
          <p class="text-xs text-text-muted mt-1">Updated</p>
        </div>
        <div class="p-5 text-center">
          <p class="text-2xl font-bold" [class.text-red-600]="result()!.skipped > 0" [class.text-text-muted]="result()!.skipped === 0">
            {{ result()!.skipped }}
          </p>
          <p class="text-xs text-text-muted mt-1">Skipped</p>
        </div>
      </div>

      <!-- Row errors -->
      @if (result()!.errors.length > 0) {
        <div class="px-5 py-4 space-y-2">
          <h3 class="text-sm font-semibold text-text-primary">Errors ({{ result()!.errors.length }})</h3>
          <div class="max-h-60 overflow-y-auto space-y-1">
            @for (e of result()!.errors; track e.row) {
              <div class="flex items-start gap-2 text-xs bg-red-50 rounded-lg px-3 py-2">
                <span class="font-mono text-text-muted">Row {{ e.row }}</span>
                @if (e.name) { <span class="text-text-secondary">{{ e.name }}</span> }
                <span class="text-red-600 flex-1">{{ e.error }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Reset -->
      <div class="px-5 py-4 border-t border-border-default">
        <button (click)="reset()"
                class="text-sm text-primary-600 font-medium hover:underline">
          Import another file
        </button>
      </div>
    </div>
  }
</div>
  `,
})
export class AdminBulkImportComponent {
  readonly #http = inject(HttpClient);

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  dragging  = signal(false);
  file      = signal<File | null>(null);
  uploading = signal(false);
  uploadError = signal('');
  result    = signal<ImportResult | null>(null);

  readonly columns = [
    { name: 'name',         required: true,  example: 'Rose Plant' },
    { name: 'category',     required: true,  example: 'Plants' },
    { name: 'basePrice',    required: true,  example: '299' },
    { name: 'sku',          required: false, example: 'ROSE-001' },
    { name: 'brand',        required: false, example: 'FloraKing' },
    { name: 'comparePrice', required: false, example: '399' },
    { name: 'taxRate',      required: false, example: '18' },
    { name: 'hsnCode',      required: false, example: '0602' },
    { name: 'description',  required: false, example: 'Red rose…' },
    { name: 'status',       required: false, example: 'active' },
    { name: 'isFeatured',   required: false, example: 'true' },
    { name: 'tags',         required: false, example: 'rose|garden' },
    { name: 'weight',       required: false, example: '0.5' },
  ];

  onDragOver(e: DragEvent) { e.preventDefault(); this.dragging.set(true); }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.dragging.set(false); }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    const f = e.dataTransfer?.files[0];
    if (f) this.setFile(f);
  }
  onFileChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.setFile(f);
  }
  private setFile(f: File) {
    this.file.set(f);
    this.result.set(null);
    this.uploadError.set('');
  }

  upload() {
    const f = this.file();
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    this.uploading.set(true);
    this.uploadError.set('');
    this.#http.post<{ success: boolean; data: ImportResult }>(
      `${environment.apiUrl}/api/v1/products/bulk-import`, fd
    ).subscribe({
      next: r  => { this.result.set(r.data); this.uploading.set(false); },
      error: e => { this.uploadError.set(e.error?.message ?? 'Upload failed'); this.uploading.set(false); },
    });
  }

  reset() {
    this.file.set(null);
    this.result.set(null);
    this.uploadError.set('');
    const inp = this.fileInput()?.nativeElement;
    if (inp) inp.value = '';
  }

  downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lagaao-products-sample.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

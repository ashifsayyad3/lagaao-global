import {
  Component, ChangeDetectionStrategy, inject, signal, input, output,
  ElementRef, viewChild,
} from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';

export interface UploadedFile {
  id:           number;
  url:          string;
  originalName: string;
  fileName:     string;
  mimeType:     string;
  size:         number;
}

interface FileItem {
  file:     File;
  preview:  string;
  progress: number;   // 0-100
  status:   'pending' | 'uploading' | 'done' | 'error';
  result?:  UploadedFile;
  error?:   string;
}

@Component({
  selector: 'lg-image-uploader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  styles: [`
    :host { display: block; }

    /* ── Drop zone ─────────────────────────────── */
    .drop-zone {
      border: 2px dashed var(--border-default);
      border-radius: 16px;
      padding: 32px 24px;
      text-align: center;
      cursor: pointer;
      transition: border-color 200ms, background 200ms;
      background: var(--bg-subtle);
    }
    .drop-zone:hover,
    .drop-zone.drag-over {
      border-color: var(--color-primary);
      background: var(--color-primary-50);
    }
    .drop-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: var(--color-primary-50);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
      color: var(--color-primary);
    }
    .drop-title {
      font-size: .9375rem; font-weight: 600;
      color: var(--text-primary); margin: 0 0 4px;
    }
    .drop-sub {
      font-size: .8125rem; color: var(--text-muted); margin: 0;
    }
    .drop-sub span {
      color: var(--color-primary); font-weight: 600; cursor: pointer;
    }
    input[type="file"] { display: none; }

    /* ── Preview grid ──────────────────────────── */
    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .preview-item {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 1;
      background: var(--bg-subtle);
      border: 1.5px solid var(--border-default);
    }
    .preview-item img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .preview-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,.45);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 6px;
      opacity: 0;
      transition: opacity 150ms;
    }
    .preview-item:hover .preview-overlay { opacity: 1; }
    .preview-item.uploading .preview-overlay,
    .preview-item.error     .preview-overlay { opacity: 1; }

    /* Progress bar */
    .progress-bar {
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 4px; background: rgba(255,255,255,.25);
    }
    .progress-fill {
      height: 100%; background: var(--color-primary);
      transition: width 200ms ease;
    }

    /* Status badge */
    .status-badge {
      font-size: .6875rem; font-weight: 700; letter-spacing: .04em;
      padding: 2px 8px; border-radius: 999px;
      color: #fff;
    }
    .status-badge.uploading { background: rgba(255,255,255,.25); }
    .status-badge.done      { background: rgba(61,107,69,.8); }
    .status-badge.error     { background: rgba(220,38,38,.8); }

    .remove-btn {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: rgba(255,255,255,.2);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; transition: background 150ms;
    }
    .remove-btn:hover { background: rgba(220,38,38,.6); }

    /* ── Existing images ───────────────────────── */
    .existing-label {
      font-size: .75rem; font-weight: 700; letter-spacing: .06em;
      text-transform: uppercase; color: var(--text-muted);
      margin: 16px 0 8px;
    }
    .existing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
      gap: 10px;
    }
    .existing-item {
      position: relative; border-radius: 10px; overflow: hidden;
      aspect-ratio: 1; border: 1.5px solid var(--border-default);
      cursor: pointer; transition: border-color 150ms;
    }
    .existing-item:hover { border-color: var(--color-danger, #dc2626); }
    .existing-item img { width: 100%; height: 100%; object-fit: cover; }
    .existing-remove {
      position: absolute; top: 4px; right: 4px;
      width: 22px; height: 22px; border-radius: 50%;
      background: rgba(220,38,38,.8); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; opacity: 0; transition: opacity 150ms;
    }
    .existing-item:hover .existing-remove { opacity: 1; }

    /* ── Hint bar ──────────────────────────────── */
    .hint-bar {
      display: flex; align-items: center; gap: 6px;
      font-size: .75rem; color: var(--text-muted);
      margin-top: 10px;
    }
  `],
  template: `
    <!-- Existing images (passed in from parent) -->
    @if (existingUrls().length) {
      <p class="existing-label">Current Images</p>
      <div class="existing-grid">
        @for (url of existingUrls(); track url) {
          <div class="existing-item">
            <img [src]="url" alt="existing" />
            <button class="existing-remove"
                    (click)="removeExisting(url)"
                    type="button"
                    title="Remove">
              <mat-icon style="font-size:14px;width:14px;height:14px">close</mat-icon>
            </button>
          </div>
        }
      </div>
    }

    <!-- Drop zone -->
    <div class="drop-zone"
         [class.drag-over]="dragging()"
         (click)="fileInput().nativeElement.click()"
         (dragover)="$event.preventDefault(); dragging.set(true)"
         (dragleave)="dragging.set(false)"
         (drop)="onDrop($event)">

      <div class="drop-icon">
        <mat-icon>cloud_upload</mat-icon>
      </div>
      <p class="drop-title">Drag & drop images here</p>
      <p class="drop-sub">or <span>browse files</span></p>
      <p class="drop-sub" style="margin-top:4px">
        JPEG, PNG, WebP, GIF — max {{ maxMb() }}MB each
      </p>

      <input #fileInput
             type="file"
             [accept]="accept()"
             [multiple]="multiple()"
             (change)="onFileInputChange($event)" />
    </div>

    <!-- Upload queue preview -->
    @if (queue().length) {
      <div class="preview-grid">
        @for (item of queue(); track item.file.name) {
          <div class="preview-item" [class]="item.status">
            <img [src]="item.preview" [alt]="item.file.name" />

            <!-- Progress bar while uploading -->
            @if (item.status === 'uploading') {
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="item.progress"></div>
              </div>
            }

            <div class="preview-overlay">
              @if (item.status === 'uploading') {
                <span class="status-badge uploading">{{ item.progress }}%</span>
              }
              @if (item.status === 'done') {
                <mat-icon style="color:#fff;font-size:24px;width:24px;height:24px">check_circle</mat-icon>
              }
              @if (item.status === 'error') {
                <mat-icon style="color:#fca5a5;font-size:20px;width:20px;height:20px">error</mat-icon>
                <span class="status-badge error">Failed</span>
              }
              @if (item.status === 'done' || item.status === 'error') {
                <button class="remove-btn" type="button" (click)="removeFromQueue(item)">
                  <mat-icon style="font-size:14px;width:14px;height:14px">close</mat-icon>
                </button>
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- Hint bar -->
    <div class="hint-bar">
      <mat-icon style="font-size:14px;width:14px;height:14px">info</mat-icon>
      First image will be used as the product thumbnail.
      {{ uploadedCount() }} / {{ maxFiles() }} uploaded.
    </div>
  `,
})
export class ImageUploaderComponent {
  readonly #http = inject(HttpClient);

  // ── Inputs ────────────────────────────────────────
  readonly existingUrls  = input<string[]>([]);
  readonly maxFiles      = input<number>(10);
  readonly maxMb         = input<number>(10);
  readonly multiple      = input<boolean>(true);
  readonly accept        = input<string>('image/jpeg,image/png,image/webp,image/gif,image/avif');
  readonly entityType    = input<string | undefined>(undefined);
  readonly entityId      = input<number | undefined>(undefined);

  // ── Outputs ───────────────────────────────────────
  /** Emits every time a file successfully uploads */
  readonly uploaded       = output<UploadedFile>();
  /** Emits when an existing image URL is removed */
  readonly existingRemoved = output<string>();

  // ── Template refs ─────────────────────────────────
  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  // ── State ─────────────────────────────────────────
  readonly dragging     = signal(false);
  readonly queue        = signal<FileItem[]>([]);
  readonly uploadedCount = signal(0);

  // ── Handlers ──────────────────────────────────────
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.addFiles(files);
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.addFiles(files);
    input.value = ''; // reset so same file can be re-added
  }

  removeExisting(url: string): void {
    this.existingRemoved.emit(url);
  }

  removeFromQueue(item: FileItem): void {
    this.queue.update(q => q.filter(i => i !== item));
    if (item.status === 'done') this.uploadedCount.update(n => Math.max(0, n - 1));
  }

  private addFiles(files: File[]): void {
    const remaining = this.maxFiles() - this.queue().filter(i => i.status !== 'error').length;
    const toAdd = files.slice(0, remaining);

    const items: FileItem[] = toAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }));

    this.queue.update(q => [...q, ...items]);
    items.forEach(item => this.uploadOne(item));
  }

  private uploadOne(item: FileItem): void {
    item.status = 'uploading';
    this.queue.update(q => [...q]); // trigger CD

    const formData = new FormData();
    formData.append('file', item.file);
    if (this.entityType()) formData.append('entityType', this.entityType()!);
    if (this.entityId())   formData.append('entityId',   String(this.entityId()));

    this.#http.post<{ success: boolean; data: UploadedFile }>(
      `${environment.apiUrl}/api/v1/uploads`,
      formData,
      { reportProgress: true, observe: 'events', withCredentials: true },
    ).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          item.progress = Math.round(100 * event.loaded / event.total);
          this.queue.update(q => [...q]);
        } else if (event.type === HttpEventType.Response) {
          const body = event.body;
          if (body?.success && body.data) {
            item.status = 'done';
            item.result = body.data;
            this.uploadedCount.update(n => n + 1);
            this.queue.update(q => [...q]);
            this.uploaded.emit(body.data);
          } else {
            item.status = 'error';
            item.error  = 'Upload failed';
            this.queue.update(q => [...q]);
          }
        }
      },
      error: (err) => {
        item.status = 'error';
        item.error  = err?.error?.message ?? 'Upload failed';
        this.queue.update(q => [...q]);
      },
    });
  }
}

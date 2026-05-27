import {
  ChangeDetectionStrategy, Component, inject, signal, computed, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';

interface SeoMetaRow {
  id: number;
  entityType: string;
  entityId: number | null;
  path: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  canonicalUrl: string | null;
  ogImage: string | null;
  noIndex: boolean;
  updatedAt: string;
}

interface RedirectRow {
  id: number;
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
  hitCount: number;
  createdAt: string;
}

interface SeoStats {
  total: number;
  noIndex: number;
  withImage: number;
  withKeywords: number;
  coverageRate: number;
}

interface VitalRow {
  name: string;
  p75: number;
  avg: number;
  count: number;
}

@Component({
  selector: 'lg-admin-seo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
<div class="seo-page">

  <!-- Header -->
  <div class="page-header">
    <div>
      <h1 class="page-title">SEO Center</h1>
      <p class="page-sub">Meta tags, redirects, sitemaps, and Core Web Vitals</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    @for (t of tabs; track t.id) {
      <button class="tab" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
        <mat-icon>{{ t.icon }}</mat-icon> {{ t.label }}
      </button>
    }
  </div>

  <!-- ── Tab: Overview ──────────────────────────────────────────── -->
  @if (activeTab() === 'overview') {
    <div class="stats-grid">
      <div class="stat-card">
        <mat-icon class="stat-icon" style="color:#6366f1">article</mat-icon>
        <div class="stat-val">{{ stats()?.total ?? '—' }}</div>
        <div class="stat-lbl">SEO Meta Records</div>
      </div>
      <div class="stat-card">
        <mat-icon class="stat-icon" style="color:#10b981">image</mat-icon>
        <div class="stat-val">{{ stats()?.coverageRate ?? '—' }}%</div>
        <div class="stat-lbl">OG Image Coverage</div>
      </div>
      <div class="stat-card">
        <mat-icon class="stat-icon" style="color:#f59e0b">key</mat-icon>
        <div class="stat-val">{{ stats()?.withKeywords ?? '—' }}</div>
        <div class="stat-lbl">With Keywords</div>
      </div>
      <div class="stat-card">
        <mat-icon class="stat-icon" style="color:#ef4444">block</mat-icon>
        <div class="stat-val">{{ stats()?.noIndex ?? '—' }}</div>
        <div class="stat-lbl">No-Index Pages</div>
      </div>
    </div>

    <!-- Core Web Vitals -->
    <div class="section-card">
      <h3 class="section-title"><mat-icon>speed</mat-icon> Core Web Vitals (p75, rolling)</h3>
      <div class="vitals-grid">
        @for (v of vitals(); track v.name) {
          <div class="vital-card" [class]="vitalClass(v)">
            <div class="vital-name">{{ v.name }}</div>
            <div class="vital-val">{{ formatVital(v) }}</div>
            <div class="vital-count">{{ v.count }} samples</div>
            <div class="vital-badge" [class]="vitalClass(v)">{{ vitalRating(v) }}</div>
          </div>
        }
        @if (vitals().length === 0) {
          <p class="empty">No vitals data yet — data is collected via sendBeacon as users browse.</p>
        }
      </div>
    </div>

    <!-- Quick actions -->
    <div class="section-card">
      <h3 class="section-title"><mat-icon>bolt</mat-icon> Quick Actions</h3>
      <div class="action-row">
        <button class="btn btn-primary" (click)="downloadSitemap()">
          <mat-icon>download</mat-icon> Download sitemap.xml
        </button>
        <button class="btn btn-outline" (click)="activeTab.set('redirects')">
          <mat-icon>swap_horiz</mat-icon> Manage Redirects
        </button>
        <button class="btn btn-outline" (click)="activeTab.set('meta')">
          <mat-icon>edit</mat-icon> Edit Meta Tags
        </button>
      </div>
    </div>
  }

  <!-- ── Tab: Meta Tags ─────────────────────────────────────────── -->
  @if (activeTab() === 'meta') {
    <div class="section-card">
      <div class="table-header">
        <h3 class="section-title"><mat-icon>label</mat-icon> SEO Meta Records</h3>
        <button class="btn btn-primary" (click)="openMetaForm()"><mat-icon>add</mat-icon> Add</button>
      </div>
      @if (metaLoading()) { <div class="loading-bar"></div> }
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Entity</th><th>Path / ID</th><th>Title</th>
            <th>Description</th><th>No-Index</th><th>OG Image</th><th>Actions</th>
          </tr></thead>
          <tbody>
            @for (row of metaRows(); track row.id) {
              <tr>
                <td><span class="badge badge-info">{{ row.entityType }}</span></td>
                <td class="mono">{{ row.path ?? (row.entityId ? '#' + row.entityId : '—') }}</td>
                <td>{{ row.metaTitle ?? '—' }}</td>
                <td class="trunc">{{ row.metaDescription ?? '—' }}</td>
                <td><span [class]="row.noIndex ? 'badge badge-warn' : 'badge badge-ok'">{{ row.noIndex ? 'Yes' : 'No' }}</span></td>
                <td>@if(row.ogImage){<mat-icon class="has-img">check_circle</mat-icon>}@else{<mat-icon class="no-img">cancel</mat-icon>}</td>
                <td>
                  <button class="icon-btn" (click)="editMeta(row)"><mat-icon>edit</mat-icon></button>
                  <button class="icon-btn danger" (click)="deleteMeta(row.id)"><mat-icon>delete</mat-icon></button>
                </td>
              </tr>
            }
            @if (metaRows().length === 0 && !metaLoading()) {
              <tr><td colspan="7" class="empty-row">No SEO meta records yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  }

  <!-- ── Tab: Redirects ─────────────────────────────────────────── -->
  @if (activeTab() === 'redirects') {
    <div class="section-card">
      <div class="table-header">
        <h3 class="section-title"><mat-icon>swap_horiz</mat-icon> Redirect Rules</h3>
        <button class="btn btn-primary" (click)="openRedirectForm()"><mat-icon>add</mat-icon> Add Redirect</button>
      </div>
      @if (redirectLoading()) { <div class="loading-bar"></div> }
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>From</th><th>To</th><th>Code</th><th>Status</th><th>Hits</th><th>Actions</th>
          </tr></thead>
          <tbody>
            @for (r of redirectRows(); track r.id) {
              <tr>
                <td class="mono">{{ r.fromPath }}</td>
                <td class="mono">{{ r.toPath }}</td>
                <td><span [class]="r.statusCode === 301 ? 'badge badge-info' : 'badge badge-warn'">{{ r.statusCode }}</span></td>
                <td><span [class]="r.isActive ? 'badge badge-ok' : 'badge badge-muted'">{{ r.isActive ? 'Active' : 'Paused' }}</span></td>
                <td>{{ r.hitCount }}</td>
                <td>
                  <button class="icon-btn" (click)="toggleRedirect(r)">
                    <mat-icon>{{ r.isActive ? 'pause' : 'play_arrow' }}</mat-icon>
                  </button>
                  <button class="icon-btn danger" (click)="deleteRedirect(r.id)"><mat-icon>delete</mat-icon></button>
                </td>
              </tr>
            }
            @if (redirectRows().length === 0 && !redirectLoading()) {
              <tr><td colspan="6" class="empty-row">No redirect rules yet.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  }

  <!-- ── Tab: Sitemap ───────────────────────────────────────────── -->
  @if (activeTab() === 'sitemap') {
    <div class="section-card">
      <h3 class="section-title"><mat-icon>map</mat-icon> Sitemap.xml</h3>
      <p style="color:var(--text-muted);margin-bottom:20px;">
        Sitemap is auto-generated from published products and categories.
        Submit to Google Search Console after each major catalog update.
      </p>
      <div class="info-grid">
        <div class="info-row"><span>Sitemap URL</span><a href="/api/v1/sitemap.xml" target="_blank" class="link">/api/v1/sitemap.xml</a></div>
        <div class="info-row"><span>Robots.txt</span><a href="/robots.txt" target="_blank" class="link">/robots.txt</a></div>
        <div class="info-row"><span>Includes</span><span>Static pages, categories, published products</span></div>
        <div class="info-row"><span>Auto-updates</span><span>Yes — generated on every request</span></div>
      </div>
      <button class="btn btn-primary" style="margin-top:20px" (click)="downloadSitemap()">
        <mat-icon>download</mat-icon> Download sitemap.xml
      </button>
    </div>
  }

  <!-- ── Meta form drawer ───────────────────────────────────────── -->
  @if (metaFormOpen()) {
    <div class="drawer-overlay" (click)="metaFormOpen.set(false)"></div>
    <div class="drawer">
      <div class="drawer-header">
        <h3>{{ editingMeta() ? 'Edit' : 'Add' }} SEO Meta</h3>
        <button class="icon-btn" (click)="metaFormOpen.set(false)"><mat-icon>close</mat-icon></button>
      </div>
      <div class="drawer-body">
        <label>Entity Type
          <select [(ngModel)]="metaForm.entityType" class="form-input">
            <option>page</option><option>product</option><option>category</option><option>blog</option>
          </select>
        </label>
        <label>Entity ID (optional for dynamic entities)
          <input type="number" [(ngModel)]="metaForm.entityId" class="form-input" placeholder="e.g. 42" />
        </label>
        <label>Static Path (for page entities)
          <input [(ngModel)]="metaForm.path" class="form-input" placeholder="/about" />
        </label>
        <label>Meta Title (max 70 chars)
          <input [(ngModel)]="metaForm.metaTitle" class="form-input" maxlength="70" />
        </label>
        <label>Meta Description (max 160 chars)
          <textarea [(ngModel)]="metaForm.metaDescription" class="form-input" rows="3" maxlength="160"></textarea>
        </label>
        <label>Keywords (comma-separated)
          <input [(ngModel)]="metaForm.keywords" class="form-input" />
        </label>
        <label>Canonical URL
          <input [(ngModel)]="metaForm.canonicalUrl" class="form-input" placeholder="https://lagaao.com/..." />
        </label>
        <label>OG Image URL
          <input [(ngModel)]="metaForm.ogImage" class="form-input" />
        </label>
        <label class="checkbox-row">
          <input type="checkbox" [(ngModel)]="metaForm.noIndex" />
          <span>No-Index (hide from search engines)</span>
        </label>
      </div>
      <div class="drawer-footer">
        <button class="btn btn-outline" (click)="metaFormOpen.set(false)">Cancel</button>
        <button class="btn btn-primary" (click)="saveMeta()">Save</button>
      </div>
    </div>
  }

  <!-- ── Redirect form drawer ───────────────────────────────────── -->
  @if (redirectFormOpen()) {
    <div class="drawer-overlay" (click)="redirectFormOpen.set(false)"></div>
    <div class="drawer">
      <div class="drawer-header">
        <h3>Add Redirect Rule</h3>
        <button class="icon-btn" (click)="redirectFormOpen.set(false)"><mat-icon>close</mat-icon></button>
      </div>
      <div class="drawer-body">
        <label>From Path
          <input [(ngModel)]="redirectForm.fromPath" class="form-input" placeholder="/old-url" />
        </label>
        <label>To Path
          <input [(ngModel)]="redirectForm.toPath" class="form-input" placeholder="/new-url or https://..." />
        </label>
        <label>Status Code
          <select [(ngModel)]="redirectForm.statusCode" class="form-input">
            <option [value]="301">301 — Permanent</option>
            <option [value]="302">302 — Temporary</option>
          </select>
        </label>
      </div>
      <div class="drawer-footer">
        <button class="btn btn-outline" (click)="redirectFormOpen.set(false)">Cancel</button>
        <button class="btn btn-primary" (click)="saveRedirect()">Save</button>
      </div>
    </div>
  }

</div>
  `,
  styles: [`
    .seo-page { padding: 24px; max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; }
    .page-sub { color: var(--text-muted); font-size: .875rem; margin: 0; }

    .tabs { display: flex; gap: 4px; background: var(--bg-subtle, #f5f5f5); border-radius: 10px; padding: 4px; margin-bottom: 24px; flex-wrap: wrap; }
    .tab { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; background: none; border-radius: 8px; cursor: pointer; font-size: .875rem; font-weight: 500; color: var(--text-muted); transition: all 150ms; }
    .tab.active { background: #fff; color: var(--color-primary, #6366f1); box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .tab mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.08); text-align: center; }
    .stat-icon { font-size: 32px; width: 32px; height: 32px; margin-bottom: 8px; }
    .stat-val { font-size: 1.75rem; font-weight: 700; }
    .stat-lbl { font-size: .8125rem; color: var(--text-muted); }

    .section-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.08); margin-bottom: 20px; }
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; font-weight: 600; margin: 0 0 16px; }
    .section-title mat-icon { color: var(--color-primary, #6366f1); }

    .vitals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .vital-card { border-radius: 10px; padding: 16px; text-align: center; border: 2px solid transparent; }
    .vital-card.good    { background: #f0fdf4; border-color: #bbf7d0; }
    .vital-card.needs   { background: #fffbeb; border-color: #fde68a; }
    .vital-card.poor    { background: #fef2f2; border-color: #fecaca; }
    .vital-name { font-weight: 700; font-size: .875rem; }
    .vital-val  { font-size: 1.5rem; font-weight: 800; margin: 6px 0; }
    .vital-count { font-size: .75rem; color: var(--text-muted); }
    .vital-badge { font-size: .75rem; font-weight: 600; margin-top: 6px; text-transform: uppercase; letter-spacing: .5px; }
    .vital-badge.good  { color: #16a34a; }
    .vital-badge.needs { color: #d97706; }
    .vital-badge.poor  { color: #dc2626; }

    .action-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .info-grid { display: flex; flex-direction: column; gap: 12px; }
    .info-row { display: flex; gap: 16px; padding: 12px; background: var(--bg-subtle, #f5f5f5); border-radius: 8px; font-size: .875rem; }
    .info-row span:first-child { font-weight: 600; min-width: 140px; }
    .link { color: var(--color-primary, #6366f1); text-decoration: none; }

    .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    .data-table th { text-align: left; padding: 10px 12px; font-weight: 600; background: var(--bg-subtle, #f5f5f5); white-space: nowrap; }
    .data-table td { padding: 10px 12px; border-bottom: 1px solid var(--border, #e5e7eb); vertical-align: middle; }
    .data-table tr:hover td { background: var(--bg-hover, #fafafa); }
    .trunc { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mono { font-family: monospace; font-size: .8125rem; }
    .empty-row { text-align: center; color: var(--text-muted); padding: 32px !important; }
    .empty { color: var(--text-muted); font-size: .875rem; }

    .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 100px; font-size: .75rem; font-weight: 600; }
    .badge-info { background: #ede9fe; color: #6d28d9; }
    .badge-ok   { background: #dcfce7; color: #166534; }
    .badge-warn { background: #fef3c7; color: #92400e; }
    .badge-muted{ background: #f3f4f6; color: #6b7280; }
    .has-img { color: #10b981; font-size: 18px; width: 18px; height: 18px; }
    .no-img  { color: #d1d5db; font-size: 18px; width: 18px; height: 18px; }

    .loading-bar { height: 3px; background: linear-gradient(90deg, var(--color-primary,#6366f1) 0%, transparent 100%); border-radius: 2px; margin-bottom: 12px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; border: none; transition: all 150ms; }
    .btn-primary { background: var(--color-primary, #6366f1); color: #fff; }
    .btn-primary:hover { filter: brightness(1.08); }
    .btn-outline { background: #fff; color: var(--color-primary, #6366f1); border: 1.5px solid var(--color-primary, #6366f1); }
    .icon-btn { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; display: inline-flex; color: var(--text-muted); transition: all 150ms; }
    .icon-btn:hover { background: var(--bg-hover, #f3f4f6); color: var(--text-primary); }
    .icon-btn.danger:hover { color: #ef4444; background: #fef2f2; }

    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 100; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; background: #fff; z-index: 101; display: flex; flex-direction: column; box-shadow: -4px 0 24px rgba(0,0,0,.15); }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--border, #e5e7eb); }
    .drawer-header h3 { margin: 0; font-size: 1rem; font-weight: 600; }
    .drawer-body { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .drawer-footer { padding: 16px 20px; border-top: 1px solid var(--border, #e5e7eb); display: flex; gap: 10px; justify-content: flex-end; }

    label { display: flex; flex-direction: column; gap: 6px; font-size: .875rem; font-weight: 500; }
    .form-input { width: 100%; padding: 8px 12px; border: 1.5px solid var(--border, #e5e7eb); border-radius: 8px; font-size: .875rem; outline: none; }
    .form-input:focus { border-color: var(--color-primary, #6366f1); }
    .checkbox-row { flex-direction: row; align-items: center; gap: 10px; font-weight: 500; }
  `],
})
export class AdminSeoComponent implements OnInit {
  readonly #http = inject(HttpClient);

  readonly tabs = [
    { id: 'overview',  label: 'Overview',  icon: 'dashboard' },
    { id: 'meta',      label: 'Meta Tags',  icon: 'label' },
    { id: 'redirects', label: 'Redirects',  icon: 'swap_horiz' },
    { id: 'sitemap',   label: 'Sitemap',    icon: 'map' },
  ];

  readonly activeTab     = signal('overview');
  readonly stats         = signal<SeoStats | null>(null);
  readonly vitals        = signal<VitalRow[]>([]);
  readonly metaRows      = signal<SeoMetaRow[]>([]);
  readonly redirectRows  = signal<RedirectRow[]>([]);
  readonly metaLoading   = signal(false);
  readonly redirectLoading = signal(false);
  readonly metaFormOpen  = signal(false);
  readonly redirectFormOpen = signal(false);
  readonly editingMeta   = signal<SeoMetaRow | null>(null);

  metaForm: Partial<SeoMetaRow> = {};
  redirectForm: Partial<RedirectRow> = { statusCode: 301 };

  ngOnInit(): void {
    this.#loadStats();
    this.#loadVitals();
    this.#loadMeta();
    this.#loadRedirects();
  }

  #loadStats(): void {
    this.#http.get<any>('/api/v1/admin/seo/stats').subscribe({
      next: r => this.stats.set(r.data ?? r),
      error: () => this.stats.set({ total: 0, noIndex: 0, withImage: 0, withKeywords: 0, coverageRate: 0 }),
    });
  }

  #loadVitals(): void {
    this.#http.get<any>('/api/v1/admin/seo/vitals').subscribe({
      next: r => this.vitals.set(r.data ?? r),
      error: () => {},
    });
  }

  #loadMeta(): void {
    this.metaLoading.set(true);
    this.#http.get<any>('/api/v1/admin/seo/meta').subscribe({
      next: r => { this.metaRows.set(r.data?.items ?? []); this.metaLoading.set(false); },
      error: () => this.metaLoading.set(false),
    });
  }

  #loadRedirects(): void {
    this.redirectLoading.set(true);
    this.#http.get<any>('/api/v1/admin/seo/redirects').subscribe({
      next: r => { this.redirectRows.set(r.data?.items ?? []); this.redirectLoading.set(false); },
      error: () => this.redirectLoading.set(false),
    });
  }

  openMetaForm(): void {
    this.editingMeta.set(null);
    this.metaForm = { entityType: 'page', noIndex: false };
    this.metaFormOpen.set(true);
  }

  editMeta(row: SeoMetaRow): void {
    this.editingMeta.set(row);
    this.metaForm = { ...row };
    this.metaFormOpen.set(true);
  }

  saveMeta(): void {
    const url = this.editingMeta()
      ? `/api/v1/admin/seo/meta/${this.editingMeta()!.id}`
      : '/api/v1/admin/seo/meta';
    const req$ = this.editingMeta()
      ? this.#http.put<any>(url, this.metaForm)
      : this.#http.post<any>(url, this.metaForm);
    req$.subscribe({
      next: () => { this.metaFormOpen.set(false); this.#loadMeta(); },
      error: () => {},
    });
  }

  deleteMeta(id: number): void {
    if (!confirm('Delete this SEO meta record?')) return;
    this.#http.delete(`/api/v1/admin/seo/meta/${id}`).subscribe({ next: () => this.#loadMeta() });
  }

  openRedirectForm(): void {
    this.redirectForm = { statusCode: 301 };
    this.redirectFormOpen.set(true);
  }

  saveRedirect(): void {
    this.#http.post<any>('/api/v1/admin/seo/redirects', this.redirectForm).subscribe({
      next: () => { this.redirectFormOpen.set(false); this.#loadRedirects(); },
      error: () => {},
    });
  }

  toggleRedirect(r: RedirectRow): void {
    this.#http.put(`/api/v1/admin/seo/redirects/${r.id}`, { isActive: !r.isActive }).subscribe({
      next: () => this.#loadRedirects(),
    });
  }

  deleteRedirect(id: number): void {
    if (!confirm('Delete this redirect rule?')) return;
    this.#http.delete(`/api/v1/admin/seo/redirects/${id}`).subscribe({ next: () => this.#loadRedirects() });
  }

  downloadSitemap(): void {
    window.open('/api/v1/sitemap.xml', '_blank');
  }

  vitalClass(v: VitalRow): string {
    const thresholds: Record<string, [number, number]> = {
      LCP: [2500, 4000], CLS: [0.1, 0.25], INP: [200, 500],
      FID: [100, 300], TTFB: [800, 1800], FCP: [1800, 3000],
    };
    const [good, poor] = thresholds[v.name] ?? [500, 1000];
    return v.p75 <= good ? 'good' : v.p75 <= poor ? 'needs' : 'poor';
  }

  vitalRating(v: VitalRow): string {
    const c = this.vitalClass(v);
    return c === 'good' ? 'Good' : c === 'needs' ? 'Needs Improvement' : 'Poor';
  }

  formatVital(v: VitalRow): string {
    return v.name === 'CLS' ? v.p75.toFixed(3) : `${v.p75}ms`;
  }
}

import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { SkeletonCardComponent } from '../../shared/components/skeleton/skeleton.component';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr.pipe';
import { ProductCarouselComponent } from '../../shared/components/product-carousel/product-carousel.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CmsService, Banner } from '../../core/services/cms.service';
import { AiService, AiProduct } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';
import { ProductService, Product } from '../../core/services/product.service';
import { SeoService } from '../../core/services/seo.service';
import { YouMayLikeComponent } from '../../shared/components/you-may-like/you-may-like.component';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'lg-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink, MatIconModule, SkeletonCardComponent, CurrencyInrPipe,
    ProductCarouselComponent, ProductCardComponent, YouMayLikeComponent,
  ],
  styles: [`
    :host { display: block; background: var(--bg-page, #edeae5); }

    /* ── Page outer wrapper ───────────────────────── */
    .page-wrap {
      max-width: 1280px;
      margin: 0 auto;
      padding: 12px 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    @media (min-width: 768px) { .page-wrap { padding: 16px 24px 32px; gap: 16px; } }

    /* ── White card wrapper (each major section) ──── */
    .w-card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,.05), 0 0 0 1px rgba(0,0,0,.03);
      overflow: hidden;
    }

    /* ── Section layout ───────────────────────────── */
    /* Inside .w-card sections, container removes extra side padding */
    .container { max-width: 100%; margin: 0; padding: 0; }

    /* ── Section heading ──────────────────────────── */
    .sec-heading {
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 3vw, 2.25rem);
      font-weight: 700;
      color: #111;
      text-align: center;
      letter-spacing: -0.02em;
      margin: 0 0 32px;
    }

    /* ──────────────────────────────────────────────── */
    /* HERO                                            */
    /* ──────────────────────────────────────────────── */
    .hero {
      background: #fff;
      border-radius: 24px;
      overflow: hidden;
      margin: 20px 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 420px;
      box-shadow: 0 2px 20px rgba(0,0,0,.06);
    }
    @media (max-width: 768px) {
      .hero { grid-template-columns: 1fr; margin: 12px 12px; }
    }

    .hero-text {
      display: flex; flex-direction: column; justify-content: center;
      padding: 56px 48px;
    }
    @media (max-width: 768px) { .hero-text { padding: 40px 28px 24px; } }

    .hero-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: #f0f7f1; color: #3d6b45;
      font-size: .75rem; font-weight: 700;
      letter-spacing: .08em; text-transform: uppercase;
      padding: 5px 14px; border-radius: 9999px;
      margin-bottom: 20px; width: fit-content;
    }

    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 700;
      color: #111;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin: 0 0 16px;
    }

    .hero-sub {
      font-size: 1rem;
      color: #666;
      line-height: 1.65;
      margin: 0 0 32px;
      max-width: 380px;
    }

    .hero-cta {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--color-primary, #3d6b45);
      color: #fff;
      font-size: .9375rem; font-weight: 700;
      padding: 14px 28px;
      border-radius: 9999px;
      text-decoration: none;
      transition: background 200ms, transform 200ms;
      width: fit-content;
    }
    .hero-cta:hover { background: var(--color-primary-dark, #2a4d31); transform: translateY(-1px); }

    .hero-trust {
      display: flex; flex-wrap: wrap; gap: 20px; margin-top: 28px;
    }
    .trust-pill {
      display: flex; align-items: center; gap: 6px;
      font-size: .8125rem; color: #555; font-weight: 500;
    }
    .trust-dot { width: 6px; height: 6px; border-radius: 50%; background: #3d6b45; flex-shrink: 0; }

    .hero-image {
      position: relative; overflow: hidden; background: #f0f7f1;
    }
    @media (max-width: 768px) { .hero-image { min-height: 260px; } }
    .hero-image img {
      width: 100%; height: 100%; object-fit: cover;
    }
    .hero-img-badge {
      position: absolute; top: 20px; left: 20px;
      background: rgba(255,255,255,.92);
      backdrop-filter: blur(8px);
      border-radius: 12px; padding: 10px 16px;
      font-size: .8125rem; font-weight: 700; color: #111;
    }
    .hero-img-badge span { color: #3d6b45; }

    /* ──────────────────────────────────────────────── */
    /* TRUST BAR                                       */
    /* ──────────────────────────────────────────────── */
    .trust-bar {
      display: flex; justify-content: center; flex-wrap: wrap;
      gap: 0;
    }
    .trust-bar-item {
      display: flex; align-items: center; gap: 10px;
      padding: 18px 32px;
      border-right: 1px solid #eee;
      flex: 1; min-width: 200px; justify-content: center;
    }
    .trust-bar-item:last-child { border-right: none; }
    .trust-bar-icon { color: #3d6b45; }
    .trust-bar-text strong { display: block; font-size: .875rem; font-weight: 700; color: #111; }
    .trust-bar-text span   { font-size: .75rem; color: #888; }

    /* ──────────────────────────────────────────────── */
    /* TOP CATEGORIES                                  */
    /* ──────────────────────────────────────────────── */
    .categories-section { padding: 48px 32px; }

    .cat-mosaic {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: 220px 220px;
      gap: 12px;
    }
    @media (max-width: 900px) {
      .cat-mosaic { grid-template-columns: 1fr 1fr; grid-template-rows: auto; }
      .cat-big { grid-column: span 2; height: 240px; }
    }
    @media (max-width: 600px) {
      .cat-mosaic { grid-template-columns: 1fr 1fr; }
      .cat-big { grid-column: span 2; }
    }

    .cat-big { grid-row: span 2; }

    .cat-tile {
      position: relative; overflow: hidden;
      border-radius: 16px; cursor: pointer;
      text-decoration: none;
      display: block;
    }
    .cat-tile img {
      width: 100%; height: 100%; object-fit: cover;
      transition: transform 500ms ease;
    }
    .cat-tile:hover img { transform: scale(1.06); }

    .cat-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 55%);
    }
    .cat-label {
      position: absolute; bottom: 14px; left: 14px; right: 14px;
    }
    .cat-chip {
      display: inline-block;
      background: rgba(255,255,255,.92);
      backdrop-filter: blur(6px);
      color: #111; font-size: .8125rem; font-weight: 700;
      padding: 5px 14px; border-radius: 9999px;
    }

    /* ──────────────────────────────────────────────── */
    /* MOST POPULAR (product cards)                    */
    /* ──────────────────────────────────────────────── */
    .popular-section { padding: 48px 32px; }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 900px) { .product-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 540px)  { .product-grid { grid-template-columns: 1fr 1fr; gap: 10px; } }

    .prod-card {
      position: relative; border-radius: 16px;
      overflow: hidden; background: #f5f2ee;
      cursor: pointer; text-decoration: none;
      display: block;
      transition: transform 250ms ease, box-shadow 250ms ease;
    }
    .prod-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,.1); }
    .prod-img-wrap {
      aspect-ratio: 3/4; overflow: hidden; position: relative;
    }
    .prod-img-wrap img {
      width: 100%; height: 100%; object-fit: cover;
      transition: transform 500ms ease;
    }
    .prod-card:hover .prod-img-wrap img { transform: scale(1.05); }

    .prod-actions {
      position: absolute; top: 12px; right: 12px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .prod-action-btn {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,.92);
      backdrop-filter: blur(6px);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #555; transition: background 150ms, color 150ms, transform 150ms;
      font-size: 0;
    }
    .prod-action-btn:hover { background: #fff; color: #111; transform: scale(1.1); }
    .prod-action-btn.active { color: #c0392b; }

    .prod-info {
      padding: 14px 14px 16px;
    }
    .prod-name {
      font-size: .9375rem; font-weight: 700; color: #111;
      margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .prod-meta {
      display: flex; align-items: center; justify-content: space-between;
    }
    .prod-price { font-size: 1rem; font-weight: 800; color: #111; }
    .prod-mrp   { font-size: .75rem; color: #aaa; text-decoration: line-through; margin-left: 6px; }
    .prod-rating {
      display: flex; align-items: center; gap: 3px;
      font-size: .75rem; color: #888; font-weight: 500;
    }

    .prod-discount {
      position: absolute; top: 12px; left: 12px;
      background: #3d6b45; color: #fff;
      font-size: .6875rem; font-weight: 800;
      padding: 3px 10px; border-radius: 9999px;
    }

    .skeleton-grid {
      display: grid; grid-template-columns: repeat(3,1fr); gap: 16px;
    }
    @media (max-width: 900px) { .skeleton-grid { grid-template-columns: repeat(2,1fr); } }

    .view-all-wrap { text-align: center; margin-top: 40px; }
    .view-all-btn {
      display: inline-flex; align-items: center; gap: 8px;
      border: 1.5px solid #111; color: #111;
      background: none; font-size: .9375rem; font-weight: 700;
      padding: 12px 36px; border-radius: 9999px; cursor: pointer;
      text-decoration: none;
      transition: background 200ms, color 200ms;
    }
    .view-all-btn:hover { background: #111; color: #fff; }

    /* ──────────────────────────────────────────────── */
    /* ABOUT US (bento grid)                           */
    /* ──────────────────────────────────────────────── */
    .about-section { padding: 48px 32px; }

    .about-bento {
      display: grid;
      grid-template-columns: 1fr 360px;
      grid-template-rows: 240px 240px;
      gap: 12px;
    }
    @media (max-width: 960px) {
      .about-bento { grid-template-columns: 1fr; grid-template-rows: auto; }
      .about-left  { grid-row: auto; }
    }

    .about-left {
      grid-row: span 2;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 12px;
    }

    .about-tile {
      position: relative; overflow: hidden; border-radius: 16px;
    }
    .about-tile.span2 { grid-column: span 2; }
    .about-tile img { width:100%; height:100%; object-fit:cover; transition: transform 500ms ease; }
    .about-tile:hover img { transform: scale(1.04); }
    .about-tile-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 50%);
    }
    .about-tile-label {
      position: absolute; bottom: 16px; left: 16px;
      font-family: var(--font-display);
      font-size: 1.125rem; font-weight: 700; color: #fff;
    }

    .about-right {
      display: flex; flex-direction: column; gap: 12px;
    }
    .about-story {
      background: #2d2d2d; border-radius: 16px; padding: 28px;
      flex: 1;
    }
    .about-story h3 {
      font-family: var(--font-display);
      font-size: 1.375rem; font-weight: 700; color: #fff; margin: 0 0 14px;
    }
    .about-story p {
      font-size: .9rem; color: rgba(255,255,255,.7); line-height: 1.7; margin: 0 0 12px;
    }
    .about-story p:last-child { margin: 0; }
    .about-story a {
      display: inline-flex; align-items: center; gap: 6px;
      color: #7dc98a; font-size: .875rem; font-weight: 700;
      text-decoration: none; margin-top: 8px;
    }

    /* ──────────────────────────────────────────────── */
    /* AI PROMO STRIP                                  */
    /* ──────────────────────────────────────────────── */
    .ai-strip {
      background: #fff; border-top: 1px solid #eee;
      border-bottom: 1px solid #eee; padding: 20px 24px;
    }
    .ai-strip-inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; gap: 16px;
      flex-wrap: wrap;
    }
    .ai-strip-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: #f0f7f1; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; color: #3d6b45;
    }
    .ai-strip-text { flex: 1; }
    .ai-strip-text strong { display: block; font-size: .9375rem; font-weight: 700; color: #111; margin-bottom: 2px; }
    .ai-strip-text span   { font-size: .8125rem; color: #888; }
    .ai-strip-cta {
      padding: 10px 24px; background: #111; color: #fff;
      border-radius: 9999px; font-size: .875rem; font-weight: 700;
      text-decoration: none; white-space: nowrap;
      transition: background 150ms;
    }
    .ai-strip-cta:hover { background: #3d6b45; }

    /* ──────────────────────────────────────────────── */
    /* NEW ARRIVALS                                    */
    /* ──────────────────────────────────────────────── */
    .arrivals-section { padding: 48px 32px; }

    /* ──────────────────────────────────────────────── */
    /* NEWSLETTER                                      */
    /* ──────────────────────────────────────────────── */
    .newsletter-section {
      position: relative; overflow: hidden;
      margin: 0; padding: 80px 24px;
      background: #1e3326;
    }
    .newsletter-bg {
      position: absolute; inset: 0;
      background-image: url('https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1400&h=600&fit=crop');
      background-size: cover; background-position: center;
      opacity: .18;
    }
    .newsletter-inner {
      position: relative; z-index: 1;
      max-width: 560px; margin: 0 auto; text-align: center;
    }
    .newsletter-inner h2 {
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 3vw, 2.25rem);
      font-weight: 700; color: #fff; letter-spacing: -0.02em;
      margin: 0 0 12px;
    }
    .newsletter-inner p { font-size: .9375rem; color: rgba(255,255,255,.65); margin: 0 0 32px; line-height: 1.6; }
    .newsletter-form {
      display: flex; gap: 8px; max-width: 420px; margin: 0 auto;
    }
    .newsletter-inp {
      flex: 1; height: 50px; padding: 0 20px;
      border: none; border-radius: 9999px;
      font-family: var(--font-sans); font-size: .9375rem;
      color: #111; background: rgba(255,255,255,.95);
      outline: none;
    }
    .newsletter-btn {
      height: 50px; padding: 0 24px;
      background: #3d6b45; color: #fff;
      border: none; border-radius: 9999px;
      font-family: var(--font-sans); font-size: .9375rem; font-weight: 700;
      cursor: pointer; white-space: nowrap;
      transition: background 150ms, transform 150ms;
    }
    .newsletter-btn:hover { background: #2a4d31; transform: translateY(-1px); }
    .newsletter-note { font-size: .75rem; color: rgba(255,255,255,.4); margin-top: 14px; }

    /* ──────────────────────────────────────────────── */
    /* BLOG                                            */
    /* ──────────────────────────────────────────────── */
    .blog-section { padding: 48px 32px; }
    .blog-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
    @media (max-width: 900px) { .blog-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 600px) { .blog-grid { grid-template-columns: 1fr; } }

    .blog-card {
      background: #fff; border-radius: 18px; overflow: hidden;
      text-decoration: none; display: block;
      border: 1px solid #efefef;
      transition: transform 250ms, box-shadow 250ms;
    }
    .blog-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,.09); }
    .blog-img { height: 190px; overflow: hidden; }
    .blog-img img { width:100%; height:100%; object-fit:cover; transition: transform 500ms ease; }
    .blog-card:hover .blog-img img { transform: scale(1.05); }
    .blog-body { padding: 18px 18px 20px; }
    .blog-tag {
      display: inline-block; background: #f0f7f1; color: #3d6b45;
      font-size: .6875rem; font-weight: 800; letter-spacing: .08em;
      text-transform: uppercase; padding: 3px 10px; border-radius: 9999px; margin-bottom: 10px;
    }
    .blog-title {
      font-size: .9375rem; font-weight: 700; color: #111;
      line-height: 1.45; margin: 0 0 8px;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .blog-read { font-size: .75rem; color: #aaa; font-weight: 500; }

    /* ──────────────────────────────────────────────── */
    /* SECTION header row                              */
    /* ──────────────────────────────────────────────── */
    .sec-row {
      display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 32px;
    }
    .sec-row-left .sec-sub {
      font-size: .75rem; font-weight: 800; letter-spacing: .1em;
      text-transform: uppercase; color: #3d6b45; margin: 0 0 6px;
    }
    .sec-row-left .sec-heading-left {
      font-family: var(--font-display);
      font-size: clamp(1.5rem, 2.5vw, 2rem);
      font-weight: 700; color: #111; letter-spacing: -0.02em; margin: 0;
    }
    .sec-row a {
      display: flex; align-items: center; gap: 4px;
      font-size: .875rem; font-weight: 700; color: #3d6b45;
      text-decoration: none;
    }
    .sec-row a:hover { text-decoration: underline; }
  `],
  template: `
  <div class="page-wrap">

    <!-- ═══════════════════════════════════════════════
         HERO — white card
    ═══════════════════════════════════════════════ -->
    <div class="w-card hero">
      <div class="hero-text">
        <div class="hero-badge">
          <span style="width:6px;height:6px;border-radius:50%;background:#3d6b45;flex-shrink:0"></span>
          10,000+ Happy Plant Parents
        </div>
        <h1 class="hero-title">
          Bring Nature<br>Home With Our<br>Finest Plants
        </h1>
        <p class="hero-sub">
          Explore our curated collection to discover the perfect plants for your unique space — delivered fresh with care.
        </p>
        <a routerLink="/products" class="hero-cta">
          Explore Collection
          <mat-icon style="font-size:18px;width:18px;height:18px">arrow_forward</mat-icon>
        </a>
        <div class="hero-trust">
          @for (t of trustPills; track t.label) {
            <div class="trust-pill">
              <span class="trust-dot"></span>
              {{ t.label }}
            </div>
          }
        </div>
      </div>
      <div class="hero-image">
        <img src="https://images.unsplash.com/photo-1545241047-6083a3684587?w=800&h=700&fit=crop&crop=center"
             alt="Beautiful indoor plants" />
        <div class="hero-img-badge">
          🌿 <span>Farm Fresh</span> · Guaranteed Healthy
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         TRUST BAR — white card
    ═══════════════════════════════════════════════ -->
    <div class="w-card trust-bar">
      @for (t of trustBar; track t.label) {
        <div class="trust-bar-item">
          <mat-icon class="trust-bar-icon" style="font-size:22px;width:22px;height:22px">{{ t.icon }}</mat-icon>
          <div class="trust-bar-text">
            <strong>{{ t.label }}</strong>
            <span>{{ t.sub }}</span>
          </div>
        </div>
      }
    </div>

    <!-- ═══════════════════════════════════════════════
         TOP CATEGORIES — white card
    ═══════════════════════════════════════════════ -->
    <section class="w-card categories-section">
      <div class="container">
        <h2 class="sec-heading">Top Categories</h2>

        <div class="cat-mosaic">
          <!-- Big left tile -->
          <a [routerLink]="['/products']" [queryParams]="{ category: 'indoor-plants' }"
             class="cat-tile cat-big">
            <img src="https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600&h=700&fit=crop&crop=center"
                 alt="Indoor Plants" loading="lazy" />
            <div class="cat-overlay"></div>
            <div class="cat-label"><span class="cat-chip">Indoor Plants</span></div>
          </a>
          <!-- Top-right tiles -->
          <a [routerLink]="['/products']" [queryParams]="{ category: 'pots-planters' }"
             class="cat-tile">
            <img src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=300&fit=crop"
                 alt="Pots & Planters" loading="lazy" />
            <div class="cat-overlay"></div>
            <div class="cat-label"><span class="cat-chip">Pots & Planters</span></div>
          </a>
          <a [routerLink]="['/products']" [queryParams]="{ category: 'succulents' }"
             class="cat-tile">
            <img src="https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=400&h=300&fit=crop"
                 alt="Succulents" loading="lazy" />
            <div class="cat-overlay"></div>
            <div class="cat-label"><span class="cat-chip">Succulents</span></div>
          </a>
          <!-- Bottom-right tiles -->
          <a [routerLink]="['/products']" [queryParams]="{ category: 'flowering-plants' }"
             class="cat-tile">
            <img src="https://images.unsplash.com/photo-1508022713622-df2d8fb7b4cd?w=400&h=300&fit=crop"
                 alt="Flowering Plants" loading="lazy" />
            <div class="cat-overlay"></div>
            <div class="cat-label"><span class="cat-chip">Flowering</span></div>
          </a>
          <a [routerLink]="['/products']" [queryParams]="{ category: 'plant-care' }"
             class="cat-tile">
            <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop"
                 alt="Plant Care" loading="lazy" />
            <div class="cat-overlay"></div>
            <div class="cat-label"><span class="cat-chip">Plant Care</span></div>
          </a>
        </div>

        <!-- Extra category chips row -->
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;justify-content:center">
          @for (cat of quickCats; track cat.slug) {
            <a [routerLink]="['/products']" [queryParams]="{ category: cat.slug }"
               style="display:inline-flex;align-items:center;gap:6px;padding:8px 18px;
                      background:#fff;border:1.5px solid #e5e5e5;border-radius:9999px;
                      font-size:.875rem;font-weight:600;color:#333;text-decoration:none;
                      transition:border-color 150ms,color 150ms">
              {{ cat.emoji }} {{ cat.label }}
            </a>
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         MOST POPULAR — white card
    ═══════════════════════════════════════════════ -->
    <section class="w-card popular-section">
      <div class="container">
        <h2 class="sec-heading">Most Popular</h2>

        @if (bestsellers().length === 0) {
          <div class="skeleton-grid">
            @for (i of [1,2,3]; track i) {
              <lg-skeleton-card></lg-skeleton-card>
            }
          </div>
        } @else {
          <div class="product-grid">
            @for (p of bestsellers().slice(0, 6); track p.id) {
              <a [routerLink]="['/products', p.slug]" class="prod-card">
                <div class="prod-img-wrap">
                  <img [src]="getImage(p)" [alt]="p.name" loading="lazy" />
                  <!-- Discount badge -->
                  @if (p.salePrice) {
                    <span class="prod-discount">{{ getDiscount(p) }}% OFF</span>
                  }
                  <!-- Action buttons -->
                  <div class="prod-actions" (click)="$event.preventDefault()">
                    <button class="prod-action-btn" (click)="toggleWishlist(p, $event)" title="Wishlist">
                      <mat-icon style="font-size:17px;width:17px;height:17px">favorite_border</mat-icon>
                    </button>
                    <button class="prod-action-btn" (click)="addToCart(p, $event)" title="Add to cart">
                      <mat-icon style="font-size:17px;width:17px;height:17px">shopping_bag</mat-icon>
                    </button>
                  </div>
                </div>
                <div class="prod-info">
                  <div class="prod-name">{{ p.name }}</div>
                  <div class="prod-meta">
                    <div>
                      <span class="prod-price">{{ getPrice(p) | currencyInr }}</span>
                      @if (p.salePrice) {
                        <span class="prod-mrp">{{ p.basePrice | currencyInr }}</span>
                      }
                    </div>
                    @if (p.reviewCount > 0) {
                      <div class="prod-rating">
                        <mat-icon style="font-size:12px;width:12px;height:12px;color:#f59e0b">star</mat-icon>
                        {{ p.rating }}
                      </div>
                    }
                  </div>
                </div>
              </a>
            }
          </div>
        }

        <div class="view-all-wrap">
          <a routerLink="/products" [queryParams]="{ sort: 'popular' }" class="view-all-btn">
            View All
          </a>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         ABOUT US — white card bento grid
    ═══════════════════════════════════════════════ -->
    <section class="w-card about-section">
      <div class="container">
        <h2 class="sec-heading">About Us</h2>

        <div class="about-bento">
          <!-- Left 2×2 grid -->
          <div class="about-left">
            <div class="about-tile span2">
              <img src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&h=320&fit=crop&crop=center"
                   alt="Exclusive Collections" loading="lazy" />
              <div class="about-tile-overlay"></div>
              <div class="about-tile-label">Exclusive Collections</div>
            </div>
            <div class="about-tile">
              <img src="https://images.unsplash.com/photo-1584479898061-15742e14f50d?w=400&h=280&fit=crop"
                   alt="Handmade Crafts" loading="lazy" />
              <div class="about-tile-overlay"></div>
              <div class="about-tile-label">Expert Nurseries</div>
            </div>
            <div class="about-tile">
              <img src="https://images.unsplash.com/photo-1516048015710-7a3b4c86be43?w=400&h=280&fit=crop"
                   alt="50+ Nurseries" loading="lazy" />
              <div class="about-tile-overlay"></div>
              <div class="about-tile-label">50+ Nursery Partners</div>
            </div>
          </div>

          <!-- Right: photo + story card -->
          <div class="about-right">
            <div class="about-tile" style="flex:1">
              <img src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=280&fit=crop"
                   alt="Happy plant parents" loading="lazy" />
              <div class="about-tile-overlay"></div>
              <div class="about-tile-label">Satisfied Customers</div>
            </div>
            <div class="about-story">
              <h3>Our Story</h3>
              <p>
                At Lagaao, we believe in the transformative power of living greenery. From easy-care beginner plants to rare collector varieties, our handpicked selection brings nature into every home.
              </p>
              <p>
                Discover the perfect plants that speak to your space. Welcome to Lagaao, where every leaf matters.
              </p>
              <a routerLink="/products">
                Shop Now <mat-icon style="font-size:16px;width:16px;height:16px">arrow_forward</mat-icon>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         AI STRIP — white card
    ═══════════════════════════════════════════════ -->
    <div class="w-card ai-strip">
      <div class="ai-strip-inner">
        <div class="ai-strip-icon">
          <mat-icon style="font-size:22px;width:22px;height:22px">psychology</mat-icon>
        </div>
        <div class="ai-strip-text">
          <strong>"Which plant suits my balcony?" — Just ask our AI</strong>
          <span>Describe your space, light conditions or mood — get personalised plant picks instantly.</span>
        </div>
        <a routerLink="/search" [queryParams]="{ ai: '1' }" class="ai-strip-cta">Try AI Search 🌿</a>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         NEW ARRIVALS — white card
    ═══════════════════════════════════════════════ -->
    <section class="w-card arrivals-section">
      <div class="container">
        <div class="sec-row">
          <div class="sec-row-left">
            <p class="sec-sub">Fresh Stock</p>
            <h2 class="sec-heading-left">New Arrivals</h2>
          </div>
          <a routerLink="/products" [queryParams]="{ sort: 'newest' }">
            View all <mat-icon style="font-size:16px;width:16px;height:16px">east</mat-icon>
          </a>
        </div>

        @if (newArrivals().length === 0) {
          <div class="skeleton-grid">
            @for (i of [1,2,3]; track i) { <lg-skeleton-card></lg-skeleton-card> }
          </div>
        } @else {
          <div class="product-grid">
            @for (p of newArrivals().slice(0, 3); track p.id) {
              <a [routerLink]="['/products', p.slug]" class="prod-card">
                <div class="prod-img-wrap">
                  <img [src]="getImage(p)" [alt]="p.name" loading="lazy" />
                  @if (p.salePrice) {
                    <span class="prod-discount">{{ getDiscount(p) }}% OFF</span>
                  }
                  <div class="prod-actions" (click)="$event.preventDefault()">
                    <button class="prod-action-btn" (click)="toggleWishlist(p, $event)">
                      <mat-icon style="font-size:17px;width:17px;height:17px">favorite_border</mat-icon>
                    </button>
                    <button class="prod-action-btn" (click)="addToCart(p, $event)">
                      <mat-icon style="font-size:17px;width:17px;height:17px">shopping_bag</mat-icon>
                    </button>
                  </div>
                </div>
                <div class="prod-info">
                  <div class="prod-name">{{ p.name }}</div>
                  <div class="prod-meta">
                    <span class="prod-price">{{ getPrice(p) | currencyInr }}</span>
                    @if (p.salePrice) { <span class="prod-mrp">{{ p.basePrice | currencyInr }}</span> }
                  </div>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         NEWSLETTER — dark rounded card
    ═══════════════════════════════════════════════ -->
    <section class="w-card newsletter-section">
      <div class="newsletter-bg"></div>
      <div class="newsletter-inner">
        <h2>Stay in the Loop for<br>Exclusive Offers!</h2>
        <p>Subscribe to our newsletter to be the first to receive exclusive offers. Discover what's trending and grow your plant collection with us.</p>
        <div class="newsletter-form">
          <input type="email" class="newsletter-inp" placeholder="Enter your email" />
          <button class="newsletter-btn">Subscribe</button>
        </div>
        <p class="newsletter-note">Unsubscribe anytime. No spam, ever.</p>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         BLOG — white card
    ═══════════════════════════════════════════════ -->
    <section class="w-card blog-section">
      <div class="container">
        <div class="sec-row">
          <div class="sec-row-left">
            <p class="sec-sub">Learn & Grow</p>
            <h2 class="sec-heading-left">Plant Care Blog</h2>
          </div>
          <a routerLink="/blog">
            All articles <mat-icon style="font-size:16px;width:16px;height:16px">east</mat-icon>
          </a>
        </div>
        <div class="blog-grid">
          @for (post of blogPreviews; track post.title) {
            <a [routerLink]="['/blog', post.slug]" class="blog-card">
              <div class="blog-img">
                <img [src]="post.image" [alt]="post.title" loading="lazy" />
              </div>
              <div class="blog-body">
                <span class="blog-tag">{{ post.tag }}</span>
                <h4 class="blog-title">{{ post.title }}</h4>
                <span class="blog-read">{{ post.readTime }}</span>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════
         AI RECOMMENDATIONS
    ═══════════════════════════════════════════════ -->
    @if (forYou().length > 0) {
      <section class="w-card" style="padding:40px 32px">
        <lg-product-carousel title="Picked For You" [products]="forYou()" viewAllLink="/search"></lg-product-carousel>
      </section>
    }
    @if (recentlyViewed().length > 0) {
      <section class="w-card" style="padding:40px 32px">
        <lg-product-carousel title="Recently Viewed" [products]="recentlyViewed()"></lg-product-carousel>
      </section>
    }

    <!-- YOU MAY LIKE -->
    <section class="w-card" style="padding:40px 32px">
      <lg-you-may-like title="Recommended For You" />
    </section>

  </div><!-- /page-wrap -->
  `,
})
export class HomeComponent implements OnInit {
  readonly #cms     = inject(CmsService);
  readonly #ai      = inject(AiService);
  readonly #auth    = inject(AuthService);
  readonly #product = inject(ProductService);
  readonly #seo     = inject(SeoService);
  readonly #cart    = inject(CartService);
  readonly #toast   = inject(ToastService);

  heroBanners    = signal<Banner[]>([]);
  midBanners     = signal<Banner[]>([]);
  activeBanner   = signal(0);
  forYou         = signal<AiProduct[]>([]);
  recentlyViewed = signal<AiProduct[]>([]);
  bestsellers    = signal<Product[]>([]);
  newArrivals    = signal<Product[]>([]);
  careProducts   = signal<Product[]>([]);
  comboProducts  = signal<Product[]>([]);

  readonly trustPills = [
    { label: '100% Healthy Plants' },
    { label: 'Free Delivery ₹499+' },
    { label: '7-Day Replacement' },
  ];

  readonly trustBar = [
    { icon: 'eco',            label: 'Farm Fresh Plants',  sub: 'Sourced from top nurseries' },
    { icon: 'local_shipping', label: 'Free Delivery',      sub: 'On orders above ₹499' },
    { icon: 'replay',         label: '7-Day Guarantee',    sub: 'Replace any unhealthy plant' },
    { icon: 'support_agent',  label: 'Expert Care Help',   sub: 'Available 7 days a week' },
  ];

  readonly quickCats = [
    { label: 'Outdoor Plants',  emoji: '🌳', slug: 'outdoor-plants' },
    { label: 'Seeds',           emoji: '🌱', slug: 'seeds' },
    { label: 'Gifts & Combos',  emoji: '🎁', slug: 'gifts-combos' },
    { label: 'Air Purifying',   emoji: '💨', slug: 'air-purifying' },
    { label: 'Pet Friendly',    emoji: '🐾', slug: 'pet-friendly' },
    { label: 'Low Maintenance', emoji: '⏱️', slug: 'low-maintenance' },
    { label: 'Medicinal',       emoji: '🌿', slug: 'medicinal' },
    { label: 'XL Plants',       emoji: '🌴', slug: 'xl-plants' },
  ];

  readonly blogPreviews = [
    {
      slug:     'how-to-care-for-indoor-plants',
      title:    "The Complete Beginner's Guide to Indoor Plant Care",
      tag:      'Plant Care',
      image:    'https://images.unsplash.com/photo-1545241047-6083a3684587?w=600&h=400&fit=crop',
      readTime: '5 min read',
    },
    {
      slug:     'best-air-purifying-plants',
      title:    '10 Best Air Purifying Plants for Your Home in 2024',
      tag:      'Indoor Plants',
      image:    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop',
      readTime: '4 min read',
    },
    {
      slug:     'how-to-water-plants',
      title:    'Stop Overwatering: The Right Way to Water Every Plant',
      tag:      'Tips & Tricks',
      image:    'https://images.unsplash.com/photo-1627424171666-8f35dc3c6a18?w=600&h=400&fit=crop',
      readTime: '3 min read',
    },
  ];

  ngOnInit() {
    this.#seo.setMeta({
      title:       'Lagaao — India\'s Premier Plant Store',
      description: 'Shop 1000+ indoor & outdoor plants, pots, seeds and care accessories. Free delivery above ₹499. 7-day plant guarantee.',
      canonical:   'https://lagaao.com/',
      type:        'website',
      keywords:    'buy plants online India, indoor plants, outdoor plants, succulents, Lagaao',
    });
    this.#seo.setOrganizationSchema();

    this.#cms.getBanners('hero').subscribe({ next: r => this.heroBanners.set(r.data), error: () => {} });
    this.#cms.getBanners('mid').subscribe({ next: r => this.midBanners.set(r.data), error: () => {} });
    this.#ai.getRecentlyViewed().subscribe({ next: r => this.recentlyViewed.set(r.data), error: () => {} });
    if (this.#auth.isLoggedIn()) {
      this.#ai.getForYou().subscribe({ next: r => this.forYou.set(r.data), error: () => {} });
    }
    this.#product.getProducts({ sort: 'rating', limit: 12 })
      .subscribe({ next: r => this.bestsellers.set(r.data), error: () => {} });
    this.#product.getProducts({ sort: 'newest', limit: 6 })
      .subscribe({ next: r => this.newArrivals.set(r.data), error: () => {} });
    this.#product.getProducts({ category: 'plant-care', sort: 'rating', limit: 10 })
      .subscribe({ next: r => this.careProducts.set(r.data), error: () => {} });
    this.#product.getProducts({ category: 'gifts-combos', sort: 'rating', limit: 8 })
      .subscribe({ next: r => this.comboProducts.set(r.data), error: () => {} });
  }

  getImage(p: Product): string {
    return this.#product.getPrimaryImage(p);
  }

  getPrice(p: Product): number {
    return this.#product.getEffectivePrice(p);
  }

  getDiscount(p: Product): number {
    return this.#product.getDiscountPct(p);
  }

  addToCart(p: Product, e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.#cart.addItem(p.id, null, 1).subscribe({
      next: () => this.#toast.success('Added to cart', p.name),
      error: err => this.#toast.error('Error', err?.error?.message ?? 'Could not add'),
    });
  }

  toggleWishlist(_p: Product, e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.#toast.info('Coming soon', 'Wishlist feature is on its way!');
  }

  prevBanner(): void { this.activeBanner.update(i => i > 0 ? i - 1 : this.heroBanners().length - 1); }
  nextBanner(): void { this.activeBanner.update(i => i < this.heroBanners().length - 1 ? i + 1 : 0); }
}

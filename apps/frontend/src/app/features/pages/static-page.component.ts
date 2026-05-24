import {
  Component, ChangeDetectionStrategy, OnInit, signal, inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'lg-static-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, ReactiveFormsModule],
  styles: [`
    :host { display: block; }

    /* ── Hero ─────────────────────────────────────────────── */
    .page-hero {
      background: linear-gradient(135deg,#1a3320 0%,#2a5232 50%,#3d6b45 100%);
      padding: 72px 24px 64px; text-align: center; position: relative; overflow: hidden;
    }
    .page-hero::before {
      content:''; position:absolute; inset:0; opacity:.06;
      background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='30' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3Cpath d='M40 10 Q60 40 40 70 Q20 40 40 10Z' fill='%23ffffff'/%3E%3C/svg%3E");
      background-size: 80px 80px;
    }
    .hero-badge {
      display:inline-flex; align-items:center; gap:6px;
      background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.22);
      border-radius:999px; padding:5px 16px;
      font-size:.75rem; font-weight:700; color:rgba(255,255,255,.9);
      margin-bottom:18px; letter-spacing:.08em; text-transform:uppercase; position:relative;
    }
    .hero-title {
      font-family:var(--font-display); font-size:clamp(2rem,4.5vw,3.25rem);
      font-weight:700; color:#fff; margin:0 0 14px; line-height:1.2; position:relative;
    }
    .hero-sub {
      font-size:1.0625rem; color:rgba(255,255,255,.72);
      max-width:580px; margin:0 auto; line-height:1.75; position:relative;
    }
    .hero-chips { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:24px; position:relative; }
    .hero-chip {
      display:inline-flex; align-items:center; gap:5px;
      background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.18);
      border-radius:999px; padding:5px 14px; font-size:.8125rem; color:rgba(255,255,255,.82);
    }

    /* ── Layout ───────────────────────────────────────────── */
    .content { max-width:960px; margin:0 auto; padding:56px 24px; }

    /* ── Cards ───────────────────────────────────────────── */
    .card {
      background:var(--bg-base); border:1px solid var(--border-default);
      border-radius:20px; padding:32px; margin-bottom:24px;
    }
    .card-accent {
      background:linear-gradient(135deg,rgba(61,107,69,.06),rgba(61,107,69,.02));
      border-color:rgba(61,107,69,.22);
    }
    .card-amber {
      background:linear-gradient(135deg,rgba(245,158,11,.06),rgba(245,158,11,.02));
      border-color:rgba(245,158,11,.25);
    }
    .grid-2 { display:grid; gap:20px; }
    .grid-3 { display:grid; gap:20px; }
    @media(min-width:640px){ .grid-2{grid-template-columns:1fr 1fr} }
    @media(min-width:768px){ .grid-3{grid-template-columns:1fr 1fr 1fr} }

    /* ── Typography ──────────────────────────────────────── */
    .sec-label {
      font-size:.75rem; font-weight:700; color:var(--color-sage);
      text-transform:uppercase; letter-spacing:.1em; margin-bottom:8px;
    }
    .sec-title {
      font-family:var(--font-display); font-size:1.625rem; font-weight:700;
      color:var(--text-primary); margin:0 0 18px; line-height:1.3;
    }
    .lead { font-size:1.0625rem; color:var(--text-secondary); line-height:1.8; margin-bottom:18px; }
    p { color:var(--text-secondary); line-height:1.8; margin-bottom:14px; }
    p:last-child { margin-bottom:0; }
    h3 { font-size:1.0625rem; font-weight:700; color:var(--text-primary); margin:24px 0 10px; }
    h3:first-child { margin-top:0; }
    ul { color:var(--text-secondary); line-height:1.8; padding-left:20px; margin-bottom:14px; }
    li { margin-bottom:6px; }
    a.link { color:var(--color-primary); font-weight:600; text-decoration:none; }
    a.link:hover { text-decoration:underline; }

    /* ── Stat cards ──────────────────────────────────────── */
    .stat { text-align:center; padding:28px 16px; background:var(--bg-base); border:1px solid var(--border-default); border-radius:18px; }
    .stat-num { font-size:2.25rem; font-weight:800; color:var(--color-primary); font-family:var(--font-display); line-height:1; }
    .stat-lbl { font-size:.875rem; color:var(--text-muted); margin-top:6px; }

    /* ── Icon box ────────────────────────────────────────── */
    .icon-box { width:52px; height:52px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; background:var(--bg-subtle); margin-bottom:16px; }

    /* ── Timeline ────────────────────────────────────────── */
    .tl { display:flex; flex-direction:column; gap:0; }
    .tl-item { display:flex; gap:20px; padding-bottom:32px; position:relative; }
    .tl-item:last-child { padding-bottom:0; }
    .tl-item::before { content:''; position:absolute; left:19px; top:40px; bottom:0; width:2px; background:var(--border-default); }
    .tl-item:last-child::before { display:none; }
    .tl-dot { width:40px; height:40px; border-radius:50%; background:var(--color-primary); color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:.875rem; font-weight:800; z-index:1; }
    .tl-body h4 { font-weight:700; color:var(--text-primary); margin:6px 0 4px; }
    .tl-body p { font-size:.9375rem; color:var(--text-secondary); line-height:1.7; margin:0; }
    .tl-year { font-size:.75rem; font-weight:700; color:var(--color-sage); text-transform:uppercase; letter-spacing:.06em; }

    /* ── Contact cards ───────────────────────────────────── */
    .contact-card { display:flex; align-items:flex-start; gap:16px; padding:22px; background:var(--bg-base); border:1.5px solid var(--border-default); border-radius:16px; transition:border-color 150ms; }
    .contact-card:hover { border-color:var(--color-primary); }
    .c-icon { width:48px; height:48px; border-radius:14px; flex-shrink:0; background:linear-gradient(135deg,var(--color-primary) 0%,#2a5232 100%); display:flex; align-items:center; justify-content:center; color:#fff; }
    .c-title { font-weight:700; color:var(--text-primary); margin-bottom:3px; }
    .c-val { color:var(--color-primary); font-weight:600; font-size:.9375rem; text-decoration:none; display:block; }
    .c-val:hover { text-decoration:underline; }
    .c-note { font-size:.8125rem; color:var(--text-muted); margin-top:3px; }

    /* ── Form ────────────────────────────────────────────── */
    .field { margin-bottom:16px; }
    .field label { display:block; font-size:.8125rem; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
    .inp { width:100%; height:46px; padding:0 14px; border:1.5px solid var(--border-default); border-radius:12px; font-family:var(--font-sans); font-size:.9375rem; color:var(--text-primary); background:var(--bg-subtle); outline:none; transition:border-color 150ms; box-sizing:border-box; }
    .inp:focus { border-color:var(--color-primary); background:var(--bg-base); }
    textarea.inp { height:130px; padding:12px 14px; resize:vertical; }
    select.inp { cursor:pointer; }
    .success-box { padding:14px 18px; background:rgba(61,107,69,.08); border:1px solid rgba(61,107,69,.22); border-radius:12px; color:var(--color-primary); font-weight:600; margin-bottom:16px; }

    /* ── Buttons ─────────────────────────────────────────── */
    .btn { display:inline-flex; align-items:center; gap:8px; padding:12px 28px; border:none; border-radius:12px; font-weight:700; font-size:.9375rem; cursor:pointer; transition:background 150ms,transform 150ms; text-decoration:none; }
    .btn-primary { background:var(--color-primary); color:#fff; }
    .btn-primary:hover { background:var(--color-primary-dark); transform:translateY(-1px); }
    .btn-outline { background:var(--bg-subtle); color:var(--text-primary); border:1.5px solid var(--border-default); }
    .btn-outline:hover { border-color:var(--color-primary); color:var(--color-primary); }

    /* ── Policy ──────────────────────────────────────────── */
    .policy-sec { margin-bottom:36px; }
    .policy-sec h2 { font-size:1.125rem; font-weight:800; color:var(--text-primary); margin:0 0 12px; padding-bottom:10px; border-bottom:2px solid var(--border-default); }

    /* ── Job card ────────────────────────────────────────── */
    .job { border:1.5px solid var(--border-default); border-radius:16px; padding:24px; background:var(--bg-base); transition:border-color 150ms,box-shadow 150ms; }
    .job:hover { border-color:var(--color-primary); box-shadow:0 4px 20px rgba(61,107,69,.1); }
    .tag { display:inline-flex; align-items:center; gap:4px; font-size:.75rem; font-weight:600; padding:3px 10px; border-radius:999px; margin-right:6px; }
    .tag-green { background:rgba(61,107,69,.1); color:var(--color-primary); }
    .tag-blue  { background:rgba(59,130,246,.1); color:#3b82f6; }
    .tag-gray  { background:var(--bg-subtle); color:var(--text-secondary); }

    /* ── Care guide ──────────────────────────────────────── */
    .care-card { display:flex; gap:20px; align-items:flex-start; padding:28px; background:var(--bg-base); border:1px solid var(--border-default); border-radius:18px; margin-bottom:20px; }
    .care-emoji { font-size:2.5rem; flex-shrink:0; line-height:1; }
    .care-title { font-size:1.0625rem; font-weight:800; color:var(--text-primary); margin:0 0 10px; }

    /* ── Alert / highlight boxes ─────────────────────────── */
    .highlight { padding:20px 24px; border-radius:16px; margin-bottom:24px; }
    .highlight.green { background:rgba(61,107,69,.07); border:1px solid rgba(61,107,69,.2); }
    .highlight.amber { background:rgba(245,158,11,.07); border:1px solid rgba(245,158,11,.25); }
    .highlight.red   { background:rgba(239,68,68,.06);  border:1px solid rgba(239,68,68,.2);  }
    .highlight h4 { font-weight:800; margin:0 0 8px; }
    .highlight.green h4 { color:var(--color-primary); }
    .highlight.amber h4 { color:#b45309; }
    .highlight.red   h4 { color:#dc2626; }

    /* ── Divider ─────────────────────────────────────────── */
    .divider { height:1px; background:var(--border-default); margin:32px 0; }

    /* ── Breadcrumb ──────────────────────────────────────── */
    .bc { display:flex; align-items:center; gap:6px; font-size:.8125rem; color:var(--text-muted); margin-bottom:32px; }
    .bc a { color:var(--color-primary); text-decoration:none; }
    .bc a:hover { text-decoration:underline; }

    /* ── FAQ ─────────────────────────────────────────────── */
    .faq { border:1px solid var(--border-default); border-radius:16px; overflow:hidden; margin-bottom:24px; }
    .faq-item { padding:20px 24px; border-bottom:1px solid var(--border-default); }
    .faq-item:last-child { border-bottom:none; }
    .faq-q { font-weight:700; color:var(--text-primary); margin-bottom:8px; display:flex; gap:12px; align-items:flex-start; }
    .faq-num { min-width:28px; height:28px; background:rgba(61,107,69,.1); color:var(--color-primary); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:.8125rem; font-weight:800; flex-shrink:0; }
    .faq-a { color:var(--text-secondary); line-height:1.75; font-size:.9375rem; margin:0; }

    /* ── Team card ───────────────────────────────────────── */
    .team-card { text-align:center; padding:28px 20px; background:var(--bg-base); border:1px solid var(--border-default); border-radius:18px; }
    .avatar { width:80px; height:80px; border-radius:50%; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; font-size:1.75rem; font-weight:800; color:#fff; }
    .team-name { font-weight:700; color:var(--text-primary); margin-bottom:3px; }
    .team-role { font-size:.875rem; color:var(--color-sage); font-weight:600; margin-bottom:8px; }
    .team-bio { font-size:.8125rem; color:var(--text-muted); line-height:1.6; }

    /* ── Testimonial ─────────────────────────────────────── */
    .testimonial { background:var(--bg-base); border:1px solid var(--border-default); border-radius:18px; padding:28px; }
    .stars { color:#f59e0b; letter-spacing:2px; margin-bottom:10px; }
    .review-text { font-size:.9375rem; color:var(--text-secondary); line-height:1.75; font-style:italic; margin-bottom:14px; }
    .reviewer { display:flex; align-items:center; gap:10px; }
    .rev-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; color:#fff; font-size:.875rem; }
    .rev-name { font-weight:700; color:var(--text-primary); font-size:.875rem; }
    .rev-city { font-size:.75rem; color:var(--text-muted); }

    /* ── Table ───────────────────────────────────────────── */
    .tbl { width:100%; border-collapse:collapse; margin-bottom:0; }
    .tbl th { text-align:left; font-size:.8125rem; font-weight:700; color:var(--text-secondary); padding:10px 16px; background:var(--bg-subtle); border-bottom:1px solid var(--border-default); }
    .tbl td { padding:12px 16px; border-bottom:1px solid var(--border-default); font-size:.9375rem; color:var(--text-secondary); }
    .tbl tr:last-child td { border-bottom:none; }
    .tbl-wrap { border:1px solid var(--border-default); border-radius:14px; overflow:hidden; margin-bottom:24px; }

    /* ── CTA strip ───────────────────────────────────────── */
    .cta-strip { background:linear-gradient(135deg,#1a3320 0%,#2a5232 100%); border-radius:20px; padding:40px; text-align:center; }
    .cta-strip h3 { font-family:var(--font-display); font-size:1.5rem; font-weight:700; color:#fff; margin:0 0 10px; }
    .cta-strip p  { color:rgba(255,255,255,.7); margin:0 auto 24px; max-width:480px; font-size:.9375rem; line-height:1.7; }
    .cta-strip .btn-primary { background:#fff; color:var(--color-primary); }
    .cta-strip .btn-primary:hover { background:rgba(255,255,255,.9); }
  `],
  template: `
    @switch (slug()) {

      <!-- ══════════════════════════════════════════════════════════
           ABOUT
      ══════════════════════════════════════════════════════════ -->
      @case ('about') {
        <div class="page-hero">
          <div class="hero-badge">🌿 Our Story</div>
          <h1 class="hero-title">Growing India, One Plant at a Time</h1>
          <p class="hero-sub">Started in a small Pune apartment, Lagaao has grown into one of India's most-loved online plant destinations — built by plant lovers, for plant lovers.</p>
          <div class="hero-chips">
            <span class="hero-chip">🌱 Est. 2023, Pune</span>
            <span class="hero-chip">🚚 50+ Cities</span>
            <span class="hero-chip">🌿 1,000+ Varieties</span>
            <span class="hero-chip">⭐ 4.8/5 Average Rating</span>
          </div>
        </div>

        <div class="content">
          <div class="bc">
            <a routerLink="/">Home</a>
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
            About Us
          </div>

          <!-- Stats row -->
          <div class="grid-3" style="margin-bottom:40px">
            <div class="stat"><div class="stat-num">10,000+</div><div class="stat-lbl">Happy Plant Parents</div></div>
            <div class="stat"><div class="stat-num">1,000+</div><div class="stat-lbl">Plant Varieties</div></div>
            <div class="stat"><div class="stat-num">4.8 ★</div><div class="stat-lbl">Average Customer Rating</div></div>
            <div class="stat"><div class="stat-num">50+</div><div class="stat-lbl">Cities Delivered To</div></div>
            <div class="stat"><div class="stat-num">97%</div><div class="stat-lbl">Plants Arrive Healthy</div></div>
            <div class="stat"><div class="stat-num">24 hrs</div><div class="stat-lbl">Average Dispatch Time</div></div>
          </div>

          <!-- Our story -->
          <div class="card">
            <div class="sec-label">The Beginning</div>
            <div class="sec-title">A Balcony That Started It All</div>
            <p class="lead">In 2023, our founder Arjun Mehta covered every inch of his Pune apartment balcony with plants — and kept getting calls from neighbours asking where he bought them. That's when Lagaao was born.</p>
            <p>What started as WhatsApp orders to friends quickly became something bigger. Within three months, Arjun was sourcing plants directly from nurseries in Nashik, Mysore, and Chennai — cutting out middlemen, which meant fresher plants at lower prices for customers.</p>
            <p>The name "Lagaao" (लगाओ) is a Hindi word meaning <em>"plant it"</em> — a simple, joyful instruction that captures our entire mission. We want every Indian home to have that one corner that smells of fresh earth and green leaves.</p>
            <p>Today, Lagaao works with 35+ verified nurseries across India, ships to 50+ cities, and has helped over 10,000 families build their dream green spaces. Our AI-powered plant recommendation engine was a first in India — describe your room and lighting, and we'll tell you exactly which plants will thrive.</p>
          </div>

          <!-- Timeline -->
          <div class="card" style="margin-bottom:40px">
            <div class="sec-label">Our Journey</div>
            <div class="sec-title">How We Grew</div>
            <div class="tl">
              <div class="tl-item">
                <div class="tl-dot">1</div>
                <div class="tl-body">
                  <div class="tl-year">January 2023</div>
                  <h4>The First Delivery</h4>
                  <p>Arjun delivers 12 money plants to neighbours in hand-decorated clay pots with handwritten care cards. Every single one survives and thrives. Word spreads on the building's WhatsApp group.</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-dot">2</div>
                <div class="tl-body">
                  <div class="tl-year">April 2023</div>
                  <h4>Lagaao.com Goes Live</h4>
                  <p>The website launches with 80 plant varieties. First 100 orders come in within 10 days, mostly from Mumbai and Pune. The team is three people: Arjun, his sister Meera (who handles packaging), and college friend Rohan (tech).</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-dot">3</div>
                <div class="tl-body">
                  <div class="tl-year">August 2023</div>
                  <h4>The 7-Day Guarantee</h4>
                  <p>After a few plants arrive stressed from summer transit, we introduce India's most generous plant guarantee — full replacement if your plant doesn't thrive within 7 days, no questions asked. Return rate drops to under 3%.</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-dot">4</div>
                <div class="tl-body">
                  <div class="tl-year">December 2023</div>
                  <h4>Pan-India Expansion</h4>
                  <p>Partnerships with logistics partners who understand living goods. Special eco-packaging developed: coco husk cushioning, moist root wrapping, perforated cardboard for airflow. Delivered to 50+ cities without a single dead-on-arrival plant.</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-dot">5</div>
                <div class="tl-body">
                  <div class="tl-year">2024</div>
                  <h4>AI Plant Advisor & Marketplace</h4>
                  <p>Launched India's first AI plant recommendation engine. Opened the platform to verified seller-nurseries across India, expanding the catalogue to 1,000+ varieties while maintaining our quality standards.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Values -->
          <div style="margin-bottom:40px">
            <div class="sec-label" style="text-align:center">What Drives Us</div>
            <div class="sec-title" style="text-align:center">Our Core Values</div>
            <div class="grid-3">
              @for (v of values; track v.title) {
                <div class="card" style="margin-bottom:0;text-align:center">
                  <div class="icon-box" style="margin:0 auto 14px">{{ v.emoji }}</div>
                  <h3 style="text-align:center;margin:0 0 8px">{{ v.title }}</h3>
                  <p style="font-size:.875rem;margin:0;text-align:center">{{ v.desc }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Team -->
          <div style="margin-bottom:40px">
            <div class="sec-label" style="text-align:center">The People</div>
            <div class="sec-title" style="text-align:center">Meet the Core Team</div>
            <div class="grid-3">
              @for (t of team; track t.name) {
                <div class="team-card">
                  <div class="avatar" [style.background]="t.color">{{ t.initials }}</div>
                  <div class="team-name">{{ t.name }}</div>
                  <div class="team-role">{{ t.role }}</div>
                  <div class="team-bio">{{ t.bio }}</div>
                </div>
              }
            </div>
          </div>

          <!-- Testimonials -->
          <div style="margin-bottom:40px">
            <div class="sec-label" style="text-align:center">What They Say</div>
            <div class="sec-title" style="text-align:center">Our Happiest Plant Parents</div>
            <div class="grid-3">
              @for (r of reviews; track r.name) {
                <div class="testimonial">
                  <div class="stars">★★★★★</div>
                  <div class="review-text">"{{ r.text }}"</div>
                  <div class="reviewer">
                    <div class="rev-avatar" [style.background]="r.color">{{ r.initials }}</div>
                    <div>
                      <div class="rev-name">{{ r.name }}</div>
                      <div class="rev-city">{{ r.city }}</div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- CTA -->
          <div class="cta-strip">
            <h3>Ready to Start Your Plant Journey?</h3>
            <p>Join 10,000+ plant parents across India who trust Lagaao for healthy, beautiful plants delivered to their door.</p>
            <a routerLink="/products" class="btn btn-primary">
              <mat-icon style="font-size:18px;width:18px;height:18px">local_florist</mat-icon>
              Shop Our Plants
            </a>
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════
           CONTACT
      ══════════════════════════════════════════════════════════ -->
      @case ('contact') {
        <div class="page-hero">
          <div class="hero-badge">💬 We're Here For You</div>
          <h1 class="hero-title">Contact Us</h1>
          <p class="hero-sub">A real plant expert will respond — not a bot. We typically reply within 2–4 hours on WhatsApp and within 24 hours on email.</p>
          <div class="hero-chips">
            <span class="hero-chip">⏱ 2–4 hr WhatsApp response</span>
            <span class="hero-chip">📧 24 hr email response</span>
            <span class="hero-chip">🕘 Mon–Sat, 9am–8pm IST</span>
          </div>
        </div>

        <div class="content">
          <div class="bc">
            <a routerLink="/">Home</a>
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
            Contact Us
          </div>

          <!-- Contact channels -->
          <div class="grid-2" style="margin-bottom:32px">
            <a href="https://wa.me/919834656144" target="_blank" rel="noopener" style="text-decoration:none">
              <div class="contact-card">
                <div class="c-icon"><mat-icon>chat</mat-icon></div>
                <div>
                  <div class="c-title">WhatsApp — Fastest</div>
                  <span class="c-val">+91 98346 56144</span>
                  <div class="c-note">Mon–Sat · 9am–8pm · Usually replies in under 1 hour</div>
                </div>
              </div>
            </a>
            <a href="mailto:info@lagaao.com" style="text-decoration:none">
              <div class="contact-card">
                <div class="c-icon"><mat-icon>mail_outline</mat-icon></div>
                <div>
                  <div class="c-title">Email</div>
                  <span class="c-val">info&#64;lagaao.com</span>
                  <div class="c-note">Detailed queries, returns, bulk orders · Replies within 24 hrs</div>
                </div>
              </div>
            </a>
            <a href="https://www.instagram.com/lagaao.official/" target="_blank" rel="noopener" style="text-decoration:none">
              <div class="contact-card">
                <div class="c-icon"><mat-icon>photo_camera</mat-icon></div>
                <div>
                  <div class="c-title">Instagram</div>
                  <span class="c-val">&#64;lagaao.official</span>
                  <div class="c-note">DMs open · Tag us in your shelfies for a feature!</div>
                </div>
              </div>
            </a>
            <a routerLink="/orders" style="text-decoration:none">
              <div class="contact-card">
                <div class="c-icon"><mat-icon>local_shipping</mat-icon></div>
                <div>
                  <div class="c-title">Track My Order</div>
                  <span class="c-val">Visit Order Tracking →</span>
                  <div class="c-note">Real-time status · Login with your account</div>
                </div>
              </div>
            </a>
            <div class="contact-card">
              <div class="c-icon"><mat-icon>location_on</mat-icon></div>
              <div>
                <div class="c-title">Office Address</div>
                <div style="font-size:.9375rem;color:var(--text-secondary);line-height:1.6">
                  Lagaao.com<br>
                  Near Baner Road, Pune<br>
                  Maharashtra – 411045
                </div>
                <div class="c-note">Not open for walk-ins · Email before visiting</div>
              </div>
            </div>
            <div class="contact-card">
              <div class="c-icon"><mat-icon>schedule</mat-icon></div>
              <div>
                <div class="c-title">Support Hours</div>
                <div style="font-size:.9375rem;color:var(--text-secondary);line-height:1.8">
                  Mon–Fri: 9:00 AM – 8:00 PM<br>
                  Saturday: 10:00 AM – 6:00 PM<br>
                  Sunday: 10:00 AM – 2:00 PM (WhatsApp only)
                </div>
              </div>
            </div>
          </div>

          <!-- Topics -->
          <div class="card" style="margin-bottom:32px">
            <div class="sec-label">Common Topics</div>
            <div class="sec-title">How Can We Help?</div>
            <div class="grid-2">
              @for (t of contactTopics; track t.title) {
                <div style="display:flex;gap:12px;align-items:flex-start">
                  <span style="font-size:1.5rem;flex-shrink:0">{{ t.emoji }}</span>
                  <div>
                    <div style="font-weight:700;color:var(--text-primary);margin-bottom:3px">{{ t.title }}</div>
                    <div style="font-size:.875rem;color:var(--text-muted)">{{ t.desc }}</div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Contact form -->
          <div class="card">
            <div class="sec-label">Message Us</div>
            <div class="sec-title">Send a Detailed Message</div>
            <p>Fill in the form below and our team will get back to you within 24 hours. For urgent matters, please WhatsApp us directly.</p>

            <form [formGroup]="contactForm" (ngSubmit)="submitContact()">
              <div class="grid-2">
                <div class="field">
                  <label>Your Name *</label>
                  <input class="inp" formControlName="name" placeholder="Priya Sharma" />
                </div>
                <div class="field">
                  <label>Email Address *</label>
                  <input class="inp" type="email" formControlName="email" placeholder="priya@gmail.com" />
                </div>
              </div>
              <div class="grid-2">
                <div class="field">
                  <label>Phone Number</label>
                  <input class="inp" formControlName="phone" placeholder="+91 98765 43210" />
                </div>
                <div class="field">
                  <label>Topic</label>
                  <select class="inp" formControlName="topic">
                    <option value="">Select a topic…</option>
                    <option>Order Status / Tracking</option>
                    <option>Plant Arrived Damaged</option>
                    <option>Return or Replacement</option>
                    <option>Plant Care Advice</option>
                    <option>Bulk / Corporate Order</option>
                    <option>Vendor / Seller Inquiry</option>
                    <option>Website Issue</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Order Number (if applicable)</label>
                <input class="inp" formControlName="orderNo" placeholder="LG-2024-XXXXX" />
              </div>
              <div class="field">
                <label>Your Message *</label>
                <textarea class="inp" formControlName="message" placeholder="Tell us everything — the more detail, the faster we can help you…"></textarea>
              </div>

              @if (contactSent()) {
                <div class="success-box">
                  ✅ Message received! We'll reply to {{ contactForm.value.email }} within 24 hours. For urgent help, WhatsApp +91 98346 56144.
                </div>
              }

              <button type="submit" class="btn btn-primary" [disabled]="contactForm.invalid">
                <mat-icon style="font-size:18px;width:18px;height:18px">send</mat-icon>
                Send Message
              </button>
            </form>
          </div>

          <!-- FAQ -->
          <div class="sec-label" style="margin-top:40px">Quick Answers</div>
          <div class="sec-title">Frequently Asked Questions</div>
          <div class="faq">
            @for (faq of contactFAQs; track faq.q; let i = $index) {
              <div class="faq-item">
                <div class="faq-q">
                  <span class="faq-num">{{ i + 1 }}</span>
                  {{ faq.q }}
                </div>
                <p class="faq-a">{{ faq.a }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════
           RETURNS & REFUNDS
      ══════════════════════════════════════════════════════════ -->
      @case ('returns') {
        <div class="page-hero">
          <div class="hero-badge">🔄 Zero Risk Shopping</div>
          <h1 class="hero-title">Returns & Refunds</h1>
          <p class="hero-sub">Every plant is covered by our 7-day health guarantee. If something's wrong, we replace it — full stop. No questions, no arguments.</p>
          <div class="hero-chips">
            <span class="hero-chip">✅ 7-Day Replacement</span>
            <span class="hero-chip">💸 Full Refunds in 5–7 days</span>
            <span class="hero-chip">📸 Just send a photo</span>
          </div>
        </div>

        <div class="content">
          <div class="bc">
            <a routerLink="/">Home</a>
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
            Returns & Refunds
          </div>

          <!-- Guarantee highlight -->
          <div class="highlight green" style="margin-bottom:32px">
            <h4>🌿 Our 7-Day Plant Health Guarantee</h4>
            <p style="margin:0;color:var(--text-secondary);line-height:1.7">Every plant sold on Lagaao is guaranteed to arrive alive and healthy. If your plant is wilted, diseased, broken, or simply disappoints — contact us within 7 days of delivery with a photo, and we will send you a free replacement. No lengthy forms, no courier pickup, no headaches.</p>
          </div>

          <!-- What's covered -->
          <div class="card" style="margin-bottom:24px">
            <h3>✅ What's Covered Under Our Guarantee</h3>
            <ul>
              <li><strong>Damaged in transit:</strong> Broken stems, uprooted plants, crushed pots — if it got damaged during delivery, we replace it.</li>
              <li><strong>Wrong plant delivered:</strong> You ordered a Monstera but received a Pothos? We send the correct plant immediately.</li>
              <li><strong>Plant dies within 7 days:</strong> If a plant dies within 7 days of delivery despite basic care, we replace it free.</li>
              <li><strong>Severely wilted on arrival:</strong> A plant that cannot be revived with water within 24 hours qualifies for replacement.</li>
              <li><strong>Missing items:</strong> If your order has fewer plants than invoiced, we ship the missing ones at no charge.</li>
              <li><strong>Incorrect variety:</strong> If the plant label or variety shown online doesn't match what arrived, you're covered.</li>
            </ul>
          </div>

          <!-- What's not covered -->
          <div class="card" style="margin-bottom:24px">
            <h3>⚠️ What's Not Covered</h3>
            <ul>
              <li><strong>Normal leaf drop:</strong> 2–5 leaves falling after repotting is completely normal transplant stress — it's not a defect.</li>
              <li><strong>Yellowing due to overwatering:</strong> The #1 cause of plant death is overwatering by customers — this is not covered.</li>
              <li><strong>Seasonal dormancy:</strong> Many plants naturally shed leaves in winter. This is not damage.</li>
              <li><strong>Growth rate expectations:</strong> Plants grow at their own pace — slow growth in your home doesn't qualify for a return.</li>
              <li><strong>Seeds that fail to germinate:</strong> Germination depends on soil, temperature, and sowing technique — we can't guarantee germination.</li>
              <li><strong>After 7 days:</strong> Claims made after the 7-day window cannot be processed as replacements (but we'll still try to help with care advice).</li>
            </ul>
          </div>

          <!-- How to raise -->
          <div class="card" style="margin-bottom:24px">
            <h3>📸 How to Raise a Return Request (3 Easy Steps)</h3>
            <div class="tl">
              <div class="tl-item">
                <div class="tl-dot">1</div>
                <div class="tl-body">
                  <h4>Take 2–3 Photos of the Plant</h4>
                  <p>Clear photos showing the plant condition, the pot, and ideally the packaging. WhatsApp or email these photos to us within 7 days of delivery.</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-dot">2</div>
                <div class="tl-body">
                  <h4>Contact Us with Your Order Number</h4>
                  <p>WhatsApp +91 98346 56144 or email info@lagaao.com with the subject "Return Request – [Order Number]". We review within 24 hours.</p>
                </div>
              </div>
              <div class="tl-item">
                <div class="tl-dot">3</div>
                <div class="tl-body">
                  <h4>Replacement Dispatched Within 3–5 Days</h4>
                  <p>Once approved (usually within hours), we dispatch your replacement plant. You do not need to return the original plant.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Refund timeline -->
          <div class="card" style="margin-bottom:24px">
            <h3>💰 Refund Options & Timelines</h3>
            <p>If you prefer a refund over a replacement, we offer that too. Here's how long it takes:</p>
            <div class="tbl-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th>Refund Timeline</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>UPI / Google Pay / PhonePe</td><td>1–2 business days</td><td>Fastest refund method</td></tr>
                  <tr><td>Lagaao Store Credit</td><td>Instant (2 hours)</td><td>Extra 10% bonus credit as a goodwill gesture</td></tr>
                  <tr><td>Credit Card</td><td>5–7 business days</td><td>Bank processing time applies</td></tr>
                  <tr><td>Debit Card / Net Banking</td><td>3–5 business days</td><td>NEFT / IMPS processing</td></tr>
                  <tr><td>Cash on Delivery</td><td>5–7 business days via NEFT</td><td>Bank account details needed</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- FAQ -->
          <div class="sec-label">Got Questions?</div>
          <div class="sec-title" style="margin-bottom:16px">Returns FAQ</div>
          <div class="faq" style="margin-bottom:32px">
            @for (faq of returnsFAQs; track faq.q; let i = $index) {
              <div class="faq-item">
                <div class="faq-q"><span class="faq-num">{{ i+1 }}</span>{{ faq.q }}</div>
                <p class="faq-a">{{ faq.a }}</p>
              </div>
            }
          </div>

          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <a href="https://wa.me/919834656144" target="_blank" rel="noopener" class="btn btn-primary" style="text-decoration:none">
              <mat-icon style="font-size:18px;width:18px;height:18px">chat</mat-icon> WhatsApp Us
            </a>
            <a href="mailto:info@lagaao.com?subject=Return Request" class="btn btn-outline" style="text-decoration:none">
              <mat-icon style="font-size:18px;width:18px;height:18px">mail_outline</mat-icon> Email Us
            </a>
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════
           SHIPPING
      ══════════════════════════════════════════════════════════ -->
      @case ('shipping') {
        <div class="page-hero">
          <div class="hero-badge">🚚 Fast & Safe Delivery</div>
          <h1 class="hero-title">Shipping Information</h1>
          <p class="hero-sub">We've shipped over 50,000 plants across India. Our specialised plant packaging ensures your green companions arrive fresh, hydrated, and ready to thrive.</p>
          <div class="hero-chips">
            <span class="hero-chip">📦 Eco packaging</span>
            <span class="hero-chip">🚀 Same-day dispatch (before 12pm)</span>
            <span class="hero-chip">🎁 Free shipping above ₹499</span>
          </div>
        </div>

        <div class="content">
          <div class="bc">
            <a routerLink="/">Home</a>
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
            Shipping Info
          </div>

          <!-- Stat cards -->
          <div class="grid-3" style="margin-bottom:32px">
            @for (s of shippingStats; track s.label) {
              <div class="stat">
                <div style="font-size:2rem;margin-bottom:8px">{{ s.emoji }}</div>
                <div class="stat-num" style="font-size:1.5rem">{{ s.value }}</div>
                <div class="stat-lbl">{{ s.label }}</div>
              </div>
            }
          </div>

          <!-- Packaging -->
          <div class="card" style="margin-bottom:24px">
            <h3>📦 Our Special Plant Packaging</h3>
            <p>Plants are living beings — they need special care during transit. Our packaging team has perfected a 5-step process that keeps plants healthy for up to 5 days in the box:</p>
            <div class="grid-2">
              @for (p of packagingSteps; track p.title) {
                <div style="display:flex;gap:12px;align-items:flex-start;padding:16px;background:var(--bg-subtle);border-radius:12px">
                  <span style="font-size:1.5rem;flex-shrink:0">{{ p.emoji }}</span>
                  <div>
                    <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px">{{ p.title }}</div>
                    <div style="font-size:.875rem;color:var(--text-muted)">{{ p.desc }}</div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Delivery timelines -->
          <div class="card" style="margin-bottom:24px">
            <h3>⏱ Delivery Timelines by City</h3>
            <p>Orders placed before 12:00 PM (Monday–Friday) are dispatched the same day. Weekend orders are dispatched on Monday.</p>
            <div class="tbl-wrap">
              <table class="tbl">
                <thead><tr><th>Location</th><th>Expected Delivery</th><th>Notes</th></tr></thead>
                <tbody>
                  @for (row of deliveryTimelines; track row.city) {
                    <tr><td><strong>{{ row.city }}</strong></td><td>{{ row.time }}</td><td style="font-size:.8125rem;color:var(--text-muted)">{{ row.note }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Charges -->
          <div class="card" style="margin-bottom:24px">
            <h3>💸 Shipping Charges</h3>
            <div class="tbl-wrap">
              <table class="tbl">
                <thead><tr><th>Order Value</th><th>Shipping Charge</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr><td>₹499 and above</td><td><strong style="color:var(--color-primary)">FREE</strong></td><td>Standard delivery, all cities</td></tr>
                  <tr><td>Below ₹499</td><td>₹49</td><td>Flat rate, all cities</td></tr>
                  <tr><td>XL Plants (12" pot+)</td><td>₹99</td><td>Special heavy-duty packaging required</td></tr>
                  <tr><td>Cash on Delivery</td><td>+₹29</td><td>COD handling charge, any order value</td></tr>
                  <tr><td>Express Delivery</td><td>+₹99</td><td>Next-day delivery available in 8 metro cities</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Seasonal tips -->
          <div class="card" style="margin-bottom:24px">
            <h3>🌦 Seasonal Shipping Policies</h3>
            <div style="display:flex;flex-direction:column;gap:16px">
              @for (s of seasonalPolicies; track s.season) {
                <div style="display:flex;gap:14px;align-items:flex-start;padding:16px;background:var(--bg-subtle);border-radius:12px">
                  <span style="font-size:1.5rem;flex-shrink:0">{{ s.emoji }}</span>
                  <div>
                    <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px">{{ s.season }}</div>
                    <div style="font-size:.875rem;color:var(--text-secondary);line-height:1.6">{{ s.policy }}</div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- FAQ -->
          <div class="sec-label">Questions?</div>
          <div class="sec-title" style="margin-bottom:16px">Shipping FAQ</div>
          <div class="faq" style="margin-bottom:32px">
            @for (faq of shippingFAQs; track faq.q; let i = $index) {
              <div class="faq-item">
                <div class="faq-q"><span class="faq-num">{{ i+1 }}</span>{{ faq.q }}</div>
                <p class="faq-a">{{ faq.a }}</p>
              </div>
            }
          </div>

          <a routerLink="/orders" class="btn btn-primary" style="text-decoration:none">
            <mat-icon style="font-size:18px;width:18px;height:18px">local_shipping</mat-icon>
            Track Your Order
          </a>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════
           CAREERS
      ══════════════════════════════════════════════════════════ -->
      @case ('careers') {
        <div class="page-hero">
          <div class="hero-badge">🌱 Join the Mission</div>
          <h1 class="hero-title">Work at Lagaao</h1>
          <p class="hero-sub">We're a small, passionate team making India greener. If you love plants, great products, and building things people love — you'll fit right in.</p>
          <div class="hero-chips">
            <span class="hero-chip">🏡 Remote first</span>
            <span class="hero-chip">🌿 Monthly plant allowance</span>
            <span class="hero-chip">📈 ESOP for all full-timers</span>
          </div>
        </div>

        <div class="content">
          <div class="bc">
            <a routerLink="/">Home</a>
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
            Careers
          </div>

          <!-- Why Lagaao -->
          <div class="card card-accent" style="margin-bottom:32px">
            <div class="sec-label">Why Join Us?</div>
            <div class="sec-title">A Small Team, A Big Mission</div>
            <p class="lead">Lagaao is not a big corporation. We're a lean, mission-driven team of 15 people who genuinely love what we do. Every person here has real ownership and real impact — you won't be a cog in a machine.</p>
            <p>We're building the infrastructure for India's green economy: an AI-powered plant marketplace, a community of plant lovers, and eventually, offline experience stores. If you join now, you'll be part of the founding story.</p>
          </div>

          <!-- Perks -->
          <div class="sec-label">The Good Stuff</div>
          <div class="sec-title" style="margin-bottom:20px">Perks & Benefits</div>
          <div class="grid-3" style="margin-bottom:40px">
            @for (p of perks; track p.title) {
              <div class="card" style="margin-bottom:0">
                <div class="icon-box">{{ p.emoji }}</div>
                <h3 style="margin-top:0">{{ p.title }}</h3>
                <p style="font-size:.875rem;margin:0">{{ p.desc }}</p>
              </div>
            }
          </div>

          <!-- Open roles -->
          <div class="sec-label">We're Hiring</div>
          <div class="sec-title" style="margin-bottom:20px">Open Positions</div>
          <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:40px">
            @for (job of jobs; track job.title) {
              <div class="job">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
                  <div>
                    <div style="font-size:1.0625rem;font-weight:800;color:var(--text-primary);margin-bottom:8px">{{ job.title }}</div>
                    <div>
                      <span class="tag tag-green">{{ job.dept }}</span>
                      <span class="tag tag-blue">{{ job.type }}</span>
                      <span class="tag tag-gray">📍 {{ job.location }}</span>
                      <span class="tag tag-gray">💰 {{ job.salary }}</span>
                    </div>
                  </div>
                  <a [href]="'mailto:careers@lagaao.com?subject=Application: ' + job.title"
                     class="btn btn-primary" style="text-decoration:none;flex-shrink:0;font-size:.875rem;padding:10px 20px">
                    Apply Now
                  </a>
                </div>
                <p style="margin:14px 0 0;font-size:.9375rem;color:var(--text-secondary);line-height:1.7">{{ job.desc }}</p>
                <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">
                  @for (skill of job.skills; track skill) {
                    <span style="font-size:.75rem;padding:3px 10px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:999px;color:var(--text-secondary)">{{ skill }}</span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Hiring process -->
          <div class="card" style="margin-bottom:32px">
            <h3>🗺 Our Hiring Process</h3>
            <p>We believe hiring should be fast and respectful of your time. Here's what to expect:</p>
            <div class="tl">
              <div class="tl-item"><div class="tl-dot">1</div><div class="tl-body"><h4>Resume Screen (2 days)</h4><p>We review every application personally. If there's a fit, we reach out within 48 hours.</p></div></div>
              <div class="tl-item"><div class="tl-dot">2</div><div class="tl-body"><h4>Intro Call — 30 mins</h4><p>A casual conversation to understand your background, what you're looking for, and to answer your questions about us.</p></div></div>
              <div class="tl-item"><div class="tl-dot">3</div><div class="tl-body"><h4>Practical Task — 2–4 hours (paid)</h4><p>A small, realistic task relevant to the role. We pay ₹500–₹2,000 for your time regardless of outcome.</p></div></div>
              <div class="tl-item"><div class="tl-dot" style="background:#f59e0b">✓</div><div class="tl-body"><h4>Offer → Start</h4><p>If everything aligns, we make an offer within 3 days. Total process: 1–2 weeks.</p></div></div>
            </div>
          </div>

          <div class="cta-strip">
            <h3>Don't See Your Role? Write to Us Anyway.</h3>
            <p>We're always looking for passionate people. Send your resume and a note about how you'd contribute to Lagaao's mission.</p>
            <a href="mailto:careers@lagaao.com" class="btn btn-primary" style="text-decoration:none">
              <mat-icon style="font-size:18px;width:18px;height:18px">mail_outline</mat-icon>
              careers&#64;lagaao.com
            </a>
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════
           PRIVACY POLICY
      ══════════════════════════════════════════════════════════ -->
      @case ('privacy') {
        <div class="page-hero">
          <div class="hero-badge">🔒 Your Privacy Matters</div>
          <h1 class="hero-title">Privacy Policy</h1>
          <p class="hero-sub">We collect only what we need, protect it seriously, and never sell it. Plain language, no legal jargon.</p>
          <div class="hero-chips">
            <span class="hero-chip">📅 Last updated: January 2025</span>
            <span class="hero-chip">✅ DPDP Act 2023 compliant</span>
          </div>
        </div>

        <div class="content">
          <div class="bc">
            <a routerLink="/">Home</a>
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
            Privacy Policy
          </div>

          <div class="highlight amber" style="margin-bottom:32px">
            <h4>📌 Summary (TL;DR)</h4>
            <p style="margin:0;color:var(--text-secondary)">We collect your name, email, phone, and delivery address to process orders. We don't sell your data to anyone. You can delete your account and all data at any time by emailing info@lagaao.com.</p>
          </div>

          <div class="card">
            @for (sec of privacySections; track sec.title) {
              <div class="policy-sec">
                <h2>{{ sec.title }}</h2>
                <p>{{ sec.body }}</p>
                @if (sec.list?.length) {
                  <ul>
                    @for (item of sec.list!; track item) { <li>{{ item }}</li> }
                  </ul>
                }
              </div>
            }
          </div>

          <p style="font-size:.8125rem;color:var(--text-muted);margin-top:16px">
            Privacy questions? Email <a class="link" href="mailto:info@lagaao.com">info&#64;lagaao.com</a> or write to Lagaao.com, Pune, Maharashtra 411045, India.
          </p>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════
           TERMS OF USE
      ══════════════════════════════════════════════════════════ -->
      @case ('terms') {
        <div class="page-hero">
          <div class="hero-badge">📄 Legal</div>
          <h1 class="hero-title">Terms of Use</h1>
          <p class="hero-sub">By using Lagaao.com, you agree to these terms. We've written them in plain language — because legal text shouldn't require a lawyer to understand.</p>
          <div class="hero-chips">
            <span class="hero-chip">📅 Effective: January 2025</span>
            <span class="hero-chip">⚖ Governed by Indian Law</span>
          </div>
        </div>

        <div class="content">
          <div class="bc">
            <a routerLink="/">Home</a>
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
            Terms of Use
          </div>

          <div class="card">
            @for (sec of termsSections; track sec.title) {
              <div class="policy-sec">
                <h2>{{ sec.title }}</h2>
                <p>{{ sec.body }}</p>
                @if (sec.list?.length) {
                  <ul>
                    @for (item of sec.list!; track item) { <li>{{ item }}</li> }
                  </ul>
                }
              </div>
            }
          </div>

          <p style="font-size:.8125rem;color:var(--text-muted);margin-top:16px">
            Questions about these terms? Email <a class="link" href="mailto:info@lagaao.com">info&#64;lagaao.com</a>
          </p>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════
           PLANT CARE GUIDE
      ══════════════════════════════════════════════════════════ -->
      @case ('plant-care-guide') {
        <div class="page-hero">
          <div class="hero-badge">🌿 Expert Knowledge</div>
          <h1 class="hero-title">The Complete Plant Care Guide</h1>
          <p class="hero-sub">Written by our in-house horticulturalists with 15+ years of experience. Covering everything from watering schedules to pest control for Indian homes.</p>
          <div class="hero-chips">
            <span class="hero-chip">💧 Watering</span>
            <span class="hero-chip">☀️ Light</span>
            <span class="hero-chip">🪴 Soil</span>
            <span class="hero-chip">🧪 Fertilizing</span>
            <span class="hero-chip">🐛 Pests</span>
            <span class="hero-chip">✂️ Pruning</span>
          </div>
        </div>

        <div class="content">
          <div class="bc">
            <a routerLink="/">Home</a>
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
            Plant Care Guide
          </div>

          <div class="highlight green" style="margin-bottom:32px">
            <h4>🌱 Golden Rule of Plant Parenting</h4>
            <p style="margin:0;color:var(--text-secondary)">The most common reason plants die in Indian homes is <strong>overwatering</strong>. Most houseplants need far less water than you think. When in doubt — wait two more days before watering.</p>
          </div>

          @for (tip of careTips; track tip.title) {
            <div class="care-card">
              <div class="care-emoji">{{ tip.emoji }}</div>
              <div style="flex:1">
                <div class="care-title">{{ tip.title }}</div>
                <p>{{ tip.intro }}</p>
                @if (tip.sections.length) {
                  @for (sec of tip.sections; track sec.title) {
                    <h3>{{ sec.title }}</h3>
                    <p>{{ sec.body }}</p>
                    @if (sec.items && sec.items.length) {
                      <ul>
                        @for (item of sec.items; track item) { <li>{{ item }}</li> }
                      </ul>
                    }
                  }
                }
              </div>
            </div>
          }

          <!-- Seasonal care calendar -->
          <div class="card" style="margin-bottom:24px">
            <h3>📅 India Seasonal Care Calendar</h3>
            <p>Plant care in India follows our unique seasonal rhythm — not the Western 4-season model.</p>
            <div class="tbl-wrap" style="margin-bottom:0">
              <table class="tbl">
                <thead><tr><th>Season / Months</th><th>Watering</th><th>Fertilizing</th><th>Key Tasks</th></tr></thead>
                <tbody>
                  @for (row of seasonalCalendar; track row.season) {
                    <tr>
                      <td><strong>{{ row.season }}</strong><br><small style="color:var(--text-muted)">{{ row.months }}</small></td>
                      <td>{{ row.water }}</td>
                      <td>{{ row.fertilize }}</td>
                      <td style="font-size:.8125rem">{{ row.tasks }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Quick reference -->
          <div class="card" style="margin-bottom:32px">
            <h3>⚡ Quick Plant Health Diagnosis</h3>
            <div class="tbl-wrap" style="margin-bottom:0">
              <table class="tbl">
                <thead><tr><th>Symptom</th><th>Likely Cause</th><th>Fix</th></tr></thead>
                <tbody>
                  @for (row of diagnosis; track row.symptom) {
                    <tr><td>{{ row.symptom }}</td><td>{{ row.cause }}</td><td style="font-size:.8125rem;color:var(--color-primary)">{{ row.fix }}</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="cta-strip">
            <h3>Need Personalised Plant Advice?</h3>
            <p>Our AI Plant Advisor analyses your space, light, and lifestyle to recommend the perfect plants — and tells you exactly how to care for them.</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
              <a routerLink="/search" [queryParams]="{ai:'1'}" class="btn btn-primary" style="text-decoration:none">
                🤖 Try AI Advisor
              </a>
              <a routerLink="/blog" class="btn btn-outline" style="text-decoration:none;background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.3)">
                Read Our Blog
              </a>
            </div>
          </div>
        </div>
      }

      @default {
        <div style="text-align:center;padding:80px 24px">
          <div style="font-size:4rem;margin-bottom:16px">🌿</div>
          <h1 style="font-size:1.5rem;font-weight:700;color:var(--text-primary);margin-bottom:8px">Page not found</h1>
          <p style="color:var(--text-secondary);margin-bottom:24px">Sorry, this page doesn't exist yet.</p>
          <a routerLink="/" class="btn btn-primary" style="text-decoration:none">Back to Home</a>
        </div>
      }
    }
  `,
})
export class StaticPageComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #title = inject(Title);
  readonly #fb    = inject(FormBuilder);

  slug        = signal<string>('');
  contactSent = signal(false);

  contactForm = this.#fb.nonNullable.group({
    name:    ['', Validators.required],
    email:   ['', [Validators.required, Validators.email]],
    phone:   [''],
    topic:   [''],
    orderNo: [''],
    message: ['', Validators.required],
  });

  submitContact() {
    if (this.contactForm.invalid) return;
    this.contactSent.set(true);
    this.contactForm.reset();
  }

  ngOnInit() {
    const s = this.#route.snapshot.paramMap.get('slug') ?? '';
    this.slug.set(s);
    const titles: Record<string, string> = {
      about:             'About Lagaao — Our Story',
      contact:           'Contact Us — Lagaao',
      returns:           'Returns & Refunds — Lagaao',
      shipping:          'Shipping Information — Lagaao',
      careers:           'Careers at Lagaao',
      privacy:           'Privacy Policy — Lagaao',
      terms:             'Terms of Use — Lagaao',
      'plant-care-guide':'Plant Care Guide — Lagaao',
    };
    if (titles[s]) this.#title.setTitle(titles[s]);
  }

  // ── About ────────────────────────────────────────────────────
  readonly values = [
    { emoji: '🌿', title: 'Farm to Doorstep', desc: 'Direct from nurseries — no middlemen, fresher plants, lower prices.' },
    { emoji: '💚', title: '7-Day Guarantee', desc: 'Arrives dead or damaged? We replace it free, no questions, no fuss.' },
    { emoji: '🌍', title: 'Eco Packaging', desc: '90%+ biodegradable materials — coco husk, newspaper, recycled kraft.' },
    { emoji: '🤝', title: 'Nursery First', desc: 'We support 35+ small Indian nurseries with fair pricing and timely payments.' },
    { emoji: '🤖', title: 'AI-Powered', desc: "India's first AI plant advisor — describe your space, get perfect picks." },
    { emoji: '💬', title: 'Real Humans', desc: 'Every support message is answered by a plant expert, never a bot.' },
  ];

  readonly team = [
    { name: 'Arjun Mehta', role: 'Founder & CEO', initials: 'AM', color: '#3d6b45', bio: 'Former software engineer who quit his job to grow plants. Has 200+ plants at home and still overwatered one last week.' },
    { name: 'Meera Mehta', role: 'Head of Operations', initials: 'MM', color: '#b45309', bio: 'Arjun\'s sister. Runs everything that actually matters: packaging, logistics, nursery relationships, and keeping Arjun organised.' },
    { name: 'Rohan Kulkarni', role: 'CTO', initials: 'RK', color: '#1e40af', bio: 'Full-stack developer and reluctant plant convert. Built Lagaao\'s entire tech stack. His fiddle leaf fig is thriving, finally.' },
    { name: 'Anjali Patil', role: 'Plant Expert', initials: 'AP', color: '#7c3aed', bio: 'BSc Horticulture from PAU Ludhiana. Writes all our plant care guides, vets every product description, and answers your toughest plant questions.' },
    { name: 'Vikram Singh', role: 'Growth & Marketing', initials: 'VS', color: '#be185d', bio: 'Previously at a D2C brand. Obsessed with Instagram Reels and conversion rates. Claims he can tell a Pothos from a Philodendron now.' },
    { name: 'Priya Nair', role: 'Customer Delight', initials: 'PN', color: '#0f766e', bio: 'Responds to every message with genuine warmth. Has never let a customer query go unanswered. Her succulent collection is legendary.' },
  ];

  readonly reviews = [
    { name: 'Kavitha R.', city: 'Bangalore', initials: 'KR', color: '#3d6b45', text: 'Ordered 8 plants for my new apartment. Every single one arrived in perfect condition with care cards. The Monstera is now 3x the size it arrived. Absolute quality!' },
    { name: 'Sameer Khan', city: 'Mumbai', initials: 'SK', color: '#1e40af', text: 'One plant arrived slightly wilted. WhatsApped them — replacement was at my door in 3 days. Zero drama. That kind of service builds lifetime customers.' },
    { name: 'Deepa Nair', city: 'Chennai', initials: 'DN', color: '#7c3aed', text: 'The AI plant advisor recommended 4 plants specifically for my north-facing flat with no direct sun. All 4 are thriving 6 months later. Genuinely impressive.' },
  ];

  // ── Contact ──────────────────────────────────────────────────
  readonly contactTopics = [
    { emoji: '📦', title: 'Order Status & Tracking', desc: 'Track your order via the Orders page or WhatsApp your order number.' },
    { emoji: '🌱', title: 'Plant Care Advice', desc: 'Ask our plant experts anything — we love helping plants thrive.' },
    { emoji: '🔄', title: 'Returns & Replacements', desc: 'Plant arrived damaged? See our Returns page or message us directly.' },
    { emoji: '🛍', title: 'Bulk / Corporate Orders', desc: 'Office plants, event decor, gifts for employees — we handle large orders.' },
    { emoji: '🏪', title: 'Sell on Lagaao', desc: 'Are you a nursery owner? We'd love to feature your plants.' },
    { emoji: '🤝', title: 'Partnership & Collab', desc: 'Brand collaborations, influencer partnerships, community events.' },
  ];

  readonly contactFAQs = [
    { q: 'How do I track my order?', a: 'Log in to your Lagaao account and visit the Orders section. You\'ll see real-time tracking with the courier tracking number. You can also WhatsApp us your order number anytime.' },
    { q: 'My plant arrived damaged. What should I do?', a: 'Don\'t worry — take 2-3 photos and WhatsApp them to +91 98346 56144 along with your order number. We\'ll arrange a replacement within 24 hours. No need to return the plant.' },
    { q: 'Do you accept bulk / corporate orders?', a: 'Yes! We regularly supply plants for office spaces, events, weddings, and corporate gifting. Email info@lagaao.com with your requirements and we\'ll send a customised quote within 24 hours.' },
    { q: 'Can I visit your nursery?', a: 'We\'re primarily an online store and our nursery is not set up for retail walk-ins. However, if you\'re in Pune and have a specific need, email us to arrange a visit by appointment.' },
    { q: 'How do I cancel my order?', a: 'Orders can be cancelled within 1 hour of placing them, before they\'re dispatched. WhatsApp us immediately with your order number. Orders already dispatched cannot be cancelled but qualify for our return policy.' },
  ];

  // ── Returns ──────────────────────────────────────────────────
  readonly returnsFAQs = [
    { q: 'Do I need to return the plant to get a replacement?', a: 'No. We never ask you to return plants — it\'s stressful for the plant and pointless for us. Just send photos of the issue and we\'ll dispatch your replacement.' },
    { q: 'My plant lost a few leaves after arrival. Is this normal?', a: 'Yes, perfectly normal. Plants experience "transplant shock" when moved. Losing 2–5 leaves is normal and the plant will recover within 1–2 weeks with proper care and watering.' },
    { q: 'Can I get a refund instead of a replacement?', a: 'Absolutely. Just let us know when you raise the issue — we\'ll process your refund to the original payment method. Refunds take 1–7 business days depending on your payment method.' },
    { q: 'What if I notice a problem after 7 days?', a: 'The formal guarantee window is 7 days, but we use common sense. If a plant dies at day 8 due to clear transit stress (not care issues), we\'ll still try to help. Contact us and explain the situation.' },
    { q: 'Seeds failed to germinate. Am I covered?', a: 'Germination success depends heavily on sowing technique, soil moisture, temperature, and light — factors outside our control. Seeds are not covered under our plant guarantee. However, if the seed packet was damaged or empty, that is covered.' },
  ];

  // ── Shipping ─────────────────────────────────────────────────
  readonly shippingStats = [
    { emoji: '🚚', value: '2–4 Days', label: 'Metro Delivery Time' },
    { emoji: '📦', value: '50,000+', label: 'Plants Shipped Safely' },
    { emoji: '🎁', value: 'FREE', label: 'Shipping on ₹499+' },
    { emoji: '🌆', value: '50+', label: 'Cities Covered' },
    { emoji: '📊', value: '97%', label: 'Healthy Arrival Rate' },
    { emoji: '⏱', value: 'Same Day', label: 'Dispatch (before 12pm)' },
  ];

  readonly packagingSteps = [
    { emoji: '💧', title: 'Moist Root Wrapping', desc: 'Roots packed in moist cocopeat to keep the plant hydrated for 3–4 days in transit.' },
    { emoji: '🛡', title: 'Coco Husk Cushioning', desc: 'Natural coco husk fibre surrounds the pot to absorb shocks during transit.' },
    { emoji: '📰', title: 'Newspaper Insulation', desc: 'Traditional newspaper wrapping provides natural insulation and regulates temperature.' },
    { emoji: '📦', title: 'Corrugated Box', desc: 'Double-walled corrugated boxes with custom-cut inserts prevent any movement.' },
    { emoji: '🌬', title: 'Ventilation Holes', desc: 'Small perforations in the box allow air circulation so the plant can breathe.' },
    { emoji: '📋', title: 'Care Card Included', desc: 'Every order includes a printed care guide specific to your plants.' },
  ];

  readonly deliveryTimelines = [
    { city: 'Mumbai, Delhi, Bangalore', time: '1–2 business days', note: 'Next-day express available' },
    { city: 'Pune, Chennai, Hyderabad, Kolkata', time: '2–3 business days', note: 'Metro rate' },
    { city: 'Ahmedabad, Jaipur, Lucknow, Kochi', time: '2–3 business days', note: 'Tier-2 metro' },
    { city: 'Other Tier-2 Cities', time: '3–5 business days', note: 'Standard delivery' },
    { city: 'Tier-3 Cities & Towns', time: '4–6 business days', note: 'Courier partner dependent' },
    { city: 'Remote / Hilly Areas', time: '6–9 business days', note: 'Limited pincodes' },
  ];

  readonly seasonalPolicies = [
    { emoji: '☀️', season: 'Peak Summer (Apr–Jun, above 42°C)', policy: 'We ship orders between 4–7 AM to avoid afternoon heat. Heat-sensitive plants (Calathea, Ferns) are temporarily shipped with phase-change gel packs. Some rare tropical plants may have a 2-week summer dispatch delay.' },
    { emoji: '🌧', season: 'Monsoon Season (Jul–Sep)', policy: 'All root wrappings and boxes get an additional waterproof inner poly bag. We avoid dispatching on heavy rain days to prevent soggy packaging. Delivery times may extend by 1–2 days in flood-prone areas.' },
    { emoji: '❄️', season: 'Winter (Dec–Feb, below 10°C)', policy: 'Cold-sensitive tropical plants (Croton, Anthurium) include heat-retention newspaper insulation. Deliveries to Himachal Pradesh, Uttarakhand, and J&K may have delays or temporary pauses during extreme cold.' },
    { emoji: '🌸', season: 'Peak Season (Oct–Mar)', policy: 'This is the best time for plant shopping in India! Perfect weather for transit. All orders dispatched at normal timelines with no special precautions needed.' },
  ];

  readonly shippingFAQs = [
    { q: 'Can I change my delivery address after ordering?', a: 'Yes, if the order hasn\'t been dispatched yet. WhatsApp us immediately with your order number and new address. Once dispatched, address changes are not possible.' },
    { q: 'Do you deliver on weekends and public holidays?', a: 'Courier partners deliver Monday–Saturday. No deliveries on Sundays or national public holidays. Orders placed on Saturday evenings are picked up on Monday.' },
    { q: 'What if nobody is home for the delivery?', a: 'The courier will attempt delivery up to 3 times and leave a delivery attempt notice. After 3 failed attempts, the package is returned to us. We\'ll then redeliver at no extra charge.' },
    { q: 'Can I track my order in real time?', a: 'Yes. Once dispatched, you\'ll receive an SMS/email with a tracking number. You can track it on the courier\'s website or in your Lagaao account under Orders.' },
    { q: 'Do you offer Cash on Delivery (COD)?', a: 'Yes, COD is available across most pincodes with a ₹29 handling charge. COD is not available for orders above ₹3,000 or in remote pincodes.' },
  ];

  // ── Careers ──────────────────────────────────────────────────
  readonly perks = [
    { emoji: '🌿', title: 'Plant Allowance ₹500/mo', desc: 'Grow your own collection on us. Monthly credits to spend on Lagaao — it\'s a business necessity apparently.' },
    { emoji: '🏡', title: 'Remote First', desc: 'Work from anywhere in India. We meet quarterly in Pune for 2-day offsites. No daily commute, ever.' },
    { emoji: '📚', title: 'Learning Budget ₹10k/yr', desc: 'Courses, books, conferences, certifications — learn whatever makes you better at your craft.' },
    { emoji: '🏥', title: 'Health Insurance', desc: 'Comprehensive medical cover for you and immediate family from day 1. No waiting period.' },
    { emoji: '📈', title: 'ESOP Pool', desc: 'All full-time employees get stock options. We\'re building this together — you should own a piece.' },
    { emoji: '⏰', title: 'Flexible Hours', desc: 'We care about output, not hours. As long as you\'re meeting commitments, work when you work best.' },
  ];

  readonly jobs = [
    {
      title: 'Senior Full-Stack Engineer',
      dept: 'Engineering', type: 'Full-Time', location: 'Remote', salary: '₹12–20 LPA',
      desc: 'Own and build features across our Angular 19 frontend and Node.js/Express backend. You\'ll work on everything from the product catalogue to our AI recommendation engine. We move fast and deploy weekly.',
      skills: ['Angular 19', 'Node.js', 'TypeScript', 'MySQL', 'Sequelize', 'Redis'],
    },
    {
      title: 'UI/UX Designer',
      dept: 'Design', type: 'Full-Time', location: 'Remote', salary: '₹8–14 LPA',
      desc: 'Design end-to-end experiences for plant lovers: product pages, checkout flows, mobile app screens, email templates, and our growing design system. You\'ll have full ownership of the Lagaao visual identity.',
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Mobile Design'],
    },
    {
      title: 'Digital Marketing Manager',
      dept: 'Marketing', type: 'Full-Time', location: 'Remote', salary: '₹8–13 LPA',
      desc: 'Drive organic and paid growth across SEO, Google Ads, Meta, and Instagram. Manage our 80k+ Instagram community and email list of 50,000 plant lovers. Own our content calendar and performance dashboards.',
      skills: ['SEO', 'Google Ads', 'Meta Ads', 'Instagram', 'Email Marketing', 'Analytics'],
    },
    {
      title: 'Plant Expert / Horticulturalist',
      dept: 'Plant Operations', type: 'Part-Time (20 hrs/week)', location: 'Remote / Pune', salary: '₹20,000–35,000/mo',
      desc: 'Be the botanical backbone of Lagaao. Write and review plant care guides, vet product descriptions for accuracy, create seasonal care content, and provide expert advice to customers via chat.',
      skills: ['BSc Horticulture', 'Plant Identification', 'Content Writing', 'Customer Support'],
    },
    {
      title: 'Operations & Logistics Coordinator',
      dept: 'Operations', type: 'Full-Time', location: 'Pune (hybrid)', salary: '₹5–8 LPA',
      desc: 'Coordinate between nurseries, packaging teams, and logistics partners to ensure every order leaves on time and arrives perfectly. Own our dispatch SLA and courier relationships.',
      skills: ['Logistics Coordination', 'Vendor Management', 'Excel/Sheets', 'Communication'],
    },
  ];

  // ── Privacy ──────────────────────────────────────────────────
  readonly privacySections: { title: string; body: string; list?: string[] }[] = [
    {
      title: '1. Who We Are',
      body: 'Lagaao.com is an online plant marketplace operated by Lagaao Ecommerce Private Limited, registered in Pune, Maharashtra, India. Our data protection officer can be reached at info@lagaao.com.',
    },
    {
      title: '2. What Data We Collect',
      body: 'We collect only the minimum data necessary to operate our service:',
      list: [
        'Account data: name, email address, phone number, and password (stored as a hash — we never see your actual password)',
        'Delivery data: shipping address and delivery instructions',
        'Order data: items purchased, payment amounts, order history',
        'Usage data: pages visited, search terms, products viewed (anonymised)',
        'Device data: browser type, device model, operating system (for compatibility)',
        'Communications: messages you send us via email, WhatsApp, or our contact form',
      ],
    },
    {
      title: '3. How We Use Your Data',
      body: 'Your data is used only for the purposes listed below. We never use it for anything else:',
      list: [
        'Processing and delivering your orders',
        'Sending order confirmation, dispatch, and delivery notifications',
        'Providing customer support and resolving disputes',
        'Personalising your shopping experience with AI recommendations (you can opt out)',
        'Sending promotional emails and plant care tips (you can unsubscribe at any time)',
        'Improving our website and app through aggregated, anonymised analytics',
        'Legal compliance as required under Indian law',
      ],
    },
    {
      title: '4. Who We Share Your Data With',
      body: 'We share your data only when strictly necessary:',
      list: [
        'Logistics partners (e.g., Shiprocket, Delhivery) — receive your name and delivery address to fulfil your order',
        'Payment processors (Razorpay) — handle payment data. Lagaao never stores your card or UPI details',
        'SMS / Email service providers — used to send order notifications',
        'Google Analytics — receives anonymised, aggregated usage data only',
        'We do NOT sell, rent, or trade your personal data to any third party, ever',
      ],
    },
    {
      title: '5. Data Security',
      body: 'We take security seriously and implement industry-standard protections:',
      list: [
        'All data transmitted between your browser and our servers is encrypted using HTTPS/TLS 1.3',
        'Passwords are hashed using bcrypt — even our own engineers cannot read your password',
        'Payment data is handled entirely by Razorpay (PCI-DSS Level 1 certified) — we never see your card details',
        'Database access is restricted to authorised personnel only, with audit logs',
        'We conduct regular security reviews and penetration tests',
      ],
    },
    {
      title: '6. Your Rights Under DPDP Act 2023',
      body: 'Under the Digital Personal Data Protection Act 2023, you have the following rights:',
      list: [
        'Right to Access: Request a copy of all personal data we hold about you',
        'Right to Correction: Ask us to correct inaccurate data',
        'Right to Erasure: Request deletion of your account and all associated personal data',
        'Right to Withdraw Consent: Opt out of marketing communications at any time',
        'Right to Grievance Redressal: Contact our grievance officer at info@lagaao.com',
        'To exercise any of these rights, email info@lagaao.com — we respond within 72 hours',
      ],
    },
    {
      title: '7. Cookies',
      body: 'We use three types of cookies:',
      list: [
        'Essential cookies: Required for login sessions and your shopping cart. Cannot be disabled without breaking the site.',
        'Analytics cookies: Google Analytics tracking, anonymised. Helps us understand which pages are popular and improve the site.',
        'Marketing cookies: Used to show relevant plant recommendations. You can opt out via the cookie banner or browser settings.',
      ],
    },
    {
      title: '8. Data Retention',
      body: 'We retain your account data as long as your account is active. If you delete your account, we permanently delete all personal data within 30 days, except where retention is required by Indian tax or legal regulations (e.g., GST records must be kept for 6 years).',
    },
    {
      title: '9. Changes to This Policy',
      body: 'We may update this policy from time to time. Significant changes will be notified by email or via a prominent notice on our website at least 14 days before they take effect. Your continued use of Lagaao after that date constitutes acceptance of the updated policy.',
    },
  ];

  // ── Terms ────────────────────────────────────────────────────
  readonly termsSections: { title: string; body: string; list?: string[] }[] = [
    {
      title: '1. Acceptance of Terms',
      body: 'By accessing, browsing, or purchasing from Lagaao.com, you confirm that you have read, understood, and agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to these terms, please do not use our platform. These terms apply to all users including visitors, registered customers, and vendors.',
    },
    {
      title: '2. Account Registration',
      body: 'To place orders, you must create an account. By registering, you agree to:',
      list: [
        'Provide accurate and truthful information (name, email, phone, address)',
        'Maintain the confidentiality of your login credentials',
        'Notify us immediately at info@lagaao.com if you suspect unauthorised access to your account',
        'Take responsibility for all activities that occur under your account',
        'You must be at least 18 years of age to create an account',
      ],
    },
    {
      title: '3. Product Listings and Accuracy',
      body: 'We make every effort to display plant descriptions, care requirements, and images accurately. However, please note:',
      list: [
        'Plants are living organisms — minor natural variation in colour, size, and leaf pattern is expected and normal',
        'Product images are representative. Your actual plant may look slightly different depending on the season and nursery batch',
        'Plant sizes listed (4", 6", 8" pot) refer to the pot diameter — actual plant height will vary by variety',
        'Flowering plants may or may not be in bloom at the time of dispatch depending on season',
      ],
    },
    {
      title: '4. Pricing and Payments',
      body: 'All prices on Lagaao.com are listed in Indian Rupees (INR) and are inclusive of applicable GST (5% on plants, 18% on garden accessories). We reserve the right to change prices without prior notice. However, once an order is confirmed, the price is locked in.',
      list: [
        'We accept UPI, credit/debit cards, net banking, and Cash on Delivery (COD)',
        'Orders are confirmed only upon successful payment authorisation',
        'For COD orders, payment is due at the time of delivery',
        'In the event of a payment error or double charge, contact us at info@lagaao.com within 48 hours',
      ],
    },
    {
      title: '5. Order Cancellation',
      body: 'You may cancel an order within 1 hour of placing it, provided it has not yet been dispatched. To cancel, WhatsApp us at +91 98346 56144 or email info@lagaao.com with your order number. Cancelled orders receive a full refund to the original payment method within 5–7 business days.',
    },
    {
      title: '6. Prohibited Activities',
      body: 'You agree not to use Lagaao.com for any of the following:',
      list: [
        'Submitting false, fraudulent, or misleading information',
        'Using automated bots, scrapers, or crawlers to access our platform',
        'Reverse-engineering, copying, or reproducing any part of our website',
        'Attempting to hack, disrupt, or gain unauthorised access to our systems',
        'Posting fake reviews or impersonating other users',
        'Using the platform for any illegal purpose under Indian law',
      ],
    },
    {
      title: '7. Intellectual Property',
      body: 'All content on Lagaao.com — including but not limited to text, product descriptions, plant care guides, photographs, logos, brand name, AI recommendation outputs, and website design — is the intellectual property of Lagaao Ecommerce Private Limited and is protected under the Copyright Act 1957 and IT Act 2000. You may not reproduce, distribute, or create derivative works without our written permission.',
    },
    {
      title: '8. Limitation of Liability',
      body: 'To the maximum extent permitted by applicable Indian law, Lagaao shall not be liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use our platform or products. Our total liability to you for any claim shall not exceed the invoice value of the specific order in question.',
    },
    {
      title: '9. Vendor / Seller Terms',
      body: 'Third-party sellers on the Lagaao marketplace agree to additional seller terms at the time of registration. Lagaao reserves the right to remove any listing or suspend any seller account that violates our quality standards, misrepresents products, or engages in prohibited activities.',
    },
    {
      title: '10. Governing Law and Dispute Resolution',
      body: 'These Terms are governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or your use of Lagaao.com shall be subject to the exclusive jurisdiction of courts in Pune, Maharashtra. We encourage resolving disputes amicably — contact info@lagaao.com before initiating any legal proceedings.',
    },
    {
      title: '11. Changes to These Terms',
      body: 'We reserve the right to modify these Terms at any time. Material changes will be communicated via email or a prominent website notice at least 14 days before taking effect. Your continued use of Lagaao.com after the effective date constitutes your acceptance of the revised Terms.',
    },
  ];

  // ── Plant Care Guide ─────────────────────────────────────────
  readonly careTips = [
    {
      emoji: '💧',
      title: 'Watering — The Single Most Important Skill',
      intro: 'Overwatering kills more houseplants in India than anything else — including neglect. The root cause (pun intended) is that most pots don\'t drain well and most Indian plant parents water on a schedule rather than checking actual soil moisture.',
      sections: [
        { title: 'The Finger Test (Never Fail)', body: 'Push your index finger 1.5–2 inches into the soil. If it feels moist, don\'t water. If it feels dry, water thoroughly until it drains from the bottom. This works for 95% of houseplants.', items: null },
        { title: 'By Plant Type', body: 'Different plants have vastly different water needs:', items: ['Succulents & Cacti: water once every 2–4 weeks in summer, once a month in winter', 'Tropical plants (Monstera, Pothos, Philodendron): water when top 2" of soil is dry — roughly every 5–7 days', 'Ferns & Peace Lilies: keep soil consistently moist but never waterlogged — every 3–4 days', 'Snake plants & ZZ plants: water once every 2–4 weeks — they genuinely love being ignored', 'Flowering plants: slightly more frequent — check every 2 days and water when top inch is dry'] },
        { title: 'Signs of Overwatering', body: null, items: ['Yellow leaves (especially lower leaves)', 'Mushy, soft stems at the base', 'Soil that stays wet for more than a week', 'White mould on soil surface', 'Leaves falling off despite the soil being wet'] },
        { title: 'Signs of Underwatering', body: null, items: ['Wilting or drooping leaves', 'Dry, crispy brown leaf edges', 'Soil pulling away from the pot edges', 'Very lightweight pot', 'Leaves curling inward'] },
      ],
    },
    {
      emoji: '☀️',
      title: 'Light — Understanding What Your Plant Actually Needs',
      intro: 'Light requirements on plant labels can be confusing. Here\'s what the terms actually mean for Indian homes and apartments.',
      sections: [
        { title: 'Understanding Light Levels', body: null, items: ['Direct sunlight: Sunlight that hits the plant directly through a window or outdoors. Best for cacti, succulents, and most fruit plants.', 'Bright indirect light: Near a window (within 1–2 metres) but not in direct sun rays. Best for Monstera, Fiddle Leaf Fig, Rubber Plant.', 'Medium light: A few metres from a window. Comfortable for Pothos, Dracaena, Spider Plant.', 'Low light: Far from windows, or rooms with only north-facing windows. Only Snake Plants, ZZ Plants, and Cast Iron Plants truly survive here.'] },
        { title: 'The North-Facing Flat Problem', body: 'Millions of Indian apartments face north and receive minimal direct sunlight. You\'re not out of options — but you should stick to genuinely low-light plants: Snake Plant (Sansevieria), ZZ Plant, Pothos, Aglaonema (Chinese Evergreen), and Cast Iron Plant.', items: null },
        { title: 'Rotation Tip', body: 'Rotate your plants 90° every 1–2 weeks. Plants grow towards the light source, and without rotation they become lopsided over time.', items: null },
      ],
    },
    {
      emoji: '🪴',
      title: 'Soil & Repotting — Give Roots Room to Grow',
      intro: 'The quality of your potting mix is as important as your watering and light. Garden soil from outside is too dense for pots and leads to waterlogging and root suffocation. Always use a quality potting mix.',
      sections: [
        { title: 'Choosing the Right Mix', body: null, items: ['General houseplants: Well-draining potting mix with cocopeat + perlite (look for Lagaao Premium Potting Mix)', 'Succulents & Cacti: Gritty mix with 40–50% perlite or coarse sand to ensure rapid drainage', 'Orchids: Bark-based orchid mix only — never soil', 'Aroids (Monstera, Philodendron): Chunky mix with bark, perlite, and cocopeat for excellent aeration'] },
        { title: 'When to Repot', body: 'Repot your plant when you see roots emerging from drainage holes, the plant dries out much faster than usual, or it\'s been 1–2 years since the last repot. Repot in early spring (February–March) for best results.', items: null },
        { title: 'How to Repot Without Stress', body: null, items: ['Choose a pot only 2" larger in diameter — don\'t jump to a much bigger pot as excess soil holds moisture and causes root rot', 'Water the plant a day before repotting to reduce root stress', 'Gently loosen the root ball without tearing roots', 'Place fresh soil in the new pot, position the plant, and fill around the sides', 'Water thoroughly and keep out of direct sun for 1 week'] },
      ],
    },
    {
      emoji: '🧪',
      title: 'Fertilizing — Feeding Plants the Right Way',
      intro: 'Plants in pots eventually exhaust the nutrients in their soil. Regular feeding during the growing season is the secret to lush, healthy, fast-growing plants. The growing season in India is roughly March to October.',
      sections: [
        { title: 'Organic vs Synthetic Fertilizers', body: 'We always recommend organic fertilizers for home gardeners. They release nutrients slowly, are forgiving of over-application, and improve soil health over time.', items: ['Best organic option: Vermicompost tea (dilute 1:10 with water) — gentle and foolproof', 'Seaweed extract: Excellent for rooting, stress tolerance, and foliage — use monthly', 'Neem cake: Mix into soil during repotting — prevents pests and adds nitrogen', 'Banana peel water: Soak peels in water overnight — great potassium source for flowering plants'] },
        { title: 'Fertilizing Schedule', body: null, items: ['Summer to monsoon (Mar–Sep): Feed every 2–4 weeks with liquid fertilizer at half the recommended dose', 'Post-monsoon (Oct–Nov): Reduce to once a month as growth slows', 'Winter (Dec–Feb): Stop fertilizing. Plants are resting and can\'t absorb nutrients effectively', 'Newly repotted plants: Wait 6 weeks before fertilizing — fresh potting mix has enough nutrients'] },
        { title: 'Common Fertilizing Mistakes', body: null, items: ['Fertilizing dry soil: Always water your plant before fertilizing — dry roots can burn', 'Over-fertilizing: "More is better" does NOT apply to fertilizer — it causes salt build-up and burns roots', 'Fertilizing sick plants: Never fertilize a stressed, overwatered, or diseased plant — fix the problem first'] },
      ],
    },
    {
      emoji: '🐛',
      title: 'Pests — Identification, Prevention, and Treatment',
      intro: 'The three most common indoor plant pests in Indian homes are mealybugs, fungus gnats, and spider mites. Catching them early makes treatment much easier. Inspect the undersides of leaves and soil surface regularly.',
      sections: [
        { title: 'Common Pests & How to Spot Them', body: null, items: ['Mealybugs: White, cottony fluff in leaf joints and undersides. Leave a sticky residue. Common on Monstera, Cactus, Jade Plant.', 'Fungus Gnats: Tiny dark flies hovering around soil surface. Larvae in soil damage roots. Caused by consistently moist soil.', 'Spider Mites: Tiny red/brown dots on leaf undersides, fine webbing. Thrive in hot, dry conditions. Cause yellowing and stippled leaves.', 'Scale Insects: Brown, oval bumps on stems and leaf undersides. Look like part of the plant. Excrete sticky honeydew.', 'Aphids: Tiny green, black, or white insects clustered on new growth. Suck plant sap. Usually brought in on outdoor plants.'] },
        { title: 'Treatment by Pest', body: null, items: ['Mealybugs: Dab individual bugs with a cotton swab dipped in 70% isopropyl alcohol. Spray the whole plant with diluted neem oil weekly for 3 weeks.', 'Fungus Gnats: Let soil dry out between waterings. Apply a layer of coarse sand on soil surface. Use yellow sticky traps to catch adults.', 'Spider Mites: Increase humidity (mist the plant). Wipe leaves with a damp cloth. Spray with neem oil solution weekly for a month.', 'Scale: Scrape off with a soft toothbrush. Spray with neem oil. Repeat weekly for 4 weeks.', 'Aphids: Blast with a strong stream of water. Follow up with neem oil spray.'] },
        { title: 'Prevention (Better Than Cure)', body: null, items: ['Spray all plants with diluted neem oil once every 2 weeks as a preventive measure', 'Quarantine all new plants for 2 weeks before placing near existing plants', 'Clean leaves with a damp cloth monthly — dust is a pest habitat', 'Don\'t let water sit in saucers — it attracts fungus gnats and promotes root rot', 'Good air circulation greatly reduces pest problems — don\'t crowd plants together'] },
      ],
    },
    {
      emoji: '✂️',
      title: 'Pruning & Propagation — Multiply Your Collection for Free',
      intro: 'Pruning keeps plants bushy, healthy, and the right size for your space. It\'s also how you get free new plants — many cuttings root easily in water or soil.',
      sections: [
        { title: 'When and How to Prune', body: null, items: ['Prune during the growing season (March–September) for fastest recovery', 'Use clean, sharp scissors — blunt blades crush stems and invite infection', 'Sterilise your cutting tool with rubbing alcohol between plants', 'Remove yellow, brown, or dead leaves at any time — they\'re draining the plant\'s energy', 'For bushy growth, pinch off the growing tip (apical bud) — this encourages side branching'] },
        { title: 'Easy Plants to Propagate in Water', body: 'These plants root readily in a glass of water near a bright window:', items: ['Pothos (Epipremnum): Cut below a node, remove lower leaves, place in water', 'Monstera: Single-node stem cutting roots in 2–3 weeks', 'Spider Plant: Baby plantlets (spiderettes) root instantly when placed in water', 'Philodendron: Stem cutting with at least one node and one leaf', 'Tradescantia: Any stem cutting, even without a node, will root'] },
      ],
    },
  ];

  readonly seasonalCalendar = [
    { season: 'Spring', months: 'Feb–Mar', water: 'Increasing', fertilize: 'Resume monthly', tasks: 'Repot, prune, propagate. Best time for any major plant changes.' },
    { season: 'Summer', months: 'Apr–Jun', water: 'Frequent (every 2–3 days)', fertilize: 'Every 2 weeks', tasks: 'Watch for pests. Morning dispatch only for new plants.' },
    { season: 'Monsoon', months: 'Jul–Sep', water: 'Reduce (soil stays moist)', fertilize: 'Monthly', tasks: 'Increase humidity-loving plants outdoors. Watch for root rot.' },
    { season: 'Post-Monsoon', months: 'Oct–Nov', water: 'Normal', fertilize: 'Once a month', tasks: 'Bring outdoor tropicals inside. Prepare for winter.' },
    { season: 'Winter', months: 'Dec–Jan', water: 'Reduce significantly', fertilize: 'Stop', tasks: 'Minimal pruning. Keep tropicals away from cold drafts.' },
  ];

  readonly diagnosis = [
    { symptom: 'Yellow leaves', cause: 'Overwatering (most common) or nitrogen deficiency', fix: 'Let soil dry out. Check drainage. Add nitrogen fertilizer.' },
    { symptom: 'Brown leaf tips', cause: 'Low humidity, fluoride in tap water, or salt build-up', fix: 'Mist regularly. Use filtered water. Flush soil thoroughly.' },
    { symptom: 'Drooping despite moist soil', cause: 'Root rot from overwatering', fix: 'Unpot, trim black roots, repot in fresh dry soil.' },
    { symptom: 'Pale, washed-out leaves', cause: 'Too much direct sun or nutrient deficiency', fix: 'Move to indirect light. Feed with balanced fertilizer.' },
    { symptom: 'Leggy, stretched stems', cause: 'Insufficient light — plant reaching for light source', fix: 'Move closer to window or add grow light.' },
    { symptom: 'Leaf drop (not yellowing)', cause: 'Temperature shock, cold draft, or repotting stress', fix: 'Stable temperature 18–28°C. Away from AC vents.' },
    { symptom: 'White crust on soil surface', cause: 'Mineral/salt build-up from tap water or fertilizer', fix: 'Flush pot thoroughly with water. Switch to filtered water.' },
    { symptom: 'Sticky residue on leaves', cause: 'Mealybugs or scale insects secreting honeydew', fix: 'Inspect undersides. Treat with neem oil spray.' },
  ];
}

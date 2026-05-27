import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ── Auth-gated apps — render on client only (no SSR needed) ──
  { path: 'vendor/**',             renderMode: RenderMode.Client },
  { path: 'admin/**',              renderMode: RenderMode.Client },

  // ── SSR — SEO-critical public pages ──────────────────────────
  { path: 'products/:slug',        renderMode: RenderMode.Server },
  { path: 'vendors/:storeSlug',    renderMode: RenderMode.Server },
  { path: 'auth/login',            renderMode: RenderMode.Server },
  { path: 'auth/register',         renderMode: RenderMode.Server },
  { path: 'auth/forgot-password',  renderMode: RenderMode.Server },
  { path: 'orders',                renderMode: RenderMode.Server },
  { path: 'orders/:id',            renderMode: RenderMode.Server },
  { path: 'profile',               renderMode: RenderMode.Server },
  { path: 'cart',                  renderMode: RenderMode.Server },
  { path: 'checkout',              renderMode: RenderMode.Server },
  { path: 'search',                renderMode: RenderMode.Server },
  { path: 'blog',                  renderMode: RenderMode.Server },
  { path: 'blog/:slug',            renderMode: RenderMode.Server },
  { path: 'pages/:slug',           renderMode: RenderMode.Server },

  // ── Everything else — prerender at build time ─────────────────
  { path: '**',                    renderMode: RenderMode.Prerender },
];

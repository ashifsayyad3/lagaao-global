import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Dynamic routes — SSR only (params unknown at build time)
  { path: 'products/:slug', renderMode: RenderMode.Server },
  { path: 'auth/login',     renderMode: RenderMode.Server },
  { path: 'auth/register',  renderMode: RenderMode.Server },
  { path: 'orders',         renderMode: RenderMode.Server },
  { path: 'profile',        renderMode: RenderMode.Server },
  { path: 'cart',           renderMode: RenderMode.Server },
  // Static routes — prerender
  { path: '**',             renderMode: RenderMode.Prerender },
];

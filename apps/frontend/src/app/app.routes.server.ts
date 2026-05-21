import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'products/:slug',        renderMode: RenderMode.Server },
  { path: 'auth/login',            renderMode: RenderMode.Server },
  { path: 'auth/register',         renderMode: RenderMode.Server },
  { path: 'auth/forgot-password',  renderMode: RenderMode.Server },
  { path: 'orders',                renderMode: RenderMode.Server },
  { path: 'profile',               renderMode: RenderMode.Server },
  { path: 'cart',                  renderMode: RenderMode.Server },
  { path: 'checkout',              renderMode: RenderMode.Server },
  { path: 'search',                renderMode: RenderMode.Server },
  { path: '**',                    renderMode: RenderMode.Prerender },
];

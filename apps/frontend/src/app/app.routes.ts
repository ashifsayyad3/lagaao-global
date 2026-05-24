import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './shared/layouts/auth-layout/auth-layout.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent),
        title: 'Lagaao — India\'s Smartest Marketplace',
      },
      {
        path: 'products',
        data: { preload: true },
        loadChildren: () =>
          import('./features/products/products.routes').then(m => m.PRODUCT_ROUTES),
      },
      {
        path: 'search',
        data: { preload: true },
        loadComponent: () =>
          import('./features/search/search.component').then(m => m.SearchComponent),
        title: 'Search — Lagaao',
      },
      {
        path: 'cart',
        data: { preload: true },
        loadComponent: () =>
          import('./features/cart/cart.component').then(m => m.CartComponent),
        title: 'Cart — Lagaao',
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
        title: 'Checkout — Lagaao',
      },
      {
        path: 'sell',
        loadComponent: () =>
          import('./features/vendor/become-seller/become-seller.component').then(m => m.BecomeSellerComponent),
        title: 'Become a Seller — Lagaao',
      },
      {
        path: 'vendor/dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/vendor/dashboard/vendor-dashboard.component').then(m => m.VendorDashboardComponent),
        title: 'Vendor Dashboard — Lagaao',
      },
      {
        path: 'vendors/:storeSlug',
        loadComponent: () =>
          import('./features/vendor/store/vendor-store.component').then(m => m.VendorStoreComponent),
        title: 'Store — Lagaao',
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/orders/orders.routes').then(m => m.ORDER_ROUTES),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
      },
      {
        path: 'blog',
        loadComponent: () =>
          import('./features/blog/blog-list/blog-list.component').then(m => m.BlogListComponent),
        title: 'Blog — Lagaao',
      },
      {
        path: 'blog/:slug',
        loadComponent: () =>
          import('./features/blog/blog-post/blog-post.component').then(m => m.BlogPostComponent),
        title: 'Blog — Lagaao',
      },
      {
        path: 'pages/about',
        loadComponent: () =>
          import('./features/pages/static-page.component').then(m => m.StaticPageComponent),
        title: 'About Lagaao',
      },
      {
        path: 'pages/contact',
        loadComponent: () =>
          import('./features/pages/static-page.component').then(m => m.StaticPageComponent),
        title: 'Contact Us — Lagaao',
      },
      {
        path: 'pages/returns',
        loadComponent: () =>
          import('./features/pages/static-page.component').then(m => m.StaticPageComponent),
        title: 'Returns & Refunds — Lagaao',
      },
      {
        path: 'pages/shipping',
        loadComponent: () =>
          import('./features/pages/static-page.component').then(m => m.StaticPageComponent),
        title: 'Shipping Info — Lagaao',
      },
      {
        path: 'pages/careers',
        loadComponent: () =>
          import('./features/pages/static-page.component').then(m => m.StaticPageComponent),
        title: 'Careers — Lagaao',
      },
      {
        path: 'pages/privacy',
        loadComponent: () =>
          import('./features/pages/static-page.component').then(m => m.StaticPageComponent),
        title: 'Privacy Policy — Lagaao',
      },
      {
        path: 'pages/terms',
        loadComponent: () =>
          import('./features/pages/static-page.component').then(m => m.StaticPageComponent),
        title: 'Terms of Use — Lagaao',
      },
      {
        path: 'pages/plant-care-guide',
        loadComponent: () =>
          import('./features/pages/static-page.component').then(m => m.StaticPageComponent),
        title: 'Plant Care Guide — Lagaao',
      },
      {
        path: 'pages/:slug',
        loadComponent: () =>
          import('./features/cms-page/cms-page.component').then(m => m.CmsPageComponent),
      },
      {
        path: 'admin/dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Admin Dashboard — Lagaao',
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Sign In — Lagaao',
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent),
        title: 'Create Account — Lagaao',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'Forgot Password — Lagaao',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];

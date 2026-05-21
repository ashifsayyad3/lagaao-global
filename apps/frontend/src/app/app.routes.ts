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
        loadChildren: () =>
          import('./features/products/products.routes').then(m => m.PRODUCT_ROUTES),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search.component').then(m => m.SearchComponent),
        title: 'Search — Lagaao',
      },
      {
        path: 'cart',
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

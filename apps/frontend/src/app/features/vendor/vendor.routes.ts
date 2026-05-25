import { Routes } from '@angular/router';
import { VendorLayoutComponent } from './layout/vendor-layout.component';
import { vendorGuard } from '../../core/guards/vendor.guard';

export const VENDOR_ROUTES: Routes = [
  {
    path: '',
    component: VendorLayoutComponent,
    canActivate: [vendorGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./home/vendor-home.component').then(m => m.VendorHomeComponent),
        title: 'Dashboard — Seller Hub',
      },
      // ── Products ────────────────────────────────────
      {
        path: 'products',
        loadComponent: () =>
          import('./products/vendor-products.component').then(m => m.VendorProductsComponent),
        title: 'Products — Seller Hub',
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./products/vendor-product-form.component').then(m => m.VendorProductFormComponent),
        title: 'Add Product — Seller Hub',
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./products/vendor-product-form.component').then(m => m.VendorProductFormComponent),
        title: 'Edit Product — Seller Hub',
      },
      {
        path: 'products/bulk',
        loadComponent: () =>
          import('./products/vendor-products.component').then(m => m.VendorProductsComponent),
        title: 'Bulk Upload — Seller Hub',
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./inventory/vendor-inventory.component').then(m => m.VendorInventoryComponent),
        title: 'Inventory — Seller Hub',
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./reviews/vendor-reviews.component').then(m => m.VendorReviewsComponent),
        title: 'Reviews — Seller Hub',
      },
      // ── Orders ──────────────────────────────────────
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/vendor-orders.component').then(m => m.VendorOrdersComponent),
        title: 'Orders — Seller Hub',
      },
      {
        path: 'orders/pending',
        loadComponent: () =>
          import('./orders/vendor-orders.component').then(m => m.VendorOrdersComponent),
        title: 'Pending Orders — Seller Hub',
      },
      {
        path: 'orders/packed',
        loadComponent: () =>
          import('./orders/vendor-orders.component').then(m => m.VendorOrdersComponent),
        title: 'Packed Orders — Seller Hub',
      },
      {
        path: 'orders/shipped',
        loadComponent: () =>
          import('./orders/vendor-orders.component').then(m => m.VendorOrdersComponent),
        title: 'Shipped — Seller Hub',
      },
      {
        path: 'orders/returns',
        loadComponent: () =>
          import('./orders/vendor-orders.component').then(m => m.VendorOrdersComponent),
        title: 'Returns — Seller Hub',
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./orders/vendor-order-detail.component').then(m => m.VendorOrderDetailComponent),
        title: 'Order Detail — Seller Hub',
      },
      // ── Finance ─────────────────────────────────────
      {
        path: 'payments',
        loadComponent: () =>
          import('./payments/vendor-payments.component').then(m => m.VendorPaymentsComponent),
        title: 'Earnings — Seller Hub',
      },
      {
        path: 'payments/settlements',
        loadComponent: () =>
          import('./payments/vendor-payments.component').then(m => m.VendorPaymentsComponent),
        title: 'Settlements — Seller Hub',
      },
      {
        path: 'payments/transactions',
        loadComponent: () =>
          import('./payments/vendor-payments.component').then(m => m.VendorPaymentsComponent),
        title: 'Transactions — Seller Hub',
      },
      // ── Growth ──────────────────────────────────────
      {
        path: 'analytics',
        loadComponent: () =>
          import('./analytics/vendor-analytics.component').then(m => m.VendorAnalyticsComponent),
        title: 'Analytics — Seller Hub',
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./customers/vendor-customers.component').then(m => m.VendorCustomersComponent),
        title: 'Customers — Seller Hub',
      },
      {
        path: 'marketing',
        loadComponent: () =>
          import('./marketing/vendor-marketing.component').then(m => m.VendorMarketingComponent),
        title: 'Marketing — Seller Hub',
      },
      {
        path: 'marketing/coupons',
        loadComponent: () =>
          import('./marketing/vendor-marketing.component').then(m => m.VendorMarketingComponent),
        title: 'Coupons — Seller Hub',
      },
      {
        path: 'marketing/promotions',
        loadComponent: () =>
          import('./marketing/vendor-marketing.component').then(m => m.VendorMarketingComponent),
        title: 'Promotions — Seller Hub',
      },
      // ── Store ────────────────────────────────────────
      {
        path: 'support',
        loadComponent: () =>
          import('./support/vendor-support.component').then(m => m.VendorSupportComponent),
        title: 'Support — Seller Hub',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./settings/vendor-settings.component').then(m => m.VendorSettingsComponent),
        title: 'Settings — Seller Hub',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/vendor-notifications.component').then(m => m.VendorNotificationsComponent),
        title: 'Notifications — Seller Hub',
      },
    ],
  },
];

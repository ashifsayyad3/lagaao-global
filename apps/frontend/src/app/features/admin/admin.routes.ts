import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { adminGuard } from '../../core/guards/admin.guard';

const stub = (path: string, className: string, title: string): object => ({
  path,
  loadComponent: () => import(`./${path.split('/')[0]}/${className}`).then((m: any) => m[Object.keys(m)[0]]),
  title: `${title} — Admin`,
});

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [

      // ── Dashboard ──────────────────────────────────────────
      {
        path: '',
        loadComponent: () => import('./home/admin-home.component').then(m => m.AdminHomeComponent),
        title: 'Admin Dashboard — Lagaao',
      },

      // ── Products ──────────────────────────────────────────
      {
        path: 'products',
        loadComponent: () => import('./products/admin-products.component').then(m => m.AdminProductsComponent),
        title: 'Products — Admin',
      },
      {
        path: 'products/new',
        loadComponent: () => import('./products/admin-products.component').then(m => m.AdminProductsComponent),
        title: 'Add Product — Admin',
      },
      {
        path: 'categories',
        loadComponent: () => import('./products/admin-products.component').then(m => m.AdminProductsComponent),
        title: 'Categories — Admin',
      },
      {
        path: 'brands',
        loadComponent: () => import('./products/admin-products.component').then(m => m.AdminProductsComponent),
        title: 'Brands — Admin',
      },
      {
        path: 'attributes',
        loadComponent: () => import('./products/admin-products.component').then(m => m.AdminProductsComponent),
        title: 'Attributes — Admin',
      },
      {
        path: 'inventory',
        loadComponent: () => import('./products/admin-products.component').then(m => m.AdminProductsComponent),
        title: 'Inventory — Admin',
      },
      {
        path: 'product-reviews',
        loadComponent: () => import('./products/admin-products.component').then(m => m.AdminProductsComponent),
        title: 'Product Reviews — Admin',
      },
      {
        path: 'product-approval',
        loadComponent: () => import('./products/admin-products.component').then(m => m.AdminProductsComponent),
        title: 'Product Approval — Admin',
      },

      // ── Orders ────────────────────────────────────────────
      {
        path: 'orders',
        loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent),
        title: 'Orders — Admin',
      },
      { path: 'orders/pending',   loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent), title: 'Pending Orders — Admin' },
      { path: 'orders/shipped',   loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent), title: 'Shipped Orders — Admin' },
      { path: 'orders/delivered', loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent), title: 'Delivered Orders — Admin' },
      { path: 'orders/cancelled', loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent), title: 'Cancelled Orders — Admin' },
      { path: 'orders/returns',   loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent), title: 'Returns — Admin' },
      { path: 'orders/refunds',   loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent), title: 'Refunds — Admin' },
      { path: 'orders/:id',       loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent), title: 'Order Detail — Admin' },

      // ── Customers ─────────────────────────────────────────
      { path: 'customers',         loadComponent: () => import('./customers/admin-customers.component').then(m => m.AdminCustomersComponent), title: 'Customers — Admin' },
      { path: 'customer-reviews',  loadComponent: () => import('./customers/admin-customers.component').then(m => m.AdminCustomersComponent), title: 'Customer Reviews — Admin' },
      { path: 'customer-support',  loadComponent: () => import('./customers/admin-customers.component').then(m => m.AdminCustomersComponent), title: 'Customer Support — Admin' },

      // ── Vendors ───────────────────────────────────────────
      { path: 'vendors',              loadComponent: () => import('./vendors/admin-vendors.component').then(m => m.AdminVendorsComponent), title: 'Vendors — Admin' },
      { path: 'vendors/approvals',    loadComponent: () => import('./vendors/admin-vendors.component').then(m => m.AdminVendorsComponent), title: 'Vendor Approvals — Admin' },
      { path: 'vendors/settlements',  loadComponent: () => import('./vendors/admin-vendors.component').then(m => m.AdminVendorsComponent), title: 'Vendor Settlements — Admin' },
      { path: 'vendors/analytics',    loadComponent: () => import('./vendors/admin-vendors.component').then(m => m.AdminVendorsComponent), title: 'Vendor Analytics — Admin' },
      { path: 'vendors/:id',          loadComponent: () => import('./vendors/admin-vendors.component').then(m => m.AdminVendorsComponent), title: 'Vendor Detail — Admin' },

      // ── Payments ──────────────────────────────────────────
      { path: 'payments',               loadComponent: () => import('./payments/admin-payments.component').then(m => m.AdminPaymentsComponent), title: 'Payments — Admin' },
      { path: 'payments/payouts',       loadComponent: () => import('./payments/admin-payments.component').then(m => m.AdminPaymentsComponent), title: 'Payouts — Admin' },
      { path: 'payments/refunds',       loadComponent: () => import('./payments/admin-payments.component').then(m => m.AdminPaymentsComponent), title: 'Refunds — Admin' },
      { path: 'payments/commission',    loadComponent: () => import('./payments/admin-payments.component').then(m => m.AdminPaymentsComponent), title: 'Commission — Admin' },
      { path: 'payments/settlements',   loadComponent: () => import('./payments/admin-payments.component').then(m => m.AdminPaymentsComponent), title: 'Settlements — Admin' },

      // ── Marketing ─────────────────────────────────────────
      { path: 'marketing/coupons',    loadComponent: () => import('./marketing/admin-marketing.component').then(m => m.AdminMarketingComponent), title: 'Coupons — Admin' },
      { path: 'marketing/campaigns',  loadComponent: () => import('./marketing/admin-marketing.component').then(m => m.AdminMarketingComponent), title: 'Campaigns — Admin' },
      { path: 'marketing/flash-sales',loadComponent: () => import('./marketing/admin-marketing.component').then(m => m.AdminMarketingComponent), title: 'Flash Sales — Admin' },
      { path: 'marketing/email',      loadComponent: () => import('./marketing/admin-marketing.component').then(m => m.AdminMarketingComponent), title: 'Email — Admin' },
      { path: 'marketing/push',       loadComponent: () => import('./marketing/admin-marketing.component').then(m => m.AdminMarketingComponent), title: 'Push Notifications — Admin' },

      // ── CMS ───────────────────────────────────────────────
      { path: 'cms/banners',        loadComponent: () => import('./cms/admin-cms.component').then(m => m.AdminCmsComponent), title: 'Banners — Admin' },
      { path: 'cms/blog',           loadComponent: () => import('./cms/admin-cms.component').then(m => m.AdminCmsComponent), title: 'Blog — Admin' },
      { path: 'cms/pages',          loadComponent: () => import('./cms/admin-cms.component').then(m => m.AdminCmsComponent), title: 'Pages — Admin' },
      { path: 'cms/announcements',  loadComponent: () => import('./cms/admin-cms.component').then(m => m.AdminCmsComponent), title: 'Announcements — Admin' },
      { path: 'cms/newsletter',     loadComponent: () => import('./cms/admin-cms.component').then(m => m.AdminCmsComponent), title: 'Newsletter — Admin' },

      // ── Analytics ─────────────────────────────────────────
      { path: 'analytics',           loadComponent: () => import('./analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent), title: 'Analytics — Admin' },
      { path: 'analytics/sales',     loadComponent: () => import('./analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent), title: 'Sales Analytics — Admin' },
      { path: 'analytics/customers', loadComponent: () => import('./analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent), title: 'Customer Analytics — Admin' },
      { path: 'analytics/products',  loadComponent: () => import('./analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent), title: 'Product Analytics — Admin' },
      { path: 'analytics/vendors',   loadComponent: () => import('./analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent), title: 'Vendor Analytics — Admin' },

      // ── AI ────────────────────────────────────────────────
      { path: 'ai/recommendations', loadComponent: () => import('./ai/admin-ai.component').then(m => m.AdminAiComponent), title: 'AI Recommendations — Admin' },
      { path: 'ai/forecasting',     loadComponent: () => import('./ai/admin-ai.component').then(m => m.AdminAiComponent), title: 'AI Forecasting — Admin' },
      { path: 'ai/pricing',         loadComponent: () => import('./ai/admin-ai.component').then(m => m.AdminAiComponent), title: 'AI Pricing — Admin' },
      { path: 'ai/content',         loadComponent: () => import('./ai/admin-ai.component').then(m => m.AdminAiComponent), title: 'AI Content — Admin' },
      { path: 'ai/search',          loadComponent: () => import('./ai/admin-ai.component').then(m => m.AdminAiComponent), title: 'AI Search — Admin' },

      // ── Support ───────────────────────────────────────────
      { path: 'support/tickets',    loadComponent: () => import('./support/admin-support.component').then(m => m.AdminSupportComponent), title: 'Tickets — Admin' },
      { path: 'support/inbox',      loadComponent: () => import('./support/admin-support.component').then(m => m.AdminSupportComponent), title: 'Inbox — Admin' },
      { path: 'support/complaints', loadComponent: () => import('./support/admin-support.component').then(m => m.AdminSupportComponent), title: 'Complaints — Admin' },

      // ── Email Center ──────────────────────────────────────
      { path: 'email/logs',       loadComponent: () => import('./email/admin-email.component').then(m => m.AdminEmailComponent),         title: 'Email Logs — Admin' },
      { path: 'email/templates',  loadComponent: () => import('./email/admin-email.component').then(m => m.AdminEmailComponent),         title: 'Email Templates — Admin' },
      { path: 'email/campaigns',  loadComponent: () => import('./email/admin-email.component').then(m => m.AdminEmailComponent),         title: 'Email Campaigns — Admin' },
      { path: 'email/newsletter', loadComponent: () => import('./email/admin-email.component').then(m => m.AdminEmailComponent),         title: 'Newsletter — Admin' },
      { path: 'email/failed',     loadComponent: () => import('./email/admin-email.component').then(m => m.AdminEmailComponent),         title: 'Failed Emails — Admin' },

      // ── Notification Center ───────────────────────────────
      { path: 'notifications',              loadComponent: () => import('./notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent), title: 'Notifications — Admin' },
      { path: 'notifications/push',         loadComponent: () => import('./notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent), title: 'Push Center — Admin' },
      { path: 'notifications/sms',          loadComponent: () => import('./notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent), title: 'SMS Center — Admin' },
      { path: 'notifications/preferences',  loadComponent: () => import('./notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent), title: 'Notification Preferences — Admin' },
      { path: 'notifications/logs',         loadComponent: () => import('./notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent), title: 'Notification Logs — Admin' },

      // ── Tracking Center ───────────────────────────────────
      { path: 'tracking',           loadComponent: () => import('./tracking/admin-tracking.component').then(m => m.AdminTrackingComponent), title: 'Shipments — Admin' },
      { path: 'tracking/couriers',  loadComponent: () => import('./tracking/admin-tracking.component').then(m => m.AdminTrackingComponent), title: 'Courier Logs — Admin' },
      { path: 'tracking/failed',    loadComponent: () => import('./tracking/admin-tracking.component').then(m => m.AdminTrackingComponent), title: 'Failed Delivery — Admin' },
      { path: 'tracking/returns',   loadComponent: () => import('./tracking/admin-tracking.component').then(m => m.AdminTrackingComponent), title: 'Return Shipments — Admin' },
      { path: 'tracking/analytics', loadComponent: () => import('./tracking/admin-tracking.component').then(m => m.AdminTrackingComponent), title: 'Delivery Analytics — Admin' },

      // ── CRM ───────────────────────────────────────────────
      { path: 'crm',            loadComponent: () => import('./crm/admin-crm.component').then(m => m.AdminCrmComponent), title: 'CRM — Admin' },
      { path: 'crm/segments',   loadComponent: () => import('./crm/admin-crm.component').then(m => m.AdminCrmComponent), title: 'Segments — Admin' },
      { path: 'crm/activity',   loadComponent: () => import('./crm/admin-crm.component').then(m => m.AdminCrmComponent), title: 'Activity Logs — Admin' },
      { path: 'crm/wishlist',   loadComponent: () => import('./crm/admin-crm.component').then(m => m.AdminCrmComponent), title: 'Wishlists — Admin' },
      { path: 'crm/ltv',        loadComponent: () => import('./crm/admin-crm.component').then(m => m.AdminCrmComponent), title: 'LTV Report — Admin' },

      // ── Monitoring ────────────────────────────────────────
      { path: 'monitoring',              loadComponent: () => import('./monitoring/admin-monitoring.component').then(m => m.AdminMonitoringComponent), title: 'Health Monitor — Admin' },
      { path: 'monitoring/api-logs',     loadComponent: () => import('./monitoring/admin-monitoring.component').then(m => m.AdminMonitoringComponent), title: 'API Logs — Admin' },
      { path: 'monitoring/errors',       loadComponent: () => import('./monitoring/admin-monitoring.component').then(m => m.AdminMonitoringComponent), title: 'Error Logs — Admin' },
      { path: 'monitoring/metrics',      loadComponent: () => import('./monitoring/admin-monitoring.component').then(m => m.AdminMonitoringComponent), title: 'Server Metrics — Admin' },
      { path: 'monitoring/backups',      loadComponent: () => import('./monitoring/admin-monitoring.component').then(m => m.AdminMonitoringComponent), title: 'Backups — Admin' },

      // ── Reports ───────────────────────────────────────────
      { path: 'reports/sales',    loadComponent: () => import('./reports/admin-reports.component').then(m => m.AdminReportsComponent), title: 'Sales Reports — Admin' },
      { path: 'reports/tax',      loadComponent: () => import('./reports/admin-reports.component').then(m => m.AdminReportsComponent), title: 'Tax Reports — Admin' },
      { path: 'reports/vendors',  loadComponent: () => import('./reports/admin-reports.component').then(m => m.AdminReportsComponent), title: 'Vendor Reports — Admin' },
      { path: 'reports/download', loadComponent: () => import('./reports/admin-reports.component').then(m => m.AdminReportsComponent), title: 'Download Center — Admin' },

      // ── Security ──────────────────────────────────────────
      { path: 'security/users',     loadComponent: () => import('./security/admin-security.component').then(m => m.AdminSecurityComponent), title: 'Admin Users — Admin' },
      { path: 'security/roles',     loadComponent: () => import('./security/admin-security.component').then(m => m.AdminSecurityComponent), title: 'Roles — Admin' },
      { path: 'security/audit',     loadComponent: () => import('./security/admin-security.component').then(m => m.AdminSecurityComponent), title: 'Audit Logs — Admin' },
      { path: 'security/login-logs',loadComponent: () => import('./security/admin-security.component').then(m => m.AdminSecurityComponent), title: 'Login Logs — Admin' },

      // ── System ────────────────────────────────────────────
      { path: 'system/settings', loadComponent: () => import('./system/admin-system.component').then(m => m.AdminSystemComponent), title: 'Settings — Admin' },
      { path: 'system/email',    loadComponent: () => import('./system/admin-system.component').then(m => m.AdminSystemComponent), title: 'Email Config — Admin' },
      { path: 'system/payment',  loadComponent: () => import('./system/admin-system.component').then(m => m.AdminSystemComponent), title: 'Payment Config — Admin' },
      { path: 'system/api-keys', loadComponent: () => import('./system/admin-system.component').then(m => m.AdminSystemComponent), title: 'API Keys — Admin' },
      { path: 'system/cache',    loadComponent: () => import('./system/admin-system.component').then(m => m.AdminSystemComponent), title: 'Cache — Admin' },
      { path: 'system/health',   loadComponent: () => import('./system/admin-system.component').then(m => m.AdminSystemComponent), title: 'Health Monitor — Admin' },

    ],
  },
];

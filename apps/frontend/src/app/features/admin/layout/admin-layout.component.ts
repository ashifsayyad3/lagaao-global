import {
  Component, ChangeDetectionStrategy, inject, signal, computed,
  HostListener, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';

interface NavItem {
  label:    string;
  icon:     string;
  route?:   string;
  children?: NavItem[];
  badge?:   number;
}

const NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/admin' },
  {
    label: 'Products', icon: 'inventory_2',
    children: [
      { label: 'All Products',  icon: 'list',           route: '/admin/products' },
      { label: 'Add Product',   icon: 'add_box',        route: '/admin/products/new' },
      { label: 'Categories',    icon: 'category',       route: '/admin/categories' },
      { label: 'Brands',        icon: 'local_offer',    route: '/admin/brands' },
      { label: 'Attributes',    icon: 'tune',           route: '/admin/attributes' },
      { label: 'Inventory',     icon: 'warehouse',      route: '/admin/inventory' },
      { label: 'Reviews',       icon: 'star_outline',   route: '/admin/product-reviews' },
      { label: 'Approval Queue',icon: 'approval',       route: '/admin/product-approval' },
    ],
  },
  {
    label: 'Orders', icon: 'shopping_bag',
    children: [
      { label: 'All Orders',    icon: 'receipt_long',   route: '/admin/orders' },
      { label: 'Pending',       icon: 'pending',        route: '/admin/orders/pending' },
      { label: 'Shipped',       icon: 'local_shipping', route: '/admin/orders/shipped' },
      { label: 'Delivered',     icon: 'done_all',       route: '/admin/orders/delivered' },
      { label: 'Cancelled',     icon: 'cancel',         route: '/admin/orders/cancelled' },
      { label: 'Returns',       icon: 'assignment_return', route: '/admin/orders/returns' },
      { label: 'Refunds',       icon: 'currency_rupee', route: '/admin/orders/refunds' },
    ],
  },
  {
    label: 'Customers', icon: 'people',
    children: [
      { label: 'Customer List', icon: 'person',         route: '/admin/customers' },
      { label: 'Reviews',       icon: 'rate_review',    route: '/admin/customer-reviews' },
      { label: 'Support',       icon: 'support_agent',  route: '/admin/customer-support' },
    ],
  },
  {
    label: 'Vendors', icon: 'storefront',
    children: [
      { label: 'Vendor List',   icon: 'store',          route: '/admin/vendors' },
      { label: 'Approvals',     icon: 'how_to_reg',     route: '/admin/vendors/approvals' },
      { label: 'Settlements',   icon: 'payments',       route: '/admin/vendors/settlements' },
      { label: 'Analytics',     icon: 'analytics',      route: '/admin/vendors/analytics' },
    ],
  },
  {
    label: 'Payments', icon: 'account_balance',
    children: [
      { label: 'Transactions',  icon: 'swap_horiz',     route: '/admin/payments' },
      { label: 'Payouts',       icon: 'send',           route: '/admin/payments/payouts' },
      { label: 'Refunds',       icon: 'undo',           route: '/admin/payments/refunds' },
      { label: 'Commission',    icon: 'percent',        route: '/admin/payments/commission' },
      { label: 'Settlements',   icon: 'account_balance_wallet', route: '/admin/payments/settlements' },
    ],
  },
  {
    label: 'Marketing', icon: 'campaign',
    children: [
      { label: 'Coupons',       icon: 'confirmation_number', route: '/admin/marketing/coupons' },
      { label: 'Campaigns',     icon: 'send',           route: '/admin/marketing/campaigns' },
      { label: 'Flash Sales',   icon: 'flash_on',       route: '/admin/marketing/flash-sales' },
      { label: 'Email',         icon: 'email',          route: '/admin/marketing/email' },
      { label: 'Push Notifs',   icon: 'notifications',  route: '/admin/marketing/push' },
    ],
  },
  {
    label: 'CMS', icon: 'web',
    children: [
      { label: 'Banners',       icon: 'image',          route: '/admin/cms/banners' },
      { label: 'Blog',          icon: 'article',        route: '/admin/cms/blog' },
      { label: 'Pages',         icon: 'description',    route: '/admin/cms/pages' },
      { label: 'Announcements', icon: 'campaign',       route: '/admin/cms/announcements' },
      { label: 'Newsletter',    icon: 'mail',           route: '/admin/cms/newsletter' },
    ],
  },
  {
    label: 'Analytics', icon: 'bar_chart',
    children: [
      { label: 'Overview',      icon: 'insights',       route: '/admin/analytics' },
      { label: 'Sales',         icon: 'trending_up',    route: '/admin/analytics/sales' },
      { label: 'Customers',     icon: 'people',         route: '/admin/analytics/customers' },
      { label: 'Products',      icon: 'inventory_2',    route: '/admin/analytics/products' },
      { label: 'Vendors',       icon: 'storefront',     route: '/admin/analytics/vendors' },
    ],
  },
  {
    label: 'AI Center', icon: 'auto_awesome',
    children: [
      { label: 'Recommendations', icon: 'recommend',   route: '/admin/ai/recommendations' },
      { label: 'Forecasting',   icon: 'timeline',      route: '/admin/ai/forecasting' },
      { label: 'AI Pricing',    icon: 'price_change',  route: '/admin/ai/pricing' },
      { label: 'AI Content',    icon: 'edit_note',     route: '/admin/ai/content' },
      { label: 'AI Search',     icon: 'search',        route: '/admin/ai/search' },
    ],
  },
  {
    label: 'Support', icon: 'support_agent',
    children: [
      { label: 'Tickets',       icon: 'confirmation_number', route: '/admin/support/tickets' },
      { label: 'Inbox',         icon: 'inbox',          route: '/admin/support/inbox' },
      { label: 'Complaints',    icon: 'report',         route: '/admin/support/complaints' },
    ],
  },
  {
    label: 'Email Center', icon: 'email',
    children: [
      { label: 'Email Logs',    icon: 'inbox',               route: '/admin/email/logs' },
      { label: 'Templates',     icon: 'description',         route: '/admin/email/templates' },
      { label: 'Campaigns',     icon: 'campaign',            route: '/admin/email/campaigns' },
      { label: 'Newsletter',    icon: 'mail',                route: '/admin/email/newsletter' },
      { label: 'Failed Emails', icon: 'error_outline',       route: '/admin/email/failed' },
    ],
  },
  {
    label: 'Notifications', icon: 'notifications',
    children: [
      { label: 'All',           icon: 'notifications_active', route: '/admin/notifications' },
      { label: 'Push Center',   icon: 'phonelink_ring',      route: '/admin/notifications/push' },
      { label: 'SMS Center',    icon: 'sms',                 route: '/admin/notifications/sms' },
      { label: 'Preferences',   icon: 'tune',                route: '/admin/notifications/preferences' },
      { label: 'Delivery Logs', icon: 'list_alt',            route: '/admin/notifications/logs' },
    ],
  },
  {
    label: 'Tracking Center', icon: 'local_shipping',
    children: [
      { label: 'Shipments',     icon: 'inventory_2',         route: '/admin/tracking' },
      { label: 'Courier Logs',  icon: 'assignment',          route: '/admin/tracking/couriers' },
      { label: 'Failed Delivery',icon:'not_listed_location', route: '/admin/tracking/failed' },
      { label: 'Returns',       icon: 'assignment_return',   route: '/admin/tracking/returns' },
      { label: 'Delivery Stats',icon: 'analytics',           route: '/admin/tracking/analytics' },
    ],
  },
  {
    label: 'CRM', icon: 'contact_support',
    children: [
      { label: 'Customer Profiles', icon: 'person_search',  route: '/admin/crm' },
      { label: 'Segments',      icon: 'group_work',         route: '/admin/crm/segments' },
      { label: 'Activity Logs', icon: 'timeline',           route: '/admin/crm/activity' },
      { label: 'Wishlists',     icon: 'favorite',           route: '/admin/crm/wishlist' },
      { label: 'LTV Report',    icon: 'trending_up',        route: '/admin/crm/ltv' },
    ],
  },
  {
    label: 'Monitoring', icon: 'monitor_heart',
    children: [
      { label: 'Health',        icon: 'health_and_safety',  route: '/admin/monitoring' },
      { label: 'API Logs',      icon: 'api',                route: '/admin/monitoring/api-logs' },
      { label: 'Error Logs',    icon: 'error',              route: '/admin/monitoring/errors' },
      { label: 'Server Metrics',icon: 'speed',              route: '/admin/monitoring/metrics' },
      { label: 'Backups',       icon: 'backup',             route: '/admin/monitoring/backups' },
    ],
  },
  {
    label: 'SEO', icon: 'travel_explore',
    children: [
      { label: 'Overview',     icon: 'dashboard',      route: '/admin/seo' },
      { label: 'Meta Tags',    icon: 'label',          route: '/admin/seo/meta' },
      { label: 'Redirects',    icon: 'swap_horiz',     route: '/admin/seo/redirects' },
      { label: 'Sitemap',      icon: 'map',            route: '/admin/seo/sitemap' },
    ],
  },
  {
    label: 'Performance', icon: 'speed',
    children: [
      { label: 'Web Vitals',   icon: 'monitor_heart',  route: '/admin/performance' },
    ],
  },
  {
    label: 'Reports', icon: 'summarize',
    children: [
      { label: 'Sales Reports', icon: 'receipt',        route: '/admin/reports/sales' },
      { label: 'Tax Reports',   icon: 'gavel',          route: '/admin/reports/tax' },
      { label: 'Vendor Reports',icon: 'store',          route: '/admin/reports/vendors' },
      { label: 'Download Center',icon: 'download',      route: '/admin/reports/download' },
    ],
  },
  {
    label: 'Security', icon: 'security',
    children: [
      { label: 'Admin Users',   icon: 'admin_panel_settings', route: '/admin/security/users' },
      { label: 'Roles',         icon: 'badge',          route: '/admin/security/roles' },
      { label: 'Audit Logs',    icon: 'history',        route: '/admin/security/audit' },
      { label: 'Login Logs',    icon: 'login',          route: '/admin/security/login-logs' },
    ],
  },
  {
    label: 'System', icon: 'settings',
    children: [
      { label: 'Settings',      icon: 'tune',           route: '/admin/system/settings' },
      { label: 'Email Config',  icon: 'email',          route: '/admin/system/email' },
      { label: 'Payment Config',icon: 'credit_card',    route: '/admin/system/payment' },
      { label: 'API Keys',      icon: 'vpn_key',        route: '/admin/system/api-keys' },
      { label: 'Cache',         icon: 'memory',         route: '/admin/system/cache' },
      { label: 'Health',        icon: 'monitor_heart',  route: '/admin/system/health' },
    ],
  },
];

@Component({
  selector: 'lg-admin-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ThemeSwitcherComponent],
  template: `
<div class="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">

  <!-- Mobile backdrop -->
  @if (mobileOpen()) {
    <div class="fixed inset-0 z-20 bg-black/50 lg:hidden" (click)="mobileOpen.set(false)"></div>
  }

  <!-- ─── Sidebar ──────────────────────────────────────────── -->
  <aside class="fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 transition-all duration-300 ease-in-out
    {{ collapsed() ? 'w-16' : 'w-64' }}
    {{ mobileOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0' }}">

    <!-- Brand -->
    <div class="flex items-center h-16 px-4 border-b border-slate-800 shrink-0">
      @if (!collapsed()) {
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0">
            <span class="material-icons text-white text-[16px]">eco</span>
          </div>
          <div>
            <p class="text-white font-bold text-sm leading-none">Lagaao</p>
            <p class="text-slate-400 text-[10px] font-medium mt-0.5">ADMIN CONSOLE</p>
          </div>
        </div>
      } @else {
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto">
          <span class="material-icons text-white text-[16px]">eco</span>
        </div>
      }
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-3 space-y-0.5 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
      @for (item of nav; track item.label) {
        @if (item.children) {
          <!-- Group -->
          <div>
            <button
              (click)="toggleGroup(item.label)"
              class="w-full flex items-center gap-3 px-3 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg mx-1 text-sm transition-colors"
              [style.width]="'calc(100% - 8px)'">
              <span class="material-icons text-[18px] shrink-0">{{ item.icon }}</span>
              @if (!collapsed()) {
                <span class="flex-1 text-left text-[13px] font-medium">{{ item.label }}</span>
                <span class="material-icons text-[14px] text-slate-500 transition-transform {{ openGroups().has(item.label) ? 'rotate-180' : '' }}">
                  expand_more
                </span>
              }
            </button>
            @if (!collapsed() && openGroups().has(item.label)) {
              <div class="ml-3 mt-0.5 border-l border-slate-700 pl-3 space-y-0.5">
                @for (child of item.children; track child.label) {
                  <a [routerLink]="child.route"
                     routerLinkActive="bg-slate-700 text-white"
                     [routerLinkActiveOptions]="{ exact: child.route === '/admin' }"
                     class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-[12px] transition-colors">
                    <span class="material-icons text-[14px]">{{ child.icon }}</span>
                    <span>{{ child.label }}</span>
                  </a>
                }
              </div>
            }
          </div>
        } @else {
          <!-- Leaf -->
          <a [routerLink]="item.route"
             routerLinkActive="bg-slate-700 text-white"
             [routerLinkActiveOptions]="{ exact: true }"
             class="flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-sm transition-colors"
             [style.width]="'calc(100% - 8px)'">
            <span class="material-icons text-[18px] shrink-0">{{ item.icon }}</span>
            @if (!collapsed()) {
              <span class="text-[13px] font-medium">{{ item.label }}</span>
            }
          </a>
        }
      }
    </nav>

    <!-- Bottom: collapse toggle + user -->
    <div class="border-t border-slate-800 p-3 space-y-2 shrink-0">
      <button (click)="collapsed.update(v => !v)"
        class="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm">
        <span class="material-icons text-[18px]">{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</span>
        @if (!collapsed()) { <span class="text-[12px]">Collapse</span> }
      </button>
      <div class="flex items-center gap-3 px-2 py-2">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shrink-0">
          <span class="text-white text-xs font-bold">{{ adminInitial() }}</span>
        </div>
        @if (!collapsed()) {
          <div class="flex-1 min-w-0">
            <p class="text-white text-xs font-medium truncate">{{ adminName() }}</p>
            <p class="text-slate-400 text-[10px] capitalize">{{ adminRole() }}</p>
          </div>
          <button (click)="logout()" class="text-slate-400 hover:text-red-400 transition-colors" title="Sign out">
            <span class="material-icons text-[16px]">logout</span>
          </button>
        }
      </div>
    </div>
  </aside>

  <!-- ─── Main area ─────────────────────────────────────────── -->
  <div class="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
       [class]="collapsed() ? 'lg:ml-16' : 'lg:ml-64'">

    <!-- Top header -->
    <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 px-4 shrink-0 z-10">
      <!-- Mobile hamburger -->
      <button (click)="mobileOpen.update(v => !v)"
        class="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
        <span class="material-icons text-[22px]">menu</span>
      </button>

      <!-- Breadcrumb -->
      <div class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 flex-1 min-w-0">
        <span class="material-icons text-[14px]">home</span>
        @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
          @if (!last) {
            <span class="material-icons text-[12px]">chevron_right</span>
            <span class="hover:text-gray-700 dark:hover:text-gray-200 cursor-default">{{ crumb.label }}</span>
          } @else {
            <span class="material-icons text-[12px]">chevron_right</span>
            <span class="text-gray-900 dark:text-white font-medium truncate">{{ crumb.label }}</span>
          }
        }
      </div>

      <!-- Right actions -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Theme toggle -->
        <lg-theme-switcher variant="icon" />

        <!-- Quick link to storefront -->
        <a href="/" target="_blank"
          class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="View storefront">
          <span class="material-icons text-[20px]">open_in_new</span>
        </a>

        <!-- Notifications placeholder -->
        <button class="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <span class="material-icons text-[20px]">notifications_none</span>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <!-- Admin badge -->
        <div class="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
            <span class="text-white text-xs font-bold">{{ adminInitial() }}</span>
          </div>
          <div class="hidden md:block">
            <p class="text-xs font-semibold text-gray-800 dark:text-white leading-none">{{ adminName() }}</p>
            <p class="text-[10px] text-gray-400 capitalize mt-0.5">{{ adminRole() }}</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1 overflow-y-auto">
      <router-outlet />
    </main>
  </div>
</div>
  `,
})
export class AdminLayoutComponent implements OnInit {
  readonly #auth   = inject(AuthService);
  readonly #router = inject(Router);

  readonly collapsed  = signal(false);
  readonly mobileOpen = signal(false);
  readonly openGroups = signal<Set<string>>(new Set(['Products', 'Orders', 'Vendors']));
  readonly isDark     = signal(document.documentElement.classList.contains('dark'));

  readonly adminName    = computed(() => this.#auth.user()?.name ?? 'Admin');
  readonly adminInitial = computed(() => this.adminName().charAt(0).toUpperCase());
  readonly adminRole    = computed(() => this.#auth.user()?.role?.replace('_', ' ') ?? 'admin');

  readonly breadcrumbs = signal<{ label: string }[]>([{ label: 'Dashboard' }]);

  readonly nav = NAV;

  ngOnInit(): void {
    this.#router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.mobileOpen.set(false);
      this.updateBreadcrumb();
    });
    this.updateBreadcrumb();
  }

  toggleGroup(label: string): void {
    if (this.collapsed()) { this.collapsed.set(false); }
    this.openGroups.update(s => {
      const n = new Set(s);
      n.has(label) ? n.delete(label) : n.add(label);
      return n;
    });
  }

  toggleTheme(): void {
    const dark = document.documentElement.classList.toggle('dark');
    this.isDark.set(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  logout(): void {
    this.#auth.logout();
    this.#router.navigate(['/auth/login']);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.mobileOpen.set(false); }

  private updateBreadcrumb(): void {
    const url = this.#router.url.split('?')[0];
    const segments = url.split('/').filter(Boolean);
    const crumbs = segments.map(s =>
      ({ label: s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })
    );
    this.breadcrumbs.set(crumbs.length > 1 ? crumbs.slice(1) : [{ label: 'Dashboard' }]);
  }
}

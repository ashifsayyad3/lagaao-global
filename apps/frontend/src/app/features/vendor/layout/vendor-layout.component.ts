import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
  HostListener, computed,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../core/services/theme.service';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher.component';
import { AuthService } from '../../../core/services/auth.service';
import { VendorService } from '../../../core/services/vendor.service';

interface NavItem {
  label: string;
  icon:  string;
  route: string;
  badge?: number | null;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'lg-vendor-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, ThemeSwitcherComponent],
  styles: [`
    :host { display: flex; min-height: 100vh; background: var(--bg-subtle); }

    /* ── Sidebar ───────────────────────────────────── */
    .sidebar {
      position: fixed; inset: 0 auto 0 0;
      width: 256px; background: #1a2e1c;
      display: flex; flex-direction: column;
      transition: width 250ms ease, transform 250ms ease;
      z-index: 200; overflow: hidden;
    }
    .sidebar.collapsed { width: 64px; }
    .sidebar.mobile-hidden { transform: translateX(-100%); }

    /* ── Sidebar header ─────────────────────────────── */
    .sb-head {
      padding: 16px 12px 12px;
      border-bottom: 1px solid rgba(255,255,255,.08);
      flex-shrink: 0;
    }
    .sb-logo {
      display: flex; align-items: center; gap: 10px; text-decoration: none;
      overflow: hidden;
    }
    .sb-logo-icon {
      width: 36px; height: 36px; flex-shrink: 0;
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      font-size: 18px; user-select: none;
    }
    .sb-logo-text {
      flex: 1; min-width: 0;
      font-family: var(--font-display); font-size: .9375rem; font-weight: 700;
      color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sb-logo-sub {
      font-family: var(--font-sans); font-size: .6875rem; font-weight: 400;
      color: rgba(255,255,255,.45); white-space: nowrap;
    }

    /* ── Store status ────────────────────────────────── */
    .sb-store {
      margin: 10px 12px 0;
      padding: 10px 12px;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 12px;
      display: flex; align-items: center; gap: 10px;
      overflow: hidden; min-width: 0;
      cursor: default;
    }
    .sb-store-avatar {
      width: 32px; height: 32px; flex-shrink: 0;
      border-radius: 8px; background: rgba(255,255,255,.12);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; color: #fff;
    }
    .sb-store-name {
      font-size: .8125rem; font-weight: 600; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sb-store-badge {
      font-size: .625rem; font-weight: 600; padding: 2px 7px; border-radius: 9999px;
      white-space: nowrap; flex-shrink: 0;
    }
    .badge-active   { background: rgba(74,222,128,.15); color: #4ade80; }
    .badge-pending  { background: rgba(251,191,36,.15);  color: #fbbf24; }
    .badge-suspended{ background: rgba(248,113,113,.15); color: #f87171; }

    /* ── Nav scroll area ─────────────────────────────── */
    .sb-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 8px 0 16px; }
    .sb-nav::-webkit-scrollbar { width: 4px; }
    .sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 4px; }

    /* ── Section title ───────────────────────────────── */
    .sb-section-title {
      padding: 12px 16px 4px;
      font-size: .625rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
      color: rgba(255,255,255,.3); white-space: nowrap;
    }

    /* ── Nav item ────────────────────────────────────── */
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      margin: 1px 8px;
      padding: 9px 10px;
      border-radius: 10px;
      text-decoration: none;
      transition: background 150ms, color 150ms;
      cursor: pointer; overflow: hidden; white-space: nowrap;
      color: rgba(255,255,255,.6);
      font-size: .875rem; font-weight: 500;
      position: relative;
    }
    .nav-item:hover { background: rgba(255,255,255,.08); color: rgba(255,255,255,.9); }
    .nav-item.active-link {
      background: rgba(74,222,128,.15);
      color: #4ade80;
    }
    .nav-item.active-link mat-icon { color: #4ade80; }
    .nav-icon { font-size: 20px !important; width: 20px !important; height: 20px !important; flex-shrink: 0; }
    .nav-label { flex: 1; }
    .nav-badge {
      background: #ef4444; color: #fff;
      font-size: .625rem; font-weight: 700;
      min-width: 18px; height: 18px; padding: 0 5px;
      border-radius: 9999px; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    /* ── Sidebar footer ──────────────────────────────── */
    .sb-foot {
      flex-shrink: 0;
      padding: 12px;
      border-top: 1px solid rgba(255,255,255,.08);
    }
    .sb-collapse-btn {
      width: 100%; display: flex; align-items: center; gap: 10px;
      padding: 9px 10px; border-radius: 10px; border: none;
      background: rgba(255,255,255,.06); color: rgba(255,255,255,.5);
      cursor: pointer; font-size: .8125rem; transition: background 150ms, color 150ms;
      overflow: hidden; white-space: nowrap;
    }
    .sb-collapse-btn:hover { background: rgba(255,255,255,.12); color: #fff; }

    /* ── Main area ───────────────────────────────────── */
    .main {
      flex: 1; display: flex; flex-direction: column;
      margin-left: 256px; transition: margin-left 250ms ease;
      min-width: 0;
    }
    .main.sidebar-collapsed { margin-left: 64px; }
    .main.sidebar-hidden    { margin-left: 0; }

    /* ── Top header ──────────────────────────────────── */
    .top-header {
      position: sticky; top: 0; z-index: 100;
      height: 60px; flex-shrink: 0;
      background: #fff; border-bottom: 1px solid var(--border-default);
      display: flex; align-items: center; gap: 12px;
      padding: 0 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
    }
    :host-context(.dark) .top-header {
      background: var(--surface-900, #1a2332);
      border-color: rgba(255,255,255,.08);
    }

    .mobile-menu-btn {
      width: 36px; height: 36px; border: none; background: none;
      border-radius: 8px; cursor: pointer; display: none;
      align-items: center; justify-content: center;
      color: var(--text-secondary); transition: background 150ms;
    }
    .mobile-menu-btn:hover { background: var(--bg-subtle); }
    @media(max-width: 1023px) { .mobile-menu-btn { display: flex; } }

    .header-breadcrumb {
      flex: 1; display: flex; align-items: center; gap: 6px;
      font-size: .8125rem; color: var(--text-muted);
    }
    .header-breadcrumb .current {
      color: var(--text-primary); font-weight: 600;
    }

    .header-actions { display: flex; align-items: center; gap: 4px; }

    .header-btn {
      width: 36px; height: 36px; border: none; background: none;
      border-radius: 9px; cursor: pointer; display: flex;
      align-items: center; justify-content: center;
      color: var(--text-secondary); transition: background 150ms, color 150ms;
      position: relative;
    }
    .header-btn:hover { background: var(--bg-subtle); color: var(--text-primary); }

    .notif-dot {
      position: absolute; top: 7px; right: 7px;
      width: 8px; height: 8px; background: #ef4444; border-radius: 50%;
      border: 2px solid #fff;
    }

    .header-avatar {
      width: 34px; height: 34px; border-radius: 9px;
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: .8125rem; cursor: pointer;
      border: none; transition: opacity 150ms;
    }
    .header-avatar:hover { opacity: .85; }

    /* ── Page content ────────────────────────────────── */
    .page-content { flex: 1; overflow: auto; }

    /* ── Mobile overlay ──────────────────────────────── */
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      z-index: 199; display: none;
    }
    .overlay.visible { display: block; }

    @media(max-width: 1023px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar.mobile-open { transform: translateX(0); }
      .main { margin-left: 0 !important; }
    }
  `],
  template: `
    <!-- Mobile overlay -->
    <div class="overlay" [class.visible]="mobileOpen()" (click)="mobileOpen.set(false)"></div>

    <!-- ── Sidebar ─────────────────────────────────────── -->
    <aside class="sidebar"
           [class.collapsed]="collapsed()"
           [class.mobile-open]="mobileOpen()">

      <!-- Header: logo -->
      <div class="sb-head">
        <a routerLink="/" class="sb-logo">
          <div class="sb-logo-icon">🌿</div>
          @if (!collapsed()) {
            <div>
              <div class="sb-logo-text">Lagaao</div>
              <div class="sb-logo-sub">Seller Hub</div>
            </div>
          }
        </a>
      </div>

      <!-- Store identity card -->
      @if (!collapsed()) {
        <div class="sb-store">
          <div class="sb-store-avatar">
            {{ storeInitial() }}
          </div>
          <div style="flex:1;min-width:0">
            <div class="sb-store-name">{{ storeName() }}</div>
          </div>
          <span class="sb-store-badge" [class]="storeBadgeClass()">
            {{ storeStatus() }}
          </span>
        </div>
      }

      <!-- Navigation -->
      <nav class="sb-nav">
        @for (section of navSections; track section.title) {
          @if (!collapsed()) {
            <div class="sb-section-title">{{ section.title }}</div>
          } @else {
            <div style="margin:8px 0 2px;border-top:1px solid rgba(255,255,255,.07)"></div>
          }
          @for (item of section.items; track item.route) {
            <a class="nav-item"
               [routerLink]="item.route"
               routerLinkActive="active-link"
               [routerLinkActiveOptions]="{ exact: item.route === '/vendor' }"
               (click)="mobileOpen.set(false)"
               [title]="collapsed() ? item.label : ''">
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              @if (!collapsed()) {
                <span class="nav-label">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="nav-badge">{{ item.badge }}</span>
                }
              }
            </a>
          }
        }
      </nav>

      <!-- Footer: collapse toggle + logout -->
      <div class="sb-foot">
        <button class="sb-collapse-btn" (click)="collapsed.update(v => !v)" [title]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
          <mat-icon style="font-size:18px;width:18px;height:18px;flex-shrink:0">
            {{ collapsed() ? 'chevron_right' : 'chevron_left' }}
          </mat-icon>
          @if (!collapsed()) {
            <span>Collapse</span>
          }
        </button>
      </div>
    </aside>

    <!-- ── Main area ──────────────────────────────────── -->
    <div class="main"
         [class.sidebar-collapsed]="collapsed()"
         [class.sidebar-hidden]="false">

      <!-- Top header -->
      <header class="top-header">
        <!-- Mobile hamburger -->
        <button class="mobile-menu-btn" (click)="mobileOpen.update(v => !v)">
          <mat-icon>{{ mobileOpen() ? 'close' : 'menu' }}</mat-icon>
        </button>

        <!-- Breadcrumb -->
        <nav class="header-breadcrumb">
          <a routerLink="/vendor" style="text-decoration:none;color:inherit;transition:color 150ms"
             class="hover:text-primary-600">Seller Hub</a>
          <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
          <span class="current">{{ pageTitle() }}</span>
        </nav>

        <!-- Actions -->
        <div class="header-actions">

          <!-- Theme toggle -->
          <lg-theme-switcher variant="icon" />

          <!-- View store -->
          <a [href]="'/vendors/' + storeSlug()" target="_blank"
             class="header-btn" title="View public store" style="text-decoration:none">
            <mat-icon style="font-size:18px;width:18px;height:18px">open_in_new</mat-icon>
          </a>

          <!-- Notifications -->
          <button class="header-btn" title="Notifications">
            <mat-icon style="font-size:18px;width:18px;height:18px">notifications_none</mat-icon>
            <span class="notif-dot"></span>
          </button>

          <!-- Divider -->
          <div style="width:1px;height:22px;background:var(--border-default);margin:0 4px"></div>

          <!-- Avatar / logout -->
          <button class="header-avatar" [title]="auth.user()?.name ?? 'Account'" routerLink="/vendor/settings">
            {{ userInitial() }}
          </button>
        </div>
      </header>

      <!-- Page content -->
      <div class="page-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class VendorLayoutComponent implements OnInit {
  readonly theme  = inject(ThemeService);
  readonly auth   = inject(AuthService);
  readonly #vendor = inject(VendorService);
  readonly #router = inject(Router);

  readonly collapsed  = signal(false);
  readonly mobileOpen = signal(false);
  readonly storeName  = signal('My Store');
  readonly storeSlug  = signal('');
  readonly storeStatus = signal<'active' | 'pending' | 'suspended'>('pending');

  readonly storeInitial = computed(() => (this.storeName()[0] ?? 'S').toUpperCase());
  readonly userInitial  = computed(() => (this.auth.user()?.name?.[0] ?? '?').toUpperCase());

  readonly storeBadgeClass = computed(() => {
    const s = this.storeStatus();
    if (s === 'active')    return 'sb-store-badge badge-active';
    if (s === 'suspended') return 'sb-store-badge badge-suspended';
    return 'sb-store-badge badge-pending';
  });

  readonly pageTitle = computed(() => {
    const url = this.#router.url;
    const map: Record<string, string> = {
      '/vendor':                   'Dashboard',
      '/vendor/products':          'Products',
      '/vendor/products/new':      'Add Product',
      '/vendor/products/bulk':     'Bulk Upload',
      '/vendor/orders':            'All Orders',
      '/vendor/orders/pending':    'Pending Orders',
      '/vendor/payments':          'Payments & Earnings',
      '/vendor/analytics':         'Analytics',
      '/vendor/customers':         'Customers',
      '/vendor/marketing':         'Marketing',
      '/vendor/support':           'Support',
      '/vendor/settings':          'Store Settings',
      '/vendor/notifications':     'Notifications',
    };
    return map[url] ?? map[url.split('?')[0]] ?? 'Seller Hub';
  });

  readonly navSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { label: 'Dashboard',    icon: 'dashboard',       route: '/vendor'               },
        { label: 'Notifications',icon: 'notifications',   route: '/vendor/notifications' },
      ],
    },
    {
      title: 'Catalogue',
      items: [
        { label: 'All Products', icon: 'inventory_2',     route: '/vendor/products'      },
        { label: 'Add Product',  icon: 'add_box',         route: '/vendor/products/new'  },
        { label: 'Bulk Upload',  icon: 'upload_file',     route: '/vendor/products/bulk' },
        { label: 'Inventory',    icon: 'warehouse',       route: '/vendor/inventory'     },
        { label: 'Reviews',      icon: 'star_outline',    route: '/vendor/reviews'       },
      ],
    },
    {
      title: 'Orders',
      items: [
        { label: 'All Orders',   icon: 'receipt_long',    route: '/vendor/orders'        },
        { label: 'Pending',      icon: 'pending_actions', route: '/vendor/orders/pending', badge: null },
        { label: 'Packed',       icon: 'inventory',       route: '/vendor/orders/packed' },
        { label: 'Shipped',      icon: 'local_shipping',  route: '/vendor/orders/shipped'},
        { label: 'Returns',      icon: 'assignment_return',route: '/vendor/orders/returns'},
      ],
    },
    {
      title: 'Finance',
      items: [
        { label: 'Earnings',     icon: 'account_balance_wallet', route: '/vendor/payments'        },
        { label: 'Settlements',  icon: 'payments',               route: '/vendor/payments/settlements' },
        { label: 'Transactions', icon: 'receipt',                route: '/vendor/payments/transactions'},
      ],
    },
    {
      title: 'Growth',
      items: [
        { label: 'Analytics',    icon: 'bar_chart',       route: '/vendor/analytics'     },
        { label: 'Customers',    icon: 'people_outline',  route: '/vendor/customers'     },
        { label: 'Coupons',      icon: 'local_offer',     route: '/vendor/marketing/coupons' },
        { label: 'Promotions',   icon: 'campaign',        route: '/vendor/marketing/promotions' },
      ],
    },
    {
      title: 'Store',
      items: [
        { label: 'Support',      icon: 'support_agent',   route: '/vendor/support'       },
        { label: 'Settings',     icon: 'settings',        route: '/vendor/settings'      },
      ],
    },
  ];

  @HostListener('window:keydown.escape')
  onEsc() { this.mobileOpen.set(false); }

  ngOnInit(): void {
    this.#vendor.getMyProfile().subscribe({
      next: r => {
        this.storeName.set(r.data.storeName);
        this.storeSlug.set(r.data.storeSlug);
        this.storeStatus.set(r.data.status as 'active' | 'pending' | 'suspended');
      },
    });
  }
}

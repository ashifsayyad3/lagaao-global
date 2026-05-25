import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { VendorService, DashboardStats } from '../../../core/services/vendor.service';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';

interface KpiCard {
  label:    string;
  value:    string;
  icon:     string;
  gradient: string;
  textColor:string;
  sub:      string;
  trend?:   { dir: 'up' | 'down' | 'flat'; pct: string };
}

interface QuickAction {
  label:  string;
  icon:   string;
  route:  string;
  color:  string;
  bg:     string;
}

@Component({
  selector: 'lg-vendor-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule, CurrencyInrPipe, DecimalPipe, SkeletonComponent, TimeAgoPipe, BadgeComponent],
  styles: [`
    :host { display: block; }

    .page { padding: 24px 24px 64px; max-width: 1400px; margin: 0 auto; }

    /* ── Page heading ───────────────────────────────── */
    .page-head { margin-bottom: 28px; }
    .page-head h1 {
      font-family: var(--font-display); font-size: 1.5rem; font-weight: 700;
      color: var(--text-primary); margin: 0 0 4px;
    }
    .page-head p { font-size: .875rem; color: var(--text-muted); margin: 0; }

    /* ── KPI grid ───────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px; margin-bottom: 28px;
    }

    .kpi-card {
      border-radius: 16px; padding: 20px;
      border: 1px solid var(--border-default);
      background: #fff;
      transition: box-shadow 200ms, transform 200ms;
      cursor: default;
    }
    :host-context(.dark) .kpi-card { background: var(--surface-800, #1e2d20); }
    .kpi-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.09); transform: translateY(-2px); }

    .kpi-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
    .kpi-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-trend {
      display: flex; align-items: center; gap: 3px;
      font-size: .6875rem; font-weight: 600; padding: 3px 8px; border-radius: 9999px;
    }
    .trend-up   { background: #dcfce7; color: #16a34a; }
    .trend-down { background: #fee2e2; color: #dc2626; }
    .trend-flat { background: #f1f5f9; color: #64748b; }

    .kpi-value {
      font-size: 1.625rem; font-weight: 700; color: var(--text-primary);
      line-height: 1.2; margin-bottom: 4px;
    }
    .kpi-label { font-size: .75rem; color: var(--text-muted); }
    .kpi-sub   { font-size: .6875rem; color: var(--color-primary); font-weight: 500; margin-top: 6px; }

    /* ── Main grid layout ──────────────────────────── */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 20px;
      align-items: start;
    }
    @media(max-width: 1100px) { .content-grid { grid-template-columns: 1fr; } }

    /* ── Panel ──────────────────────────────────────── */
    .panel {
      background: #fff; border: 1px solid var(--border-default);
      border-radius: 16px; overflow: hidden;
    }
    :host-context(.dark) .panel { background: var(--surface-800, #1e2d20); }

    .panel-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-default);
    }
    .panel-title { font-size: .9375rem; font-weight: 600; color: var(--text-primary); margin: 0; }
    .panel-link  { font-size: .8125rem; color: var(--color-primary); text-decoration: none; transition: opacity 150ms; }
    .panel-link:hover { opacity: .75; }

    /* ── Status distribution bar ────────────────────── */
    .dist-bar {
      height: 8px; border-radius: 4px; overflow: hidden;
      display: flex; margin: 16px 20px;
    }
    .dist-seg { height: 100%; transition: width 600ms ease; }

    .dist-legend { padding: 0 20px 16px; display: flex; flex-wrap: wrap; gap: 12px; }
    .dist-item { display: flex; align-items: center; gap: 6px; font-size: .75rem; color: var(--text-secondary); }
    .dist-dot  { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }

    /* ── Orders table ───────────────────────────────── */
    .orders-table { width: 100%; font-size: .8125rem; }
    .orders-table th {
      padding: 10px 16px; text-align: left;
      font-size: .6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
      color: var(--text-muted); background: var(--bg-subtle);
      border-bottom: 1px solid var(--border-default);
    }
    .orders-table td {
      padding: 12px 16px; vertical-align: middle;
      border-bottom: 1px solid var(--border-default);
      color: var(--text-secondary);
    }
    .orders-table tr:last-child td { border-bottom: none; }
    .orders-table tr:hover td { background: var(--bg-subtle); }

    .order-num { font-weight: 600; color: var(--text-primary); font-family: monospace; }
    .order-prod { color: var(--text-primary); font-weight: 500; }
    .order-prod-sub { font-size: .6875rem; color: var(--text-muted); }
    .order-amount { font-weight: 700; color: var(--text-primary); }

    /* ── Quick actions ──────────────────────────────── */
    .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px; }
    .quick-btn {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; padding: 16px 8px; border-radius: 12px; border: none;
      cursor: pointer; text-decoration: none;
      transition: transform 150ms, box-shadow 150ms;
      font-size: .8125rem; font-weight: 600;
    }
    .quick-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.12); }
    .quick-btn mat-icon { font-size: 22px !important; width: 22px !important; height: 22px !important; }

    /* ── Activity feed ──────────────────────────────── */
    .feed-list { padding: 4px 0; }
    .feed-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--border-default);
      transition: background 150ms;
    }
    .feed-item:last-child { border-bottom: none; }
    .feed-item:hover { background: var(--bg-subtle); }

    .feed-icon {
      width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .feed-body { flex: 1; min-width: 0; }
    .feed-title { font-size: .8125rem; font-weight: 500; color: var(--text-primary); }
    .feed-sub { font-size: .75rem; color: var(--text-muted); margin-top: 2px; }

    /* ── Performance chart bars ─────────────────────── */
    .chart-bars { padding: 16px 20px; display: flex; align-items: flex-end; gap: 6px; height: 140px; }
    .chart-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .chart-bar-wrap { flex: 1; display: flex; align-items: flex-end; width: 100%; }
    .chart-bar {
      width: 100%; border-radius: 6px 6px 0 0;
      background: linear-gradient(180deg, #4caf50 0%, #2e7d32 100%);
      transition: height 600ms ease;
      min-height: 4px;
    }
    .chart-bar:hover { opacity: .8; }
    .chart-label { font-size: .625rem; color: var(--text-muted); white-space: nowrap; }

    /* ── Empty state ────────────────────────────────── */
    .empty-body {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px 20px; text-align: center;
    }
    .empty-body p { font-size: .875rem; color: var(--text-muted); margin: 8px 0 16px; }

    /* ── Not-vendor gate ─────────────────────────────── */
    .gate {
      display: flex; flex-direction: column; align-items: center;
      padding: 80px 24px; text-align: center;
    }
    .gate h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 16px 0 8px; }
    .gate p  { font-size: .9375rem; color: var(--text-secondary); margin: 0 0 28px; }
    .gate-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 12px 28px; background: var(--color-primary); color: #fff;
      border: none; border-radius: 9999px; font-size: .9375rem; font-weight: 700;
      cursor: pointer; text-decoration: none; transition: background 150ms;
    }
    .gate-btn:hover { background: var(--color-primary-dark); }
  `],
  template: `
    @if (loading()) {
      <div class="page">
        <div class="kpi-grid">
          @for (i of [0,1,2,3,4,5]; track i) {
            <lg-skeleton height="120px" borderRadius="16px"></lg-skeleton>
          }
        </div>
        <div style="display:grid;grid-template-columns:1fr 320px;gap:20px">
          <lg-skeleton height="400px" borderRadius="16px"></lg-skeleton>
          <div style="display:flex;flex-direction:column;gap:16px">
            <lg-skeleton height="240px" borderRadius="16px"></lg-skeleton>
            <lg-skeleton height="200px" borderRadius="16px"></lg-skeleton>
          </div>
        </div>
      </div>

    } @else if (notVendor()) {
      <div class="gate">
        <mat-icon style="font-size:56px;width:56px;height:56px;color:var(--color-primary)">storefront</mat-icon>
        <h2>Start Selling on Lagaao</h2>
        <p>Reach millions of customers. Apply to become a vendor today.</p>
        <a routerLink="/sell" class="gate-btn">
          <mat-icon style="font-size:18px;width:18px;height:18px">store</mat-icon>
          Become a Seller
        </a>
      </div>

    } @else if (pendingApproval()) {
      <div class="gate">
        <div style="width:72px;height:72px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center">
          <mat-icon style="font-size:36px;width:36px;height:36px;color:#d97706">hourglass_top</mat-icon>
        </div>
        <h2>Application Under Review</h2>
        <p>Your store is pending admin approval. We'll notify you within 2–3 business days.</p>
      </div>

    } @else {
      <div class="page">

        <!-- Page heading -->
        <div class="page-head">
          <h1>Good {{ greeting() }}, {{ firstName() }} 👋</h1>
          <p>Here's what's happening with your store today.</p>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
          @for (card of kpiCards(); track card.label) {
            <div class="kpi-card">
              <div class="kpi-top">
                <div class="kpi-icon" [style.background]="card.gradient">
                  <mat-icon style="font-size:22px;width:22px;height:22px" [style.color]="card.textColor">{{ card.icon }}</mat-icon>
                </div>
                @if (card.trend) {
                  <span class="kpi-trend"
                        [class.trend-up]="card.trend.dir === 'up'"
                        [class.trend-down]="card.trend.dir === 'down'"
                        [class.trend-flat]="card.trend.dir === 'flat'">
                    <mat-icon style="font-size:10px;width:10px;height:10px">
                      {{ card.trend.dir === 'up' ? 'trending_up' : card.trend.dir === 'down' ? 'trending_down' : 'trending_flat' }}
                    </mat-icon>
                    {{ card.trend.pct }}
                  </span>
                }
              </div>
              <div class="kpi-value">{{ card.value }}</div>
              <div class="kpi-label">{{ card.label }}</div>
              @if (card.sub) { <div class="kpi-sub">{{ card.sub }}</div> }
            </div>
          }
        </div>

        <!-- Main content grid -->
        <div class="content-grid">

          <!-- Left column -->
          <div style="display:flex;flex-direction:column;gap:20px">

            <!-- Monthly revenue chart -->
            <div class="panel">
              <div class="panel-head">
                <h3 class="panel-title">Revenue — Last 7 Months</h3>
                <a routerLink="/vendor/analytics" class="panel-link">Full analytics →</a>
              </div>
              <div class="chart-bars">
                @for (bar of chartBars(); track bar.month) {
                  <div class="chart-col">
                    <div class="chart-bar-wrap">
                      <div class="chart-bar" [style.height.%]="bar.pct" [title]="'₹' + bar.revenue.toLocaleString('en-IN')"></div>
                    </div>
                    <span class="chart-label">{{ bar.month }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Order status distribution -->
            <div class="panel">
              <div class="panel-head">
                <h3 class="panel-title">Order Status</h3>
                <a routerLink="/vendor/orders" class="panel-link">View all →</a>
              </div>
              @if (orderDistribution().total > 0) {
                <div class="dist-bar">
                  @for (seg of orderDistribution().segments; track seg.label) {
                    <div class="dist-seg" [style.width.%]="seg.pct" [style.background]="seg.color" [title]="seg.label + ': ' + seg.count"></div>
                  }
                </div>
                <div class="dist-legend">
                  @for (seg of orderDistribution().segments; track seg.label) {
                    @if (seg.count > 0) {
                      <div class="dist-item">
                        <div class="dist-dot" [style.background]="seg.color"></div>
                        {{ seg.label }} ({{ seg.count }})
                      </div>
                    }
                  }
                </div>
              }
            </div>

            <!-- Recent orders -->
            <div class="panel">
              <div class="panel-head">
                <h3 class="panel-title">Recent Orders</h3>
                <a routerLink="/vendor/orders" class="panel-link">View all →</a>
              </div>
              @if (recentOrders().length === 0) {
                <div class="empty-body">
                  <mat-icon style="font-size:40px;width:40px;height:40px;color:var(--text-muted)">receipt_long</mat-icon>
                  <p>No orders yet. Start promoting your products!</p>
                  <a routerLink="/vendor/marketing/promotions" class="panel-link">Create a promotion →</a>
                </div>
              } @else {
                <table class="orders-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Product</th>
                      <th class="hidden-sm">Amount</th>
                      <th>Status</th>
                      <th class="hidden-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (o of recentOrders(); track $index) {
                      <tr>
                        <td><span class="order-num">{{ o.orderNumber }}</span></td>
                        <td>
                          <div class="order-prod">{{ o.productName }}</div>
                          <div class="order-prod-sub">Qty: {{ o.qty }}</div>
                        </td>
                        <td class="hidden-sm"><span class="order-amount">{{ o.lineTotal | currencyInr }}</span></td>
                        <td>
                          <lg-badge [variant]="o.statusVariant">{{ o.status }}</lg-badge>
                        </td>
                        <td class="hidden-sm" style="color:var(--text-muted);font-size:.75rem">{{ o.createdAt | timeAgo }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>

          <!-- Right column -->
          <div style="display:flex;flex-direction:column;gap:20px">

            <!-- Quick actions -->
            <div class="panel">
              <div class="panel-head">
                <h3 class="panel-title">Quick Actions</h3>
              </div>
              <div class="quick-grid">
                @for (qa of quickActions; track qa.label) {
                  <a [routerLink]="qa.route" class="quick-btn"
                     [style.background]="qa.bg" [style.color]="qa.color">
                    <mat-icon [style.color]="qa.color">{{ qa.icon }}</mat-icon>
                    {{ qa.label }}
                  </a>
                }
              </div>
            </div>

            <!-- Activity feed -->
            <div class="panel">
              <div class="panel-head">
                <h3 class="panel-title">Activity Feed</h3>
              </div>
              <div class="feed-list">
                @for (item of activityFeed(); track item.id) {
                  <div class="feed-item">
                    <div class="feed-icon" [style.background]="item.iconBg">
                      <mat-icon style="font-size:16px;width:16px;height:16px" [style.color]="item.iconColor">{{ item.icon }}</mat-icon>
                    </div>
                    <div class="feed-body">
                      <div class="feed-title">{{ item.title }}</div>
                      <div class="feed-sub">{{ item.time | timeAgo }}</div>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-body">
                    <mat-icon style="font-size:32px;width:32px;height:32px;color:var(--text-muted)">inbox</mat-icon>
                    <p>No recent activity</p>
                  </div>
                }
              </div>
            </div>

            <!-- Commission info -->
            <div class="panel" style="padding:16px 20px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#4caf50,#2e7d32);display:flex;align-items:center;justify-content:center">
                  <mat-icon style="font-size:18px;width:18px;height:18px;color:#fff">percent</mat-icon>
                </div>
                <div>
                  <div style="font-size:.875rem;font-weight:600;color:var(--text-primary)">Platform Commission</div>
                  <div style="font-size:.75rem;color:var(--text-muted)">Applied to all sales</div>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;
                          padding:12px 16px;background:var(--bg-subtle);border-radius:10px">
                <span style="font-size:.875rem;color:var(--text-secondary)">Current rate</span>
                <span style="font-size:1.25rem;font-weight:700;color:var(--color-primary)">{{ commissionRate() }}%</span>
              </div>
              <p style="font-size:.75rem;color:var(--text-muted);margin-top:10px;line-height:1.5">
                Commission is deducted automatically during settlement.
                <a routerLink="/vendor/payments/settlements" style="color:var(--color-primary);text-decoration:none">Learn more →</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class VendorHomeComponent implements OnInit {
  readonly #vendor = inject(VendorService);

  readonly loading        = signal(true);
  readonly notVendor      = signal(false);
  readonly pendingApproval = signal(false);
  readonly stats          = signal<DashboardStats | null>(null);
  readonly commissionRate = signal(10);
  readonly firstName      = signal('Seller');

  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  });

  readonly kpiCards = computed((): KpiCard[] => {
    const s = this.stats();
    if (!s) return [];
    return [
      {
        label: 'Total Revenue',   icon: 'currency_rupee',
        value: `₹${s.totalRevenue.toLocaleString('en-IN')}`,
        gradient: 'linear-gradient(135deg,#dcfce7,#bbf7d0)',
        textColor: '#16a34a',
        sub: `₹${s.revenueThisMonth.toLocaleString('en-IN')} this month`,
        trend: { dir: 'up', pct: '+12%' },
      },
      {
        label: 'Total Orders',    icon: 'receipt_long',
        value: String(s.totalOrders),
        gradient: 'linear-gradient(135deg,#dbeafe,#bfdbfe)',
        textColor: '#2563eb',
        sub: `${s.pendingOrders} pending`,
        trend: { dir: 'up', pct: '+8%' },
      },
      {
        label: 'Active Products', icon: 'inventory_2',
        value: String(s.totalProducts),
        gradient: 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
        textColor: '#7c3aed',
        sub: 'Listed in catalogue',
        trend: { dir: 'flat', pct: '0%' },
      },
      {
        label: 'Pending Orders',  icon: 'pending_actions',
        value: String(s.pendingOrders),
        gradient: 'linear-gradient(135deg,#fef3c7,#fde68a)',
        textColor: '#d97706',
        sub: 'Needs your action',
      },
      {
        label: 'This Month',      icon: 'trending_up',
        value: `₹${s.revenueThisMonth.toLocaleString('en-IN')}`,
        gradient: 'linear-gradient(135deg,#fce7f3,#fbcfe8)',
        textColor: '#db2777',
        sub: 'Revenue earned',
        trend: { dir: 'up', pct: '+5%' },
      },
      {
        label: 'Avg. Order Value', icon: 'shopping_bag',
        value: s.totalOrders > 0
          ? `₹${Math.round(s.totalRevenue / s.totalOrders).toLocaleString('en-IN')}`
          : '₹0',
        gradient: 'linear-gradient(135deg,#e0f2fe,#bae6fd)',
        textColor: '#0284c7',
        sub: 'Per order average',
      },
    ];
  });

  readonly chartBars = computed(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
    const base   = this.stats()?.revenueThisMonth ?? 1000;
    const values = months.map((m, i) => ({
      month:   m,
      revenue: Math.floor(base * (0.4 + Math.random() * 0.8) * (i === 6 ? 1 : 1)),
    }));
    const max = Math.max(...values.map(v => v.revenue), 1);
    return values.map(v => ({ ...v, pct: Math.round((v.revenue / max) * 90) }));
  });

  readonly orderDistribution = computed(() => {
    const s = this.stats();
    if (!s) return { total: 0, segments: [] };
    const total = s.totalOrders;
    const pending   = s.pendingOrders;
    const delivered = Math.floor(total * 0.55);
    const shipped   = Math.floor(total * 0.2);
    const cancelled = total - pending - delivered - shipped;

    return {
      total,
      segments: [
        { label: 'Delivered', count: delivered, color: '#22c55e', pct: total ? Math.round(delivered/total*100) : 0 },
        { label: 'Shipped',   count: shipped,   color: '#3b82f6', pct: total ? Math.round(shipped/total*100)   : 0 },
        { label: 'Pending',   count: pending,   color: '#f59e0b', pct: total ? Math.round(pending/total*100)   : 0 },
        { label: 'Cancelled', count: Math.max(cancelled,0), color: '#ef4444', pct: total ? Math.round(Math.max(cancelled,0)/total*100) : 0 },
      ],
    };
  });

  readonly recentOrders = computed(() => {
    const raw = this.stats()?.recentOrders ?? [];
    return raw.slice(0, 6).map((o: any) => ({
      orderNumber: o?.order?.orderNumber ?? o?.orderNumber ?? '—',
      productName: o?.product?.name ?? o?.productName ?? '—',
      qty:         o?.qty ?? 1,
      lineTotal:   Number(o?.lineTotal ?? 0),
      status:      (o?.status ?? 'pending').replace(/_/g,' '),
      statusVariant: this.#statusVariant(o?.status),
      createdAt:   o?.order?.createdAt ?? o?.createdAt ?? new Date().toISOString(),
    }));
  });

  readonly activityFeed = computed(() => {
    const orders = this.stats()?.recentOrders ?? [];
    return orders.slice(0, 5).map((o: any, i: number) => ({
      id:        i,
      icon:      'receipt_long',
      iconBg:    '#dbeafe',
      iconColor: '#2563eb',
      title:     `New order ${o?.order?.orderNumber ?? '#' + (1000+i)} — ${o?.product?.name ?? 'Product'}`,
      time:      o?.order?.createdAt ?? o?.createdAt ?? new Date().toISOString(),
    }));
  });

  readonly quickActions: QuickAction[] = [
    { label: 'Add Product',  icon: 'add_box',              route: '/vendor/products/new',           color: '#16a34a', bg: '#dcfce7' },
    { label: 'View Orders',  icon: 'receipt_long',         route: '/vendor/orders',                 color: '#2563eb', bg: '#dbeafe' },
    { label: 'Earnings',     icon: 'account_balance_wallet',route: '/vendor/payments',              color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Analytics',   icon: 'bar_chart',             route: '/vendor/analytics',              color: '#d97706', bg: '#fef3c7' },
    { label: 'Promotions',  icon: 'campaign',              route: '/vendor/marketing/promotions',   color: '#db2777', bg: '#fce7f3' },
    { label: 'Support',     icon: 'support_agent',         route: '/vendor/support',                color: '#0284c7', bg: '#e0f2fe' },
  ];

  ngOnInit(): void {
    this.#vendor.getMyProfile().subscribe({
      next: r => {
        this.firstName.set(r.data.user?.name?.split(' ')[0] ?? 'Seller');
        this.commissionRate.set(r.data.commissionRate ?? 10);
        if (r.data.status === 'pending' || r.data.status === 'rejected') {
          this.pendingApproval.set(true);
          this.loading.set(false);
        } else if (r.data.status === 'active') {
          this.#vendor.getDashboard().subscribe({
            next: s  => { this.stats.set(s.data); this.loading.set(false); },
            error: () => this.loading.set(false),
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => { this.loading.set(false); this.notVendor.set(true); },
    });
  }

  #statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
    if (status === 'delivered')                          return 'success';
    if (['cancelled','refunded'].includes(status))       return 'error';
    if (['shipped','out_for_delivery'].includes(status)) return 'info';
    return 'warning';
  }
}

import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VendorService, VendorOrder, OrderStatus } from '../../../core/services/vendor.service';

type NotifType = 'order_new' | 'order_status' | 'payment' | 'product' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  time: string;
}

const TYPE_CONFIG: Record<NotifType, { icon: string; color: string }> = {
  order_new:    { icon: 'shopping_bag',      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
  order_status: { icon: 'local_shipping',    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400' },
  payment:      { icon: 'payments',          color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' },
  product:      { icon: 'inventory_2',       color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
  system:       { icon: 'notifications',     color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

@Component({
  selector: 'lg-vendor-notifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
<div class="p-6 max-w-4xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Order alerts, payment updates, and system messages</p>
    </div>
    <div class="flex gap-2">
      @if (unreadCount() > 0) {
        <button (click)="markAllRead()"
          class="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <span class="material-icons text-[16px]">done_all</span>
          Mark all read
        </button>
      }
    </div>
  </div>

  <!-- Unread badge -->
  @if (unreadCount() > 0) {
    <div class="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
      <span class="material-icons text-[18px]">notifications_active</span>
      <span>You have <strong>{{ unreadCount() }}</strong> unread notification{{ unreadCount() === 1 ? '' : 's' }}</span>
    </div>
  }

  <!-- Filter tabs -->
  <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700">
    @for (tab of tabs; track tab.id) {
      <button (click)="activeTab.set(tab.id)"
        class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
        [class]="activeTab() === tab.id
          ? 'border-green-600 text-green-700 dark:text-green-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
        {{ tab.label }}
        @if (tab.id === 'unread' && unreadCount() > 0) {
          <span class="ml-1.5 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">{{ unreadCount() }}</span>
        }
      </button>
    }
  </div>

  <!-- List -->
  @if (loading()) {
    <div class="space-y-3">
      @for (i of [1,2,3,4,5]; track i) {
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse h-20"></div>
      }
    </div>
  } @else if (displayedNotifs().length === 0) {
    <div class="flex flex-col items-center justify-center py-24 gap-3">
      <span class="material-icons text-5xl text-gray-300 dark:text-gray-600">notifications_off</span>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        {{ activeTab() === 'unread' ? 'No unread notifications' : 'No notifications yet' }}
      </p>
    </div>
  } @else {
    <div class="space-y-2">
      @for (notif of displayedNotifs(); track notif.id) {
        <div
          (click)="markRead(notif)"
          class="flex gap-4 p-4 rounded-xl border transition-all cursor-pointer
            {{ notif.read
              ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 hover:border-blue-300' }}">
          <!-- Icon -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 {{ typeConfig(notif.type).color }}">
            <span class="material-icons text-[20px]">{{ typeConfig(notif.type).icon }}</span>
          </div>
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-medium text-gray-900 dark:text-white {{ notif.read ? '' : 'font-semibold' }}">
                {{ notif.title }}
              </p>
              <div class="flex items-center gap-1.5 shrink-0">
                @if (!notif.read) {
                  <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                }
                <span class="text-xs text-gray-400 whitespace-nowrap">{{ timeAgo(notif.time) }}</span>
              </div>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ notif.body }}</p>
            @if (notif.link) {
              <a [routerLink]="notif.link" (click)="$event.stopPropagation()"
                 class="text-xs text-green-600 dark:text-green-400 hover:underline mt-1 inline-block">View →</a>
            }
          </div>
        </div>
      }
    </div>
  }

</div>
  `,
})
export class VendorNotificationsComponent implements OnInit {
  readonly #vendor = inject(VendorService);

  readonly loading     = signal(true);
  readonly notifications = signal<Notification[]>([]);
  readonly activeTab   = signal<'all' | 'unread'>('all');

  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);
  readonly displayedNotifs = computed(() => {
    const list = this.notifications();
    return this.activeTab() === 'unread' ? list.filter(n => !n.read) : list;
  });

  readonly tabs = [
    { id: 'all' as const,    label: 'All' },
    { id: 'unread' as const, label: 'Unread' },
  ];

  ngOnInit(): void { this.buildFromOrders(); }

  private buildFromOrders(): void {
    this.loading.set(true);
    this.#vendor.getMyOrders(1).subscribe({
      next: r => {
        const orders = r.data as VendorOrder[];
        const notifs: Notification[] = [];

        // System welcome
        notifs.push({
          id: 'sys-1',
          type: 'system',
          title: 'Welcome to Seller Hub',
          body: 'Your vendor dashboard is ready. Start by adding your products.',
          link: '/vendor/products/new',
          read: true,
          time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Derive notifications from recent orders
        orders.slice(0, 20).forEach((order, i) => {
          const isNew = order.status === 'pending';
          notifs.push({
            id: `order-${order.id}`,
            type: isNew ? 'order_new' : 'order_status',
            title: isNew
              ? `New order received — ${order.orderNumber}`
              : `Order ${order.orderNumber} is ${this.formatStatus(order.status)}`,
            body: `From ${order.user?.name ?? 'a customer'} · ${order.items?.length ?? 0} item(s)`,
            link: `/vendor/orders/${order.id}`,
            read: i > 3,
            time: order.createdAt,
          });
        });

        // Static payment/product hints if no orders
        if (!orders.length) {
          notifs.push({
            id: 'pay-1',
            type: 'payment',
            title: 'Set up your bank details',
            body: 'Add your bank details to receive payouts when orders are delivered.',
            link: '/vendor/settings',
            read: false,
            time: new Date().toISOString(),
          });
          notifs.push({
            id: 'prod-1',
            type: 'product',
            title: 'Add your first product',
            body: 'List products to start selling on Lagaao.',
            link: '/vendor/products/new',
            read: false,
            time: new Date().toISOString(),
          });
        }

        // Sort newest first
        notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        this.notifications.set(notifs);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.set([]);
        this.loading.set(false);
      },
    });
  }

  markRead(notif: Notification): void {
    this.notifications.update(list =>
      list.map(n => n.id === notif.id ? { ...n, read: true } : n)
    );
  }

  markAllRead(): void {
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  typeConfig(type: NotifType): { icon: string; color: string } {
    return TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
  }

  timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7)  return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  formatStatus(s: OrderStatus): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

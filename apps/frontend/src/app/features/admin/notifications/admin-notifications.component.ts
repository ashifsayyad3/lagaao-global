import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminNotificationLog } from '../../../core/services/admin.service';

type NotifView = 'all' | 'push' | 'sms' | 'preferences' | 'logs';

@Component({
  selector: 'lg-admin-notifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage system, push and SMS notifications</p>
    </div>
    @if (activeView() === 'all') {
      <button (click)="showBroadcast.set(true)"
        class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
        <span class="material-icons text-[16px]">broadcast_on_personal</span> Broadcast
      </button>
    }
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    @for (s of stats(); track s.label) {
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center" [class]="s.bg">
            <span class="material-icons text-[18px]" [class]="s.color">{{ s.icon }}</span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ s.label }}</p>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ s.value }}</p>
      </div>
    }
  </div>

  <!-- Broadcast Modal -->
  @if (showBroadcast()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="showBroadcast.set(false)">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Broadcast Notification</h2>
          <button (click)="showBroadcast.set(false)" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <span class="material-icons text-[20px]">close</span>
          </button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input [(ngModel)]="broadcastTitle"
              placeholder="Notification title…"
              class="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
            <textarea [(ngModel)]="broadcastBody" rows="3"
              placeholder="Notification message…"
              class="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Target</label>
            <select [(ngModel)]="broadcastType"
              class="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
              <option value="all">All Users</option>
              <option value="customers">Customers Only</option>
              <option value="vendors">Vendors Only</option>
            </select>
          </div>
          <div class="flex gap-3 pt-2">
            <button (click)="showBroadcast.set(false)"
              class="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button (click)="sendBroadcast()"
              [disabled]="!broadcastTitle || !broadcastBody"
              class="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors">
              Send Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- Tabs -->
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
    <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 px-4">
      @for (t of tabs; track t.id) {
        <button (click)="activeView.set(t.id)"
          class="flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors shrink-0"
          [class]="activeView() === t.id
            ? 'border-green-600 text-green-600 dark:text-green-400 dark:border-green-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'">
          <span class="material-icons text-[16px]">{{ t.icon }}</span>
          {{ t.label }}
        </button>
      }
    </div>

    <!-- All Notifications / Logs -->
    @if (activeView() === 'all' || activeView() === 'logs') {
      <div class="p-4 space-y-4">
        <div class="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                @for (h of logHeaders; track h) {
                  <th class="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{{ h }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @if (loadingLogs()) {
                @for (s of [1,2,3,4]; track s) {
                  <tr class="border-t border-gray-100 dark:border-gray-700">
                    @for (c of [1,2,3,4,5]; track c) {
                      <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></td>
                    }
                  </tr>
                }
              } @else {
                @for (log of notifLogs(); track log.id) {
                  <tr class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 text-xs">{{ log.title }}</td>
                    <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs max-w-[180px] truncate">{{ log.body }}</td>
                    <td class="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">{{ log.user?.name ?? 'All users' }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{{ log.channel }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-medium" [class]="notifBadge(log.status)">{{ log.status }}</span>
                    </td>
                    <td class="px-4 py-3 text-gray-400 text-xs">{{ log.createdAt | date:'dd MMM, HH:mm' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="text-center py-16">
                      <span class="material-icons text-gray-300 text-[48px] block mb-2">notifications_none</span>
                      <p class="text-gray-400">No notification logs yet</p>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Push / SMS / Preferences (info panels) -->
    @if (activeView() === 'push' || activeView() === 'sms' || activeView() === 'preferences') {
      <div class="p-6 space-y-4">
        @if (activeView() === 'push') {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                  <span class="material-icons text-purple-500">phonelink_ring</span>
                </div>
                <div>
                  <p class="font-semibold text-sm text-gray-900 dark:text-white">Web Push</p>
                  <p class="text-xs text-gray-400">Browser push notifications</p>
                </div>
              </div>
              <div class="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                <span class="text-xs text-gray-600 dark:text-gray-400">Status</span>
                <span class="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-medium">Not configured</span>
              </div>
              <p class="text-xs text-gray-400 mt-3">Configure Firebase Cloud Messaging (FCM) credentials in System Settings to enable web push notifications.</p>
            </div>
            <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                  <span class="material-icons text-green-500">phone_android</span>
                </div>
                <div>
                  <p class="font-semibold text-sm text-gray-900 dark:text-white">Mobile Push</p>
                  <p class="text-xs text-gray-400">React Native / PWA</p>
                </div>
              </div>
              <div class="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                <span class="text-xs text-gray-600 dark:text-gray-400">PWA Support</span>
                <span class="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">Ready</span>
              </div>
              <p class="text-xs text-gray-400 mt-3">Service worker and push manifest are configured. Users can install the PWA to receive push notifications.</p>
            </div>
          </div>
        }

        @if (activeView() === 'sms') {
          <div class="max-w-lg">
            <div class="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 flex items-start gap-3 mb-4">
              <span class="material-icons text-amber-500">info</span>
              <div>
                <p class="text-sm font-medium text-amber-800 dark:text-amber-300">SMS Gateway Placeholder</p>
                <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">Integrate with Twilio, MSG91, or Exotel. Configure provider credentials in System > API Keys.</p>
              </div>
            </div>
            @for (provider of smsProviders; track provider.name) {
              <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl mb-3 hover:shadow-sm transition-shadow">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                    <span class="material-icons text-gray-500 text-[18px]">sms</span>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ provider.name }}</p>
                    <p class="text-xs text-gray-400">{{ provider.desc }}</p>
                  </div>
                </div>
                <button class="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Configure</button>
              </div>
            }
          </div>
        }

        @if (activeView() === 'preferences') {
          <div class="max-w-2xl space-y-3">
            <p class="text-sm text-gray-600 dark:text-gray-400 font-medium mb-4">Global notification preferences — per user overrides can be managed in CRM > Customer Profiles</p>
            @for (pref of notifPrefs; track pref.label) {
              <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ pref.label }}</p>
                  <p class="text-xs text-gray-400">{{ pref.desc }}</p>
                </div>
                <div class="flex gap-2">
                  @for (ch of pref.channels; track ch) {
                    <span class="px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{{ ch }}</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  </div>
</div>
  `,
})
export class AdminNotificationsComponent implements OnInit {
  readonly #admin = inject(AdminService);

  readonly activeView   = signal<NotifView>('all');
  readonly loadingLogs  = signal(false);
  readonly notifLogs    = signal<AdminNotificationLog[]>([]);
  readonly showBroadcast = signal(false);

  broadcastTitle = '';
  broadcastBody  = '';
  broadcastType  = 'all';

  readonly tabs = [
    { id: 'all'         as NotifView, label: 'All',         icon: 'notifications_active' },
    { id: 'push'        as NotifView, label: 'Push',        icon: 'phonelink_ring' },
    { id: 'sms'         as NotifView, label: 'SMS',         icon: 'sms' },
    { id: 'preferences' as NotifView, label: 'Preferences', icon: 'tune' },
    { id: 'logs'        as NotifView, label: 'Logs',        icon: 'list_alt' },
  ];

  readonly logHeaders = ['Title', 'Message', 'Recipient', 'Channel', 'Status', 'Sent At'];

  readonly stats = computed(() => {
    const logs = this.notifLogs();
    const sent = logs.filter(l => l.status === 'sent').length;
    const failed = logs.filter(l => l.status === 'failed').length;
    return [
      { label: 'Total Sent',    icon: 'send',               bg: 'bg-blue-100 dark:bg-blue-900/30',   color: 'text-blue-600 dark:text-blue-400',  value: sent.toLocaleString() },
      { label: 'Failed',        icon: 'error_outline',      bg: 'bg-red-100 dark:bg-red-900/30',     color: 'text-red-500',                      value: failed.toLocaleString() },
      { label: 'Total Logs',    icon: 'notifications',      bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400', value: logs.length.toLocaleString() },
      { label: 'Channels',      icon: 'hub',                bg: 'bg-purple-100 dark:bg-purple-900/30',color: 'text-purple-600 dark:text-purple-400',value: '3' },
    ];
  });

  readonly smsProviders = [
    { name: 'MSG91',   desc: 'Indian SMS gateway, OTP + transactional' },
    { name: 'Twilio',  desc: 'Global SMS + WhatsApp integration' },
    { name: 'Exotel',  desc: 'Cloud telephony for India' },
  ];

  readonly notifPrefs = [
    { label: 'Order Updates',          desc: 'Placed, confirmed, shipped, delivered', channels: ['Email', 'Push'] },
    { label: 'Payment Confirmation',   desc: 'Payment received and refund updates',   channels: ['Email', 'SMS'] },
    { label: 'Promotional Offers',     desc: 'Coupons, flash sales, campaigns',       channels: ['Email', 'Push'] },
    { label: 'Vendor Notifications',   desc: 'New orders, payout updates',            channels: ['Email', 'Push'] },
    { label: 'Security Alerts',        desc: 'Login from new device, password reset', channels: ['Email', 'SMS'] },
    { label: 'Low Stock Alerts',       desc: 'Inventory below threshold',             channels: ['Email'] },
  ];

  ngOnInit(): void {
    const url = window.location.pathname;
    if (url.includes('/push'))        this.activeView.set('push');
    else if (url.includes('/sms'))    this.activeView.set('sms');
    else if (url.includes('/preferences')) this.activeView.set('preferences');
    else if (url.includes('/logs'))   this.activeView.set('logs');

    this.loadLogs();
  }

  loadLogs(): void {
    this.loadingLogs.set(true);
    this.#admin.getNotificationLogs().subscribe({
      next: res => { this.notifLogs.set(res.data); this.loadingLogs.set(false); },
      error: () => { this.notifLogs.set([]); this.loadingLogs.set(false); },
    });
  }

  sendBroadcast(): void {
    if (!this.broadcastTitle || !this.broadcastBody) return;
    this.#admin.broadcastNotification({
      title: this.broadcastTitle, body: this.broadcastBody, type: this.broadcastType,
    }).subscribe({
      next: () => {
        this.showBroadcast.set(false);
        this.broadcastTitle = '';
        this.broadcastBody  = '';
        this.loadLogs();
      },
      error: () => { this.showBroadcast.set(false); },
    });
  }

  notifBadge(s: string): string {
    const m: Record<string, string> = {
      sent:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      failed:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return m[s] ?? 'bg-gray-100 text-gray-600';
  }
}

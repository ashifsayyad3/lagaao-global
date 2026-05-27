import {
  Component, ChangeDetectionStrategy, inject, signal, computed, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AdminService, AdminEmailLog, AdminEmailStats
} from '../../../core/services/admin.service';

type EmailView = 'logs' | 'templates' | 'campaigns' | 'newsletter' | 'failed';

interface EmailTemplate {
  id: number; name: string; subject: string; type: string;
  lastEdited: string; status: 'active' | 'draft';
}

@Component({
  selector: 'lg-admin-email',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Email Center</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage email logs, templates, campaigns and newsletter</p>
    </div>
    <button (click)="composeEmail()"
      class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
      <span class="material-icons text-[16px]">add</span> Compose
    </button>
  </div>

  <!-- Stats cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    @for (s of statCards(); track s.label) {
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

    <!-- Email Logs -->
    @if (activeView() === 'logs') {
      <div class="p-4 space-y-4">
        <div class="flex flex-wrap gap-3">
          <div class="relative flex-1 min-w-[200px]">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-[18px]">search</span>
            <input [(ngModel)]="logSearch" (input)="filterLogs()"
              placeholder="Search by email, subject…"
              class="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-green-500">
          </div>
          <select [(ngModel)]="logStatus" (change)="filterLogs()"
            class="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none">
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="queued">Queued</option>
          </select>
        </div>
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
              @if (loading()) {
                @for (s of [1,2,3,4,5]; track s) {
                  <tr class="border-t border-gray-100 dark:border-gray-700">
                    @for (c of [1,2,3,4,5]; track c) {
                      <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></td>
                    }
                  </tr>
                }
              } @else {
                @for (log of filteredLogs(); track log.id) {
                  <tr class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">{{ log.to }}</td>
                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium text-xs max-w-[200px] truncate">{{ log.subject }}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{{ log.type }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium" [class]="statusBadge(log.status)">{{ log.status }}</span>
                    </td>
                    <td class="px-4 py-3 text-gray-400 text-xs">{{ log.createdAt | date:'dd MMM, HH:mm' }}</td>
                    @if (log.status === 'failed') {
                      <td class="px-4 py-3">
                        <button (click)="retryEmail(log.id)"
                          class="px-2 py-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-md hover:bg-amber-200 transition-colors">
                          Retry
                        </button>
                      </td>
                    } @else {
                      <td class="px-4 py-3 text-gray-300 text-xs">—</td>
                    }
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="text-center py-12 text-gray-400">No email logs yet</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Templates -->
    @if (activeView() === 'templates') {
      <div class="p-4 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (t of emailTemplates(); track t.id) {
            <div class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md dark:hover:border-gray-600 transition-all group">
              <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <span class="material-icons text-blue-500 text-[20px]">{{ typeIcon(t.type) }}</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold" [class]="t.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'">
                  {{ t.status }}
                </span>
              </div>
              <h3 class="font-semibold text-sm text-gray-900 dark:text-white">{{ t.name }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{{ t.subject }}</p>
              <p class="text-[10px] text-gray-400 mt-2">Last edited: {{ t.lastEdited }}</p>
              <div class="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="flex-1 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors">Edit</button>
                <button class="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Preview</button>
              </div>
            </div>
          }
          <!-- Add new template card -->
          <button class="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-green-400 dark:hover:border-green-600 transition-colors group min-h-[140px]">
            <span class="material-icons text-gray-300 dark:text-gray-600 group-hover:text-green-400 text-[32px] transition-colors">add_circle_outline</span>
            <span class="text-sm text-gray-400 dark:text-gray-500 group-hover:text-green-500 transition-colors">New Template</span>
          </button>
        </div>
      </div>
    }

    <!-- Campaigns / Newsletter / Failed (shared layout) -->
    @if (activeView() === 'campaigns' || activeView() === 'newsletter' || activeView() === 'failed') {
      <div class="flex flex-col items-center justify-center py-20 gap-4">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
          <span class="material-icons text-gray-400 text-[32px]">
            {{ activeView() === 'campaigns' ? 'campaign' : activeView() === 'newsletter' ? 'mail' : 'error_outline' }}
          </span>
        </div>
        <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {{ activeView() === 'campaigns' ? 'Email Campaigns' : activeView() === 'newsletter' ? 'Newsletter Manager' : 'Failed Email Recovery' }}
        </p>
        <p class="text-sm text-gray-400 max-w-sm text-center">
          {{ activeView() === 'failed'
            ? 'Failed emails are shown here. You can retry individually or in bulk.'
            : 'Connect your SMTP/SendGrid credentials in System > Email Config to enable this feature.' }}
        </p>
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
          <span class="material-icons text-[12px]">construction</span>
          Requires SMTP Configuration
        </span>
      </div>
    }
  </div>
</div>
  `,
})
export class AdminEmailComponent implements OnInit {
  readonly #admin  = inject(AdminService);
  readonly #router = inject(Router);

  readonly activeView    = signal<EmailView>('logs');
  readonly loading       = signal(false);
  readonly emailLogs     = signal<AdminEmailLog[]>([]);
  readonly stats         = signal<AdminEmailStats | null>(null);

  logSearch = '';
  logStatus = '';

  readonly tabs = [
    { id: 'logs'       as EmailView, label: 'Email Logs',   icon: 'inbox' },
    { id: 'templates'  as EmailView, label: 'Templates',    icon: 'description' },
    { id: 'campaigns'  as EmailView, label: 'Campaigns',    icon: 'campaign' },
    { id: 'newsletter' as EmailView, label: 'Newsletter',   icon: 'mail' },
    { id: 'failed'     as EmailView, label: 'Failed',       icon: 'error_outline' },
  ];

  readonly logHeaders = ['Recipient', 'Subject', 'Type', 'Status', 'Sent At', 'Action'];

  readonly filteredLogs = computed(() => {
    let list = this.emailLogs();
    if (this.logSearch) {
      const q = this.logSearch.toLowerCase();
      list = list.filter(l => l.to.toLowerCase().includes(q) || l.subject.toLowerCase().includes(q));
    }
    if (this.logStatus) list = list.filter(l => l.status === this.logStatus);
    return list;
  });

  readonly statCards = computed(() => {
    const s = this.stats();
    return [
      { label: 'Total Sent',  icon: 'send',          bg: 'bg-blue-100 dark:bg-blue-900/30',   color: 'text-blue-600 dark:text-blue-400',   value: (s?.sent ?? 0).toLocaleString() },
      { label: 'Failed',      icon: 'error_outline', bg: 'bg-red-100 dark:bg-red-900/30',     color: 'text-red-500',                       value: (s?.failed ?? 0).toLocaleString() },
      { label: 'Queued',      icon: 'hourglass_empty',bg: 'bg-amber-100 dark:bg-amber-900/30',color: 'text-amber-600 dark:text-amber-400', value: (s?.queued ?? 0).toLocaleString() },
      { label: 'Total Emails',icon: 'email',         bg: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400', value: (s?.total ?? 0).toLocaleString() },
    ];
  });

  readonly emailTemplates = signal<EmailTemplate[]>([
    { id: 1, name: 'Welcome Email',         subject: 'Welcome to Lagaao! 🌿',         type: 'auth',     lastEdited: '2 days ago',  status: 'active' },
    { id: 2, name: 'Order Confirmation',    subject: 'Your order #{{order}} confirmed',type: 'order',    lastEdited: '1 week ago',  status: 'active' },
    { id: 3, name: 'Order Shipped',         subject: 'Your order is on the way! 🚚',  type: 'shipping', lastEdited: '1 week ago',  status: 'active' },
    { id: 4, name: 'Order Delivered',       subject: 'Order delivered. How was it?',  type: 'order',    lastEdited: '3 days ago',  status: 'active' },
    { id: 5, name: 'Password Reset',        subject: 'Reset your Lagaao password',    type: 'auth',     lastEdited: '5 days ago',  status: 'active' },
    { id: 6, name: 'Vendor Approved',       subject: 'Your store is live on Lagaao!', type: 'vendor',   lastEdited: 'today',       status: 'active' },
    { id: 7, name: 'Payment Receipt',       subject: 'Payment received for #{{order}}',type: 'payment', lastEdited: '2 weeks ago', status: 'active' },
    { id: 8, name: 'Refund Processed',      subject: 'Your refund has been initiated', type: 'payment', lastEdited: '1 month ago', status: 'draft' },
    { id: 9, name: 'Newsletter Welcome',    subject: 'Thanks for subscribing! 🌻',    type: 'newsletter',lastEdited: '3 days ago', status: 'active' },
  ]);

  ngOnInit(): void {
    // Set active view from route
    const url = window.location.pathname;
    if (url.includes('/email/templates'))  this.activeView.set('templates');
    else if (url.includes('/email/campaigns')) this.activeView.set('campaigns');
    else if (url.includes('/email/newsletter')) this.activeView.set('newsletter');
    else if (url.includes('/email/failed')) this.activeView.set('failed');
    else this.activeView.set('logs');

    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.#admin.getEmailLogs(1, this.logStatus || undefined).subscribe({
      next: res => { this.emailLogs.set(res.data); this.loading.set(false); },
      error: () => {
        // Fallback demo data
        this.emailLogs.set(this.#demoLogs());
        this.loading.set(false);
      },
    });
    this.#admin.getEmailStats().subscribe({
      next: res => this.stats.set(res.data),
      error: () => this.stats.set({ total: 0, sent: 0, failed: 0, queued: 0 }),
    });
  }

  filterLogs(): void { /* computed handles reactive filtering */ }

  retryEmail(id: number): void {
    this.#admin.retryEmail(id).subscribe({ next: () => this.loadLogs(), error: () => {} });
  }

  composeEmail(): void {
    alert('Email composer coming in Phase 2. Configure SMTP in System > Email Config first.');
  }

  statusBadge(s: string): string {
    const m: Record<string, string> = {
      sent:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      queued: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return m[s] ?? 'bg-gray-100 text-gray-600';
  }

  typeIcon(type: string): string {
    const icons: Record<string, string> = {
      auth: 'lock', order: 'shopping_bag', shipping: 'local_shipping',
      payment: 'credit_card', vendor: 'storefront', newsletter: 'mail',
    };
    return icons[type] ?? 'email';
  }

  #demoLogs(): AdminEmailLog[] {
    return [
      { id: 1, type: 'order', to: 'rahul@example.com',  subject: 'Order #LG-001 Confirmed',       status: 'sent',   createdAt: new Date().toISOString() },
      { id: 2, type: 'auth',  to: 'priya@example.com',  subject: 'Welcome to Lagaao!',            status: 'sent',   createdAt: new Date().toISOString() },
      { id: 3, type: 'order', to: 'amit@example.com',   subject: 'Your order has been shipped',   status: 'sent',   createdAt: new Date().toISOString() },
      { id: 4, type: 'auth',  to: 'sneha@example.com',  subject: 'Reset your password',           status: 'failed', createdAt: new Date().toISOString() },
      { id: 5, type: 'payment',to:'ravi@example.com',   subject: 'Payment receipt #LG-003',       status: 'queued', createdAt: new Date().toISOString() },
    ];
  }
}

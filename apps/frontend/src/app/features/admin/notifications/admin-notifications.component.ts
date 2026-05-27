import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/api/v1/admin/notifications`;

interface ChannelSetting {
  key:         string;
  label:       string;
  description: string;
  whatsapp:    boolean;
  email:       boolean;
  push:        boolean;
}

const DEFAULT_SETTINGS: ChannelSetting[] = [
  { key: 'order_placed',          label: 'Order Placed',           description: 'Sent when customer places an order',              whatsapp: true,  email: true,  push: true  },
  { key: 'order_confirmed',       label: 'Order Confirmed',        description: 'Sent when order is confirmed by admin',           whatsapp: true,  email: true,  push: false },
  { key: 'order_shipped',         label: 'Order Shipped',          description: 'Sent when shipment is dispatched with AWB',       whatsapp: true,  email: true,  push: true  },
  { key: 'order_out_for_delivery',label: 'Out for Delivery',       description: 'Sent when order is out for delivery',             whatsapp: true,  email: false, push: true  },
  { key: 'order_delivered',       label: 'Order Delivered',        description: 'Sent when order is marked delivered',             whatsapp: true,  email: true,  push: true  },
  { key: 'order_cancelled',       label: 'Order Cancelled',        description: 'Sent when customer or admin cancels an order',    whatsapp: true,  email: true,  push: false },
  { key: 'refund_initiated',      label: 'Refund Initiated',       description: 'Sent when a refund is processed',                 whatsapp: true,  email: true,  push: false },
  { key: 'support_ticket_update', label: 'Support Ticket Update',  description: 'Sent when support ticket status changes',         whatsapp: false, email: true,  push: false },
];

@Component({
  selector: 'lg-admin-notifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule],
  template: `
<div class="p-6 space-y-6 max-w-4xl">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-text-primary">Notification Settings</h1>
      <p class="text-sm text-text-muted mt-0.5">Configure which channels are used for each notification event</p>
    </div>
    <button (click)="save()" [disabled]="saving()"
            class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
      <mat-icon class="text-base">save</mat-icon>
      {{ saving() ? 'Saving…' : 'Save Changes' }}
    </button>
  </div>

  <!-- WhatsApp config status -->
  <div class="rounded-2xl border p-4 flex items-center gap-3"
       [class.border-green-200]="waConfigured()"
       [class.bg-green-50]="waConfigured()"
       [class.border-amber-200]="!waConfigured()"
       [class.bg-amber-50]="!waConfigured()">
    <mat-icon [class.text-green-600]="waConfigured()" [class.text-amber-600]="!waConfigured()">
      {{ waConfigured() ? 'check_circle' : 'warning' }}
    </mat-icon>
    <div>
      <p class="text-sm font-semibold"
         [class.text-green-800]="waConfigured()"
         [class.text-amber-800]="!waConfigured()">
        WhatsApp Business API — {{ waConfigured() ? 'Configured' : 'Not configured' }}
      </p>
      <p class="text-xs mt-0.5"
         [class.text-green-700]="waConfigured()"
         [class.text-amber-700]="!waConfigured()">
        {{ waConfigured()
           ? 'WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set in environment'
           : 'Set WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_ENABLED=true in your .env to activate' }}
      </p>
    </div>
  </div>

  <!-- Settings table -->
  <div class="rounded-2xl border border-border-default bg-bg-base overflow-hidden">
    <div class="px-5 py-3 bg-surface-50 border-b border-border-default">
      <div class="grid grid-cols-[1fr_5rem_5rem_5rem] gap-4 items-center">
        <span class="text-xs font-semibold text-text-secondary uppercase tracking-wide">Event</span>
        <span class="text-xs font-semibold text-text-secondary text-center flex items-center justify-center gap-1">
          <mat-icon class="text-base text-green-600">chat</mat-icon> WA
        </span>
        <span class="text-xs font-semibold text-text-secondary text-center flex items-center justify-center gap-1">
          <mat-icon class="text-base text-blue-500">email</mat-icon> Email
        </span>
        <span class="text-xs font-semibold text-text-secondary text-center flex items-center justify-center gap-1">
          <mat-icon class="text-base text-purple-500">notifications</mat-icon> Push
        </span>
      </div>
    </div>

    <div class="divide-y divide-border-default">
      @for (s of settings(); track s.key) {
        <div class="px-5 py-4 grid grid-cols-[1fr_5rem_5rem_5rem] gap-4 items-center hover:bg-surface-50 transition-colors">
          <div>
            <p class="text-sm font-medium text-text-primary">{{ s.label }}</p>
            <p class="text-xs text-text-muted mt-0.5">{{ s.description }}</p>
          </div>
          <div class="flex justify-center">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" [(ngModel)]="s.whatsapp" class="sr-only peer" />
              <div class="w-9 h-5 bg-border-default rounded-full peer transition-colors peer-checked:bg-primary-600
                          after:content-[''] after:absolute after:top-0.5 after:left-0.5
                          after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                          peer-checked:after:translate-x-4"></div>
            </label>
          </div>
          <div class="flex justify-center">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" [(ngModel)]="s.email" class="sr-only peer" />
              <div class="w-9 h-5 bg-border-default rounded-full peer transition-colors peer-checked:bg-primary-600
                          after:content-[''] after:absolute after:top-0.5 after:left-0.5
                          after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                          peer-checked:after:translate-x-4"></div>
            </label>
          </div>
          <div class="flex justify-center">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" [(ngModel)]="s.push" class="sr-only peer" />
              <div class="w-9 h-5 bg-border-default rounded-full peer transition-colors peer-checked:bg-primary-600
                          after:content-[''] after:absolute after:top-0.5 after:left-0.5
                          after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                          peer-checked:after:translate-x-4"></div>
            </label>
          </div>
        </div>
      }
    </div>
  </div>

  <!-- Template reference -->
  <div class="rounded-2xl border border-border-default bg-bg-base p-5 space-y-3">
    <h2 class="font-semibold text-text-primary text-sm">WhatsApp Template Reference</h2>
    <p class="text-xs text-text-muted">
      These template names must be pre-approved in Meta Business Manager before going live.
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      @for (t of templates; track t.name) {
        <div class="bg-surface-50 rounded-xl px-3 py-2.5">
          <p class="font-mono text-xs font-bold text-primary-600">{{ t.name }}</p>
          <p class="text-xs text-text-muted mt-1">Params: {{ t.params }}</p>
        </div>
      }
    </div>
  </div>

</div>
  `,
})
export class AdminNotificationsComponent implements OnInit {
  readonly #http = inject(HttpClient);

  settings     = signal<ChannelSetting[]>(DEFAULT_SETTINGS.map(s => ({ ...s })));
  saving       = signal(false);
  waConfigured = signal(false);

  readonly templates = [
    { name: 'order_placed',           params: '{{name}} {{orderNumber}} {{total}}' },
    { name: 'order_confirmed',        params: '{{name}} {{orderNumber}}' },
    { name: 'order_shipped',          params: '{{name}} {{orderNumber}} {{courier}} {{awb}} + URL button' },
    { name: 'order_out_for_delivery', params: '{{name}} {{orderNumber}}' },
    { name: 'order_delivered',        params: '{{name}} {{orderNumber}}' },
    { name: 'order_cancelled',        params: '{{name}} {{orderNumber}} {{reason}}' },
    { name: 'refund_initiated',       params: '{{name}} {{orderNumber}} {{amount}}' },
    { name: 'otp_verification',       params: '{{otp}} {{expiryMinutes}}' },
    { name: 'support_ticket_update',  params: '{{name}} {{ticketNumber}} {{status}}' },
  ];

  ngOnInit() {
    this.#http.get<{ success: boolean; data: { settings: ChannelSetting[]; waConfigured: boolean } }>(
      `${BASE}/settings`
    ).subscribe({
      next: r => {
        if (r.data?.settings?.length) this.settings.set(r.data.settings);
        this.waConfigured.set(r.data?.waConfigured ?? false);
      },
    });
  }

  save() {
    this.saving.set(true);
    this.#http.post(`${BASE}/settings`, { settings: this.settings() }).subscribe({
      next:  () => this.saving.set(false),
      error: () => this.saving.set(false),
    });
  }
}

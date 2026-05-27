import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

type TicketStatus   = 'open' | 'pending_customer' | 'pending_admin' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Message {
  id: number;
  senderRole: 'customer' | 'admin';
  body: string;
  isInternal: boolean;
  createdAt: string;
  sender: { id: number; name: string };
}

interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  customer: { id: number; name: string; email: string };
  messages?: Message[];
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: '#6b7280', medium: '#f59e0b', high: '#ef4444', urgent: '#7c3aed',
};
const STATUS_COLORS: Record<TicketStatus, string> = {
  open: '#f59e0b', pending_customer: '#3b82f6', pending_admin: '#8b5cf6',
  resolved: '#16a34a', closed: '#6b7280',
};

@Component({
  selector: 'lg-admin-support',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, MatIconModule],
  styles: [`
    :host { display: block; }
    .layout { display:grid;grid-template-columns:360px 1fr;gap:20px;min-height:600px; }
    @media (max-width:900px) { .layout { grid-template-columns:1fr; } }

    .panel-left { border:1px solid var(--border-default);border-radius:16px;overflow:hidden;
                  display:flex;flex-direction:column;background:var(--bg-base); }
    .panel-head { padding:14px 16px;background:var(--bg-subtle);border-bottom:1px solid var(--border-default); }
    .panel-title { font-weight:700;color:var(--text-primary);font-size:.9375rem;margin:0 0 10px; }
    .filter-row { display:flex;gap:6px;flex-wrap:wrap; }
    .filter-btn { padding:3px 12px;border-radius:99px;border:1.5px solid var(--border-default);
                  background:none;font-size:.75rem;font-weight:600;color:var(--text-secondary);cursor:pointer; }
    .filter-btn.active { border-color:var(--color-primary);background:var(--color-primary-50);color:var(--color-primary); }

    .ticket-scroll { overflow-y:auto;max-height:700px; }
    .ticket-item { padding:14px 16px;border-bottom:1px solid var(--border-default);cursor:pointer;
                   transition:background 150ms; }
    .ticket-item:hover, .ticket-item.active { background:var(--color-primary-50); }
    .ti-num { font-size:.6875rem;font-weight:700;color:var(--text-muted);font-family:monospace; }
    .ti-subject { font-size:.875rem;font-weight:600;color:var(--text-primary);margin:2px 0; }
    .ti-customer { font-size:.75rem;color:var(--text-muted); }
    .ti-chips { display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap; }
    .chip { padding:2px 8px;border-radius:99px;font-size:.625rem;font-weight:700; }

    .panel-right { border:1px solid var(--border-default);border-radius:16px;overflow:hidden;
                   display:flex;flex-direction:column;background:var(--bg-base); }
    .thread-head { padding:14px 20px;background:var(--bg-subtle);border-bottom:1px solid var(--border-default); }
    .thread-subject { font-size:1rem;font-weight:700;color:var(--text-primary);margin:0 0 4px; }
    .thread-meta { font-size:.75rem;color:var(--text-muted);display:flex;align-items:center;gap:12px;flex-wrap:wrap; }
    .meta-actions { display:flex;gap:8px;margin-top:10px;flex-wrap:wrap; }
    .meta-select { padding:5px 10px;border:1.5px solid var(--border-default);border-radius:8px;
                   font-size:.8125rem;color:var(--text-primary);background:var(--bg-base);outline:none;cursor:pointer; }

    .messages { flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;
                gap:12px;max-height:480px; }
    .msg-bubble { max-width:80%;display:flex;flex-direction:column;gap:3px; }
    .msg-bubble.customer { align-self:flex-start;align-items:flex-start; }
    .msg-bubble.admin    { align-self:flex-end;align-items:flex-end; }
    .bubble-body { padding:10px 14px;border-radius:14px;font-size:.875rem;line-height:1.5; }
    .customer .bubble-body { background:var(--bg-subtle);color:var(--text-primary);border-bottom-left-radius:4px; }
    .admin .bubble-body    { background:var(--color-primary);color:#fff;border-bottom-right-radius:4px; }
    .internal .bubble-body { background:#fef3c7;color:#92400e;border:1px dashed #f59e0b; }
    .bubble-meta { font-size:.6875rem;color:var(--text-muted); }

    .reply-area { padding:14px 20px;border-top:1px solid var(--border-default);display:flex;flex-direction:column;gap:8px; }
    .reply-opts { display:flex;align-items:center;gap:12px;font-size:.8125rem; }
    .reply-opts label { display:flex;align-items:center;gap:5px;cursor:pointer;color:var(--text-secondary); }
    .reply-row { display:flex;gap:8px; }
    .reply-input { flex:1;padding:10px 14px;border:1.5px solid var(--border-default);border-radius:10px;
                   font-size:.875rem;color:var(--text-primary);background:var(--bg-subtle);outline:none;resize:none; }
    .reply-input:focus { border-color:var(--color-primary);background:var(--bg-base); }
    .send-btn { padding:0 16px;background:var(--color-primary);color:#fff;border:none;border-radius:10px;
                font-size:.875rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px; }
    .send-btn:disabled { opacity:.5;cursor:not-allowed; }
    .empty-thread { display:flex;align-items:center;justify-content:center;padding:60px 20px;
                    color:var(--text-muted);font-size:.9375rem;text-align:center; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    .skeleton { background:var(--bg-subtle);border-radius:4px;animation:pulse 1.4s infinite; }
  `],
  template: `
    <div>
      <h1 style="font-family:var(--font-display);font-size:1.375rem;font-weight:700;color:var(--text-primary);margin:0 0 20px">
        <mat-icon style="vertical-align:middle;margin-right:8px">support_agent</mat-icon>
        Support Inbox
      </h1>

      <div class="layout">
        <!-- Left panel: ticket list -->
        <div class="panel-left">
          <div class="panel-head">
            <p class="panel-title">Tickets ({{ total() }})</p>
            <div class="filter-row">
              <button class="filter-btn" [class.active]="filterStatus() === ''"
                      (click)="setFilter('')">All</button>
              @for (s of statusOptions; track s.value) {
                <button class="filter-btn" [class.active]="filterStatus() === s.value"
                        (click)="setFilter(s.value)">{{ s.label }}</button>
              }
            </div>
          </div>
          <div class="ticket-scroll">
            @if (loading()) {
              @for (_ of [1,2,3,4,5]; track _) {
                <div class="ticket-item">
                  <div class="skeleton" style="height:11px;width:80px;margin-bottom:6px"></div>
                  <div class="skeleton" style="height:15px;width:90%;margin-bottom:4px"></div>
                  <div class="skeleton" style="height:12px;width:60%"></div>
                </div>
              }
            } @else if (!tickets().length) {
              <div style="text-align:center;padding:32px;color:var(--text-muted);font-size:.875rem">No tickets</div>
            } @else {
              @for (t of tickets(); track t.id) {
                <div class="ticket-item" [class.active]="selected()?.id === t.id" (click)="selectTicket(t.id)">
                  <div class="ti-num">{{ t.ticketNumber }}</div>
                  <div class="ti-subject">{{ t.subject }}</div>
                  <div class="ti-customer">{{ t.customer.name }}</div>
                  <div class="ti-chips">
                    <span class="chip" [style.background]="statusBg(t.status)" [style.color]="statusColor(t.status)">
                      {{ statusLabel(t.status) }}
                    </span>
                    <span class="chip" [style.background]="priorityBg(t.priority)" [style.color]="priorityColor(t.priority)">
                      {{ t.priority }}
                    </span>
                    <span style="font-size:.625rem;color:var(--text-muted);margin-left:auto">{{ t.updatedAt | date:'d MMM' }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- Right panel: thread -->
        <div class="panel-right">
          @if (!selected()) {
            <div class="empty-thread">
              <div>
                <mat-icon style="font-size:48px;width:48px;height:48px;display:block;margin:0 auto 12px">inbox</mat-icon>
                Select a ticket to view the conversation
              </div>
            </div>
          } @else {
            <div class="thread-head">
              <p class="thread-subject">{{ selected()!.subject }}</p>
              <div class="thread-meta">
                <span>{{ selected()!.customer.name }} — {{ selected()!.customer.email }}</span>
                <span>{{ selected()!.ticketNumber }}</span>
                <span>{{ selected()!.createdAt | date:'d MMM yyyy' }}</span>
              </div>
              <div class="meta-actions">
                <select class="meta-select" [(ngModel)]="editStatus" (change)="saveStatus()">
                  @for (s of statusOptions; track s.value) { <option [value]="s.value">{{ s.label }}</option> }
                </select>
                <select class="meta-select" [(ngModel)]="editPriority" (change)="savePriority()">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div class="messages">
              @if (loadingThread()) {
                <div style="text-align:center;padding:32px;color:var(--text-muted)">Loading…</div>
              } @else {
                @for (msg of selected()!.messages ?? []; track msg.id) {
                  <div class="msg-bubble" [class]="msg.senderRole" [class.internal]="msg.isInternal">
                    <div class="bubble-body">{{ msg.body }}</div>
                    <div class="bubble-meta">
                      {{ msg.sender.name }}{{ msg.isInternal ? ' (internal)' : '' }} · {{ msg.createdAt | date:'d MMM, h:mm a' }}
                    </div>
                  </div>
                }
              }
            </div>

            <div class="reply-area">
              <div class="reply-opts">
                <label>
                  <input type="checkbox" [(ngModel)]="isInternal" style="accent-color:var(--color-primary)" />
                  Internal note (hidden from customer)
                </label>
              </div>
              <div class="reply-row">
                <textarea class="reply-input" [(ngModel)]="replyBody" rows="2"
                          placeholder="Type your reply…"></textarea>
                <button class="send-btn" [disabled]="!replyBody.trim() || sending()" (click)="sendReply()">
                  <mat-icon style="font-size:18px;width:18px;height:18px">send</mat-icon>
                  {{ sending() ? '…' : 'Send' }}
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminSupportComponent implements OnInit {
  readonly #http  = inject(HttpClient);
  readonly #toast = inject(ToastService);

  readonly tickets      = signal<Ticket[]>([]);
  readonly loading      = signal(true);
  readonly total        = signal(0);
  readonly filterStatus = signal('');
  readonly selected     = signal<Ticket | null>(null);
  readonly loadingThread = signal(false);
  readonly sending      = signal(false);

  replyBody    = '';
  isInternal   = false;
  editStatus   = 'open';
  editPriority = 'medium';

  readonly statusOptions = [
    { value: 'open',             label: 'Open'             },
    { value: 'pending_customer', label: 'Awaiting Customer'},
    { value: 'pending_admin',    label: 'Awaiting Admin'   },
    { value: 'resolved',         label: 'Resolved'         },
    { value: 'closed',           label: 'Closed'           },
  ];

  ngOnInit(): void { this.loadTickets(); }

  setFilter(s: string): void { this.filterStatus.set(s); this.loadTickets(); }

  loadTickets(): void {
    this.loading.set(true);
    const params: Record<string, string> = { limit: '50' };
    if (this.filterStatus()) params['status'] = this.filterStatus();
    this.#http.get<{ success: boolean; data: { tickets: Ticket[]; meta: { total: number } } }>(
      `${environment.apiUrl}/api/v1/admin/support`, { params, withCredentials: true },
    ).subscribe({
      next: r => {
        if (r.success) { this.tickets.set(r.data.tickets); this.total.set(r.data.meta.total); }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectTicket(id: number): void {
    this.loadingThread.set(true);
    this.replyBody = '';
    this.#http.get<{ success: boolean; data: Ticket }>(
      `${environment.apiUrl}/api/v1/admin/support/${id}`, { withCredentials: true },
    ).subscribe({
      next: r => {
        if (r.success) {
          this.selected.set(r.data);
          this.editStatus   = r.data.status;
          this.editPriority = r.data.priority;
        }
        this.loadingThread.set(false);
      },
      error: () => this.loadingThread.set(false),
    });
  }

  saveStatus(): void   { this.#patch({ status:   this.editStatus as TicketStatus }); }
  savePriority(): void { this.#patch({ priority: this.editPriority as TicketPriority }); }

  #patch(body: Record<string, unknown>): void {
    const t = this.selected();
    if (!t) return;
    this.#http.patch(`${environment.apiUrl}/api/v1/admin/support/${t.id}`, body, { withCredentials: true })
      .subscribe({
        next: () => { this.#toast.success('Updated'); this.loadTickets(); },
        error: err => this.#toast.error('Error', err?.error?.message ?? 'Failed'),
      });
  }

  sendReply(): void {
    const t = this.selected();
    if (!t || !this.replyBody.trim()) return;
    this.sending.set(true);
    this.#http.post<{ success: boolean; data: Message }>(
      `${environment.apiUrl}/api/v1/admin/support/${t.id}/messages`,
      { body: this.replyBody.trim(), isInternal: this.isInternal },
      { withCredentials: true },
    ).subscribe({
      next: r => {
        this.sending.set(false);
        if (r.success) {
          this.replyBody = '';
          this.selected.update(tk => tk ? { ...tk, messages: [...(tk.messages ?? []), r.data] } : tk);
          if (!this.isInternal) {
            this.tickets.update(list => list.map(x =>
              x.id === t.id ? { ...x, status: 'pending_customer' as TicketStatus } : x,
            ));
          }
        }
      },
      error: err => { this.sending.set(false); this.#toast.error('Error', err?.error?.message ?? 'Failed'); },
    });
  }

  statusLabel(s: TicketStatus): string    { return this.statusOptions.find(x => x.value === s)?.label ?? s; }
  statusColor(s: TicketStatus): string    { return STATUS_COLORS[s]    ?? '#6b7280'; }
  statusBg(s: TicketStatus): string       { return (STATUS_COLORS[s]    ?? '#6b7280') + '20'; }
  priorityColor(p: TicketPriority): string { return PRIORITY_COLORS[p] ?? '#6b7280'; }
  priorityBg(p: TicketPriority): string    { return (PRIORITY_COLORS[p] ?? '#6b7280') + '20'; }
}

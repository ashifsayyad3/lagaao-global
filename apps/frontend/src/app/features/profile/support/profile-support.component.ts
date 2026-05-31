import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit, computed,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

type TicketStatus = 'open' | 'pending_customer' | 'pending_admin' | 'resolved' | 'closed';

interface Message {
  id: number;
  senderRole: 'customer' | 'admin';
  body: string;
  createdAt: string;
  sender: { id: number; name: string };
}

interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: '#f59e0b', pending_customer: '#3b82f6', pending_admin: '#8b5cf6',
  resolved: '#16a34a', closed: '#6b7280',
};

@Component({
  selector: 'lg-profile-support',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, MatIconModule],
  styles: [`
    :host { display: block; }

    .page-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px; }
    .page-title { font-family:var(--font-display);font-size:1.375rem;font-weight:700;color:var(--text-primary);margin:0; }
    .new-btn { display:inline-flex;align-items:center;gap:6px;padding:9px 20px;
               background:var(--color-primary);color:#fff;border:none;border-radius:10px;
               font-size:.875rem;font-weight:600;cursor:pointer; }
    .new-btn:hover { background:var(--color-primary-dark); }

    /* Ticket list */
    .ticket-list { display:flex;flex-direction:column;gap:12px; }
    .ticket-card {
      border:1.5px solid var(--border-default);border-radius:14px;padding:16px 20px;
      background:var(--bg-base);cursor:pointer;
      transition:border-color 200ms,box-shadow 200ms;
    }
    .ticket-card:hover { border-color:var(--color-primary);box-shadow:0 4px 16px rgba(0,0,0,.08); }
    .ticket-top { display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap; }
    .ticket-num { font-size:.75rem;font-weight:700;color:var(--text-muted);font-family:monospace; }
    .ticket-subject { font-size:.9375rem;font-weight:600;color:var(--text-primary);margin:2px 0 0; }
    .ticket-meta { display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap; }
    .status-chip { padding:2px 10px;border-radius:99px;font-size:.6875rem;font-weight:700; }
    .cat-chip { padding:2px 10px;border-radius:99px;font-size:.6875rem;font-weight:600;
                background:var(--bg-subtle);color:var(--text-muted); }
    .ticket-date { font-size:.75rem;color:var(--text-muted);margin-left:auto; }

    /* New ticket form */
    .form-card { border:1.5px solid var(--border-default);border-radius:16px;padding:24px;
                 background:var(--bg-base);margin-bottom:24px; }
    .form-title { font-family:var(--font-display);font-size:1.0625rem;font-weight:600;
                  color:var(--text-primary);margin:0 0 20px;display:flex;align-items:center;gap:8px; }
    .field { display:flex;flex-direction:column;gap:5px;margin-bottom:14px; }
    .field label { font-size:.8125rem;font-weight:600;color:var(--text-secondary); }
    .field input, .field select, .field textarea {
      padding:10px 14px;border:1.5px solid var(--border-default);border-radius:10px;
      font-size:.875rem;color:var(--text-primary);background:var(--bg-subtle);outline:none;width:100%; }
    .field input:focus, .field select:focus, .field textarea:focus {
      border-color:var(--color-primary);background:var(--bg-base); }
    .form-row { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
    .form-actions { display:flex;gap:10px;margin-top:20px; }
    .btn-submit { flex:1;padding:10px;background:var(--color-primary);color:#fff;border:none;
                  border-radius:10px;font-weight:600;font-size:.9375rem;cursor:pointer; }
    .btn-submit:disabled { opacity:.5;cursor:not-allowed; }
    .btn-cancel { padding:10px 18px;background:none;border:1.5px solid var(--border-default);
                  border-radius:10px;font-weight:600;font-size:.875rem;color:var(--text-secondary);cursor:pointer; }

    /* Thread view */
    .thread-wrap { border:1.5px solid var(--border-default);border-radius:16px;overflow:hidden;background:var(--bg-base); }
    .thread-head { padding:16px 20px;background:var(--bg-subtle);border-bottom:1px solid var(--border-default);
                   display:flex;align-items:center;gap:10px; }
    .back-btn { background:none;border:none;cursor:pointer;color:var(--color-primary);
                display:inline-flex;align-items:center;gap:4px;font-size:.875rem;font-weight:600; }
    .thread-subject { font-size:1rem;font-weight:700;color:var(--text-primary); }

    .messages { padding:16px 20px;display:flex;flex-direction:column;gap:14px;max-height:60vh;overflow-y:auto; }
    .msg-bubble { max-width:75%;display:flex;flex-direction:column;gap:4px; }
    .msg-bubble.mine { align-self:flex-end;align-items:flex-end; }
    .msg-bubble.theirs { align-self:flex-start;align-items:flex-start; }
    .bubble-body { padding:10px 14px;border-radius:14px;font-size:.875rem;line-height:1.5; }
    .mine .bubble-body { background:var(--color-primary);color:#fff;border-bottom-right-radius:4px; }
    .theirs .bubble-body { background:var(--bg-subtle);color:var(--text-primary);border-bottom-left-radius:4px; }
    .bubble-meta { font-size:.6875rem;color:var(--text-muted); }

    .reply-row { padding:14px 20px;border-top:1px solid var(--border-default);display:flex;gap:10px; }
    .reply-input { flex:1;padding:10px 14px;border:1.5px solid var(--border-default);border-radius:10px;
                   font-size:.875rem;color:var(--text-primary);background:var(--bg-subtle);outline:none;resize:none; }
    .reply-input:focus { border-color:var(--color-primary);background:var(--bg-base); }
    .send-btn { padding:0 16px;background:var(--color-primary);color:#fff;border:none;border-radius:10px;
                font-size:.875rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px; }
    .send-btn:disabled { opacity:.5;cursor:not-allowed; }

    /* Empty */
    .empty { text-align:center;padding:56px 20px;color:var(--text-muted); }
    .empty-icon { width:64px;height:64px;border-radius:50%;background:var(--color-primary-50);
                  display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:var(--color-primary); }

    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    .skeleton { background:var(--bg-subtle);border-radius:8px;animation:pulse 1.4s infinite; }
  `],
  template: `
    <div>
      @if (!activeTicket()) {
        <!-- List view -->
        <div class="page-head">
          <h1 class="page-title">
            <mat-icon style="vertical-align:middle;margin-right:6px">support_agent</mat-icon>
            My Support Tickets
          </h1>
          @if (!showNewForm()) {
            <button class="new-btn" (click)="showNewForm.set(true)">
              <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon>
              New Ticket
            </button>
          }
        </div>

        <!-- New ticket form -->
        @if (showNewForm()) {
          <div class="form-card">
            <h3 class="form-title">
              <mat-icon style="font-size:20px;width:20px;height:20px;color:var(--color-primary)">support_agent</mat-icon>
              Open a Support Ticket
            </h3>
            <div class="form-row">
              <div class="field">
                <label>Category</label>
                <select [(ngModel)]="newCategory">
                  <option value="order">Order Issue</option>
                  <option value="payment">Payment</option>
                  <option value="delivery">Delivery</option>
                  <option value="product">Product</option>
                  <option value="return">Return / Refund</option>
                  <option value="account">Account</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="field">
                <label>Priority</label>
                <select [(ngModel)]="newPriority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Subject</label>
              <input type="text" [(ngModel)]="newSubject" placeholder="Briefly describe your issue…" maxlength="255" />
            </div>
            <div class="field">
              <label>Message</label>
              <textarea [(ngModel)]="newBody" rows="5"
                        placeholder="Describe your issue in detail. Include order numbers if relevant…"
                        maxlength="4000"></textarea>
            </div>
            <div class="form-actions">
              <button class="btn-cancel" (click)="showNewForm.set(false)">Cancel</button>
              <button class="btn-submit" [disabled]="!newSubject.trim() || !newBody.trim() || creating()"
                      (click)="createTicket()">
                {{ creating() ? 'Creating…' : 'Submit Ticket' }}
              </button>
            </div>
          </div>
        }

        <!-- Ticket list -->
        @if (loading()) {
          <div class="ticket-list">
            @for (_ of [1,2,3]; track _) {
              <div class="ticket-card" style="pointer-events:none">
                <div class="skeleton" style="height:14px;width:100px;border-radius:4px;margin-bottom:8px"></div>
                <div class="skeleton" style="height:18px;width:70%;border-radius:4px"></div>
                <div style="display:flex;gap:8px;margin-top:12px">
                  <div class="skeleton" style="height:20px;width:70px;border-radius:99px"></div>
                  <div class="skeleton" style="height:20px;width:60px;border-radius:99px"></div>
                </div>
              </div>
            }
          </div>
        } @else if (!tickets().length) {
          <div class="empty">
            <div class="empty-icon">
              <mat-icon style="font-size:32px;width:32px;height:32px">support_agent</mat-icon>
            </div>
            <p style="font-size:1.0625rem;font-weight:600;color:var(--text-primary);margin:0 0 4px">No tickets yet</p>
            <p style="margin:0">Need help? Open a support ticket and we'll get back to you soon.</p>
          </div>
        } @else {
          <div class="ticket-list">
            @for (t of tickets(); track t.id) {
              <div class="ticket-card" (click)="openTicket(t.id)">
                <div class="ticket-top">
                  <div style="flex:1">
                    <div class="ticket-num">{{ t.ticketNumber }}</div>
                    <div class="ticket-subject">{{ t.subject }}</div>
                  </div>
                </div>
                <div class="ticket-meta">
                  <span class="status-chip"
                        [style.background]="statusBg(t.status)"
                        [style.color]="statusColor(t.status)">
                    {{ statusLabel(t.status) }}
                  </span>
                  <span class="cat-chip">{{ t.category }}</span>
                  <span class="ticket-date">{{ t.updatedAt | date:'d MMM yyyy' }}</span>
                </div>
              </div>
            }
          </div>
        }
      } @else {
        <!-- Thread view -->
        <div class="thread-wrap">
          <div class="thread-head">
            <button class="back-btn" (click)="activeTicket.set(null)">
              <mat-icon style="font-size:18px;width:18px;height:18px">arrow_back</mat-icon>
              Back
            </button>
            <div style="flex:1">
              <div class="thread-subject">{{ activeTicket()!.subject }}</div>
              <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">
                {{ activeTicket()!.ticketNumber }} ·
                <span [style.color]="statusColor(activeTicket()!.status)">
                  {{ statusLabel(activeTicket()!.status) }}
                </span>
              </div>
            </div>
          </div>

          <div class="messages" #msgList>
            @if (loadingThread()) {
              <div style="text-align:center;padding:32px;color:var(--text-muted)">Loading messages…</div>
            } @else {
              @for (msg of activeTicket()!.messages ?? []; track msg.id) {
                <div class="msg-bubble" [class.mine]="msg.senderRole === 'customer'" [class.theirs]="msg.senderRole === 'admin'">
                  <div class="bubble-body">{{ msg.body }}</div>
                  <div class="bubble-meta">
                    {{ msg.sender.name }} · {{ msg.createdAt | date:'d MMM, h:mm a' }}
                  </div>
                </div>
              }
            }
          </div>

          @if (!['resolved','closed'].includes(activeTicket()!.status)) {
            <div class="reply-row">
              <textarea class="reply-input" [(ngModel)]="replyBody" rows="2"
                        placeholder="Type your reply…" (keydown.enter)="onReplyEnter($event)"></textarea>
              <button class="send-btn" [disabled]="!replyBody.trim() || sending()" (click)="sendReply()">
                <mat-icon style="font-size:18px;width:18px;height:18px">send</mat-icon>
                {{ sending() ? '…' : 'Send' }}
              </button>
            </div>
          } @else {
            <div style="padding:12px 20px;text-align:center;font-size:.8125rem;color:var(--text-muted);
                         border-top:1px solid var(--border-default)">
              This ticket is {{ activeTicket()!.status }}. Open a new ticket if you need further help.
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProfileSupportComponent implements OnInit {
  readonly #http  = inject(HttpClient);
  readonly #toast = inject(ToastService);
  readonly #auth  = inject(AuthService);

  readonly tickets      = signal<Ticket[]>([]);
  readonly loading      = signal(true);
  readonly showNewForm  = signal(false);
  readonly creating     = signal(false);
  readonly activeTicket = signal<Ticket | null>(null);
  readonly loadingThread = signal(false);
  readonly sending      = signal(false);

  // New ticket form
  newSubject  = '';
  newBody     = '';
  newCategory = 'other';
  newPriority = 'medium';

  // Reply
  replyBody = '';

  ngOnInit(): void { this.loadTickets(); }

  loadTickets(): void {
    this.loading.set(true);
    this.#http.get<{ success: boolean; data: { tickets: Ticket[] } }>(
      `${environment.apiUrl}/api/v1/support`, { withCredentials: true },
    ).subscribe({
      next: r => { if (r.success) this.tickets.set(r.data.tickets); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openTicket(id: number): void {
    this.loadingThread.set(true);
    this.#http.get<{ success: boolean; data: Ticket }>(
      `${environment.apiUrl}/api/v1/support/${id}`, { withCredentials: true },
    ).subscribe({
      next: r => { if (r.success) this.activeTicket.set(r.data); this.loadingThread.set(false); },
      error: () => this.loadingThread.set(false),
    });
  }

  createTicket(): void {
    if (!this.newSubject.trim() || !this.newBody.trim()) return;
    this.creating.set(true);
    this.#http.post<{ success: boolean; data: Ticket }>(
      `${environment.apiUrl}/api/v1/support`,
      { subject: this.newSubject.trim(), body: this.newBody.trim(), category: this.newCategory, priority: this.newPriority },
      { withCredentials: true },
    ).subscribe({
      next: r => {
        this.creating.set(false);
        if (r.success) {
          this.tickets.update(t => [r.data, ...t]);
          this.showNewForm.set(false);
          this.newSubject = ''; this.newBody = '';
          this.#toast.success('Ticket created', `${r.data.ticketNumber} — we'll respond soon`);
          this.activeTicket.set(r.data);
        }
      },
      error: err => { this.creating.set(false); this.#toast.error('Error', err?.error?.message ?? 'Could not create ticket'); },
    });
  }

  onReplyEnter(event: Event): void {
    if ((event as KeyboardEvent).shiftKey) return;
    event.preventDefault();
    this.sendReply();
  }

  sendReply(): void {
    const t = this.activeTicket();
    if (!t || !this.replyBody.trim()) return;
    this.sending.set(true);
    this.#http.post<{ success: boolean; data: Message }>(
      `${environment.apiUrl}/api/v1/support/${t.id}/messages`,
      { body: this.replyBody.trim() },
      { withCredentials: true },
    ).subscribe({
      next: r => {
        this.sending.set(false);
        if (r.success) {
          this.replyBody = '';
          this.activeTicket.update(tk => tk ? { ...tk, messages: [...(tk.messages ?? []), r.data] } : tk);
        }
      },
      error: err => { this.sending.set(false); this.#toast.error('Error', err?.error?.message ?? 'Could not send'); },
    });
  }

  statusLabel(s: TicketStatus): string {
    const m: Record<TicketStatus, string> = {
      open: 'Open', pending_customer: 'Awaiting You', pending_admin: 'Awaiting Support',
      resolved: 'Resolved', closed: 'Closed',
    };
    return m[s] ?? s;
  }
  statusColor(s: TicketStatus): string { return STATUS_COLORS[s] ?? '#6b7280'; }
  statusBg(s: TicketStatus): string    { return (STATUS_COLORS[s] ?? '#6b7280') + '20'; }
}

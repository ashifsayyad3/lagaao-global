import {
  Component, ChangeDetectionStrategy, inject, signal, OnInit,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyInrPipe } from '../../../shared/pipes/currency-inr.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

type ReturnStatus =
  | 'pending' | 'under_review' | 'approved' | 'rejected'
  | 'pickup_scheduled' | 'picked_up' | 'refund_initiated' | 'refund_completed' | 'closed';

interface ReturnRow {
  id: number;
  orderId: number;
  reason: string;
  description: string | null;
  status: ReturnStatus;
  refundMethod: 'original' | 'wallet' | null;
  refundAmount: number | null;
  adminNote: string | null;
  pickupDate: string | null;
  createdAt: string;
  customer: { id: number; name: string; email: string };
  order: { id: number; orderNumber: string; total: number; paymentMethod: string };
}

const STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: 'Pending', under_review: 'Under Review', approved: 'Approved',
  rejected: 'Rejected', pickup_scheduled: 'Pickup Scheduled', picked_up: 'Picked Up',
  refund_initiated: 'Refund Initiated', refund_completed: 'Refund Completed', closed: 'Closed',
};

const STATUS_COLORS: Record<ReturnStatus, string> = {
  pending: '#f59e0b', under_review: '#3b82f6', approved: '#16a34a',
  rejected: '#dc2626', pickup_scheduled: '#8b5cf6', picked_up: '#0891b2',
  refund_initiated: '#0284c7', refund_completed: '#16a34a', closed: '#6b7280',
};

@Component({
  selector: 'lg-admin-returns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, MatIconModule, CurrencyInrPipe],
  styles: [`
    :host { display: block; }
    .page-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px; }
    .page-title { font-family:var(--font-display);font-size:1.375rem;font-weight:700;color:var(--text-primary);margin:0; }
    .filter-row { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px; }
    .filter-btn { padding:5px 16px;border-radius:99px;border:1.5px solid var(--border-default);background:none;
                  font-size:.8125rem;font-weight:600;color:var(--text-secondary);cursor:pointer; }
    .filter-btn.active { border-color:var(--color-primary);background:var(--color-primary-50);color:var(--color-primary); }

    .table-wrap { overflow-x:auto;border-radius:16px;border:1px solid var(--border-default); }
    table { width:100%;border-collapse:collapse; }
    th { padding:11px 14px;text-align:left;font-size:.75rem;font-weight:700;color:var(--text-muted);
         text-transform:uppercase;letter-spacing:.05em;background:var(--bg-subtle);border-bottom:1px solid var(--border-default); }
    td { padding:12px 14px;font-size:.875rem;color:var(--text-secondary);border-bottom:1px solid var(--border-default); }
    tr:last-child td { border-bottom:none; }
    tr:hover td { background:var(--bg-subtle); }

    .status-chip { display:inline-block;padding:2px 10px;border-radius:99px;font-size:.6875rem;font-weight:700; }
    .action-btn { padding:4px 12px;border-radius:8px;border:1.5px solid var(--border-default);background:none;
                  font-size:.8125rem;font-weight:600;color:var(--text-secondary);cursor:pointer;white-space:nowrap; }
    .action-btn:hover { border-color:var(--color-primary);color:var(--color-primary); }

    /* Modal */
    .modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;
                      display:flex;align-items:center;justify-content:center;padding:20px; }
    .modal { background:var(--bg-base);border-radius:20px;padding:28px;width:100%;max-width:500px;
             max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2); }
    .modal-title { font-family:var(--font-display);font-size:1.125rem;font-weight:700;color:var(--text-primary);margin:0 0 4px; }
    .modal-sub { font-size:.8125rem;color:var(--text-muted);margin:0 0 20px; }
    .field { display:flex;flex-direction:column;gap:5px;margin-bottom:14px; }
    .field label { font-size:.8125rem;font-weight:600;color:var(--text-secondary); }
    .field select, .field input, .field textarea {
      padding:9px 12px;border:1.5px solid var(--border-default);border-radius:10px;
      font-size:.875rem;color:var(--text-primary);background:var(--bg-subtle);outline:none;width:100%; }
    .field select:focus, .field input:focus, .field textarea:focus { border-color:var(--color-primary); }
    .modal-actions { display:flex;gap:10px;margin-top:20px; }
    .btn-primary { flex:1;padding:10px;background:var(--color-primary);color:#fff;border:none;
                   border-radius:10px;font-weight:600;font-size:.9375rem;cursor:pointer; }
    .btn-cancel { padding:10px 18px;background:none;border:1.5px solid var(--border-default);
                  border-radius:10px;font-weight:600;font-size:.875rem;color:var(--text-secondary);cursor:pointer; }
  `],
  template: `
    <div>
      <div class="page-head">
        <h1 class="page-title">
          <mat-icon style="vertical-align:middle;margin-right:8px">assignment_return</mat-icon>
          Returns & Refunds
        </h1>
      </div>

      <!-- Status filter -->
      <div class="filter-row">
        <button class="filter-btn" [class.active]="filterStatus() === ''"
                (click)="setFilter('')">All</button>
        @for (s of statusOptions; track s.value) {
          <button class="filter-btn" [class.active]="filterStatus() === s.value"
                  (click)="setFilter(s.value)">{{ s.label }}</button>
        }
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Order</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Refund</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              @for (_ of [1,2,3,4,5]; track _) {
                <tr>
                  @for (__ of [1,2,3,4,5,6,7,8]; track __) {
                    <td><div style="height:13px;background:var(--bg-subtle);border-radius:4px;animation:pulse 1.4s infinite"></div></td>
                  }
                </tr>
              }
            } @else if (!returns().length) {
              <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">No return requests found</td></tr>
            } @else {
              @for (r of returns(); track r.id) {
                <tr>
                  <td style="font-weight:600;color:var(--text-primary)">#{{ r.id }}</td>
                  <td>
                    <div style="font-weight:600;color:var(--text-primary)">{{ r.customer.name }}</div>
                    <div style="font-size:.75rem;color:var(--text-muted)">{{ r.customer.email }}</div>
                  </td>
                  <td style="font-weight:600">{{ r.order.orderNumber }}</td>
                  <td>{{ reasonLabel(r.reason) }}</td>
                  <td>
                    <span class="status-chip"
                          [style.background]="statusBg(r.status)"
                          [style.color]="statusColor(r.status)">
                      {{ statusLabel(r.status) }}
                    </span>
                  </td>
                  <td>
                    @if (r.refundAmount) {
                      <span style="font-weight:700;color:var(--color-primary)">
                        {{ r.refundAmount | currencyInr }}
                      </span>
                      <span style="font-size:.75rem;color:var(--text-muted);margin-left:4px">
                        ({{ r.refundMethod === 'wallet' ? 'Wallet' : 'Original' }})
                      </span>
                    } @else { — }
                  </td>
                  <td>{{ r.createdAt | date:'d MMM' }}</td>
                  <td>
                    <button class="action-btn" (click)="openReview(r)">Review</button>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Review modal -->
    @if (selected()) {
      <div class="modal-backdrop" (click)="selected.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Return #{{ selected()!.id }}</h3>
          <p class="modal-sub">
            {{ selected()!.customer.name }} · Order {{ selected()!.order.orderNumber }}
            · {{ selected()!.order.total | currencyInr }}
          </p>

          <div style="background:var(--bg-subtle);border-radius:12px;padding:14px;margin-bottom:20px;font-size:.875rem">
            <p style="margin:0 0 6px"><strong>Reason:</strong> {{ reasonLabel(selected()!.reason) }}</p>
            @if (selected()!.description) {
              <p style="margin:0;color:var(--text-secondary)">{{ selected()!.description }}</p>
            }
          </div>

          <div class="field">
            <label>Update Status</label>
            <select [(ngModel)]="updateStatus">
              @for (s of statusOptions; track s.value) {
                <option [value]="s.value">{{ s.label }}</option>
              }
            </select>
          </div>

          <div class="field">
            <label>Refund Method</label>
            <select [(ngModel)]="updateRefundMethod">
              <option value="">— None —</option>
              <option value="original">Original Payment Method</option>
              <option value="wallet">Wallet Credit</option>
            </select>
          </div>

          <div class="field">
            <label>Refund Amount (₹)</label>
            <input type="number" [(ngModel)]="updateRefundAmount"
                   [placeholder]="'Order total: ' + selected()!.order.total" />
          </div>

          <div class="field">
            <label>Admin Note (optional)</label>
            <textarea [(ngModel)]="updateAdminNote" rows="2"
                      placeholder="Internal note visible to admin only…"></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="selected.set(null)">Close</button>
            <button class="btn-primary" [disabled]="saving()" (click)="saveUpdate()">
              {{ saving() ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminReturnsComponent implements OnInit {
  readonly #http  = inject(HttpClient);
  readonly #toast = inject(ToastService);

  readonly returns      = signal<ReturnRow[]>([]);
  readonly loading      = signal(true);
  readonly filterStatus = signal('');
  readonly selected     = signal<ReturnRow | null>(null);
  readonly saving       = signal(false);

  updateStatus       = 'under_review';
  updateRefundMethod = '';
  updateRefundAmount: number | null = null;
  updateAdminNote    = '';

  readonly statusOptions = [
    { value: 'pending',           label: 'Pending'           },
    { value: 'under_review',      label: 'Under Review'      },
    { value: 'approved',          label: 'Approved'          },
    { value: 'rejected',          label: 'Rejected'          },
    { value: 'pickup_scheduled',  label: 'Pickup Scheduled'  },
    { value: 'picked_up',         label: 'Picked Up'         },
    { value: 'refund_initiated',  label: 'Initiate Refund'   },
    { value: 'refund_completed',  label: 'Refund Completed'  },
    { value: 'closed',            label: 'Closed'            },
  ];

  ngOnInit(): void { this.loadReturns(); }

  setFilter(status: string): void {
    this.filterStatus.set(status);
    this.loadReturns();
  }

  loadReturns(): void {
    this.loading.set(true);
    const params: Record<string, string> = { limit: '50' };
    if (this.filterStatus()) params['status'] = this.filterStatus();
    this.#http.get<{ success: boolean; data: { requests: ReturnRow[] } }>(
      `${environment.apiUrl}/api/v1/admin/returns`,
      { params, withCredentials: true },
    ).subscribe({
      next: r => { if (r.success) this.returns.set(r.data.requests); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openReview(r: ReturnRow): void {
    this.selected.set(r);
    this.updateStatus       = r.status;
    this.updateRefundMethod = r.refundMethod ?? '';
    this.updateRefundAmount = r.refundAmount;
    this.updateAdminNote    = r.adminNote ?? '';
  }

  saveUpdate(): void {
    const r = this.selected();
    if (!r) return;
    this.saving.set(true);
    const body: Record<string, unknown> = { status: this.updateStatus };
    if (this.updateRefundMethod) body['refundMethod'] = this.updateRefundMethod;
    if (this.updateRefundAmount) body['refundAmount'] = Number(this.updateRefundAmount);
    if (this.updateAdminNote)    body['adminNote']    = this.updateAdminNote;
    this.#http.patch(
      `${environment.apiUrl}/api/v1/admin/returns/${r.id}`,
      body,
      { withCredentials: true },
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.selected.set(null);
        this.#toast.success('Return request updated');
        this.loadReturns();
      },
      error: err => {
        this.saving.set(false);
        this.#toast.error('Error', err?.error?.message ?? 'Update failed');
      },
    });
  }

  statusLabel(s: ReturnStatus): string { return STATUS_LABELS[s] ?? s; }
  statusColor(s: ReturnStatus): string { return STATUS_COLORS[s] ?? '#6b7280'; }
  statusBg(s: ReturnStatus): string    { return STATUS_COLORS[s] + '20'; }

  reasonLabel(r: string): string {
    const map: Record<string, string> = {
      damaged: 'Damaged', wrong_item: 'Wrong Item', not_as_described: 'Not as Described',
      changed_mind: 'Changed Mind', quality_issue: 'Quality Issue', other: 'Other',
    };
    return map[r] ?? r;
  }
}

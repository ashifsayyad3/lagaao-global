import {
  Component, ChangeDetectionStrategy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


interface FaqItem { q: string; a: string; open: boolean; }
interface Ticket { id: string; subject: string; status: 'open' | 'resolved'; createdAt: string; }

@Component({
  selector: 'lg-vendor-support',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-5xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Support Center</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Get help, raise tickets, and browse FAQs</p>
  </div>

  <!-- Quick links -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    @for (card of quickLinks; track card.title) {
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col items-center text-center gap-2 hover:border-green-400 dark:hover:border-green-600 cursor-pointer transition-colors"
           (click)="card.action()">
        <div class="w-12 h-12 rounded-xl {{ card.color }} flex items-center justify-center">
          <span class="material-icons text-[22px]">{{ card.icon }}</span>
        </div>
        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ card.title }}</p>
        <p class="text-xs text-gray-400">{{ card.sub }}</p>
      </div>
    }
  </div>

  <!-- Active view -->
  @switch (view()) {

    @case ('tickets') {
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="font-semibold text-gray-900 dark:text-white text-sm">My Tickets</h2>
          <button (click)="view.set('new-ticket')"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors">
            <span class="material-icons text-[14px]">add</span> New Ticket
          </button>
        </div>
        @if (tickets().length === 0) {
          <div class="flex flex-col items-center justify-center py-16 gap-3">
            <span class="material-icons text-4xl text-gray-300 dark:text-gray-600">confirmation_number</span>
            <p class="text-sm text-gray-400">No support tickets yet</p>
            <button (click)="view.set('new-ticket')"
              class="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
              Raise a Ticket
            </button>
          </div>
        } @else {
          <div class="divide-y divide-gray-100 dark:divide-gray-700">
            @for (t of tickets(); track t.id) {
              <div class="flex items-center justify-between px-5 py-4">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t.subject }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ t.createdAt }}</p>
                </div>
                <span class="text-xs px-2.5 py-1 rounded-full font-medium
                  {{ t.status === 'open' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' }}">
                  {{ t.status === 'open' ? 'Open' : 'Resolved' }}
                </span>
              </div>
            }
          </div>
        }
      </div>
    }

    @case ('new-ticket') {
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div class="flex items-center gap-2">
          <button (click)="view.set('tickets')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <span class="material-icons text-[20px]">arrow_back</span>
          </button>
          <h2 class="font-semibold text-gray-900 dark:text-white text-sm">New Support Ticket</h2>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select [(ngModel)]="ticketForm.category"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Select category…</option>
              @for (cat of ticketCategories; track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
            <input [(ngModel)]="ticketForm.subject" type="text" placeholder="Brief description of your issue"
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
            <textarea [(ngModel)]="ticketForm.description" rows="5"
              placeholder="Describe your issue in detail. Include order numbers or product IDs if relevant."
              class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500">
            </textarea>
          </div>
        </div>

        @if (ticketSubmitted()) {
          <div class="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400">
            <span class="material-icons text-[18px]">check_circle</span>
            Ticket submitted! Our team will respond within 24 hours.
          </div>
        }

        <div class="flex gap-3">
          <button (click)="view.set('tickets')"
            class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button (click)="submitTicket()"
            [disabled]="!ticketForm.subject || !ticketForm.description || ticketSubmitting()"
            class="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            @if (ticketSubmitting()) {
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            }
            Submit Ticket
          </button>
        </div>
      </div>
    }

    @case ('faq') {
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="font-semibold text-gray-900 dark:text-white text-sm">Frequently Asked Questions</h2>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          @for (faq of faqs; track faq.q) {
            <div class="px-5 py-4">
              <button (click)="faq.open = !faq.open"
                class="w-full flex items-center justify-between text-left gap-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ faq.q }}</p>
                <span class="material-icons text-gray-400 text-[18px] shrink-0 transition-transform {{ faq.open ? 'rotate-180' : '' }}">
                  expand_more
                </span>
              </button>
              @if (faq.open) {
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{{ faq.a }}</p>
              }
            </div>
          }
        </div>
      </div>
    }

    @case ('contact') {
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        @for (channel of contactChannels; track channel.title) {
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
            <div class="w-10 h-10 rounded-xl {{ channel.color }} flex items-center justify-center">
              <span class="material-icons text-[20px]">{{ channel.icon }}</span>
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white text-sm">{{ channel.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ channel.sub }}</p>
            </div>
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ channel.value }}</p>
            <p class="text-xs text-gray-400">{{ channel.hours }}</p>
          </div>
        }
      </div>
    }

  }

  <!-- Default overview when nothing selected -->
  @if (view() === 'home') {
    <!-- SLA info -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">Support SLA</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        @for (sla of slaItems; track sla.label) {
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ sla.value }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ sla.label }}</p>
          </div>
        }
      </div>
    </div>

    <!-- Popular articles -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 class="font-semibold text-gray-900 dark:text-white text-sm mb-4">Popular Help Articles</h2>
      <div class="space-y-2">
        @for (article of articles; track article.title) {
          <div class="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
            <div class="flex items-center gap-3">
              <span class="material-icons text-green-500 text-[18px]">article</span>
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ article.title }}</p>
            </div>
            <span class="material-icons text-gray-300 dark:text-gray-600 text-[16px]">chevron_right</span>
          </div>
        }
      </div>
    </div>
  }

</div>
  `,
})
export class VendorSupportComponent {
  readonly view             = signal<'home' | 'tickets' | 'new-ticket' | 'faq' | 'contact'>('home');
  readonly tickets          = signal<Ticket[]>([]);
  readonly ticketSubmitting = signal(false);
  readonly ticketSubmitted  = signal(false);

  ticketForm = { category: '', subject: '', description: '' };

  readonly ticketCategories = [
    'Order Issue', 'Payment & Payout', 'Product Listing', 'Account & KYC',
    'Shipping & Logistics', 'Returns & Refunds', 'Technical Issue', 'Other',
  ];

  readonly quickLinks = [
    { title: 'My Tickets', sub: 'View & track requests', icon: 'confirmation_number', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400', action: () => this.view.set('tickets') },
    { title: 'New Ticket', sub: 'Raise a support request', icon: 'add_circle', color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400', action: () => this.view.set('new-ticket') },
    { title: 'FAQs', sub: 'Find quick answers', icon: 'help_outline', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400', action: () => this.view.set('faq') },
    { title: 'Contact Us', sub: 'Phone, email, chat', icon: 'support_agent', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400', action: () => this.view.set('contact') },
  ];

  readonly slaItems = [
    { value: '< 2h', label: 'Critical issues (payment, account)' },
    { value: '< 24h', label: 'Standard tickets' },
    { value: '< 48h', label: 'Feature requests & queries' },
  ];

  readonly articles = [
    { title: 'How to list your first product' },
    { title: 'Understanding your commission and payouts' },
    { title: 'How to handle returns and refunds' },
    { title: 'Shipping integration guide' },
    { title: 'How to create promotional coupons' },
    { title: 'GST and tax compliance for vendors' },
  ];

  readonly contactChannels = [
    {
      title: 'Email Support', sub: 'Detailed queries and attachments',
      icon: 'email', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
      value: 'seller-support@lagaao.com', hours: 'Mon–Sat, 9am–6pm',
    },
    {
      title: 'Phone Support', sub: 'Urgent payment & account issues',
      icon: 'phone', color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
      value: '+91 80000 LAGAO', hours: 'Mon–Fri, 10am–5pm',
    },
    {
      title: 'WhatsApp Chat', sub: 'Quick answers on the go',
      icon: 'chat', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
      value: '+91 98765 43210', hours: 'Mon–Sat, 9am–8pm',
    },
  ];

  readonly faqs: FaqItem[] = [
    { q: 'How long does it take to get approved as a vendor?', a: 'After submitting your application, our team reviews it within 1–2 business days. You\'ll receive an email notification once approved.', open: false },
    { q: 'When will I receive my payout?', a: 'Payouts are processed 7 days after order delivery. Funds are transferred to your registered bank account within 3–5 business days after you raise a withdrawal request.', open: false },
    { q: 'What is the commission rate on Lagaao?', a: 'Commission rates vary by category, typically between 5–15%. Your specific rate is shown in your vendor profile under Settings.', open: false },
    { q: 'How do I handle a return request?', a: 'When a customer raises a return, you\'ll receive a notification. Accept or dispute it within 48 hours. Accepted returns reduce the order amount from your next settlement.', open: false },
    { q: 'Can I list products in multiple categories?', a: 'Yes. You can list products across multiple categories. Some categories require additional documentation or approval.', open: false },
    { q: 'How do I update my GST details?', a: 'Go to Settings → Business Details. Enter your 15-digit GSTIN. Changes are reviewed within 24 hours.', open: false },
    { q: 'What happens if I run out of stock?', a: 'Products with zero available stock are automatically hidden from the storefront. Update your inventory to make them visible again.', open: false },
    { q: 'How can I cancel an order?', a: 'You can cancel pending orders from the Orders page. Frequent cancellations may affect your seller rating. Contact support if you face unavoidable circumstances.', open: false },
  ];

  submitTicket(): void {
    if (!this.ticketForm.subject || !this.ticketForm.description) return;
    this.ticketSubmitting.set(true);
    setTimeout(() => {
      const newTicket: Ticket = {
        id: `TKT-${Date.now()}`,
        subject: this.ticketForm.subject,
        status: 'open',
        createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      };
      this.tickets.update(list => [newTicket, ...list]);
      this.ticketForm = { category: '', subject: '', description: '' };
      this.ticketSubmitting.set(false);
      this.ticketSubmitted.set(true);
      setTimeout(() => {
        this.ticketSubmitted.set(false);
        this.view.set('tickets');
      }, 2000);
    }, 800);
  }
}

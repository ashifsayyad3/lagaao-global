import {
  Component, signal, ChangeDetectionStrategy, inject, ElementRef, ViewChild, AfterViewChecked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyInrPipe } from '../../pipes/currency-inr.pipe';
import { AiService, ChatMessage, AiProduct } from '../../../core/services/ai.service';

interface DisplayMessage extends ChatMessage {
  products?: AiProduct[];
}

@Component({
  selector: 'lg-ai-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, MatIconModule, CurrencyInrPipe],
  template: `
    <!-- Floating button -->
    @if (!open()) {
      <button
        (click)="open.set(true)"
        class="fixed bottom-6 right-6 z-[modal] w-14 h-14 rounded-full
               bg-gradient-to-br from-primary-600 to-accent text-white shadow-xl
               hover:scale-110 transition-transform flex items-center justify-center"
        aria-label="Open AI chat"
      >
        <mat-icon class="!text-2xl">auto_awesome</mat-icon>
      </button>
    }

    <!-- Chat panel -->
    @if (open()) {
      <div class="fixed bottom-6 right-6 z-[modal] w-80 sm:w-96 flex flex-col
                  bg-bg-base border border-border rounded-2xl shadow-2xl overflow-hidden"
           style="height: 520px">
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3
                    bg-gradient-to-r from-primary-600 to-accent text-white flex-shrink-0">
          <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <mat-icon class="!text-base">auto_awesome</mat-icon>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-sm">Lagaao AI</p>
            <p class="text-xs text-white/70">Your shopping assistant</p>
          </div>
          <button (click)="open.set(false)" class="hover:bg-white/20 rounded-full p-1">
            <mat-icon class="!text-base">close</mat-icon>
          </button>
        </div>

        <!-- Messages -->
        <div #msgContainer class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          @for (msg of messages(); track $index) {
            <div [class]="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
              <div
                class="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                [class]="msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-sm'
                  : 'bg-surface-100 dark:bg-surface-800 text-text-primary rounded-bl-sm'"
              >
                {{ msg.content }}
                @if (msg.products?.length) {
                  <div class="mt-2 space-y-1.5">
                    @for (p of msg.products!; track p.id) {
                      <a [routerLink]="['/products', p.slug]"
                         class="flex items-center gap-2 bg-bg-base dark:bg-surface-900
                                rounded-xl p-2 hover:bg-surface-50 transition-colors">
                        @if (p.images?.[0]?.url) {
                          <img [src]="p.images![0].url" [alt]="p.name"
                               class="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                        }
                        <div class="min-w-0">
                          <p class="text-xs font-medium text-text-primary line-clamp-1">{{ p.name }}</p>
                          <p class="text-xs text-primary-600 font-semibold">
                            {{ (p.salePrice ?? p.basePrice) | currencyInr }}
                          </p>
                        </div>
                      </a>
                    }
                  </div>
                }
              </div>
            </div>
          }
          @if (loading()) {
            <div class="flex justify-start">
              <div class="bg-surface-100 dark:bg-surface-800 rounded-2xl rounded-bl-sm px-4 py-2">
                <div class="flex gap-1 items-center">
                  <span class="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:0ms]"></span>
                  <span class="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:150ms]"></span>
                  <span class="w-1.5 h-1.5 bg-text-secondary/50 rounded-full animate-bounce [animation-delay:300ms]"></span>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Input -->
        <form (ngSubmit)="send()" class="flex gap-2 px-3 py-3 border-t border-border flex-shrink-0">
          <input
            [(ngModel)]="input" name="input"
            placeholder="Ask me anything…"
            class="flex-1 bg-surface-100 dark:bg-surface-800 rounded-xl px-3 py-2 text-sm
                   text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-1 focus:ring-primary-400"
            [disabled]="loading()"
          />
          <button
            type="submit"
            [disabled]="!input.trim() || loading()"
            class="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center
                   hover:bg-primary-700 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            <mat-icon class="!text-base">send</mat-icon>
          </button>
        </form>
      </div>
    }
  `,
})
export class AiChatComponent implements AfterViewChecked {
  readonly #ai = inject(AiService);

  @ViewChild('msgContainer') private msgContainer!: ElementRef<HTMLDivElement>;

  open     = signal(false);
  loading  = signal(false);
  messages = signal<DisplayMessage[]>([
    { role: 'assistant', content: 'Hi! 👋 I\'m your Lagaao shopping assistant. Ask me about products, deals, or recommendations!' },
  ]);
  input = '';

  ngAfterViewChecked() {
    this.#scrollToBottom();
  }

  send() {
    const text = this.input.trim();
    if (!text || this.loading()) return;
    this.input = '';

    this.messages.update(m => [...m, { role: 'user', content: text }]);
    this.loading.set(true);

    const history = this.messages().slice(-10).map(m => ({ role: m.role, content: m.content }));

    this.#ai.chat(history).subscribe({
      next: r => {
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: r.data.reply,
          products: r.data.products as AiProduct[] | undefined,
        }]);
        this.loading.set(false);
      },
      error: () => {
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: 'Sorry, I hit an error. Please try again!',
        }]);
        this.loading.set(false);
      },
    });
  }

  #scrollToBottom() {
    try {
      this.msgContainer.nativeElement.scrollTop = this.msgContainer.nativeElement.scrollHeight;
    } catch {}
  }
}

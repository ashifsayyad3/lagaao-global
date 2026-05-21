import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id:       string;
  type:     ToastType;
  title:    string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(title: string, message?: string, duration = 4000): void {
    this.#add('success', title, message, duration);
  }

  error(title: string, message?: string, duration = 6000): void {
    this.#add('error', title, message, duration);
  }

  warning(title: string, message?: string, duration = 5000): void {
    this.#add('warning', title, message, duration);
  }

  info(title: string, message?: string, duration = 4000): void {
    this.#add('info', title, message, duration);
  }

  dismiss(id: string): void {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }

  #add(type: ToastType, title: string, message?: string, duration = 4000): void {
    const id = crypto.randomUUID();
    this.toasts.update(ts => [...ts, { id, type, title, message, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}

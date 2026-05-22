import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CartService } from './cart.service';

export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export interface ChatResponse {
  reply:     string;
  products?: AiProduct[];
}
export interface AiProduct {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  salePrice: number | null;
  rating: number;
  images?: { url: string }[];
}
export interface GenerateDescResult {
  shortDescription: string;
  description: string;
  tags: string[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  readonly #http = inject(HttpClient);
  readonly #cart = inject(CartService);
  readonly #base = `${environment.apiUrl}/api/v1/ai`;

  get #headers() {
    return { 'x-session-id': this.#cart.sessionId };
  }

  trackView(productId: number) {
    return this.#http.post(`${this.#base}/recently-viewed/${productId}`, {}, { headers: this.#headers });
  }

  getRecentlyViewed() {
    return this.#http.get<{ success: boolean; data: AiProduct[] }>(
      `${this.#base}/recently-viewed`, { headers: this.#headers },
    );
  }

  getAlsoBought(productId: number) {
    return this.#http.get<{ success: boolean; data: AiProduct[] }>(
      `${this.#base}/recommendations/also-bought/${productId}`,
    );
  }

  getForYou() {
    return this.#http.get<{ success: boolean; data: AiProduct[] }>(
      `${this.#base}/recommendations/for-you`,
    );
  }

  chat(messages: ChatMessage[]) {
    return this.#http.post<{ success: boolean; data: ChatResponse }>(
      `${this.#base}/chat`, { messages },
    );
  }

  generateDescription(body: { productName: string; category: string; features: string; tone?: string }) {
    return this.#http.post<{ success: boolean; data: GenerateDescResult }>(
      `${this.#base}/generate-description`, body,
    );
  }
}

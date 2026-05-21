import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  mobilImage: string | null;
  link: string | null;
  ctaLabel: string | null;
  position: 'hero' | 'mid' | 'category' | 'popup';
  isActive: boolean;
  sortOrder: number;
  bgColor: string | null;
}

export interface Announcement {
  id: number;
  message: string;
  link: string | null;
  linkLabel: string | null;
  type: 'info' | 'warning' | 'success' | 'promo';
  isActive: boolean;
  expiresAt: string | null;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  tags: string[] | null;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  viewCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  content?: string;
}

export interface CmsPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
}

@Injectable({ providedIn: 'root' })
export class CmsService {
  readonly #http = inject(HttpClient);
  readonly #base = `${environment.apiUrl}/cms`;

  getBanners(position?: string) {
    let params = new HttpParams();
    if (position) params = params.set('position', position);
    return this.#http.get<{ success: boolean; data: Banner[] }>(`${this.#base}/banners`, { params });
  }

  getAnnouncement() {
    return this.#http.get<{ success: boolean; data: Announcement | null }>(`${this.#base}/announcement`);
  }

  subscribe(email: string, name?: string) {
    return this.#http.post<{ success: boolean; data: { id: number; email: string } }>(
      `${this.#base}/newsletter/subscribe`, { email, name, source: 'footer' },
    );
  }

  getPosts(page = 1, limit = 10, tag?: string) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (tag) params = params.set('tag', tag);
    return this.#http.get<{
      success: boolean;
      data: { rows: BlogPost[]; count: number; page: number; limit: number };
    }>(`${this.#base}/posts`, { params });
  }

  getPost(slug: string) {
    return this.#http.get<{ success: boolean; data: BlogPost }>(`${this.#base}/posts/${slug}`);
  }

  getPage(slug: string) {
    return this.#http.get<{ success: boolean; data: CmsPage }>(`${this.#base}/pages/${slug}`);
  }
}

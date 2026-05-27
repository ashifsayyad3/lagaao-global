import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface SeoConfig {
  title:           string;
  description?:    string;
  canonical?:      string;
  image?:          string;
  type?:           'website' | 'product' | 'article' | 'profile';
  noIndex?:        boolean;
  keywords?:       string;
  author?:         string;
  publishedTime?:  string;
  modifiedTime?:   string;
  price?:          number;
  currency?:       string;
  availability?:   'InStock' | 'OutOfStock' | 'PreOrder';
}

export interface ProductSchema {
  id:           number;
  name:         string;
  description:  string;
  image:        string | string[];
  price:        number;
  salePrice?:   number | null;
  currency?:    string;
  sku?:         string;
  brand?:       string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?:      number;
  reviewCount?: number;
  category?:    string;
  url?:         string;
}

export interface BreadcrumbItem { name: string; url: string; }

export interface FaqItem { question: string; answer: string; }

const SITE_NAME = 'Lagaao';
const SITE_URL  = 'https://lagaao.com';
const ORG_LOGO  = `${SITE_URL}/icons/icon-512x512.png`;

// ─── Service ──────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SeoService {
  readonly #title      = inject(Title);
  readonly #meta       = inject(Meta);
  readonly #doc        = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #router     = inject(Router);

  constructor() {
    // Auto-remove JSON-LD on every navigation to prevent stale schemas
    this.#router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.#clearJsonLd());
  }

  // ─── Core meta setter ──────────────────────────────────────────────────────
  setMeta(config: SeoConfig): void {
    const title = config.title.endsWith(SITE_NAME)
      ? config.title
      : `${config.title} — ${SITE_NAME}`;

    // Title
    this.#title.setTitle(title);

    // Basic meta
    this.#upsert('description',  config.description ?? '');
    this.#upsert('robots', config.noIndex ? 'noindex, nofollow' : 'index, follow');
    if (config.keywords)  this.#upsert('keywords', config.keywords);
    if (config.author)    this.#upsert('author',   config.author);

    // Canonical
    this.#setCanonical(config.canonical ?? (isPlatformBrowser(this.#platformId) ? window.location.href : ''));

    // OpenGraph
    this.#meta.updateTag({ property: 'og:title',       content: title });
    this.#meta.updateTag({ property: 'og:description',  content: config.description ?? '' });
    this.#meta.updateTag({ property: 'og:type',         content: config.type ?? 'website' });
    this.#meta.updateTag({ property: 'og:site_name',    content: SITE_NAME });
    this.#meta.updateTag({ property: 'og:url',          content: config.canonical ?? '' });
    if (config.image) {
      this.#meta.updateTag({ property: 'og:image',      content: config.image });
      this.#meta.updateTag({ property: 'og:image:width',  content: '1200' });
      this.#meta.updateTag({ property: 'og:image:height', content: '630' });
    }

    // Twitter card
    this.#meta.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
    this.#meta.updateTag({ name: 'twitter:title',        content: title });
    this.#meta.updateTag({ name: 'twitter:description',  content: config.description ?? '' });
    if (config.image) {
      this.#meta.updateTag({ name: 'twitter:image',      content: config.image });
    }

    // Article-specific
    if (config.type === 'article') {
      if (config.publishedTime) this.#meta.updateTag({ property: 'article:published_time', content: config.publishedTime });
      if (config.modifiedTime)  this.#meta.updateTag({ property: 'article:modified_time',  content: config.modifiedTime });
      if (config.author)        this.#meta.updateTag({ property: 'article:author',          content: config.author });
    }

    // Product-specific OG
    if (config.type === 'product' && config.price) {
      this.#meta.updateTag({ property: 'product:price:amount',   content: config.price.toString() });
      this.#meta.updateTag({ property: 'product:price:currency', content: config.currency ?? 'INR' });
    }
  }

  // ─── JSON-LD schema injection ──────────────────────────────────────────────
  setOrganizationSchema(): void {
    this.#injectJsonLd('lg-org-schema', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: ORG_LOGO },
      sameAs: [
        'https://www.instagram.com/lagaao',
        'https://www.facebook.com/lagaao',
        'https://twitter.com/lagaao',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['English', 'Hindi'],
      },
    });

    // WebSite schema with SearchAction (sitelinks searchbox)
    this.#injectJsonLd('lg-website-schema', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    });
  }

  setProductSchema(p: ProductSchema): void {
    const images = Array.isArray(p.image) ? p.image : [p.image];
    const offers: Record<string, unknown> = {
      '@type':         'Offer',
      price:           p.salePrice ?? p.price,
      priceCurrency:   p.currency ?? 'INR',
      availability:    `https://schema.org/${p.availability}`,
      url:             p.url ?? (isPlatformBrowser(this.#platformId) ? window.location.href : SITE_URL),
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      seller: { '@type': 'Organization', name: SITE_NAME },
    };

    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type':    'Product',
      name:        p.name,
      description: p.description,
      image:       images,
      offers,
    };
    if (p.sku)                         schema['sku']    = p.sku;
    if (p.brand)                       schema['brand']  = { '@type': 'Brand', name: p.brand };
    if (p.category)                    schema['category'] = p.category;
    if (p.rating && p.reviewCount)     schema['aggregateRating'] = {
      '@type':       'AggregateRating',
      ratingValue:   p.rating.toFixed(1),
      reviewCount:   p.reviewCount,
      bestRating:    '5',
      worstRating:   '1',
    };

    this.#injectJsonLd('lg-product-schema', schema);
  }

  setBreadcrumbSchema(items: BreadcrumbItem[]): void {
    this.#injectJsonLd('lg-breadcrumb-schema', {
      '@context':  'https://schema.org',
      '@type':     'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type':  'ListItem',
        position: i + 1,
        name:     item.name,
        item:     item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
      })),
    });
  }

  setArticleSchema(opts: {
    headline: string; description: string; image?: string;
    author?: string; publishedTime: string; modifiedTime?: string; url?: string;
  }): void {
    this.#injectJsonLd('lg-article-schema', {
      '@context':     'https://schema.org',
      '@type':        'Article',
      headline:       opts.headline,
      description:    opts.description,
      image:          opts.image ?? ORG_LOGO,
      author:         { '@type': 'Person', name: opts.author ?? SITE_NAME },
      publisher:      { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: ORG_LOGO } },
      datePublished:  opts.publishedTime,
      dateModified:   opts.modifiedTime ?? opts.publishedTime,
      mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url ?? SITE_URL },
    });
  }

  setFaqSchema(faqs: FaqItem[]): void {
    this.#injectJsonLd('lg-faq-schema', {
      '@context': 'https://schema.org',
      '@type':    'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name:    f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  setItemListSchema(items: Array<{ name: string; url: string; image?: string; position: number }>): void {
    this.#injectJsonLd('lg-itemlist-schema', {
      '@context': 'https://schema.org',
      '@type':    'ItemList',
      itemListElement: items.map(item => ({
        '@type':  'ListItem',
        position: item.position,
        name:     item.name,
        url:      item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
        image:    item.image,
      })),
    });
  }

  // Compute a simple SEO score (0–100) for a given config
  scoreConfig(config: SeoConfig): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    if (!config.title || config.title.length < 20)        { issues.push('Title too short (< 20 chars)');      score -= 15; }
    if (config.title && config.title.length > 60)          { issues.push('Title too long (> 60 chars)');       score -= 10; }
    if (!config.description)                               { issues.push('Missing meta description');          score -= 20; }
    if (config.description && config.description.length < 80)  { issues.push('Description too short');        score -= 10; }
    if (config.description && config.description.length > 160) { issues.push('Description too long');         score -= 10; }
    if (!config.image)                                     { issues.push('Missing OG image');                  score -= 10; }
    if (!config.canonical)                                 { issues.push('Missing canonical URL');             score -= 10; }
    if (!config.keywords)                                  { issues.push('Missing keywords');                  score -= 5; }

    return { score: Math.max(0, score), issues };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  #upsert(name: string, content: string): void {
    this.#meta.updateTag({ name, content }) || this.#meta.addTag({ name, content });
  }

  #setCanonical(url: string): void {
    if (!isPlatformBrowser(this.#platformId)) return;
    let link = this.#doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.#doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.#doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  #injectJsonLd(id: string, schema: Record<string, unknown>): void {
    if (!isPlatformBrowser(this.#platformId)) return;
    let el = this.#doc.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = this.#doc.createElement('script');
      el.id   = id;
      el.type = 'application/ld+json';
      this.#doc.head.appendChild(el);
    }
    el.text = JSON.stringify(schema);
  }

  #clearJsonLd(): void {
    if (!isPlatformBrowser(this.#platformId)) return;
    ['lg-product-schema', 'lg-article-schema', 'lg-faq-schema', 'lg-breadcrumb-schema', 'lg-itemlist-schema'].forEach(id => {
      this.#doc.getElementById(id)?.remove();
    });
  }
}

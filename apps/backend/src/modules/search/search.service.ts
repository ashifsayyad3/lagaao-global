import { Op } from 'sequelize';
import { redis } from '../../config/redis';
import { esClient, ES_INDEX } from '../../config/elasticsearch';
import { logger } from '../../config/logger';
import { Product, ProductImage, Category, Brand, ProductVariant, Inventory } from '../../models';
import { getPagination } from '../../shared/utils/paginate.util';
import { Request } from 'express';

const SUGGEST_CACHE_TTL = 60;          // 1 min
const TRENDING_TTL      = 60 * 60;     // 1 hour
const TRENDING_KEY      = 'search:trending';

export interface SearchResult {
  id:             number;
  name:           string;
  slug:           string;
  shortDescription?: string;
  effectivePrice: number;
  basePrice:      number;
  salePrice?:     number;
  discountPct:    number;
  rating:         number;
  reviewCount:    number;
  categoryName:   string;
  categorySlug:   string;
  brandName?:     string;
  primaryImage:   string;
  isFeatured:     boolean;
  tags:           string[];
  score?:         number;
}

export interface SearchResponse {
  hits:        SearchResult[];
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
  facets:      Facets;
  took?:       number;
}

export interface Facets {
  categories: { id: number; name: string; slug: string; count: number }[];
  brands:     { id: number; name: string; slug: string; count: number }[];
  priceRange: { min: number; max: number };
}

export class SearchService {

  // ─── Main search entry point ───────────────────────────────
  async search(req: Request): Promise<SearchResponse> {
    const { page, limit, offset } = getPagination(req, 24);
    const q          = String(req.query['q'] ?? '').trim();
    const categoryId = req.query['categoryId'] as string | undefined;
    const brandId    = req.query['brandId']    as string | undefined;
    const minPrice   = req.query['minPrice']   as string | undefined;
    const maxPrice   = req.query['maxPrice']   as string | undefined;
    const featured   = req.query['featured']   === 'true';
    const sort       = (req.query['sort'] as string) ?? 'relevance';

    // Track trending query
    if (q.length >= 2) {
      await redis.zIncrBy(TRENDING_KEY, 1, q.toLowerCase()).catch(() => {});
      await redis.expire(TRENDING_KEY, TRENDING_TTL).catch(() => {});
    }

    if (esClient) {
      try {
        return await this.#searchES(q, { page, limit, categoryId, brandId, minPrice, maxPrice, featured, sort });
      } catch (err) {
        logger.warn('ES search failed, falling back to MySQL', { err });
      }
    }

    return this.#searchMySQL(q, { page, limit, offset, categoryId, brandId, minPrice, maxPrice, featured, sort });
  }

  // ─── Autocomplete suggestions ──────────────────────────────
  async suggest(q: string): Promise<string[]> {
    if (q.length < 2) return [];

    const cacheKey = `suggest:${q.toLowerCase()}`;
    const cached   = await redis.get(cacheKey).catch(() => null);
    if (cached) return JSON.parse(cached);

    let results: string[] = [];

    if (esClient) {
      try {
        const res = await esClient.search({
          index: ES_INDEX,
          body: {
            suggest: {
              name_suggest: {
                prefix: q,
                completion: { field: 'name.keyword', size: 8, skip_duplicates: true },
              },
            },
            _source: false,
            size: 0,
          },
        });
        const opts = (res.suggest?.['name_suggest']?.[0]?.options ?? []) as Array<{ text: string }>;
        results = opts.map((o) => o.text);
      } catch {}
    }

    // Fallback to MySQL if ES didn't deliver
    if (results.length === 0) {
      const products = await Product.findAll({
        where:      { name: { [Op.like]: `${q}%` }, status: 'active' },
        attributes: ['name'],
        limit:      8,
        order:      [['name', 'ASC']],
      });
      results = products.map(p => p.name);
    }

    await redis.setEx(cacheKey, SUGGEST_CACHE_TTL, JSON.stringify(results)).catch(() => {});
    return results;
  }

  // ─── Trending queries ──────────────────────────────────────
  async trending(limit = 10): Promise<string[]> {
    try {
      const items = await redis.zRangeWithScores(TRENDING_KEY, 0, limit - 1, { REV: true });
      return items.map(i => i.value);
    } catch {
      return [];
    }
  }

  // ─── AI semantic search via OpenAI ────────────────────────
  async aiSearch(query: string, req: Request): Promise<SearchResponse> {
    const { page, limit } = getPagination(req, 12);

    if (!process.env['OPENAI_API_KEY']) {
      // No OpenAI key → fall back to regular search
      req.query['q'] = query;
      return this.search(req);
    }

    try {
      const embedding = await this.#getEmbedding(query);

      if (esClient) {
        const res = await esClient.search({
          index: ES_INDEX,
          body: {
            knn: {
              field:           'embedding',
              query_vector:    embedding,
              k:               limit,
              num_candidates:  limit * 5,
            },
            from: (page - 1) * limit,
            size: limit,
          },
        });

        const hits = (res.hits?.hits ?? []).map(h => ({
          ...(h._source as SearchResult),
          score: h._score ?? 0,
        }));

        return {
          hits,
          total:      res.hits.total instanceof Object ? res.hits.total.value : (res.hits.total ?? 0),
          page,
          limit,
          totalPages: Math.ceil(((res.hits.total instanceof Object ? res.hits.total.value : res.hits.total) ?? 0) / limit),
          facets:     { categories: [], brands: [], priceRange: { min: 0, max: 0 } },
          took:       res.took,
        };
      }
    } catch (err) {
      logger.warn('AI search failed, falling back', { err });
    }

    req.query['q'] = query;
    return this.search(req);
  }

  // ─── Index a product into Elasticsearch ───────────────────
  async indexProduct(product: Product): Promise<void> {
    if (!esClient) return;
    try {
      const primaryImage = product.images?.[0]?.url ?? '';
      const effectivePrice = product.salePrice !== null && product.salePrice !== undefined
        ? Number(product.salePrice)
        : Number(product.basePrice);

      await esClient.index({
        index: ES_INDEX,
        id:    String(product.id),
        body:  {
          id:               product.id,
          name:             product.name,
          slug:             product.slug,
          description:      product.description ?? '',
          shortDescription: product.shortDescription ?? '',
          categoryId:       product.categoryId,
          categoryName:     product.category?.name  ?? '',
          categorySlug:     product.category?.slug  ?? '',
          brandId:          product.brandId,
          brandName:        product.brand?.name     ?? '',
          tags:             product.tags            ?? [],
          basePrice:        Number(product.basePrice),
          salePrice:        product.salePrice ? Number(product.salePrice) : null,
          effectivePrice,
          rating:           Number(product.rating),
          reviewCount:      product.reviewCount,
          isFeatured:       product.isFeatured,
          status:           product.status,
          primaryImage,
          createdAt:        product.createdAt,
        },
      });
    } catch (err) {
      logger.error('Failed to index product in ES', { productId: product.id, err });
    }
  }

  async removeFromIndex(productId: number): Promise<void> {
    if (!esClient) return;
    try {
      await esClient.delete({ index: ES_INDEX, id: String(productId) });
    } catch {}
  }

  // ─── MySQL fallback ────────────────────────────────────────
  async #searchMySQL(
    q: string,
    opts: {
      page: number; limit: number; offset: number;
      categoryId?: string; brandId?: string;
      minPrice?: string; maxPrice?: string;
      featured?: boolean; sort: string;
    },
  ): Promise<SearchResponse> {
    const where: Record<string, unknown> = { status: 'active' };

    if (q)               where['name']       = { [Op.like]: `%${q}%` };
    if (opts.categoryId) where['categoryId'] = opts.categoryId;
    if (opts.brandId)    where['brandId']    = opts.brandId;
    if (opts.featured)   where['isFeatured'] = true;
    if (opts.minPrice || opts.maxPrice) {
      where['basePrice'] = {
        ...(opts.minPrice ? { [Op.gte]: opts.minPrice } : {}),
        ...(opts.maxPrice ? { [Op.lte]: opts.maxPrice } : {}),
      };
    }

    const order = this.#resolveOrder(opts.sort);

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit:    opts.limit,
      offset:   opts.offset,
      order,
      distinct: true,
      include: [
        { model: Category, attributes: ['id', 'name', 'slug'] },
        { model: Brand,    attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, separate: true, limit: 1, where: { isPrimary: true }, required: false },
        { model: ProductVariant, required: false, include: [{ model: Inventory }] },
      ],
    });

    const hits = rows.map(p => this.#toSearchResult(p));
    const facets = await this.#buildFacets(q, opts);

    return {
      hits,
      total:     count,
      page:      opts.page,
      limit:     opts.limit,
      totalPages: Math.ceil(count / opts.limit),
      facets,
    };
  }

  // ─── Elasticsearch search ──────────────────────────────────
  async #searchES(
    q: string,
    opts: {
      page: number; limit: number;
      categoryId?: string; brandId?: string;
      minPrice?: string; maxPrice?: string;
      featured?: boolean; sort: string;
    },
  ): Promise<SearchResponse> {
    const filters: unknown[] = [{ term: { status: 'active' } }];
    if (opts.categoryId) filters.push({ term: { categoryId: opts.categoryId } });
    if (opts.brandId)    filters.push({ term: { brandId:    opts.brandId    } });
    if (opts.featured)   filters.push({ term: { isFeatured: true            } });
    if (opts.minPrice || opts.maxPrice) {
      filters.push({ range: { effectivePrice: {
        ...(opts.minPrice ? { gte: opts.minPrice } : {}),
        ...(opts.maxPrice ? { lte: opts.maxPrice } : {}),
      }}});
    }

    const query = q
      ? {
          bool: {
            must: [{
              multi_match: {
                query: q,
                fields: ['name^3', 'shortDescription^2', 'description', 'tags^2', 'categoryName', 'brandName'],
                type:   'best_fields',
                fuzziness: 'AUTO',
              },
            }],
            filter: filters,
          },
        }
      : { bool: { filter: filters } };

    const esSort = this.#resolveESSort(opts.sort);

    const res = await esClient!.search({
      index: ES_INDEX,
      from:  (opts.page - 1) * opts.limit,
      size:  opts.limit,
      body: {
        query,
        sort: esSort,
        aggs: {
          categories: { terms: { field: 'categorySlug', size: 20 } },
          brands:     { terms: { field: 'brandName',    size: 20 } },
          price_stats: { stats: { field: 'effectivePrice' } },
        },
        highlight: { fields: { name: {}, shortDescription: {} } },
      },
    });

    const total = res.hits.total instanceof Object ? res.hits.total.value : (res.hits.total ?? 0);
    const hits  = (res.hits.hits ?? []).map(h => ({
      ...(h._source as SearchResult),
      score: h._score ?? 0,
    }));

    const aggs   = res.aggregations as Record<string, unknown> | undefined;
    const facets = this.#extractFacets(aggs);

    return { hits, total, page: opts.page, limit: opts.limit, totalPages: Math.ceil(total / opts.limit), facets, took: res.took };
  }

  // ─── Helpers ───────────────────────────────────────────────
  #toSearchResult(p: Product): SearchResult {
    const primaryImage = p.images?.[0]?.url ?? '';
    const salePrice    = p.salePrice ? Number(p.salePrice) : undefined;
    const effectivePrice = salePrice ?? Number(p.basePrice);
    const discountPct  = salePrice
      ? Math.round((1 - salePrice / Number(p.basePrice)) * 100)
      : 0;

    return {
      id:             p.id,
      name:           p.name,
      slug:           p.slug,
      shortDescription: p.shortDescription ?? undefined,
      effectivePrice,
      basePrice:      Number(p.basePrice),
      salePrice,
      discountPct,
      rating:         Number(p.rating),
      reviewCount:    p.reviewCount,
      categoryName:   p.category?.name  ?? '',
      categorySlug:   p.category?.slug  ?? '',
      brandName:      p.brand?.name,
      primaryImage,
      isFeatured:     p.isFeatured,
      tags:           p.tags ?? [],
    };
  }

  #resolveOrder(sort: string): [string, string][] {
    switch (sort) {
      case 'price_asc':  return [['base_price', 'ASC']];
      case 'price_desc': return [['base_price', 'DESC']];
      case 'rating':     return [['rating', 'DESC']];
      case 'popular':    return [['review_count', 'DESC']];
      default:           return [['created_at', 'DESC']];
    }
  }

  #resolveESSort(sort: string): unknown {
    switch (sort) {
      case 'price_asc':  return [{ effectivePrice: 'asc' }];
      case 'price_desc': return [{ effectivePrice: 'desc' }];
      case 'rating':     return [{ rating: 'desc' }];
      case 'popular':    return [{ reviewCount: 'desc' }];
      default:           return ['_score', { createdAt: 'desc' }];
    }
  }

  #extractFacets(aggs: Record<string, unknown> | undefined): Facets {
    if (!aggs) return { categories: [], brands: [], priceRange: { min: 0, max: 0 } };

    const catBuckets = ((aggs['categories'] as Record<string, unknown>)?.['buckets'] ?? []) as Array<{ key: string; doc_count: number }>;
    const brBuckets  = ((aggs['brands']     as Record<string, unknown>)?.['buckets'] ?? []) as Array<{ key: string; doc_count: number }>;
    const priceStats = aggs['price_stats'] as Record<string, number> | undefined;

    return {
      categories: catBuckets.map(b => ({ id: 0, name: b.key, slug: b.key, count: b.doc_count })),
      brands:     brBuckets.map(b  => ({ id: 0, name: b.key, slug: b.key, count: b.doc_count })),
      priceRange: { min: priceStats?.['min'] ?? 0, max: priceStats?.['max'] ?? 0 },
    };
  }

  async #buildFacets(
    q: string,
    opts: { categoryId?: string; brandId?: string },
  ): Promise<Facets> {
    // Lightweight facet counts from MySQL
    const where: Record<string, unknown> = { status: 'active' };
    if (q) where['name'] = { [Op.like]: `%${q}%` };

    const [catFacets, brandFacets] = await Promise.all([
      Category.findAll({ attributes: ['id', 'name', 'slug'] }),
      Brand.findAll({    attributes: ['id', 'name', 'slug'] }),
    ]);

    return {
      categories: catFacets.map(c => ({ ...c.toJSON() as { id: number; name: string; slug: string }, count: 0 })),
      brands:     brandFacets.map(b => ({ ...b.toJSON() as { id: number; name: string; slug: string }, count: 0 })),
      priceRange: { min: 0, max: 0 },
    };
  }

  async #getEmbedding(text: string): Promise<number[]> {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return res.data[0].embedding;
  }
}

export const searchService = new SearchService();

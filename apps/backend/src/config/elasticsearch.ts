import { Client } from '@elastic/elasticsearch';
import { env } from './env';
import { logger } from './logger';

export const esClient = env.ELASTIC_NODE
  ? new Client({
      node: env.ELASTIC_NODE,
      auth: env.ELASTIC_USERNAME && env.ELASTIC_PASSWORD
        ? { username: env.ELASTIC_USERNAME, password: env.ELASTIC_PASSWORD }
        : undefined,
    })
  : null;

export const ES_INDEX = 'lagaao_products';

export async function connectES(): Promise<void> {
  if (!esClient) {
    logger.warn('Elasticsearch not configured — search falls back to MySQL');
    return;
  }
  try {
    await esClient.ping();
    logger.info(`Elasticsearch connected — ${env.ELASTIC_NODE}`);
    await ensureIndex();
  } catch (err) {
    logger.warn('Elasticsearch unreachable — falling back to MySQL search', { err });
  }
}

async function ensureIndex(): Promise<void> {
  if (!esClient) return;
  const exists = await esClient.indices.exists({ index: ES_INDEX });
  if (!exists) {
    await esClient.indices.create({
      index: ES_INDEX,
      mappings: {
        properties: {
          id:               { type: 'integer' },
          name:             { type: 'text', analyzer: 'standard', fields: { keyword: { type: 'keyword' } } },
          slug:             { type: 'keyword' },
          description:      { type: 'text' },
          shortDescription: { type: 'text' },
          categoryId:       { type: 'integer' },
          categoryName:     { type: 'keyword' },
          categorySlug:     { type: 'keyword' },
          brandId:          { type: 'integer' },
          brandName:        { type: 'keyword' },
          tags:             { type: 'keyword' },
          basePrice:        { type: 'double' },
          salePrice:        { type: 'double' },
          effectivePrice:   { type: 'double' },
          rating:           { type: 'float' },
          reviewCount:      { type: 'integer' },
          isFeatured:       { type: 'boolean' },
          status:           { type: 'keyword' },
          primaryImage:     { type: 'keyword', index: false },
          embedding:        { type: 'dense_vector', dims: 1536, index: true, similarity: 'cosine' },
          createdAt:        { type: 'date' },
        },
      },
      settings: {
        analysis: {
          analyzer: {
            standard: { type: 'standard' },
          },
        },
      },
    });
    logger.info(`Created Elasticsearch index: ${ES_INDEX}`);
  }
}

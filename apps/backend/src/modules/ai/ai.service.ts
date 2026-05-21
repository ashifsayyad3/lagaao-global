import { Op } from 'sequelize';
import { redis } from '../../config/redis';
import { logger } from '../../config/logger';
import { env } from '../../config/env';
import {
  Product, ProductImage, ProductVariant, Inventory, Category, Brand,
  Order, OrderItem,
} from '../../models';

const REC_CACHE_TTL = 60 * 10; // 10 min

// ─── Recently Viewed ──────────────────────────────────────────
function recentKey(userId?: number, sessionId?: string) {
  return userId ? `rv:u:${userId}` : `rv:s:${sessionId}`;
}

export async function trackView(productId: number, userId?: number, sessionId?: string) {
  if (!userId && !sessionId) return;
  const key = recentKey(userId, sessionId);
  await redis.lRem(key, 0, String(productId)).catch(() => {});
  await redis.lPush(key, String(productId)).catch(() => {});
  await redis.lTrim(key, 0, 19).catch(() => {});           // keep last 20
  await redis.expire(key, 60 * 60 * 24 * 30).catch(() => {}); // 30d TTL
}

export async function getRecentlyViewed(userId?: number, sessionId?: string, limit = 8) {
  if (!userId && !sessionId) return [];
  const key = recentKey(userId, sessionId);
  const ids = await redis.lRange(key, 0, limit - 1).catch(() => [] as string[]);
  if (!ids.length) return [];

  const products = await Product.findAll({
    where: { id: { [Op.in]: ids.map(Number) }, status: 'active' },
    include: [
      { model: ProductImage, separate: true, limit: 1, where: { isPrimary: true }, required: false },
      { model: Category, attributes: ['name', 'slug'] },
    ],
    limit,
  });

  // preserve redis order
  const map = new Map(products.map(p => [p.id, p]));
  return ids.map(id => map.get(Number(id))).filter(Boolean) as Product[];
}

// ─── Collaborative "Also Bought" recommendations ──────────────
export async function getAlsoBought(productId: number, limit = 8): Promise<Product[]> {
  const cacheKey = `rec:also:${productId}`;
  const cached   = await redis.get(cacheKey).catch(() => null);
  if (cached) {
    const ids: number[] = JSON.parse(cached);
    return fetchProductsByIds(ids, limit);
  }

  // Find orders that contain this product
  const orderItems = await OrderItem.findAll({
    where: { productId },
    attributes: ['orderId'],
    limit: 200,
  });
  const orderIds = [...new Set(orderItems.map(oi => oi.orderId))];
  if (!orderIds.length) return getTopRatedProducts(productId, limit);

  // Find other products in those orders
  const coItems = await OrderItem.findAll({
    where: {
      orderId:   { [Op.in]: orderIds },
      productId: { [Op.ne]: productId },
    },
    attributes: ['productId'],
    limit: 500,
  });

  const freq = new Map<number, number>();
  for (const item of coItems) {
    freq.set(item.productId, (freq.get(item.productId) ?? 0) + 1);
  }
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(e => e[0]);

  await redis.setEx(cacheKey, REC_CACHE_TTL, JSON.stringify(sorted)).catch(() => {});
  if (!sorted.length) return getTopRatedProducts(productId, limit);
  return fetchProductsByIds(sorted, limit);
}

// ─── Personalised "For You" recommendations ───────────────────
export async function getPersonalised(userId: number, limit = 12): Promise<Product[]> {
  const cacheKey = `rec:personal:${userId}`;
  const cached   = await redis.get(cacheKey).catch(() => null);
  if (cached) {
    const ids: number[] = JSON.parse(cached);
    return fetchProductsByIds(ids, limit);
  }

  // Get user's purchase history → category affinity
  const orders = await Order.findAll({
    where: { userId, status: { [Op.in]: ['delivered', 'shipped', 'processing'] } },
    include: [{ model: OrderItem, attributes: ['productId'] }],
    limit: 50,
  });

  const purchasedIds = new Set<number>();
  const productIds: number[] = [];
  orders.forEach(o => o.items?.forEach(i => {
    purchasedIds.add(i.productId);
    productIds.push(i.productId);
  }));

  let categoryIds: number[] = [];
  if (productIds.length) {
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      attributes: ['categoryId'],
    });
    categoryIds = [...new Set(products.map(p => p.categoryId))];
  }

  const where: Record<string, unknown> = {
    status: 'active',
    id: { [Op.notIn]: [...purchasedIds] },
  };
  if (categoryIds.length) where['categoryId'] = { [Op.in]: categoryIds };

  const recs = await Product.findAll({
    where,
    order: [['rating', 'DESC'], ['review_count', 'DESC']],
    limit,
    include: [
      { model: ProductImage, separate: true, limit: 1, where: { isPrimary: true }, required: false },
      { model: Category, attributes: ['name', 'slug'] },
      { model: Brand, attributes: ['name'] },
    ],
  });

  const ids = recs.map(p => p.id);
  await redis.setEx(cacheKey, REC_CACHE_TTL, JSON.stringify(ids)).catch(() => {});
  return recs;
}

// ─── AI Description Generator ─────────────────────────────────
export async function generateDescription(
  productName: string,
  category: string,
  features: string,
  tone: 'professional' | 'casual' | 'luxury' = 'professional',
): Promise<{ shortDescription: string; description: string; tags: string[] }> {
  if (!env.OPENAI_API_KEY) {
    return {
      shortDescription: `${productName} — a great ${category} product.`,
      description:      `Introducing the ${productName}. ${features}`,
      tags:             [category.toLowerCase()],
    };
  }

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const toneMap = {
    professional: 'professional, clear, and informative',
    casual:       'friendly, conversational, and approachable',
    luxury:       'premium, aspirational, and sophisticated',
  };

  const prompt = `You are a product copywriter for an Indian ecommerce platform called Lagaao.
Generate product copy for:
Product: ${productName}
Category: ${category}
Key features: ${features}
Tone: ${toneMap[tone]}

Respond ONLY with valid JSON matching this shape:
{
  "shortDescription": "<1-2 sentence hook, max 160 chars>",
  "description": "<3-4 paragraph HTML description with <p> tags>",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}`;

  const completion = await openai.chat.completions.create({
    model:       'gpt-4o-mini',
    messages:    [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content ?? '{}';
  return JSON.parse(content);
}

// ─── AI Shopping Chat ─────────────────────────────────────────
export interface ChatMessage { role: 'user' | 'assistant'; content: string }

export async function chat(
  messages: ChatMessage[],
  userId?: number,
): Promise<{ reply: string; products?: Product[] }> {
  if (!env.OPENAI_API_KEY) {
    return { reply: "I'm not available right now. Try our search to find what you need!" };
  }

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const systemPrompt = `You are Lagaao's friendly AI shopping assistant for an Indian ecommerce platform.
Help users find products, compare options, understand sizing, and make purchase decisions.
When the user asks about specific products, respond with a JSON object:
{ "reply": "<your response>", "searchQuery": "<optional product search query to run>" }
Keep replies concise (2-3 sentences max). Use ₹ for prices. Be helpful and warm.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.6,
    response_format: { type: 'json_object' },
  });

  let reply = "I couldn't find an answer. Try searching directly!";
  let products: Product[] | undefined;

  try {
    const parsed = JSON.parse(completion.choices[0].message.content ?? '{}') as {
      reply?: string;
      searchQuery?: string;
    };
    reply = parsed.reply ?? reply;

    if (parsed.searchQuery) {
      products = await Product.findAll({
        where: {
          name: { [Op.like]: `%${parsed.searchQuery}%` },
          status: 'active',
        },
        include: [
          { model: ProductImage, separate: true, limit: 1, where: { isPrimary: true }, required: false },
          { model: Category, attributes: ['name', 'slug'] },
        ],
        limit: 4,
        order: [['rating', 'DESC']],
      });
    }
  } catch (err) {
    logger.warn('AI chat parse error', { err });
  }

  return { reply, products };
}

// ─── Helpers ──────────────────────────────────────────────────
async function fetchProductsByIds(ids: number[], limit: number): Promise<Product[]> {
  const products = await Product.findAll({
    where: { id: { [Op.in]: ids }, status: 'active' },
    include: [
      { model: ProductImage, separate: true, limit: 1, where: { isPrimary: true }, required: false },
      { model: Category, attributes: ['name', 'slug'] },
      { model: Brand, attributes: ['name'] },
      { model: ProductVariant, required: false, include: [{ model: Inventory }] },
    ],
    limit,
  });
  const map = new Map(products.map(p => [p.id, p]));
  return ids.map(id => map.get(id)).filter(Boolean) as Product[];
}

async function getTopRatedProducts(excludeId: number, limit: number): Promise<Product[]> {
  return Product.findAll({
    where: { status: 'active', id: { [Op.ne]: excludeId } },
    order: [['rating', 'DESC'], ['review_count', 'DESC']],
    limit,
    include: [
      { model: ProductImage, separate: true, limit: 1, where: { isPrimary: true }, required: false },
      { model: Category, attributes: ['name', 'slug'] },
      { model: Brand, attributes: ['name'] },
    ],
  });
}

import { Op } from 'sequelize';
import crypto from 'crypto';
import {
  Banner, BannerPosition,
  Announcement,
  NewsletterSubscriber,
  BlogPost,
  CmsPage,
} from '../../models';
import { AppError } from '../../shared/utils/appError';

// ─── Banners ──────────────────────────────────────────────────
export async function getActiveBanners(position?: BannerPosition) {
  const now = new Date();
  return Banner.findAll({
    where: {
      isActive: true,
      ...(position ? { position } : {}),
      [Op.or]: [{ startDate: null }, { startDate: { [Op.lte]: now } }],
      [Op.and]: [
        { [Op.or]: [{ endDate: null }, { endDate: { [Op.gte]: now } }] },
      ],
    },
    order: [['sortOrder', 'ASC']],
  });
}

export async function adminListBanners() {
  return Banner.findAll({ order: [['sortOrder', 'ASC']], paranoid: false });
}

export async function adminCreateBanner(data: Partial<Banner>) {
  return Banner.create(data as Banner);
}

export async function adminUpdateBanner(id: number, data: Partial<Banner>) {
  const banner = await Banner.findByPk(id, { paranoid: false });
  if (!banner) throw new AppError('Banner not found', 404);
  return banner.update(data);
}

export async function adminDeleteBanner(id: number) {
  const banner = await Banner.findByPk(id);
  if (!banner) throw new AppError('Banner not found', 404);
  await banner.destroy();
}

// ─── Announcements ────────────────────────────────────────────
export async function getActiveAnnouncement() {
  return Announcement.findOne({
    where: {
      isActive: true,
      [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
    },
    order: [['createdAt', 'DESC']],
  });
}

export async function adminListAnnouncements() {
  return Announcement.findAll({ order: [['createdAt', 'DESC']] });
}

export async function adminCreateAnnouncement(data: Partial<Announcement>) {
  return Announcement.create(data as Announcement);
}

export async function adminUpdateAnnouncement(id: number, data: Partial<Announcement>) {
  const ann = await Announcement.findByPk(id);
  if (!ann) throw new AppError('Announcement not found', 404);
  return ann.update(data);
}

export async function adminDeleteAnnouncement(id: number) {
  const ann = await Announcement.findByPk(id);
  if (!ann) throw new AppError('Announcement not found', 404);
  await ann.destroy();
}

// ─── Newsletter ───────────────────────────────────────────────
export async function subscribe(email: string, name?: string, source?: string) {
  const existing = await NewsletterSubscriber.findOne({ where: { email } });
  if (existing) {
    if (existing.isActive) throw new AppError('Already subscribed', 409);
    await existing.update({ isActive: true, name: name ?? existing.name });
    return existing;
  }
  const token = crypto.randomBytes(32).toString('hex');
  return NewsletterSubscriber.create({
    email,
    name: name ?? null,
    source: source ?? null,
    isActive: true,
    unsubscribeToken: token,
  } as NewsletterSubscriber);
}

export async function unsubscribe(token: string) {
  const sub = await NewsletterSubscriber.findOne({ where: { unsubscribeToken: token } });
  if (!sub) throw new AppError('Invalid unsubscribe token', 404);
  await sub.update({ isActive: false });
}

// ─── Blog Posts ───────────────────────────────────────────────
export async function getPublishedPosts(page = 1, limit = 10, tag?: string) {
  const offset = (page - 1) * limit;
  const where: Record<string, unknown> = { status: 'published' };
  if (tag) where['tags'] = { [Op.like]: `%"${tag}"%` };

  const { rows, count } = await BlogPost.findAndCountAll({
    where,
    order: [['publishedAt', 'DESC']],
    limit,
    offset,
    attributes: { exclude: ['content'] },
  });
  return { rows, count, page, limit };
}

export async function getPostBySlug(slug: string) {
  const post = await BlogPost.findOne({ where: { slug, status: 'published' } });
  if (!post) throw new AppError('Post not found', 404);
  await post.increment('viewCount');
  return post;
}

export async function adminListPosts() {
  return BlogPost.findAll({ order: [['createdAt', 'DESC']], paranoid: false });
}

export async function adminCreatePost(data: Partial<BlogPost>) {
  return BlogPost.create(data as BlogPost);
}

export async function adminUpdatePost(id: number, data: Partial<BlogPost>) {
  const post = await BlogPost.findByPk(id, { paranoid: false });
  if (!post) throw new AppError('Post not found', 404);
  if (data.status === 'published' && !post.publishedAt) {
    (data as BlogPost).publishedAt = new Date();
  }
  return post.update(data);
}

export async function adminDeletePost(id: number) {
  const post = await BlogPost.findByPk(id);
  if (!post) throw new AppError('Post not found', 404);
  await post.destroy();
}

// ─── CMS Pages ────────────────────────────────────────────────
export async function getPage(slug: string) {
  const page = await CmsPage.findOne({ where: { slug, isPublished: true } });
  if (!page) throw new AppError('Page not found', 404);
  return page;
}

export async function adminListPages() {
  return CmsPage.findAll({ order: [['title', 'ASC']], paranoid: false });
}

export async function adminGetPage(id: number) {
  const page = await CmsPage.findByPk(id, { paranoid: false });
  if (!page) throw new AppError('Page not found', 404);
  return page;
}

export async function adminCreatePage(data: Partial<CmsPage>) {
  return CmsPage.create(data as CmsPage);
}

export async function adminUpdatePage(id: number, data: Partial<CmsPage>) {
  const page = await CmsPage.findByPk(id, { paranoid: false });
  if (!page) throw new AppError('Page not found', 404);
  return page.update(data);
}

export async function adminDeletePage(id: number) {
  const page = await CmsPage.findByPk(id);
  if (!page) throw new AppError('Page not found', 404);
  await page.destroy();
}

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { ok, created } from '../../shared/utils/response.util';
import * as cms from './cms.service';

// ─── Public router ────────────────────────────────────────────
const router = Router();

// Banners
router.get('/banners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pos = req.query['position'] as string | undefined;
    const banners = await cms.getActiveBanners(pos as any);
    ok(res, banners);
  } catch (e) { next(e); }
});

// Announcement bar
router.get('/announcement', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const ann = await cms.getActiveAnnouncement();
    ok(res, ann);
  } catch (e) { next(e); }
});

// Newsletter subscribe
router.post('/newsletter/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, source } = req.body as { email: string; name?: string; source?: string };
    if (!email) { res.status(400).json({ success: false, message: 'email required' }); return; }
    const sub = await cms.subscribe(email, name, source);
    created(res, { id: sub.id, email: sub.email });
  } catch (e) { next(e); }
});

// Newsletter unsubscribe
router.get('/newsletter/unsubscribe/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await cms.unsubscribe(req.params['token']!);
    ok(res, { message: 'Unsubscribed successfully' });
  } catch (e) { next(e); }
});

// Blog posts
router.get('/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = Number(req.query['page']  ?? 1);
    const limit = Number(req.query['limit'] ?? 10);
    const tag   = req.query['tag'] as string | undefined;
    const result = await cms.getPublishedPosts(page, limit, tag);
    ok(res, result);
  } catch (e) { next(e); }
});

router.get('/posts/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await cms.getPostBySlug(req.params['slug']!);
    ok(res, post);
  } catch (e) { next(e); }
});

// CMS static pages
router.get('/pages/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await cms.getPage(req.params['slug']!);
    ok(res, page);
  } catch (e) { next(e); }
});

export default router;

// ─── Admin router ─────────────────────────────────────────────
export const adminCmsRouter = Router();
adminCmsRouter.use(authenticate, requireRole('admin'));

// Banners
adminCmsRouter.get('/banners', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await cms.adminListBanners()); } catch (e) { next(e); }
});
adminCmsRouter.post('/banners', async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await cms.adminCreateBanner(req.body)); } catch (e) { next(e); }
});
adminCmsRouter.patch('/banners/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await cms.adminUpdateBanner(Number(req.params['id']), req.body)); } catch (e) { next(e); }
});
adminCmsRouter.delete('/banners/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { await cms.adminDeleteBanner(Number(req.params['id'])); ok(res, null); } catch (e) { next(e); }
});

// Announcements
adminCmsRouter.get('/announcements', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await cms.adminListAnnouncements()); } catch (e) { next(e); }
});
adminCmsRouter.post('/announcements', async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await cms.adminCreateAnnouncement(req.body)); } catch (e) { next(e); }
});
adminCmsRouter.patch('/announcements/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await cms.adminUpdateAnnouncement(Number(req.params['id']), req.body)); } catch (e) { next(e); }
});
adminCmsRouter.delete('/announcements/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { await cms.adminDeleteAnnouncement(Number(req.params['id'])); ok(res, null); } catch (e) { next(e); }
});

// Blog posts
adminCmsRouter.get('/posts', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await cms.adminListPosts()); } catch (e) { next(e); }
});
adminCmsRouter.post('/posts', async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await cms.adminCreatePost(req.body)); } catch (e) { next(e); }
});
adminCmsRouter.patch('/posts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await cms.adminUpdatePost(Number(req.params['id']), req.body)); } catch (e) { next(e); }
});
adminCmsRouter.delete('/posts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { await cms.adminDeletePost(Number(req.params['id'])); ok(res, null); } catch (e) { next(e); }
});

// CMS pages
adminCmsRouter.get('/pages', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await cms.adminListPages()); } catch (e) { next(e); }
});
adminCmsRouter.get('/pages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await cms.adminGetPage(Number(req.params['id']))); } catch (e) { next(e); }
});
adminCmsRouter.post('/pages', async (req: Request, res: Response, next: NextFunction) => {
  try { created(res, await cms.adminCreatePage(req.body)); } catch (e) { next(e); }
});
adminCmsRouter.patch('/pages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await cms.adminUpdatePage(Number(req.params['id']), req.body)); } catch (e) { next(e); }
});
adminCmsRouter.delete('/pages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { await cms.adminDeletePage(Number(req.params['id'])); ok(res, null); } catch (e) { next(e); }
});

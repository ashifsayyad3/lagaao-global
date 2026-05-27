import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize }    from '../../middleware/rbac.middleware';
import { ok, created, paginated } from '../../shared/utils/response.util';
import { Role }   from '../../shared/types/roles';
import { notificationService } from './notification.service';
import { env } from '../../config/env';
import { redis } from '../../config/redis';

const NOTIF_SETTINGS_KEY = 'admin:notification_settings';

const router = Router();

// ─── User routes (any authenticated user) ─────────────────────────────────────
router.use(authenticate);

// GET /api/v1/notifications — my notifications
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = Number(req.query['page'] ?? 1);
    const limit = Number(req.query['limit'] ?? 20);
    const { count, rows } = await notificationService.getUserNotifications(req.user!.id, page, limit);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

// GET /api/v1/notifications/unread-count
router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try { ok(res, { count: await notificationService.unreadCount(req.user!.id) }); } catch (e) { next(e); }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markRead(Number(req.params['id']), req.user!.id);
    ok(res, null, 'Marked as read');
  } catch (e) { next(e); }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllRead(req.user!.id);
    ok(res, null, 'All notifications marked as read');
  } catch (e) { next(e); }
});

export default router;

// ─── Admin router ──────────────────────────────────────────────────────────────
export const adminNotificationsRouter = Router();
adminNotificationsRouter.use(authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN));

// GET /api/v1/admin/notifications/logs
adminNotificationsRouter.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { count, rows, page, limit } = await notificationService.getLogs(req);
    paginated(res, rows, page, limit, count);
  } catch (e) { next(e); }
});

// GET /api/v1/admin/notifications/stats
adminNotificationsRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try { ok(res, await notificationService.getStats()); } catch (e) { next(e); }
});

// POST /api/v1/admin/notifications/broadcast
adminNotificationsRouter.post('/broadcast', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, body, type = 'broadcast' } = req.body as { title: string; body: string; type?: string };
    if (!title || !body) { res.status(400).json({ success: false, message: 'title and body required' }); return; }
    await notificationService.broadcast({ type, title, body });
    ok(res, null, 'Broadcast sent');
  } catch (e) { next(e); }
});

// GET /api/v1/admin/notifications/settings
adminNotificationsRouter.get('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = await redis.get(NOTIF_SETTINGS_KEY).catch(() => null);
    const settings = raw ? JSON.parse(raw) : null;
    const waConfigured = !!(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ENABLED === 'true');
    res.json({ success: true, data: { settings, waConfigured } });
  } catch (e) { next(e); }
});

// POST /api/v1/admin/notifications/settings
adminNotificationsRouter.post('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { settings } = req.body as { settings: unknown[] };
    if (!Array.isArray(settings)) { res.status(400).json({ success: false, message: 'settings must be an array' }); return; }
    await redis.set(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
    ok(res, null, 'Settings saved');
  } catch (e) { next(e); }
});

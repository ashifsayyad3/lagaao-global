import { Op } from 'sequelize';
import { Notification, NotificationChannel } from '../../models/notification.model';
import { User } from '../../models';
import { getPagination } from '../../shared/utils/paginate.util';
import { io } from '../../app';
import { logger } from '../../config/logger';
import type { Request } from 'express';

class NotificationService {

  async create(opts: {
    userId?:  number;
    type:     string;
    title:    string;
    body:     string;
    channel?: NotificationChannel;
    data?:    Record<string, unknown>;
  }): Promise<Notification> {
    const notif = await Notification.create({
      userId:  opts.userId ?? null,
      type:    opts.type,
      title:   opts.title,
      body:    opts.body,
      channel: opts.channel ?? 'in_app',
      status:  'pending',
      data:    opts.data ? JSON.stringify(opts.data) : null,
    });

    await notif.update({ status: 'sent' });

    // Emit via socket.io if userId known
    if (opts.userId) {
      io.to(`user:${opts.userId}`).emit('notification', {
        id:     notif.id,
        type:   notif.type,
        title:  notif.title,
        body:   notif.body,
        data:   opts.data,
      });
    }

    logger.debug(`Notification sent: ${opts.type} → userId:${opts.userId ?? 'broadcast'}`);
    return notif;
  }

  async broadcast(opts: {
    type:  string;
    title: string;
    body:  string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    // Create a single broadcast entry (userId null = all)
    await this.create({ ...opts, channel: 'in_app' });
    io.emit('notification', { type: opts.type, title: opts.title, body: opts.body });
    logger.info(`Broadcast notification: ${opts.title}`);
  }

  async getUserNotifications(userId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return Notification.findAndCountAll({
      where: {
        [Op.or]: [{ userId }, { userId: null }],
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
  }

  async markRead(id: number, userId: number): Promise<void> {
    await Notification.update(
      { isRead: true, status: 'read', readAt: new Date() },
      { where: { id, userId } },
    );
  }

  async markAllRead(userId: number): Promise<void> {
    await Notification.update(
      { isRead: true, status: 'read', readAt: new Date() },
      { where: { userId, isRead: false } },
    );
  }

  async unreadCount(userId: number): Promise<number> {
    return Notification.count({ where: { userId, isRead: false } });
  }

  // ─── Admin methods ─────────────────────────────────────────────────────────
  async getLogs(req: Request) {
    const { page, limit, offset } = getPagination(req, 25);
    const { count, rows } = await Notification.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit, offset,
      include: [{ model: User, attributes: ['id', 'name', 'email'], required: false }],
    });
    return { count, rows, page, limit };
  }

  async getStats() {
    const [total, sent, failed] = await Promise.all([
      Notification.count(),
      Notification.count({ where: { status: 'sent' } }),
      Notification.count({ where: { status: 'failed' } }),
    ]);
    return { total, sent, failed, channels: 3 };
  }
}

export const notificationService = new NotificationService();

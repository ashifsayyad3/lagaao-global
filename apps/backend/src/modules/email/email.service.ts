import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import { EmailLog, EmailType } from '../../models/emailLog.model';
import { User }   from '../../models';
import { env }    from '../../config/env';
import { logger } from '../../config/logger';
import { getPagination } from '../../shared/utils/paginate.util';
import type { Request } from 'express';

// ─── Email Templates ──────────────────────────────────────────────────────────
const TEMPLATES: Record<EmailType, (data: Record<string, unknown>) => { subject: string; html: string }> = {
  welcome: (d) => ({
    subject: `Welcome to Lagaao, ${d['name']}! 🌿`,
    html: `<h2>Welcome, ${d['name']}!</h2><p>Your account is ready. Start shopping at <a href="${d['storeUrl']}">Lagaao</a>.</p>`,
  }),
  order_confirmed: (d) => ({
    subject: `Order #${d['orderNumber']} Confirmed ✅`,
    html: `<h2>Order Confirmed!</h2><p>Hi ${d['name']}, your order <strong>#${d['orderNumber']}</strong> has been confirmed. Total: ₹${d['total']}</p>`,
  }),
  order_shipped: (d) => ({
    subject: `Your order #${d['orderNumber']} is on the way 🚚`,
    html: `<h2>Order Shipped!</h2><p>Hi ${d['name']}, order <strong>#${d['orderNumber']}</strong> has been shipped via ${d['courier']}. Tracking: ${d['trackingNumber']}</p>`,
  }),
  order_delivered: (d) => ({
    subject: `Order #${d['orderNumber']} Delivered 🎉`,
    html: `<h2>Order Delivered!</h2><p>Hi ${d['name']}, your order <strong>#${d['orderNumber']}</strong> has been delivered. How was it?</p>`,
  }),
  order_cancelled: (d) => ({
    subject: `Order #${d['orderNumber']} Cancelled`,
    html: `<h2>Order Cancelled</h2><p>Hi ${d['name']}, your order <strong>#${d['orderNumber']}</strong> has been cancelled. Reason: ${d['reason']}</p>`,
  }),
  payment_receipt: (d) => ({
    subject: `Payment Received for #${d['orderNumber']} 💳`,
    html: `<h2>Payment Receipt</h2><p>Hi ${d['name']}, payment of ₹${d['amount']} has been received for order <strong>#${d['orderNumber']}</strong>.</p>`,
  }),
  refund_processed: (d) => ({
    subject: `Refund Initiated for #${d['orderNumber']}`,
    html: `<h2>Refund Processed</h2><p>Hi ${d['name']}, a refund of ₹${d['amount']} has been initiated for order <strong>#${d['orderNumber']}</strong>.</p>`,
  }),
  password_reset: (d) => ({
    subject: `Reset your Lagaao password 🔐`,
    html: `<h2>Password Reset</h2><p>Click the link to reset your password: <a href="${d['link']}">Reset Password</a>. Link expires in 1 hour.</p>`,
  }),
  otp: (d) => ({
    subject: `Your Lagaao OTP: ${d['otp']}`,
    html: `<h2>Your OTP</h2><p>Your one-time password is: <strong style="font-size:24px">${d['otp']}</strong>. Valid for 10 minutes.</p>`,
  }),
  vendor_approved: (d) => ({
    subject: `Your Lagaao store is live! 🛍️`,
    html: `<h2>Congratulations!</h2><p>Hi ${d['name']}, your store <strong>${d['storeName']}</strong> is now live on Lagaao. <a href="${d['dashboardUrl']}">Go to your dashboard</a>.</p>`,
  }),
  vendor_rejected: (d) => ({
    subject: `Lagaao Vendor Application Update`,
    html: `<h2>Application Update</h2><p>Hi ${d['name']}, your vendor application was not approved. Reason: ${d['reason']}. You may re-apply after 7 days.</p>`,
  }),
  newsletter: (d) => ({
    subject: d['subject'] as string ?? 'Lagaao Newsletter',
    html: d['body'] as string ?? '',
  }),
  campaign: (d) => ({
    subject: d['subject'] as string ?? 'Special Offer from Lagaao',
    html: d['body'] as string ?? '',
  }),
  broadcast: (d) => ({
    subject: d['subject'] as string ?? 'Important Update from Lagaao',
    html: d['body'] as string ?? '',
  }),
};

// ─── Transporter ──────────────────────────────────────────────────────────────
function createTransporter() {
  // Use ethereal for dev if no SMTP configured
  if (!env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email', port: 587, secure: false,
      auth: { user: env.SMTP_USER ?? '', pass: env.SMTP_PASS ?? '' },
    });
  }
  return nodemailer.createTransport({
    host:   env.SMTP_HOST,
    port:   Number(env.SMTP_PORT ?? 587),
    secure: env.SMTP_SECURE === 'true',
    auth:   { user: env.SMTP_USER ?? '', pass: env.SMTP_PASS ?? '' },
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────
class EmailService {
  private transporter = createTransporter();

  async send(
    type: EmailType,
    to: string,
    data: Record<string, unknown> = {},
    userId?: number,
  ): Promise<EmailLog> {
    const tpl = TEMPLATES[type](data);

    const log = await EmailLog.create({
      type,
      toEmail: to,
      subject: tpl.subject,
      status:  'queued',
      userId:  userId ?? null,
      metadata: JSON.stringify(data),
    });

    try {
      const info = await this.transporter.sendMail({
        from:    `"Lagaao" <${env.SMTP_FROM ?? 'noreply@lagaao.com'}>`,
        to,
        subject: tpl.subject,
        html:    this.#wrapLayout(tpl.html, tpl.subject),
      });
      await log.update({ status: 'sent', messageId: info.messageId, sentAt: new Date() });
      logger.info(`Email sent: ${type} → ${to} (${info.messageId})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await log.update({ status: 'failed', errorMessage: msg });
      logger.warn(`Email failed: ${type} → ${to}: ${msg}`);
    }

    return log;
  }

  // Convenience wrappers for common flows
  async sendWelcome(user: { id: number; name: string; email: string }): Promise<void> {
    await this.send('welcome', user.email, { name: user.name, storeUrl: env.FRONTEND_URL }, user.id);
  }

  async sendOrderConfirmed(user: { id: number; name: string; email: string }, orderNumber: string, total: number): Promise<void> {
    await this.send('order_confirmed', user.email, { name: user.name, orderNumber, total }, user.id);
  }

  async sendOrderShipped(user: { id: number; name: string; email: string }, orderNumber: string, courier: string, trackingNumber: string): Promise<void> {
    await this.send('order_shipped', user.email, { name: user.name, orderNumber, courier, trackingNumber }, user.id);
  }

  async sendPasswordReset(email: string, link: string, userId?: number): Promise<void> {
    await this.send('password_reset', email, { link }, userId);
  }

  async sendOtp(email: string, otp: string, userId?: number): Promise<void> {
    await this.send('otp', email, { otp }, userId);
  }

  async sendVendorApproved(user: { id: number; name: string; email: string }, storeName: string): Promise<void> {
    await this.send('vendor_approved', user.email, {
      name: user.name, storeName, dashboardUrl: `${env.FRONTEND_URL}/vendor`,
    }, user.id);
  }

  // ─── Admin API methods ─────────────────────────────────────────────────────
  async getLogs(req: Request) {
    const { page, limit, offset } = getPagination(req, 25);
    const where: Record<string, unknown> = {};
    if (req.query['status']) where['status'] = req.query['status'];
    if (req.query['type'])   where['type']   = req.query['type'];
    if (req.query['q']) {
      where['toEmail'] = { [Op.like]: `%${req.query['q']}%` };
    }
    const { count, rows } = await EmailLog.findAndCountAll({
      where, order: [['createdAt', 'DESC']], limit, offset,
      include: [{ model: User, attributes: ['id', 'name'], required: false }],
    });
    return { count, rows, page, limit };
  }

  async getStats() {
    const [total, sent, failed, queued] = await Promise.all([
      EmailLog.count(),
      EmailLog.count({ where: { status: 'sent' } }),
      EmailLog.count({ where: { status: 'failed' } }),
      EmailLog.count({ where: { status: 'queued' } }),
    ]);
    return { total, sent, failed, queued };
  }

  async retryFailed(id: number): Promise<EmailLog> {
    const log = await EmailLog.findByPk(id);
    if (!log) throw new Error('Email log not found');
    if (log.status !== 'failed') throw new Error('Only failed emails can be retried');

    const meta: Record<string, unknown> = log.metadata ? JSON.parse(log.metadata) : {};
    const tpl = TEMPLATES[log.type](meta);

    await log.update({ status: 'queued', retryCount: log.retryCount + 1 });

    try {
      const info = await this.transporter.sendMail({
        from:    `"Lagaao" <${env.SMTP_FROM ?? 'noreply@lagaao.com'}>`,
        to:      log.toEmail,
        subject: tpl.subject,
        html:    this.#wrapLayout(tpl.html, tpl.subject),
      });
      await log.update({ status: 'sent', messageId: info.messageId, sentAt: new Date() });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await log.update({ status: 'failed', errorMessage: msg });
    }

    return log;
  }

  #wrapLayout(content: string, title: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
.footer{text-align:center;color:#9ca3af;font-size:12px;margin-top:24px}
h2{color:#111827}a{color:#16a34a}
</style></head>
<body>
  <div class="container">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-flex;align-items:center;gap:8px;background:#f0fdf4;padding:8px 16px;border-radius:999px">
        <span style="color:#16a34a;font-weight:bold;font-size:18px">🌿 Lagaao</span>
      </div>
    </div>
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} Lagaao.com · India's Smartest Marketplace</p>
      <p>You received this email because you're registered on Lagaao.</p>
    </div>
  </div>
</body></html>`;
  }
}

export const emailService = new EmailService();

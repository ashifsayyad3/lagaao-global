/**
 * WhatsApp Business Cloud API — Meta v19.0
 *
 * All outbound messages use pre-approved WhatsApp message templates.
 * Template names must exactly match what is approved in Meta Business Manager.
 *
 * Required env vars:
 *   WHATSAPP_TOKEN           — permanent system-user token
 *   WHATSAPP_PHONE_NUMBER_ID — phone number ID from Meta dashboard
 *   WHATSAPP_ENABLED         — 'true' to activate (default: 'false')
 */

import { env } from '../../config/env';
import { logger } from '../../config/logger';

/** Check if a user has opted in to WhatsApp — lazy-imported to avoid circular deps */
async function isOptedIn(phone: string): Promise<boolean> {
  if (!phone) return false;
  try {
    const { User } = await import('../../models');
    const { Op }   = await import('sequelize');
    const digits   = phone.replace(/\D/g, '');
    const user = await User.findOne({
      where: { phone: { [Op.like]: `%${digits.slice(-10)}` } },
      attributes: ['whatsappOptIn'],
    });
    return user?.whatsappOptIn ?? true; // default opt-in if no user found
  } catch {
    return true; // fail open
  }
}

const BASE = 'https://graph.facebook.com/v19.0';

type ParamType = 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';

interface TextParam    { type: 'text'; text: string }
interface CurrencyParam { type: 'currency'; currency: { fallback_value: string; code: string; amount_1000: number } }

type TemplateParam = TextParam | CurrencyParam;

interface TemplateMessage {
  to:           string;
  templateName: string;
  languageCode?: string;
  components:   {
    type:       'header' | 'body' | 'button';
    sub_type?:  string;
    index?:     string;
    parameters: TemplateParam[];
  }[];
}

// ── helpers ───────────────────────────────────────────────────────────────────

function textParam(text: string): TextParam {
  return { type: 'text', text: String(text) };
}

function inrParam(amount: number): CurrencyParam {
  return {
    type: 'currency',
    currency: {
      fallback_value: `₹${amount.toFixed(2)}`,
      code:           'INR',
      amount_1000:    Math.round(amount * 1000),
    },
  };
}

function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('91') ? digits : `91${digits}`;
}

// ── service ───────────────────────────────────────────────────────────────────

export class WhatsAppService {
  get #enabled(): boolean {
    return env.WHATSAPP_ENABLED === 'true' && !!env.WHATSAPP_TOKEN && !!env.WHATSAPP_PHONE_NUMBER_ID;
  }

  async #send(msg: TemplateMessage): Promise<void> {
    if (!this.#enabled) {
      logger.debug('WhatsApp disabled — skipping message', { template: msg.templateName, to: msg.to });
      return;
    }

    // Respect user opt-out
    if (!(await isOptedIn(msg.to))) {
      logger.debug('WhatsApp opt-out — skipping', { to: msg.to, template: msg.templateName });
      return;
    }

    const url = `${BASE}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to:                normalisePhone(msg.to),
      type:              'template',
      template: {
        name:     msg.templateName,
        language: { code: msg.languageCode ?? 'en' },
        components: msg.components,
      },
    };

    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${env.WHATSAPP_TOKEN}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json() as Record<string, unknown>;
        logger.warn('WhatsApp send failed', { template: msg.templateName, status: res.status, err });
        return; // non-fatal — WhatsApp failure should not break the main flow
      }

      logger.info('WhatsApp sent', { template: msg.templateName, to: msg.to });
    } catch (err) {
      logger.warn('WhatsApp network error', { err }); // never throw
    }
  }

  // ── Template helpers ───────────────────────────────────────────────────────

  /**
   * order_placed
   * Body: {{1}} name, {{2}} order number, {{3}} total amount
   */
  async orderPlaced(opts: {
    phone: string; name: string; orderNumber: string; total: number;
  }): Promise<void> {
    return this.#send({
      to:           opts.phone,
      templateName: 'order_placed',
      components:   [{
        type:       'body',
        parameters: [
          textParam(opts.name),
          textParam(opts.orderNumber),
          inrParam(opts.total),
        ],
      }],
    });
  }

  /**
   * order_confirmed
   * Body: {{1}} name, {{2}} order number
   */
  async orderConfirmed(opts: { phone: string; name: string; orderNumber: string }): Promise<void> {
    return this.#send({
      to:           opts.phone,
      templateName: 'order_confirmed',
      components:   [{
        type:       'body',
        parameters: [textParam(opts.name), textParam(opts.orderNumber)],
      }],
    });
  }

  /**
   * order_shipped
   * Body: {{1}} name, {{2}} order number, {{3}} courier name, {{4}} AWB code
   * Button 0 (URL): {{1}} tracking URL
   */
  async orderShipped(opts: {
    phone: string; name: string; orderNumber: string;
    courierName: string; awbCode: string; trackingUrl: string;
  }): Promise<void> {
    return this.#send({
      to:           opts.phone,
      templateName: 'order_shipped',
      components:   [
        {
          type:       'body',
          parameters: [
            textParam(opts.name),
            textParam(opts.orderNumber),
            textParam(opts.courierName),
            textParam(opts.awbCode),
          ],
        },
        {
          type:       'button',
          sub_type:   'url',
          index:      '0',
          parameters: [textParam(opts.trackingUrl)],
        },
      ],
    });
  }

  /**
   * order_out_for_delivery
   * Body: {{1}} name, {{2}} order number
   */
  async orderOutForDelivery(opts: { phone: string; name: string; orderNumber: string }): Promise<void> {
    return this.#send({
      to:           opts.phone,
      templateName: 'order_out_for_delivery',
      components:   [{
        type:       'body',
        parameters: [textParam(opts.name), textParam(opts.orderNumber)],
      }],
    });
  }

  /**
   * order_delivered
   * Body: {{1}} name, {{2}} order number
   */
  async orderDelivered(opts: { phone: string; name: string; orderNumber: string }): Promise<void> {
    return this.#send({
      to:           opts.phone,
      templateName: 'order_delivered',
      components:   [{
        type:       'body',
        parameters: [textParam(opts.name), textParam(opts.orderNumber)],
      }],
    });
  }

  /**
   * order_cancelled
   * Body: {{1}} name, {{2}} order number, {{3}} reason
   */
  async orderCancelled(opts: {
    phone: string; name: string; orderNumber: string; reason: string;
  }): Promise<void> {
    return this.#send({
      to:           opts.phone,
      templateName: 'order_cancelled',
      components:   [{
        type:       'body',
        parameters: [textParam(opts.name), textParam(opts.orderNumber), textParam(opts.reason)],
      }],
    });
  }

  /**
   * refund_initiated
   * Body: {{1}} name, {{2}} order number, {{3}} refund amount
   */
  async refundInitiated(opts: {
    phone: string; name: string; orderNumber: string; amount: number;
  }): Promise<void> {
    return this.#send({
      to:           opts.phone,
      templateName: 'refund_initiated',
      components:   [{
        type:       'body',
        parameters: [textParam(opts.name), textParam(opts.orderNumber), inrParam(opts.amount)],
      }],
    });
  }

  /**
   * otp_verification
   * Body: {{1}} OTP code, {{2}} expiry minutes
   */
  async sendOtp(opts: { phone: string; otp: string; expiryMinutes?: number }): Promise<void> {
    return this.#send({
      to:           opts.phone,
      templateName: 'otp_verification',
      components:   [{
        type:       'body',
        parameters: [textParam(opts.otp), textParam(String(opts.expiryMinutes ?? 10))],
      }],
    });
  }

  /**
   * support_ticket_update
   * Body: {{1}} name, {{2}} ticket number, {{3}} new status
   */
  async supportTicketUpdate(opts: {
    phone: string; name: string; ticketNumber: string; status: string;
  }): Promise<void> {
    return this.#send({
      to:           opts.phone,
      templateName: 'support_ticket_update',
      components:   [{
        type:       'body',
        parameters: [textParam(opts.name), textParam(opts.ticketNumber), textParam(opts.status)],
      }],
    });
  }
}

export const whatsappService = new WhatsAppService();

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { authorize } from '../../shared/middleware/authorize.middleware';
import { Role } from '../../shared/types/roles';
import { invoiceService } from './invoice.service';

const router = Router();

/**
 * GET /api/v1/orders/:id/invoice
 * Returns GST-compliant HTML invoice.
 * Add ?format=html (default) or ?format=pdf (needs puppeteer).
 */
router.get('/orders/:id/invoice', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order   = await invoiceService.getOrderForInvoice(Number(req.params['id']), req.user!.id, false);
    const html    = invoiceService.generateHtml(order);

    // Try to generate PDF with puppeteer (optional dep)
    if (req.query['format'] === 'pdf') {
      try {
        const puppeteer = require('puppeteer') as typeof import('puppeteer');
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page    = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });
        await browser.close();
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${order.orderNumber}.pdf"`,
        });
        res.send(pdf);
        return;
      } catch {
        // Puppeteer not available — fall through to HTML
      }
    }

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="invoice-${order.orderNumber}.html"`,
    });
    res.send(html);
  } catch (e) { next(e); }
});

/** Admin: get invoice for any order */
router.get('/admin/orders/:id/invoice', authenticate, authorize(Role.ADMIN, Role.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await invoiceService.getOrderForInvoice(Number(req.params['id']), 0, true);
      const html  = invoiceService.generateHtml(order);
      res.set({ 'Content-Type': 'text/html; charset=utf-8' });
      res.send(html);
    } catch (e) { next(e); }
  });

export { router as invoiceRoutes };

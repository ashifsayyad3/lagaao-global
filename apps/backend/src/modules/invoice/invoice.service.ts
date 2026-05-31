import { Order, OrderItem, Product, User } from '../../models/index';
import { AppError } from '../../middleware/errorHandler.middleware';
import { env } from '../../config/env';

interface GstLineItem {
  srNo:       number;
  description: string;
  hsn:        string;
  qty:        number;
  unitPrice:  number;
  lineTotal:  number;
  taxableVal: number;
  cgstRate:   number;
  cgstAmt:    number;
  sgstRate:   number;
  sgstAmt:    number;
  igstRate:   number;
  igstAmt:    number;
  total:      number;
}

// Company / seller details — override via env
const SELLER = {
  name:    env.INVOICE_COMPANY_NAME    ?? 'Lagaao.com',
  address: env.INVOICE_COMPANY_ADDRESS ?? '123, Green Avenue, Mumbai, Maharashtra – 400001',
  gstin:   env.INVOICE_GSTIN           ?? '27AABCU9603R1ZX',
  pan:     env.INVOICE_PAN             ?? 'AABCU9603R',
  email:   env.INVOICE_EMAIL           ?? 'support@lagaao.com',
  phone:   env.INVOICE_PHONE           ?? '+91 98765 43210',
  state:   env.INVOICE_STATE           ?? 'Maharashtra',
  stateCode: env.INVOICE_STATE_CODE    ?? '27',
};

const GST_RATE = 0.18;   // 18% GST — 9% CGST + 9% SGST (intra-state) or 18% IGST (inter-state)
const HSN_DEFAULT = '0602'; // Live plants & cuttings

function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export class InvoiceService {
  async getOrderForInvoice(orderId: number, userId: number, isAdmin = false): Promise<Order> {
    const where = isAdmin ? { id: orderId } : { id: orderId, userId };
    const order = await Order.findOne({
      where,
      include: [
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['id', 'name', 'hsnCode'] }],
        },
        { model: User, attributes: ['id', 'name', 'email', 'phone'] },
      ],
    });
    if (!order) throw new AppError('Order not found', 404);
    if (!['confirmed','processing','shipped','out_for_delivery','delivered'].includes(order.status)
        && order.paymentStatus !== 'paid' && !isAdmin) {
      throw new AppError('Invoice is only available for paid orders', 400);
    }
    return order;
  }

  generateHtml(order: Order): string {
    const customer = order.user as User & { phone?: string };
    const addr     = order.shippingAddress as Record<string, string>;
    const isInterState = (addr['state'] ?? '').toLowerCase() !== SELLER.state.toLowerCase();

    // Build line items
    const lines: GstLineItem[] = (order.items as OrderItem[]).map((item, i) => {
      const lineTotal  = Number(item.lineTotal);
      // Back-calculate taxable value: lineTotal = taxableVal * (1 + gstRate)
      const taxableVal = Math.round((lineTotal / (1 + GST_RATE)) * 100) / 100;
      const gstAmt     = Math.round((lineTotal - taxableVal) * 100) / 100;

      return {
        srNo:       i + 1,
        description: item.productName,
        hsn:        (item.product as Product & { hsnCode?: string })?.hsnCode ?? HSN_DEFAULT,
        qty:        item.qty,
        unitPrice:  Number(item.unitPrice),
        lineTotal,
        taxableVal,
        cgstRate:   isInterState ? 0       : GST_RATE / 2 * 100,
        cgstAmt:    isInterState ? 0       : Math.round(gstAmt / 2 * 100) / 100,
        sgstRate:   isInterState ? 0       : GST_RATE / 2 * 100,
        sgstAmt:    isInterState ? 0       : Math.round(gstAmt / 2 * 100) / 100,
        igstRate:   isInterState ? GST_RATE * 100 : 0,
        igstAmt:    isInterState ? gstAmt  : 0,
        total:      lineTotal,
      };
    });

    const totals = lines.reduce((a, l) => ({
      taxable: a.taxable + l.taxableVal,
      cgst:    a.cgst    + l.cgstAmt,
      sgst:    a.sgst    + l.sgstAmt,
      igst:    a.igst    + l.igstAmt,
    }), { taxable: 0, cgst: 0, sgst: 0, igst: 0 });

    const grandTotal = Number(order.total);
    const shipping   = Number(order.shipping);
    const discount   = Number(order.discount);
    const wallet     = Number((order as Order & { walletAmount?: number }).walletAmount ?? 0);

    const invoiceNo = `INV-${order.orderNumber}`;
    const invoiceDate = fmtDate(order.createdAt);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Tax Invoice — ${invoiceNo}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Helvetica Neue',Arial,sans-serif; font-size:12px; color:#1a1a1a; background:#fff; }
  .page { max-width:210mm; margin:0 auto; padding:10mm 12mm; }

  /* Header */
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
  .brand { font-size:22px; font-weight:800; color:#2d6a3f; letter-spacing:-0.5px; }
  .brand-sub { font-size:10px; color:#666; margin-top:2px; }
  .invoice-title { text-align:right; }
  .invoice-title h1 { font-size:18px; font-weight:800; color:#1a1a1a; letter-spacing:1px; }
  .invoice-title .inv-no { font-size:11px; color:#555; margin-top:4px; }

  .divider { border:none; border-top:2px solid #2d6a3f; margin:10px 0; }
  .divider-thin { border:none; border-top:1px solid #e5e7eb; margin:8px 0; }

  /* Two-col info grid */
  .info-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:14px; }
  .info-block h3 { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
                   color:#2d6a3f; margin-bottom:5px; border-bottom:1px solid #e5e7eb; padding-bottom:3px; }
  .info-block p  { font-size:11px; line-height:1.55; color:#374151; }
  .info-block strong { font-weight:700; }

  /* Table */
  table { width:100%; border-collapse:collapse; margin-bottom:14px; font-size:11px; }
  thead th { background:#f0fdf4; color:#1a1a1a; font-weight:700; padding:7px 8px;
             border:1px solid #d1fae5; text-align:center; white-space:nowrap; }
  thead th:nth-child(2) { text-align:left; }
  tbody td { padding:6px 8px; border:1px solid #e5e7eb; vertical-align:middle; text-align:center; }
  tbody td:nth-child(2) { text-align:left; }
  tbody tr:nth-child(even) td { background:#f9fafb; }

  /* Totals */
  .totals-wrap { display:flex; justify-content:flex-end; margin-bottom:14px; }
  .totals-table { width:280px; font-size:11px; }
  .totals-table td { padding:4px 8px; }
  .totals-table tr.total-row td { font-weight:800; font-size:13px; background:#f0fdf4; border-top:2px solid #2d6a3f; }
  .totals-table .label { color:#555; text-align:right; }
  .totals-table .amount { text-align:right; font-family:monospace; }

  /* Tax summary */
  .tax-summary { font-size:10px; margin-bottom:14px; }
  .tax-summary h4 { font-weight:700; margin-bottom:6px; color:#2d6a3f; }
  .tax-summary table thead th { font-size:10px; background:#f0fdf4; }
  .tax-summary table tbody td { font-size:10px; }

  /* Amount in words */
  .words { background:#f0fdf4; border:1px solid #d1fae5; border-radius:6px;
           padding:8px 12px; font-size:11px; margin-bottom:14px; }
  .words strong { font-weight:700; }

  /* Footer */
  .footer { display:flex; justify-content:space-between; align-items:flex-end; margin-top:20px; }
  .note { font-size:10px; color:#6b7280; max-width:360px; line-height:1.5; }
  .signature { text-align:right; }
  .sig-line { width:160px; border-top:1px solid #374151; margin:40px 0 4px auto; }
  .sig-label { font-size:10px; color:#555; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding:5mm; }
    @page { margin:10mm; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">🌿 ${SELLER.name}</div>
      <div class="brand-sub">${SELLER.address}</div>
      <div class="brand-sub">GSTIN: ${SELLER.gstin} &nbsp;|&nbsp; PAN: ${SELLER.pan}</div>
      <div class="brand-sub">📧 ${SELLER.email} &nbsp;|&nbsp; 📞 ${SELLER.phone}</div>
    </div>
    <div class="invoice-title">
      <h1>TAX INVOICE</h1>
      <div class="inv-no">
        <strong>${invoiceNo}</strong><br/>
        Date: ${invoiceDate}<br/>
        Order: ${order.orderNumber}
      </div>
    </div>
  </div>
  <hr class="divider"/>

  <!-- Billing / Shipping / Payment -->
  <div class="info-grid">
    <div class="info-block">
      <h3>Bill To</h3>
      <p>
        <strong>${customer?.name ?? 'Customer'}</strong><br/>
        ${addr['line1'] ?? ''}<br/>
        ${addr['line2'] ? addr['line2'] + '<br/>' : ''}
        ${addr['city'] ?? ''}, ${addr['state'] ?? ''} – ${addr['pincode'] ?? ''}<br/>
        ${addr['country'] ?? 'India'}<br/>
        ${customer?.phone ? '📞 ' + customer.phone : ''}
        ${customer?.email ? '<br/>📧 ' + customer.email : ''}
      </p>
    </div>
    <div class="info-block">
      <h3>Ship To</h3>
      <p>
        <strong>${addr['fullName'] ?? customer?.name ?? ''}</strong><br/>
        ${addr['line1'] ?? ''}<br/>
        ${addr['line2'] ? addr['line2'] + '<br/>' : ''}
        ${addr['city'] ?? ''}, ${addr['state'] ?? ''} – ${addr['pincode'] ?? ''}<br/>
        ${addr['country'] ?? 'India'}<br/>
        📞 ${addr['phone'] ?? ''}
      </p>
    </div>
    <div class="info-block">
      <h3>Payment Info</h3>
      <p>
        <strong>Method:</strong> ${order.paymentMethod.toUpperCase()}<br/>
        <strong>Status:</strong> ${order.paymentStatus.toUpperCase()}<br/>
        <strong>Order Status:</strong> ${order.status.replace(/_/g,' ').toUpperCase()}<br/>
        <strong>Supply Type:</strong> ${isInterState ? 'Inter-State' : 'Intra-State'}<br/>
        <strong>Place of Supply:</strong> ${addr['state'] ?? ''} (${isInterState ? 'IGST' : 'CGST+SGST'})
      </p>
    </div>
  </div>
  <hr class="divider-thin"/>

  <!-- Line items table -->
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description of Goods</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Unit Price (₹)</th>
        <th>Taxable Value (₹)</th>
        ${isInterState
          ? '<th>IGST Rate</th><th>IGST Amt (₹)</th>'
          : '<th>CGST Rate</th><th>CGST Amt (₹)</th><th>SGST Rate</th><th>SGST Amt (₹)</th>'
        }
        <th>Total (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${lines.map(l => `
      <tr>
        <td>${l.srNo}</td>
        <td>${l.description}</td>
        <td>${l.hsn}</td>
        <td>${l.qty}</td>
        <td>${fmt(l.unitPrice)}</td>
        <td>${fmt(l.taxableVal)}</td>
        ${isInterState
          ? `<td>${l.igstRate}%</td><td>${fmt(l.igstAmt)}</td>`
          : `<td>${l.cgstRate}%</td><td>${fmt(l.cgstAmt)}</td><td>${l.sgstRate}%</td><td>${fmt(l.sgstAmt)}</td>`
        }
        <td><strong>${fmt(l.total)}</strong></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-wrap">
    <table class="totals-table">
      <tr><td class="label">Subtotal</td><td class="amount">₹ ${fmt(Number(order.subtotal))}</td></tr>
      ${discount > 0 ? `<tr><td class="label">Discount</td><td class="amount">− ₹ ${fmt(discount)}</td></tr>` : ''}
      ${wallet > 0 ? `<tr><td class="label">Wallet Credit</td><td class="amount">− ₹ ${fmt(wallet)}</td></tr>` : ''}
      <tr><td class="label">Taxable Value</td><td class="amount">₹ ${fmt(totals.taxable)}</td></tr>
      ${isInterState
        ? `<tr><td class="label">IGST (18%)</td><td class="amount">₹ ${fmt(totals.igst)}</td></tr>`
        : `<tr><td class="label">CGST (9%)</td><td class="amount">₹ ${fmt(totals.cgst)}</td></tr>
           <tr><td class="label">SGST (9%)</td><td class="amount">₹ ${fmt(totals.sgst)}</td></tr>`
      }
      ${shipping > 0 ? `<tr><td class="label">Shipping</td><td class="amount">₹ ${fmt(shipping)}</td></tr>` : ''}
      <tr class="total-row">
        <td class="label">Grand Total</td>
        <td class="amount">₹ ${fmt(grandTotal)}</td>
      </tr>
    </table>
  </div>

  <!-- Tax summary -->
  <div class="tax-summary">
    <h4>GST Tax Summary</h4>
    <table>
      <thead>
        <tr>
          <th>HSN</th><th>Taxable Amt (₹)</th>
          ${isInterState
            ? '<th>IGST Rate</th><th>IGST Amt (₹)</th>'
            : '<th>CGST Rate</th><th>CGST Amt (₹)</th><th>SGST Rate</th><th>SGST Amt (₹)</th>'
          }
          <th>Total Tax (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${HSN_DEFAULT}</td>
          <td>${fmt(totals.taxable)}</td>
          ${isInterState
            ? `<td>18%</td><td>${fmt(totals.igst)}</td>`
            : `<td>9%</td><td>${fmt(totals.cgst)}</td><td>9%</td><td>${fmt(totals.sgst)}</td>`
          }
          <td><strong>${fmt(totals.cgst + totals.sgst + totals.igst)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Amount in words -->
  <div class="words">
    <strong>Amount in Words:</strong> ${amountToWords(grandTotal)} Only
  </div>

  <!-- Footer -->
  <hr class="divider-thin"/>
  <div class="footer">
    <div class="note">
      <p>• This is a computer-generated invoice and does not require a physical signature.</p>
      <p>• Goods once sold will not be taken back or exchanged unless defective.</p>
      <p>• Subject to ${SELLER.state} jurisdiction.</p>
      <p>• GSTIN: ${SELLER.gstin}</p>
    </div>
    <div class="signature">
      <div class="sig-line"></div>
      <div class="sig-label">For <strong>${SELLER.name}</strong><br/>Authorised Signatory</div>
    </div>
  </div>
</div>
</body>
</html>`;
  }
}

/** Simple Indian number-to-words (handles up to crores) */
function amountToWords(amount: number): string {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  function two(n: number): string {
    if (n < 20) return ones[n] ?? '';
    return (tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')).trim();
  }
  function three(n: number): string {
    if (n >= 100) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + two(n % 100) : '');
    return two(n);
  }

  const n = Math.round(amount);
  if (n === 0) return 'Zero Rupees';
  const crore = Math.floor(n / 10000000);
  const lakh  = Math.floor((n % 10000000) / 100000);
  const thous = Math.floor((n % 100000) / 1000);
  const rest  = n % 1000;

  let result = '';
  if (crore) result += three(crore) + ' Crore ';
  if (lakh)  result += three(lakh)  + ' Lakh ';
  if (thous) result += three(thous) + ' Thousand ';
  if (rest)  result += three(rest);
  return result.trim() + ' Rupees';
}

export const invoiceService = new InvoiceService();

import jsPDF from 'jspdf';
import { type InvoiceDesign, type InvoiceLineDraft, lineTotals, formatMoney } from './invoiceDesign';

/**
 * Design-aware invoice PDF. Unlike the fixed Office generator, every
 * colour, font and text block comes from the InvoiceDesign the user
 * edits in the Invoice Studio, so the export matches the preview
 * exactly. A4 portrait, no external assets.
 */

export interface InvoiceDocData {
  invoiceNumber: string;
  issueDate: string;         // ISO date
  dueDate: string | null;    // ISO date
  billToName: string;
  billToEmail?: string | null;
  billToLines?: string[];
  lines: InvoiceLineDraft[];
  notes?: string | null;
  currency?: string;
  status?: string | null;
  amountPaid?: number;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function buildInvoicePdf(data: InvoiceDocData, design: InvoiceDesign): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;
  const accent = hexToRgb(design.accent);
  const ink: [number, number, number] = [24, 24, 27];
  const mute: [number, number, number] = [120, 120, 128];
  const hair: [number, number, number] = [216, 216, 220];
  const font = design.font;
  const currency = data.currency || 'GBP';

  const text = (
    s: string, x: number, y: number,
    o: { size?: number; bold?: boolean; color?: [number, number, number]; align?: 'left' | 'right' | 'center'; maxWidth?: number } = {},
  ) => {
    doc.setFont(font, o.bold ? 'bold' : 'normal');
    doc.setFontSize(o.size ?? 10);
    const c = o.color ?? ink;
    doc.setTextColor(c[0], c[1], c[2]);
    doc.text(s, x, y, { align: o.align ?? 'left', maxWidth: o.maxWidth });
  };
  const rule = (y: number, color: [number, number, number] = hair, w = 0.3, x1 = margin, x2 = pageW - margin) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(w);
    doc.line(x1, y, x2, y);
  };

  let y = margin + 4;

  // Header: company block left, INVOICE + number right, accent rule under.
  const companyName = design.companyLines[0] || 'Invoice';
  text(design.headerCaps ? companyName.toUpperCase() : companyName, margin, y, { size: 20, bold: true });
  let cy = y + 6;
  design.companyLines.slice(1).forEach((lineText) => {
    text(lineText, margin, cy, { size: 8.5, color: mute });
    cy += 4.2;
  });

  text('INVOICE', pageW - margin, y, { size: 20, bold: true, align: 'right', color: accent });
  text(data.invoiceNumber, pageW - margin, y + 6, { size: 10, align: 'right', color: mute });

  y = Math.max(cy + 4, y + 16);
  rule(y, accent, 0.8);
  y += 10;

  // Bill to / dates
  text('BILLED TO', margin, y, { size: 7.5, bold: true, color: mute });
  text(data.billToName, margin, y + 6, { size: 11.5, bold: true });
  let by = y + 11;
  if (data.billToEmail) { text(data.billToEmail, margin, by, { size: 8.5, color: mute }); by += 4.4; }
  (data.billToLines || []).forEach((lineText) => { text(lineText, margin, by, { size: 8.5, color: mute }); by += 4.4; });

  const rightX = pageW - margin;
  const labelX = rightX - 62;
  let ry = y;
  const kv = (k: string, v: string, bold = false) => {
    text(k, labelX, ry, { size: 7.5, color: mute });
    text(v, rightX, ry, { size: 9.5, bold, align: 'right' });
    ry += 7;
  };
  kv('Issue date', fmtDate(data.issueDate));
  kv('Due date', data.dueDate ? fmtDate(data.dueDate) : 'On receipt', true);
  if (data.status && data.status !== 'draft') kv('Status', data.status.toUpperCase());

  y = Math.max(by, ry) + 8;

  // Lines table
  rule(y);
  y += 6;
  const cols = { qty: 14, price: 26, vat: 16, amount: 28 };
  const descW = contentW - cols.qty - cols.price - cols.vat - cols.amount;
  const xQty = margin + descW;
  const xPrice = xQty + cols.qty;
  const xVat = xPrice + cols.price;

  text('DESCRIPTION', margin, y, { size: 7.5, bold: true, color: mute });
  text('QTY', xQty + cols.qty - 2, y, { size: 7.5, bold: true, color: mute, align: 'right' });
  text('UNIT', xPrice + cols.price - 2, y, { size: 7.5, bold: true, color: mute, align: 'right' });
  text('VAT', xVat + cols.vat - 2, y, { size: 7.5, bold: true, color: mute, align: 'right' });
  text('AMOUNT', pageW - margin, y, { size: 7.5, bold: true, color: mute, align: 'right' });
  y += 4;
  rule(y);
  y += 7;

  data.lines.forEach((l) => {
    const sub = Math.round((l.quantity || 0) * (l.unit_price || 0) * 100) / 100;
    const desc = doc.splitTextToSize(l.description || 'Item', descW - 4) as string[];
    text(desc.join('\n'), margin, y, { size: 9.5 });
    text(String(l.quantity ?? 1), xQty + cols.qty - 2, y, { size: 9.5, align: 'right' });
    text(formatMoney(l.unit_price || 0, currency), xPrice + cols.price - 2, y, { size: 9.5, align: 'right' });
    text(`${Math.round((l.tax_rate || 0) * 100)}%`, xVat + cols.vat - 2, y, { size: 9.5, align: 'right' });
    text(formatMoney(sub, currency), pageW - margin, y, { size: 9.5, bold: true, align: 'right' });
    y += Math.max(7, desc.length * 4.6 + 2.4);
  });

  y += 2;
  rule(y);
  y += 9;

  // Totals
  const totals = lineTotals(data.lines);
  const tx = pageW - margin - 70;
  const trow = (k: string, v: string, opts: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
    text(k, tx, y, { size: opts.size ?? 9.5, color: opts.color ?? mute, bold: opts.bold });
    text(v, pageW - margin, y, { size: opts.size ?? 9.5, align: 'right', bold: opts.bold, color: opts.color });
    y += 7;
  };
  trow('Subtotal', formatMoney(totals.subtotal, currency));
  if (totals.tax > 0) trow('VAT', formatMoney(totals.tax, currency));
  if (data.amountPaid && data.amountPaid > 0) trow('Paid', `-${formatMoney(data.amountPaid, currency)}`);
  rule(y - 3, accent, 0.6, tx, pageW - margin);
  y += 3;
  const due = totals.total - (data.amountPaid || 0);
  text(data.amountPaid && data.amountPaid > 0 ? 'BALANCE DUE' : 'TOTAL DUE', tx, y, { size: 10, bold: true });
  text(formatMoney(due, currency), pageW - margin, y, { size: 15, bold: true, align: 'right', color: accent });
  y += 14;

  // Notes
  if (data.notes) {
    rule(y);
    y += 7;
    text('NOTES', margin, y, { size: 7.5, bold: true, color: mute });
    y += 5;
    const split = doc.splitTextToSize(data.notes, contentW) as string[];
    text(split.join('\n'), margin, y, { size: 8.5, color: mute });
    y += split.length * 4.4 + 6;
  }

  // Payment block
  if (design.paymentLines.length > 0 && design.paymentLines.some((s) => s.trim())) {
    const boxH = 12 + design.paymentLines.length * 4.6;
    const boxY = Math.min(Math.max(y, pageH - 46 - boxH), pageH - 30 - boxH);
    doc.setFillColor(246, 246, 248);
    doc.roundedRect(margin, boxY, contentW, boxH, 2, 2, 'F');
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.rect(margin, boxY, 1.4, boxH, 'F');
    text('PAYMENT', margin + 6, boxY + 6.5, { size: 7.5, bold: true, color: mute });
    let py = boxY + 11.5;
    design.paymentLines.forEach((lineText) => {
      if (!lineText.trim()) return;
      text(lineText, margin + 6, py, { size: 8.5 });
      py += 4.6;
    });
  }

  // Footer
  const fy = pageH - 14;
  rule(fy - 5);
  if (design.footerText.trim()) {
    text(design.footerText, pageW / 2, fy, { size: 8, bold: true, align: 'center', color: mute });
  }

  return doc;
}

export function downloadInvoicePdf(data: InvoiceDocData, design: InvoiceDesign) {
  buildInvoicePdf(data, design).save(`${data.invoiceNumber || 'invoice'}.pdf`);
}

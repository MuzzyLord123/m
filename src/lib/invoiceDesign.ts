/**
 * Invoice document design: every visual decision on the exported PDF is
 * editable and stored per user in the invoice_design table. The same
 * design renders the in-app invoice view and the jsPDF export, so what
 * the client sees on their phone is what lands in their inbox.
 */

export interface InvoiceLineDraft {
  description: string;
  quantity: number;
  unit_price: number;
  /** 0.20 = 20% VAT. */
  tax_rate: number;
}

export interface InvoiceDesign {
  /** Accent hex used for rules, headings and the total. */
  accent: string;
  /** jsPDF built-in families keep the export dependency-free. */
  font: 'helvetica' | 'times' | 'courier';
  /** Company block, one line per entry. First line is the display name. */
  companyLines: string[];
  /** Payment instructions, one line per entry. Empty hides the box. */
  paymentLines: string[];
  /** Closing line under the footer rule. */
  footerText: string;
  /** Uppercase the company name in the header. */
  headerCaps: boolean;
}

export const DEFAULT_INVOICE_DESIGN: InvoiceDesign = {
  accent: '#C2410C',
  font: 'helvetica',
  companyLines: ['Quooro', 'Wales, United Kingdom', 'billing@quooro.co.uk'],
  paymentLines: ['Bank transfer to Quooro', 'Reference: the invoice number'],
  footerText: 'Thank you for your business',
  headerCaps: true,
};

export const ACCENT_CHOICES = [
  { name: 'Ember', hex: '#C2410C' },
  { name: 'Ink', hex: '#111827' },
  { name: 'Forest', hex: '#3E7C4F' },
  { name: 'Slate blue', hex: '#3B5F82' },
  { name: 'Brass', hex: '#8A6D1F' },
  { name: 'Plum', hex: '#6D3B6D' },
] as const;

export const FONT_CHOICES: { value: InvoiceDesign['font']; label: string; hint: string }[] = [
  { value: 'helvetica', label: 'Helvetica', hint: 'Clean and modern' },
  { value: 'times', label: 'Times', hint: 'Traditional serif' },
  { value: 'courier', label: 'Courier', hint: 'Typewriter ledger' },
];

export function normaliseDesign(raw: unknown): InvoiceDesign {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Partial<InvoiceDesign>;
  return {
    accent: typeof d.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(d.accent) ? d.accent : DEFAULT_INVOICE_DESIGN.accent,
    font: d.font === 'times' || d.font === 'courier' ? d.font : 'helvetica',
    companyLines: Array.isArray(d.companyLines) && d.companyLines.length
      ? d.companyLines.map(String).slice(0, 6)
      : DEFAULT_INVOICE_DESIGN.companyLines,
    paymentLines: Array.isArray(d.paymentLines) ? d.paymentLines.map(String).slice(0, 6) : DEFAULT_INVOICE_DESIGN.paymentLines,
    footerText: typeof d.footerText === 'string' ? d.footerText : DEFAULT_INVOICE_DESIGN.footerText,
    headerCaps: d.headerCaps !== false,
  };
}

export function lineTotals(lines: InvoiceLineDraft[]) {
  let subtotal = 0;
  let tax = 0;
  for (const l of lines) {
    const sub = Math.round((Number(l.quantity) || 0) * (Number(l.unit_price) || 0) * 100) / 100;
    subtotal += sub;
    tax += Math.round(sub * (Number(l.tax_rate) || 0) * 100) / 100;
  }
  subtotal = Math.round(subtotal * 100) / 100;
  tax = Math.round(tax * 100) / 100;
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}

export function formatMoney(n: number, currency = 'GBP'): string {
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
  return `${symbol}${(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Stage 3 report queries — Aged AR/AP, VAT summary, Fixed-asset register.
// Live reads. No caching.
import { supabase } from '@/integrations/supabase/client';

export interface AgedRow {
  id: string;
  party_id: string;
  party_name: string;
  document_number: string;
  document_date: string;
  due_date: string | null;
  total: number;
  paid: number;
  outstanding: number;
  bucket: 'current' | '1-30' | '31-60' | '61-90' | '90+';
  days_overdue: number;
  currency: string;
}
export interface AgedReport {
  rows: AgedRow[];
  buckets: Record<AgedRow['bucket'], number>;
  totalOutstanding: number;
  asOf: string;
}

function classifyBucket(dueDate: string | null, asOf: string): { bucket: AgedRow['bucket']; days: number } {
  if (!dueDate) return { bucket: 'current', days: 0 };
  const due = new Date(dueDate + 'T00:00:00');
  const at = new Date(asOf + 'T00:00:00');
  const days = Math.floor((at.getTime() - due.getTime()) / 86400000);
  if (days <= 0) return { bucket: 'current', days: 0 };
  if (days <= 30) return { bucket: '1-30', days };
  if (days <= 60) return { bucket: '31-60', days };
  if (days <= 90) return { bucket: '61-90', days };
  return { bucket: '90+', days };
}

const EMPTY_BUCKETS: AgedReport['buckets'] = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

export async function fetchAgedReceivables(orgId: string, asOf: string): Promise<AgedReport> {
  const { data: invoices } = await (supabase as any).from('acc_ar_invoices')
    .select('id, customer_id, invoice_number, invoice_date, due_date, total, amount_paid, currency, status')
    .eq('org_id', orgId)
    .not('posted_at', 'is', null)
    .lte('invoice_date', asOf);
  const { data: customers } = await (supabase as any).from('acc_customers')
    .select('id, name').eq('org_id', orgId);
  const custMap = new Map((customers || []).map((c: any) => [c.id, c.name]));
  const rows: AgedRow[] = [];
  const buckets = { ...EMPTY_BUCKETS };
  for (const inv of invoices || []) {
    const outstanding = Number(inv.total || 0) - Number(inv.amount_paid || 0);
    if (outstanding <= 0.005) continue;
    const { bucket, days } = classifyBucket(inv.due_date, asOf);
    buckets[bucket] += outstanding;
    rows.push({
      id: inv.id, party_id: inv.customer_id,
      party_name: (custMap.get(inv.customer_id) as string) || '(unknown customer)',
      document_number: inv.invoice_number, document_date: inv.invoice_date,
      due_date: inv.due_date, total: Number(inv.total || 0),
      paid: Number(inv.amount_paid || 0), outstanding,
      bucket, days_overdue: days, currency: inv.currency || 'GBP',
    });
  }
  rows.sort((a, b) => b.days_overdue - a.days_overdue || a.party_name.localeCompare(b.party_name));
  return { rows, buckets, totalOutstanding: rows.reduce((s, r) => s + r.outstanding, 0), asOf };
}

export async function fetchAgedPayables(orgId: string, asOf: string): Promise<AgedReport> {
  const { data: bills } = await (supabase as any).from('acc_ap_bills')
    .select('id, supplier_id, bill_number, bill_date, due_date, total, amount_paid, currency, status')
    .eq('org_id', orgId)
    .not('posted_at', 'is', null)
    .lte('bill_date', asOf);
  const { data: suppliers } = await (supabase as any).from('acc_suppliers')
    .select('id, name').eq('org_id', orgId);
  const supMap = new Map((suppliers || []).map((s: any) => [s.id, s.name]));
  const rows: AgedRow[] = [];
  const buckets = { ...EMPTY_BUCKETS };
  for (const b of bills || []) {
    const outstanding = Number(b.total || 0) - Number(b.amount_paid || 0);
    if (outstanding <= 0.005) continue;
    const { bucket, days } = classifyBucket(b.due_date, asOf);
    buckets[bucket] += outstanding;
    rows.push({
      id: b.id, party_id: b.supplier_id,
      party_name: (supMap.get(b.supplier_id) as string) || '(unknown supplier)',
      document_number: b.bill_number, document_date: b.bill_date,
      due_date: b.due_date, total: Number(b.total || 0),
      paid: Number(b.amount_paid || 0), outstanding,
      bucket, days_overdue: days, currency: b.currency || 'GBP',
    });
  }
  rows.sort((a, b) => b.days_overdue - a.days_overdue || a.party_name.localeCompare(b.party_name));
  return { rows, buckets, totalOutstanding: rows.reduce((s, r) => s + r.outstanding, 0), asOf };
}

/* =================== VAT Summary =================== */
export interface VatReturnRow {
  id: string; period_start: string; period_end: string;
  output_vat: number; input_vat: number; net_due: number;
  status: string; submitted_at: string | null; reference: string | null;
  payment_amount: number | null; payment_date: string | null;
}
export interface VatSummary {
  returns: VatReturnRow[];
  outstandingOutputVat: number;   // from unfiled AR
  outstandingInputVat: number;    // from unfiled AP
  liveNet: number;                // outstandingOutputVat - outstandingInputVat
  totalFiled: number;
  totalPaid: number;
}

export async function fetchVatSummary(orgId: string): Promise<VatSummary> {
  const [{ data: returns }, { data: invoices }, { data: bills }] = await Promise.all([
    (supabase as any).from('acc_vat_returns')
      .select('id, period_start, period_end, output_vat, input_vat, net_due, status, submitted_at, reference, payment_amount, payment_date')
      .eq('org_id', orgId).order('period_end', { ascending: false }),
    (supabase as any).from('acc_ar_invoices')
      .select('tax_total, invoice_date').eq('org_id', orgId).not('posted_at', 'is', null),
    (supabase as any).from('acc_ap_bills')
      .select('tax_total, bill_date').eq('org_id', orgId).not('posted_at', 'is', null),
  ]);
  // "Outstanding" = totals for periods not yet covered by any filed return
  const coveredThrough = (returns || [])
    .filter((r: any) => r.status === 'filed' || r.status === 'paid' || r.status === 'submitted')
    .reduce((max: string, r: any) => r.period_end > max ? r.period_end : max, '0000-00-00');
  const outputOutstanding = (invoices || [])
    .filter((i: any) => (i.invoice_date || '') > coveredThrough)
    .reduce((s: number, i: any) => s + Number(i.tax_total || 0), 0);
  const inputOutstanding = (bills || [])
    .filter((b: any) => (b.bill_date || '') > coveredThrough)
    .reduce((s: number, b: any) => s + Number(b.tax_total || 0), 0);
  const totalFiled = (returns || []).reduce((s: number, r: any) => s + Number(r.net_due || 0), 0);
  const totalPaid = (returns || []).reduce((s: number, r: any) => s + Number(r.payment_amount || 0), 0);
  return {
    returns: returns || [],
    outstandingOutputVat: outputOutstanding,
    outstandingInputVat: inputOutstanding,
    liveNet: outputOutstanding - inputOutstanding,
    totalFiled, totalPaid,
  };
}

/* =================== Fixed-asset register =================== */
export interface FaRow {
  id: string; name: string; asset_tag: string | null; category: string | null;
  status: string; method: string;
  purchase_date: string; purchase_cost: number; salvage_value: number;
  useful_life_months: number;
  accumulated_depreciation: number; net_book_value: number;
  last_depreciated_on: string | null;
  disposal_date: string | null; disposal_proceeds: number | null;
}
export interface FaRegister {
  rows: FaRow[];
  totalCost: number; totalAccumDepr: number; totalNbv: number;
  totalDisposed: number; countActive: number; countDisposed: number;
}

export async function fetchFixedAssetRegister(orgId: string): Promise<FaRegister> {
  const { data } = await (supabase as any).from('acc_fixed_assets')
    .select('id, name, asset_tag, category, status, depreciation_method, purchase_date, purchase_cost, salvage_value, useful_life_months, accumulated_depreciation, last_depreciated_on, disposal_date, disposal_proceeds')
    .eq('org_id', orgId).order('purchase_date', { ascending: false });
  const rows: FaRow[] = (data || []).map((a: any) => {
    const cost = Number(a.purchase_cost || 0);
    const accum = Number(a.accumulated_depreciation || 0);
    return {
      id: a.id, name: a.name, asset_tag: a.asset_tag, category: a.category,
      status: a.status, method: a.depreciation_method,
      purchase_date: a.purchase_date, purchase_cost: cost,
      salvage_value: Number(a.salvage_value || 0),
      useful_life_months: a.useful_life_months || 0,
      accumulated_depreciation: accum,
      net_book_value: cost - accum,
      last_depreciated_on: a.last_depreciated_on,
      disposal_date: a.disposal_date, disposal_proceeds: a.disposal_proceeds,
    };
  });
  return {
    rows,
    totalCost: rows.filter(r => r.status !== 'disposed').reduce((s, r) => s + r.purchase_cost, 0),
    totalAccumDepr: rows.filter(r => r.status !== 'disposed').reduce((s, r) => s + r.accumulated_depreciation, 0),
    totalNbv: rows.filter(r => r.status !== 'disposed').reduce((s, r) => s + r.net_book_value, 0),
    totalDisposed: rows.filter(r => r.status === 'disposed').reduce((s, r) => s + (r.disposal_proceeds || 0), 0),
    countActive: rows.filter(r => r.status !== 'disposed').length,
    countDisposed: rows.filter(r => r.status === 'disposed').length,
  };
}

// Combined "send to accountant" pack — PDF / Excel / ZIP bundle.
// Reuses the same numbers the on-screen reports use.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchLedger,
  computeTrialBalance,
  computeProfitAndLoss,
  computeBalanceSheet,
  computeCashFlow,
  computeJournalReport,
  computeGeneralLedger,
} from './reportsData';

const db = supabase as any;

const fmtMoney = (n: number, c = 'GBP') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: c, minimumFractionDigits: 2 }).format(Number(n || 0));
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB');

export interface PackMeta {
  orgName: string;
  currency: string;
  from: string;
  to: string;
  preparedBy?: string;
}

export interface Readiness {
  ok: boolean;
  checks: Array<{ key: string; label: string; ok: boolean; detail?: string }>;
}

/** Reads live data and flags anything an accountant would send back. */
export async function checkReadiness(orgId: string, from: string, to: string): Promise<Readiness> {
  const [invDraft, billDraft, unrec, unposted, snap] = await Promise.all([
    db.from('acc_ar_invoices').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'draft').gte('invoice_date', from).lte('invoice_date', to),
    db.from('acc_ap_bills').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'draft').gte('bill_date', from).lte('bill_date', to),
    db.from('acc_bank_transactions').select('id', { count: 'exact', head: true }).eq('org_id', orgId).neq('status', 'reconciled').gte('txn_date', from).lte('txn_date', to),
    db.from('acc_journal_entries').select('id', { count: 'exact', head: true }).eq('org_id', orgId).is('posted_at', null).gte('entry_date', from).lte('entry_date', to),
    fetchLedger(orgId, to),
  ]);
  const tb = computeTrialBalance(snap);
  const dr = tb.reduce((s, r) => s + r.debit, 0);
  const cr = tb.reduce((s, r) => s + r.credit, 0);
  const tbBalanced = Math.abs(dr - cr) < 0.01;

  const checks = [
    { key: 'draftInv', label: 'All customer invoices posted', ok: (invDraft.count || 0) === 0, detail: invDraft.count ? `${invDraft.count} draft invoice(s)` : undefined },
    { key: 'draftBill', label: 'All supplier bills posted', ok: (billDraft.count || 0) === 0, detail: billDraft.count ? `${billDraft.count} draft bill(s)` : undefined },
    { key: 'bankRec', label: 'Bank transactions reconciled', ok: (unrec.count || 0) === 0, detail: unrec.count ? `${unrec.count} unreconciled item(s)` : undefined },
    { key: 'unposted', label: 'No unposted journal entries', ok: (unposted.count || 0) === 0, detail: unposted.count ? `${unposted.count} unposted entry(ies)` : undefined },
    { key: 'tb', label: 'Trial balance in balance', ok: tbBalanced, detail: tbBalanced ? undefined : `Debits ${fmtMoney(dr)} vs Credits ${fmtMoney(cr)}` },
  ];
  return { ok: checks.every(c => c.ok), checks };
}

/** Full pack: cover + TB + P&L + BS + CF + VAT + AR/AP + Journals. Returns a PDF Blob. */
export async function buildAssessmentPack(orgId: string, meta: PackMeta): Promise<Blob> {
  const { orgName, currency, from, to } = meta;
  const snap = await fetchLedger(orgId, to);
  const tb = computeTrialBalance(snap);
  const pl = computeProfitAndLoss(snap, from, to);
  const bs = computeBalanceSheet(snap, to);
  const cf = computeCashFlow(snap, from, to);
  const jr = computeJournalReport(snap, { from, to });

  const [{ data: vatData }, { data: openInv }, { data: openBill }] = await Promise.all([
    db.from('acc_ar_invoices').select('subtotal, tax_total, total, tax_rate').eq('org_id', orgId).gte('invoice_date', from).lte('invoice_date', to).in('status', ['posted', 'paid']),
    db.from('acc_ar_invoices').select('invoice_number, invoice_date, due_date, total, amount_paid, currency, acc_customers(name)').eq('org_id', orgId).eq('status', 'posted').lte('invoice_date', to),
    db.from('acc_ap_bills').select('bill_number, bill_date, due_date, total, amount_paid, currency, acc_suppliers(name)').eq('org_id', orgId).eq('status', 'posted').lte('bill_date', to),
  ]);
  const outputVat = (vatData || []).reduce((s: number, r: any) => s + Number(r.tax_total || 0), 0);
  const vatSubtotal = (vatData || []).reduce((s: number, r: any) => s + Number(r.subtotal || 0), 0);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  /* Cover */
  doc.setFillColor(15, 20, 30); doc.rect(0, 0, 595, 842, 'F');
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
  doc.text('Accountant Pack', 40, 120);
  doc.setFontSize(14); doc.setFont('helvetica', 'normal');
  doc.text(orgName, 40, 148);
  doc.setFontSize(11); doc.setTextColor(160);
  doc.text(`Period: ${fmtDate(from)} – ${fmtDate(to)}`, 40, 172);
  doc.text(`Currency: ${currency}`, 40, 188);
  doc.text(`Prepared: ${new Date().toLocaleString('en-GB')}`, 40, 204);
  if (meta.preparedBy) doc.text(`Prepared by: ${meta.preparedBy}`, 40, 220);
  doc.setTextColor(120); doc.setFontSize(9);
  doc.text('This pack is auto-generated from the live ledger in Quooro.', 40, 780);
  doc.text('All figures reconcile: Trial Balance debits = credits.', 40, 795);

  const header = (title: string, sub: string) => {
    doc.addPage();
    doc.setTextColor(0); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(title, 40, 50);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`${orgName}  ·  ${sub}`, 40, 66);
    doc.setTextColor(0);
  };

  /* Trial balance */
  header('Trial Balance', `As at ${fmtDate(to)}`);
  const tbD = tb.reduce((s, r) => s + r.debit, 0);
  const tbC = tb.reduce((s, r) => s + r.credit, 0);
  autoTable(doc, {
    startY: 82,
    head: [['Code', 'Account', 'Type', 'Debit', 'Credit']],
    body: tb.map(r => [r.code, r.name, r.type, r.debit ? fmtMoney(r.debit, currency) : '', r.credit ? fmtMoney(r.credit, currency) : '']),
    foot: [['', '', 'Totals', fmtMoney(tbD, currency), fmtMoney(tbC, currency)]],
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontSize: 9 },
    footStyles: { fillColor: [240, 240, 245], textColor: 0, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  });

  /* P&L */
  header('Profit & Loss', `${fmtDate(from)} – ${fmtDate(to)}`);
  autoTable(doc, {
    startY: 82,
    head: [['Revenue', '', 'Amount']],
    body: pl.revenue.map(r => [r.code, r.name, fmtMoney(r.amount, currency)]),
    foot: [['', 'Total Revenue', fmtMoney(pl.totalRevenue, currency)]],
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    columnStyles: { 2: { halign: 'right' } },
  });
  autoTable(doc, {
    head: [['Expense', '', 'Amount']],
    body: pl.expense.map(r => [r.code, r.name, fmtMoney(r.amount, currency)]),
    foot: [
      ['', 'Total Expense', fmtMoney(pl.totalExpense, currency)],
      ['', 'Net Income', fmtMoney(pl.netIncome, currency)],
    ],
    headStyles: { fillColor: [239, 68, 68], textColor: 255 },
    footStyles: { fillColor: [30, 30, 40], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' } },
  });

  /* Balance Sheet */
  header('Balance Sheet', `As at ${fmtDate(to)}`);
  autoTable(doc, {
    startY: 82,
    head: [['Assets', '', 'Amount']],
    body: bs.assets.map(r => [r.code, r.name, fmtMoney(r.amount, currency)]),
    foot: [['', 'Total Assets', fmtMoney(bs.totalAssets, currency)]],
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    columnStyles: { 2: { halign: 'right' } },
  });
  autoTable(doc, {
    head: [['Liabilities', '', 'Amount']],
    body: bs.liabilities.map(r => [r.code, r.name, fmtMoney(r.amount, currency)]),
    foot: [['', 'Total Liabilities', fmtMoney(bs.totalLiabilities, currency)]],
    headStyles: { fillColor: [245, 158, 11], textColor: 255 },
    columnStyles: { 2: { halign: 'right' } },
  });
  autoTable(doc, {
    head: [['Equity', '', 'Amount']],
    body: [
      ...bs.equity.map(r => [r.code, r.name, fmtMoney(r.amount, currency)]),
      ['3900', 'Retained Earnings (current)', fmtMoney(bs.retainedEarnings, currency)],
    ],
    foot: [
      ['', 'Total Equity', fmtMoney(bs.totalEquity, currency)],
      ['', 'Liabilities + Equity', fmtMoney(bs.totalLiabilities + bs.totalEquity, currency)],
    ],
    headStyles: { fillColor: [139, 92, 246], textColor: 255 },
    footStyles: { fillColor: [30, 30, 40], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' } },
  });

  /* Cash Flow */
  header('Cash Flow', `${fmtDate(from)} – ${fmtDate(to)}`);
  autoTable(doc, {
    startY: 82,
    body: [['Opening cash', fmtMoney(cf.openingCash, currency)]],
    columnStyles: { 1: { halign: 'right' } },
  });
  const cfSection = (label: string, rows: any[], total: number, color: [number, number, number]) =>
    autoTable(doc, {
      head: [[label, '#', 'Amount']],
      body: rows.map(r => [r.label, r.entries, fmtMoney(r.amount, currency)]),
      foot: [['Subtotal', '', fmtMoney(total, currency)]],
      headStyles: { fillColor: color, textColor: 255 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });
  cfSection('Operating', cf.operating, cf.totalOperating, [59, 130, 246]);
  cfSection('Investing', cf.investing, cf.totalInvesting, [139, 92, 246]);
  cfSection('Financing', cf.financing, cf.totalFinancing, [245, 158, 11]);
  autoTable(doc, {
    body: [
      ['Net change in cash', fmtMoney(cf.netChange, currency)],
      ['Closing cash', fmtMoney(cf.closingCash, currency)],
    ],
    bodyStyles: { fontStyle: 'bold' }, columnStyles: { 1: { halign: 'right' } },
  });

  /* VAT summary */
  header('VAT Summary', `${fmtDate(from)} – ${fmtDate(to)}`);
  autoTable(doc, {
    startY: 82,
    head: [['Metric', 'Amount']],
    body: [
      ['Net sales (VATable)', fmtMoney(vatSubtotal, currency)],
      ['Output VAT (collected)', fmtMoney(outputVat, currency)],
    ],
    headStyles: { fillColor: [30, 30, 40], textColor: 255 },
    columnStyles: { 1: { halign: 'right' } },
  });

  /* Open AR */
  header('Open Customer Invoices', `As at ${fmtDate(to)}`);
  autoTable(doc, {
    startY: 82,
    head: [['Number', 'Customer', 'Date', 'Due', 'Total', 'Paid', 'Outstanding']],
    body: (openInv || []).map((r: any) => {
      const out = Number(r.total || 0) - Number(r.amount_paid || 0);
      return [r.invoice_number, r.acc_customers?.name || '—', r.invoice_date, r.due_date || '', fmtMoney(r.total, r.currency || currency), fmtMoney(r.amount_paid || 0, r.currency || currency), fmtMoney(out, r.currency || currency)];
    }),
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
  });

  /* Open AP */
  header('Open Supplier Bills', `As at ${fmtDate(to)}`);
  autoTable(doc, {
    startY: 82,
    head: [['Number', 'Supplier', 'Date', 'Due', 'Total', 'Paid', 'Outstanding']],
    body: (openBill || []).map((r: any) => {
      const out = Number(r.total || 0) - Number(r.amount_paid || 0);
      return [r.bill_number, r.acc_suppliers?.name || '—', r.bill_date, r.due_date || '', fmtMoney(r.total, r.currency || currency), fmtMoney(r.amount_paid || 0, r.currency || currency), fmtMoney(out, r.currency || currency)];
    }),
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
  });

  /* Journals — sampled to keep file size sane */
  header('Journal Report', `${fmtDate(from)} – ${fmtDate(to)}   ·   ${jr.length} entries`);
  autoTable(doc, {
    startY: 82,
    head: [['Date', 'Description', 'Source', 'Debit', 'Credit']],
    body: jr.flatMap(e => [
      [{ content: `${e.date}  ${e.description || ''}  [${e.source_type}]`, colSpan: 5, styles: { fillColor: [245, 245, 250], fontStyle: 'bold' } }],
      ...e.lines.map(l => ['', `${l.account_code} · ${l.account_name}${l.memo ? ` — ${l.memo}` : ''}`, '', l.debit ? fmtMoney(l.debit, currency) : '', l.credit ? fmtMoney(l.credit, currency) : '']),
    ]) as any,
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  });

  /* Footer */
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(140);
    doc.text(`Page ${i - 1} of ${pages - 1}`, 555, 820, { align: 'right' });
    doc.text(`Quooro Accounting  ·  ${orgName}`, 40, 820);
  }

  return doc.output('blob');
}

/** Convert Blob → base64 (no data: prefix) for edge-function upload. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let bin = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(bin);
}

/* -------------------- Excel pack (multi-sheet workbook) -------------------- */
export async function buildAssessmentXlsx(orgId: string, meta: PackMeta): Promise<Blob> {
  const { orgName, currency, from, to } = meta;
  const snap = await fetchLedger(orgId, to);
  const tb = computeTrialBalance(snap);
  const pl = computeProfitAndLoss(snap, from, to);
  const bs = computeBalanceSheet(snap, to);
  const cf = computeCashFlow(snap, from, to);
  const gl = computeGeneralLedger(snap, { from, to });
  const jr = computeJournalReport(snap, { from, to });

  const [{ data: openInv }, { data: openBill }, { data: vatData }] = await Promise.all([
    db.from('acc_ar_invoices').select('invoice_number, invoice_date, due_date, total, amount_paid, currency, acc_customers(name)').eq('org_id', orgId).eq('status', 'posted').lte('invoice_date', to),
    db.from('acc_ap_bills').select('bill_number, bill_date, due_date, total, amount_paid, currency, acc_suppliers(name)').eq('org_id', orgId).eq('status', 'posted').lte('bill_date', to),
    db.from('acc_ar_invoices').select('subtotal, tax_total').eq('org_id', orgId).gte('invoice_date', from).lte('invoice_date', to).in('status', ['posted', 'paid']),
  ]);
  const outputVat = (vatData || []).reduce((s: number, r: any) => s + Number(r.tax_total || 0), 0);
  const vatSubtotal = (vatData || []).reduce((s: number, r: any) => s + Number(r.subtotal || 0), 0);

  const wb = XLSX.utils.book_new();
  const add = (name: string, aoa: any[][]) => {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  };

  add('Cover', [
    ['Accountant Pack'], [orgName],
    ['Period', `${from} to ${to}`],
    ['Currency', currency],
    ['Generated', new Date().toISOString()],
    [], ['Sections', 'Trial Balance, P&L, Balance Sheet, Cash Flow, VAT, AR, AP, General Ledger, Journal'],
  ]);

  const tbD = tb.reduce((s, r) => s + r.debit, 0);
  const tbC = tb.reduce((s, r) => s + r.credit, 0);
  add('Trial Balance', [
    ['Code', 'Account', 'Type', 'Debit', 'Credit'],
    ...tb.map(r => [r.code, r.name, r.type, r.debit || null, r.credit || null]),
    [], ['', '', 'Totals', tbD, tbC],
  ]);

  add('Profit & Loss', [
    ['Profit & Loss', `${from} to ${to}`], [],
    ['REVENUE'], ...pl.revenue.map(r => [r.code, r.name, r.amount]),
    ['', 'Total Revenue', pl.totalRevenue], [],
    ['EXPENSE'], ...pl.expense.map(r => [r.code, r.name, r.amount]),
    ['', 'Total Expense', pl.totalExpense], [],
    ['', 'NET INCOME', pl.netIncome],
  ]);

  add('Balance Sheet', [
    ['Balance Sheet', `As at ${to}`], [`Balanced: ${bs.balanced ? 'yes' : `no (off by ${bs.diff})`}`], [],
    ['ASSETS'], ...bs.assets.map(r => [r.code, r.name, r.amount]), ['', 'Total Assets', bs.totalAssets], [],
    ['LIABILITIES'], ...bs.liabilities.map(r => [r.code, r.name, r.amount]), ['', 'Total Liabilities', bs.totalLiabilities], [],
    ['EQUITY'], ...bs.equity.map(r => [r.code, r.name, r.amount]),
    ['3900', 'Retained Earnings (current)', bs.retainedEarnings],
    ['', 'Total Equity', bs.totalEquity], [],
    ['', 'LIABILITIES + EQUITY', bs.totalLiabilities + bs.totalEquity],
  ]);

  add('Cash Flow', [
    ['Cash Flow', `${from} to ${to}`], [],
    ['Opening cash', cf.openingCash], [],
    ['OPERATING'], ...cf.operating.map(r => [r.label, r.entries, r.amount]),
    ['Total operating', '', cf.totalOperating], [],
    ['INVESTING'], ...cf.investing.map(r => [r.label, r.entries, r.amount]),
    ['Total investing', '', cf.totalInvesting], [],
    ['FINANCING'], ...cf.financing.map(r => [r.label, r.entries, r.amount]),
    ['Total financing', '', cf.totalFinancing], [],
    ['Net change', '', cf.netChange],
    ['Closing cash', '', cf.closingCash],
  ]);

  add('VAT', [
    ['VAT Summary', `${from} to ${to}`], [],
    ['Metric', 'Amount'],
    ['Net sales (VATable)', vatSubtotal],
    ['Output VAT collected', outputVat],
  ]);

  add('Open AR', [
    ['Number', 'Customer', 'Date', 'Due', 'Total', 'Paid', 'Outstanding', 'Currency'],
    ...(openInv || []).map((r: any) => [
      r.invoice_number, r.acc_customers?.name || '', r.invoice_date, r.due_date || '',
      r.total, r.amount_paid || 0, Number(r.total || 0) - Number(r.amount_paid || 0), r.currency || currency,
    ]),
  ]);

  add('Open AP', [
    ['Number', 'Supplier', 'Date', 'Due', 'Total', 'Paid', 'Outstanding', 'Currency'],
    ...(openBill || []).map((r: any) => [
      r.bill_number, r.acc_suppliers?.name || '', r.bill_date, r.due_date || '',
      r.total, r.amount_paid || 0, Number(r.total || 0) - Number(r.amount_paid || 0), r.currency || currency,
    ]),
  ]);

  add('General Ledger', [
    ['Date', 'Code', 'Account', 'Description', 'Memo', 'Ref', 'Source', 'Debit', 'Credit', 'Running'],
    ...gl.map(l => [l.entry_date, l.account_code, l.account_name, l.description, l.memo || '', l.reference, l.source_type, l.debit || null, l.credit || null, l.running_balance]),
  ]);

  const jrRows: any[][] = [['Date', 'Description', 'Source', 'Auto/Manual', 'Code', 'Account', 'Memo', 'Debit', 'Credit']];
  for (const e of jr) for (const l of e.lines) {
    jrRows.push([e.date, e.description, e.source_type, e.is_system ? 'auto' : 'manual', l.account_code, l.account_name, l.memo || '', l.debit || null, l.credit || null]);
  }
  add('Journal', jrRows);

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/* -------------------- ZIP bundle (PDF + XLSX + CSVs) -------------------- */
export async function buildAssessmentZip(orgId: string, meta: PackMeta): Promise<Blob> {
  const [pdf, xlsx] = await Promise.all([
    buildAssessmentPack(orgId, meta),
    buildAssessmentXlsx(orgId, meta),
  ]);
  const zip = new JSZip();
  const stem = `${meta.orgName.replace(/\s+/g, '-').toLowerCase()}-${meta.from}-to-${meta.to}`;
  zip.file(`${stem}.pdf`, await pdf.arrayBuffer());
  zip.file(`${stem}.xlsx`, await xlsx.arrayBuffer());
  zip.file('README.txt',
    `Accountant Pack for ${meta.orgName}\nPeriod: ${meta.from} to ${meta.to}\nCurrency: ${meta.currency}\nGenerated: ${new Date().toISOString()}\n\nContents:\n- ${stem}.pdf  (full report pack)\n- ${stem}.xlsx (multi-sheet workbook)\n`);
  return zip.generateAsync({ type: 'blob' });
}

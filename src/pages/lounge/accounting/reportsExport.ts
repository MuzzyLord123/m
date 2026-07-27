// Export layer — PDF (jsPDF + autoTable), XLSX (SheetJS), CSV, ZIP bundle.
// All exports are pure client-side and read from already-computed report objects.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import type { TrialBalanceRow, GeneralLedgerLine, JournalReportEntry, PLReport, BSReport, CFReport } from './reportsData';
import type { AgedReport, VatSummary, FaRegister } from './reportsExtra';

const fmtMoney = (n: number, cur = 'GBP') =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur, minimumFractionDigits: 2 }).format(Number(n || 0));
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB');
const today = () => new Date().toISOString().slice(0, 10);

interface Meta { orgName: string; currency: string; period?: string; asOf?: string; }

/* =================== PDF core =================== */
function newPdf(title: string, meta: Meta) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text(title, 40, 46);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(90);
  doc.text(meta.orgName, 40, 62);
  const sub = meta.asOf ? `As at ${fmtDate(meta.asOf)}` : meta.period ? meta.period : '';
  if (sub) doc.text(sub, 40, 76);
  doc.setTextColor(140); doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleString('en-GB')}`, 555, 46, { align: 'right' });
  doc.setTextColor(0);
  return doc;
}

function pdfFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(140);
    doc.text(`Page ${i} of ${pages}`, 555, 820, { align: 'right' });
    doc.text('Quooro Accounting', 40, 820);
    doc.setTextColor(0);
  }
}

/* =================== Trial Balance =================== */
export function exportTrialBalancePDF(rows: TrialBalanceRow[], meta: Meta) {
  const doc = newPdf('Trial Balance', meta);
  const totalD = rows.reduce((s, r) => s + r.debit, 0);
  const totalC = rows.reduce((s, r) => s + r.credit, 0);
  autoTable(doc, {
    startY: 92,
    head: [['Code', 'Account', 'Type', 'Debit', 'Credit']],
    body: rows.map(r => [r.code, r.name, r.type, r.debit ? fmtMoney(r.debit, meta.currency) : '', r.credit ? fmtMoney(r.credit, meta.currency) : '']),
    foot: [['', '', 'Totals', fmtMoney(totalD, meta.currency), fmtMoney(totalC, meta.currency)]],
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontSize: 9 },
    footStyles: { fillColor: [240, 240, 245], textColor: 0, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
  });
  pdfFooter(doc);
  doc.save(`trial-balance-${meta.asOf || today()}.pdf`);
}
export function exportTrialBalanceXLSX(rows: TrialBalanceRow[], meta: Meta) {
  const totalD = rows.reduce((s, r) => s + r.debit, 0);
  const totalC = rows.reduce((s, r) => s + r.credit, 0);
  const data = [
    ['Trial Balance'], [meta.orgName], [`As at ${fmtDate(meta.asOf || today())}`], [],
    ['Code', 'Account', 'Type', 'Debit', 'Credit'],
    ...rows.map(r => [r.code, r.name, r.type, r.debit || null, r.credit || null]),
    [], ['', '', 'Totals', totalD, totalC],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 8 }, { wch: 38 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance');
  XLSX.writeFile(wb, `trial-balance-${meta.asOf || today()}.xlsx`);
}

/* =================== P&L =================== */
export function exportPLPDF(pl: PLReport, meta: Meta) {
  const doc = newPdf('Profit & Loss', { ...meta, period: `${fmtDate(pl.from)} – ${fmtDate(pl.to)}` });
  autoTable(doc, {
    startY: 92,
    head: [['Revenue', '', 'Amount']],
    body: pl.revenue.map(r => [r.code, r.name, fmtMoney(r.amount, meta.currency)]),
    foot: [['', 'Total Revenue', fmtMoney(pl.totalRevenue, meta.currency)]],
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    columnStyles: { 2: { halign: 'right' } },
  });
  autoTable(doc, {
    head: [['Expense', '', 'Amount']],
    body: pl.expense.map(r => [r.code, r.name, fmtMoney(r.amount, meta.currency)]),
    foot: [['', 'Total Expense', fmtMoney(pl.totalExpense, meta.currency)],
           ['', 'Net Income', fmtMoney(pl.netIncome, meta.currency)]],
    headStyles: { fillColor: [239, 68, 68], textColor: 255 },
    footStyles: { fillColor: [30, 30, 40], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' } },
  });
  pdfFooter(doc);
  doc.save(`profit-loss-${pl.from}-to-${pl.to}.pdf`);
}
export function exportPLXLSX(pl: PLReport, meta: Meta) {
  const data: any[][] = [
    ['Profit & Loss'], [meta.orgName], [`${fmtDate(pl.from)} – ${fmtDate(pl.to)}`], [],
    ['REVENUE'],
    ...pl.revenue.map(r => [r.code, r.name, r.amount]),
    ['', 'Total Revenue', pl.totalRevenue], [],
    ['EXPENSE'],
    ...pl.expense.map(r => [r.code, r.name, r.amount]),
    ['', 'Total Expense', pl.totalExpense], [],
    ['', 'NET INCOME', pl.netIncome],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 16 }];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'P&L');
  XLSX.writeFile(wb, `profit-loss-${pl.from}-to-${pl.to}.xlsx`);
}

/* =================== Balance Sheet =================== */
export function exportBSPDF(bs: BSReport, meta: Meta) {
  const doc = newPdf('Balance Sheet', { ...meta, asOf: bs.asOf });
  autoTable(doc, {
    startY: 92,
    head: [['Assets', '', 'Amount']],
    body: bs.assets.map(r => [r.code, r.name, fmtMoney(r.amount, meta.currency)]),
    foot: [['', 'Total Assets', fmtMoney(bs.totalAssets, meta.currency)]],
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    columnStyles: { 2: { halign: 'right' } },
  });
  autoTable(doc, {
    head: [['Liabilities', '', 'Amount']],
    body: bs.liabilities.map(r => [r.code, r.name, fmtMoney(r.amount, meta.currency)]),
    foot: [['', 'Total Liabilities', fmtMoney(bs.totalLiabilities, meta.currency)]],
    headStyles: { fillColor: [245, 158, 11], textColor: 255 },
    columnStyles: { 2: { halign: 'right' } },
  });
  const equityRows = [
    ...bs.equity.map(r => [r.code, r.name, fmtMoney(r.amount, meta.currency)]),
    ['3900', 'Retained Earnings (current)', fmtMoney(bs.retainedEarnings, meta.currency)],
  ];
  autoTable(doc, {
    head: [['Equity', '', 'Amount']],
    body: equityRows,
    foot: [['', 'Total Equity', fmtMoney(bs.totalEquity, meta.currency)],
           ['', 'Liabilities + Equity', fmtMoney(bs.totalLiabilities + bs.totalEquity, meta.currency)]],
    headStyles: { fillColor: [139, 92, 246], textColor: 255 },
    footStyles: { fillColor: [30, 30, 40], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' } },
  });
  pdfFooter(doc);
  doc.save(`balance-sheet-${bs.asOf}.pdf`);
}
export function exportBSXLSX(bs: BSReport, meta: Meta) {
  const data: any[][] = [
    ['Balance Sheet'], [meta.orgName], [`As at ${fmtDate(bs.asOf)}`], [`${bs.balanced ? 'Balanced' : `Off by ${bs.diff}`}`], [],
    ['ASSETS'], ...bs.assets.map(r => [r.code, r.name, r.amount]), ['', 'Total Assets', bs.totalAssets], [],
    ['LIABILITIES'], ...bs.liabilities.map(r => [r.code, r.name, r.amount]), ['', 'Total Liabilities', bs.totalLiabilities], [],
    ['EQUITY'], ...bs.equity.map(r => [r.code, r.name, r.amount]),
    ['3900', 'Retained Earnings (current)', bs.retainedEarnings],
    ['', 'Total Equity', bs.totalEquity], [],
    ['', 'LIABILITIES + EQUITY', bs.totalLiabilities + bs.totalEquity],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 16 }];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet');
  XLSX.writeFile(wb, `balance-sheet-${bs.asOf}.xlsx`);
}

/* =================== Cash Flow =================== */
export function exportCFPDF(cf: CFReport, meta: Meta) {
  const doc = newPdf('Cash Flow Statement', { ...meta, period: `${fmtDate(cf.from)} – ${fmtDate(cf.to)}` });
  const section = (label: string, rows: any[], total: number, color: [number, number, number]) => {
    autoTable(doc, {
      head: [[label, '#', 'Amount']],
      body: rows.map(r => [r.label, r.entries, fmtMoney(r.amount, meta.currency)]),
      foot: [['Subtotal', '', fmtMoney(total, meta.currency)]],
      headStyles: { fillColor: color, textColor: 255 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    });
  };
  autoTable(doc, { startY: 92, body: [['Opening cash', fmtMoney(cf.openingCash, meta.currency)]],
    columnStyles: { 1: { halign: 'right' } } });
  section('Operating activities', cf.operating, cf.totalOperating, [59, 130, 246]);
  section('Investing activities', cf.investing, cf.totalInvesting, [139, 92, 246]);
  section('Financing activities', cf.financing, cf.totalFinancing, [245, 158, 11]);
  autoTable(doc, {
    body: [['Net change in cash', fmtMoney(cf.netChange, meta.currency)],
           ['Closing cash', fmtMoney(cf.closingCash, meta.currency)]],
    bodyStyles: { fontStyle: 'bold' }, columnStyles: { 1: { halign: 'right' } },
  });
  pdfFooter(doc);
  doc.save(`cash-flow-${cf.from}-to-${cf.to}.pdf`);
}
export function exportCFXLSX(cf: CFReport, meta: Meta) {
  const data: any[][] = [
    ['Cash Flow Statement'], [meta.orgName], [`${fmtDate(cf.from)} – ${fmtDate(cf.to)}`], [],
    ['Opening cash', cf.openingCash], [],
    ['OPERATING'], ...cf.operating.map(r => [r.label, r.entries, r.amount]), ['Total operating', '', cf.totalOperating], [],
    ['INVESTING'], ...cf.investing.map(r => [r.label, r.entries, r.amount]), ['Total investing', '', cf.totalInvesting], [],
    ['FINANCING'], ...cf.financing.map(r => [r.label, r.entries, r.amount]), ['Total financing', '', cf.totalFinancing], [],
    ['Net change', '', cf.netChange],
    ['Closing cash', '', cf.closingCash],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 16 }];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Cash Flow');
  XLSX.writeFile(wb, `cash-flow-${cf.from}-to-${cf.to}.xlsx`);
}

/* =================== Aged AR/AP =================== */
export function exportAgedPDF(kind: 'ar' | 'ap', rep: AgedReport, meta: Meta) {
  const title = kind === 'ar' ? 'Aged Receivables' : 'Aged Payables';
  const partyLabel = kind === 'ar' ? 'Customer' : 'Supplier';
  const docLabel = kind === 'ar' ? 'Invoice' : 'Bill';
  const doc = newPdf(title, { ...meta, asOf: rep.asOf });
  const bOrder: any[] = ['current', '1-30', '31-60', '61-90', '90+'];
  autoTable(doc, {
    startY: 92,
    head: [bOrder.map(b => b === 'current' ? 'Current' : `${b} days`)],
    body: [bOrder.map(b => fmtMoney((rep.buckets as any)[b], meta.currency))],
    headStyles: { fillColor: [30, 30, 40], textColor: 255 },
    bodyStyles: { halign: 'right' },
  });
  autoTable(doc, {
    head: [[partyLabel, `${docLabel} #`, 'Date', 'Due', 'Bucket', 'Total', 'Paid', 'Outstanding']],
    body: rep.rows.map(r => [
      r.party_name, r.document_number, fmtDate(r.document_date),
      r.due_date ? fmtDate(r.due_date) : '—',
      r.bucket === 'current' ? 'current' : `${r.bucket} · ${r.days_overdue}d`,
      fmtMoney(r.total, r.currency), fmtMoney(r.paid, r.currency), fmtMoney(r.outstanding, r.currency),
    ]),
    foot: [['', '', '', '', '', '', 'Total', fmtMoney(rep.totalOutstanding, meta.currency)]],
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontSize: 9 },
    footStyles: { fillColor: [240, 240, 245], textColor: 0, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
  });
  pdfFooter(doc);
  doc.save(`aged-${kind}-${rep.asOf}.pdf`);
}
export function exportAgedXLSX(kind: 'ar' | 'ap', rep: AgedReport, meta: Meta) {
  const partyLabel = kind === 'ar' ? 'Customer' : 'Supplier';
  const docLabel = kind === 'ar' ? 'Invoice' : 'Bill';
  const data: any[][] = [
    [kind === 'ar' ? 'Aged Receivables' : 'Aged Payables'],
    [meta.orgName], [`As at ${fmtDate(rep.asOf)}`], [],
    ['Bucket', 'Amount'],
    ...(['current', '1-30', '31-60', '61-90', '90+'] as const).map(b => [b, (rep.buckets as any)[b]]),
    [], [partyLabel, `${docLabel} #`, 'Date', 'Due', 'Bucket', 'Days overdue', 'Total', 'Paid', 'Outstanding'],
    ...rep.rows.map(r => [r.party_name, r.document_number, r.document_date, r.due_date || '', r.bucket, r.days_overdue, r.total, r.paid, r.outstanding]),
    [], ['', '', '', '', '', '', '', 'Total outstanding', rep.totalOutstanding],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, kind.toUpperCase());
  XLSX.writeFile(wb, `aged-${kind}-${rep.asOf}.xlsx`);
}

/* =================== General Ledger =================== */
export function exportGLPDF(lines: GeneralLedgerLine[], meta: Meta, from: string, to: string) {
  const doc = newPdf('General Ledger', { ...meta, period: `${fmtDate(from)} – ${fmtDate(to)}` });
  autoTable(doc, {
    startY: 92,
    head: [['Date', 'Account', 'Description', 'Ref', 'Source', 'Debit', 'Credit', 'Running']],
    body: lines.map(l => [
      fmtDate(l.entry_date), `${l.account_code} ${l.account_name}`, l.description || '', l.reference,
      l.source_type, l.debit ? fmtMoney(l.debit, meta.currency) : '', l.credit ? fmtMoney(l.credit, meta.currency) : '',
      fmtMoney(l.running_balance, meta.currency),
    ]),
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
  });
  pdfFooter(doc);
  doc.save(`general-ledger-${from}-to-${to}.pdf`);
}
export function exportGLXLSX(lines: GeneralLedgerLine[], meta: Meta, from: string, to: string) {
  const rows = lines.map(l => ({
    Date: l.entry_date, 'Account Code': l.account_code, Account: l.account_name,
    Description: l.description, Memo: l.memo || '', Ref: l.reference, Source: l.source_type,
    Debit: l.debit || null, Credit: l.credit || null, Running: l.running_balance,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'General Ledger');
  XLSX.writeFile(wb, `general-ledger-${from}-to-${to}.xlsx`);
}

/* =================== Journal Report =================== */
export function exportJournalPDF(entries: JournalReportEntry[], meta: Meta, from: string, to: string) {
  const doc = newPdf('Journal Report', { ...meta, period: `${fmtDate(from)} – ${fmtDate(to)}` });
  const body: any[] = [];
  for (const e of entries) {
    body.push([{ content: `${fmtDate(e.date)} · ${e.description} · ${e.is_system ? 'AUTO' : 'MANUAL'} · ${e.source_type}`, colSpan: 4, styles: { fillColor: [245, 245, 250], fontStyle: 'bold' } }]);
    for (const l of e.lines) body.push([`${l.account_code} ${l.account_name}`, l.memo || '', l.debit ? fmtMoney(l.debit, meta.currency) : '', l.credit ? fmtMoney(l.credit, meta.currency) : '']);
    body.push([{ content: 'Totals', styles: { fontStyle: 'bold' } }, '', { content: fmtMoney(e.total_debit, meta.currency), styles: { fontStyle: 'bold', halign: 'right' } }, { content: fmtMoney(e.total_credit, meta.currency), styles: { fontStyle: 'bold', halign: 'right' } }]);
  }
  autoTable(doc, {
    startY: 92, head: [['Account', 'Memo', 'Debit', 'Credit']], body,
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
  });
  pdfFooter(doc);
  doc.save(`journal-${from}-to-${to}.pdf`);
}
export function exportJournalXLSX(entries: JournalReportEntry[], meta: Meta, from: string, to: string) {
  const rows: any[][] = [['Entry Date', 'Description', 'Source', 'Type', 'Account Code', 'Account', 'Memo', 'Debit', 'Credit']];
  for (const e of entries) {
    for (const l of e.lines) rows.push([e.date, e.description, e.source_type, e.is_system ? 'auto' : 'manual', l.account_code, l.account_name, l.memo || '', l.debit || null, l.credit || null]);
  }
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Journal');
  XLSX.writeFile(wb, `journal-${from}-to-${to}.xlsx`);
}

/* =================== VAT =================== */
export function exportVatPDF(v: VatSummary, meta: Meta) {
  const doc = newPdf('VAT Summary', meta);
  autoTable(doc, {
    startY: 92,
    body: [
      ['Live output VAT (since last filed period)', fmtMoney(v.outstandingOutputVat, meta.currency)],
      ['Live input VAT (since last filed period)', fmtMoney(v.outstandingInputVat, meta.currency)],
      ['Live net due', fmtMoney(v.liveNet, meta.currency)],
      ['Total paid on filed returns', fmtMoney(v.totalPaid, meta.currency)],
    ],
    columnStyles: { 1: { halign: 'right' } },
  });
  autoTable(doc, {
    head: [['Period', 'Status', 'Reference', 'Output VAT', 'Input VAT', 'Net due', 'Paid']],
    body: v.returns.map(r => [
      `${fmtDate(r.period_start)} – ${fmtDate(r.period_end)}`, r.status, r.reference || '',
      fmtMoney(r.output_vat, meta.currency), fmtMoney(r.input_vat, meta.currency),
      fmtMoney(r.net_due, meta.currency), r.payment_amount ? fmtMoney(r.payment_amount, meta.currency) : '—',
    ]),
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
  });
  pdfFooter(doc);
  doc.save(`vat-summary-${today()}.pdf`);
}
export function exportVatXLSX(v: VatSummary, meta: Meta) {
  const data: any[][] = [
    ['VAT Summary'], [meta.orgName], [],
    ['Live output VAT', v.outstandingOutputVat],
    ['Live input VAT', v.outstandingInputVat],
    ['Live net due', v.liveNet],
    ['Total paid', v.totalPaid], [],
    ['Period start', 'Period end', 'Status', 'Reference', 'Output VAT', 'Input VAT', 'Net due', 'Paid', 'Payment date'],
    ...v.returns.map(r => [r.period_start, r.period_end, r.status, r.reference || '', r.output_vat, r.input_vat, r.net_due, r.payment_amount || null, r.payment_date || '']),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'VAT');
  XLSX.writeFile(wb, `vat-summary-${today()}.xlsx`);
}

/* =================== Fixed Assets =================== */
export function exportFaPDF(fa: FaRegister, meta: Meta) {
  const doc = newPdf('Fixed-asset Register', meta);
  autoTable(doc, {
    startY: 92,
    body: [
      ['Total cost (active)', fmtMoney(fa.totalCost, meta.currency)],
      ['Accumulated depreciation', fmtMoney(fa.totalAccumDepr, meta.currency)],
      ['Net book value', fmtMoney(fa.totalNbv, meta.currency)],
      ['Disposal proceeds', fmtMoney(fa.totalDisposed, meta.currency)],
    ],
    columnStyles: { 1: { halign: 'right' } },
  });
  autoTable(doc, {
    head: [['Tag', 'Asset', 'Category', 'Method', 'Purchased', 'Cost', 'Accum. Depr.', 'NBV', 'Status']],
    body: fa.rows.map(r => [
      r.asset_tag || '—', r.name, r.category || '—', r.method, fmtDate(r.purchase_date),
      fmtMoney(r.purchase_cost, meta.currency), fmtMoney(r.accumulated_depreciation, meta.currency),
      fmtMoney(r.net_book_value, meta.currency), r.status,
    ]),
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } },
  });
  pdfFooter(doc);
  doc.save(`fixed-assets-${today()}.pdf`);
}
export function exportFaXLSX(fa: FaRegister, meta: Meta) {
  const rows = fa.rows.map(r => ({
    Tag: r.asset_tag || '', Asset: r.name, Category: r.category || '',
    Method: r.method, Purchased: r.purchase_date,
    Cost: r.purchase_cost, Salvage: r.salvage_value,
    'Useful life (months)': r.useful_life_months,
    'Accum. Depr.': r.accumulated_depreciation, NBV: r.net_book_value,
    Status: r.status, 'Disposal date': r.disposal_date || '',
    'Disposal proceeds': r.disposal_proceeds || null,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Fixed Assets');
  XLSX.writeFile(wb, `fixed-assets-${today()}.xlsx`);
}

/* =================== Generic CSV =================== */
export function exportCSV(filename: string, rows: any[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/* =================== ZIP bundle (all reports) =================== */
export async function exportZipBundle(bundle: {
  meta: Meta;
  pl?: PLReport; bs?: BSReport; cf?: CFReport;
  tb?: TrialBalanceRow[]; ar?: AgedReport; ap?: AgedReport;
  vat?: VatSummary; fa?: FaRegister;
}) {
  const zip = new JSZip();
  const stamp = today();
  const meta = bundle.meta;
  const addXlsx = (name: string, wb: XLSX.WorkBook) => {
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    zip.file(name, buf);
  };
  const wbFromAoA = (title: string, data: any[][]) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), title);
    return wb;
  };
  if (bundle.pl) addXlsx(`profit-loss-${bundle.pl.from}-to-${bundle.pl.to}.xlsx`,
    wbFromAoA('P&L', [
      ['Profit & Loss'], [meta.orgName], [`${fmtDate(bundle.pl.from)} – ${fmtDate(bundle.pl.to)}`], [],
      ['REVENUE'], ...bundle.pl.revenue.map(r => [r.code, r.name, r.amount]), ['', 'Total', bundle.pl.totalRevenue], [],
      ['EXPENSE'], ...bundle.pl.expense.map(r => [r.code, r.name, r.amount]), ['', 'Total', bundle.pl.totalExpense], [],
      ['', 'NET INCOME', bundle.pl.netIncome],
    ]));
  if (bundle.bs) addXlsx(`balance-sheet-${bundle.bs.asOf}.xlsx`,
    wbFromAoA('BS', [
      ['Balance Sheet'], [meta.orgName], [`As at ${fmtDate(bundle.bs.asOf)}`], [],
      ['ASSETS'], ...bundle.bs.assets.map(r => [r.code, r.name, r.amount]), ['', 'Total', bundle.bs.totalAssets], [],
      ['LIABILITIES'], ...bundle.bs.liabilities.map(r => [r.code, r.name, r.amount]), ['', 'Total', bundle.bs.totalLiabilities], [],
      ['EQUITY'], ...bundle.bs.equity.map(r => [r.code, r.name, r.amount]),
      ['3900', 'Retained Earnings', bundle.bs.retainedEarnings], ['', 'Total', bundle.bs.totalEquity],
    ]));
  if (bundle.cf) addXlsx(`cash-flow-${bundle.cf.from}-to-${bundle.cf.to}.xlsx`,
    wbFromAoA('CF', [
      ['Cash Flow'], [meta.orgName], [`${fmtDate(bundle.cf.from)} – ${fmtDate(bundle.cf.to)}`], [],
      ['Opening cash', bundle.cf.openingCash], [],
      ['OPERATING'], ...bundle.cf.operating.map(r => [r.label, r.amount]), ['Total', bundle.cf.totalOperating], [],
      ['INVESTING'], ...bundle.cf.investing.map(r => [r.label, r.amount]), ['Total', bundle.cf.totalInvesting], [],
      ['FINANCING'], ...bundle.cf.financing.map(r => [r.label, r.amount]), ['Total', bundle.cf.totalFinancing], [],
      ['Net change', bundle.cf.netChange], ['Closing cash', bundle.cf.closingCash],
    ]));
  if (bundle.tb) addXlsx(`trial-balance-${stamp}.xlsx`,
    wbFromAoA('TB', [
      ['Trial Balance'], [meta.orgName], [],
      ['Code', 'Account', 'Type', 'Debit', 'Credit'],
      ...bundle.tb.map(r => [r.code, r.name, r.type, r.debit || null, r.credit || null]),
    ]));
  if (bundle.ar) addXlsx(`aged-ar-${bundle.ar.asOf}.xlsx`,
    wbFromAoA('AR', [
      ['Aged Receivables'], [meta.orgName], [`As at ${fmtDate(bundle.ar.asOf)}`], [],
      ['Customer', 'Invoice #', 'Date', 'Due', 'Bucket', 'Days', 'Total', 'Paid', 'Outstanding'],
      ...bundle.ar.rows.map(r => [r.party_name, r.document_number, r.document_date, r.due_date || '', r.bucket, r.days_overdue, r.total, r.paid, r.outstanding]),
    ]));
  if (bundle.ap) addXlsx(`aged-ap-${bundle.ap.asOf}.xlsx`,
    wbFromAoA('AP', [
      ['Aged Payables'], [meta.orgName], [`As at ${fmtDate(bundle.ap.asOf)}`], [],
      ['Supplier', 'Bill #', 'Date', 'Due', 'Bucket', 'Days', 'Total', 'Paid', 'Outstanding'],
      ...bundle.ap.rows.map(r => [r.party_name, r.document_number, r.document_date, r.due_date || '', r.bucket, r.days_overdue, r.total, r.paid, r.outstanding]),
    ]));
  if (bundle.vat) addXlsx(`vat-summary-${stamp}.xlsx`,
    wbFromAoA('VAT', [
      ['VAT Summary'], [meta.orgName], [],
      ['Live output VAT', bundle.vat.outstandingOutputVat],
      ['Live input VAT', bundle.vat.outstandingInputVat],
      ['Live net', bundle.vat.liveNet], [],
      ['Period start', 'Period end', 'Status', 'Reference', 'Output VAT', 'Input VAT', 'Net due', 'Paid'],
      ...bundle.vat.returns.map(r => [r.period_start, r.period_end, r.status, r.reference || '', r.output_vat, r.input_vat, r.net_due, r.payment_amount || null]),
    ]));
  if (bundle.fa) addXlsx(`fixed-assets-${stamp}.xlsx`,
    wbFromAoA('FA', [
      ['Fixed-asset Register'], [meta.orgName], [],
      ['Tag', 'Asset', 'Category', 'Method', 'Purchased', 'Cost', 'Accum. Depr.', 'NBV', 'Status'],
      ...bundle.fa.rows.map(r => [r.asset_tag || '', r.name, r.category || '', r.method, r.purchase_date, r.purchase_cost, r.accumulated_depreciation, r.net_book_value, r.status]),
    ]));
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${meta.orgName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-reports-${stamp}.zip`);
}

// Live report computations — reads directly from the ledger.
// No caching. Same inputs => same outputs, always.
import { supabase } from '@/integrations/supabase/client';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface AccountRow {
  id: string; code: string; name: string; type: AccountType; subtype: string | null;
}
export interface JournalEntryRow {
  id: string; entry_date: string; description: string | null; source_type: string;
  source_id: string | null; posted_at: string | null; is_reversal: boolean; created_by: string;
}
export interface JournalLineRow {
  id: string; journal_entry_id: string; account_id: string;
  debit: number; credit: number; memo: string | null; tax_code: string | null;
}

export interface LedgerSnapshot {
  accounts: AccountRow[];
  entries: JournalEntryRow[];
  lines: JournalLineRow[];
}

/** Fetch all posted journal entries + lines up to and including `asOf` (inclusive). */
export async function fetchLedger(orgId: string, asOf: string): Promise<LedgerSnapshot> {
  const [{ data: accounts }, { data: entries }] = await Promise.all([
    (supabase as any).from('acc_chart_of_accounts')
      .select('id, code, name, type, subtype')
      .eq('org_id', orgId).order('code'),
    (supabase as any).from('acc_journal_entries')
      .select('id, entry_date, description, source_type, source_id, posted_at, is_reversal, created_by')
      .eq('org_id', orgId)
      .not('posted_at', 'is', null)
      .lte('entry_date', asOf)
      .order('entry_date', { ascending: true }),
  ]);
  const entryIds = (entries || []).map((e: any) => e.id);
  let lines: JournalLineRow[] = [];
  if (entryIds.length) {
    // chunk to avoid huge IN() lists
    const chunkSize = 300;
    for (let i = 0; i < entryIds.length; i += chunkSize) {
      const chunk = entryIds.slice(i, i + chunkSize);
      const { data: chunkLines } = await (supabase as any).from('acc_journal_lines')
        .select('id, journal_entry_id, account_id, debit, credit, memo, tax_code')
        .in('journal_entry_id', chunk);
      if (chunkLines) lines = lines.concat(chunkLines);
    }
  }
  return { accounts: accounts || [], entries: entries || [], lines };
}

export interface TrialBalanceRow {
  account_id: string; code: string; name: string; type: AccountType;
  debit: number; credit: number; net: number;
}

/** Compute trial balance from a snapshot. Balances net to zero. */
export function computeTrialBalance(snap: LedgerSnapshot): TrialBalanceRow[] {
  const byAcc = new Map<string, { debit: number; credit: number }>();
  for (const l of snap.lines) {
    const cur = byAcc.get(l.account_id) || { debit: 0, credit: 0 };
    cur.debit += Number(l.debit || 0);
    cur.credit += Number(l.credit || 0);
    byAcc.set(l.account_id, cur);
  }
  const rows: TrialBalanceRow[] = [];
  for (const a of snap.accounts) {
    const t = byAcc.get(a.id) || { debit: 0, credit: 0 };
    const net = t.debit - t.credit;
    if (Math.abs(net) < 0.005 && t.debit === 0 && t.credit === 0) continue;
    rows.push({
      account_id: a.id, code: a.code, name: a.name, type: a.type,
      debit: net > 0 ? net : 0,
      credit: net < 0 ? -net : 0,
      net,
    });
  }
  rows.sort((a, b) => a.code.localeCompare(b.code));
  return rows;
}

export interface GeneralLedgerLine {
  entry_id: string;
  entry_date: string;
  account_id: string;
  account_code: string;
  account_name: string;
  description: string;
  memo: string | null;
  source_type: string;
  debit: number;
  credit: number;
  running_balance: number;
  reference: string;
}

/** General Ledger: every line, per account, with running balance. */
export function computeGeneralLedger(
  snap: LedgerSnapshot,
  opts?: { accountIds?: string[]; from?: string; to?: string; sourceTypes?: string[] },
): GeneralLedgerLine[] {
  const accById = new Map(snap.accounts.map(a => [a.id, a]));
  const entryById = new Map(snap.entries.map(e => [e.id, e]));

  const filtered = snap.lines.filter(l => {
    const e = entryById.get(l.journal_entry_id);
    if (!e) return false;
    if (opts?.from && e.entry_date < opts.from) return false;
    if (opts?.to && e.entry_date > opts.to) return false;
    if (opts?.accountIds?.length && !opts.accountIds.includes(l.account_id)) return false;
    if (opts?.sourceTypes?.length && !opts.sourceTypes.includes(e.source_type)) return false;
    return true;
  });

  // sort: account, then date, then entry id for stable order
  filtered.sort((a, b) => {
    const ea = entryById.get(a.journal_entry_id)!;
    const eb = entryById.get(b.journal_entry_id)!;
    const acA = accById.get(a.account_id)?.code || '';
    const acB = accById.get(b.account_id)?.code || '';
    if (acA !== acB) return acA.localeCompare(acB);
    if (ea.entry_date !== eb.entry_date) return ea.entry_date.localeCompare(eb.entry_date);
    return a.journal_entry_id.localeCompare(b.journal_entry_id);
  });

  const out: GeneralLedgerLine[] = [];
  let currentAccount = '';
  let running = 0;
  for (const l of filtered) {
    const e = entryById.get(l.journal_entry_id)!;
    const a = accById.get(l.account_id);
    if (!a) continue;
    if (a.id !== currentAccount) { running = 0; currentAccount = a.id; }
    running += Number(l.debit || 0) - Number(l.credit || 0);
    out.push({
      entry_id: e.id,
      entry_date: e.entry_date,
      account_id: a.id,
      account_code: a.code,
      account_name: a.name,
      description: e.description || '',
      memo: l.memo,
      source_type: e.source_type,
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
      running_balance: running,
      reference: e.source_id ? e.source_id.slice(0, 8) : e.id.slice(0, 8),
    });
  }
  return out;
}

export interface JournalReportEntry {
  id: string;
  date: string;
  description: string;
  source_type: string;
  is_system: boolean;
  lines: Array<{
    account_code: string; account_name: string;
    debit: number; credit: number; memo: string | null;
  }>;
  total_debit: number;
  total_credit: number;
}

/** Journal Report: chronological. Auto vs manual flag driven by source_type. */
export function computeJournalReport(
  snap: LedgerSnapshot,
  opts?: { from?: string; to?: string; sourceTypes?: string[] },
): JournalReportEntry[] {
  const accById = new Map(snap.accounts.map(a => [a.id, a]));
  const linesByEntry = new Map<string, JournalLineRow[]>();
  for (const l of snap.lines) {
    const arr = linesByEntry.get(l.journal_entry_id) || [];
    arr.push(l);
    linesByEntry.set(l.journal_entry_id, arr);
  }
  const entries = snap.entries.filter(e => {
    if (opts?.from && e.entry_date < opts.from) return false;
    if (opts?.to && e.entry_date > opts.to) return false;
    if (opts?.sourceTypes?.length && !opts.sourceTypes.includes(e.source_type)) return false;
    return true;
  });
  entries.sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.id.localeCompare(b.id));
  return entries.map(e => {
    const raw = linesByEntry.get(e.id) || [];
    const lines = raw.map(l => {
      const a = accById.get(l.account_id);
      return {
        account_code: a?.code || '',
        account_name: a?.name || '(unknown)',
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        memo: l.memo,
      };
    });
    return {
      id: e.id,
      date: e.entry_date,
      description: e.description || '',
      source_type: e.source_type,
      is_system: e.source_type !== 'manual',
      lines,
      total_debit: lines.reduce((s, l) => s + l.debit, 0),
      total_credit: lines.reduce((s, l) => s + l.credit, 0),
    };
  });
}

/* =================== Profit & Loss =================== */
export interface PLRow { account_id: string; code: string; name: string; subtype: string | null; amount: number; }
export interface PLReport {
  revenue: PLRow[]; expense: PLRow[];
  totalRevenue: number; totalExpense: number; netIncome: number;
  from: string; to: string;
}

export function computeProfitAndLoss(snap: LedgerSnapshot, from: string, to: string): PLReport {
  const entryById = new Map(snap.entries.map(e => [e.id, e]));
  const accById = new Map(snap.accounts.map(a => [a.id, a]));
  const totals = new Map<string, number>();
  for (const l of snap.lines) {
    const e = entryById.get(l.journal_entry_id); if (!e) continue;
    if (e.entry_date < from || e.entry_date > to) continue;
    const a = accById.get(l.account_id); if (!a) continue;
    const debit = Number(l.debit || 0), credit = Number(l.credit || 0);
    let delta = 0;
    if (a.type === 'revenue') delta = credit - debit;
    else if (a.type === 'expense') delta = debit - credit;
    else continue;
    totals.set(a.id, (totals.get(a.id) || 0) + delta);
  }
  const revenue: PLRow[] = [], expense: PLRow[] = [];
  for (const a of snap.accounts) {
    const amt = totals.get(a.id) || 0;
    if (Math.abs(amt) < 0.005) continue;
    const row: PLRow = { account_id: a.id, code: a.code, name: a.name, subtype: a.subtype, amount: amt };
    if (a.type === 'revenue') revenue.push(row);
    else if (a.type === 'expense') expense.push(row);
  }
  revenue.sort((a, b) => a.code.localeCompare(b.code));
  expense.sort((a, b) => a.code.localeCompare(b.code));
  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expense.reduce((s, r) => s + r.amount, 0);
  return { revenue, expense, totalRevenue, totalExpense, netIncome: totalRevenue - totalExpense, from, to };
}

/* =================== Balance Sheet =================== */
export interface BSRow { account_id: string; code: string; name: string; subtype: string | null; amount: number; }
export interface BSReport {
  assets: BSRow[]; liabilities: BSRow[]; equity: BSRow[];
  totalAssets: number; totalLiabilities: number; totalEquity: number;
  retainedEarnings: number;
  balanced: boolean; diff: number;
  asOf: string;
}

export function computeBalanceSheet(snap: LedgerSnapshot, asOf: string): BSReport {
  const accById = new Map(snap.accounts.map(a => [a.id, a]));
  const totals = new Map<string, number>();
  let retained = 0;
  for (const l of snap.lines) {
    const a = accById.get(l.account_id); if (!a) continue;
    const debit = Number(l.debit || 0), credit = Number(l.credit || 0);
    if (a.type === 'asset') totals.set(a.id, (totals.get(a.id) || 0) + (debit - credit));
    else if (a.type === 'liability' || a.type === 'equity') totals.set(a.id, (totals.get(a.id) || 0) + (credit - debit));
    else if (a.type === 'revenue') retained += credit - debit;
    else if (a.type === 'expense') retained -= (debit - credit);
  }
  const assets: BSRow[] = [], liabilities: BSRow[] = [], equity: BSRow[] = [];
  for (const a of snap.accounts) {
    const amt = totals.get(a.id) || 0;
    if (Math.abs(amt) < 0.005) continue;
    const row: BSRow = { account_id: a.id, code: a.code, name: a.name, subtype: a.subtype, amount: amt };
    if (a.type === 'asset') assets.push(row);
    else if (a.type === 'liability') liabilities.push(row);
    else if (a.type === 'equity') equity.push(row);
  }
  [assets, liabilities, equity].forEach(l => l.sort((a, b) => a.code.localeCompare(b.code)));
  const totalAssets = assets.reduce((s, r) => s + r.amount, 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + r.amount, 0);
  const totalEquity = equity.reduce((s, r) => s + r.amount, 0) + retained;
  const diff = totalAssets - (totalLiabilities + totalEquity);
  return {
    assets, liabilities, equity,
    totalAssets, totalLiabilities, totalEquity,
    retainedEarnings: retained, balanced: Math.abs(diff) < 0.01, diff, asOf,
  };
}

/* =================== Cash Flow =================== */
export interface CFBucket { label: string; amount: number; entries: number; }
export interface CFReport {
  operating: CFBucket[]; investing: CFBucket[]; financing: CFBucket[];
  totalOperating: number; totalInvesting: number; totalFinancing: number;
  openingCash: number; closingCash: number; netChange: number;
  from: string; to: string;
}

const CF_CLASSIFY: Record<string, 'operating' | 'investing' | 'financing'> = {
  invoice: 'operating', bill: 'operating', ar_payment: 'operating', ap_payment: 'operating',
  bank_txn: 'operating', payroll: 'operating', vat: 'operating', manual: 'operating',
  fixed_asset: 'investing', asset_purchase: 'investing', asset_disposal: 'investing', depreciation: 'operating',
  loan: 'financing', equity: 'financing', dividend: 'financing', fx_reval: 'operating',
};

export function computeCashFlow(snap: LedgerSnapshot, from: string, to: string): CFReport {
  const accById = new Map(snap.accounts.map(a => [a.id, a]));
  const entryById = new Map(snap.entries.map(e => [e.id, e]));
  const isCash = (id: string) => {
    const a = accById.get(id); if (!a) return false;
    if (a.type !== 'asset') return false;
    const sub = (a.subtype || '').toLowerCase();
    const nm = a.name.toLowerCase();
    return sub.includes('bank') || sub.includes('cash') || nm.includes('bank') || nm.includes('cash');
  };
  const buckets: Record<'operating'|'investing'|'financing', Map<string, CFBucket>> = {
    operating: new Map(), investing: new Map(), financing: new Map(),
  };
  let opening = 0, closing = 0;
  for (const l of snap.lines) {
    if (!isCash(l.account_id)) continue;
    const e = entryById.get(l.journal_entry_id); if (!e) continue;
    const delta = Number(l.debit || 0) - Number(l.credit || 0);
    if (e.entry_date < from) { opening += delta; closing += delta; continue; }
    if (e.entry_date > to) continue;
    closing += delta;
    const cat = CF_CLASSIFY[e.source_type] || 'operating';
    const label = e.source_type.replace(/_/g, ' ');
    const cur = buckets[cat].get(label) || { label, amount: 0, entries: 0 };
    cur.amount += delta; cur.entries += 1;
    buckets[cat].set(label, cur);
  }
  const arr = (m: Map<string, CFBucket>) => Array.from(m.values()).sort((a, b) => a.label.localeCompare(b.label));
  const operating = arr(buckets.operating), investing = arr(buckets.investing), financing = arr(buckets.financing);
  const sum = (b: CFBucket[]) => b.reduce((s, r) => s + r.amount, 0);
  return {
    operating, investing, financing,
    totalOperating: sum(operating), totalInvesting: sum(investing), totalFinancing: sum(financing),
    openingCash: opening, closingCash: closing, netChange: closing - opening,
    from, to,
  };
}

export function money(n: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(n || 0));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function firstOfYearISO(): string {
  return `${new Date().getFullYear()}-01-01`;
}

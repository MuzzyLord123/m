import { useEffect, useMemo, useState } from 'react';
import { Scale, ScrollText, BookOpen, Loader2, ChevronRight, ChevronDown, Filter, Calendar, Zap, User, TrendingUp, Building2, Waves, Users, Truck, Receipt, Package, Send } from 'lucide-react';
import SubmitForAssessment from './SubmitForAssessment';
import { logRecalc } from './auditLog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { StatusBadge, SkeletonTable } from '@/components/platform';
import {
  fetchLedger, computeTrialBalance, computeGeneralLedger, computeJournalReport,
  computeProfitAndLoss, computeBalanceSheet, computeCashFlow,
  money, todayISO, firstOfYearISO,
  type LedgerSnapshot, type TrialBalanceRow, type AccountType,
} from './reportsData';
import {
  fetchAgedReceivables, fetchAgedPayables, fetchVatSummary, fetchFixedAssetRegister,
  type AgedReport, type VatSummary, type FaRegister,
} from './reportsExtra';
import {
  exportTrialBalancePDF, exportTrialBalanceXLSX,
  exportPLPDF, exportPLXLSX, exportBSPDF, exportBSXLSX, exportCFPDF, exportCFXLSX,
  exportAgedPDF, exportAgedXLSX, exportGLPDF, exportGLXLSX, exportJournalPDF, exportJournalXLSX,
  exportVatPDF, exportVatXLSX, exportFaPDF, exportFaXLSX, exportCSV, exportZipBundle,
} from './reportsExport';

type ReportKey = 'trial' | 'gl' | 'journal' | 'pl' | 'bs' | 'cf' | 'ar' | 'ap' | 'vat' | 'fa';

const REPORT_TABS: { key: ReportKey; label: string; icon: any; hint: string }[] = [
  { key: 'pl',      label: 'Profit and loss',  icon: TrendingUp, hint: 'Revenue − expense for a period.' },
  { key: 'bs',      label: 'Balance sheet',    icon: Building2,  hint: 'Assets = liabilities + equity, as-of a date.' },
  { key: 'cf',      label: 'Cash flow',        icon: Waves,      hint: 'Cash movements grouped operating / investing / financing.' },
  { key: 'ar',      label: 'Aged receivables', icon: Users,      hint: 'Unpaid customer invoices, bucketed by days overdue.' },
  { key: 'ap',      label: 'Aged payables',    icon: Truck,      hint: 'Unpaid supplier bills, bucketed by days overdue.' },
  { key: 'vat',     label: 'VAT summary',      icon: Receipt,    hint: 'Filed returns + live outstanding VAT since last filing.' },
  { key: 'fa',      label: 'Fixed-asset Register', icon: Package, hint: 'Cost, accumulated depreciation and NBV per asset.' },
  { key: 'trial',   label: 'Trial balance',    icon: Scale,      hint: 'As-of any date. Must net to zero.' },
  { key: 'gl',      label: 'General ledger',   icon: BookOpen,   hint: 'Every transaction, per account, running balance.' },
  { key: 'journal', label: 'Journal report',   icon: ScrollText, hint: 'Chronological entries with all lines.' },
];


interface Props {
  orgId: string;
  orgName: string;
  currency: string;
}

export default function ReportsCentre({ orgId, orgName, currency }: Props) {
  const [report, setReport] = useState<ReportKey>('pl');
  const [asOf, setAsOf] = useState<string>(todayISO());
  const [from, setFrom] = useState<string>(firstOfYearISO());
  const [to, setTo] = useState<string>(todayISO());
  const [snap, setSnap] = useState<LedgerSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [liveTick, setLiveTick] = useState(0);

  // Real-time: bump snapshot whenever the ledger changes.
  useEffect(() => {
    if (!orgId) return;
    const bump = () => setLiveTick(v => v + 1);
    const ch = supabase.channel(`acc-reports-${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acc_journal_entries', filter: `org_id=eq.${orgId}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acc_ar_invoices', filter: `org_id=eq.${orgId}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acc_ap_bills', filter: `org_id=eq.${orgId}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acc_bank_transactions', filter: `org_id=eq.${orgId}` }, bump)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId]);

  const needsLedger = ['pl', 'bs', 'cf', 'trial', 'gl', 'journal'].includes(report);
  const usesAsOf = report === 'trial' || report === 'bs' || report === 'ar' || report === 'ap';
  const hidesDates = report === 'vat' || report === 'fa';

  useEffect(() => {
    if (!needsLedger) return;
    let cancelled = false;
    setLoading(true);
    const upTo = (report === 'trial' || report === 'bs') ? asOf : to;
    const t0 = performance.now();
    fetchLedger(orgId, upTo).then(s => {
      if (!cancelled) {
        setSnap(s);
        setLoading(false);
        logRecalc(orgId, report, { from, to, asOf, upTo }, t0, s?.lines?.length ?? undefined);
      }
    });
    return () => { cancelled = true; };
  }, [orgId, report, asOf, to, from, needsLedger, liveTick]);




  const handleBundleZip = async () => {
    const upToLedger = asOf > to ? asOf : to;
    const ledger = await fetchLedger(orgId, upToLedger);
    const [ar, ap, vat, fa] = await Promise.all([
      fetchAgedReceivables(orgId, asOf),
      fetchAgedPayables(orgId, asOf),
      fetchVatSummary(orgId),
      fetchFixedAssetRegister(orgId),
    ]);
    await exportZipBundle({
      meta: { orgName, currency },
      pl: computeProfitAndLoss(ledger, from, to),
      bs: computeBalanceSheet(ledger, asOf),
      cf: computeCashFlow(ledger, from, to),
      tb: computeTrialBalance(ledger),
      ar, ap, vat, fa,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Reports centre</h2>
          <p className="text-xs text-muted-foreground">{orgName} · live from the ledger · auto-updates on every change</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleBundleZip}
            className="h-8 rounded-lg border border-border/60 bg-card px-3 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-foreground transition-colors duration-150 hover:border-border">
            Download all (ZIP)
          </button>
          <button onClick={() => setSubmitOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">
            <Send className="h-3.5 w-3.5" /> Send to accountant
          </button>
        </div>
      </div>

      {/* Report picker */}
      <div className="flex gap-1.5 flex-wrap">
        {REPORT_TABS.map(t => (
          <button key={t.key} onClick={() => setReport(t.key)}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-colors duration-150',
              report === t.key
                ? 'border-primary/50 bg-primary/[0.06] text-foreground'
                : 'border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-border',
            )}>
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
        <span className="text-[10px] text-muted-foreground self-center ml-2">
          {REPORT_TABS.find(t => t.key === report)?.hint}
        </span>
      </div>

      {/* Date controls */}
      {!hidesDates && (
        <div className="flex flex-wrap items-end gap-3 rounded-[10px] border border-border/60 bg-card p-3">
          <Calendar className="h-4 w-4 text-muted-foreground mb-2" />
          {usesAsOf ? (
            <div>
              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">As-of date</Label>
              <Input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="h-9 w-44 rounded-lg text-xs" />
            </div>
          ) : (
            <>
              <div>
                <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">From</Label>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 w-44 rounded-lg text-xs" />
              </div>
              <div>
                <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">To</Label>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 w-44 rounded-lg text-xs" />
              </div>
              <QuickRange onPick={(f, t) => { setFrom(f); setTo(t); }} />
            </>
          )}
        </div>
      )}

      {needsLedger && (loading || !snap) ? (
        <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card"><SkeletonTable cols={5} rows={6} /></div>
      ) : (
        <>
          {report === 'pl'      && snap && <ProfitLossPanel snap={snap} from={from} to={to} currency={currency} orgName={orgName} />}
          {report === 'bs'      && snap && <BalanceSheetPanel snap={snap} asOf={asOf} currency={currency} orgName={orgName} />}
          {report === 'cf'      && snap && <CashFlowPanel snap={snap} from={from} to={to} currency={currency} orgName={orgName} />}
          {report === 'trial'   && snap && <TrialBalancePanel snap={snap} asOf={asOf} currency={currency} orgName={orgName} />}
          {report === 'gl'      && snap && <GeneralLedgerPanel snap={snap} from={from} to={to} currency={currency} orgName={orgName} />}
          {report === 'journal' && snap && <JournalReportPanel snap={snap} from={from} to={to} currency={currency} orgName={orgName} />}
          {report === 'ar'      && <AgedPanel kind="ar" orgId={orgId} orgName={orgName} asOf={asOf} currency={currency} />}
          {report === 'ap'      && <AgedPanel kind="ap" orgId={orgId} orgName={orgName} asOf={asOf} currency={currency} />}
          {report === 'vat'     && <VatSummaryPanel orgId={orgId} orgName={orgName} currency={currency} />}
          {report === 'fa'      && <FixedAssetPanel orgId={orgId} orgName={orgName} currency={currency} />}
        </>
      )}

      <SubmitForAssessment open={submitOpen} onClose={() => setSubmitOpen(false)}
        orgId={orgId} orgName={orgName} currency={currency} />
    </div>
  );
}



function QuickRange({ onPick }: { onPick: (f: string, t: string) => void }) {
  const opts: [string, () => [string, string]][] = [
    ['This month',  () => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth(), 1); return [f.toISOString().slice(0,10), todayISO()]; }],
    ['This quarter',() => { const d = new Date(); const q = Math.floor(d.getMonth()/3); const f = new Date(d.getFullYear(), q*3, 1); return [f.toISOString().slice(0,10), todayISO()]; }],
    ['This year',   () => [firstOfYearISO(), todayISO()]],
    ['Last year',   () => { const y = new Date().getFullYear() - 1; return [`${y}-01-01`, `${y}-12-31`]; }],
  ];
  return (
    <div className="flex gap-1 ml-auto">
      {opts.map(([label, fn]) => (
        <button key={label} onClick={() => { const [f, t] = fn(); onPick(f, t); }}
          className="h-9 rounded-lg border border-border/60 bg-card px-2.5 text-[11px] font-medium transition-colors duration-150 hover:border-border">
          {label}
        </button>
      ))}
    </div>
  );
}

function ExportBar({ onPdf, onXlsx, onCsv, className }: { onPdf?: () => void; onXlsx?: () => void; onCsv?: () => void; className?: string }) {
  const btn = 'h-7 rounded-md border border-border/60 px-2.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground transition-colors duration-150 hover:border-border hover:text-foreground';
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {onPdf && <button onClick={onPdf} className={btn}>PDF</button>}
      {onXlsx && <button onClick={onXlsx} className={btn}>XLSX</button>}
      {onCsv && <button onClick={onCsv} className={btn}>CSV</button>}
    </div>
  );
}

function TrialBalancePanel({ snap, asOf, currency, orgName }: { snap: LedgerSnapshot; asOf: string; currency: string; orgName: string }) {
  const rows = useMemo(() => computeTrialBalance(snap), [snap]);
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const diff = totalDebit - totalCredit;
  const balanced = Math.abs(diff) < 0.005;

  return (
    <section className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-[550] tracking-[-0.01em]">Trial balance</h3>
          <p className="text-[10px] text-muted-foreground">{orgName} · as at {new Date(asOf).toLocaleDateString('en-GB')} · posted entries only</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums',
            balanced ? 'text-ok' : 'text-risk')}>
            {balanced ? 'Balanced' : `Off by ${money(Math.abs(diff), currency)}`}
          </span>
          <ExportBar
            onPdf={() => exportTrialBalancePDF(rows, { orgName, currency, asOf })}
            onXlsx={() => exportTrialBalanceXLSX(rows, { orgName, currency, asOf })}
            onCsv={() => exportCSV(`trial-balance-${asOf}.csv`, rows.map(r => ({ Code: r.code, Account: r.name, Type: r.type, Debit: r.debit, Credit: r.credit })))}
          />
        </div>
      </header>
      <table className="w-full text-xs">
        <thead className="bg-sunken font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-2 font-medium w-16">Code</th>
            <th className="text-left px-4 py-2 font-medium">Account</th>
            <th className="text-left px-4 py-2 font-medium w-20">Type</th>
            <th className="text-right px-4 py-2 font-medium w-32">Debit</th>
            <th className="text-right px-4 py-2 font-medium w-32">Credit</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-[11px]">No posted activity as of this date.</td></tr>
          ) : rows.map(r => (
            <tr key={r.account_id} className="border-t border-border/60 transition-colors duration-150 hover:bg-foreground/[0.025]">
              <td className="px-4 py-1.5 font-mono text-muted-foreground">{r.code}</td>
              <td className="px-4 py-1.5">{r.name}</td>
              <td className="px-4 py-1.5"><TypeChip t={r.type} /></td>
              <td className="px-4 py-1.5 text-right font-mono tabular-nums">{r.debit > 0 ? money(r.debit, currency) : ''}</td>
              <td className="px-4 py-1.5 text-right font-mono tabular-nums">{r.credit > 0 ? money(r.credit, currency) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-sunken font-[550]">
            <td colSpan={3} className="px-4 py-2 text-[11px] uppercase tracking-wider">Totals</td>
            <td className="px-4 py-2 text-right font-mono tabular-nums">{money(totalDebit, currency)}</td>
            <td className="px-4 py-2 text-right font-mono tabular-nums">{money(totalCredit, currency)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

/* ---------------- General Ledger ---------------- */
function GeneralLedgerPanel({ snap, from, to, currency, orgName }: { snap: LedgerSnapshot; from: string; to: string; currency: string; orgName: string }) {
  const [accountId, setAccountId] = useState<string>('all');
  const [source, setSource] = useState<string>('all');
  const sources = useMemo(() => Array.from(new Set(snap.entries.map(e => e.source_type))).sort(), [snap]);

  const lines = useMemo(() => computeGeneralLedger(snap, {
    from, to,
    accountIds: accountId === 'all' ? undefined : [accountId],
    sourceTypes: source === 'all' ? undefined : [source],
  }), [snap, from, to, accountId, source]);

  // Group by account
  const grouped = useMemo(() => {
    const g = new Map<string, typeof lines>();
    for (const l of lines) {
      const arr = g.get(l.account_id) || [];
      arr.push(l);
      g.set(l.account_id, arr);
    }
    return Array.from(g.entries());
  }, [lines]);

  return (
    <section className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
      <header className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-[550] tracking-[-0.01em]">General ledger</h3>
          <p className="text-[10px] text-muted-foreground">
            {orgName} · {new Date(from).toLocaleDateString('en-GB')} – {new Date(to).toLocaleDateString('en-GB')} · {lines.length} lines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="h-8 w-48 text-xs rounded-lg"><SelectValue placeholder="Account" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All accounts</SelectItem>
              {snap.accounts.map(a => (
                <SelectItem key={a.id} value={a.id} className="text-xs">
                  <span className="font-mono mr-2 text-muted-foreground">{a.code}</span>{a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-8 w-36 text-xs rounded-lg"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All sources</SelectItem>
              {sources.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <ExportBar
            onPdf={() => exportGLPDF(lines, { orgName, currency }, from, to)}
            onXlsx={() => exportGLXLSX(lines, { orgName, currency }, from, to)}
          />
        </div>
      </header>

      {grouped.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-[11px]">No transactions in this range.</div>
      ) : (
        <div className="divide-y divide-border/60">
          {grouped.map(([accId, accLines]) => {
            const first = accLines[0];
            const totalDebit = accLines.reduce((s, l) => s + l.debit, 0);
            const totalCredit = accLines.reduce((s, l) => s + l.credit, 0);
            const closing = accLines[accLines.length - 1].running_balance;
            return (
              <div key={accId}>
                <div className="flex items-center gap-2 bg-sunken px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.13em]">
                  <span className="font-mono text-muted-foreground">{first.account_code}</span>
                  <span>{first.account_name}</span>
                  <span className="ml-auto text-muted-foreground">Closing: <span className="font-mono tabular-nums text-foreground">{money(closing, currency)}</span></span>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-sunken font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-1.5 font-medium w-24">Date</th>
                      <th className="text-left px-4 py-1.5 font-medium">Description</th>
                      <th className="text-left px-4 py-1.5 font-medium w-24">Ref</th>
                      <th className="text-left px-4 py-1.5 font-medium w-24">Source</th>
                      <th className="text-right px-4 py-1.5 font-medium w-24">Debit</th>
                      <th className="text-right px-4 py-1.5 font-medium w-24">Credit</th>
                      <th className="text-right px-4 py-1.5 font-medium w-28">Running</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accLines.map(l => (
                      <tr key={l.entry_id + l.account_id + l.debit + l.credit + Math.random()} className="border-t border-border/40 transition-colors duration-150 hover:bg-foreground/[0.025]">
                        <td className="px-4 py-1 tabular-nums">{new Date(l.entry_date).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-1 truncate max-w-[280px]">
                          {l.description || <span className="text-muted-foreground italic">(no description)</span>}
                          {l.memo && <span className="text-muted-foreground"> · {l.memo}</span>}
                        </td>
                        <td className="px-4 py-1 font-mono text-[10px] text-muted-foreground">{l.reference}</td>
                        <td className="px-4 py-1 text-[10px] text-muted-foreground capitalize">{l.source_type.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-1 text-right font-mono tabular-nums">{l.debit > 0 ? money(l.debit, currency) : ''}</td>
                        <td className="px-4 py-1 text-right font-mono tabular-nums">{l.credit > 0 ? money(l.credit, currency) : ''}</td>
                        <td className="px-4 py-1 text-right font-mono tabular-nums font-medium">{money(l.running_balance, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-sunken font-medium">
                      <td colSpan={4} className="px-4 py-1.5 text-[10px] uppercase text-muted-foreground">Totals</td>
                      <td className="px-4 py-1.5 text-right font-mono tabular-nums">{money(totalDebit, currency)}</td>
                      <td className="px-4 py-1.5 text-right font-mono tabular-nums">{money(totalCredit, currency)}</td>
                      <td className="px-4 py-1.5 text-right font-mono tabular-nums">{money(closing, currency)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------------- Journal Report ---------------- */
function JournalReportPanel({ snap, from, to, currency, orgName }: { snap: LedgerSnapshot; from: string; to: string; currency: string; orgName: string }) {
  const [source, setSource] = useState<string>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const entries = useMemo(() => computeJournalReport(snap, {
    from, to, sourceTypes: source === 'all' ? undefined : [source],
  }), [snap, from, to, source]);
  const sources = useMemo(() => Array.from(new Set(snap.entries.map(e => e.source_type))).sort(), [snap]);

  return (
    <section className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
      <header className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-[550] tracking-[-0.01em]">Journal report</h3>
          <p className="text-[10px] text-muted-foreground">
            {orgName} · {new Date(from).toLocaleDateString('en-GB')} – {new Date(to).toLocaleDateString('en-GB')} · {entries.length} entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-8 w-36 text-xs rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All sources</SelectItem>
              {sources.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <ExportBar
            onPdf={() => exportJournalPDF(entries, { orgName, currency }, from, to)}
            onXlsx={() => exportJournalXLSX(entries, { orgName, currency }, from, to)}
          />
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-[11px]">No entries in this range.</div>
      ) : (
        <div className="divide-y divide-border/60">
          {entries.map(e => {
            const isOpen = expanded.has(e.id);
            return (
              <div key={e.id}>
                <button onClick={() => setExpanded(prev => {
                    const n = new Set(prev); n.has(e.id) ? n.delete(e.id) : n.add(e.id); return n;
                  })}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-xs transition-colors duration-150 hover:bg-foreground/[0.025]">
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="w-24 font-mono tabular-nums text-muted-foreground">{new Date(e.date).toLocaleDateString('en-GB')}</span>
                  <span className="flex-1 truncate">{e.description || <span className="text-muted-foreground italic">(no description)</span>}</span>
                  <span className="flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
                    {e.is_system ? <Zap className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                    {e.is_system ? 'auto' : 'manual'}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize w-20 text-right">{e.source_type.replace(/_/g, ' ')}</span>
                  <span className="w-28 text-right font-mono text-[11px] font-medium tabular-nums">{money(e.total_debit, currency)}</span>
                </button>
                {isOpen && (
                  <div className="border-t border-border/60 bg-sunken/60 px-4 py-2">
                    <table className="w-full text-[11px]">
                      <thead className="font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                        <tr>
                          <th className="text-left py-1 w-16">Code</th>
                          <th className="text-left py-1">Account</th>
                          <th className="text-left py-1">Memo</th>
                          <th className="text-right py-1 w-24">Debit</th>
                          <th className="text-right py-1 w-24">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {e.lines.map((l, i) => (
                          <tr key={i} className="border-t border-border/5">
                            <td className="py-1 font-mono text-muted-foreground">{l.account_code}</td>
                            <td className="py-1">{l.account_name}</td>
                            <td className="py-1 text-muted-foreground">{l.memo || ''}</td>
                            <td className="py-1 text-right font-mono tabular-nums">{l.debit > 0 ? money(l.debit, currency) : ''}</td>
                            <td className="py-1 text-right font-mono tabular-nums">{l.credit > 0 ? money(l.credit, currency) : ''}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-border/20 font-semibold">
                          <td colSpan={3} className="py-1 text-[10px] uppercase text-muted-foreground">Totals</td>
                          <td className="py-1 text-right font-mono tabular-nums">{money(e.total_debit, currency)}</td>
                          <td className="py-1 text-right font-mono tabular-nums">{money(e.total_credit, currency)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TypeChip({ t }: { t: AccountType }) {
  const dot: Record<AccountType, string> = {
    asset: 'bg-ok', liability: 'bg-attend', equity: 'bg-gold', revenue: 'bg-primary', expense: 'bg-risk',
  };
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', dot[t])} />
      {t}
    </span>
  );
}

/* ---------------- Profit & Loss ---------------- */
function ProfitLossPanel({ snap, from, to, currency, orgName }: { snap: LedgerSnapshot; from: string; to: string; currency: string; orgName: string }) {
  const pl = useMemo(() => computeProfitAndLoss(snap, from, to), [snap, from, to]);
  const margin = pl.totalRevenue > 0 ? (pl.netIncome / pl.totalRevenue) * 100 : 0;
  return (
    <section className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-[550] tracking-[-0.01em]">Profit and loss</h3>
          <p className="text-[10px] text-muted-foreground">{orgName} · {new Date(from).toLocaleDateString('en-GB')} – {new Date(to).toLocaleDateString('en-GB')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums',
            pl.netIncome >= 0 ? 'text-ok' : 'text-risk')}>
            {pl.netIncome >= 0 ? 'Profit' : 'Loss'} · {money(pl.netIncome, currency)}
          </span>
          <span className="text-[10px] text-muted-foreground">margin {margin.toFixed(1)}%</span>
          <ExportBar
            onPdf={() => exportPLPDF(pl, { orgName, currency })}
            onXlsx={() => exportPLXLSX(pl, { orgName, currency })}
          />
        </div>
      </header>
      <div className="p-5 space-y-5">
        <PLGroup title="Revenue" rows={pl.revenue} total={pl.totalRevenue} currency={currency} accent="text-ok" />
        <PLGroup title="Expenses" rows={pl.expense} total={pl.totalExpense} currency={currency} accent="text-risk" />
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-[550]">
          <span className="font-mono text-[10px] uppercase tracking-[0.13em]">Net income</span>
          <span className={cn('font-mono text-base tabular-nums', pl.netIncome >= 0 ? 'text-ok' : 'text-risk')}>
            {money(pl.netIncome, currency)}
          </span>
        </div>
      </div>
    </section>
  );
}
function PLGroup({ title, rows, total, currency, accent }: { title: string; rows: any[]; total: number; currency: string; accent: string }) {
  return (
    <div>
      <div className={cn('mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.13em]', accent)}>{title}</div>
      {rows.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic py-2">No activity.</div>
      ) : (
        <table className="w-full text-xs">
          <tbody>
            {rows.map(r => (
              <tr key={r.account_id} className="border-t border-border/5">
                <td className="py-1.5 pr-2 font-mono text-muted-foreground w-16">{r.code}</td>
                <td className="py-1.5">{r.name}</td>
                <td className="py-1.5 text-right font-mono tabular-nums w-32">{money(r.amount, currency)}</td>
              </tr>
            ))}
            <tr className="border-t border-border/20 font-semibold">
              <td colSpan={2} className="py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Total {title}</td>
              <td className="py-1.5 text-right font-mono tabular-nums">{money(total, currency)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ---------------- Balance Sheet ---------------- */
function BalanceSheetPanel({ snap, asOf, currency, orgName }: { snap: LedgerSnapshot; asOf: string; currency: string; orgName: string }) {
  const bs = useMemo(() => computeBalanceSheet(snap, asOf), [snap, asOf]);
  return (
    <section className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-[550] tracking-[-0.01em]">Balance sheet</h3>
          <p className="text-[10px] text-muted-foreground">{orgName} · as at {new Date(asOf).toLocaleDateString('en-GB')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums',
            bs.balanced ? 'text-ok' : 'text-risk')}>
            {bs.balanced ? 'Balanced' : `Off by ${money(Math.abs(bs.diff), currency)}`}
          </span>
          <ExportBar
            onPdf={() => exportBSPDF(bs, { orgName, currency })}
            onXlsx={() => exportBSXLSX(bs, { orgName, currency })}
          />
        </div>
      </header>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <BSGroup title="Assets" rows={bs.assets} total={bs.totalAssets} currency={currency} accent="text-ok" />
        </div>
        <div className="space-y-5">
          <BSGroup title="Liabilities" rows={bs.liabilities} total={bs.totalLiabilities} currency={currency} accent="text-attend" />
          <BSGroup
            title="Equity"
            rows={[...bs.equity, ...(Math.abs(bs.retainedEarnings) > 0.005 ? [{ account_id: '__re', code: '3900', name: 'Retained Earnings (current)', subtype: null, amount: bs.retainedEarnings }] : [])]}
            total={bs.totalEquity} currency={currency} accent="text-gold"
          />
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-[550]">
            <span className="font-mono text-[10px] uppercase tracking-[0.13em]">Liabilities + equity</span>
            <span className="font-mono tabular-nums">{money(bs.totalLiabilities + bs.totalEquity, currency)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
function BSGroup({ title, rows, total, currency, accent }: { title: string; rows: any[]; total: number; currency: string; accent: string }) {
  return (
    <div>
      <div className={cn('mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.13em]', accent)}>{title}</div>
      {rows.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic py-2">No balances.</div>
      ) : (
        <table className="w-full text-xs">
          <tbody>
            {rows.map(r => (
              <tr key={r.account_id} className="border-t border-border/5">
                <td className="py-1.5 pr-2 font-mono text-muted-foreground w-16">{r.code}</td>
                <td className="py-1.5">{r.name}</td>
                <td className="py-1.5 text-right font-mono tabular-nums w-32">{money(r.amount, currency)}</td>
              </tr>
            ))}
            <tr className="border-t border-border/20 font-semibold">
              <td colSpan={2} className="py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Total {title}</td>
              <td className="py-1.5 text-right font-mono tabular-nums">{money(total, currency)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ---------------- Cash Flow ---------------- */
function CashFlowPanel({ snap, from, to, currency, orgName }: { snap: LedgerSnapshot; from: string; to: string; currency: string; orgName: string }) {
  const cf = useMemo(() => computeCashFlow(snap, from, to), [snap, from, to]);
  return (
    <section className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-[550] tracking-[-0.01em]">Cash flow statement</h3>
          <p className="text-[10px] text-muted-foreground">{orgName} · {new Date(from).toLocaleDateString('en-GB')} – {new Date(to).toLocaleDateString('en-GB')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums',
            cf.netChange >= 0 ? 'text-ok' : 'text-risk')}>
            Net {money(cf.netChange, currency)}
          </span>
          <ExportBar
            onPdf={() => exportCFPDF(cf, { orgName, currency })}
            onXlsx={() => exportCFXLSX(cf, { orgName, currency })}
          />
        </div>
      </header>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
          <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Opening cash</span>
          <span className="font-mono font-medium tabular-nums">{money(cf.openingCash, currency)}</span>
        </div>
        <CFGroup title="Operating activities" rows={cf.operating} total={cf.totalOperating} currency={currency} accent="text-primary" />
        <CFGroup title="Investing activities" rows={cf.investing} total={cf.totalInvesting} currency={currency} accent="text-gold" />
        <CFGroup title="Financing activities" rows={cf.financing} total={cf.totalFinancing} currency={currency} accent="text-attend" />
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-[550]">
          <span className="font-mono text-[10px] uppercase tracking-[0.13em]">Net change in cash</span>
          <span className={cn('font-mono tabular-nums', cf.netChange >= 0 ? 'text-ok' : 'text-risk')}>{money(cf.netChange, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
          <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Closing cash</span>
          <span className="font-mono font-medium tabular-nums">{money(cf.closingCash, currency)}</span>
        </div>
      </div>
    </section>
  );
}
function CFGroup({ title, rows, total, currency, accent }: { title: string; rows: any[]; total: number; currency: string; accent: string }) {
  return (
    <div>
      <div className={cn('mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.13em]', accent)}>{title}</div>
      {rows.length === 0 ? (
        <div className="text-[11px] text-muted-foreground italic py-2">No cash activity.</div>
      ) : (
        <table className="w-full text-xs">
          <tbody>
            {rows.map(r => (
              <tr key={r.label} className="border-t border-border/5">
                <td className="py-1.5 capitalize">{r.label}</td>
                <td className="py-1.5 text-right text-[10px] text-muted-foreground w-16">{r.entries}</td>
                <td className="py-1.5 text-right font-mono tabular-nums w-32">{money(r.amount, currency)}</td>
              </tr>
            ))}
            <tr className="border-t border-border/20 font-semibold">
              <td colSpan={2} className="py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Subtotal</td>
              <td className="py-1.5 text-right font-mono tabular-nums">{money(total, currency)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ---------------- Aged Receivables / Payables ---------------- */
function AgedPanel({ kind, orgId, orgName, asOf, currency }: { kind: 'ar' | 'ap'; orgId: string; orgName: string; asOf: string; currency: string }) {
  const [data, setData] = useState<AgedReport | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let c = false; setLoading(true);
    const fn = kind === 'ar' ? fetchAgedReceivables : fetchAgedPayables;
    fn(orgId, asOf).then(d => { if (!c) { setData(d); setLoading(false); } });
    return () => { c = true; };
  }, [kind, orgId, asOf]);
  if (loading || !data) return <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card"><SkeletonTable cols={5} rows={6} /></div>;
  const title = kind === 'ar' ? 'Aged Receivables' : 'Aged Payables';
  const partyLabel = kind === 'ar' ? 'Customer' : 'Supplier';
  const docLabel = kind === 'ar' ? 'Invoice' : 'Bill';
  const bucketOrder: AgedReport['buckets'] extends infer T ? (keyof T)[] : never = ['current', '1-30', '31-60', '61-90', '90+'] as any;
  const bucketColor = (b: string) =>
    b === 'current' ? 'text-ok' :
    b === '1-30' ? 'text-muted-foreground' :
    b === '31-60' ? 'text-attend' :
    b === '61-90' ? 'text-attend' : 'text-risk';
  return (
    <section className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-[550] tracking-[-0.01em]">{title}</h3>
          <p className="text-[10px] text-muted-foreground">{orgName} · as at {new Date(asOf).toLocaleDateString('en-GB')} · {data.rows.length} open {docLabel.toLowerCase()}s</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] tabular-nums text-foreground">
            Outstanding {money(data.totalOutstanding, currency)}
          </span>
          <ExportBar
            onPdf={() => exportAgedPDF(kind, data, { orgName, currency })}
            onXlsx={() => exportAgedXLSX(kind, data, { orgName, currency })}
          />
        </div>
      </header>
      <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        {(bucketOrder as any).map((b: any) => (
          <div key={b} className="rounded-lg border border-border/60 bg-card p-3">
            <div className={cn('font-mono text-[9.5px] font-medium uppercase tracking-[0.13em]', bucketColor(b))}>{b === 'current' ? 'Current' : `${b} days`}</div>
            <div className="mt-1 font-mono text-sm font-medium tabular-nums">{money((data.buckets as any)[b], currency)}</div>
          </div>
        ))}
      </div>
      {data.rows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-[11px]">Nothing outstanding.</div>
      ) : (
        <table className="w-full text-xs">
          <thead className="bg-sunken font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">{partyLabel}</th>
              <th className="text-left px-4 py-2 font-medium">{docLabel} #</th>
              <th className="text-left px-4 py-2 font-medium w-24">Date</th>
              <th className="text-left px-4 py-2 font-medium w-24">Due</th>
              <th className="text-left px-4 py-2 font-medium w-20">Bucket</th>
              <th className="text-right px-4 py-2 font-medium w-28">Total</th>
              <th className="text-right px-4 py-2 font-medium w-28">Paid</th>
              <th className="text-right px-4 py-2 font-medium w-28">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map(r => (
              <tr key={r.id} className="border-t border-border/60 transition-colors duration-150 hover:bg-foreground/[0.025]">
                <td className="px-4 py-1.5">{r.party_name}</td>
                <td className="px-4 py-1.5 font-mono text-[11px]">{r.document_number}</td>
                <td className="px-4 py-1.5 tabular-nums text-muted-foreground">{new Date(r.document_date).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-1.5 tabular-nums text-muted-foreground">{r.due_date ? new Date(r.due_date).toLocaleDateString('en-GB') : '–'}</td>
                <td className={cn('px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em]', bucketColor(r.bucket))}>
                  {r.bucket === 'current' ? 'current' : `${r.bucket} · ${r.days_overdue}d`}
                </td>
                <td className="px-4 py-1.5 text-right font-mono tabular-nums">{money(r.total, r.currency)}</td>
                <td className="px-4 py-1.5 text-right font-mono tabular-nums text-muted-foreground">{money(r.paid, r.currency)}</td>
                <td className="px-4 py-1.5 text-right font-mono tabular-nums font-semibold">{money(r.outstanding, r.currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-sunken font-[550]">
              <td colSpan={7} className="px-4 py-2 text-[11px] uppercase tracking-wider text-right">Total outstanding</td>
              <td className="px-4 py-2 text-right font-mono tabular-nums">{money(data.totalOutstanding, currency)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </section>
  );
}

/* ---------------- VAT Summary ---------------- */
function VatSummaryPanel({ orgId, orgName, currency }: { orgId: string; orgName: string; currency: string }) {
  const [data, setData] = useState<VatSummary | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let c = false; setLoading(true); const t0 = performance.now();
    fetchVatSummary(orgId).then(d => { if (!c) { setData(d); setLoading(false); logRecalc(orgId, 'vat_summary', {}, t0, d?.returns?.length); } });
    return () => { c = true; };
  }, [orgId]);
  if (loading || !data) return <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card"><SkeletonTable cols={5} rows={6} /></div>;
  const statusToneOf = (s: string) =>
    s === 'paid' ? 'ok' as const :
    s === 'filed' || s === 'submitted' ? 'neutral' as const :
    'attend' as const;
  return (
    <section className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-[550] tracking-[-0.01em]">VAT summary</h3>
          <p className="text-[10px] text-muted-foreground">{orgName} · live outstanding since last filed period</p>
        </div>
        <ExportBar
          onPdf={() => exportVatPDF(data, { orgName, currency })}
          onXlsx={() => exportVatXLSX(data, { orgName, currency })}
        />
      </header>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard label="Live output VAT" value={money(data.outstandingOutputVat, currency)} hint="Since last filed period" />
        <StatCard label="Live input VAT" value={money(data.outstandingInputVat, currency)} hint="Since last filed period" />
        <StatCard label="Live net due" value={money(data.liveNet, currency)} hint="Output − input" />
        <StatCard label="Total paid" value={money(data.totalPaid, currency)} hint={`${data.returns.length} returns on file`} />
      </div>
      <div className="border-t border-border/20">
        <div className="bg-sunken px-4 py-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">Filed returns</div>
        {data.returns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-[11px]">No VAT returns filed yet.</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-sunken font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Period</th>
                <th className="text-left px-4 py-2 font-medium w-24">Status</th>
                <th className="text-left px-4 py-2 font-medium">Reference</th>
                <th className="text-right px-4 py-2 font-medium w-28">Output VAT</th>
                <th className="text-right px-4 py-2 font-medium w-28">Input VAT</th>
                <th className="text-right px-4 py-2 font-medium w-28">Net due</th>
                <th className="text-right px-4 py-2 font-medium w-28">Paid</th>
              </tr>
            </thead>
            <tbody>
              {data.returns.map(r => (
                <tr key={r.id} className="border-t border-border/60 transition-colors duration-150 hover:bg-foreground/[0.025]">
                  <td className="px-4 py-1.5 tabular-nums">
                    {new Date(r.period_start).toLocaleDateString('en-GB')} – {new Date(r.period_end).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-1.5"><StatusBadge tone={statusToneOf(r.status)} label={r.status} className="text-[10.5px] capitalize" /></td>
                  <td className="px-4 py-1.5 font-mono text-[11px] text-muted-foreground">{r.reference || '–'}</td>
                  <td className="px-4 py-1.5 text-right font-mono tabular-nums">{money(r.output_vat, currency)}</td>
                  <td className="px-4 py-1.5 text-right font-mono tabular-nums">{money(r.input_vat, currency)}</td>
                  <td className="px-4 py-1.5 text-right font-mono tabular-nums font-semibold">{money(r.net_due, currency)}</td>
                  <td className="px-4 py-1.5 text-right font-mono tabular-nums text-muted-foreground">{r.payment_amount ? money(r.payment_amount, currency) : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ---------------- Fixed Asset Register ---------------- */
function FixedAssetPanel({ orgId, orgName, currency }: { orgId: string; orgName: string; currency: string }) {
  const [data, setData] = useState<FaRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDisposed, setShowDisposed] = useState(false);
  useEffect(() => { let c = false; setLoading(true); const t0 = performance.now();
    fetchFixedAssetRegister(orgId).then(d => { if (!c) { setData(d); setLoading(false); logRecalc(orgId, 'fixed_asset_register', {}, t0, d?.rows?.length); } });
    return () => { c = true; };
  }, [orgId]);
  if (loading || !data) return <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card"><SkeletonTable cols={5} rows={6} /></div>;
  const rows = data.rows.filter(r => showDisposed || r.status !== 'disposed');
  return (
    <section className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-[550] tracking-[-0.01em]">Fixed-asset register</h3>
          <p className="text-[10px] text-muted-foreground">{orgName} · {data.countActive} active · {data.countDisposed} disposed</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showDisposed} onChange={e => setShowDisposed(e.target.checked)} className="h-3 w-3" />
            Include disposed
          </label>
          <ExportBar
            onPdf={() => exportFaPDF(data, { orgName, currency })}
            onXlsx={() => exportFaXLSX(data, { orgName, currency })}
          />
        </div>
      </header>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard label="Total cost" value={money(data.totalCost, currency)} hint="Active assets" />
        <StatCard label="Accumulated depr." value={money(data.totalAccumDepr, currency)} hint="Charged to date" />
        <StatCard label="Net book value" value={money(data.totalNbv, currency)} hint="Active assets" />
        <StatCard label="Disposal proceeds" value={money(data.totalDisposed, currency)} hint={`${data.countDisposed} disposed`} />
      </div>
      {rows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-[11px]">No assets to display.</div>
      ) : (
        <table className="w-full text-xs">
          <thead className="bg-sunken font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium w-20">Tag</th>
              <th className="text-left px-4 py-2 font-medium">Asset</th>
              <th className="text-left px-4 py-2 font-medium w-24">Category</th>
              <th className="text-left px-4 py-2 font-medium w-24">Method</th>
              <th className="text-left px-4 py-2 font-medium w-24">Purchased</th>
              <th className="text-right px-4 py-2 font-medium w-28">Cost</th>
              <th className="text-right px-4 py-2 font-medium w-28">Accum. Depr.</th>
              <th className="text-right px-4 py-2 font-medium w-28">NBV</th>
              <th className="text-left px-4 py-2 font-medium w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-border/60 transition-colors duration-150 hover:bg-foreground/[0.025]">
                <td className="px-4 py-1.5 font-mono text-[11px] text-muted-foreground">{r.asset_tag || '–'}</td>
                <td className="px-4 py-1.5">{r.name}</td>
                <td className="px-4 py-1.5 text-muted-foreground">{r.category || '–'}</td>
                <td className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{r.method.replace(/_/g, ' ')}</td>
                <td className="px-4 py-1.5 tabular-nums text-muted-foreground">{new Date(r.purchase_date).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-1.5 text-right font-mono tabular-nums">{money(r.purchase_cost, currency)}</td>
                <td className="px-4 py-1.5 text-right font-mono tabular-nums text-muted-foreground">{money(r.accumulated_depreciation, currency)}</td>
                <td className="px-4 py-1.5 text-right font-mono tabular-nums font-semibold">{money(r.net_book_value, currency)}</td>
                <td className="px-4 py-1.5">
                  <StatusBadge tone={r.status === 'active' ? 'ok' : r.status === 'disposed' ? 'risk' : 'attend'} label={r.status} className="text-[10.5px] capitalize" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm font-medium tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[9.5px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

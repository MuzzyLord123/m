import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Upload, Landmark, ArrowRight, Link2, Unlink, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/platform';

type SubTab = 'accounts' | 'transactions' | 'reconcile';

interface Account { id: string; code: string; name: string; type: string; is_active: boolean; }
interface BankAccount {
  id: string; org_id: string; coa_account_id: string; name: string;
  institution: string | null; account_number_last4: string | null;
  currency: string; opening_balance: number; opening_balance_date: string;
  is_active: boolean;
}
interface BankTxn {
  id: string; org_id: string; bank_account_id: string;
  txn_date: string; description: string; reference: string | null;
  amount: number; running_balance: number | null;
  status: 'unmatched'|'matched'|'reconciled'|'ignored';
  journal_entry_id: string | null;
  reconciliation_id: string | null;
}
interface Reconciliation {
  id: string; bank_account_id: string; statement_date: string;
  opening_balance: number; closing_balance: number;
  status: 'open'|'completed'; completed_at: string | null;
}

// Status tones come from the platform StatusBadge vocabulary.

function money(n: number, c = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: c, minimumFractionDigits: 2 }).format(Number(n || 0));
}

const db = supabase as any;

export default function BankingView({
  orgId, accounts, currency,
}: { orgId: string; accounts: Account[]; currency: string; }) {
  const [sub, setSub] = useState<SubTab>('accounts');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [txns, setTxns] = useState<BankTxn[]>([]);
  const [recons, setRecons] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReconModal, setShowReconModal] = useState(false);
  const [matchTarget, setMatchTarget] = useState<BankTxn | null>(null);

  const cashAccounts = useMemo(() => accounts.filter(a => a.type === 'asset' && a.code.startsWith('10') && a.is_active), [accounts]);

  const refreshBanks = useCallback(async () => {
    if (!orgId) return;
    const { data } = await db.from('acc_bank_accounts').select('*').eq('org_id', orgId).order('name');
    setBankAccounts(data || []);
    if ((data || []).length > 0 && !selectedBankId) setSelectedBankId(data[0].id);
  }, [orgId, selectedBankId]);

  const refreshTxns = useCallback(async () => {
    if (!selectedBankId) { setTxns([]); setRecons([]); return; }
    setLoading(true);
    const [t, r] = await Promise.all([
      db.from('acc_bank_transactions').select('*').eq('bank_account_id', selectedBankId).order('txn_date', { ascending: false }).limit(1000),
      db.from('acc_bank_reconciliations').select('*').eq('bank_account_id', selectedBankId).order('statement_date', { ascending: false }),
    ]);
    setTxns(t.data || []);
    setRecons(r.data || []);
    setLoading(false);
  }, [selectedBankId]);

  useEffect(() => { refreshBanks(); }, [refreshBanks]);
  useEffect(() => { refreshTxns(); }, [refreshTxns]);

  const selectedBank = bankAccounts.find(b => b.id === selectedBankId);

  const totals = useMemo(() => {
    const balance = (selectedBank?.opening_balance || 0) + txns.reduce((s, t) => s + Number(t.amount), 0);
    const unmatched  = txns.filter(t => t.status === 'unmatched').length;
    const matched    = txns.filter(t => t.status === 'matched').length;
    const reconciled = txns.filter(t => t.status === 'reconciled').length;
    return { balance, unmatched, matched, reconciled };
  }, [txns, selectedBank]);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Bank balance"  value={money(totals.balance, currency)} />
        <KpiCard label="Unmatched"     value={String(totals.unmatched)} />
        <KpiCard label="Matched"       value={String(totals.matched)} />
        <KpiCard label="Reconciled"    value={String(totals.reconciled)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-card border border-border/60 p-1">
          {(['accounts','transactions','reconcile'] as SubTab[]).map(k => (
            <button key={k} onClick={() => setSub(k)}
              className={cn(
                "px-3 h-8 text-[12px] rounded-lg font-medium capitalize transition-colors",
                sub === k ? "bg-foreground/[0.05] text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>{k}</button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {bankAccounts.length > 0 && sub !== 'accounts' && (
            <Select value={selectedBankId} onValueChange={setSelectedBankId}>
              <SelectTrigger className="h-8 w-[200px] text-xs rounded-lg bg-card">
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(b => <SelectItem key={b.id} value={b.id} className="text-xs">{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {sub === 'accounts' && (
            <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => setShowAccountModal(true)} disabled={cashAccounts.length === 0}>
              <Plus className="h-3.5 w-3.5" /> Add bank account
            </Button>
          )}
          {sub === 'transactions' && selectedBankId && (
            <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => setShowImportModal(true)}>
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </Button>
          )}
          {sub === 'reconcile' && selectedBankId && (
            <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => setShowReconModal(true)}>
              <Plus className="h-3.5 w-3.5" /> Start reconciliation
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : sub === 'accounts' ? (
        <BankAccountsList
          banks={bankAccounts} accounts={accounts} currency={currency}
          onDelete={async (id) => { if (!confirm('Delete bank account and all transactions?')) return; const { error } = await db.from('acc_bank_accounts').delete().eq('id', id); if (error) toast.error(error.message); else { toast.success('Deleted'); refreshBanks(); } }}
        />
      ) : sub === 'transactions' ? (
        <TransactionsTable
          txns={txns} currency={currency}
          onMatch={(t) => setMatchTarget(t)}
          onUnmatch={async (id) => { const { error } = await db.rpc('acc_unmatch_bank_transaction', { _txn_id: id }); if (error) toast.error(error.message); else { toast.success('Unmatched'); refreshTxns(); } }}
          onDelete={async (id) => { if (!confirm('Delete transaction?')) return; const { error } = await db.from('acc_bank_transactions').delete().eq('id', id); if (error) toast.error(error.message); else { toast.success('Deleted'); refreshTxns(); } }}
        />
      ) : (
        <ReconciliationList recons={recons} currency={currency}
          onComplete={async (id) => { const { error } = await db.rpc('acc_complete_bank_reconciliation', { _recon_id: id }); if (error) toast.error(error.message); else { toast.success('Reconciliation completed'); refreshTxns(); } }}
          onDelete={async (id) => { if (!confirm('Delete reconciliation session?')) return; const { error } = await db.from('acc_bank_reconciliations').delete().eq('id', id); if (error) toast.error(error.message); else { toast.success('Deleted'); refreshTxns(); } }}
        />
      )}

      {showAccountModal && (
        <BankAccountModal orgId={orgId} cashAccounts={cashAccounts}
          onClose={() => setShowAccountModal(false)}
          onSaved={() => { setShowAccountModal(false); refreshBanks(); }} />
      )}
      {showImportModal && selectedBank && (
        <CsvImportModal bank={selectedBank}
          onClose={() => setShowImportModal(false)}
          onSaved={() => { setShowImportModal(false); refreshTxns(); }} />
      )}
      {showReconModal && selectedBank && (
        <ReconModal bank={selectedBank}
          onClose={() => setShowReconModal(false)}
          onSaved={() => { setShowReconModal(false); refreshTxns(); }} />
      )}
      {matchTarget && (
        <MatchModal txn={matchTarget} accounts={accounts}
          onClose={() => setMatchTarget(null)}
          onSaved={() => { setMatchTarget(null); refreshTxns(); }} />
      )}
    </div>
  );
}

/* ---------- Panels ---------- */
function KpiCard({ label, value }: any) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border/60 bg-card px-4 py-3">
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{label}</span>
      <span className="font-mono text-[15px] font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function BankAccountsList({ banks, accounts, currency, onDelete }: {
  banks: BankAccount[]; accounts: Account[]; currency: string; onDelete: (id: string) => void;
}) {
  const amap = useMemo(() => Object.fromEntries(accounts.map(a => [a.id, `${a.code} ${a.name}`])), [accounts]);
  if (banks.length === 0) return <Empty icon={Landmark} title="No bank accounts" hint='Click "Add bank account" to link a cash/bank COA account to a real-world account.' />;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {banks.map(b => (
        <div key={b.id} className="p-4 rounded-[10px] border border-border/60 bg-card flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold">{b.name}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{b.institution || '–'} {b.account_number_last4 ? `· •••${b.account_number_last4}` : ''}</div>
            <div className="text-[11px] text-muted-foreground mt-1">Linked to <span className="font-mono">{amap[b.coa_account_id] || '–'}</span></div>
            <div className="text-[11px] text-muted-foreground mt-1">Opening {money(b.opening_balance, b.currency || currency)} on {new Date(b.opening_balance_date).toLocaleDateString('en-GB')}</div>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-risk" onClick={() => onDelete(b.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function TransactionsTable({ txns, currency, onMatch, onUnmatch, onDelete }: {
  txns: BankTxn[]; currency: string;
  onMatch: (t: BankTxn) => void; onUnmatch: (id: string) => void; onDelete: (id: string) => void;
}) {
  if (txns.length === 0) return <Empty icon={Upload} title="No transactions" hint='Import statement lines via CSV to start reconciling.' />;
  return (
    <div className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/20 text-muted-foreground">
          <tr><Th>Date</Th><Th>Description</Th><Th>Ref</Th><Th right>Amount</Th><Th>Status</Th><Th right>Actions</Th></tr>
        </thead>
        <tbody>
          {txns.map(t => (
            <tr key={t.id} className="border-t border-border/60 hover:bg-foreground/[0.025]">
              <Td>{new Date(t.txn_date).toLocaleDateString('en-GB')}</Td>
              <Td>{t.description}</Td>
              <Td>{t.reference || '–'}</Td>
              <Td right>
                <span className={cn("font-mono font-medium", t.amount >= 0 ? "text-ok" : "text-risk")}>
                  {t.amount >= 0 ? '+' : ''}{money(t.amount, currency)}
                </span>
              </Td>
              <Td>
                <StatusBadge status={t.status} className="text-[10.5px] capitalize" />
              </Td>
              <Td right>
                <div className="flex gap-1 justify-end">
                  {t.status === 'unmatched' && (
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => onMatch(t)}>
                      <Link2 className="h-3 w-3" /> Match
                    </Button>
                  )}
                  {t.status === 'matched' && (
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => onUnmatch(t.id)}>
                      <Unlink className="h-3 w-3" /> Unmatch
                    </Button>
                  )}
                  {t.status !== 'reconciled' && (
                    <Button size="sm" variant="ghost" className="h-7 text-risk" onClick={() => onDelete(t.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReconciliationList({ recons, currency, onComplete, onDelete }: {
  recons: Reconciliation[]; currency: string; onComplete: (id: string) => void; onDelete: (id: string) => void;
}) {
  if (recons.length === 0) return <Empty icon={CheckCircle2} title="No reconciliations yet" hint='Click "Start reconciliation" to check your books against a bank statement.' />;
  return (
    <div className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/20 text-muted-foreground">
          <tr><Th>Statement date</Th><Th right>Opening</Th><Th right>Closing</Th><Th>Status</Th><Th right>Actions</Th></tr>
        </thead>
        <tbody>
          {recons.map(r => (
            <tr key={r.id} className="border-t border-border/60 hover:bg-foreground/[0.025]">
              <Td>{new Date(r.statement_date).toLocaleDateString('en-GB')}</Td>
              <Td right>{money(r.opening_balance, currency)}</Td>
              <Td right>{money(r.closing_balance, currency)}</Td>
              <Td>
                <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium uppercase",
                  r.status === 'completed' ? "bg-ok/15 text-ok" : "bg-attend/15 text-attend")}>
                  {r.status}
                </span>
              </Td>
              <Td right>
                <div className="flex gap-1 justify-end">
                  {r.status === 'open' && (
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => onComplete(r.id)}>
                      <CheckCircle2 className="h-3 w-3" /> Complete
                    </Button>
                  )}
                  {r.status === 'open' && (
                    <Button size="sm" variant="ghost" className="h-7 text-risk" onClick={() => onDelete(r.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Modals ---------- */
function BankAccountModal({ orgId, cashAccounts, onClose, onSaved }: {
  orgId: string; cashAccounts: Account[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '', institution: '', account_number_last4: '', currency: 'GBP',
    coa_account_id: cashAccounts[0]?.id || '',
    opening_balance: 0,
    opening_balance_date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add bank account</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Name *"><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Barclays Business Current" /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Institution"><Input value={form.institution} onChange={e => setForm({...form, institution: e.target.value})} /></Field>
            <Field label="Last 4 digits"><Input maxLength={4} value={form.account_number_last4} onChange={e => setForm({...form, account_number_last4: e.target.value})} /></Field>
          </div>
          <Field label="Linked COA account *">
            <Select value={form.coa_account_id} onValueChange={v => setForm({...form, coa_account_id: v})}>
              <SelectTrigger><SelectValue placeholder="Select cash/bank account" /></SelectTrigger>
              <SelectContent>{cashAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Currency">
              <Select value={form.currency} onValueChange={v => setForm({...form, currency: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['GBP','USD','EUR','AUD','CAD'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Opening balance date"><Input type="date" value={form.opening_balance_date} onChange={e => setForm({...form, opening_balance_date: e.target.value})} /></Field>
          </div>
          <Field label="Opening balance"><Input type="number" step="0.01" value={form.opening_balance} onChange={e => setForm({...form, opening_balance: Number(e.target.value)})} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.name.trim() || !form.coa_account_id || saving} onClick={async () => {
            setSaving(true);
            const { error } = await db.from('acc_bank_accounts').insert({ org_id: orgId, ...form });
            setSaving(false);
            if (error) toast.error(error.message); else { toast.success('Bank account added'); onSaved(); }
          }}>{saving ? 'Saving…' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CsvImportModal({ bank, onClose, onSaved }: {
  bank: BankAccount; onClose: () => void; onSaved: () => void;
}) {
  const [rows, setRows] = useState<Array<{ date: string; description: string; reference: string; amount: number }>>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCsv(text: string) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];
    const header = lines[0].toLowerCase();
    const hasHeader = /date|amount|description/.test(header);
    const startIdx = hasHeader ? 1 : 0;

    // simple column detection from header
    let dateIdx = 0, descIdx = 1, refIdx = -1, amtIdx = 2, debitIdx = -1, creditIdx = -1;
    if (hasHeader) {
      const cols = splitCsvLine(lines[0]).map(c => c.trim().toLowerCase());
      const find = (names: string[]) => cols.findIndex(c => names.some(n => c.includes(n)));
      dateIdx  = Math.max(0, find(['date']));
      descIdx  = Math.max(0, find(['description','details','narrative','memo']));
      refIdx   = find(['reference','ref']);
      amtIdx   = find(['amount']);
      debitIdx = find(['debit','withdrawal','out']);
      creditIdx= find(['credit','deposit','in']);
    }

    const out: any[] = [];
    for (let i = startIdx; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      const dateRaw = cols[dateIdx] || '';
      const description = (cols[descIdx] || '').trim();
      const reference = refIdx >= 0 ? (cols[refIdx] || '').trim() : '';
      let amount = 0;
      if (amtIdx >= 0 && cols[amtIdx]) amount = parseFloat(cols[amtIdx].replace(/[£$,\s]/g,'')) || 0;
      else {
        const d = debitIdx >= 0 ? parseFloat((cols[debitIdx]||'').replace(/[£$,\s]/g,'')) || 0 : 0;
        const c = creditIdx >= 0 ? parseFloat((cols[creditIdx]||'').replace(/[£$,\s]/g,'')) || 0 : 0;
        amount = c - d;
      }
      const iso = parseDate(dateRaw);
      if (!iso || !description) continue;
      out.push({ date: iso, description, reference, amount });
    }
    return out;
  }

  function splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { result.push(cur); cur = ''; continue; }
      cur += ch;
    }
    result.push(cur);
    return result;
  }

  function parseDate(s: string): string | null {
    if (!s) return null;
    const t = s.trim();
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    if (iso) return t;
    const uk = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(t);
    if (uk) {
      const [_, d, m, y] = uk;
      const yy = y.length === 2 ? '20' + y : y;
      return `${yy}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }
    const d = new Date(t);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return null;
  }

  async function handleFile(f: File) {
    const text = await f.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) { toast.error('No rows detected. Expected columns: date, description, amount (or debit/credit)'); return; }
    setRows(parsed);
    toast.success(`Parsed ${parsed.length} rows`);
  }

  async function save() {
    if (rows.length === 0) return;
    setSaving(true);
    const payload = rows.map(r => ({
      org_id: bank.org_id, bank_account_id: bank.id,
      txn_date: r.date, description: r.description, reference: r.reference || null,
      amount: r.amount, source: 'csv',
    }));
    const { error } = await db.from('acc_bank_transactions').insert(payload);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success(`Imported ${rows.length} transactions`); onSaved(); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Import bank statement · {bank.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">Upload a CSV with <span className="font-mono">date</span>, <span className="font-mono">description</span>, and either <span className="font-mono">amount</span> or <span className="font-mono">debit</span>/<span className="font-mono">credit</span> columns. Positive amounts = money in.</div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <Button variant="secondary" className="h-9 gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Choose CSV file
          </Button>
          {rows.length > 0 && (
            <div className="rounded-lg border border-border/60 max-h-72 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/20 text-muted-foreground sticky top-0">
                  <tr><Th>Date</Th><Th>Description</Th><Th>Ref</Th><Th right>Amount</Th></tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r, i) => (
                    <tr key={i} className="border-t border-border/60">
                      <Td>{r.date}</Td><Td>{r.description}</Td><Td>{r.reference || '–'}</Td>
                      <Td right className={r.amount >= 0 ? 'text-ok' : 'text-risk'}>{r.amount.toFixed(2)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 200 && <div className="p-2 text-[10px] text-muted-foreground text-center">…and {rows.length - 200} more</div>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={rows.length === 0 || saving} onClick={save}>{saving ? 'Importing…' : `Import ${rows.length} rows`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReconModal({ bank, onClose, onSaved }: {
  bank: BankAccount; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    statement_date: new Date().toISOString().slice(0, 10),
    opening_balance: bank.opening_balance,
    closing_balance: 0,
  });
  const [saving, setSaving] = useState(false);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Start reconciliation · {bank.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Statement date"><Input type="date" value={form.statement_date} onChange={e => setForm({...form, statement_date: e.target.value})} /></Field>
          <Field label="Opening balance"><Input type="number" step="0.01" value={form.opening_balance} onChange={e => setForm({...form, opening_balance: Number(e.target.value)})} /></Field>
          <Field label="Closing balance (from statement)"><Input type="number" step="0.01" value={form.closing_balance} onChange={e => setForm({...form, closing_balance: Number(e.target.value)})} /></Field>
          <div className="text-[11px] text-muted-foreground">The session will complete when opening + matched movements = closing.</div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={async () => {
            setSaving(true);
            const { error } = await db.from('acc_bank_reconciliations').insert({
              org_id: bank.org_id, bank_account_id: bank.id, ...form,
            });
            setSaving(false);
            if (error) toast.error(error.message); else { toast.success('Reconciliation session started'); onSaved(); }
          }}>{saving ? 'Saving…' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MatchModal({ txn, accounts, onClose, onSaved }: {
  txn: BankTxn; accounts: Account[]; onClose: () => void; onSaved: () => void;
}) {
  const [mode, setMode] = useState<'auto'|'existing'>('auto');
  const [contraId, setContraId] = useState('');
  const [entryId, setEntryId] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [memo, setMemo] = useState(txn.description);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await db.from('acc_journal_entries')
        .select('id, entry_date, description, source_type')
        .eq('org_id', txn.org_id)
        .not('posted_at', 'is', null)
        .gte('entry_date', new Date(new Date(txn.txn_date).getTime() - 15*86400000).toISOString().slice(0,10))
        .lte('entry_date', new Date(new Date(txn.txn_date).getTime() + 15*86400000).toISOString().slice(0,10))
        .order('entry_date', { ascending: false })
        .limit(50);
      setCandidates(data || []);
    })();
  }, [txn]);

  const contraOptions = useMemo(() => accounts.filter(a => a.is_active), [accounts]);

  async function save() {
    setSaving(true);
    if (mode === 'auto') {
      if (!contraId) { setSaving(false); toast.error('Choose a contra account'); return; }
      const { error } = await db.rpc('acc_create_journal_from_bank_transaction', {
        _txn_id: txn.id, _contra_account_id: contraId, _memo: memo,
      });
      setSaving(false);
      if (error) toast.error(error.message); else { toast.success('Journal posted & transaction matched'); onSaved(); }
    } else {
      if (!entryId) { setSaving(false); toast.error('Select a journal entry'); return; }
      const { error } = await db.rpc('acc_match_bank_transaction', { _txn_id: txn.id, _entry_id: entryId });
      setSaving(false);
      if (error) toast.error(error.message); else { toast.success('Matched'); onSaved(); }
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Match transaction</DialogTitle></DialogHeader>
        <div className="text-xs bg-muted/20 rounded-lg p-3 mb-3 space-y-1">
          <div className="flex justify-between"><span className="text-muted-foreground">{new Date(txn.txn_date).toLocaleDateString('en-GB')}</span>
            <span className={cn("font-mono font-bold", txn.amount >= 0 ? "text-ok" : "text-risk")}>{txn.amount >= 0 ? '+' : ''}{txn.amount.toFixed(2)}</span></div>
          <div className="text-foreground">{txn.description}</div>
        </div>

        <div className="flex gap-1 rounded-lg bg-card border border-border/60 p-1 mb-3">
          {(['auto','existing'] as const).map(k => (
            <button key={k} onClick={() => setMode(k)}
              className={cn("flex-1 px-3 h-8 text-[12px] rounded-lg font-medium transition-colors",
                mode === k ? "bg-foreground/[0.05] text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {k === 'auto' ? 'Auto-post journal' : 'Link existing entry'}
            </button>
          ))}
        </div>

        {mode === 'auto' ? (
          <div className="space-y-3">
            <div className="text-[11px] text-muted-foreground">Bank {txn.amount >= 0 ? 'debited' : 'credited'}. Choose the contra account.</div>
            <Field label="Contra account">
              <Select value={contraId} onValueChange={setContraId}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent className="max-h-72">{contraOptions.map(a => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Memo"><Input value={memo} onChange={e => setMemo(e.target.value)} /></Field>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[11px] text-muted-foreground">Showing posted entries within ±15 days. The bank line must exactly match this transaction's amount.</div>
            <div className="rounded-lg border border-border/60 max-h-64 overflow-auto">
              {candidates.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground text-center">No candidate entries in the window.</div>
              ) : candidates.map(c => (
                <button key={c.id} onClick={() => setEntryId(c.id)}
                  className={cn("w-full text-left px-3 py-2 text-xs border-b border-border/60 hover:bg-foreground/[0.025]",
                    entryId === c.id && "bg-primary/[0.06]")}>
                  <div className="flex justify-between">
                    <span>{new Date(c.entry_date).toLocaleDateString('en-GB')}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{c.source_type}</span>
                  </div>
                  <div className="text-muted-foreground truncate">{c.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={save}>
            {saving ? 'Working…' : mode === 'auto' ? 'Post & match' : 'Match'} <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- primitives ---------- */
function Th({ children, right }: any) { return <th className={cn("px-3 py-2 font-medium text-[10px] uppercase tracking-wider", right ? "text-right" : "text-left")}>{children}</th>; }
function Td({ children, right, mono, className }: any) { return <td className={cn("px-3 py-2", right && "text-right", mono && "font-mono", className)}>{children}</td>; }
function Field({ label, children }: any) {
  return <div><Label className="text-[11px] text-muted-foreground">{label}</Label><div className="mt-1">{children}</div></div>;
}
function Empty({ icon: Icon, title, hint }: any) {
  return (
    <div className="rounded-[10px] border border-dashed border-border/60 bg-card/30 p-10 flex flex-col items-center text-center">
      <Icon className="h-8 w-8 text-muted-foreground mb-2" />
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-1 max-w-sm">{hint}</div>
    </div>
  );
}

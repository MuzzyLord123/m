import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, FileSpreadsheet, Lock, CheckCircle2, Send, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SkeletonTable } from '@/components/platform';

interface Account { id: string; code: string; name: string; type: string; }
interface VatReturn {
  id: string; org_id: string;
  period_start: string; period_end: string;
  output_vat: number; input_vat: number; net_due: number;
  status: 'draft'|'submitted'|'paid'|'void';
  reference: string | null; notes: string | null;
  submitted_at: string | null; payment_date: string | null; payment_amount: number | null;
  submission_entry_id: string | null; payment_entry_id: string | null;
  created_at: string;
}
interface BankAcct { id: string; name: string; coa_account_id: string; }

function money(n: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(n || 0));
}
function todayISO() { return new Date().toISOString().slice(0,10); }
function firstOfQuarter() {
  const d = new Date(); const q = Math.floor(d.getMonth()/3); return new Date(d.getFullYear(), q*3, 1).toISOString().slice(0,10);
}
function lastOfQuarter() {
  const d = new Date(); const q = Math.floor(d.getMonth()/3); return new Date(d.getFullYear(), q*3+3, 0).toISOString().slice(0,10);
}

export default function VatView({ orgId, accounts, currency }: { orgId: string; accounts: Account[]; currency: string; }) {
  const [returns, setReturns] = useState<VatReturn[]>([]);
  const [banks, setBanks] = useState<BankAcct[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ period_start: firstOfQuarter(), period_end: lastOfQuarter(), reference: '', notes: '' });
  const [preview, setPreview] = useState<{ output: number; input: number; net: number } | null>(null);
  const [payDlg, setPayDlg] = useState<VatReturn | null>(null);
  const [payForm, setPayForm] = useState<{ bank_id: string; date: string; amount: string }>({ bank_id: '', date: todayISO(), amount: '' });

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [r, b] = await Promise.all([
      (supabase as any).from('acc_vat_returns').select('*').eq('org_id', orgId).order('period_end', { ascending: false }),
      (supabase as any).from('acc_bank_accounts').select('id,name,coa_account_id').eq('org_id', orgId).order('name'),
    ]);
    setReturns(r.data || []);
    setBanks(b.data || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Preview VAT for new-form dates
  useEffect(() => {
    if (!creating || !orgId) return;
    (async () => {
      const { data, error } = await (supabase as any).rpc('acc_calculate_vat', {
        _org_id: orgId, _start: newForm.period_start, _end: newForm.period_end,
      });
      if (error) { setPreview(null); return; }
      const row = Array.isArray(data) ? data[0] : data;
      setPreview({ output: Number(row?.output_vat || 0), input: Number(row?.input_vat || 0), net: Number(row?.net_due || 0) });
    })();
  }, [creating, orgId, newForm.period_start, newForm.period_end]);

  async function createReturn() {
    if (!newForm.period_start || !newForm.period_end) return;
    const { error } = await (supabase as any).from('acc_vat_returns').insert({
      org_id: orgId,
      period_start: newForm.period_start,
      period_end: newForm.period_end,
      output_vat: preview?.output ?? 0,
      input_vat: preview?.input ?? 0,
      net_due: preview?.net ?? 0,
      reference: newForm.reference || null,
      notes: newForm.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('VAT return draft created');
    setCreating(false);
    setNewForm({ period_start: firstOfQuarter(), period_end: lastOfQuarter(), reference: '', notes: '' });
    setPreview(null);
    refresh();
  }

  async function submitReturn(r: VatReturn) {
    setBusy(r.id);
    const { error } = await (supabase as any).rpc('acc_submit_vat_return', { _return_id: r.id });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success('VAT return submitted & posted to ledger');
    refresh();
  }

  async function payReturn() {
    if (!payDlg) return;
    const amt = parseFloat(payForm.amount);
    if (!payForm.bank_id || !amt || amt <= 0) { toast.error('Bank and amount required'); return; }
    setBusy(payDlg.id);
    const bank = banks.find(b => b.id === payForm.bank_id);
    const { error } = await (supabase as any).rpc('acc_pay_vat_return', {
      _return_id: payDlg.id,
      _bank_account_id: bank?.coa_account_id,
      _payment_date: payForm.date,
      _amount: amt,
    });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success('VAT payment recorded');
    setPayDlg(null);
    setPayForm({ bank_id: '', date: todayISO(), amount: '' });
    refresh();
  }

  const totals = useMemo(() => {
    const outstanding = returns.filter(r => r.status === 'submitted').reduce((s, r) => s + Math.max(0, Number(r.net_due || 0)), 0);
    return { outstanding, count: returns.length };
  }, [returns]);

  if (loading) {
    return <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card"><SkeletonTable cols={5} rows={6} /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">VAT / Sales Tax</h2>
          <p className="text-xs text-muted-foreground">
            {totals.count} return{totals.count === 1 ? '' : 's'} · Outstanding to pay {money(totals.outstanding, currency)}
          </p>
        </div>
        <Button size="sm" className="h-8 rounded-lg gap-1.5 text-xs" onClick={() => setCreating(v => !v)}>
          <Plus className="h-3.5 w-3.5" /> New return
        </Button>
      </div>

      {creating && (
        <div className="rounded-[10px] border border-border/60 bg-card p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px]">Period start</Label>
              <Input type="date" value={newForm.period_start} onChange={e => setNewForm(f => ({ ...f, period_start: e.target.value }))} className="h-9 rounded-lg mt-1" />
            </div>
            <div>
              <Label className="text-[11px]">Period end</Label>
              <Input type="date" value={newForm.period_end} onChange={e => setNewForm(f => ({ ...f, period_end: e.target.value }))} className="h-9 rounded-lg mt-1" />
            </div>
            <div>
              <Label className="text-[11px]">Reference (optional)</Label>
              <Input value={newForm.reference} onChange={e => setNewForm(f => ({ ...f, reference: e.target.value }))} placeholder="e.g. HMRC 2026-Q1" className="h-9 rounded-lg mt-1" />
            </div>
            <div>
              <Label className="text-[11px]">Notes (optional)</Label>
              <Input value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} className="h-9 rounded-lg mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-lg bg-background/50 border border-border/60 p-3">
            <PreviewCell label="Output VAT (sales)" value={money(preview?.output ?? 0, currency)} tone="revenue" />
            <PreviewCell label="Input VAT (purchases)" value={money(preview?.input ?? 0, currency)} tone="expense" />
            <PreviewCell label={(preview?.net ?? 0) >= 0 ? 'Net Payable' : 'Net Refund'} value={money(Math.abs(preview?.net ?? 0), currency)} tone={(preview?.net ?? 0) >= 0 ? 'due' : 'refund'} />
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setCreating(false)}>Cancel</Button>
            <Button size="sm" className="h-8 rounded-lg text-xs" onClick={createReturn}>Create draft</Button>
          </div>
        </div>
      )}

      {returns.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-border/60 py-16 text-center">
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No VAT returns yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first return above.</p>
        </div>
      ) : (
        <div className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-background/60 text-muted-foreground uppercase tracking-wider text-[10px]">
              <tr>
                <th className="text-left px-4 py-2.5">Period</th>
                <th className="text-right px-3 py-2.5">Output</th>
                <th className="text-right px-3 py-2.5">Input</th>
                <th className="text-right px-3 py-2.5">Net</th>
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-right px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {returns.map(r => (
                <tr key={r.id} className="hover:bg-background/40">
                  <td className="px-4 py-2.5">
                    <div className="font-medium">
                      {new Date(r.period_start).toLocaleDateString('en-GB')} → {new Date(r.period_end).toLocaleDateString('en-GB')}
                    </div>
                    {r.reference && <div className="text-[10px] text-muted-foreground mt-0.5">{r.reference}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{money(Number(r.output_vat), currency)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{money(Number(r.input_vat), currency)}</td>
                  <td className={cn("px-3 py-2.5 text-right tabular-nums font-semibold",
                    Number(r.net_due) >= 0 ? "text-attend" : "text-ok")}>
                    {Number(r.net_due) >= 0 ? '' : '−'}{money(Math.abs(Number(r.net_due)), currency)}
                  </td>
                  <td className="px-3 py-2.5"><StatusPill status={r.status} /></td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {r.status === 'draft' && (
                        <Button size="sm" variant="ghost" className="h-7 rounded-lg text-[11px] gap-1" disabled={busy === r.id} onClick={() => submitReturn(r)}>
                          {busy === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Submit
                        </Button>
                      )}
                      {r.status === 'submitted' && (
                        <Button size="sm" variant="ghost" className="h-7 rounded-lg text-[11px] gap-1"
                          onClick={() => { setPayDlg(r); setPayForm({ bank_id: banks[0]?.id || '', date: todayISO(), amount: Math.abs(Number(r.net_due)).toFixed(2) }); }}>
                          <Wallet className="h-3 w-3" /> {Number(r.net_due) >= 0 ? 'Record payment' : 'Record refund'}
                        </Button>
                      )}
                      {r.status === 'paid' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-ok font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Settled
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!payDlg} onOpenChange={(o) => { if (!o) setPayDlg(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {payDlg && Number(payDlg.net_due) >= 0 ? 'Record VAT payment' : 'Record VAT refund'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[11px]">Bank account</Label>
              <Select value={payForm.bank_id} onValueChange={v => setPayForm(f => ({ ...f, bank_id: v }))}>
                <SelectTrigger className="h-9 rounded-lg mt-1"><SelectValue placeholder="Select bank account" /></SelectTrigger>
                <SelectContent>
                  {banks.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No bank accounts. Add one in Banking.</div>}
                  {banks.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Date</Label>
                <Input type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} className="h-9 rounded-lg mt-1" />
              </div>
              <div>
                <Label className="text-[11px]">Amount</Label>
                <Input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} className="h-9 rounded-lg mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" onClick={() => setPayDlg(null)}>Cancel</Button>
            <Button size="sm" className="h-8 rounded-lg text-xs" onClick={payReturn} disabled={!!busy}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Post to ledger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewCell({ label, value, tone }: { label: string; value: string; tone: 'revenue'|'expense'|'due'|'refund' }) {
  const color = tone === 'revenue' ? 'text-primary' : tone === 'expense' ? 'text-risk' : tone === 'due' ? 'text-attend' : 'text-ok';
  return (
    <div>
      <div className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 font-mono text-base font-medium tabular-nums", color)}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: VatReturn['status'] }) {
  const map: Record<VatReturn['status'], { label: string; color: string; dot: string; icon?: any }> = {
    draft:     { label: 'Draft',     color: 'text-muted-foreground', dot: 'bg-muted-foreground/50' },
    submitted: { label: 'Submitted', color: 'text-attend', dot: 'bg-attend' },
    paid:      { label: 'Paid',      color: 'text-ok', dot: 'bg-ok', icon: Lock },
    void:      { label: 'Void',      color: 'text-risk', dot: 'bg-risk' },
  };
  const s = map[status];
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10.5px] font-medium", s.color)}>
      <span aria-hidden className={cn("inline-block h-1.5 w-1.5 rounded-full", s.dot)} />
      {Icon && <Icon className="h-2.5 w-2.5" />}{s.label}
    </span>
  );
}

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Users, CalendarDays, Send, Wallet, Trash2, Lock, CheckCircle2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SkeletonTable } from '@/components/platform';

interface Employee {
  id: string; org_id: string;
  full_name: string; email: string | null; job_title: string | null;
  tax_code: string | null; ni_number: string | null;
  pay_type: 'salary'|'hourly'; pay_rate: number; default_hours: number;
  employment_start: string | null; employment_end: string | null;
  is_active: boolean;
}
interface PayRun {
  id: string; org_id: string;
  period_start: string; period_end: string; pay_date: string;
  reference: string | null; status: 'draft'|'posted'|'paid'|'void';
  total_gross: number; total_paye: number; total_ni_ee: number; total_ni_er: number;
  total_pension: number; total_other_ded: number; total_net: number;
  posted_at: string | null; paid_at: string | null;
}
interface Payslip {
  id: string; pay_run_id: string; employee_id: string;
  hours: number; gross: number; paye: number; ni_ee: number; ni_er: number;
  pension: number; other_ded: number; net: number;
}
interface BankAcct { id: string; name: string; coa_account_id: string; }

function money(n: number, c = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: c, minimumFractionDigits: 2 }).format(Number(n || 0));
}
function todayISO() { return new Date().toISOString().slice(0,10); }
function firstOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); }
function lastOfMonth() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10); }

export default function PayrollView({ orgId, currency }: { orgId: string; currency: string; }) {
  const [tab, setTab] = useState<'runs'|'employees'>('runs');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [runs, setRuns] = useState<PayRun[]>([]);
  const [banks, setBanks] = useState<BankAcct[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRun, setOpenRun] = useState<PayRun | null>(null);
  const [addEmp, setAddEmp] = useState(false);
  const [newRun, setNewRun] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [e, r, b] = await Promise.all([
      (supabase as any).from('acc_employees').select('*').eq('org_id', orgId).order('full_name'),
      (supabase as any).from('acc_pay_runs').select('*').eq('org_id', orgId).order('period_end', { ascending: false }),
      (supabase as any).from('acc_bank_accounts').select('id,name,coa_account_id').eq('org_id', orgId).order('name'),
    ]);
    setEmployees(e.data || []);
    setRuns(r.data || []);
    setBanks(b.data || []);
    setLoading(false);
  }, [orgId]);
  useEffect(() => { refresh(); }, [refresh]);

  if (loading) return <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card"><SkeletonTable cols={5} rows={6} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Payroll</h2>
          <p className="text-xs text-muted-foreground">{employees.filter(e => e.is_active).length} active employees · {runs.length} pay run{runs.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex gap-2">
          {tab === 'employees' && (
            <Button size="sm" className="h-8 rounded-lg gap-1.5 text-xs" onClick={() => setAddEmp(true)}>
              <UserPlus className="h-3.5 w-3.5" /> Add employee
            </Button>
          )}
          {tab === 'runs' && (
            <Button size="sm" className="h-8 rounded-lg gap-1.5 text-xs" onClick={() => setNewRun(true)} disabled={employees.filter(e => e.is_active).length === 0}>
              <Plus className="h-3.5 w-3.5" /> New pay run
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border/60">
        {(['runs','employees'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 h-8 text-[11px] font-medium border-b-2 transition-colors capitalize",
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t === 'runs' ? <><CalendarDays className="h-3 w-3 inline mr-1" />Pay Runs</> : <><Users className="h-3 w-3 inline mr-1" />Employees</>}
          </button>
        ))}
      </div>

      {tab === 'runs' && <PayRunsList runs={runs} currency={currency} onOpen={setOpenRun} />}
      {tab === 'employees' && <EmployeesList employees={employees} currency={currency} onChange={refresh} />}

      {addEmp && <EmployeeDialog orgId={orgId} onClose={() => setAddEmp(false)} onSaved={() => { setAddEmp(false); refresh(); }} />}
      {newRun && <NewRunDialog orgId={orgId} employees={employees.filter(e => e.is_active)} onClose={() => setNewRun(false)} onCreated={() => { setNewRun(false); refresh(); }} />}
      {openRun && (
        <PayRunEditor run={openRun} orgId={orgId} employees={employees} banks={banks} currency={currency}
          busy={busy} setBusy={setBusy}
          onClose={() => setOpenRun(null)}
          onChanged={async () => { await refresh(); const fresh = (await (supabase as any).from('acc_pay_runs').select('*').eq('id', openRun.id).maybeSingle()).data; setOpenRun(fresh || null); }} />
      )}
    </div>
  );
}

/* ---------- Employees ---------- */
function EmployeesList({ employees, currency, onChange }: { employees: Employee[]; currency: string; onChange: () => void }) {
  async function toggleActive(e: Employee) {
    const { error } = await (supabase as any).from('acc_employees').update({ is_active: !e.is_active }).eq('id', e.id);
    if (error) { toast.error(error.message); return; }
    onChange();
  }
  if (employees.length === 0) {
    return <div className="rounded-[10px] border border-dashed border-border/60 py-16 text-center">
      <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">No employees yet</p>
    </div>;
  }
  return (
    <div className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-background/60 text-muted-foreground uppercase tracking-wider text-[10px]">
          <tr>
            <th className="text-left px-4 py-2.5">Employee</th>
            <th className="text-left px-3 py-2.5">Tax code</th>
            <th className="text-left px-3 py-2.5">Type</th>
            <th className="text-right px-3 py-2.5">Rate</th>
            <th className="text-right px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {employees.map(e => (
            <tr key={e.id} className="hover:bg-background/40">
              <td className="px-4 py-2.5">
                <div className="font-medium">{e.full_name}</div>
                <div className="text-[10px] text-muted-foreground">{e.job_title || '–'} · {e.email || ''}</div>
              </td>
              <td className="px-3 py-2.5 font-mono text-[11px]">{e.tax_code || '–'}</td>
              <td className="px-3 py-2.5 capitalize">{e.pay_type}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{money(Number(e.pay_rate), currency)}{e.pay_type === 'hourly' && '/hr'}</td>
              <td className="px-4 py-2.5 text-right">
                <button onClick={() => toggleActive(e)}
                  className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium",
                    e.is_active ? "bg-ok/15 text-ok" : "bg-muted text-muted-foreground")}>
                  {e.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmployeeDialog({ orgId, onClose, onSaved }: { orgId: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ full_name: '', email: '', job_title: '', tax_code: '', ni_number: '', pay_type: 'salary' as 'salary'|'hourly', pay_rate: '', default_hours: '' });
  async function save() {
    if (!f.full_name.trim()) { toast.error('Name required'); return; }
    const { error } = await (supabase as any).from('acc_employees').insert({
      org_id: orgId,
      full_name: f.full_name.trim(),
      email: f.email || null,
      job_title: f.job_title || null,
      tax_code: f.tax_code || null,
      ni_number: f.ni_number || null,
      pay_type: f.pay_type,
      pay_rate: parseFloat(f.pay_rate) || 0,
      default_hours: parseFloat(f.default_hours) || 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Employee added');
    onSaved();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="text-sm">New employee</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-[11px]">Full name</Label>
            <Input value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Email</Label>
            <Input value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Job title</Label>
            <Input value={f.job_title} onChange={e => setF({ ...f, job_title: e.target.value })} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Tax code</Label>
            <Input value={f.tax_code} onChange={e => setF({ ...f, tax_code: e.target.value })} placeholder="1257L" className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">NI number</Label>
            <Input value={f.ni_number} onChange={e => setF({ ...f, ni_number: e.target.value })} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Pay type</Label>
            <Select value={f.pay_type} onValueChange={(v: any) => setF({ ...f, pay_type: v })}>
              <SelectTrigger className="h-9 rounded-lg mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">Salary (per period)</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
              </SelectContent>
            </Select></div>
          <div><Label className="text-[11px]">{f.pay_type === 'salary' ? 'Monthly salary' : 'Hourly rate'}</Label>
            <Input type="number" step="0.01" value={f.pay_rate} onChange={e => setF({ ...f, pay_rate: e.target.value })} className="h-9 rounded-lg mt-1" /></div>
          {f.pay_type === 'hourly' && (
            <div><Label className="text-[11px]">Default hours / period</Label>
              <Input type="number" step="0.01" value={f.default_hours} onChange={e => setF({ ...f, default_hours: e.target.value })} className="h-9 rounded-lg mt-1" /></div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-lg text-xs" onClick={save}>Add employee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Pay runs ---------- */
function PayRunsList({ runs, currency, onOpen }: { runs: PayRun[]; currency: string; onOpen: (r: PayRun) => void }) {
  if (runs.length === 0) {
    return <div className="rounded-[10px] border border-dashed border-border/60 py-16 text-center">
      <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">No pay runs yet</p>
    </div>;
  }
  return (
    <div className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-background/60 text-muted-foreground uppercase tracking-wider text-[10px]">
          <tr>
            <th className="text-left px-4 py-2.5">Period</th>
            <th className="text-left px-3 py-2.5">Pay date</th>
            <th className="text-right px-3 py-2.5">Gross</th>
            <th className="text-right px-3 py-2.5">Deductions</th>
            <th className="text-right px-3 py-2.5">Net</th>
            <th className="text-left px-3 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {runs.map(r => {
            const ded = Number(r.total_paye)+Number(r.total_ni_ee)+Number(r.total_pension)+Number(r.total_other_ded);
            return (
              <tr key={r.id} className="hover:bg-background/40 cursor-pointer" onClick={() => onOpen(r)}>
                <td className="px-4 py-2.5 font-medium">
                  {new Date(r.period_start).toLocaleDateString('en-GB')} → {new Date(r.period_end).toLocaleDateString('en-GB')}
                  {r.reference && <div className="text-[10px] text-muted-foreground mt-0.5">{r.reference}</div>}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{new Date(r.pay_date).toLocaleDateString('en-GB')}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(Number(r.total_gross), currency)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-attend">{money(ded, currency)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-ok">{money(Number(r.total_net), currency)}</td>
                <td className="px-3 py-2.5"><RunStatus s={r.status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RunStatus({ s }: { s: PayRun['status'] }) {
  const map: Record<PayRun['status'], { l: string; c: string; i?: any }> = {
    draft:  { l: 'Draft',  c: 'bg-muted text-muted-foreground' },
    posted: { l: 'Posted', c: 'bg-attend/15 text-attend', i: Lock },
    paid:   { l: 'Paid',   c: 'bg-ok/15 text-ok', i: CheckCircle2 },
    void:   { l: 'Void',   c: 'bg-risk/15 text-risk' },
  };
  const x = map[s]; const I = x.i;
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", x.c)}>{I && <I className="h-2.5 w-2.5" />}{x.l}</span>;
}

function NewRunDialog({ orgId, employees, onClose, onCreated }: { orgId: string; employees: Employee[]; onClose: () => void; onCreated: () => void }) {
  const [f, setF] = useState({ period_start: firstOfMonth(), period_end: lastOfMonth(), pay_date: lastOfMonth(), reference: '' });
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    const { data, error } = await (supabase as any).from('acc_pay_runs')
      .insert({ org_id: orgId, ...f, reference: f.reference || null })
      .select().single();
    if (error) { setBusy(false); toast.error(error.message); return; }
    // Seed payslips with default gross/net from employees
    const rows = employees.map(e => {
      const hours = e.pay_type === 'hourly' ? Number(e.default_hours || 0) : 0;
      const gross = e.pay_type === 'hourly' ? hours * Number(e.pay_rate) : Number(e.pay_rate);
      return {
        org_id: orgId, pay_run_id: data.id, employee_id: e.id,
        hours, gross, paye: 0, ni_ee: 0, ni_er: 0, pension: 0, other_ded: 0, net: gross,
      };
    });
    if (rows.length > 0) {
      const { error: err2 } = await (supabase as any).from('acc_payslips').insert(rows);
      if (err2) { toast.error(err2.message); }
      await (supabase as any).rpc('acc_recalc_pay_run', { _pay_run_id: data.id });
    }
    setBusy(false);
    toast.success('Pay run created. Edit payslips before posting');
    onCreated();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-sm">New pay run</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-[11px]">Period start</Label><Input type="date" value={f.period_start} onChange={e => setF({ ...f, period_start: e.target.value })} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Period end</Label><Input type="date" value={f.period_end} onChange={e => setF({ ...f, period_end: e.target.value })} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Pay date</Label><Input type="date" value={f.pay_date} onChange={e => setF({ ...f, pay_date: e.target.value })} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Reference</Label><Input value={f.reference} onChange={e => setF({ ...f, reference: e.target.value })} placeholder="e.g. 2026-M01" className="h-9 rounded-lg mt-1" /></div>
        </div>
        <p className="text-[11px] text-muted-foreground">Will create draft payslips for {employees.length} active employee{employees.length===1?'':'s'}.</p>
        <DialogFooter>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-lg text-xs" onClick={create} disabled={busy}>{busy && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayRunEditor({ run, orgId, employees, banks, currency, busy, setBusy, onClose, onChanged }: {
  run: PayRun; orgId: string; employees: Employee[]; banks: BankAcct[]; currency: string;
  busy: string | null; setBusy: (v: string | null) => void;
  onClose: () => void; onChanged: () => Promise<void>;
}) {
  const [slips, setSlips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [payDlg, setPayDlg] = useState(false);
  const [payForm, setPayForm] = useState({ bank_id: '', date: todayISO() });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('acc_payslips').select('*').eq('pay_run_id', run.id).order('created_at');
    setSlips(data || []);
    setLoading(false);
  }, [run.id]);
  useEffect(() => { load(); }, [load]);

  const editable = run.status === 'draft';
  const empMap = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])), [employees]);

  function updateSlipLocal(id: string, patch: Partial<Payslip>) {
    setSlips(prev => prev.map(s => {
      if (s.id !== id) return s;
      const next = { ...s, ...patch };
      const gross = Number(next.gross) || 0;
      const ded = (Number(next.paye)||0) + (Number(next.ni_ee)||0) + (Number(next.pension)||0) + (Number(next.other_ded)||0);
      next.net = Math.max(0, gross - ded);
      return next;
    }));
  }

  async function saveSlip(s: Payslip) {
    const { error } = await (supabase as any).from('acc_payslips').update({
      hours: s.hours, gross: s.gross, paye: s.paye, ni_ee: s.ni_ee, ni_er: s.ni_er,
      pension: s.pension, other_ded: s.other_ded, net: s.net,
    }).eq('id', s.id);
    if (error) { toast.error(error.message); return; }
    await (supabase as any).rpc('acc_recalc_pay_run', { _pay_run_id: run.id });
    onChanged();
  }

  async function post() {
    setBusy(run.id);
    // save all first
    for (const s of slips) {
      await (supabase as any).from('acc_payslips').update({
        hours: s.hours, gross: s.gross, paye: s.paye, ni_ee: s.ni_ee, ni_er: s.ni_er,
        pension: s.pension, other_ded: s.other_ded, net: s.net,
      }).eq('id', s.id);
    }
    const { error } = await (supabase as any).rpc('acc_post_pay_run', { _pay_run_id: run.id });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Pay run posted to ledger');
    onChanged();
  }

  async function pay() {
    if (!payForm.bank_id) { toast.error('Bank required'); return; }
    const bank = banks.find(b => b.id === payForm.bank_id);
    setBusy(run.id);
    const { error } = await (supabase as any).rpc('acc_pay_pay_run', {
      _pay_run_id: run.id, _bank_account_id: bank?.coa_account_id, _payment_date: payForm.date,
    });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Net wages paid');
    setPayDlg(false);
    onChanged();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            Pay run: {new Date(run.period_start).toLocaleDateString('en-GB')} → {new Date(run.period_end).toLocaleDateString('en-GB')}
            <RunStatus s={run.status} />
          </DialogTitle>
        </DialogHeader>

        {loading ? <SkeletonTable cols={4} rows={4} /> : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-background/60 text-muted-foreground uppercase tracking-wider text-[10px] sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Employee</th>
                  <th className="text-right px-2 py-2">Hours</th>
                  <th className="text-right px-2 py-2">Gross</th>
                  <th className="text-right px-2 py-2">PAYE</th>
                  <th className="text-right px-2 py-2">NI (ee)</th>
                  <th className="text-right px-2 py-2">NI (er)</th>
                  <th className="text-right px-2 py-2">Pension</th>
                  <th className="text-right px-2 py-2">Other</th>
                  <th className="text-right px-2 py-2">Net</th>
                  <th className="text-right px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {slips.map(s => (
                  <tr key={s.id}>
                    <td className="px-3 py-1.5 font-medium">{empMap[s.employee_id]?.full_name || '–'}</td>
                    {(['hours','gross','paye','ni_ee','ni_er','pension','other_ded'] as const).map(k => (
                      <td key={k} className="px-1 py-1.5">
                        <Input type="number" step="0.01" value={Number((s as any)[k])} disabled={!editable}
                          onChange={e => updateSlipLocal(s.id, { [k]: parseFloat(e.target.value) || 0 } as any)}
                          onBlur={() => editable && saveSlip(s)}
                          className="h-7 rounded-md text-right tabular-nums text-[11px]" />
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-right tabular-nums font-semibold text-ok">{money(Number(s.net), currency)}</td>
                    <td className="px-2 py-1.5 text-right">
                      {editable && (
                        <button className="text-muted-foreground hover:text-risk" onClick={async () => {
                          if (!confirm('Remove this payslip?')) return;
                          await (supabase as any).from('acc_payslips').delete().eq('id', s.id);
                          await (supabase as any).rpc('acc_recalc_pay_run', { _pay_run_id: run.id });
                          load(); onChanged();
                        }}><Trash2 className="h-3 w-3" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-background/60 font-semibold">
                <tr>
                  <td className="px-3 py-2 text-[10px] uppercase text-muted-foreground">Totals</td>
                  <td></td>
                  <td className="px-2 py-2 text-right tabular-nums">{money(Number(run.total_gross), currency)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{money(Number(run.total_paye), currency)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{money(Number(run.total_ni_ee), currency)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{money(Number(run.total_ni_er), currency)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{money(Number(run.total_pension), currency)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{money(Number(run.total_other_ded), currency)}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-ok">{money(Number(run.total_net), currency)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <DialogFooter className="border-t border-border/60 pt-3">
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={onClose}>Close</Button>
          {run.status === 'draft' && (
            <Button size="sm" className="h-8 rounded-lg text-xs gap-1" onClick={post} disabled={busy === run.id}>
              {busy === run.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Post to ledger
            </Button>
          )}
          {run.status === 'posted' && (
            <Button size="sm" className="h-8 rounded-lg text-xs gap-1" onClick={() => { setPayForm({ bank_id: banks[0]?.id || '', date: todayISO() }); setPayDlg(true); }}>
              <Wallet className="h-3 w-3" /> Pay net wages
            </Button>
          )}
        </DialogFooter>

        <Dialog open={payDlg} onOpenChange={(o) => !o && setPayDlg(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-sm">Pay net wages</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-[11px]">Bank account</Label>
                <Select value={payForm.bank_id} onValueChange={v => setPayForm(f => ({ ...f, bank_id: v }))}>
                  <SelectTrigger className="h-9 rounded-lg mt-1"><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>
                    {banks.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">Add a bank in Banking first.</div>}
                    {banks.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px]">Payment date</Label>
                <Input type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} className="h-9 rounded-lg mt-1" />
              </div>
              <p className="text-[11px] text-muted-foreground">Will post {money(Number(run.total_net), currency)} from the selected bank against Net Wages Payable.</p>
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setPayDlg(false)}>Cancel</Button>
              <Button size="sm" className="h-8 rounded-lg text-xs" onClick={pay} disabled={busy === run.id}>Post payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

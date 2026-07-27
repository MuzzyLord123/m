import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Send, XCircle, Wallet, Truck, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SubTab = 'bills' | 'suppliers' | 'aging';

interface Account { id: string; code: string; name: string; type: string; is_active: boolean; }
interface Supplier {
  id: string; org_id: string; name: string; email: string | null; phone: string | null;
  currency: string; is_active: boolean;
  default_ap_account_id: string | null; default_expense_account_id: string | null;
}
interface Bill {
  id: string; org_id: string; supplier_id: string; bill_number: string; supplier_reference: string | null;
  bill_date: string; due_date: string | null;
  subtotal: number; tax_total: number; total: number; amount_paid: number;
  status: 'draft'|'posted'|'paid'|'void'; currency: string; notes: string | null;
}
interface BillLine {
  id?: string; bill_id?: string; line_no: number; description: string;
  quantity: number; unit_price: number; tax_rate: number;
  line_subtotal: number; line_tax: number; line_total: number;
  expense_account_id: string | null;
}
interface AgingRow {
  bill_id: string; bill_number: string; supplier_name: string;
  bill_date: string; due_date: string | null;
  total: number; amount_paid: number; balance: number;
  days_overdue: number; bucket: 'current'|'1-30'|'31-60'|'61-90'|'90+';
}

const STATUS_COLORS: Record<string, string> = {
  draft:  '#94a3b8',
  posted: '#f59e0b',
  paid:   '#10b981',
  void:   '#ef4444',
};

const BUCKET_COLORS: Record<string, string> = {
  current: '#10b981',
  '1-30':  '#3b82f6',
  '31-60': '#f59e0b',
  '61-90': '#f97316',
  '90+':   '#ef4444',
};

function money(n: number, c = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: c, minimumFractionDigits: 2 }).format(Number(n || 0));
}

const db = supabase as any;

export default function AccountsPayableView({
  orgId, accounts, currency,
}: { orgId: string; accounts: Account[]; currency: string; }) {
  const [sub, setSub] = useState<SubTab>('bills');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [aging, setAging] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showBillModal, setShowBillModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<Bill | null>(null);

  const expenseAccounts = useMemo(() => accounts.filter(a => a.type === 'expense' && a.is_active), [accounts]);
  const bankAccounts    = useMemo(() => accounts.filter(a => a.code.startsWith('10') && a.is_active), [accounts]);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [s, b, a] = await Promise.all([
      db.from('acc_suppliers').select('*').eq('org_id', orgId).order('name'),
      db.from('acc_ap_bills').select('*').eq('org_id', orgId).order('bill_date', { ascending: false }).limit(500),
      db.from('acc_ap_aging').select('*').eq('org_id', orgId).order('days_overdue', { ascending: false }),
    ]);
    setSuppliers(s.data || []);
    setBills(b.data || []);
    setAging(a.data || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { refresh(); }, [refresh]);

  const totals = useMemo(() => {
    const outstanding = bills.filter(b => b.status === 'posted').reduce((s, b) => s + (Number(b.total) - Number(b.amount_paid)), 0);
    const overdue = aging.filter(a => a.bucket !== 'current').reduce((s, a) => s + Number(a.balance), 0);
    const paid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + Number(b.total), 0);
    return { outstanding, overdue, paid, count: bills.length };
  }, [bills, aging]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Outstanding"    value={money(totals.outstanding, currency)} color="#f59e0b" icon={Wallet} />
        <KpiCard label="Overdue"        value={money(totals.overdue, currency)}     color="#ef4444" icon={XCircle} />
        <KpiCard label="Paid (all-time)" value={money(totals.paid, currency)}       color="#10b981" icon={CheckCircle2} />
        <KpiCard label="Total bills"    value={String(totals.count)}                color="#8b5cf6" icon={FileText} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-card/60 border border-border/30 p-1">
          {(['bills','suppliers','aging'] as SubTab[]).map(k => (
            <button key={k} onClick={() => setSub(k)}
              className={cn(
                "px-3 h-8 text-[12px] rounded-lg font-medium capitalize transition-colors",
                sub === k ? "bg-brand/15 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>{k}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {sub === 'bills' && (
            <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs"
              onClick={() => setShowBillModal(true)}
              disabled={suppliers.length === 0}>
              <Plus className="h-3.5 w-3.5" /> New bill
            </Button>
          )}
          {sub === 'suppliers' && (
            <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => setShowSupplierModal(true)}>
              <Plus className="h-3.5 w-3.5" /> New supplier
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : sub === 'bills' ? (
        <BillsTable
          bills={bills}
          suppliers={suppliers}
          currency={currency}
          onPost={async (id) => { const { error } = await db.rpc('acc_post_ap_bill', { _bill_id: id }); if (error) toast.error(error.message); else { toast.success('Bill posted to ledger'); refresh(); } }}
          onVoid={async (id) => { if (!confirm('Void this bill? A reversal entry will be posted.')) return; const { error } = await db.rpc('acc_void_ap_bill', { _bill_id: id }); if (error) toast.error(error.message); else { toast.success('Bill voided'); refresh(); } }}
          onDelete={async (id) => { if (!confirm('Delete this draft bill?')) return; const { error } = await db.from('acc_ap_bills').delete().eq('id', id); if (error) toast.error(error.message); else { toast.success('Deleted'); refresh(); } }}
          onPay={(bill) => setShowPayModal(bill)}
        />
      ) : sub === 'suppliers' ? (
        <SuppliersTable suppliers={suppliers} onChange={refresh} />
      ) : (
        <AgingTable rows={aging} currency={currency} />
      )}

      {showBillModal && (
        <BillModal
          orgId={orgId}
          suppliers={suppliers}
          expenseAccounts={expenseAccounts}
          currency={currency}
          onClose={() => setShowBillModal(false)}
          onSaved={() => { setShowBillModal(false); refresh(); }}
        />
      )}
      {showSupplierModal && (
        <SupplierModal
          orgId={orgId}
          accounts={accounts}
          onClose={() => setShowSupplierModal(false)}
          onSaved={() => { setShowSupplierModal(false); refresh(); }}
        />
      )}
      {showPayModal && (
        <PaymentModal
          bill={showPayModal}
          bankAccounts={bankAccounts}
          currency={currency}
          onClose={() => setShowPayModal(null)}
          onSaved={() => { setShowPayModal(null); refresh(); }}
        />
      )}
    </div>
  );
}

/* ---------- KPI ---------- */
function KpiCard({ label, value, color, icon: Icon }: any) {
  return (
    <div className="p-4 rounded-2xl bg-card/60 border border-border/20">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold tracking-tight">{value}</div>
    </div>
  );
}

/* ---------- Bills ---------- */
function BillsTable({ bills, suppliers, currency, onPost, onVoid, onDelete, onPay }: {
  bills: Bill[]; suppliers: Supplier[]; currency: string;
  onPost: (id: string) => void; onVoid: (id: string) => void; onDelete: (id: string) => void; onPay: (b: Bill) => void;
}) {
  const smap = useMemo(() => Object.fromEntries(suppliers.map(s => [s.id, s.name])), [suppliers]);
  if (bills.length === 0) {
    return <Empty icon={Wallet} title="No bills yet" hint={suppliers.length === 0 ? 'Add a supplier first, then enter your first bill.' : 'Click "New bill" to record supplier bills.'} />;
  }
  return (
    <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/20 text-muted-foreground">
          <tr>
            <Th>Bill #</Th><Th>Supplier</Th><Th>Date</Th><Th>Due</Th>
            <Th right>Total</Th><Th right>Paid</Th><Th right>Balance</Th>
            <Th>Status</Th><Th right>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {bills.map(b => {
            const bal = Number(b.total) - Number(b.amount_paid);
            return (
              <tr key={b.id} className="border-t border-border/20 hover:bg-muted/10">
                <Td mono>{b.bill_number}</Td>
                <Td>{smap[b.supplier_id] || '—'}</Td>
                <Td>{new Date(b.bill_date).toLocaleDateString('en-GB')}</Td>
                <Td>{b.due_date ? new Date(b.due_date).toLocaleDateString('en-GB') : '—'}</Td>
                <Td right>{money(b.total, b.currency || currency)}</Td>
                <Td right>{money(b.amount_paid, b.currency || currency)}</Td>
                <Td right>{money(bal, b.currency || currency)}</Td>
                <Td>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider"
                    style={{ background: `${STATUS_COLORS[b.status]}20`, color: STATUS_COLORS[b.status] }}>
                    {b.status}
                  </span>
                </Td>
                <Td right>
                  <div className="flex gap-1 justify-end">
                    {b.status === 'draft' && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => onPost(b.id)}>
                          <Send className="h-3 w-3" /> Post
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={() => onDelete(b.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {b.status === 'posted' && bal > 0 && (
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => onPay(b)}>
                        <Wallet className="h-3 w-3" /> Pay
                      </Button>
                    )}
                    {(b.status === 'posted' || b.status === 'paid') && b.amount_paid === 0 && (
                      <Button size="sm" variant="ghost" className="h-7 text-[11px] text-red-500" onClick={() => onVoid(b.id)}>
                        <XCircle className="h-3 w-3" /> Void
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Suppliers ---------- */
function SuppliersTable({ suppliers, onChange }: { suppliers: Supplier[]; onChange: () => void }) {
  if (suppliers.length === 0) return <Empty icon={Truck} title="No suppliers" hint='Click "New supplier" to add one.' />;
  return (
    <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/20 text-muted-foreground">
          <tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Currency</Th><Th right>Active</Th><Th right>Actions</Th></tr>
        </thead>
        <tbody>
          {suppliers.map(s => (
            <tr key={s.id} className="border-t border-border/20 hover:bg-muted/10">
              <Td>{s.name}</Td>
              <Td>{s.email || '—'}</Td>
              <Td>{s.phone || '—'}</Td>
              <Td>{s.currency}</Td>
              <Td right>
                <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium uppercase",
                  s.is_active ? "bg-emerald-500/15 text-emerald-500" : "bg-muted/30 text-muted-foreground")}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </Td>
              <Td right>
                <Button size="sm" variant="ghost" className="h-7 text-red-500"
                  onClick={async () => {
                    if (!confirm('Delete supplier?')) return;
                    const { error } = await db.from('acc_suppliers').delete().eq('id', s.id);
                    if (error) toast.error(error.message); else { toast.success('Deleted'); onChange(); }
                  }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Aging ---------- */
function AgingTable({ rows, currency }: { rows: AgingRow[]; currency: string }) {
  const buckets = useMemo(() => {
    const b: Record<string, number> = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    for (const r of rows) b[r.bucket] += Number(r.balance);
    return b;
  }, [rows]);
  if (rows.length === 0) return <Empty icon={FileText} title="No outstanding bills" hint="All supplier bills are settled." />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {(['current','1-30','31-60','61-90','90+'] as const).map(k => (
          <div key={k} className="p-3 rounded-xl border border-border/30 bg-card/40">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k === 'current' ? 'Current' : `${k} days`}</div>
            <div className="text-sm font-bold mt-1" style={{ color: BUCKET_COLORS[k] }}>{money(buckets[k], currency)}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/20 text-muted-foreground">
            <tr><Th>Bill #</Th><Th>Supplier</Th><Th>Due</Th><Th right>Balance</Th><Th right>Days overdue</Th><Th>Bucket</Th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.bill_id} className="border-t border-border/20 hover:bg-muted/10">
                <Td mono>{r.bill_number}</Td>
                <Td>{r.supplier_name}</Td>
                <Td>{r.due_date ? new Date(r.due_date).toLocaleDateString('en-GB') : '—'}</Td>
                <Td right>{money(r.balance, currency)}</Td>
                <Td right>{r.days_overdue}</Td>
                <Td>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase"
                    style={{ background: `${BUCKET_COLORS[r.bucket]}20`, color: BUCKET_COLORS[r.bucket] }}>
                    {r.bucket}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Modals ---------- */
function SupplierModal({ orgId, accounts, onClose, onSaved }: {
  orgId: string; accounts: Account[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', currency: 'GBP', default_ap_account_id: '', default_expense_account_id: '' });
  const [saving, setSaving] = useState(false);
  const apAccounts  = accounts.filter(a => a.type === 'liability' && a.code.startsWith('20'));
  const expAccounts = accounts.filter(a => a.type === 'expense');
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New supplier</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Name *"><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Email"><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></Field>
          </div>
          <Field label="Currency">
            <Select value={form.currency} onValueChange={v => setForm({...form, currency: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['GBP','USD','EUR','AUD','CAD'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Default AP account (optional)">
            <Select value={form.default_ap_account_id} onValueChange={v => setForm({...form, default_ap_account_id: v})}>
              <SelectTrigger><SelectValue placeholder="2000 Accounts Payable" /></SelectTrigger>
              <SelectContent>{apAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Default expense account (optional)">
            <Select value={form.default_expense_account_id} onValueChange={v => setForm({...form, default_expense_account_id: v})}>
              <SelectTrigger><SelectValue placeholder="6900 Other Expenses" /></SelectTrigger>
              <SelectContent>{expAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!form.name.trim() || saving} onClick={async () => {
            setSaving(true);
            const payload: any = { org_id: orgId, name: form.name.trim(), currency: form.currency };
            if (form.email) payload.email = form.email;
            if (form.phone) payload.phone = form.phone;
            if (form.default_ap_account_id) payload.default_ap_account_id = form.default_ap_account_id;
            if (form.default_expense_account_id) payload.default_expense_account_id = form.default_expense_account_id;
            const { error } = await db.from('acc_suppliers').insert(payload);
            setSaving(false);
            if (error) toast.error(error.message); else { toast.success('Supplier created'); onSaved(); }
          }}>{saving ? 'Saving…' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BillModal({ orgId, suppliers, expenseAccounts, currency, onClose, onSaved }: {
  orgId: string; suppliers: Supplier[]; expenseAccounts: Account[]; currency: string;
  onClose: () => void; onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [billNumber, setBillNumber] = useState('');
  const [supplierRef, setSupplierRef] = useState('');
  const [billDate, setBillDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<BillLine[]>([blankLine(1, expenseAccounts[0]?.id ?? null)]);
  const [saving, setSaving] = useState(false);

  function blankLine(no: number, exp: string | null): BillLine {
    return { line_no: no, description: '', quantity: 1, unit_price: 0, tax_rate: 0.20, line_subtotal: 0, line_tax: 0, line_total: 0, expense_account_id: exp };
  }

  function updateLine(idx: number, patch: Partial<BillLine>) {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const merged = { ...l, ...patch };
      const sub = Number(merged.quantity || 0) * Number(merged.unit_price || 0);
      const tax = sub * Number(merged.tax_rate || 0);
      return { ...merged, line_subtotal: round2(sub), line_tax: round2(tax), line_total: round2(sub + tax) };
    }));
  }

  const totals = useMemo(() => {
    const subtotal  = lines.reduce((s, l) => s + Number(l.line_subtotal || 0), 0);
    const tax_total = lines.reduce((s, l) => s + Number(l.line_tax || 0), 0);
    return { subtotal: round2(subtotal), tax_total: round2(tax_total), total: round2(subtotal + tax_total) };
  }, [lines]);

  async function save(andPost: boolean) {
    if (!supplierId) { toast.error('Select a supplier'); return; }
    if (!billNumber.trim()) { toast.error('Bill number required'); return; }
    if (lines.length === 0 || totals.total <= 0) { toast.error('Add at least one line with an amount'); return; }
    setSaving(true);
    const { data: bill, error } = await db.from('acc_ap_bills').insert({
      org_id: orgId, supplier_id: supplierId, bill_number: billNumber.trim(),
      supplier_reference: supplierRef || null,
      bill_date: billDate, due_date: dueDate || null,
      subtotal: totals.subtotal, tax_total: totals.tax_total, total: totals.total,
      currency, notes: notes || null, status: 'draft',
    }).select().single();
    if (error || !bill) { setSaving(false); toast.error(error?.message || 'Failed'); return; }

    const linesPayload = lines.map((l, idx) => ({
      bill_id: bill.id, line_no: idx + 1,
      description: l.description || 'Item',
      quantity: l.quantity, unit_price: l.unit_price, tax_rate: l.tax_rate,
      line_subtotal: l.line_subtotal, line_tax: l.line_tax, line_total: l.line_total,
      expense_account_id: l.expense_account_id,
    }));
    const { error: le } = await db.from('acc_ap_bill_lines').insert(linesPayload);
    if (le) { setSaving(false); toast.error(le.message); return; }

    if (andPost) {
      const { error: pe } = await db.rpc('acc_post_ap_bill', { _bill_id: bill.id });
      if (pe) { setSaving(false); toast.error(pe.message); return; }
      toast.success('Bill created and posted');
    } else {
      toast.success('Draft bill saved');
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>New AP bill</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Supplier *">
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Bill number *"><Input value={billNumber} onChange={e => setBillNumber(e.target.value)} placeholder="BILL-0001" /></Field>
          <Field label="Supplier reference"><Input value={supplierRef} onChange={e => setSupplierRef(e.target.value)} placeholder="Their invoice #" /></Field>
          <Field label="Bill date"><Input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} /></Field>
          <Field label="Due date"><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold">Lines</Label>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]"
              onClick={() => setLines(prev => [...prev, blankLine(prev.length + 1, expenseAccounts[0]?.id ?? null)])}>
              <Plus className="h-3 w-3" /> Add line
            </Button>
          </div>
          <div className="rounded-xl border border-border/30 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/20 text-muted-foreground">
                <tr>
                  <Th>Description</Th><Th>Expense account</Th>
                  <Th right>Qty</Th><Th right>Unit price</Th><Th right>VAT %</Th>
                  <Th right>Total</Th><Th right></Th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={idx} className="border-t border-border/20">
                    <Td><Input className="h-8 text-xs" value={l.description} onChange={e => updateLine(idx, { description: e.target.value })} /></Td>
                    <Td>
                      <Select value={l.expense_account_id || ''} onValueChange={v => updateLine(idx, { expense_account_id: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{expenseAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </Td>
                    <Td right><Input type="number" step="0.01" className="h-8 text-xs text-right w-20" value={l.quantity} onChange={e => updateLine(idx, { quantity: Number(e.target.value) })} /></Td>
                    <Td right><Input type="number" step="0.01" className="h-8 text-xs text-right w-24" value={l.unit_price} onChange={e => updateLine(idx, { unit_price: Number(e.target.value) })} /></Td>
                    <Td right><Input type="number" step="0.01" className="h-8 text-xs text-right w-20" value={l.tax_rate * 100} onChange={e => updateLine(idx, { tax_rate: Number(e.target.value) / 100 })} /></Td>
                    <Td right>{money(l.line_total, currency)}</Td>
                    <Td right>
                      <Button size="sm" variant="ghost" className="h-7 text-red-500" onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-col items-end gap-1 text-xs">
            <div className="flex gap-8"><span className="text-muted-foreground">Subtotal</span><span className="font-medium w-28 text-right">{money(totals.subtotal, currency)}</span></div>
            <div className="flex gap-8"><span className="text-muted-foreground">VAT</span><span className="font-medium w-28 text-right">{money(totals.tax_total, currency)}</span></div>
            <div className="flex gap-8"><span className="font-semibold">Total</span><span className="font-bold w-28 text-right">{money(totals.total, currency)}</span></div>
          </div>
        </div>

        <Field label="Notes (optional)"><Input value={notes} onChange={e => setNotes(e.target.value)} /></Field>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" disabled={saving} onClick={() => save(false)}>Save draft</Button>
          <Button disabled={saving} onClick={() => save(true)}>{saving ? 'Working…' : 'Save & post'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentModal({ bill, bankAccounts, currency, onClose, onSaved }: {
  bill: Bill; bankAccounts: Account[]; currency: string; onClose: () => void; onSaved: () => void;
}) {
  const balance = Number(bill.total) - Number(bill.amount_paid);
  const [amount, setAmount] = useState<number>(balance);
  const [bank, setBank] = useState(bankAccounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!bank) { toast.error('Select a bank account'); return; }
    if (amount <= 0 || amount > balance) { toast.error('Invalid amount'); return; }
    setSaving(true);
    const { data: pay, error } = await db.from('acc_ap_payments').insert({
      org_id: bill.org_id, bill_id: bill.id,
      payment_date: date, amount, bank_account_id: bank,
      reference: reference || null, method,
    }).select().single();
    if (error || !pay) { setSaving(false); toast.error(error?.message || 'Failed'); return; }
    const { error: pe } = await db.rpc('acc_post_ap_payment', { _payment_id: pay.id });
    setSaving(false);
    if (pe) toast.error(pe.message); else { toast.success('Payment posted'); onSaved(); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Pay bill · {bill.bill_number}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">Outstanding balance: <span className="font-bold text-foreground">{money(balance, currency)}</span></div>
          <Field label="Amount"><Input type="number" step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} /></Field>
          <Field label="Bank account">
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
              <SelectContent>{bankAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Date"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
          <Field label="Method">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="direct_debit">Direct debit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Reference"><Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Payment ref" /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={save}>{saving ? 'Working…' : 'Post payment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- primitives ---------- */
function Th({ children, right }: any) { return <th className={cn("px-3 py-2 font-medium text-[10px] uppercase tracking-wider", right ? "text-right" : "text-left")}>{children}</th>; }
function Td({ children, right, mono }: any) { return <td className={cn("px-3 py-2", right && "text-right", mono && "font-mono")}>{children}</td>; }
function Field({ label, children }: any) {
  return <div><Label className="text-[11px] text-muted-foreground">{label}</Label><div className="mt-1">{children}</div></div>;
}
function Empty({ icon: Icon, title, hint }: any) {
  return (
    <div className="rounded-2xl border border-dashed border-border/40 bg-card/30 p-10 flex flex-col items-center text-center">
      <Icon className="h-8 w-8 text-muted-foreground mb-2" />
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-1 max-w-sm">{hint}</div>
    </div>
  );
}
function round2(n: number) { return Math.round(Number(n || 0) * 100) / 100; }

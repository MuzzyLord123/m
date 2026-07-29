import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Send, XCircle, Receipt, Users, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/platform';

type SubTab = 'invoices' | 'customers' | 'aging';

interface Account { id: string; code: string; name: string; type: string; is_active: boolean; }
interface Customer {
  id: string; org_id: string; name: string; email: string | null; phone: string | null;
  currency: string; is_active: boolean;
  default_ar_account_id: string | null; default_revenue_account_id: string | null;
}
interface Invoice {
  id: string; org_id: string; customer_id: string; invoice_number: string;
  invoice_date: string; due_date: string | null;
  subtotal: number; tax_total: number; total: number; amount_paid: number;
  status: 'draft'|'posted'|'paid'|'void'; currency: string; notes: string | null;
}
interface InvoiceLine {
  id?: string; invoice_id?: string; line_no: number; description: string;
  quantity: number; unit_price: number; tax_rate: number;
  line_subtotal: number; line_tax: number; line_total: number;
  revenue_account_id: string | null;
}
interface AgingRow {
  invoice_id: string; invoice_number: string; customer_name: string;
  invoice_date: string; due_date: string | null;
  total: number; amount_paid: number; balance: number;
  days_overdue: number; bucket: 'current'|'1-30'|'31-60'|'61-90'|'90+';
}

const BUCKET_TONES: Record<string, string> = {
  current: 'text-ok',
  '1-30':  'text-muted-foreground',
  '31-60': 'text-attend',
  '61-90': 'text-attend',
  '90+':   'text-risk',
};

function money(n: number, c = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: c, minimumFractionDigits: 2 }).format(Number(n || 0));
}

const db = supabase as any;

export default function AccountsReceivableView({
  orgId, accounts, currency,
}: { orgId: string; accounts: Account[]; currency: string; }) {
  const [sub, setSub] = useState<SubTab>('invoices');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [aging, setAging] = useState<AgingRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<Invoice | null>(null);

  const revenueAccounts = useMemo(() => accounts.filter(a => a.type === 'revenue' && a.is_active), [accounts]);
  const bankAccounts    = useMemo(() => accounts.filter(a => a.code.startsWith('10') && a.is_active), [accounts]);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [c, i, a] = await Promise.all([
      db.from('acc_customers').select('*').eq('org_id', orgId).order('name'),
      db.from('acc_ar_invoices').select('*').eq('org_id', orgId).order('invoice_date', { ascending: false }).limit(500),
      db.from('acc_ar_aging').select('*').eq('org_id', orgId).order('days_overdue', { ascending: false }),
    ]);
    setCustomers(c.data || []);
    setInvoices(i.data || []);
    setAging(a.data || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { refresh(); }, [refresh]);

  const totals = useMemo(() => {
    const outstanding = invoices.filter(i => i.status === 'posted').reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid)), 0);
    const overdue = aging.filter(a => a.bucket !== 'current').reduce((s, a) => s + Number(a.balance), 0);
    const paidThisPeriod = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0);
    return { outstanding, overdue, paidThisPeriod, count: invoices.length };
  }, [invoices, aging]);

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Outstanding"       value={money(totals.outstanding, currency)} />
        <KpiCard label="Overdue"           value={money(totals.overdue, currency)} />
        <KpiCard label="Paid (all-time)"   value={money(totals.paidThisPeriod, currency)} />
        <KpiCard label="Total invoices"    value={String(totals.count)} />
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-card border border-border/60 p-1">
          {(['invoices','customers','aging'] as SubTab[]).map(k => (
            <button key={k} onClick={() => setSub(k)}
              className={cn(
                "px-3 h-8 text-[12px] rounded-lg font-medium capitalize transition-colors",
                sub === k ? "bg-foreground/[0.05] text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>{k}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {sub === 'invoices' && (
            <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs"
              onClick={() => setShowInvoiceModal(true)}
              disabled={customers.length === 0}>
              <Plus className="h-3.5 w-3.5" /> New invoice
            </Button>
          )}
          {sub === 'customers' && (
            <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => setShowCustomerModal(true)}>
              <Plus className="h-3.5 w-3.5" /> New customer
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : sub === 'invoices' ? (
        <InvoicesTable
          invoices={invoices}
          customers={customers}
          currency={currency}
          onPost={async (id) => { const { error } = await db.rpc('acc_post_ar_invoice', { _invoice_id: id }); if (error) toast.error(error.message); else { toast.success('Invoice posted to ledger'); refresh(); } }}
          onVoid={async (id) => { if (!confirm('Void this invoice? A reversal entry will be posted.')) return; const { error } = await db.rpc('acc_void_ar_invoice', { _invoice_id: id }); if (error) toast.error(error.message); else { toast.success('Invoice voided'); refresh(); } }}
          onDelete={async (id) => { if (!confirm('Delete this draft invoice?')) return; const { error } = await db.from('acc_ar_invoices').delete().eq('id', id); if (error) toast.error(error.message); else { toast.success('Deleted'); refresh(); } }}
          onPay={(inv) => setShowPayModal(inv)}
        />
      ) : sub === 'customers' ? (
        <CustomersTable customers={customers} onChange={refresh} />
      ) : (
        <AgingTable rows={aging} currency={currency} />
      )}

      {showInvoiceModal && (
        <InvoiceModal
          orgId={orgId}
          customers={customers}
          revenueAccounts={revenueAccounts}
          currency={currency}
          onClose={() => setShowInvoiceModal(false)}
          onSaved={() => { setShowInvoiceModal(false); refresh(); }}
        />
      )}
      {showCustomerModal && (
        <CustomerModal
          orgId={orgId}
          accounts={accounts}
          onClose={() => setShowCustomerModal(false)}
          onSaved={() => { setShowCustomerModal(false); refresh(); }}
        />
      )}
      {showPayModal && (
        <PaymentModal
          invoice={showPayModal}
          bankAccounts={bankAccounts}
          currency={currency}
          onClose={() => setShowPayModal(null)}
          onSaved={() => { setShowPayModal(null); refresh(); }}
        />
      )}
    </div>
  );
}

/* ---------- KPI card ---------- */
function KpiCard({ label, value }: any) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border/60 bg-card px-4 py-3">
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{label}</span>
      <span className="font-mono text-[15px] font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}

/* ---------- Invoices ---------- */
function InvoicesTable({ invoices, customers, currency, onPost, onVoid, onDelete, onPay }: {
  invoices: Invoice[]; customers: Customer[]; currency: string;
  onPost: (id: string) => void; onVoid: (id: string) => void; onDelete: (id: string) => void; onPay: (inv: Invoice) => void;
}) {
  const cmap = useMemo(() => Object.fromEntries(customers.map(c => [c.id, c.name])), [customers]);
  if (invoices.length === 0) {
    return <Empty icon={Receipt} title="No invoices yet" hint={customers.length === 0 ? 'Add a customer first, then create your first invoice.' : 'Click "New invoice" to raise your first AR invoice.'} />;
  }
  return (
    <div className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/20 text-muted-foreground">
          <tr>
            <Th>Invoice #</Th><Th>Customer</Th><Th>Date</Th><Th>Due</Th>
            <Th right>Total</Th><Th right>Paid</Th><Th right>Balance</Th>
            <Th>Status</Th><Th right>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(i => {
            const bal = Number(i.total) - Number(i.amount_paid);
            return (
              <tr key={i.id} className="border-t border-border/60 hover:bg-foreground/[0.025]">
                <Td mono>{i.invoice_number}</Td>
                <Td>{cmap[i.customer_id] || '–'}</Td>
                <Td>{new Date(i.invoice_date).toLocaleDateString('en-GB')}</Td>
                <Td>{i.due_date ? new Date(i.due_date).toLocaleDateString('en-GB') : '–'}</Td>
                <Td right>{money(i.total, i.currency || currency)}</Td>
                <Td right>{money(i.amount_paid, i.currency || currency)}</Td>
                <Td right>{money(bal, i.currency || currency)}</Td>
                <Td>
                  <StatusBadge status={i.status} className="text-[10.5px] capitalize" />
                </Td>
                <Td right>
                  <div className="flex gap-1 justify-end">
                    {i.status === 'draft' && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => onPost(i.id)}>
                          <Send className="h-3 w-3" /> Post
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-risk" onClick={() => onDelete(i.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {i.status === 'posted' && bal > 0 && (
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => onPay(i)}>
                        <Receipt className="h-3 w-3" /> Receive
                      </Button>
                    )}
                    {(i.status === 'posted' || i.status === 'paid') && i.amount_paid === 0 && (
                      <Button size="sm" variant="ghost" className="h-7 text-[11px] text-risk" onClick={() => onVoid(i.id)}>
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

/* ---------- Customers ---------- */
function CustomersTable({ customers, onChange }: { customers: Customer[]; onChange: () => void }) {
  if (customers.length === 0) return <Empty icon={Users} title="No customers" hint='Click "New customer" to add one.' />;
  return (
    <div className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/20 text-muted-foreground">
          <tr><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Currency</Th><Th right>Active</Th><Th right>Actions</Th></tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id} className="border-t border-border/60 hover:bg-foreground/[0.025]">
              <Td>{c.name}</Td>
              <Td>{c.email || '–'}</Td>
              <Td>{c.phone || '–'}</Td>
              <Td>{c.currency}</Td>
              <Td right>
                <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium uppercase",
                  c.is_active ? "bg-ok/15 text-ok" : "bg-muted/30 text-muted-foreground")}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </span>
              </Td>
              <Td right>
                <Button size="sm" variant="ghost" className="h-7 text-risk"
                  onClick={async () => {
                    if (!confirm('Delete customer?')) return;
                    const { error } = await db.from('acc_customers').delete().eq('id', c.id);
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
  if (rows.length === 0) return <Empty icon={FileText} title="No outstanding invoices" hint="All invoices are settled." />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {(['current','1-30','31-60','61-90','90+'] as const).map(k => (
          <div key={k} className="p-3 rounded-lg border border-border/60 bg-card">
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{k === 'current' ? 'Current' : `${k} days`}</div>
            <div className={cn("mt-1 font-mono text-sm font-medium tabular-nums", BUCKET_TONES[k])}>{money(buckets[k], currency)}</div>
          </div>
        ))}
      </div>
      <div className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/20 text-muted-foreground">
            <tr><Th>Invoice #</Th><Th>Customer</Th><Th>Due</Th><Th right>Balance</Th><Th right>Days overdue</Th><Th>Bucket</Th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.invoice_id} className="border-t border-border/60 hover:bg-foreground/[0.025]">
                <Td mono>{r.invoice_number}</Td>
                <Td>{r.customer_name}</Td>
                <Td>{r.due_date ? new Date(r.due_date).toLocaleDateString('en-GB') : '–'}</Td>
                <Td right>{money(r.balance, currency)}</Td>
                <Td right>{r.days_overdue}</Td>
                <Td>
                  <span className={cn('font-mono text-[10px] font-medium uppercase tracking-[0.1em]', BUCKET_TONES[r.bucket])}>
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
function CustomerModal({ orgId, accounts, onClose, onSaved }: {
  orgId: string; accounts: Account[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', currency: 'GBP', default_ar_account_id: '', default_revenue_account_id: '' });
  const [saving, setSaving] = useState(false);
  const arAccounts = accounts.filter(a => a.type === 'asset' && a.code.startsWith('11'));
  const revAccounts = accounts.filter(a => a.type === 'revenue');
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New customer</DialogTitle></DialogHeader>
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
          <Field label="Default AR account (optional)">
            <Select value={form.default_ar_account_id} onValueChange={v => setForm({...form, default_ar_account_id: v})}>
              <SelectTrigger><SelectValue placeholder="1100 Accounts Receivable" /></SelectTrigger>
              <SelectContent>{arAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Default revenue account (optional)">
            <Select value={form.default_revenue_account_id} onValueChange={v => setForm({...form, default_revenue_account_id: v})}>
              <SelectTrigger><SelectValue placeholder="4000 Sales Revenue" /></SelectTrigger>
              <SelectContent>{revAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
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
            if (form.default_ar_account_id) payload.default_ar_account_id = form.default_ar_account_id;
            if (form.default_revenue_account_id) payload.default_revenue_account_id = form.default_revenue_account_id;
            const { error } = await db.from('acc_customers').insert(payload);
            setSaving(false);
            if (error) toast.error(error.message); else { toast.success('Customer created'); onSaved(); }
          }}>{saving ? 'Saving…' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceModal({ orgId, customers, revenueAccounts, currency, onClose, onSaved }: {
  orgId: string; customers: Customer[]; revenueAccounts: Account[]; currency: string;
  onClose: () => void; onSaved: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([blankLine(1, revenueAccounts[0]?.id ?? null)]);
  const [saving, setSaving] = useState(false);

  function blankLine(no: number, rev: string | null): InvoiceLine {
    return { line_no: no, description: '', quantity: 1, unit_price: 0, tax_rate: 0.20, line_subtotal: 0, line_tax: 0, line_total: 0, revenue_account_id: rev };
  }

  function updateLine(idx: number, patch: Partial<InvoiceLine>) {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const merged = { ...l, ...patch };
      const sub = Number(merged.quantity || 0) * Number(merged.unit_price || 0);
      const tax = sub * Number(merged.tax_rate || 0);
      return { ...merged, line_subtotal: round2(sub), line_tax: round2(tax), line_total: round2(sub + tax) };
    }));
  }

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + Number(l.line_subtotal || 0), 0);
    const tax_total = lines.reduce((s, l) => s + Number(l.line_tax || 0), 0);
    return { subtotal: round2(subtotal), tax_total: round2(tax_total), total: round2(subtotal + tax_total) };
  }, [lines]);

  async function save(andPost: boolean) {
    if (!customerId) { toast.error('Select a customer'); return; }
    if (!invoiceNumber.trim()) { toast.error('Invoice number required'); return; }
    if (lines.length === 0 || totals.total <= 0) { toast.error('Add at least one line with an amount'); return; }
    setSaving(true);
    const { data: inv, error } = await db.from('acc_ar_invoices').insert({
      org_id: orgId, customer_id: customerId, invoice_number: invoiceNumber.trim(),
      invoice_date: invoiceDate, due_date: dueDate || null,
      subtotal: totals.subtotal, tax_total: totals.tax_total, total: totals.total,
      currency, notes: notes || null, status: 'draft',
    }).select().single();
    if (error || !inv) { setSaving(false); toast.error(error?.message || 'Failed'); return; }

    const linesPayload = lines.map((l, idx) => ({
      invoice_id: inv.id, line_no: idx + 1,
      description: l.description || 'Item',
      quantity: l.quantity, unit_price: l.unit_price, tax_rate: l.tax_rate,
      line_subtotal: l.line_subtotal, line_tax: l.line_tax, line_total: l.line_total,
      revenue_account_id: l.revenue_account_id,
    }));
    const { error: le } = await db.from('acc_ar_invoice_lines').insert(linesPayload);
    if (le) { setSaving(false); toast.error(le.message); return; }

    if (andPost) {
      const { error: pe } = await db.rpc('acc_post_ar_invoice', { _invoice_id: inv.id });
      if (pe) { setSaving(false); toast.error(pe.message); return; }
      toast.success('Invoice created and posted');
    } else {
      toast.success('Draft invoice saved');
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>New AR invoice</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer *">
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Invoice number *"><Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-0001" /></Field>
          <Field label="Invoice date"><Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></Field>
          <Field label="Due date"><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Field>
        </div>

        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold">Lines</Label>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]"
              onClick={() => setLines(prev => [...prev, blankLine(prev.length + 1, revenueAccounts[0]?.id ?? null)])}>
              <Plus className="h-3 w-3" /> Add line
            </Button>
          </div>
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/20 text-muted-foreground">
                <tr>
                  <Th>Description</Th><Th>Revenue account</Th>
                  <Th right>Qty</Th><Th right>Unit price</Th><Th right>VAT %</Th>
                  <Th right>Total</Th><Th right></Th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={idx} className="border-t border-border/60">
                    <Td><Input className="h-8 text-xs" value={l.description} onChange={e => updateLine(idx, { description: e.target.value })} /></Td>
                    <Td>
                      <Select value={l.revenue_account_id || ''} onValueChange={v => updateLine(idx, { revenue_account_id: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{revenueAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} {a.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </Td>
                    <Td right><Input type="number" step="0.01" className="h-8 text-xs text-right w-20" value={l.quantity} onChange={e => updateLine(idx, { quantity: Number(e.target.value) })} /></Td>
                    <Td right><Input type="number" step="0.01" className="h-8 text-xs text-right w-24" value={l.unit_price} onChange={e => updateLine(idx, { unit_price: Number(e.target.value) })} /></Td>
                    <Td right><Input type="number" step="0.01" className="h-8 text-xs text-right w-20" value={l.tax_rate * 100} onChange={e => updateLine(idx, { tax_rate: Number(e.target.value) / 100 })} /></Td>
                    <Td right>{money(l.line_total, currency)}</Td>
                    <Td right>
                      <Button size="sm" variant="ghost" className="h-7 text-risk" onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))}>
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

function PaymentModal({ invoice, bankAccounts, currency, onClose, onSaved }: {
  invoice: Invoice; bankAccounts: Account[]; currency: string; onClose: () => void; onSaved: () => void;
}) {
  const balance = Number(invoice.total) - Number(invoice.amount_paid);
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
    const { data: pay, error } = await db.from('acc_ar_payments').insert({
      org_id: invoice.org_id, invoice_id: invoice.id,
      payment_date: date, amount, bank_account_id: bank,
      reference: reference || null, method,
    }).select().single();
    if (error || !pay) { setSaving(false); toast.error(error?.message || 'Failed'); return; }
    const { error: pe } = await db.rpc('acc_post_ar_payment', { _payment_id: pay.id });
    setSaving(false);
    if (pe) toast.error(pe.message); else { toast.success('Payment posted'); onSaved(); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Receive payment · {invoice.invoice_number}</DialogTitle></DialogHeader>
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
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Reference"><Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Transaction ref" /></Field>
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
    <div className="rounded-[10px] border border-dashed border-border/60 bg-card/30 p-10 flex flex-col items-center text-center">
      <Icon className="h-8 w-8 text-muted-foreground mb-2" />
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-1 max-w-sm">{hint}</div>
    </div>
  );
}
function round2(n: number) { return Math.round(Number(n || 0) * 100) / 100; }

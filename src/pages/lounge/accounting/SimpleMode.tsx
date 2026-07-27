import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, PoundSterling, Receipt, Wallet, ArrowUpRight, ArrowDownRight,
  Loader2, Sparkles, CheckCircle2, AlertTriangle, Percent, Landmark, Plus, Send, ShieldCheck, History,
} from 'lucide-react';
import SubmitForAssessment from './SubmitForAssessment';
import AuditTrailView from './AuditTrailView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const db = supabase as any;

interface Account { id: string; code: string; name: string; type: string; is_active: boolean; }

interface Props {
  orgId: string;
  orgName: string;
  accounts: Account[];
  currency: string;
  onDone?: () => void;
  onGoTo?: (tab: 'ar' | 'ap' | 'bank' | 'vat' | 'reports') => void;
}

function money(n: number, c = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: c, minimumFractionDigits: 2 }).format(Number(n || 0));
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function firstOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }
function nextInvoiceNumber(prefix: string) {
  const n = Date.now().toString().slice(-6);
  return `${prefix}-${n}`;
}

type Flow = null | 'sale' | 'expense' | 'receive' | 'pay';

export default function SimpleMode({ orgId, orgName, accounts, currency, onGoTo }: Props) {
  const [flow, setFlow] = useState<Flow>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const [thisMonthSales, setThisMonthSales] = useState(0);
  const [thisMonthExpenses, setThisMonthExpenses] = useState(0);
  const [openInvoices, setOpenInvoices] = useState<any[]>([]);
  const [openBills, setOpenBills] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [vatOwed, setVatOwed] = useState(0);

  const revenueAccounts = useMemo(() => accounts.filter(a => a.type === 'revenue' && a.is_active), [accounts]);
  const expenseAccounts = useMemo(() => accounts.filter(a => a.type === 'expense' && a.is_active), [accounts]);
  const bankAccounts = useMemo(() => accounts.filter(a => a.code.startsWith('10') && a.is_active), [accounts]);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const from = firstOfMonth();
    const [inv, bills, invAll, billAll, custs, sups, vat] = await Promise.all([
      db.from('acc_ar_invoices').select('total,status,invoice_date').eq('org_id', orgId).gte('invoice_date', from).in('status', ['posted', 'paid']),
      db.from('acc_ap_bills').select('total,status,bill_date').eq('org_id', orgId).gte('bill_date', from).in('status', ['posted', 'paid']),
      db.from('acc_ar_invoices').select('id,invoice_number,total,amount_paid,due_date,customer_id,currency').eq('org_id', orgId).eq('status', 'posted').order('due_date', { ascending: true }).limit(10),
      db.from('acc_ap_bills').select('id,bill_number,total,amount_paid,due_date,supplier_id,currency').eq('org_id', orgId).eq('status', 'posted').order('due_date', { ascending: true }).limit(10),
      db.from('acc_customers').select('id,name,default_ar_account_id,default_revenue_account_id').eq('org_id', orgId).eq('is_active', true).order('name'),
      db.from('acc_suppliers').select('id,name,default_ap_account_id,default_expense_account_id').eq('org_id', orgId).eq('is_active', true).order('name'),
      db.from('acc_ar_invoices').select('tax_total').eq('org_id', orgId).gte('invoice_date', from).in('status', ['posted', 'paid']),
    ]);
    setThisMonthSales((inv.data || []).reduce((s: number, r: any) => s + Number(r.total || 0), 0));
    setThisMonthExpenses((bills.data || []).reduce((s: number, r: any) => s + Number(r.total || 0), 0));
    setOpenInvoices(invAll.data || []);
    setOpenBills(billAll.data || []);
    setCustomers(custs.data || []);
    setSuppliers(sups.data || []);
    setVatOwed((vat.data || []).reduce((s: number, r: any) => s + Number(r.tax_total || 0), 0));
    setLoading(false);
  }, [orgId]);

  useEffect(() => { refresh(); }, [refresh, refreshTick]);

  // Real-time: any ledger change instantly refreshes KPIs, invoices, bills and VAT.
  useEffect(() => {
    if (!orgId) return;
    const bump = () => setRefreshTick(v => v + 1);
    const channel = supabase
      .channel(`acc-simple-${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acc_ar_invoices', filter: `org_id=eq.${orgId}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acc_ap_bills', filter: `org_id=eq.${orgId}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acc_bank_transactions', filter: `org_id=eq.${orgId}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acc_ar_payments', filter: `org_id=eq.${orgId}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acc_ap_payments', filter: `org_id=eq.${orgId}` }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'acc_journal_entries', filter: `org_id=eq.${orgId}` }, bump)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId]);

  const profit = thisMonthSales - thisMonthExpenses;

  const overdue = openInvoices.filter(i => i.due_date && i.due_date < todayISO());

  const actions = [
    { key: 'sale' as const, title: 'Record a Sale', desc: 'Money coming in from a customer', icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
    { key: 'expense' as const, title: 'Record an Expense', desc: 'A bill or purchase to pay', icon: TrendingDown, color: 'from-rose-500 to-orange-600' },
    { key: 'receive' as const, title: 'Got Paid', desc: 'Mark a customer invoice as paid', icon: ArrowDownRight, color: 'from-blue-500 to-indigo-600' },
    { key: 'pay' as const, title: 'Paid a Bill', desc: 'Record a payment you made', icon: ArrowUpRight, color: 'from-violet-500 to-fuchsia-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-brand" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Simple mode</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Hi — let's keep your books tidy</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Everything below is automatic. Just tell us what happened and we'll do the accounting for you.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={TrendingUp} label="Sales this month" value={money(thisMonthSales, currency)} color="#10b981" loading={loading} />
        <KpiCard icon={TrendingDown} label="Expenses this month" value={money(thisMonthExpenses, currency)} color="#ef4444" loading={loading} />
        <KpiCard icon={PoundSterling} label="Profit" value={money(profit, currency)} color={profit >= 0 ? '#10b981' : '#ef4444'} loading={loading} />
        <KpiCard icon={Percent} label="VAT collected (MTD)" value={money(vatOwed, currency)} color="#f59e0b" loading={loading} onClick={() => onGoTo?.('vat')} />
      </div>

      {/* Send to accountant — the big automation button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <Send className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">One-click filing</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-500 rounded-full px-1.5 py-0.5 font-bold">AUTO</span>
            </div>
            <h3 className="text-base font-bold">Send my accounts to be assessed</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              We'll build a full accountant pack (Trial Balance, P&amp;L, Balance Sheet, Cash Flow, VAT, AR/AP, journals), run automated checks, and hand it to your accountant or email it — all in one click.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Reconciled ledger</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Auto-checked</span>
              <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-emerald-500" /> Signed-off PDF</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              onClick={() => setSubmitOpen(true)}
              className="h-11 rounded-xl gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white"
            >
              <Send className="h-4 w-4" /> Send to accountant
            </Button>
            <Button
              onClick={() => setAuditOpen(true)}
              variant="ghost"
              className="h-9 rounded-xl gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <History className="h-3.5 w-3.5" /> Audit trail
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div>
        <h3 className="text-sm font-bold mb-3">What happened today?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map(a => (
            <motion.button
              key={a.key}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFlow(a.key)}
              className="text-left rounded-2xl border border-border/30 bg-card/60 hover:bg-card/80 hover:border-border/60 p-5 transition-colors"
            >
              <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', a.color)}>
                <a.icon className="h-5 w-5 text-white" />
              </div>
              <div className="font-bold text-sm">{a.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{a.desc}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-bold">You have {overdue.length} overdue invoice{overdue.length > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-1.5">
            {overdue.slice(0, 5).map(i => {
              const cust = customers.find(c => c.id === i.customer_id);
              return (
                <div key={i.id} className="flex items-center justify-between text-xs">
                  <span>{i.invoice_number} · {cust?.name || 'Customer'}</span>
                  <span className="font-bold tabular-nums">{money(Number(i.total) - Number(i.amount_paid), i.currency || currency)}</span>
                </div>
              );
            })}
          </div>
          <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" onClick={() => onGoTo?.('ar')}>Open receivables →</Button>
        </div>
      )}

      {/* Shortcut row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <QuickLink icon={Receipt} label="All invoices" onClick={() => onGoTo?.('ar')} />
        <QuickLink icon={Wallet} label="All bills" onClick={() => onGoTo?.('ap')} />
        <QuickLink icon={Landmark} label="Banking" onClick={() => onGoTo?.('bank')} />
        <QuickLink icon={CheckCircle2} label="Reports" onClick={() => onGoTo?.('reports')} />
      </div>

      {/* Flows */}
      <SaleFlow
        open={flow === 'sale'} onClose={() => setFlow(null)}
        orgId={orgId} orgName={orgName} currency={currency}
        customers={customers} revenueAccounts={revenueAccounts}
        onDone={() => { setFlow(null); setRefreshTick(v => v + 1); }}
      />
      <ExpenseFlow
        open={flow === 'expense'} onClose={() => setFlow(null)}
        orgId={orgId} currency={currency}
        suppliers={suppliers} expenseAccounts={expenseAccounts}
        onDone={() => { setFlow(null); setRefreshTick(v => v + 1); }}
      />
      <PaymentFlow
        open={flow === 'receive'} onClose={() => setFlow(null)}
        kind="receive" orgId={orgId} currency={currency}
        items={openInvoices.map(i => ({
          id: i.id, label: `${i.invoice_number} — ${customers.find(c => c.id === i.customer_id)?.name || 'Customer'}`,
          outstanding: Number(i.total) - Number(i.amount_paid), currency: i.currency,
        }))}
        bankAccounts={bankAccounts}
        onDone={() => { setFlow(null); setRefreshTick(v => v + 1); }}
      />
      <PaymentFlow
        open={flow === 'pay'} onClose={() => setFlow(null)}
        kind="pay" orgId={orgId} currency={currency}
        items={openBills.map(b => ({
          id: b.id, label: `${b.bill_number} — ${suppliers.find(s => s.id === b.supplier_id)?.name || 'Supplier'}`,
          outstanding: Number(b.total) - Number(b.amount_paid), currency: b.currency,
        }))}
        bankAccounts={bankAccounts}
        onDone={() => { setFlow(null); setRefreshTick(v => v + 1); }}
      />

      <SubmitForAssessment
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        orgId={orgId}
        orgName={orgName}
        currency={currency}
      />

      <AuditTrailView
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        orgId={orgId}
        orgName={orgName}
      />
    </div>
  );
}

/* ---------- Small UI ---------- */

function KpiCard({ icon: Icon, label, value, color, loading, onClick }: any) {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick} className={cn('text-left p-4 rounded-2xl bg-card/60 border border-border/20', onClick && 'hover:border-border/60')}>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold tabular-nums">{loading ? '…' : value}</div>
    </Comp>
  );
}

function QuickLink({ icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-xl border border-border/20 bg-card/40 hover:bg-card/70 px-3 py-2 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" /><span>{label}</span>
    </button>
  );
}

/* ---------- Sale flow ---------- */
function SaleFlow({ open, onClose, orgId, orgName, currency, customers, revenueAccounts, onDone }: any) {
  const [customerId, setCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [vatRate, setVatRate] = useState('20');
  const [revenueId, setRevenueId] = useState(revenueAccounts[0]?.id || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setCustomerId(customers[0]?.id || ''); setRevenueId(revenueAccounts[0]?.id || ''); setDesc(''); setAmount(''); setNewCustomerName(''); } }, [open, customers, revenueAccounts]);

  async function submit() {
    if (!amount || Number(amount) <= 0) return toast.error('Enter an amount');
    if (!revenueId) return toast.error('Add a revenue account first (Chart of Accounts)');
    setBusy(true);
    try {
      let cId = customerId;
      if (!cId) {
        if (!newCustomerName.trim()) throw new Error('Choose or add a customer');
        const { data: nc, error: ce } = await db.from('acc_customers').insert({ org_id: orgId, name: newCustomerName.trim(), currency }).select().single();
        if (ce) throw ce;
        cId = nc.id;
      }
      const subtotal = Number(amount);
      const tax = +(subtotal * Number(vatRate) / 100).toFixed(2);
      const total = +(subtotal + tax).toFixed(2);
      const { data: inv, error: ie } = await db.from('acc_ar_invoices').insert({
        org_id: orgId, customer_id: cId, invoice_number: nextInvoiceNumber('INV'),
        invoice_date: todayISO(), currency, subtotal, tax_total: tax, total, notes: desc || null,
      }).select().single();
      if (ie) throw ie;
      const { error: le } = await db.from('acc_ar_invoice_lines').insert({
        invoice_id: inv.id, line_no: 1, description: desc || 'Sale', quantity: 1,
        unit_price: subtotal, tax_rate: Number(vatRate),
        line_subtotal: subtotal, line_tax: tax, line_total: total,
        revenue_account_id: revenueId,
      });
      if (le) throw le;
      const { error: pe } = await db.rpc('acc_post_ar_invoice', { _invoice_id: inv.id });
      if (pe) throw pe;
      toast.success('Sale recorded and posted to your books');
      onDone?.();
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record a sale</DialogTitle>
          <DialogDescription>We'll create the invoice and book the journal entries for you.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Customer</Label>
            {customers.length > 0 ? (
              <Select value={customerId} onValueChange={(v) => { setCustomerId(v); if (v) setNewCustomerName(''); }}>
                <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue placeholder="Choose customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
            <Input value={newCustomerName} onChange={e => { setNewCustomerName(e.target.value); if (e.target.value) setCustomerId(''); }} placeholder="…or type a new customer name" className="mt-2 h-10 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs">What was it for?</Label>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="e.g. Website design work" className="mt-1 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Amount (excl. VAT)</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 h-10 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">VAT</Label>
              <Select value={vatRate} onValueChange={setVatRate}>
                <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {revenueAccounts.length > 1 && (
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={revenueId} onValueChange={setRevenueId}>
                <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {revenueAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
            {orgName ? `${orgName} · ` : ''}Total <span className="font-bold text-foreground tabular-nums">{money((Number(amount) || 0) * (1 + Number(vatRate) / 100), currency)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save & post'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Expense flow ---------- */
function ExpenseFlow({ open, onClose, orgId, currency, suppliers, expenseAccounts, onDone }: any) {
  const [supplierId, setSupplierId] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [vatRate, setVatRate] = useState('20');
  const [expenseId, setExpenseId] = useState(expenseAccounts[0]?.id || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setSupplierId(suppliers[0]?.id || ''); setExpenseId(expenseAccounts[0]?.id || ''); setDesc(''); setAmount(''); setNewSupplierName(''); } }, [open, suppliers, expenseAccounts]);

  async function submit() {
    if (!amount || Number(amount) <= 0) return toast.error('Enter an amount');
    if (!expenseId) return toast.error('Add an expense account first (Chart of Accounts)');
    setBusy(true);
    try {
      let sId = supplierId;
      if (!sId) {
        if (!newSupplierName.trim()) throw new Error('Choose or add a supplier');
        const { data: ns, error: se } = await db.from('acc_suppliers').insert({ org_id: orgId, name: newSupplierName.trim(), currency }).select().single();
        if (se) throw se;
        sId = ns.id;
      }
      const subtotal = Number(amount);
      const tax = +(subtotal * Number(vatRate) / 100).toFixed(2);
      const total = +(subtotal + tax).toFixed(2);
      const { data: bill, error: be } = await db.from('acc_ap_bills').insert({
        org_id: orgId, supplier_id: sId, bill_number: nextInvoiceNumber('BILL'),
        bill_date: todayISO(), currency, subtotal, tax_total: tax, total, notes: desc || null,
      }).select().single();
      if (be) throw be;
      const { error: le } = await db.from('acc_ap_bill_lines').insert({
        bill_id: bill.id, line_no: 1, description: desc || 'Expense', quantity: 1,
        unit_price: subtotal, tax_rate: Number(vatRate),
        line_subtotal: subtotal, line_tax: tax, line_total: total,
        expense_account_id: expenseId,
      });
      if (le) throw le;
      const { error: pe } = await db.rpc('acc_post_ap_bill', { _bill_id: bill.id });
      if (pe) throw pe;
      toast.success('Expense recorded and posted');
      onDone?.();
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record an expense</DialogTitle>
          <DialogDescription>Add a bill or purchase. We'll post it to your ledger automatically.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Supplier</Label>
            {suppliers.length > 0 ? (
              <Select value={supplierId} onValueChange={(v) => { setSupplierId(v); if (v) setNewSupplierName(''); }}>
                <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue placeholder="Choose supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
            <Input value={newSupplierName} onChange={e => { setNewSupplierName(e.target.value); if (e.target.value) setSupplierId(''); }} placeholder="…or type a new supplier name" className="mt-2 h-10 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs">What was it for?</Label>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="e.g. Office supplies" className="mt-1 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Amount (excl. VAT)</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 h-10 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">VAT</Label>
              <Select value={vatRate} onValueChange={setVatRate}>
                <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {expenseAccounts.length > 1 && (
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={expenseId} onValueChange={setExpenseId}>
                <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {expenseAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
            Total <span className="font-bold text-foreground tabular-nums">{money((Number(amount) || 0) * (1 + Number(vatRate) / 100), currency)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save & post'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Payment flow (receive/pay) ---------- */
function PaymentFlow({ open, onClose, kind, orgId, currency, items, bankAccounts, onDone }: any) {
  const [itemId, setItemId] = useState('');
  const [amount, setAmount] = useState('');
  const [bankId, setBankId] = useState(bankAccounts[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const selected = items.find((i: any) => i.id === itemId);

  useEffect(() => {
    if (open) {
      const first = items[0];
      setItemId(first?.id || '');
      setAmount(first ? String(first.outstanding.toFixed(2)) : '');
      setBankId(bankAccounts[0]?.id || '');
    }
  }, [open, items, bankAccounts]);

  useEffect(() => {
    if (selected) setAmount(String(selected.outstanding.toFixed(2)));
  }, [itemId]); // eslint-disable-line

  async function submit() {
    if (!itemId) return toast.error(kind === 'receive' ? 'Choose an invoice' : 'Choose a bill');
    if (!bankId) return toast.error('Choose a bank account (add one in Banking)');
    if (!amount || Number(amount) <= 0) return toast.error('Enter an amount');
    setBusy(true);
    try {
      if (kind === 'receive') {
        const { data: p, error } = await db.from('acc_ar_payments').insert({
          org_id: orgId, invoice_id: itemId, bank_account_id: bankId,
          amount: Number(amount), payment_date: todayISO(),
        }).select().single();
        if (error) throw error;
        const { error: pe } = await db.rpc('acc_post_ar_payment', { _payment_id: p.id });
        if (pe) throw pe;
      } else {
        const { data: p, error } = await db.from('acc_ap_payments').insert({
          org_id: orgId, bill_id: itemId, bank_account_id: bankId,
          amount: Number(amount), payment_date: todayISO(),
        }).select().single();
        if (error) throw error;
        const { error: pe } = await db.rpc('acc_post_ap_payment', { _payment_id: p.id });
        if (pe) throw pe;
      }
      toast.success('Payment recorded and posted');
      onDone?.();
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{kind === 'receive' ? 'Got paid by a customer' : 'Paid a bill'}</DialogTitle>
          <DialogDescription>
            {kind === 'receive' ? 'Match a payment received to an open invoice.' : 'Match a payment sent to an open bill.'}
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            {kind === 'receive' ? 'No open invoices — record a sale first.' : 'No open bills — record an expense first.'}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{kind === 'receive' ? 'Invoice' : 'Bill'}</Label>
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {items.map((i: any) => (
                    <SelectItem key={i.id} value={i.id}>{i.label} · {money(i.outstanding, i.currency || currency)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Bank account</Label>
              {bankAccounts.length === 0 ? (
                <div className="mt-1 text-xs text-amber-600">Add a bank account in Banking first.</div>
              ) : (
                <Select value={bankId} onValueChange={setBankId}>
                  <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="text-xs">Amount</Label>
              <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 h-10 rounded-xl" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || items.length === 0 || bankAccounts.length === 0}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save & post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

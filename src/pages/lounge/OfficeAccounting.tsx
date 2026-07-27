import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Calculator, BookOpen, ScrollText, Scale, TrendingUp,
  Plus, Trash2, Building2, ShieldCheck, AlertTriangle, CheckCircle2, Lock, Loader2, Receipt, Wallet, Landmark, Percent, Users, Boxes, Globe, Menu
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AccountsReceivableView from './accounting/AccountsReceivableView';
import AccountsPayableView from './accounting/AccountsPayableView';
import BankingView from './accounting/BankingView';
import VatView from './accounting/VatView';
import PayrollView from './accounting/PayrollView';
import FixedAssetsView from './accounting/FixedAssetsView';
import FxView from './accounting/FxView';
import ReportsCentre from './accounting/ReportsCentre';
import AccountantsSettings from './accounting/AccountantsSettings';
import SimpleMode from './accounting/SimpleMode';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/* ------------------------ Types ------------------------ */
type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

interface Organization {
  id: string; name: string; base_currency: string; fiscal_year_start: string; vat_scheme: string;
}
interface Account {
  id: string; org_id: string; code: string; name: string;
  type: AccountType; subtype: string | null; is_active: boolean;
}
interface JournalEntry {
  id: string; org_id: string; entry_date: string; description: string | null;
  source_type: string; posted_at: string | null; is_reversal: boolean;
}
interface TrialBalanceRow {
  org_id: string; account_id: string; account_code: string; account_name: string;
  account_type: AccountType; account_subtype: string | null;
  total_debit: number; total_credit: number; balance: number;
}

type Tab = 'home' | 'overview' | 'coa' | 'journal' | 'ar' | 'ap' | 'bank' | 'vat' | 'payroll' | 'assets' | 'fx' | 'trial' | 'reports' | 'accountants';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'home',        label: 'Simple',            icon: Sparkles },
  { id: 'overview',    label: 'Overview',          icon: TrendingUp },
  { id: 'coa',         label: 'Chart of Accounts', icon: BookOpen },
  { id: 'journal',     label: 'Journal',           icon: ScrollText },
  { id: 'ar',          label: 'Receivables',       icon: Receipt },
  { id: 'ap',          label: 'Payables',          icon: Wallet },
  { id: 'bank',        label: 'Banking',           icon: Landmark },
  { id: 'vat',         label: 'VAT / Tax',         icon: Percent },
  { id: 'payroll',     label: 'Payroll',           icon: Users },
  { id: 'assets',      label: 'Fixed Assets',      icon: Boxes },
  { id: 'fx',          label: 'Multi-currency',    icon: Globe },
  { id: 'trial',       label: 'Trial Balance',     icon: Scale },
  { id: 'reports',     label: 'Reports',           icon: Calculator },
  { id: 'accountants', label: 'Accountants',       icon: ShieldCheck },
];

const TYPE_COLORS: Record<AccountType, string> = {
  asset:     '#10b981',
  liability: '#f59e0b',
  equity:    '#8b5cf6',
  revenue:   '#3b82f6',
  expense:   '#ef4444',
};

function money(n: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(n || 0));
}

/* ------------------------ Component ------------------------ */
export default function OfficeAccounting() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ orgId?: string }>();
  const { user } = useAuth();

  // Accountant portal mode = mounted under /accountant/org/:orgId
  const isAccountant = location.pathname.startsWith('/accountant/');
  const urlOrgId = params.orgId || '';

  const [tab, setTab] = useState<Tab>(isAccountant ? 'overview' : 'home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgId, setOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [accounts, setAccounts]     = useState<Account[]>([]);
  const [entries, setEntries]       = useState<JournalEntry[]>([]);
  const [trial, setTrial]           = useState<TrialBalanceRow[]>([]);

  const org = useMemo(() => orgs.find(o => o.id === orgId), [orgs, orgId]);

  /* ---------- Load orgs ---------- */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      if (isAccountant) {
        // Restrict list to organizations where the user is an accountant member.
        const { data: mem } = await (supabase as any)
          .from('acc_org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .eq('role', 'accountant');
        const ids = (mem || []).map((m: any) => m.org_id);
        if (!ids.length) { setOrgs([]); setLoading(false); return; }
        const { data } = await (supabase as any)
          .from('acc_organizations').select('*').in('id', ids).order('name');
        setOrgs(data || []);
        // prefer URL param; fall back to first authorized org
        const chosen = urlOrgId && (data || []).some((o: any) => o.id === urlOrgId)
          ? urlOrgId
          : (data?.[0]?.id || '');
        setOrgId(chosen);
      } else {
        const { data } = await (supabase as any).from('acc_organizations').select('*').order('created_at');
        setOrgs(data || []);
        if ((data || []).length > 0 && !orgId) setOrgId(data[0].id);
      }
      setLoading(false);
    })();
  }, [user, isAccountant, urlOrgId]); // eslint-disable-line


  /* ---------- Load org-scoped data ---------- */
  const refreshOrgData = useCallback(async () => {
    if (!orgId) return;
    const [a, e, t] = await Promise.all([
      (supabase as any).from('acc_chart_of_accounts').select('*').eq('org_id', orgId).order('code'),
      (supabase as any).from('acc_journal_entries').select('*').eq('org_id', orgId).order('entry_date', { ascending: false }).limit(200),
      (supabase as any).from('acc_trial_balance').select('*').eq('org_id', orgId).order('account_code'),
    ]);
    setAccounts(a.data || []);
    setEntries(e.data || []);
    setTrial(t.data || []);
  }, [orgId]);

  useEffect(() => { refreshOrgData(); }, [refreshOrgData]);

  /* ---------- Create org ---------- */
  async function createOrg(name: string) {
    if (!user || !name.trim()) return;
    const { data, error } = await (supabase as any).from('acc_organizations')
      .insert({ owner_user_id: user.id, name: name.trim() })
      .select().single();
    if (error) { toast.error(error.message); return; }
    toast.success('Organization created — default chart of accounts seeded');
    setOrgs(prev => [...prev, data]);
    setOrgId(data.id);
  }

  /* ---------- Header ---------- */
  // In accountant mode, hide owner-only tabs & write-heavy ones.
  const visibleTabs = isAccountant
    ? TABS.filter(t => !['home', 'coa', 'accountants'].includes(t.id))
    : TABS;

  // Keep URL in sync with org switch when in accountant mode.
  function handleOrgChange(next: string) {
    setOrgId(next);
    if (isAccountant && next && next !== urlOrgId) {
      navigate(`/accountant/org/${next}`, { replace: true });
    }
  }

  return (
    <div className={cn(
      "acc-root",
      isAccountant ? "flex-1 min-h-0 flex flex-col overflow-hidden bg-background"
                   : "fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    )}>
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
        {!isAccountant && (
          <>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-xl text-xs px-2 sm:px-3"
              onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
              <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Office</span>
            </Button>
            <div className="hidden sm:block h-4 w-px bg-border/40" />
          </>
        )}

        {/* Mobile menu trigger */}
        {orgs.length > 0 && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0 flex flex-col bg-background">
              <div className="h-[52px] shrink-0 flex items-center gap-2 px-4 border-b border-border/30">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Calculator className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold tracking-tight">Accounting</span>
              </div>
              <nav className="flex-1 overflow-y-auto p-2">
                {visibleTabs.map(t => (
                  <button key={t.id}
                    onClick={() => { setTab(t.id); setMobileMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 h-10 rounded-lg text-[13px] font-medium transition-colors",
                      tab === t.id
                        ? "bg-brand/10 text-brand"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                    )}>
                    <t.icon className="h-4 w-4 shrink-0" />
                    {t.label}
                  </button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        )}

        {/* Desktop sidebar toggle */}
        {orgs.length > 0 && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hidden md:inline-flex"
            onClick={() => setSidebarCollapsed(v => !v)} title="Toggle menu">
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
          <Calculator className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight hidden xs:inline sm:inline">Accounting</span>
        {isAccountant && (
          <span className="ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 uppercase tracking-wider whitespace-nowrap">
            <span className="sm:hidden">Accountant</span>
            <span className="hidden sm:inline">Read-only · Accountant</span>
          </span>
        )}

        <div className="flex-1" />

        {orgs.length > 0 && (
          <Select value={orgId} onValueChange={handleOrgChange}>
            <SelectTrigger className="h-8 w-[140px] sm:w-[180px] text-xs rounded-xl bg-card/60">
              <Building2 className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {orgs.map(o => <SelectItem key={o.id} value={o.id} className="text-xs">{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Desktop left sidebar */}
        {orgs.length > 0 && (
          <aside className={cn(
            "hidden md:flex flex-col shrink-0 border-r border-border/30 bg-background/60 backdrop-blur-xl transition-[width] duration-200",
            sidebarCollapsed ? "w-14" : "w-56"
          )}>
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {visibleTabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  title={sidebarCollapsed ? t.label : undefined}
                  className={cn(
                    "w-full flex items-center gap-2.5 h-9 rounded-lg text-[12.5px] font-medium transition-colors",
                    sidebarCollapsed ? "justify-center px-0" : "px-3",
                    tab === t.id
                      ? "bg-brand/10 text-brand"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  )}>
                  <t.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{t.label}</span>}
                </button>
              ))}
            </nav>
          </aside>
        )}

        <div className="flex-1 min-w-0 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : orgs.length === 0 ? (
            isAccountant ? (
              <div className="max-w-lg mx-auto py-24 px-6 text-center">
                <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h2 className="text-lg font-bold">No client access</h2>
                <p className="text-xs text-muted-foreground mt-1">You are not currently a member of any organization. Ask the business owner to send you an invite from their Accountants settings.</p>
              </div>
            ) : (
              <SetupView onCreate={createOrg} />
            )
          ) : (
            <div className="max-w-7xl mx-auto p-3 sm:p-6">
              {tab === 'home' && !isAccountant && <SimpleMode orgId={orgId} orgName={org?.name || ''} accounts={accounts} currency={org?.base_currency || 'GBP'} onGoTo={(t) => setTab(t as Tab)} />}
              {tab === 'overview' && <OverviewView org={org!} trial={trial} entries={entries} />}
              {tab === 'coa'      && !isAccountant && <ChartOfAccountsView orgId={orgId} accounts={accounts} onChange={refreshOrgData} />}
              {tab === 'journal'  && <JournalView orgId={orgId} accounts={accounts} entries={entries} onChange={refreshOrgData} userId={user!.id} currency={org?.base_currency || 'GBP'} readOnly={isAccountant} />}
              {tab === 'ar'       && <AccountsReceivableView orgId={orgId} accounts={accounts} currency={org?.base_currency || 'GBP'} />}
              {tab === 'ap'       && <AccountsPayableView orgId={orgId} accounts={accounts} currency={org?.base_currency || 'GBP'} />}
              {tab === 'bank'     && <BankingView orgId={orgId} accounts={accounts} currency={org?.base_currency || 'GBP'} />}
              {tab === 'vat'      && <VatView orgId={orgId} accounts={accounts} currency={org?.base_currency || 'GBP'} />}
              {tab === 'payroll'  && <PayrollView orgId={orgId} currency={org?.base_currency || 'GBP'} />}
              {tab === 'assets'   && <FixedAssetsView orgId={orgId} accounts={accounts} currency={org?.base_currency || 'GBP'} />}
              {tab === 'fx'       && <FxView orgId={orgId} baseCurrency={org?.base_currency || 'GBP'} />}
              {tab === 'trial'    && <TrialBalanceView trial={trial} currency={org?.base_currency || 'GBP'} />}
              {tab === 'reports'  && <ReportsCentre orgId={orgId} orgName={org?.name || ''} currency={org?.base_currency || 'GBP'} />}
              {tab === 'accountants' && !isAccountant && <AccountantsSettings orgId={orgId} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   SETUP
   ========================================================= */
function SetupView({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="max-w-lg mx-auto py-24 px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/30 bg-card/60 p-8">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
          <Calculator className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Set up Accounting</h1>
        <p className="text-sm text-muted-foreground mb-6">Create your first organization. A default UK Chart of Accounts and the current fiscal-year period will be created automatically.</p>
        <Label className="text-xs">Organization name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Ltd" className="mt-1.5 mb-4 h-10 rounded-xl" />
        <Button className="w-full h-10 rounded-xl" onClick={() => onCreate(name)} disabled={!name.trim()}>
          Create organization
        </Button>
      </motion.div>
    </div>
  );
}

/* =========================================================
   OVERVIEW
   ========================================================= */
function OverviewView({ org, trial, entries }: { org: Organization; trial: TrialBalanceRow[]; entries: JournalEntry[] }) {
  const totals = useMemo(() => {
    const sum = (t: AccountType, side: 'debit'|'credit') =>
      trial.filter(r => r.account_type === t).reduce((s, r) => s + Number(side === 'debit' ? r.total_debit : r.total_credit), 0);
    const assets      = sum('asset','debit') - sum('asset','credit');
    const liabilities = sum('liability','credit') - sum('liability','debit');
    const equity      = sum('equity','credit') - sum('equity','debit');
    const revenue     = sum('revenue','credit') - sum('revenue','debit');
    const expenses    = sum('expense','debit') - sum('expense','credit');
    const netIncome   = revenue - expenses;
    const totalDebit  = trial.reduce((s,r) => s + Number(r.total_debit), 0);
    const totalCredit = trial.reduce((s,r) => s + Number(r.total_credit), 0);
    const balanced    = Math.abs(totalDebit - totalCredit) < 0.005;
    return { assets, liabilities, equity, revenue, expenses, netIncome, totalDebit, totalCredit, balanced };
  }, [trial]);

  const posted = entries.filter(e => e.posted_at).length;
  const drafts = entries.length - posted;

  const cards = [
    { label: 'Total Assets',      value: money(totals.assets, org.base_currency),      icon: TrendingUp, color: '#10b981' },
    { label: 'Total Liabilities', value: money(totals.liabilities, org.base_currency), icon: Scale,      color: '#f59e0b' },
    { label: 'Total Equity',      value: money(totals.equity, org.base_currency),      icon: Building2,  color: '#8b5cf6' },
    { label: 'Net Income',        value: money(totals.netIncome, org.base_currency),   icon: TrendingUp, color: totals.netIncome >= 0 ? '#10b981' : '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight">{org.name}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Base currency {org.base_currency} · Fiscal year begins {new Date(org.fiscal_year_start).toLocaleDateString('en-GB')} · VAT {org.vat_scheme}
        </p>
      </div>

      <div className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-3 text-xs",
        totals.balanced ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
      )}>
        {totals.balanced
          ? <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span>Ledger is balanced. Debits {money(totals.totalDebit, org.base_currency)} = Credits {money(totals.totalCredit, org.base_currency)}</span></>
          : <><AlertTriangle className="h-4 w-4 text-red-500" /><span>Ledger out of balance. Debits {money(totals.totalDebit, org.base_currency)} vs Credits {money(totals.totalCredit, org.base_currency)}</span></>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="p-4 rounded-2xl bg-card/60 border border-border/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${c.color}15` }}>
                <c.icon className="h-3.5 w-3.5" style={{ color: c.color }} />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.label}</span>
            </div>
            <div className="text-xl font-bold tabular-nums">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-card/60 border border-border/20 lg:col-span-2">
          <h3 className="text-[13px] font-bold mb-3">Recent journal entries</h3>
          {entries.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No entries yet. Post your first journal from the Journal tab.</p>
          ) : (
            <div className="space-y-1.5">
              {entries.slice(0, 8).map(e => (
                <div key={e.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/10 last:border-0">
                  <span className="text-muted-foreground tabular-nums w-24">{new Date(e.entry_date).toLocaleDateString('en-GB')}</span>
                  <span className="flex-1 truncate">{e.description || <span className="text-muted-foreground italic">(no description)</span>}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{e.source_type}</span>
                  {e.posted_at
                    ? <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><Lock className="h-3 w-3" />Posted</span>
                    : <span className="text-[10px] font-bold text-amber-500">Draft</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 rounded-2xl bg-card/60 border border-border/20">
          <h3 className="text-[13px] font-bold mb-3">Health</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Accounts</span><span className="font-semibold">{/* accounts count comes from parent */}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Posted entries</span><span className="font-semibold tabular-nums">{posted}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Drafts</span><span className="font-semibold tabular-nums">{drafts}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-semibold tabular-nums">{money(totals.revenue, org.base_currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="font-semibold tabular-nums">{money(totals.expenses, org.base_currency)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CHART OF ACCOUNTS
   ========================================================= */
function ChartOfAccountsView({ orgId, accounts, onChange }: { orgId: string; accounts: Account[]; onChange: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{ code: string; name: string; type: AccountType; subtype: string }>({ code: '', name: '', type: 'asset', subtype: '' });

  async function addAccount() {
    if (!form.code.trim() || !form.name.trim()) return;
    const { error } = await (supabase as any).from('acc_chart_of_accounts').insert({
      org_id: orgId, code: form.code.trim(), name: form.name.trim(), type: form.type, subtype: form.subtype || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Account added');
    setForm({ code: '', name: '', type: 'asset', subtype: '' });
    setShowAdd(false);
    onChange();
  }

  async function toggleActive(a: Account) {
    const { error } = await (supabase as any).from('acc_chart_of_accounts')
      .update({ is_active: !a.is_active }).eq('id', a.id);
    if (error) { toast.error(error.message); return; }
    onChange();
  }

  const grouped = useMemo(() => {
    const g: Record<AccountType, Account[]> = { asset: [], liability: [], equity: [], revenue: [], expense: [] };
    accounts.forEach(a => g[a.type].push(a));
    return g;
  }, [accounts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Chart of Accounts</h2>
          <p className="text-xs text-muted-foreground">{accounts.length} accounts</p>
        </div>
        <Button size="sm" className="h-8 rounded-xl gap-1.5 text-xs" onClick={() => setShowAdd(v => !v)}>
          <Plus className="h-3.5 w-3.5" /> Add account
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-border/30 bg-card/60 p-4 grid grid-cols-1 sm:grid-cols-5 gap-2">
          <Input placeholder="Code" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="h-9 rounded-xl text-sm" />
          <Input placeholder="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-9 rounded-xl text-sm sm:col-span-2" />
          <Select value={form.type} onValueChange={(v: AccountType) => setForm(p => ({ ...p, type: v }))}>
            <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['asset','liability','equity','revenue','expense'] as AccountType[]).map(t => (
                <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1.5">
            <Input placeholder="Subtype (optional)" value={form.subtype} onChange={e => setForm(p => ({ ...p, subtype: e.target.value }))} className="h-9 rounded-xl text-sm flex-1" />
            <Button size="sm" className="h-9 rounded-xl" onClick={addAccount}>Add</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(Object.keys(grouped) as AccountType[]).map(type => (
          <div key={type} className="rounded-2xl border border-border/20 bg-card/40 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/20 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ background: TYPE_COLORS[type] }} />
              <span className="text-xs font-bold uppercase tracking-wider">{type}s</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{grouped[type].length}</span>
            </div>
            <div className="divide-y divide-border/10">
              {grouped[type].length === 0 ? (
                <div className="px-4 py-4 text-[11px] text-muted-foreground/60">No accounts</div>
              ) : grouped[type].map(a => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-2 hover:bg-accent/20">
                  <span className="text-[11px] font-mono text-muted-foreground w-14">{a.code}</span>
                  <span className={cn("flex-1 text-[12px] truncate", !a.is_active && "line-through opacity-50")}>{a.name}</span>
                  {a.subtype && <span className="text-[10px] text-muted-foreground">{a.subtype}</span>}
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 rounded-md" onClick={() => toggleActive(a)}>
                    {a.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   JOURNAL ENTRY
   ========================================================= */
interface DraftLine { account_id: string; debit: string; credit: string; memo: string }

function JournalView({ orgId, accounts, entries, onChange, userId, currency, readOnly = false }: {
  orgId: string; accounts: Account[]; entries: JournalEntry[]; onChange: () => void; userId: string; currency: string; readOnly?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [entryDate, setEntryDate] = useState(today);
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([
    { account_id: '', debit: '', credit: '', memo: '' },
    { account_id: '', debit: '', credit: '', memo: '' },
  ]);
  const [posting, setPosting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [entryLines, setEntryLines] = useState<any[]>([]);

  const totals = useMemo(() => {
    const d = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const c = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return { d, c, diff: +(d - c).toFixed(4), balanced: Math.abs(d - c) < 0.005 && d > 0 };
  }, [lines]);

  function addLine()  { setLines(p => [...p, { account_id: '', debit: '', credit: '', memo: '' }]); }
  function removeLine(i: number) { setLines(p => p.filter((_, idx) => idx !== i)); }
  function updateLine(i: number, patch: Partial<DraftLine>) {
    setLines(p => p.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }

  async function post() {
    if (!totals.balanced) { toast.error('Entry must balance — debits must equal credits'); return; }
    const valid = lines.filter(l => l.account_id && ((Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0));
    if (valid.length < 2) { toast.error('At least two lines required'); return; }

    setPosting(true);
    try {
      // 1) create the (unposted) entry
      const { data: entry, error: eErr } = await (supabase as any).from('acc_journal_entries').insert({
        org_id: orgId, entry_date: entryDate, description: description || null,
        source_type: 'manual', created_by: userId,
      }).select().single();
      if (eErr) throw eErr;

      // 2) insert lines
      const linePayload = valid.map(l => ({
        journal_entry_id: entry.id, account_id: l.account_id,
        debit:  Number(l.debit)  || 0,
        credit: Number(l.credit) || 0,
        memo: l.memo || null,
      }));
      const { error: lErr } = await (supabase as any).from('acc_journal_lines').insert(linePayload);
      if (lErr) {
        await (supabase as any).from('acc_journal_entries').delete().eq('id', entry.id);
        throw lErr;
      }

      // 3) post the entry — balanced-entry + period-lock triggers fire here
      const { error: pErr } = await (supabase as any).from('acc_journal_entries')
        .update({ posted_at: new Date().toISOString() }).eq('id', entry.id);
      if (pErr) {
        await (supabase as any).from('acc_journal_entries').delete().eq('id', entry.id);
        throw pErr;
      }

      toast.success('Journal entry posted');
      setEntryDate(today); setDescription('');
      setLines([{ account_id: '', debit: '', credit: '', memo: '' }, { account_id: '', debit: '', credit: '', memo: '' }]);
      onChange();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post entry');
    } finally { setPosting(false); }
  }

  async function reverseEntry(entryId: string) {
    if (!confirm('Post a reversing entry?')) return;
    const { data: original } = await (supabase as any).from('acc_journal_entries').select('*').eq('id', entryId).single();
    const { data: origLines } = await (supabase as any).from('acc_journal_lines').select('*').eq('journal_entry_id', entryId);
    if (!original || !origLines?.length) return;

    const { data: rev, error: rErr } = await (supabase as any).from('acc_journal_entries').insert({
      org_id: original.org_id, entry_date: today,
      description: `Reversal of ${original.description || entryId.slice(0,8)}`,
      source_type: 'reversal', created_by: userId, is_reversal: true, reversed_by_entry_id: entryId,
    }).select().single();
    if (rErr) { toast.error(rErr.message); return; }

    const swapped = origLines.map((l: any) => ({
      journal_entry_id: rev.id, account_id: l.account_id,
      debit:  Number(l.credit), credit: Number(l.debit), memo: `Reversal: ${l.memo || ''}`,
    }));
    const { error: lErr } = await (supabase as any).from('acc_journal_lines').insert(swapped);
    if (lErr) { toast.error(lErr.message); return; }

    const { error: pErr } = await (supabase as any).from('acc_journal_entries')
      .update({ posted_at: new Date().toISOString() }).eq('id', rev.id);
    if (pErr) { toast.error(pErr.message); return; }
    toast.success('Reversing entry posted');
    onChange();
  }

  async function viewEntry(id: string) {
    if (selectedEntry === id) { setSelectedEntry(null); return; }
    const { data } = await (supabase as any).from('acc_journal_lines').select('*, account:acc_chart_of_accounts(code,name)').eq('journal_entry_id', id);
    setEntryLines(data || []);
    setSelectedEntry(id);
  }

  return (
    <div className="space-y-6">
      {!readOnly && (<>
      {/* New entry */}
      <div className="rounded-2xl border border-border/30 bg-card/60 p-5">
        <h3 className="text-[13px] font-bold mb-3">New Journal Entry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="h-9 rounded-xl text-sm mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Office rent for July" className="h-9 rounded-xl text-sm mt-1" />
          </div>
        </div>

        <div className="rounded-xl border border-border/20 overflow-hidden acc-wide-grid-wrap" data-acc-scroll>
          <div className="min-w-[640px]">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-accent/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-4">Account</div>
            <div className="col-span-3">Memo</div>
            <div className="col-span-2 text-right">Debit</div>
            <div className="col-span-2 text-right">Credit</div>
            <div className="col-span-1" />
          </div>
          <div className="divide-y divide-border/10">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                <div className="col-span-4">
                  <Select value={l.account_id} onValueChange={(v) => updateLine(i, { account_id: v })}>
                    <SelectTrigger className="h-8 rounded-lg text-xs bg-transparent"><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.is_active).map(a => (
                        <SelectItem key={a.id} value={a.id} className="text-xs">
                          <span className="font-mono text-muted-foreground mr-2">{a.code}</span>{a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input value={l.memo} onChange={e => updateLine(i, { memo: e.target.value })} placeholder="Memo" className="col-span-3 h-8 rounded-lg text-xs" />
                <Input type="number" step="0.01" min="0" value={l.debit}
                  onChange={e => updateLine(i, { debit: e.target.value, credit: e.target.value ? '' : l.credit })}
                  className="col-span-2 h-8 rounded-lg text-xs text-right tabular-nums" />
                <Input type="number" step="0.01" min="0" value={l.credit}
                  onChange={e => updateLine(i, { credit: e.target.value, debit: e.target.value ? '' : l.debit })}
                  className="col-span-2 h-8 rounded-lg text-xs text-right tabular-nums" />
                <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8 mx-auto" onClick={() => removeLine(i)} disabled={lines.length <= 2}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-border/20 bg-accent/20 text-xs font-bold">
            <div className="col-span-7 flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-[11px] rounded-lg" onClick={addLine}>
                <Plus className="h-3 w-3 mr-1" /> Add line
              </Button>
              {totals.balanced ? (
                <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Balanced</span>
              ) : (
                <span className="text-amber-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Diff {money(totals.diff, currency)}</span>
              )}
            </div>
            <div className="col-span-2 text-right tabular-nums">{money(totals.d, currency)}</div>
            <div className="col-span-2 text-right tabular-nums">{money(totals.c, currency)}</div>
            <div className="col-span-1" />
          </div>
          </div>
        </div>


        <div className="flex justify-end mt-3">
          <Button onClick={post} disabled={!totals.balanced || posting} className="h-9 rounded-xl text-xs gap-1.5">
            {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            Post entry
          </Button>
        </div>
      </div>
      </>)}



      {/* List */}
      <div>
        <h3 className="text-[13px] font-bold mb-2">Journal history</h3>
        <div className="rounded-2xl border border-border/20 bg-card/40 divide-y divide-border/10">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">No entries yet</div>
          ) : entries.map(e => (
            <div key={e.id}>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-accent/20 text-left"
                onClick={() => viewEntry(e.id)}>
                <span className="tabular-nums text-muted-foreground w-24">{new Date(e.entry_date).toLocaleDateString('en-GB')}</span>
                <span className="flex-1 truncate">{e.description || <span className="italic text-muted-foreground">(no description)</span>}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{e.source_type}</span>
                {e.posted_at
                  ? <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><Lock className="h-3 w-3" /> Posted</span>
                  : <span className="text-[10px] font-bold text-amber-500">Draft</span>}
                {e.posted_at && !e.is_reversal && !readOnly && (
                  <span onClick={(ev) => { ev.stopPropagation(); reverseEntry(e.id); }}
                    className="text-[10px] text-red-500 hover:underline">Reverse</span>
                )}
              </button>
              {selectedEntry === e.id && (
                <div className="px-4 pb-3 bg-accent/10">
                  <div className="rounded-lg border border-border/20 overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-accent/30 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      <div className="col-span-6">Account</div>
                      <div className="col-span-2">Memo</div>
                      <div className="col-span-2 text-right">Debit</div>
                      <div className="col-span-2 text-right">Credit</div>
                    </div>
                    {entryLines.map((l: any) => (
                      <div key={l.id} className="grid grid-cols-12 gap-2 px-3 py-1.5 text-xs border-t border-border/10">
                        <div className="col-span-6"><span className="font-mono text-muted-foreground mr-2">{l.account?.code}</span>{l.account?.name}</div>
                        <div className="col-span-2 text-muted-foreground truncate">{l.memo}</div>
                        <div className="col-span-2 text-right tabular-nums">{Number(l.debit)  ? money(Number(l.debit),  currency) : '—'}</div>
                        <div className="col-span-2 text-right tabular-nums">{Number(l.credit) ? money(Number(l.credit), currency) : '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TRIAL BALANCE
   ========================================================= */
function TrialBalanceView({ trial, currency }: { trial: TrialBalanceRow[]; currency: string }) {
  const totalDebit  = trial.reduce((s,r) => s + Number(r.total_debit), 0);
  const totalCredit = trial.reduce((s,r) => s + Number(r.total_credit), 0);
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.005;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Trial Balance</h2>
          <p className="text-xs text-muted-foreground">Live from the ledger — never cached</p>
        </div>
        <div className={cn(
          "text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5",
          balanced ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-500" : "border-red-500/30 bg-red-500/5 text-red-500"
        )}>
          {balanced ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {balanced ? 'Balanced' : 'Out of balance'}
        </div>
      </div>

      <div className="rounded-2xl border border-border/20 bg-card/40 overflow-hidden acc-wide-grid-wrap" data-acc-scroll>
        <div className="min-w-[640px]">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-accent/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-1">Code</div>
          <div className="col-span-5">Account</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2 text-right">Debit</div>
          <div className="col-span-2 text-right">Credit</div>
        </div>
        <div className="divide-y divide-border/10">
          {trial.map(r => (
            <div key={r.account_id} className="grid grid-cols-12 gap-2 px-4 py-2 text-xs items-center">
              <div className="col-span-1 font-mono text-muted-foreground">{r.account_code}</div>
              <div className="col-span-5">{r.account_name}</div>
              <div className="col-span-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md capitalize" style={{ background: `${TYPE_COLORS[r.account_type]}15`, color: TYPE_COLORS[r.account_type] }}>{r.account_type}</span>
              </div>
              <div className="col-span-2 text-right tabular-nums">{Number(r.total_debit)  ? money(Number(r.total_debit),  currency) : '—'}</div>
              <div className="col-span-2 text-right tabular-nums">{Number(r.total_credit) ? money(Number(r.total_credit), currency) : '—'}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-t border-border/20 bg-accent/20 text-xs font-bold">
          <div className="col-span-8 text-right">Totals</div>
          <div className="col-span-2 text-right tabular-nums">{money(totalDebit, currency)}</div>
          <div className="col-span-2 text-right tabular-nums">{money(totalCredit, currency)}</div>
        </div>
        </div>
      </div>

    </div>
  );
}

/* =========================================================
   REPORTS — Balance Sheet & P&L
   ========================================================= */
function ReportsView({ trial, currency }: { trial: TrialBalanceRow[]; currency: string }) {
  const groups = useMemo(() => {
    const g: Record<AccountType, TrialBalanceRow[]> = { asset: [], liability: [], equity: [], revenue: [], expense: [] };
    trial.forEach(r => g[r.account_type].push(r));
    return g;
  }, [trial]);

  const sumSigned = (rows: TrialBalanceRow[], side: 'debit'|'credit') =>
    rows.reduce((s, r) => s + Number(side === 'debit' ? Number(r.total_debit) - Number(r.total_credit) : Number(r.total_credit) - Number(r.total_debit)), 0);

  const assets      = sumSigned(groups.asset, 'debit');
  const liabilities = sumSigned(groups.liability, 'credit');
  const equity      = sumSigned(groups.equity, 'credit');
  const revenue     = sumSigned(groups.revenue, 'credit');
  const expenses    = sumSigned(groups.expense, 'debit');
  const netIncome   = revenue - expenses;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Balance Sheet */}
      <section className="rounded-2xl border border-border/20 bg-card/40 p-5">
        <h3 className="text-[13px] font-bold mb-1">Balance Sheet</h3>
        <p className="text-[10px] text-muted-foreground mb-4">As at {new Date().toLocaleDateString('en-GB')}</p>

        <ReportGroup title="Assets" rows={groups.asset} sign="debit" currency={currency} color={TYPE_COLORS.asset} />
        <div className="flex justify-between text-xs font-bold py-2 border-t border-border/20 mb-4">
          <span>Total Assets</span><span className="tabular-nums">{money(assets, currency)}</span>
        </div>

        <ReportGroup title="Liabilities" rows={groups.liability} sign="credit" currency={currency} color={TYPE_COLORS.liability} />
        <div className="flex justify-between text-xs font-bold py-2 border-t border-border/20 mb-4">
          <span>Total Liabilities</span><span className="tabular-nums">{money(liabilities, currency)}</span>
        </div>

        <ReportGroup title="Equity" rows={groups.equity} sign="credit" currency={currency} color={TYPE_COLORS.equity} />
        <div className="flex justify-between text-xs py-1">
          <span className="text-muted-foreground">Net income (period)</span>
          <span className="tabular-nums">{money(netIncome, currency)}</span>
        </div>
        <div className="flex justify-between text-xs font-bold py-2 border-t border-border/20">
          <span>Total Equity</span><span className="tabular-nums">{money(equity + netIncome, currency)}</span>
        </div>
        <div className="flex justify-between text-[13px] font-bold py-3 mt-2 border-t-2 border-border/40">
          <span>Liabilities + Equity</span><span className="tabular-nums">{money(liabilities + equity + netIncome, currency)}</span>
        </div>
        {Math.abs(assets - (liabilities + equity + netIncome)) > 0.005 && (
          <div className="mt-2 text-[10px] text-red-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Balance sheet does not balance — check ledger integrity.
          </div>
        )}
      </section>

      {/* P&L */}
      <section className="rounded-2xl border border-border/20 bg-card/40 p-5">
        <h3 className="text-[13px] font-bold mb-1">Profit &amp; Loss</h3>
        <p className="text-[10px] text-muted-foreground mb-4">All posted activity to date</p>

        <ReportGroup title="Revenue" rows={groups.revenue} sign="credit" currency={currency} color={TYPE_COLORS.revenue} />
        <div className="flex justify-between text-xs font-bold py-2 border-t border-border/20 mb-4">
          <span>Total Revenue</span><span className="tabular-nums">{money(revenue, currency)}</span>
        </div>

        <ReportGroup title="Expenses" rows={groups.expense} sign="debit" currency={currency} color={TYPE_COLORS.expense} />
        <div className="flex justify-between text-xs font-bold py-2 border-t border-border/20 mb-4">
          <span>Total Expenses</span><span className="tabular-nums">{money(expenses, currency)}</span>
        </div>

        <div className={cn("flex justify-between text-[13px] font-bold py-3 border-t-2 border-border/40",
          netIncome >= 0 ? "text-emerald-500" : "text-red-500")}>
          <span>Net Income</span><span className="tabular-nums">{money(netIncome, currency)}</span>
        </div>
      </section>
    </div>
  );
}

function ReportGroup({ title, rows, sign, currency, color }: {
  title: string; rows: TrialBalanceRow[]; sign: 'debit'|'credit'; currency: string; color: string;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-[11px] text-muted-foreground/60 py-1">No accounts</div>
      ) : rows.map(r => {
        const amt = sign === 'debit'
          ? Number(r.total_debit) - Number(r.total_credit)
          : Number(r.total_credit) - Number(r.total_debit);
        if (Math.abs(amt) < 0.005) return null;
        return (
          <div key={r.account_id} className="flex justify-between text-xs py-1">
            <span className="text-muted-foreground"><span className="font-mono mr-2">{r.account_code}</span>{r.account_name}</span>
            <span className="tabular-nums">{money(amt, currency)}</span>
          </div>
        );
      })}
    </div>
  );
}

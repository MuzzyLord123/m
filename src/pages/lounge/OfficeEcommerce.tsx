import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingBag, Server, Plus, ExternalLink, Filter, Search,
  Loader2, Globe, AlertTriangle, CheckCircle2, Pause, Trash2, Edit3,
  Play, XCircle, Rocket, Image as ImageIcon, User as UserIcon, Calendar,
  History, Receipt, Link2, FileText, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/* ------------------------ Types ------------------------ */
type Status = 'active' | 'paused' | 'cancelled' | 'trial';
type HostingStatus = 'live' | 'building' | 'error' | 'not_deployed';
type HostingProvider = 'vercel' | 'netlify' | 'cloudflare' | 'other';
type Cycle = 'monthly' | 'annual';

interface Site {
  id: string;
  owner_user_id: string;
  client_company_id: string | null;
  client_name: string | null;
  site_name: string;
  site_url: string | null;
  hero_image_url: string | null;
  template_used: string | null;
  status: Status;
  billing_amount: number;
  billing_currency: string;
  billing_cycle: Cycle;
  subscription_start_date: string | null;
  next_billing_date: string | null;
  next_renewal_date: string | null;
  hosting_provider: HostingProvider;
  hosting_status: HostingStatus;
  is_hosted_only: boolean;
  account_manager_user_id: string | null;
  notes: string | null;
  acc_org_id: string | null;
  acc_customer_id: string | null;
  acc_revenue_account_id: string | null;
  auto_invoice: boolean;
  last_invoiced_on: string | null;
  created_at: string;
  updated_at: string;
}

interface SiteEvent {
  id: string;
  subscription_site_id: string;
  event_type: string;
  detail: any;
  occurred_at: string;
  actor: string | null;
}

type Tab = 'running' | 'hosted';

// Restrained status system: a single small dot + text label, no loud pill backgrounds.
const STATUS_META: Record<Status, { label: string; dot: string; text: string }> = {
  active:    { label: 'Active',    dot: 'bg-emerald-500',            text: 'text-foreground' },
  trial:     { label: 'Trial',     dot: 'bg-blue-500',               text: 'text-foreground' },
  paused:    { label: 'Paused',    dot: 'bg-amber-500',              text: 'text-foreground' },
  cancelled: { label: 'Cancelled', dot: 'bg-muted-foreground/40',    text: 'text-muted-foreground' },
};

const HOSTING_META: Record<HostingStatus, { label: string; dot: string; text: string }> = {
  live:         { label: 'Live',         dot: 'bg-emerald-500',                     text: 'text-foreground' },
  building:     { label: 'Building',     dot: 'bg-blue-500 animate-pulse',          text: 'text-foreground' },
  error:        { label: 'Error',        dot: 'bg-red-500 animate-pulse',           text: 'text-red-500' },
  not_deployed: { label: 'Not deployed', dot: 'bg-muted-foreground/40',             text: 'text-muted-foreground' },
};

function money(n: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(n || 0));
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr).getTime();
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

/* ============================================================
   Root
   ============================================================ */
export default function OfficeEcommerce({
  initialTab = 'running',
  embedded = false,
  title,
}: { initialTab?: Tab; embedded?: boolean; title?: string } = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [renewalFilter, setRenewalFilter] = useState<'all' | '30' | 'overdue'>('all');
  const [hostingFilter, setHostingFilter] = useState<'all' | HostingStatus>('all');
  const [editing, setEditing] = useState<Site | null>(null);
  const [detail, setDetail] = useState<Site | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('subscription_sites')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setSites((data || []) as Site[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // realtime
  useEffect(() => {
    if (!user) return;
    const ch = (supabase as any).channel('subscription-sites-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_sites' }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, [user, load]);

  const filtered = useMemo(() => {
    // Truly independent lists (spec §3):
    //  - Running Subscriptions = any site being billed (status != cancelled AND has a billing amount)
    //  - Hosted                = any site actually deployed and live in production right now
    // A site can appear in one, both, or neither.
    let list = tab === 'hosted'
      ? sites.filter(s => s.hosting_status === 'live')
      : sites.filter(s => s.status !== 'cancelled' && Number(s.billing_amount) > 0);

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(s =>
        s.site_name.toLowerCase().includes(q) ||
        (s.client_name || '').toLowerCase().includes(q) ||
        (s.site_url || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all')   list = list.filter(s => s.status === statusFilter);
    if (hostingFilter !== 'all')  list = list.filter(s => s.hosting_status === hostingFilter);
    if (renewalFilter === '30') {
      list = list.filter(s => {
        const d = daysUntil(s.next_renewal_date);
        return d !== null && d >= 0 && d <= 30;
      });
    } else if (renewalFilter === 'overdue') {
      list = list.filter(s => {
        const d = daysUntil(s.next_renewal_date);
        return d !== null && d < 0;
      });
    }
    return list;
  }, [tab, sites, query, statusFilter, hostingFilter, renewalFilter]);

  const summary = useMemo(() => {
    const active = sites.filter(s => s.status === 'active');
    const mrr = active.reduce((sum, s) => {
      const amt = Number(s.billing_amount) || 0;
      return sum + (s.billing_cycle === 'annual' ? amt / 12 : amt);
    }, 0);
    const renewing = sites.filter(s => {
      const d = daysUntil(s.next_renewal_date);
      return d !== null && d >= 0 && d <= 30;
    }).length;
    const errors = sites.filter(s => s.hosting_status === 'error').length;
    const live = sites.filter(s => s.hosting_status === 'live').length;
    return { activeCount: active.length, mrr, renewing, errors, live };
  }, [sites]);

  return (
    <div className={cn(
      embedded
        ? "flex flex-col h-full min-h-0 bg-background"
        : "fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    )}>
      {/* Header */}
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
        {!embedded && (
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-xl text-xs px-2 sm:px-3"
            onClick={() => navigate('/lounge')}>
            <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Lounge</span>
          </Button>
        )}
        {!embedded && <div className="hidden sm:block h-4 w-px bg-border/40" />}
        <div className="h-7 w-7 rounded-lg bg-foreground/5 border border-border/40 flex items-center justify-center shrink-0">
          {initialTab === 'hosted' ? <Server className="h-3.5 w-3.5 text-foreground" /> : <ShoppingBag className="h-3.5 w-3.5 text-foreground" />}
        </div>
        <span className="text-sm font-semibold tracking-tight">{title ?? 'E-commerce'}</span>
        {!embedded && (
          <span className="ml-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/40 uppercase tracking-wider whitespace-nowrap">
            Internal
          </span>
        )}
        <div className="flex-1" />
        <Button size="sm" className="h-8 rounded-lg text-xs gap-1.5" onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New site</span>
        </Button>
      </header>

      {/* Tabs (hidden when embedded — page is dedicated to a single tab) */}
      {!embedded && (
      <div className="shrink-0 border-b border-border/30 bg-background/60 backdrop-blur-xl px-2 sm:px-5">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {([
            { id: 'running', label: 'Running Subscriptions', icon: ShoppingBag },
            { id: 'hosted',  label: 'Hosted',                 icon: Server },
          ] as { id: Tab; label: string; icon: any }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 h-11 sm:h-10 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap',
                tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}>
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              <span className="text-[10px] text-muted-foreground/70 ml-1 tabular-nums">
                ({t.id === 'hosted'
                  ? sites.filter(s => s.hosting_status === 'live').length
                  : sites.filter(s => s.status !== 'cancelled' && Number(s.billing_amount) > 0).length})
              </span>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-auto">

        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            <SummaryCard label="Active subscriptions" value={String(summary.activeCount)} icon={CheckCircle2} color="#10b981" />
            <SummaryCard label="MRR (equivalent)"     value={money(summary.mrr)}          icon={Rocket}       color="#a855f7" />
            <SummaryCard label="Renewing in 30 days"  value={String(summary.renewing)}    icon={Calendar}     color="#3b82f6" />
            <SummaryCard label="Hosting errors"       value={String(summary.errors)}      icon={AlertTriangle} color={summary.errors > 0 ? '#ef4444' : '#94a3b8'} />
          </div>

          {/* Filter bar */}
          <div className="rounded-2xl border border-border/30 bg-card/40 p-2 sm:p-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search sites, clients, URLs…"
                className="h-9 pl-8 rounded-xl text-sm bg-background/60" />
            </div>

            {tab === 'running' ? (
              <>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs bg-background/60">
                    <Filter className="h-3.5 w-3.5 mr-1.5" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all"       className="text-xs">All statuses</SelectItem>
                    <SelectItem value="active"    className="text-xs">Active</SelectItem>
                    <SelectItem value="trial"     className="text-xs">Trial</SelectItem>
                    <SelectItem value="paused"    className="text-xs">Paused</SelectItem>
                    <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={renewalFilter} onValueChange={(v: any) => setRenewalFilter(v)}>
                  <SelectTrigger className="h-9 w-[150px] rounded-xl text-xs bg-background/60">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" /><SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all"     className="text-xs">Any renewal</SelectItem>
                    <SelectItem value="30"      className="text-xs">Next 30 days</SelectItem>
                    <SelectItem value="overdue" className="text-xs">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              <Select value={hostingFilter} onValueChange={(v: any) => setHostingFilter(v)}>
                <SelectTrigger className="h-9 w-[150px] rounded-xl text-xs bg-background/60">
                  <Server className="h-3.5 w-3.5 mr-1.5" /><SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"          className="text-xs">All hosting</SelectItem>
                  <SelectItem value="live"         className="text-xs">Live</SelectItem>
                  <SelectItem value="building"     className="text-xs">Building</SelectItem>
                  <SelectItem value="error"        className="text-xs">Error</SelectItem>
                  <SelectItem value="not_deployed" className="text-xs">Not deployed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState tab={tab} onCreate={() => setShowNew(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              <AnimatePresence mode="popLayout">
                {filtered.map(s => (
                  <SiteCard key={s.id} site={s} tab={tab}
                    onOpen={() => setDetail(s)}
                    onEdit={() => setEditing(s)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showNew && (
        <SiteEditor
          open
          onClose={() => setShowNew(false)}
          onSaved={load}
          userId={user!.id}
        />
      )}
      {editing && (
        <SiteEditor
          open
          site={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
          userId={user!.id}
        />
      )}
      {detail && (
        <SiteDetail
          open
          site={detail}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setDetail(null); }}
          onChanged={load}
          userId={user!.id}
        />
      )}
    </div>
  );
}

/* ============================================================
   Site Card
   ============================================================ */
function SiteCard({ site, tab, onOpen, onEdit }: { site: Site; tab: Tab; onOpen: () => void; onEdit: () => void }) {
  const st = STATUS_META[site.status];
  const hs = HOSTING_META[site.hosting_status];
  const renewalDays = daysUntil(site.next_renewal_date);

  const handleClick = () => {
    if (tab === 'hosted' && site.site_url) {
      window.open(site.site_url, '_blank', 'noopener,noreferrer');
    }
    onOpen();
  };

  const attention = site.hosting_status === 'error' || site.hosting_status === 'building';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group rounded-2xl overflow-hidden border bg-card/60 hover:bg-card/80 transition-colors cursor-pointer flex flex-col',
        attention ? 'border-red-500/40 shadow-lg shadow-red-500/5' : 'border-border/30 hover:border-border/60'
      )}
      onClick={handleClick}
    >
      {/* Hero */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-muted/60 to-muted/20 overflow-hidden">
        {site.hero_image_url ? (
          <img src={site.hero_image_url} alt={site.site_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Restrained status: single small dot + label on a subtle backdrop chip */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-background/85 backdrop-blur-md border border-border/40 text-foreground">
            <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
            {st.label}
          </span>
        </div>
        {/* Hosting dot + label */}
        <div className="absolute top-2 right-2">
          <span className={cn('inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-background/85 backdrop-blur-md border border-border/40', hs.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', hs.dot)} />
            {hs.label}
          </span>
        </div>
        {tab === 'hosted' && site.site_url && (
          <div className="absolute bottom-2 right-2 h-7 w-7 rounded-lg bg-background/80 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm truncate">{site.site_name}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {site.client_name || (site.site_url ? site.site_url.replace(/^https?:\/\//, '') : 'No client')}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="opacity-0 group-hover:opacity-100 shrink-0 h-7 w-7 rounded-lg hover:bg-accent flex items-center justify-center transition-opacity"
            aria-label="Edit"
          >
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="text-[11px] tabular-nums font-bold">
            {Number(site.billing_amount) > 0
              ? <>{money(Number(site.billing_amount), site.billing_currency)} <span className="text-muted-foreground font-medium">/ {site.billing_cycle === 'annual' ? 'yr' : 'mo'}</span></>
              : <span className="text-muted-foreground font-medium">No billing</span>}
          </div>
          {renewalDays !== null && site.status !== 'cancelled' && (
            <div className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap',
              renewalDays < 0    ? 'bg-red-500/10 text-red-500' :
              renewalDays <= 7   ? 'bg-amber-500/10 text-amber-500' :
              renewalDays <= 30  ? 'bg-blue-500/10 text-blue-500' :
                                   'bg-muted/50 text-muted-foreground'
            )}>
              <Calendar className="h-2.5 w-2.5" />
              {renewalDays < 0 ? `${Math.abs(renewalDays)}d overdue` : `${renewalDays}d`}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   Summary Card
   ============================================================ */
function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-card/60 border border-border/20">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{label}</span>
      </div>
      <div className="text-lg sm:text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

/* ============================================================
   Empty State
   ============================================================ */
function EmptyState({ tab, onCreate }: { tab: Tab; onCreate: () => void }) {
  const isHosted = tab === 'hosted';
  return (
    <div className="rounded-xl border border-dashed border-border/50 bg-card/30 py-20 px-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-foreground/[0.04] border border-border/40 mx-auto flex items-center justify-center mb-4">
        {isHosted ? <Server className="h-6 w-6 text-muted-foreground" /> : <ShoppingBag className="h-6 w-6 text-muted-foreground" />}
      </div>
      <h3 className="text-base font-semibold tracking-tight">
        {isHosted ? 'No hosted sites live right now' : 'No active subscriptions'}
      </h3>
      <p className="text-[13px] text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
        {isHosted
          ? 'Every site marked as Live in production will appear here — regardless of billing state. Deploy a site or mark one as Live to see it.'
          : 'Every client currently being billed shows up here — regardless of whether their site is live. Add a site with an active subscription to get started.'}
      </p>
      <Button className="mt-5 h-9 rounded-lg text-xs gap-1.5" onClick={onCreate}>
        <Plus className="h-3.5 w-3.5" /> {isHosted ? 'Add a hosted site' : 'Add a subscription'}
      </Button>
    </div>
  );
}

/* ============================================================
   Editor Dialog (create + edit)
   ============================================================ */
function SiteEditor({
  open, site, onClose, onSaved, userId,
}: { open: boolean; site?: Site; onClose: () => void; onSaved: () => void; userId: string }) {
  const isNew = !site;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    site_name:               site?.site_name ?? '',
    client_name:             site?.client_name ?? '',
    site_url:                site?.site_url ?? '',
    hero_image_url:          site?.hero_image_url ?? '',
    template_used:           site?.template_used ?? '',
    status:                  (site?.status ?? 'trial') as Status,
    billing_amount:          site ? String(site.billing_amount) : '',
    billing_currency:        site?.billing_currency ?? 'GBP',
    billing_cycle:           (site?.billing_cycle ?? 'monthly') as Cycle,
    subscription_start_date: site?.subscription_start_date ?? '',
    next_renewal_date:       site?.next_renewal_date ?? '',
    hosting_provider:        (site?.hosting_provider ?? 'vercel') as HostingProvider,
    hosting_status:          (site?.hosting_status ?? 'not_deployed') as HostingStatus,
    is_hosted_only:          site?.is_hosted_only ?? false,
    notes:                   site?.notes ?? '',
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function save() {
    if (!form.site_name.trim()) { toast.error('Site name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        owner_user_id: userId,
        site_name:     form.site_name.trim(),
        client_name:   form.client_name.trim() || null,
        site_url:      form.site_url.trim() || null,
        hero_image_url:form.hero_image_url.trim() || null,
        template_used: form.template_used.trim() || null,
        status:        form.status,
        billing_amount:Number(form.billing_amount) || 0,
        billing_currency: form.billing_currency,
        billing_cycle: form.billing_cycle,
        subscription_start_date: form.subscription_start_date || null,
        next_renewal_date:       form.next_renewal_date || null,
        hosting_provider: form.hosting_provider,
        hosting_status:   form.hosting_status,
        is_hosted_only:   form.is_hosted_only,
        notes:            form.notes.trim() || null,
      };

      if (isNew) {
        const { data, error } = await (supabase as any)
          .from('subscription_sites').insert(payload).select().single();
        if (error) throw error;
        await (supabase as any).from('subscription_site_events').insert({
          subscription_site_id: data.id, event_type: 'created', actor_user_id: userId, actor: 'user',
          detail: { site_name: data.site_name },
        });
        toast.success('Site added');
      } else {
        const { error } = await (supabase as any)
          .from('subscription_sites').update(payload).eq('id', site!.id);
        if (error) throw error;
        await (supabase as any).from('subscription_site_events').insert({
          subscription_site_id: site!.id, event_type: 'edited', actor_user_id: userId, actor: 'user',
        });
        toast.success('Site updated');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save');
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{isNew ? 'New subscription site' : 'Edit site'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <Field label="Site name *" className="sm:col-span-2">
            <Input value={form.site_name} onChange={e => set('site_name', e.target.value)} placeholder="Acme Storefront" />
          </Field>
          <Field label="Client name">
            <Input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Acme Ltd" />
          </Field>
          <Field label="Site URL">
            <Input value={form.site_url} onChange={e => set('site_url', e.target.value)} placeholder="https://acme.com" />
          </Field>
          <Field label="Hero image URL" className="sm:col-span-2">
            <Input value={form.hero_image_url} onChange={e => set('hero_image_url', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Template used">
            <Input value={form.template_used} onChange={e => set('template_used', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v: Status) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['trial','active','paused','cancelled'] as Status[]).map(s => (
                  <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Billing amount">
            <Input type="number" step="0.01" min="0" value={form.billing_amount}
              onChange={e => set('billing_amount', e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Currency">
            <Select value={form.billing_currency} onValueChange={(v) => set('billing_currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['GBP','USD','EUR','AUD','CAD'].map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cycle">
            <Select value={form.billing_cycle} onValueChange={(v: Cycle) => set('billing_cycle', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                <SelectItem value="annual"  className="text-xs">Annual</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Subscription start">
            <Input type="date" value={form.subscription_start_date} onChange={e => set('subscription_start_date', e.target.value)} />
          </Field>
          <Field label="Next renewal">
            <Input type="date" value={form.next_renewal_date} onChange={e => set('next_renewal_date', e.target.value)} />
          </Field>

          <Field label="Hosting provider">
            <Select value={form.hosting_provider} onValueChange={(v: HostingProvider) => set('hosting_provider', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['vercel','netlify','cloudflare','other'] as HostingProvider[]).map(p => (
                  <SelectItem key={p} value={p} className="capitalize text-xs">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Hosting status">
            <Select value={form.hosting_status} onValueChange={(v: HostingStatus) => set('hosting_status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(['not_deployed','building','live','error'] as HostingStatus[]).map(s => (
                  <SelectItem key={s} value={s} className="capitalize text-xs">{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Hosted-only site (not billed)" className="sm:col-span-2">
            <label className="flex items-center gap-2 h-9 px-3 rounded-xl border border-border/30 bg-background/40 cursor-pointer text-xs">
              <input type="checkbox" checked={form.is_hosted_only} onChange={e => set('is_hosted_only', e.target.checked)} className="rounded" />
              Show in Hosted tab only — internal demo, free-hosted, etc.
            </label>
          </Field>

          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Anything the team needs to know" />
          </Field>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose} className="h-9 rounded-xl text-xs">Cancel</Button>
          <Button onClick={save} disabled={saving} className="h-9 rounded-xl text-xs gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {isNew ? 'Create site' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1 [&_input]:h-9 [&_input]:rounded-xl [&_input]:text-sm [&_textarea]:rounded-xl [&_textarea]:text-sm [&_[role=combobox]]:h-9 [&_[role=combobox]]:rounded-xl [&_[role=combobox]]:text-xs">
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   Detail Dialog
   ============================================================ */
function SiteDetail({
  open, site, onClose, onEdit, onChanged, userId,
}: { open: boolean; site: Site; onClose: () => void; onEdit: () => void; onChanged: () => void; userId: string }) {
  const [events, setEvents] = useState<SiteEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const st = STATUS_META[site.status];
  const hs = HOSTING_META[site.hosting_status];
  const renewalDays = daysUntil(site.next_renewal_date);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('subscription_site_events')
        .select('*').eq('subscription_site_id', site.id)
        .order('occurred_at', { ascending: false }).limit(30);
      setEvents((data || []) as SiteEvent[]);
    })();
  }, [site.id]);

  async function quickAction(action: 'pause' | 'resume' | 'cancel' | 'delete') {
    if (action === 'delete' && !confirm('Delete this site record? This cannot be undone.')) return;
    setBusy(true);
    try {
      if (action === 'delete') {
        const { error } = await (supabase as any).from('subscription_sites').delete().eq('id', site.id);
        if (error) throw error;
        toast.success('Site deleted');
        onChanged(); onClose();
        return;
      }

      const nextStatus: Status =
        action === 'pause'  ? 'paused' :
        action === 'resume' ? 'active' :
                              'cancelled';
      const eventType =
        action === 'pause'  ? 'paused' :
        action === 'resume' ? 'resumed' :
                              'cancelled';

      const { error } = await (supabase as any).from('subscription_sites')
        .update({ status: nextStatus }).eq('id', site.id);
      if (error) throw error;

      await (supabase as any).from('subscription_site_events').insert({
        subscription_site_id: site.id, event_type: eventType, actor_user_id: userId, actor: 'user',
      });
      toast.success(`Site ${nextStatus}`);
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || 'Action failed');
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl p-0">
        {/* Hero */}
        <div className="relative aspect-[21/9] bg-gradient-to-br from-muted/60 to-muted/20 overflow-hidden rounded-t-2xl">
          {site.hero_image_url ? (
            <img src={site.hero_image_url} alt={site.site_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-10 w-10 text-muted-foreground/30" /></div>
          )}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-background/85 backdrop-blur-md border border-border/40 text-foreground">
              <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} /> {st.label}
            </span>
            <span className={cn('inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-background/85 backdrop-blur-md border border-border/40', hs.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', hs.dot)} /> {hs.label}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <DialogHeader className="p-0">
                <DialogTitle className="text-lg font-bold">{site.site_name}</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground mt-0.5">
                {site.client_name || 'No client set'}
                {site.template_used && <> · Template: {site.template_used}</>}
              </p>
              {site.site_url && (
                <a href={site.site_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-fuchsia-500 hover:underline mt-1">
                  <Globe className="h-3 w-3" /> {site.site_url.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs gap-1.5" onClick={onEdit}>
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </Button>
              {site.status !== 'cancelled' && (site.status === 'paused'
                ? <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs gap-1.5" disabled={busy} onClick={() => quickAction('resume')}><Play className="h-3.5 w-3.5" /> Resume</Button>
                : <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs gap-1.5" disabled={busy} onClick={() => quickAction('pause')}><Pause className="h-3.5 w-3.5" /> Pause</Button>
              )}
              {site.status !== 'cancelled' && (
                <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs gap-1.5 text-amber-500" disabled={busy} onClick={() => quickAction('cancel')}>
                  <XCircle className="h-3.5 w-3.5" /> Cancel
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-8 rounded-xl text-xs gap-1.5 text-red-500" disabled={busy} onClick={() => quickAction('delete')}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <InfoTile label="Billing" value={Number(site.billing_amount) > 0
              ? `${money(Number(site.billing_amount), site.billing_currency)} / ${site.billing_cycle === 'annual' ? 'yr' : 'mo'}`
              : '—'} />
            <InfoTile label="Renewal" value={site.next_renewal_date
              ? `${new Date(site.next_renewal_date).toLocaleDateString('en-GB')}${renewalDays !== null ? ` (${renewalDays < 0 ? `${Math.abs(renewalDays)}d late` : `${renewalDays}d`})` : ''}`
              : '—'} />
            <InfoTile label="Hosting" value={`${site.hosting_provider} · ${hs.label}`} />
            <InfoTile label="Started" value={site.subscription_start_date
              ? new Date(site.subscription_start_date).toLocaleDateString('en-GB') : '—'} />
          </div>

          {site.notes && (
            <div className="rounded-2xl border border-border/30 bg-card/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Notes</div>
              <p className="text-xs whitespace-pre-wrap">{site.notes}</p>
            </div>
          )}

          {/* Billing history (Accounting integration) */}
          <BillingHistory site={site} userId={userId} onChanged={onChanged} />


          {/* Events */}
          <div className="rounded-2xl border border-border/30 bg-card/40 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              <History className="h-3 w-3" /> Activity
            </div>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-1.5">
                {events.map(e => (
                  <div key={e.id} className="flex items-center gap-3 text-xs py-1 border-b border-border/10 last:border-0">
                    <span className="text-muted-foreground tabular-nums w-32 shrink-0">{new Date(e.occurred_at).toLocaleString('en-GB')}</span>
                    <span className="font-medium capitalize">{e.event_type.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{e.actor || 'system'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-card/50 border border-border/20">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold mt-0.5 truncate">{value}</div>
    </div>
  );
}

/* ============================================================
   Billing History (Accounting integration)
   ============================================================ */
interface AccOrg { id: string; name: string; base_currency: string }
interface AccCustomer { id: string; name: string; org_id: string }
interface AccAccount { id: string; account_code: string; account_name: string; account_type: string; org_id: string }
interface LinkedInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  total: number;
  currency: string;
  status: string;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

function BillingHistory({ site, userId, onChanged }: { site: Site; userId: string; onChanged: () => void }) {
  const [orgs, setOrgs] = useState<AccOrg[]>([]);
  const [customers, setCustomers] = useState<AccCustomer[]>([]);
  const [accounts, setAccounts] = useState<AccAccount[]>([]);
  const [invoices, setInvoices] = useState<LinkedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    acc_org_id: site.acc_org_id || '',
    acc_customer_id: site.acc_customer_id || '',
    acc_revenue_account_id: site.acc_revenue_account_id || '',
    auto_invoice: site.auto_invoice ?? false,
  });

  const isLinked = !!(site.acc_org_id && site.acc_customer_id && site.acc_revenue_account_id);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [o, c, a, inv] = await Promise.all([
      (supabase as any).from('acc_organizations').select('id,name,base_currency').order('name'),
      (supabase as any).from('acc_customers').select('id,name,org_id').order('name'),
      (supabase as any).from('acc_chart_of_accounts').select('id,account_code,account_name,account_type,org_id').in('account_type', ['revenue', 'income']).order('account_code'),
      (supabase as any).from('acc_ar_invoices').select('id,invoice_number,invoice_date,due_date,total,currency,status')
        .eq('subscription_site_id', site.id).order('invoice_date', { ascending: false }).limit(24),
    ]);
    setOrgs((o.data || []) as AccOrg[]);
    setCustomers((c.data || []) as AccCustomer[]);
    setAccounts((a.data || []) as AccAccount[]);
    setInvoices((inv.data || []) as LinkedInvoice[]);
    setLoading(false);
  }, [site.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const orgCustomers = useMemo(() => customers.filter(c => c.org_id === form.acc_org_id), [customers, form.acc_org_id]);
  const orgAccounts  = useMemo(() => accounts.filter(a => a.org_id === form.acc_org_id), [accounts, form.acc_org_id]);

  async function saveLink() {
    if (!form.acc_org_id || !form.acc_customer_id || !form.acc_revenue_account_id) {
      toast.error('Pick an organization, customer, and revenue account'); return;
    }
    setLinking(true);
    try {
      const { error } = await (supabase as any).from('subscription_sites').update({
        acc_org_id: form.acc_org_id,
        acc_customer_id: form.acc_customer_id,
        acc_revenue_account_id: form.acc_revenue_account_id,
        auto_invoice: form.auto_invoice,
      }).eq('id', site.id);
      if (error) throw error;
      await (supabase as any).from('subscription_site_events').insert({
        subscription_site_id: site.id, event_type: 'accounting_linked', actor_user_id: userId, actor: 'user',
      });
      toast.success('Linked to Accounting');
      onChanged();
    } catch (e: any) { toast.error(e?.message || 'Failed to link'); }
    finally { setLinking(false); }
  }

  async function generateInvoice() {
    if (!isLinked) { toast.error('Link this site to Accounting first'); return; }
    const amount = Number(site.billing_amount) || 0;
    if (amount <= 0) { toast.error('Set a billing amount on this site first'); return; }
    setGenerating(true);
    try {
      const today = new Date();
      const invoiceDate = today.toISOString().slice(0, 10);
      const dueDate = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10);
      const invoiceNumber = `SUB-${site.id.slice(0, 6).toUpperCase()}-${today.toISOString().slice(0, 10).replace(/-/g, '')}`;
      const desc = `${site.site_name} — ${site.billing_cycle === 'annual' ? 'annual' : 'monthly'} subscription`;

      const { data: inv, error: invErr } = await (supabase as any).from('acc_ar_invoices').insert({
        org_id: site.acc_org_id,
        customer_id: site.acc_customer_id,
        subscription_site_id: site.id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        currency: site.billing_currency,
        subtotal: amount,
        tax_total: 0,
        total: amount,
        status: 'draft',
        notes: `Auto-generated from subscription site.`,
        created_by: userId,
      }).select().single();
      if (invErr) throw invErr;

      const { error: lineErr } = await (supabase as any).from('acc_ar_invoice_lines').insert({
        invoice_id: inv.id, line_no: 1, description: desc,
        quantity: 1, unit_price: amount, tax_rate: 0,
        line_subtotal: amount, line_tax: 0, line_total: amount,
        revenue_account_id: site.acc_revenue_account_id,
      });
      if (lineErr) throw lineErr;

      // Roll forward renewal
      const base = site.next_renewal_date ? new Date(site.next_renewal_date) : today;
      const next = site.billing_cycle === 'annual' ? addMonths(base, 12) : addMonths(base, 1);
      await (supabase as any).from('subscription_sites').update({
        last_invoiced_on: invoiceDate,
        next_renewal_date: next.toISOString().slice(0, 10),
      }).eq('id', site.id);

      await (supabase as any).from('subscription_site_events').insert({
        subscription_site_id: site.id, event_type: 'invoice_generated', actor_user_id: userId, actor: 'user',
        detail: { invoice_id: inv.id, invoice_number: invoiceNumber, amount },
      });

      toast.success(`Invoice ${invoiceNumber} created as draft`);
      onChanged();
      loadAll();
    } catch (e: any) { toast.error(e?.message || 'Failed to generate invoice'); }
    finally { setGenerating(false); }
  }

  return (
    <div className="rounded-2xl border border-border/30 bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Receipt className="h-3 w-3" /> Accounting & billing
        </div>
        {isLinked && (
          <Button size="sm" className="h-8 rounded-xl text-xs gap-1.5" onClick={generateInvoice} disabled={generating}>
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Generate invoice
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-12 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : !isLinked ? (
        <>
          <p className="text-xs text-muted-foreground">
            Link this site to an accounting organization to auto-generate recurring invoices posted to your ledger.
          </p>
          {orgs.length === 0 ? (
            <p className="text-[11px] text-amber-500">No accounting organization found. Set one up in the Accounting app first.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <MiniField label="Organization">
                <Select value={form.acc_org_id} onValueChange={(v) => setForm(p => ({ ...p, acc_org_id: v, acc_customer_id: '', acc_revenue_account_id: '' }))}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{orgs.map(o => <SelectItem key={o.id} value={o.id} className="text-xs">{o.name}</SelectItem>)}</SelectContent>
                </Select>
              </MiniField>
              <MiniField label="Customer">
                <Select value={form.acc_customer_id} onValueChange={(v) => setForm(p => ({ ...p, acc_customer_id: v }))} disabled={!form.acc_org_id}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue placeholder={form.acc_org_id ? 'Select…' : 'Pick org first'} /></SelectTrigger>
                  <SelectContent>
                    {orgCustomers.length === 0 ? <div className="px-2 py-1.5 text-[11px] text-muted-foreground">No customers yet</div>
                      : orgCustomers.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </MiniField>
              <MiniField label="Revenue account">
                <Select value={form.acc_revenue_account_id} onValueChange={(v) => setForm(p => ({ ...p, acc_revenue_account_id: v }))} disabled={!form.acc_org_id}>
                  <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue placeholder={form.acc_org_id ? 'Select…' : 'Pick org first'} /></SelectTrigger>
                  <SelectContent>
                    {orgAccounts.length === 0 ? <div className="px-2 py-1.5 text-[11px] text-muted-foreground">No revenue accounts</div>
                      : orgAccounts.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.account_code} · {a.account_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </MiniField>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={form.auto_invoice} onChange={e => setForm(p => ({ ...p, auto_invoice: e.target.checked }))} />
              Enable auto-invoice on renewal date
            </label>
            <Button size="sm" className="h-8 rounded-xl text-xs gap-1.5" onClick={saveLink} disabled={linking || orgs.length === 0}>
              {linking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              Link to Accounting
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" /> Linked
            </span>
            <span>Org: <b className="text-foreground">{orgs.find(o => o.id === site.acc_org_id)?.name || '—'}</b></span>
            <span>· Customer: <b className="text-foreground">{customers.find(c => c.id === site.acc_customer_id)?.name || '—'}</b></span>
            {site.auto_invoice && <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/30"><Zap className="h-3 w-3" /> Auto</span>}
          </div>
          {invoices.length === 0 ? (
            <p className="text-xs text-muted-foreground">No invoices yet — click "Generate invoice" to create the first draft.</p>
          ) : (
            <div className="space-y-1">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/10 last:border-0">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono text-[11px]">{inv.invoice_number}</span>
                  <span className="text-muted-foreground">{new Date(inv.invoice_date).toLocaleDateString('en-GB')}</span>
                  <span className={cn(
                    'ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold border capitalize',
                    inv.status === 'paid'    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                    inv.status === 'sent'    ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                    inv.status === 'overdue' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                               'bg-muted/50 text-muted-foreground border-border/30'
                  )}>{inv.status}</span>
                  <span className="tabular-nums font-semibold w-20 text-right">{money(Number(inv.total), inv.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}


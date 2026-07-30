import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Globe, Server, Eye, Link2, ExternalLink, X, Search, RefreshCw,
  ArrowUpRight, Loader2, Check, Plus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EmptyState, SkeletonBlock, RelativeTime } from '@/components/platform';

/**
 * The estate: every website Quooro runs for a client, on one page.
 * Paid subscriptions, hosting-only arrangements and free previews are
 * sections of the same wall rather than separate pages, because they are
 * the same asset at different points in its life.
 *
 * Each tile carries the site itself - a live frame of the real page,
 * scaled down, or the hero image when one is stored. Opening a tile
 * grows it into the full viewer with a shared-element move, so the thing
 * you clicked becomes the thing you are looking at.
 */

type Status = 'active' | 'trial' | 'paused' | 'cancelled';
type HostingStatus = 'live' | 'building' | 'error' | 'not_deployed';

interface Site {
  id: string;
  client_name: string | null;
  site_name: string;
  site_url: string | null;
  hero_image_url: string | null;
  status: Status;
  hosting_status: HostingStatus;
  hosting_provider: string | null;
  is_hosted_only: boolean;
  billing_amount: number;
  billing_currency: string;
  billing_cycle: string;
  next_billing_date: string | null;
  next_renewal_date: string | null;
  updated_at: string;
}

type Segment = 'all' | 'subscriptions' | 'hosted' | 'previews';

const SEGMENTS: { key: Segment; label: string; icon: any; blurb: string }[] = [
  { key: 'all', label: 'Everything', icon: Globe, blurb: 'Every site on the estate' },
  { key: 'subscriptions', label: 'Subscriptions', icon: RefreshCw, blurb: 'Paid, renewing sites' },
  { key: 'hosted', label: 'Hosted only', icon: Server, blurb: 'We host, no subscription' },
  { key: 'previews', label: 'Free previews', icon: Eye, blurb: 'Out with a lead, not yet paid' },
];

const HOSTING_TONE: Record<HostingStatus, { label: string; dot: string }> = {
  live: { label: 'Live', dot: 'bg-ok' },
  building: { label: 'Building', dot: 'bg-primary animate-pulse' },
  error: { label: 'Error', dot: 'bg-risk' },
  not_deployed: { label: 'Not deployed', dot: 'bg-muted-foreground/50' },
};

function money(n: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: currency || 'GBP', minimumFractionDigits: 0,
  }).format(Number(n || 0));
}

function hostOf(url: string | null) {
  if (!url) return null;
  try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, ''); }
  catch { return url.replace(/^https?:\/\//, '').replace(/\/.*$/, ''); }
}

function href(url: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `https://${url}`;
}

/** Monthly value of a site, whatever cycle it bills on. */
function monthly(site: Site) {
  const amount = Number(site.billing_amount || 0);
  if (!amount || site.status === 'cancelled') return 0;
  switch (site.billing_cycle) {
    case 'annual': case 'yearly': return amount / 12;
    case 'quarterly': return amount / 3;
    case 'weekly': return amount * 4.33;
    default: return amount;
  }
}

function segmentOf(site: Site): Exclude<Segment, 'all'> {
  if (site.status === 'trial') return 'previews';
  if (site.is_hosted_only) return 'hosted';
  return 'subscriptions';
}

/**
 * The face of a site. A stored hero image wins; otherwise the live page
 * is framed and scaled down, which is the truest thumbnail available in
 * a browser. Sites that refuse framing simply show the quiet monogram
 * underneath.
 */
function SiteFace({ site, live }: { site: Site; live: boolean }) {
  const url = href(site.site_url);
  const initials = (site.site_name || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="absolute inset-0 overflow-hidden bg-sunken">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-[34px] font-semibold tracking-[-0.02em] text-muted-foreground/25">
          {initials}
        </span>
      </div>

      {site.hero_image_url ? (
        <img
          src={site.hero_image_url}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      ) : url && live ? (
        <div className="pointer-events-none absolute inset-0">
          <iframe
            src={url}
            title={site.site_name}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            tabIndex={-1}
            aria-hidden
            className="h-[1000px] w-[1400px] origin-top-left border-0"
            style={{ transform: 'scale(0.286)' }}
          />
        </div>
      ) : null}

      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
    </div>
  );
}

export default function WebsitesStudio() {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<Segment>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [attach, setAttach] = useState<Site | null>(null);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftHero, setDraftHero] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('subscription_sites' as any)
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) toast.error('Could not load the websites', { description: error.message });
    setSites(((data as any[]) || []) as Site[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live updates, the same channel the estate has always used.
  useEffect(() => {
    const ch = (supabase as any).channel('websites-studio-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_sites' }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: sites.length, subscriptions: 0, hosted: 0, previews: 0 };
    sites.forEach(s => { c[segmentOf(s)] += 1; });
    return c;
  }, [sites]);

  const figures = useMemo(() => {
    const live = sites.filter(s => s.hosting_status === 'live').length;
    const mrr = sites.reduce((sum, s) => sum + monthly(s), 0);
    const previews = sites.filter(s => s.status === 'trial').length;
    const soon = sites.filter(s => {
      const d = s.next_billing_date || s.next_renewal_date;
      if (!d) return false;
      const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400e3);
      return days >= 0 && days <= 30;
    }).length;
    const attention = sites.filter(s => s.hosting_status === 'error').length;
    return { live, mrr, previews, soon, attention };
  }, [sites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sites
      .filter(s => segment === 'all' || segmentOf(s) === segment)
      .filter(s => !q
        || s.site_name.toLowerCase().includes(q)
        || (s.client_name || '').toLowerCase().includes(q)
        || (s.site_url || '').toLowerCase().includes(q));
  }, [sites, segment, query]);

  const open = sites.find(s => s.id === openId) || null;

  // Esc closes the viewer, as it does everywhere else on the platform.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  function beginAttach(site: Site) {
    setAttach(site);
    setDraftUrl(site.site_url || '');
    setDraftHero(site.hero_image_url || '');
  }

  async function saveAttach() {
    if (!attach) return;
    setSaving(true);
    const { error } = await supabase.from('subscription_sites' as any).update({
      site_url: draftUrl.trim() || null,
      hero_image_url: draftHero.trim() || null,
      updated_at: new Date().toISOString(),
    } as any).eq('id', attach.id);
    setSaving(false);
    if (error) { toast.error('Not saved', { description: error.message }); return; }
    setSites(prev => prev.map(s => (
      s.id === attach.id ? { ...s, site_url: draftUrl.trim() || null, hero_image_url: draftHero.trim() || null } : s
    )));
    setAttach(null);
    toast.success('Website attached');
  }

  const kicker = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
        {/* Masthead */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={kicker}>Client estate</p>
            <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]">
              Websites
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              Every site we run: paid subscriptions, hosting we keep alive, and previews out with a lead.
              Open one and the live page fills the screen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sites or clients"
                className="h-9 w-[190px] rounded-[10px] pl-8 text-[12.5px] sm:w-[230px]"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-[10px] text-xs" onClick={load}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </header>

        {/* The estate in numbers */}
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-border/60 bg-border/60 sm:grid-cols-4">
          {[
            { label: 'Live now', value: String(figures.live), meta: `${sites.length} on the estate` },
            { label: 'Monthly value', value: money(figures.mrr), meta: 'Across every cycle', tone: 'primary' as const },
            { label: 'Previews out', value: String(figures.previews), meta: 'Free, with a lead' },
            {
              label: 'Renewing',
              value: String(figures.soon),
              meta: figures.attention ? `${figures.attention} needing attention` : 'Next 30 days',
              tone: figures.attention ? ('risk' as const) : undefined,
            },
          ].map(f => (
            <div key={f.label} className="bg-card px-4 py-3.5">
              <p className={kicker}>{f.label}</p>
              <p className={cn(
                'mt-1.5 font-display text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums',
                f.tone === 'primary' && 'text-primary',
                f.tone === 'risk' && 'text-risk',
              )}>
                {f.value}
              </p>
              <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{f.meta}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="-mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max items-center gap-1 rounded-[12px] border border-border/60 bg-sunken/40 p-1.5">
            {SEGMENTS.map(s => {
              const Icon = s.icon;
              const on = segment === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSegment(s.key)}
                  className={cn(
                    'group relative flex h-10 shrink-0 items-center gap-2 rounded-[9px] px-3.5 text-[12.5px] font-medium transition-colors',
                    on ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="websites-segment"
                      className="absolute inset-0 rounded-[9px] border border-border/70 bg-card shadow-sm"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="relative h-3.5 w-3.5" />
                  <span className="relative">{s.label}</span>
                  <span className="relative font-mono text-[10px] tabular-nums text-muted-foreground">
                    {counts[s.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          {SEGMENTS.find(s => s.key === segment)?.blurb}
        </p>

        {/* The wall */}
        {loading ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonBlock key={i} className="aspect-[16/11] rounded-[14px]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title={query ? 'Nothing matches' : 'No sites in this section'}
              body={query
                ? 'Try a different client, site name or address.'
                : 'Sites appear here as soon as they are added to the estate.'}
            />
          </div>
        ) : (
          <motion.div layout className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(site => {
              const host = hostOf(site.site_url);
              const tone = HOSTING_TONE[site.hosting_status] || HOSTING_TONE.not_deployed;
              const seg = segmentOf(site);
              return (
                <motion.article
                  key={site.id}
                  layout
                  layoutId={`site-${site.id}`}
                  transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                  className="group overflow-hidden rounded-[14px] border border-border/60 bg-card"
                >
                  <button
                    type="button"
                    onClick={() => (site.site_url ? setOpenId(site.id) : beginAttach(site))}
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-[16/10] w-full">
                      <SiteFace site={site} live={!!site.site_url} />
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 backdrop-blur-sm">
                        <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', tone.dot)} />
                        <span className="font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-white/90">
                          {tone.label}
                        </span>
                      </div>
                      {seg === 'previews' && (
                        <span className="absolute right-3 top-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
                          Preview
                        </span>
                      )}
                      {!site.site_url && (
                        <span className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5 rounded-[9px] border border-white/20 bg-black/60 py-2 text-[12px] font-medium text-white backdrop-blur-sm">
                          <Link2 className="h-3.5 w-3.5" /> Attach the address
                        </span>
                      )}
                      <span className="pointer-events-none absolute inset-0 opacity-0 ring-1 ring-inset ring-primary/60 transition-opacity duration-200 group-hover:opacity-100" />
                    </div>

                    <div className="flex items-start gap-3 px-3.5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium leading-tight">{site.site_name}</p>
                        <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                          {site.client_name || 'No client attached'}
                        </p>
                        {host && (
                          <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground/80">{host}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        {seg === 'subscriptions' && Number(site.billing_amount) > 0 ? (
                          <>
                            <p className="font-mono text-[12.5px] font-medium tabular-nums">
                              {money(site.billing_amount, site.billing_currency)}
                            </p>
                            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                              {site.billing_cycle || 'monthly'}
                            </p>
                          </>
                        ) : (
                          <RelativeTime date={site.updated_at} />
                        )}
                      </div>
                    </div>
                  </button>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* The viewer: the tile you clicked grows into the live site. */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-background/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              layoutId={`site-${open.id}`}
              transition={{ type: 'spring', stiffness: 300, damping: 34 }}
              className="m-0 flex h-full flex-col overflow-hidden border-border/60 bg-card sm:m-4 sm:rounded-[16px] sm:border"
            >
              <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', (HOSTING_TONE[open.hosting_status] || HOSTING_TONE.not_deployed).dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold leading-tight tracking-[-0.01em]">{open.site_name}</p>
                  <p className="truncate font-mono text-[10.5px] text-muted-foreground">
                    {hostOf(open.site_url)} {open.client_name ? `· ${open.client_name}` : ''}
                  </p>
                </div>
                <Button
                  variant="outline" size="sm"
                  className="hidden h-9 gap-1.5 rounded-[10px] text-xs sm:inline-flex"
                  onClick={() => beginAttach(open)}
                >
                  <Link2 className="h-3.5 w-3.5" /> Edit address
                </Button>
                <a
                  href={href(open.site_url) || '#'}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-primary px-3 text-xs font-medium text-primary-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </a>
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  aria-label="Close"
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border/60 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <motion.div
                className="relative flex-1 bg-sunken"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.14, duration: 0.24 }}
              >
                <iframe
                  key={open.id}
                  src={href(open.site_url) || ''}
                  title={open.site_name}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  className="h-full w-full border-0"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center pb-3">
                  <span className="pointer-events-auto rounded-full border border-border/60 bg-card/95 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
                    Some sites refuse to be framed.{' '}
                    <a
                      href={href(open.site_url) || '#'}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-0.5 text-foreground underline underline-offset-2"
                    >
                      Open it in a tab <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attaching an address to an account */}
      <Dialog open={!!attach} onOpenChange={(v) => { if (!v) setAttach(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              {attach?.site_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div>
              <label className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Website address
              </label>
              <Input
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                placeholder="clientsite.co.uk"
                className="mt-1.5 h-10 text-[13px]"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Attached to this client's account. The tile then shows the live page.
              </p>
            </div>
            <div>
              <label className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Cover image (optional)
              </label>
              <Input
                value={draftHero}
                onChange={(e) => setDraftHero(e.target.value)}
                placeholder="https://…"
                className="mt-1.5 h-10 text-[13px]"
              />
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Overrides the live frame, for sites that block being embedded.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-10 rounded-[10px]" onClick={() => setAttach(null)}>Cancel</Button>
            <Button className="h-10 gap-2 rounded-[10px]" disabled={saving} onClick={saveAttach}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}

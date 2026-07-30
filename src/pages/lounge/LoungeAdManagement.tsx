import { useEffect, useMemo, useState } from 'react';
import {
  Play, Pause, CheckCircle, Clock, Target, Image as ImageIcon, Video, FileText,
  ExternalLink, Megaphone,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Panel, PanelHeader, EmptyState, SkeletonLedger, RelativeTime,
} from '@/components/platform';
import { BottomSheet } from '@/components/platform/crm';

/**
 * The advertising your agency is running for you.
 *
 * Campaigns are grouped by what they are doing right now - live, paused,
 * scheduled, finished - because that is the only question a client asks
 * about their advertising. The creative sits with the campaign, and the
 * money is stated plainly: a monthly budget is a monthly budget, never
 * dressed up as a projection.
 */

interface AdCampaign {
  id: string;
  platform: string;
  campaign_name: string;
  creative_url: string | null;
  creative_type: string;
  status: string;
  objective: string | null;
  start_date: string | null;
  monthly_budget: number | null;
  notes: string | null;
  last_updated_at: string;
  created_at: string;
}

const PLATFORM_LABEL: Record<string, string> = {
  meta: 'Meta', tiktok: 'TikTok', google: 'Google', linkedin: 'LinkedIn', twitter: 'X',
};

const STATUS_META: Record<string, { label: string; dot: string; text: string; icon: typeof Play }> = {
  running: { label: 'Live', dot: 'bg-ok', text: 'text-ok', icon: Play },
  paused: { label: 'Paused', dot: 'bg-attend', text: 'text-attend', icon: Pause },
  scheduled: { label: 'Scheduled', dot: 'bg-primary', text: 'text-primary', icon: Clock },
  completed: { label: 'Finished', dot: 'bg-muted-foreground/50', text: 'text-muted-foreground', icon: CheckCircle },
};

const CREATIVE_ICON: Record<string, typeof ImageIcon> = {
  image: ImageIcon, video: Video, carousel: ImageIcon, text: FileText,
};

const KICKER = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';
const ORDER = ['running', 'scheduled', 'paused', 'completed'];

const money = (n: number | null) =>
  n == null ? '–' : new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP', minimumFractionDigits: 0,
  }).format(n);

const statusOf = (s: string) => STATUS_META[s] || STATUS_META.running;

export default function LoungeAdManagement() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<AdCampaign | null>(null);

  useEffect(() => { if (user) fetchCampaigns(); }, [user]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_campaigns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const figures = useMemo(() => {
    const live = campaigns.filter(c => c.status === 'running');
    const monthly = live.reduce((s, c) => s + Number(c.monthly_budget || 0), 0);
    return {
      live: live.length,
      monthly,
      scheduled: campaigns.filter(c => c.status === 'scheduled').length,
      platforms: new Set(campaigns.filter(c => c.status === 'running').map(c => c.platform)).size,
    };
  }, [campaigns]);

  const grouped = useMemo(() => {
    const map = new Map<string, AdCampaign[]>();
    ORDER.forEach(s => map.set(s, []));
    campaigns.forEach(c => {
      const key = ORDER.includes(c.status) ? c.status : 'running';
      map.get(key)!.push(c);
    });
    return ORDER.map(s => ({ status: s, items: map.get(s) || [] })).filter(g => g.items.length);
  }, [campaigns]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] px-5 py-7 lg:px-8">
        <span className="block h-7 w-48 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-4 w-80 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-7 rounded-[12px] border border-border/60">
          <SkeletonLedger rows={5} />
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header>
          <p className={KICKER}>Advertising</p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]">
            Campaigns
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
            What is running for you right now, on which platforms, and what it costs each month.
          </p>
        </header>

        {campaigns.length === 0 ? (
          <div className="mt-7">
            <EmptyState
              title="No campaigns yet"
              body="When your advertising goes live it appears here, with the creative and the monthly spend."
            />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-border/60 bg-border/60 sm:grid-cols-4">
              {[
                { label: 'Live now', value: String(figures.live), meta: `${figures.platforms} platform${figures.platforms === 1 ? '' : 's'}` },
                { label: 'Monthly spend', value: money(figures.monthly), meta: 'Across live campaigns', tone: 'primary' as const },
                { label: 'Scheduled', value: String(figures.scheduled), meta: 'Waiting to start' },
                { label: 'All time', value: String(campaigns.length), meta: 'Campaigns run' },
              ].map(f => (
                <div key={f.label} className="bg-card px-4 py-3.5">
                  <p className={KICKER}>{f.label}</p>
                  <p className={cn(
                    'mt-1.5 font-display text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums',
                    f.tone === 'primary' && 'text-primary',
                  )}>
                    {f.value}
                  </p>
                  <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{f.meta}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              {grouped.map(group => {
                const meta = statusOf(group.status);
                return (
                  <Panel key={group.status}>
                    <PanelHeader
                      label={(
                        <span className="flex items-center gap-2">
                          <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                          {meta.label}
                        </span>
                      )}
                    >
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                        {group.items.length}
                      </span>
                    </PanelHeader>
                    <ul className="divide-y divide-border/60">
                      {group.items.map(c => {
                        const Creative = CREATIVE_ICON[c.creative_type] || ImageIcon;
                        return (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => setOpen(c)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.025]"
                            >
                              <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-[8px] border border-border/60 bg-sunken">
                                {c.creative_url ? (
                                  <img src={c.creative_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center">
                                    <Creative className="h-3.5 w-3.5 text-muted-foreground/60" />
                                  </span>
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] font-medium">{c.campaign_name}</span>
                                <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                                  <span className="font-mono uppercase tracking-[0.1em]">
                                    {PLATFORM_LABEL[c.platform] || c.platform}
                                  </span>
                                  {c.objective && <span className="truncate">· {c.objective}</span>}
                                </span>
                              </span>
                              <span className="hidden shrink-0 text-right sm:block">
                                <span className="block font-mono text-[12.5px] font-medium tabular-nums">
                                  {money(c.monthly_budget)}
                                </span>
                                <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                                  per month
                                </span>
                              </span>
                              <RelativeTime date={c.last_updated_at} className="w-20 shrink-0 text-right" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </Panel>
                );
              })}
            </div>
          </>
        )}
      </div>

      <BottomSheet
        open={!!open}
        onOpenChange={(v) => { if (!v) setOpen(null); }}
        kicker={open ? (PLATFORM_LABEL[open.platform] || open.platform) : 'Campaign'}
        title={open?.campaign_name || ''}
        tall
      >
        {open && (
          <div className="space-y-4">
            {open.creative_url && (
              <div className="overflow-hidden rounded-[12px] border border-border/60 bg-sunken">
                <img src={open.creative_url} alt="" className="max-h-[300px] w-full object-contain" />
              </div>
            )}
            <dl>
              {[
                ['Status', statusOf(open.status).label],
                ['Platform', PLATFORM_LABEL[open.platform] || open.platform],
                ['Objective', open.objective || 'Not set'],
                ['Monthly budget', money(open.monthly_budget)],
                ['Started', open.start_date ? format(new Date(open.start_date), 'd MMM yyyy') : 'Not started'],
                ['Creative', open.creative_type],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between border-b border-border/50 py-2 text-xs last:border-b-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono text-[11.5px] tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            {open.notes && (
              <div>
                <span className={KICKER}>Notes from your team</span>
                <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed">{open.notes}</p>
              </div>
            )}
            {open.creative_url && (
              <a
                href={open.creative_url} target="_blank" rel="noreferrer noopener"
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-border/60 text-[12.5px]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open the creative
              </a>
            )}
          </div>
        )}
      </BottomSheet>
    </ScrollArea>
  );
}

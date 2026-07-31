import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor, Tablet, Smartphone, Sparkles, Check, Loader2, Trash2, RotateCcw, Radio,
  Globe, Armchair, Building2, Brain,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOwner } from '@/hooks/usePlatformOwner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EmptyState, SkeletonBlock, RelativeTime } from '@/components/platform';
import { WebsiteSplash, DEFAULT_SPLASH, type SplashConfig } from '@/components/splash/WebsiteSplash';

/**
 * The splash room, for owners only.
 *
 * A splash is judged at the size it will be seen, so every design is
 * rendered here at desktop, tablet and phone from the same config that
 * the website will use - not a picture of one. Nothing goes live by
 * being made; it goes live when someone chooses it.
 */

interface SplashRow {
  id: string;
  name: string;
  origin: string;
  surface: Surface;
  config: SplashConfig;
  is_active: boolean;
  created_at: string;
}

type Surface = 'website' | 'lounge' | 'team';

/** Every part of the platform that shows a splash. */
const SURFACES: { key: Surface; label: string; icon: any; blurb: string }[] = [
  { key: 'website', label: 'Website', icon: Globe, blurb: 'What the public sees first at quooro.co.uk' },
  { key: 'lounge', label: 'Quooro Lounge', icon: Armchair, blurb: 'What a customer sees as their lounge opens' },
  { key: 'team', label: 'Quooro Team', icon: Building2, blurb: 'What you and the admins see as the desk opens' },
];

type Device = 'desktop' | 'tablet' | 'phone';

const DEVICES: { key: Device; label: string; icon: any; w: number; h: number; scale: number }[] = [
  { key: 'desktop', label: 'Desktop', icon: Monitor, w: 440, h: 275, scale: 0.5 },
  { key: 'tablet', label: 'Tablet', icon: Tablet, w: 230, h: 300, scale: 0.4 },
  { key: 'phone', label: 'Phone', icon: Smartphone, w: 150, h: 315, scale: 0.32 },
];

const MOTIFS: SplashConfig['motif'][] = ['sweep', 'typeset', 'lattice', 'ember', 'aperture'];

const PALETTES = [
  { bg: '#0A0A0D', ink: '#EDEDEF', accent: '#C2410C' },
  { bg: '#08080B', ink: '#F4F4F5', accent: '#E8613C' },
  { bg: '#0B0C0F', ink: '#E8E8EC', accent: '#B45309' },
  { bg: '#09090C', ink: '#EFEFF2', accent: '#9A3412' },
  { bg: '#0A0B0E', ink: '#EAEAEE', accent: '#D2571A' },
];

const LINES = [
  'Built in Wales',
  'Digital operations for ambitious brands',
  'Since the first line',
  'Websites that carry their weight',
  'Built once, built properly',
];

const KICKER = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

/**
 * The generator works from everything already saved, not from a fixed
 * list. Each part of a design - the motif, the background, the ink, the
 * accent, the line, the pace - is drawn from the pool of designs that
 * exist, so a trait invented on one screen can turn up on another, and
 * the more designs are kept the wider the pool it draws from. Seed
 * material is used only to fill gaps when the pool is thin.
 *
 * It is recombination with variation rather than a model that has been
 * trained: honest about what it is, and it genuinely gets richer every
 * time something is saved.
 */
function learnFrom(pool: SplashConfig[]) {
  const take = <T,>(list: T[], fallback: T[]): T[] => (list.length ? list : fallback);
  return {
    motifs: take([...new Set(pool.map(c => c.motif).filter(Boolean))], MOTIFS),
    bgs: take([...new Set(pool.map(c => c.bg).filter(Boolean))], PALETTES.map(p => p.bg)),
    inks: take([...new Set(pool.map(c => c.ink).filter(Boolean))], PALETTES.map(p => p.ink)),
    accents: take([...new Set(pool.map(c => c.accent).filter(Boolean))], PALETTES.map(p => p.accent)),
    lines: take([...new Set(pool.map(c => c.line).filter(Boolean))], LINES),
    subs: [...new Set(pool.map(c => c.sub).filter(Boolean))] as string[],
    durations: take(pool.map(c => c.durationMs).filter(Boolean), [2000, 2200, 2400]),
    grainShare: pool.length ? pool.filter(c => c.grain).length / pool.length : 0.6,
  };
}

function generateConfig(
  seed: number,
  pool: SplashConfig[],
  surface: Surface,
): { name: string; config: SplashConfig } {
  const learned = learnFrom(pool);
  const pick = <T,>(list: T[], salt: number): T => list[(seed * salt) % list.length];

  const motif = pick(learned.motifs, 7);
  // The pace is the set's own average, nudged either side so it is
  // familiar without being a copy.
  const avg = Math.round(learned.durations.reduce((a, b) => a + b, 0) / learned.durations.length);
  const durationMs = Math.max(1500, Math.min(3200, avg + (((seed * 53) % 700) - 350)));

  return {
    name: `${motif[0].toUpperCase()}${motif.slice(1)} ${String((seed % 90) + 10)}`,
    config: {
      ...DEFAULT_SPLASH,
      motif,
      bg: pick(learned.bgs, 3),
      ink: pick(learned.inks, 5),
      accent: pick(learned.accents, 11),
      line: pick(learned.lines, 13),
      sub: surface === 'website' ? undefined : (learned.subs.length ? pick(learned.subs, 17) : SURFACES.find(s => s.key === surface)?.label.replace('Quooro ', '')),
      durationMs,
      grain: ((seed * 29) % 100) / 100 < learned.grainShare,
    },
  };
}

/** A device frame with the real splash running inside it. */
function DeviceFrame({ device, config, replay }: { device: typeof DEVICES[number]; config: SplashConfig; replay: number }) {
  return (
    <figure className="flex flex-col items-center gap-2">
      <div
        className="relative overflow-hidden rounded-[14px] border border-border/70 bg-black shadow-lg"
        style={{ width: device.w, height: device.h, maxWidth: '100%' }}
      >
        <WebsiteSplash key={`${device.key}-${replay}`} config={config} preview scale={device.scale} />
      </div>
      <figcaption className="flex items-center gap-1.5">
        <device.icon className="h-3 w-3 text-muted-foreground" />
        <span className={KICKER}>{device.label}</span>
        <span className="font-mono text-[9px] text-muted-foreground/70">{device.w}×{device.h}</span>
      </figcaption>
    </figure>
  );
}

export default function SplashStudio() {
  const { user } = useAuth();
  const { isOwner, loading: ownerLoading } = usePlatformOwner();
  const navigate = useNavigate();

  const [surface, setSurface] = useState<Surface>('website');
  const [rows, setRows] = useState<SplashRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ name: string; config: SplashConfig } | null>(null);
  const [draftName, setDraftName] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('splash_screens' as any)
      .select('*')
      .order('created_at', { ascending: true });
    if (error) toast.error('Could not load the splash screens', { description: error.message });
    const list = ((data as any[]) || []) as SplashRow[];
    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  const surfaceRows = useMemo(() => rows.filter(r => (r.surface || 'website') === surface), [rows, surface]);

  // Whenever the surface changes, land on whatever is live there.
  useEffect(() => {
    if (draft) return;
    const live = surfaceRows.find(r => r.is_active) || surfaceRows[0];
    setSelectedId(prev => (surfaceRows.some(r => r.id === prev) ? prev : live?.id || null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface, surfaceRows.length]);

  const selected = useMemo(
    () => (draft
      ? { id: 'draft', name: draft.name, config: draft.config, is_active: false, origin: 'generated', surface, created_at: '' } as SplashRow
      : surfaceRows.find(r => r.id === selectedId) || null),
    [surfaceRows, selectedId, draft, surface],
  );

  async function makeLive(id: string) {
    setBusy(true);
    const { error } = await supabase.rpc('set_active_splash' as any, { _id: id });
    setBusy(false);
    if (error) { toast.error('Not changed', { description: error.message }); return; }
    setRows(prev => prev.map(r => (
      (r.surface || 'website') === surface ? { ...r, is_active: r.id === id } : r
    )));
    toast.success(`Live on ${SURFACES.find(x => x.key === surface)?.label}`);
  }

  async function saveDraft() {
    if (!draft) return;
    setBusy(true);
    const { data, error } = await supabase.from('splash_screens' as any).insert({
      name: draftName.trim() || draft.name,
      origin: 'generated',
      surface,
      config: draft.config as any,
      created_by: user?.id ?? null,
    } as any).select('*').single();
    setBusy(false);
    if (error) { toast.error('Not saved', { description: error.message }); return; }
    const row = data as unknown as SplashRow;
    setRows(prev => [...prev, row]);
    setDraft(null);
    setSelectedId(row.id);
    toast.success('Saved to the set');
  }

  async function remove(id: string) {
    setBusy(true);
    const { error } = await supabase.from('splash_screens' as any).delete().eq('id', id);
    setBusy(false);
    if (error) { toast.error('Not removed', { description: error.message }); return; }
    setRows(prev => prev.filter(r => r.id !== id));
    if (selectedId === id) setSelectedId(surfaceRows.find(r => r.id !== id)?.id || null);
    toast.success('Removed');
  }

  function generate() {
    const seed = Math.floor(Date.now() / 97) + rows.length;
    // Everything ever saved feeds the pool, across every surface, so a
    // trait invented for the Lounge can appear on the website.
    const next = generateConfig(seed, rows.map(r => r.config).filter(Boolean), surface);
    setDraft(next);
    setDraftName(next.name);
    setReplay(r => r + 1);
  }

  if (ownerLoading) {
    return <div className="p-6"><SkeletonBlock className="h-[320px] rounded-[14px]" /></div>;
  }

  if (!isOwner) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <EmptyState
          title="Owners only"
          body="Splash screens are changed by Finley and Zak."
          action={{ label: 'Back to the dashboard', onClick: () => navigate('/dashboard') }}
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={KICKER}>Splash screens</p>
            <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]">
              {SURFACES.find(sf => sf.key === surface)?.label}
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              The first seconds anyone spends with Quooro. Try a design at every size, then put it live.
              The screen in use is always kept, so you can put it back at any time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-[10px] text-xs" onClick={() => setReplay(r => r + 1)}>
              <RotateCcw className="h-3.5 w-3.5" /> Replay
            </Button>
            <Button size="sm" className="h-9 gap-1.5 rounded-[10px] text-xs" onClick={generate}>
              <Sparkles className="h-3.5 w-3.5" /> Generate one
            </Button>
          </div>
        </header>

        {/* Which part of the platform */}
        <div className="-mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max items-center gap-1 rounded-[12px] border border-border/60 bg-sunken/40 p-1.5">
            {SURFACES.map(sf => {
              const Icon = sf.icon;
              const on = surface === sf.key;
              const count = rows.filter(r => (r.surface || 'website') === sf.key).length;
              return (
                <button
                  key={sf.key}
                  type="button"
                  onClick={() => { setDraft(null); setSurface(sf.key); setReplay(r => r + 1); }}
                  className={cn(
                    'flex h-10 shrink-0 items-center gap-2 rounded-[9px] px-3.5 text-[12.5px] font-medium transition-colors',
                    on ? 'border border-border/70 bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {sf.label}
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          {SURFACES.find(sf => sf.key === surface)?.blurb}
        </p>

        <div className="mt-4 grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* The set */}
          <aside className="space-y-2">
            <p className={KICKER}>{surfaceRows.length} designs</p>
            {loading ? (
              <SkeletonBlock className="h-[220px] rounded-[12px]" />
            ) : (
              <ul className="space-y-1.5">
                {draft && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setReplay(r => r + 1)}
                      className="flex w-full items-center gap-2.5 rounded-[10px] border border-primary/50 bg-primary/[0.07] px-3 py-2.5 text-left"
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{draftName || draft.name}</span>
                        <span className="block font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                          Not saved yet
                        </span>
                      </span>
                    </button>
                  </li>
                )}
                {surfaceRows.map(r => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => { setDraft(null); setSelectedId(r.id); setReplay(x => x + 1); }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors',
                        !draft && selectedId === r.id
                          ? 'border-border bg-card'
                          : 'border-border/60 hover:bg-foreground/[0.025]',
                      )}
                    >
                      <span
                        aria-hidden
                        className="h-6 w-6 shrink-0 rounded-[6px] border border-border/60"
                        style={{ background: r.config?.bg, boxShadow: `inset 0 0 0 2px ${r.config?.accent}` }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{r.name}</span>
                        <span className="block font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                          {r.config?.motif} · {Math.round((r.config?.durationMs || 0) / 100) / 10}s
                        </span>
                      </span>
                      {r.is_active && (
                        <span className="flex shrink-0 items-center gap-1 font-mono text-[8.5px] uppercase tracking-[0.12em] text-ok">
                          <Radio className="h-2.5 w-2.5" /> Live
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Every size, running the real thing */}
          <section>
            {!selected ? (
              <EmptyState title="Nothing to show" body="Generate a splash to begin." />
            ) : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    {draft ? (
                      <Input
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className="h-9 w-[220px] rounded-[10px] text-[13px]"
                      />
                    ) : (
                      <h2 className="font-display text-[18px] font-semibold tracking-[-0.01em]">{selected.name}</h2>
                    )}
                    <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                      {selected.config?.motif} · {selected.config?.durationMs}ms
                      {selected.origin === 'generated' ? ' · generated' : ' · built in'}
                      {selected.created_at ? <> · <RelativeTime date={selected.created_at} /></> : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {draft ? (
                      <>
                        <Button variant="outline" className="h-9 rounded-[10px] text-xs" onClick={() => setDraft(null)}>
                          Discard
                        </Button>
                        <Button className="h-9 gap-1.5 rounded-[10px] text-xs" disabled={busy} onClick={saveDraft}>
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Save to the set
                        </Button>
                      </>
                    ) : (
                      <>
                        {!selected.is_active && selected.origin === 'generated' && (
                          <Button
                            variant="outline"
                            className="h-9 gap-1.5 rounded-[10px] text-xs text-risk"
                            disabled={busy}
                            onClick={() => remove(selected.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </Button>
                        )}
                        <Button
                          className="h-9 gap-1.5 rounded-[10px] text-xs"
                          disabled={busy || selected.is_active}
                          onClick={() => makeLive(selected.id)}
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
                          {selected.is_active ? 'Live now' : 'Put this live'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-start justify-center gap-6 rounded-[14px] border border-border/60 bg-sunken/30 p-5 sm:p-7">
                  {DEVICES.map(d => (
                    <DeviceFrame key={d.key} device={d} config={selected.config} replay={replay} />
                  ))}
                </div>

                <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                  All three are the live component running from this design's own settings, at the proportions each
                  device sees. Press Replay to watch them arrive again.
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </ScrollArea>
  );
}

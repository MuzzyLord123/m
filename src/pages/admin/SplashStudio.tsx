import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor, Tablet, Smartphone, Sparkles, Check, Loader2, Trash2, RotateCcw, Radio,
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
  config: SplashConfig;
  is_active: boolean;
  created_at: string;
}

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
 * Each generated screen takes a different motif, palette, line and
 * pace, so no two arrive the same way. The name records what it is.
 */
function generateConfig(seed: number): { name: string; config: SplashConfig } {
  const motif = MOTIFS[seed % MOTIFS.length];
  const palette = PALETTES[(seed * 3 + 1) % PALETTES.length];
  const line = LINES[(seed * 5 + 2) % LINES.length];
  const durationMs = 1800 + ((seed * 137) % 900);
  return {
    name: `${motif[0].toUpperCase()}${motif.slice(1)} ${String((seed % 90) + 10)}`,
    config: {
      ...DEFAULT_SPLASH,
      motif,
      ...palette,
      line,
      durationMs,
      grain: seed % 3 !== 0,
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
    setSelectedId(prev => prev || list.find(r => r.is_active)?.id || list[0]?.id || null);
    setLoading(false);
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  const selected = useMemo(
    () => (draft ? { id: 'draft', name: draft.name, config: draft.config, is_active: false, origin: 'generated', created_at: '' } as SplashRow
      : rows.find(r => r.id === selectedId) || null),
    [rows, selectedId, draft],
  );

  async function makeLive(id: string) {
    setBusy(true);
    const { error } = await supabase.rpc('set_active_splash' as any, { _id: id });
    setBusy(false);
    if (error) { toast.error('Not changed', { description: error.message }); return; }
    setRows(prev => prev.map(r => ({ ...r, is_active: r.id === id })));
    toast.success('Live on the website');
  }

  async function saveDraft() {
    if (!draft) return;
    setBusy(true);
    const { data, error } = await supabase.from('splash_screens' as any).insert({
      name: draftName.trim() || draft.name,
      origin: 'generated',
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
    if (selectedId === id) setSelectedId(rows.find(r => r.id !== id)?.id || null);
    toast.success('Removed');
  }

  function generate() {
    const seed = Math.floor(Date.now() / 97) + rows.length;
    const next = generateConfig(seed);
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
          body="The website splash is changed by Finley and Zak."
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
            <p className={KICKER}>The website</p>
            <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]">
              Splash
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              The first two seconds a visitor spends with Quooro. Try one at every size, then put it live.
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

        <div className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* The set */}
          <aside className="space-y-2">
            <p className={KICKER}>{rows.length} designs</p>
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
                {rows.map(r => (
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

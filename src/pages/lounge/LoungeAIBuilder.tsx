import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortalHome } from '@/hooks/usePortalHome';
import { Sparkles, Send, Globe, FileText, Blocks, Loader2, ArrowLeft, Plus, Wand2, ExternalLink, Crown, Paintbrush, Layout } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Panel, PanelHeader, SkeletonBlock, CHIP_ON, CHIP_OFF } from '@/components/platform';

type Mode = 'full_site' | 'page' | 'section';
type Status = 'idle' | 'generating' | 'success' | 'error';

const ESTIMATED_TIMES: Record<Mode, number> = {
  full_site: 30,
  page: 20,
  section: 10,
};

const GENERATION_STAGES: string[] = [
  'Analysing your description',
  'Designing layout structure',
  'Generating responsive elements',
  'Applying typography and colours',
  'Polishing final details',
];

interface GeneratedResult {
  mode: Mode;
  prompt: string;
  data: any;
  siteId?: string;
  siteName?: string;
}

const MODE_CONFIG: Record<Mode, { label: string; icon: typeof Globe; description: string }> = {
  full_site: { label: 'Full website', icon: Globe, description: 'Generate a complete multi-page website' },
  page: { label: 'Single page', icon: FileText, description: 'Generate one page with all sections' },
  section: { label: 'Section', icon: Blocks, description: 'Generate individual sections to insert' },
};

const SUGGESTIONS = [
  'A luxury real estate agency website with dark theme and property listings',
  'A modern SaaS landing page for a project management tool',
  'A restaurant website with menu, reservations, and gallery',
  'A fitness studio website with class schedules and trainer profiles',
  'A creative agency portfolio with case studies and team section',
  'A law firm website with practice areas and client testimonials',
];

export default function LoungeAIBuilder() {
  const navigate = useNavigate();
  const portalHome = usePortalHome();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('full_site');
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [history, setHistory] = useState<GeneratedResult[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Subscription state
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { isAdmin, loading: roleLoading } = useUserRole();

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-designer-subscription');
      if (error) throw error;
      setSubscribed(data.subscribed);
    } catch {
      setSubscribed(false);
    } finally {
      setCheckingSubscription(false);
    }
  }, []);

  useEffect(() => {
    if (roleLoading) return;
    if (isAdmin) {
      setSubscribed(true);
      setCheckingSubscription(false);
      return;
    }
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription, isAdmin, roleLoading]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-designer-checkout');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast.error('Could not start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  useEffect(() => {
    if (subscribed) inputRef.current?.focus();
  }, [subscribed]);

  const generate = async () => {
    if (!prompt.trim() || status === 'generating') return;
    setStatus('generating');
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-website-builder', {
        body: { prompt: prompt.trim(), mode },
      });

      if (error) throw new Error(error.message || 'Generation failed');
      if (data?.error) throw new Error(data.error);

      // For full_site mode, create the site and pages in the database
      let siteId: string | undefined;
      let siteName: string | undefined;

      if (mode === 'full_site' && data.pages) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('Not authenticated');

        // Extract site name from first page navbar or use prompt
        siteName = extractSiteName(data.pages) || prompt.slice(0, 40);

        const { data: site, error: siteErr } = await supabase
          .from('designer_sites')
          .insert({ site_name: siteName, user_id: userData.user.id })
          .select()
          .single();

        if (siteErr) throw siteErr;
        siteId = (site as any).id;

        // Create pages
        for (let i = 0; i < data.pages.length; i++) {
          const page = data.pages[i];
          await supabase.from('designer_pages').insert({
            site_id: siteId,
            user_id: userData.user.id,
            page_name: page.name || `Page ${i + 1}`,
            slug: page.slug || `/${page.name?.toLowerCase().replace(/\s+/g, '-') || `page-${i + 1}`}`,
            is_homepage: i === 0,
            elements: page.elements,
            sort_order: i,
          });
        }
      }

      const generatedResult: GeneratedResult = { mode, prompt, data, siteId, siteName };
      setResult(generatedResult);
      setHistory(prev => [generatedResult, ...prev]);
      setStatus('success');
      toast.success(mode === 'full_site' ? 'Website generated' : 'Content generated');
    } catch (err: any) {
      setStatus('error');
      toast.error(err.message || 'Generation failed');
    }
  };

  const openInEditor = () => {
    if (result?.siteId) {
      navigate(`/lounge/editor/${result.siteId}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generate();
    }
  };

  return (
    <>
    {/* Loading state */}
    {checkingSubscription ? (
      <div className="flex min-h-screen items-center justify-center bg-background px-4" aria-hidden>
        <div className="w-full max-w-md space-y-4">
          <span className="block h-4 w-24 animate-pulse rounded bg-foreground/[0.06]" />
          <span className="block h-6 w-52 animate-pulse rounded bg-foreground/[0.06]" />
          <SkeletonBlock className="h-72 rounded-[10px]" />
        </div>
      </div>
    ) : !subscribed ? (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Client portal
            </span>
            <h1 className="mt-1 flex items-center gap-2 text-[17px] font-semibold tracking-[-0.015em] text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              AI website builder
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Generate complete websites from text prompts.
            </p>
          </div>
          <Panel className="space-y-5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">Pro plan</p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">AI builder plus website designer</p>
              </div>
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Pro</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold tabular-nums text-foreground">£49.99</span>
              <span className="text-[13px] text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2.5 text-xs text-ink-2">
              <li className="flex items-center gap-2.5"><Wand2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> AI-powered full website generation</li>
              <li className="flex items-center gap-2.5"><Layout className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> 50+ starter templates across 20+ niches</li>
              <li className="flex items-center gap-2.5"><Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> Unlimited websites and pages</li>
              <li className="flex items-center gap-2.5"><Paintbrush className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> Drag-and-drop visual editor (Workshop)</li>
              <li className="flex items-center gap-2.5"><Blocks className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> 70+ section blocks and component library</li>
              <li className="flex items-center gap-2.5"><Layout className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> Global design system and style tokens</li>
              <li className="flex items-center gap-2.5"><Crown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> Full template marketplace with preview</li>
              <li className="flex items-center gap-2.5"><Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> Live preview and responsive testing</li>
            </ul>
            <Button onClick={handleCheckout} disabled={checkoutLoading} className="h-9 w-full rounded-lg text-xs">
              {checkoutLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Subscribe now
            </Button>
            <button
              onClick={checkSubscription}
              className="w-full pt-1 text-center text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Already subscribed? Refresh status
            </button>
          </Panel>
        </div>
      </div>
    ) : (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(portalHome)}
            aria-label="Back to portal"
            className="rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.04] hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-foreground">AI website builder</span>
          </div>
        </div>
        {history.length > 0 && (
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{history.length} generated</span>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-auto px-4 py-12 sm:px-6">
        {status === 'idle' || status === 'error' ? (
          <div className="w-full max-w-[720px] space-y-7">
            {/* Header */}
            <div>
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                AI builder
              </span>
              <h1 className="mt-1 font-display text-[23px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
                What would you like to build?
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Describe your website and it will be generated in the Workshop.
              </p>
            </div>

            {/* Mode selector */}
            <div className="flex flex-wrap gap-2">
              {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG['full_site']][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const active = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    aria-pressed={active}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[12px] font-medium transition-colors duration-150',
                      active ? CHIP_ON : CHIP_OFF,
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Prompt */}
            <Panel className="relative transition-colors duration-200 focus-within:border-primary/60">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={MODE_CONFIG[mode].description + '...'}
                rows={4}
                className="w-full resize-none bg-transparent p-4 pb-14 text-[14px] text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {mode === 'full_site' ? 'Generates complete website' : mode === 'page' ? 'Generates single page' : 'Generates sections'}
                </span>
                <Button
                  onClick={generate}
                  disabled={!prompt.trim()}
                  className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  Generate
                </Button>
              </div>
            </Panel>

            {/* Suggestions */}
            <div className="space-y-2.5">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Suggestions
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(s)}
                    className="rounded-[10px] border border-border/60 bg-card px-4 py-3 text-left text-[12px] text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.025] hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : status === 'generating' ? (
          <GeneratingIndicator mode={mode} />
        ) : status === 'success' && result ? (
          <div className="w-full max-w-[720px] space-y-4">
            {/* Result */}
            <Panel className="p-6">
              <span aria-hidden className="block h-px w-8 bg-primary" />
              <h2 className="mt-4 font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                {result.mode === 'full_site' ? 'Website created' : 'Content generated'}
              </h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                {result.mode === 'full_site'
                  ? `"${result.siteName}" has been created with ${result.data?.pages?.length || 1} ${(result.data?.pages?.length || 1) === 1 ? 'page' : 'pages'}`
                  : `Generated ${result.data?.elements?.length || 0} elements`}
              </p>

              {/* Page ledger */}
              {result.mode === 'full_site' && result.data?.pages && (
                <div className="mt-4 divide-y divide-border/60 rounded-[10px] border border-border/60">
                  {result.data.pages.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-3.5 py-2">
                      <span className="truncate text-[12px] font-medium text-foreground">{p.name}</span>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                        {p.elements?.length || 0} elements
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {result.siteId && (
                  <Button onClick={openInEditor} className="h-8 gap-1.5 rounded-lg px-3 text-xs">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in Workshop
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => { setStatus('idle'); setPrompt(''); setResult(null); }}
                  className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Build another
                </Button>
              </div>
            </Panel>

            {/* Previous builds */}
            {history.length > 1 && (
              <Panel>
                <PanelHeader label="Previous builds" />
                {history.slice(1, 4).map((h, i) => (
                  <div key={i} className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                    <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">{h.prompt}</span>
                    {h.siteId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/lounge/editor/${h.siteId}`)}
                        className="shrink-0 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      >
                        Open
                      </button>
                    )}
                  </div>
                ))}
              </Panel>
            )}
          </div>
        ) : null}
      </div>
    </div>
    )}
    </>
  );
}

function extractSiteName(pages: any[]): string | undefined {
  for (const page of pages) {
    if (page.elements) {
      for (const el of page.elements) {
        if (el.type === 'navbar' && el.children) {
          for (const child of el.children) {
            if (child.type === 'heading' && child.props?.text) {
              return child.props.text as string;
            }
          }
        }
      }
    }
  }
  return undefined;
}

function GeneratingIndicator({ mode }: { mode: Mode }) {
  const [elapsed, setElapsed] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const estimatedTime = ESTIMATED_TIMES[mode];

  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex(prev => (prev + 1) % GENERATION_STAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, estimatedTime - elapsed);
  const progress = Math.min(95, (elapsed / estimatedTime) * 100);

  return (
    <div className="w-full max-w-[420px]" role="status" aria-label="Generating">
      <Panel className="p-5">
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">Building your website</h2>
        </div>

        {/* Stage ledger */}
        <ol className="mt-4 space-y-2">
          {GENERATION_STAGES.map((stage, i) => (
            <li
              key={stage}
              className={cn(
                'flex items-baseline gap-2.5 text-[12px] transition-colors duration-150',
                i === stageIndex ? 'text-foreground' : 'text-muted-foreground/60',
              )}
            >
              <span className="font-mono text-[10px] tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              {stage}
            </li>
          ))}
        </ol>

        {/* Progress */}
        <div className="mt-5 space-y-2">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
            <span>{elapsed}s elapsed</span>
            <span>{remaining > 0 ? `~${remaining}s remaining` : 'Almost done'}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

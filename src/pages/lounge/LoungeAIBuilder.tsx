import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortalHome } from '@/hooks/usePortalHome';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Globe, FileText, Blocks, Loader2, ArrowLeft, Plus, Wand2, ExternalLink, Crown, Paintbrush, Layout } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Mode = 'full_site' | 'page' | 'section';
type Status = 'idle' | 'generating' | 'success' | 'error';

const ESTIMATED_TIMES: Record<Mode, number> = {
  full_site: 30,
  page: 20,
  section: 10,
};

const GENERATION_STAGES: string[] = [
  'Analysing your description…',
  'Designing layout structure…',
  'Generating responsive elements…',
  'Applying typography & colours…',
  'Polishing final details…',
];

interface GeneratedResult {
  mode: Mode;
  prompt: string;
  data: any;
  siteId?: string;
  siteName?: string;
}

const MODE_CONFIG: Record<Mode, { label: string; icon: typeof Globe; description: string; color: string }> = {
  full_site: { label: 'Full Website', icon: Globe, description: 'Generate a complete multi-page website', color: '#a78bfa' },
  page: { label: 'Single Page', icon: FileText, description: 'Generate one page with all sections', color: '#60a5fa' },
  section: { label: 'Section', icon: Blocks, description: 'Generate individual sections to insert', color: '#34d399' },
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
      toast.success(mode === 'full_site' ? 'Website generated successfully!' : 'Content generated!');
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
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#333] border-t-white/70 rounded-full animate-spin" />
          <span className="text-[#888] text-xs tracking-wide">Loading…</span>
        </div>
      </div>
    ) : !subscribed ? (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0a0a0a' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center space-y-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <Wand2 className="w-7 h-7 text-[#a78bfa]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-white tracking-tight">AI Website Builder</h1>
            <p className="text-[#999] text-sm max-w-sm mx-auto leading-relaxed">
              Generate complete websites from text prompts with our AI-powered builder.
            </p>
          </div>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Pro Plan</p>
                <p className="text-[#777] text-xs mt-0.5">AI Builder + Website Designer</p>
              </div>
              <Badge className="bg-white/10 text-white/80 border-white/10 text-[10px] font-medium tracking-wider uppercase">
                <Crown className="w-3 h-3 mr-1" /> Pro
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">£49.99</span>
              <span className="text-[#666] text-sm">/month</span>
            </div>
            <ul className="text-xs space-y-2.5 text-[#aaa]">
              <li className="flex items-center gap-2.5"><Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" /> AI-powered full website generation</li>
              <li className="flex items-center gap-2.5"><Layout className="w-3.5 h-3.5 text-white/40" /> 50+ starter templates across 20+ niches</li>
              <li className="flex items-center gap-2.5"><Globe className="w-3.5 h-3.5 text-white/40" /> Unlimited websites & pages</li>
              <li className="flex items-center gap-2.5"><Paintbrush className="w-3.5 h-3.5 text-white/40" /> Drag-and-drop visual editor (Workshop)</li>
              <li className="flex items-center gap-2.5"><Blocks className="w-3.5 h-3.5 text-white/40" /> 70+ section blocks & component library</li>
              <li className="flex items-center gap-2.5"><Layout className="w-3.5 h-3.5 text-white/40" /> Global design system & style tokens</li>
              <li className="flex items-center gap-2.5"><Crown className="w-3.5 h-3.5 text-white/40" /> Full template marketplace with preview</li>
              <li className="flex items-center gap-2.5"><Globe className="w-3.5 h-3.5 text-white/40" /> Live preview & responsive testing</li>
            </ul>
            <Button onClick={handleCheckout} disabled={checkoutLoading} className="w-full bg-white text-black hover:bg-white/90 font-medium h-10">
              {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Subscribe Now
            </Button>
            <button onClick={checkSubscription} className="w-full text-center text-[10px] text-[#666] hover:text-[#999] transition-colors pt-1">
              Already subscribed? Refresh status
            </button>
          </div>
        </motion.div>
      </div>
    ) : (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Top Bar */}
      <div className="relative z-20 flex items-center justify-between px-6 h-14 shrink-0" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(portalHome)} className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#666]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(167,139,250,0.1)' }}>
              <Wand2 className="w-4 h-4 text-[#a78bfa]" />
            </div>
            <span className="text-[13px] font-semibold text-white tracking-tight">AI Website Builder</span>
          </div>
        </div>
        {history.length > 0 && (
          <span className="text-[10px] text-[#444] font-mono">{history.length} generated</span>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center overflow-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {status === 'idle' || status === 'error' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-[720px] space-y-8"
            >
              {/* Hero */}
              <div className="text-center space-y-3">
                <motion.div
                  className="inline-flex p-3 rounded-2xl mb-2"
                  style={{ backgroundColor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.12)' }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-8 h-8 text-[#a78bfa]" />
                </motion.div>
                <h1 className="text-3xl font-bold text-white tracking-tight">What would you like to build?</h1>
                <p className="text-[14px] text-[#555]">Describe your website and AI will generate it instantly in the Workshop.</p>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-2 justify-center">
                {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG['full_site']][]).map(([key, cfg]) => {
                  const Icon = cfg.icon;
                  const active = mode === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all text-[12px] font-medium"
                      style={{
                        backgroundColor: active ? `${cfg.color}12` : '#141414',
                        border: `1px solid ${active ? `${cfg.color}30` : '#1e1e1e'}`,
                        color: active ? cfg.color : '#666',
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Input */}
              <div className="relative">
                <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#141414', border: '1px solid #1e1e1e' }}>
                  <textarea
                    ref={inputRef}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={MODE_CONFIG[mode].description + '...'}
                    rows={4}
                    className="w-full bg-transparent text-[14px] text-white placeholder:text-[#333] p-5 pb-14 resize-none outline-none"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[10px] text-[#333] font-mono">
                      {mode === 'full_site' ? 'Generates complete website' : mode === 'page' ? 'Generates single page' : 'Generates sections'}
                    </span>
                    <button
                      onClick={generate}
                      disabled={!prompt.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-30"
                      style={{ backgroundColor: prompt.trim() ? '#a78bfa' : '#333', color: '#000' }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-3">
                <span className="text-[10px] text-[#444] font-semibold uppercase tracking-wider">Suggestions</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(s)}
                      className="text-left px-4 py-3 rounded-lg text-[12px] text-[#666] hover:text-[#aaa] transition-all hover:bg-[#141414]"
                      style={{ border: '1px solid #1a1a1a' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : status === 'generating' ? (
            <GeneratingIndicator mode={mode} />
          ) : status === 'success' && result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[720px] space-y-6"
            >
              {/* Success Card */}
              <div className="rounded-xl p-6 text-center space-y-4" style={{ backgroundColor: '#141414', border: '1px solid #1e1e1e' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="inline-flex p-3 rounded-2xl"
                  style={{ backgroundColor: 'rgba(52,211,153,0.1)' }}
                >
                  <Sparkles className="w-8 h-8 text-[#34d399]" />
                </motion.div>
                <h2 className="text-xl font-bold text-white">
                  {result.mode === 'full_site' ? 'Website Created!' : 'Content Generated!'}
                </h2>
                <p className="text-[13px] text-[#555]">
                  {result.mode === 'full_site'
                    ? `"${result.siteName}" has been created with ${result.data?.pages?.length || 1} page(s)`
                    : `Generated ${result.data?.elements?.length || 0} elements`}
                </p>

                {/* Stats */}
                {result.mode === 'full_site' && result.data?.pages && (
                  <div className="flex justify-center gap-4 pt-2">
                    {result.data.pages.map((p: any, i: number) => (
                      <div key={i} className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
                        <p className="text-[11px] font-medium text-white">{p.name}</p>
                        <p className="text-[10px] text-[#555]">{p.elements?.length || 0} elements</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-center gap-3 pt-2">
                  {result.siteId && (
                    <button
                      onClick={openInEditor}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg text-[13px] font-semibold text-black transition-all hover:opacity-90"
                      style={{ backgroundColor: '#a78bfa' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in Workshop
                    </button>
                  )}
                  <button
                    onClick={() => { setStatus('idle'); setPrompt(''); setResult(null); }}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg text-[13px] font-medium text-[#888] transition-all hover:bg-[#1a1a1a]"
                    style={{ border: '1px solid #1e1e1e' }}
                  >
                    <Plus className="w-4 h-4" />
                    Build Another
                  </button>
                </div>
              </div>

              {/* Previous Builds */}
              {history.length > 1 && (
                <div className="space-y-3">
                  <span className="text-[10px] text-[#444] font-semibold uppercase tracking-wider">Previous Builds</span>
                  <div className="space-y-2">
                    {history.slice(1, 4).map((h, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: '#141414', border: '1px solid #1e1e1e' }}>
                        <span className="text-[12px] text-[#666] flex-1 truncate">{h.prompt}</span>
                        {h.siteId && (
                          <button
                            onClick={() => navigate(`/lounge/editor/${h.siteId}`)}
                            className="text-[10px] text-[#a78bfa] font-medium shrink-0"
                          >
                            Open →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
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
    <motion.div
      key="loading"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center gap-6"
    >
      <motion.div
        className="p-4 rounded-2xl"
        style={{ backgroundColor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.12)' }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-8 h-8 text-[#a78bfa]" />
      </motion.div>

      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-white">Building your website…</h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={stageIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-[13px] text-[#555]"
          >
            {GENERATION_STAGES[stageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-56 space-y-2">
        <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ backgroundColor: '#1e1e1e' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#a78bfa' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono">
          <span className="text-[#444]">{elapsed}s elapsed</span>
          <span className="text-[#555]">
            {remaining > 0 ? `~${remaining}s remaining` : 'Almost done…'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

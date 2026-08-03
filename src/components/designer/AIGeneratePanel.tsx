import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, Globe, FileText, Blocks, X, RefreshCw, Wand2, Type, Layout, Palette, Zap, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEditor } from './EditorContext';
import { EditorElement } from './types';
import { toast } from 'sonner';
import { AIModelSelect } from './AIModelSelect';
import { useAIModelSettings } from '@/hooks/useAIModelSettings';
import { useSavedTemplates } from '@/hooks/useSavedTemplates';

interface AIGeneratePanelProps {
  siteId?: string;
  siteName?: string;
  onClose: () => void;
}

type Mode = 'page' | 'section' | 'content' | 'layout';
type Tone = 'professional' | 'casual' | 'luxury' | 'playful' | 'minimal';

const STAGE_MESSAGES: Record<Mode, string[]> = {
  page: ['Analyzing requirements…', 'Designing layout structure…', 'Generating sections…', 'Building navigation…', 'Applying styles…', 'Finalizing page…'],
  section: ['Understanding prompt…', 'Designing component…', 'Generating elements…', 'Styling section…'],
  content: ['Analyzing business context…', 'Crafting SEO copy…', 'Optimizing for conversions…'],
  layout: ['Planning grid structure…', 'Setting breakpoints…', 'Building responsive layout…'],
};

const EST_TIMES: Record<Mode, number> = { page: 15, section: 8, content: 6, layout: 5 };

export function AIGeneratePanel({ siteId, siteName, onClose }: AIGeneratePanelProps) {
  const { state, dispatch } = useEditor();
  const { activeModel } = useAIModelSettings();
  const { saveTemplate } = useSavedTemplates();
  const [mode, setMode] = useState<Mode>('section');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [generatedCount, setGeneratedCount] = useState(0);
  const [lastGeneratedElements, setLastGeneratedElements] = useState<EditorElement[]>([]);
  const [businessType, setBusinessType] = useState('');
  const [tone, setTone] = useState<Tone>('professional');
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading) { setStageIndex(0); setElapsed(0); return; }
    const stages = STAGE_MESSAGES[mode];
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
      setStageIndex(prev => Math.min(prev + 1, stages.length - 1));
    }, (EST_TIMES[mode] * 1000) / stages.length);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loading, mode]);

  const generate = async (customPrompt?: string) => {
    const p = customPrompt || prompt.trim();
    if (!p || loading) return;
    setLoading(true);
    setLastPrompt(p);
    setElapsed(0);
    setStageIndex(0);

    const toneGuide: Record<Tone, string> = {
      professional: 'Use professional, authoritative tone with clean sans-serif fonts.',
      casual: 'Use friendly, conversational tone with warm colors.',
      luxury: 'Use premium, elegant tone with serif fonts and rich colors.',
      playful: 'Use fun, energetic tone with bold colors and rounded shapes.',
      minimal: 'Use ultra-minimal aesthetic with lots of whitespace and muted colors.',
    };

    const modeContext = {
      section: `Generate a complete section with proper CSS styles. Tone: ${toneGuide[tone]}`,
      page: `Generate a complete webpage with multiple sections (nav, hero, features, CTA, footer). Tone: ${toneGuide[tone]}`,
      content: `Generate marketing copy and content. Business type: ${businessType || 'general'}. Tone: ${toneGuide[tone]}`,
      layout: `Generate a responsive layout structure with proper grid/flexbox. Tone: ${toneGuide[tone]}`,
    };

    try {
      const { data, error } = await supabase.functions.invoke('ai-website-builder', {
        body: {
          prompt: `${modeContext[mode]} ${p}`,
          mode: mode === 'content' ? 'section' : mode === 'layout' ? 'section' : mode,
          context: { siteName, existingElements: state.elements.length > 0, businessType, tone },
          model: activeModel,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.elements && Array.isArray(data.elements)) {
        data.elements.forEach((el: EditorElement) => {
          dispatch({ type: 'ADD_ELEMENT', payload: { element: el } });
        });
        setLastGeneratedElements(data.elements);
        setGeneratedCount(prev => prev + data.elements.length);
        toast.success(`Added ${data.elements.length} elements`);
        setPrompt('');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }
  };

  const modes = [
    { key: 'section' as Mode, label: 'Section', icon: Blocks, desc: 'Single section' },
    { key: 'page' as Mode, label: 'Full Page', icon: FileText, desc: 'Complete page' },
    { key: 'content' as Mode, label: 'Content', icon: Type, desc: 'Copy & text' },
    { key: 'layout' as Mode, label: 'Layout', icon: Layout, desc: 'Grid/Flex' },
  ];

  const tones: { key: Tone; label: string; color: string }[] = [
    { key: 'professional', label: 'Professional', color: 'hsl(var(--studio-accent))' },
    { key: 'casual', label: 'Casual', color: 'hsl(var(--studio-warn))' },
    { key: 'luxury', label: 'Luxury', color: 'hsl(var(--studio-ink-3))' },
    { key: 'playful', label: 'Playful', color: 'hsl(var(--studio-ink-3))' },
    { key: 'minimal', label: 'Minimal', color: 'hsl(var(--studio-ink-3))' },
  ];

  const quickPrompts: Record<Mode, string[]> = {
    section: [
      'Hero section with gradient background',
      'Features grid with 3 columns and icons',
      'Testimonials carousel section',
      'Pricing table with 3 tiers',
      'Contact form with map',
      'FAQ accordion section',
      'Team members grid',
      'Stats counter section',
      'CTA banner with email signup',
      'Logo marquee section',
    ],
    page: [
      'SaaS landing page for project management tool',
      'Restaurant website with menu and booking',
      'Portfolio for a creative agency',
      'E-commerce product showcase page',
      'Real estate property listings page',
    ],
    content: [
      'Write hero copy for a fintech startup',
      'Create testimonials for a design agency',
      'Write FAQ questions for a SaaS product',
      'Generate feature descriptions for an app',
      'Write pricing page copy with 3 tiers',
    ],
    layout: [
      'Two column layout with sidebar',
      'Bento grid layout with mixed sizes',
      'Masonry gallery grid',
      'Dashboard layout with cards',
      'Blog post layout with aside',
    ],
  };

  const stages = STAGE_MESSAGES[mode];
  const progress = loading ? Math.min(((stageIndex + 1) / stages.length) * 100, 95) : 0;

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'hsl(var(--studio-panel))' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ borderBottom: '1px solid hsl(var(--studio-line))', background: 'linear-gradient(180deg, hsl(var(--studio-raised)), hsl(var(--studio-panel)))' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)))' }}>
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-white">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AIModelSelect />
          <button onClick={onClose} className="p-1 rounded hover:bg-[hsl(var(--studio-hover))] transition-colors">
            <X className="w-3.5 h-3.5 text-[hsl(var(--studio-ink-3))]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-1">
          {modes.map(m => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className="flex items-center gap-1.5 py-2 px-2.5 rounded-lg text-[10px] font-medium transition-all"
                style={{
                  backgroundColor: active ? 'rgba(167,139,250,0.1)' : 'transparent',
                  color: active ? 'hsl(var(--studio-ink-3))' : 'hsl(var(--studio-ink-3))',
                  border: `1px solid ${active ? 'rgba(167,139,250,0.2)' : 'hsl(var(--studio-raised))'}`,
                }}
              >
                <Icon className="w-3 h-3" />
                <div className="text-left"><div>{m.label}</div></div>
              </button>
            );
          })}
        </div>

        {/* Tone Selector */}
        <div className="space-y-1">
          <span className="text-[9px] text-[hsl(var(--studio-ink-3))] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Palette className="w-3 h-3" /> Tone
          </span>
          <div className="flex flex-wrap gap-1">
            {tones.map(t => (
              <button
                key={t.key}
                onClick={() => setTone(t.key)}
                className="px-2 py-1 rounded text-[9px] font-semibold transition-all"
                style={{
                  backgroundColor: tone === t.key ? t.color + '20' : 'transparent',
                  color: tone === t.key ? t.color: 'hsl(var(--studio-ink-3))',
                  border: `1px solid ${tone === t.key ? t.color + '40' : 'hsl(var(--studio-raised))'}`,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Business type (for content mode) */}
        {mode === 'content' && (
          <div className="space-y-1">
            <span className="text-[9px] text-[hsl(var(--studio-ink-3))] font-semibold uppercase tracking-wider">Business Type</span>
            <input
              value={businessType}
              onChange={e => setBusinessType(e.target.value)}
              placeholder="e.g. SaaS, Restaurant, Agency…"
              className="w-full h-7 px-3 rounded-lg text-[11px] outline-none"
              style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
            />
          </div>
        )}

        {/* Input */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--studio-line))' }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'content' ? 'Describe the content you need...' : 'Describe what you want to generate...'}
            rows={3}
            className="w-full bg-transparent text-[12px] text-white placeholder:text-[hsl(var(--studio-hover))] p-3 resize-none outline-none"
            style={{ backgroundColor: 'hsl(var(--studio-panel))' }}
          />
        </div>

        {/* Progress indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl p-3 space-y-2"
              style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid rgba(167,139,250,0.15)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-[hsl(var(--studio-ink-3))] animate-pulse" />
                  <span className="text-[10px] text-[hsl(var(--studio-ink-3))] font-medium">{stages[stageIndex]}</span>
                </div>
                <span className="text-[9px] text-[hsl(var(--studio-ink-3))] tabular-nums">{elapsed}s / ~{EST_TIMES[mode]}s</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--studio-raised))' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)))' }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => generate()}
            disabled={!prompt.trim() || loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)))', color: 'hsl(var(--studio-ink))' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Generate
              </>
            )}
          </button>
          {lastPrompt && !loading && (
            <button
              onClick={() => generate(lastPrompt)}
              className="h-[38px] w-[38px] flex items-center justify-center rounded-xl transition-all hover:bg-[hsl(var(--studio-hover))]"
              style={{ border: '1px solid hsl(var(--studio-line))' }}
              title="Regenerate"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[hsl(var(--studio-ink-2))]" />
            </button>
          )}
        </div>

        {/* Save to Templates */}
        {lastGeneratedElements.length > 0 && !loading && (
          <div className="space-y-1.5">
            {!showSave ? (
              <button
                onClick={() => setShowSave(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-medium transition-all hover:bg-[hsl(var(--studio-raised))]"
                style={{ border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
              >
                <Save className="w-3.5 h-3.5" />
                Save as Template
              </button>
            ) : (
              <div className="flex gap-1.5">
                <input
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="Template name…"
                  className="flex-1 h-8 px-2.5 rounded-lg text-[11px] outline-none"
                  style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && saveName.trim()) {
                      saveTemplate({ name: saveName.trim(), elements: lastGeneratedElements, description: lastPrompt });
                      setSaveName('');
                      setShowSave(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (saveName.trim()) {
                      saveTemplate({ name: saveName.trim(), elements: lastGeneratedElements, description: lastPrompt });
                      setSaveName('');
                      setShowSave(false);
                    }
                  }}
                  disabled={!saveName.trim()}
                  className="h-8 px-3 rounded-lg text-[10px] font-semibold disabled:opacity-30"
                  style={{ backgroundColor: 'hsl(var(--studio-accent))', color: 'hsl(var(--studio-ink))' }}
                >
                  Save
                </button>
              </div>
            )}
          </div>
        )}


        {!loading && (
          <div className="space-y-2">
            <span className="text-[9px] text-[hsl(var(--studio-ink-3))] font-semibold uppercase tracking-wider">Suggestions</span>
            <div className="space-y-1">
              {quickPrompts[mode].map((qp, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(qp)}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-[hsl(var(--studio-ink-3))] hover:text-[hsl(var(--studio-ink-2))] hover:bg-[hsl(var(--studio-raised))] transition-colors"
                  style={{ border: '1px solid transparent' }}
                >
                  <Wand2 className="w-3 h-3 inline mr-2 opacity-40" />
                  {qp}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

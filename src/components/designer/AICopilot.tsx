import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2, Wand2, Layout, Type, Palette, Zap, Image, ChevronRight, MessageSquare, Lightbulb, Layers, Repeat, Globe, ChevronLeft } from 'lucide-react';
import { useEditor } from './EditorContext';
import { supabase } from '@/integrations/supabase/client';
import { EditorElement } from './types';
import { toast } from 'sonner';

interface Suggestion {
  label: string;
  description: string;
  icon: typeof Sparkles;
  prompt: string;
  color: string;
}

const HISTORY_KEY = 'ai-copilot-history';
function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function addHistory(prompt: string) {
  const h = [prompt, ...getHistory().filter(p => p !== prompt)].slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

export function AICopilot({ siteId, siteName }: { siteId?: string; siteName?: string }) {
  const { state, dispatch, selectedElement } = useEditor();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const peekZoneRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const history = useMemo(() => getHistory(), [open]);

  // Edge hover detection — peek when mouse is near right edge
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (open) return;
    const distFromRight = window.innerWidth - e.clientX;
    if (distFromRight < 60 && e.clientY > 120) {
      setPeeking(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else if (distFromRight > 160) {
      hideTimerRef.current = setTimeout(() => setPeeking(false), 600);
    }
  }, [open]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [handleMouseMove]);

  const getSuggestions = (): Suggestion[] => {
    if (selectedElement) {
      return [
        { label: 'Modernize design', description: 'Apply contemporary styling & spacing', icon: Wand2, prompt: `Modernize this ${selectedElement.type} element with contemporary styling`, color: 'hsl(var(--studio-ink-3))' },
        { label: 'Fix spacing', description: 'Improve padding, margins & alignment', icon: Layout, prompt: `Fix spacing and alignment for this ${selectedElement.type}`, color: 'hsl(var(--studio-accent))' },
        { label: 'Better typography', description: 'Refine font sizes, weights & hierarchy', icon: Type, prompt: `Improve typography for this ${selectedElement.type} with better font sizing and weights`, color: 'hsl(var(--studio-warn))' },
        { label: 'Add animations', description: 'Subtle motion effects & transitions', icon: Palette, prompt: `Add subtle animations and visual effects to this ${selectedElement.type}`, color: 'hsl(var(--studio-ink-3))' },
        { label: 'Responsive fix', description: 'Ensure it looks good on all devices', icon: Repeat, prompt: `Make this ${selectedElement.type} fully responsive across all breakpoints`, color: 'hsl(var(--studio-ok))' },
      ];
    }
    if (state.elements.length === 0) {
      return [
        { label: 'SaaS landing page', description: 'Hero, features, pricing & footer', icon: Layout, prompt: 'Create a modern SaaS landing page with hero, features, pricing, and footer', color: 'hsl(var(--studio-accent))' },
        { label: 'Portfolio site', description: 'Gallery, about & contact sections', icon: Image, prompt: 'Create a creative portfolio site with gallery, about section, and contact form', color: 'hsl(var(--studio-ink-3))' },
        { label: 'Restaurant page', description: 'Menu, reservations & location', icon: Zap, prompt: 'Create a restaurant website with menu, reservations, and location section', color: 'hsl(var(--studio-warn))' },
        { label: 'Agency site', description: 'Services, case studies & team', icon: Globe, prompt: 'Create a digital agency landing page with services, case studies, and team section', color: 'hsl(var(--studio-ink-3))' },
        { label: 'E-commerce store', description: 'Products, cart & checkout flow', icon: Layers, prompt: 'Create an e-commerce landing page with featured products, categories, and hero banner', color: 'hsl(var(--studio-ok))' },
      ];
    }
    return [
      { label: 'Add hero section', description: 'Bold heading, subtext & CTA', icon: Layout, prompt: 'Generate a hero section with bold heading, subtext, and CTA button', color: 'hsl(var(--studio-accent))' },
      { label: 'Add testimonials', description: '3 customer quotes with avatars', icon: MessageSquare, prompt: 'Generate a testimonials section with 3 customer quotes', color: 'hsl(var(--studio-ink-3))' },
      { label: 'Add pricing table', description: '3 tiers with features comparison', icon: Zap, prompt: 'Generate a pricing section with 3 tiers', color: 'hsl(var(--studio-warn))' },
      { label: 'Add CTA section', description: 'Gradient background with action button', icon: Sparkles, prompt: 'Generate a call-to-action section with gradient background', color: 'hsl(var(--studio-ink-3))' },
      { label: 'Add FAQ section', description: 'Accordion-style questions & answers', icon: Lightbulb, prompt: 'Generate an FAQ section with 5 common questions', color: 'hsl(var(--studio-ok))' },
    ];
  };

  const generate = async (customPrompt?: string) => {
    const p = customPrompt || prompt.trim();
    if (!p || loading) return;
    setLoading(true);
    addHistory(p);

    try {
      const { data, error } = await supabase.functions.invoke('ai-website-builder', {
        body: {
          prompt: p,
          mode: state.elements.length === 0 ? 'page' : 'section',
          context: {
            siteName,
            existingElements: state.elements.length > 0,
            selectedElement: selectedElement ? { type: selectedElement.type, id: selectedElement.id } : null,
          },
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.elements && Array.isArray(data.elements)) {
        data.elements.forEach((el: EditorElement) => {
          dispatch({ type: 'ADD_ELEMENT', payload: { element: el } });
        });
        toast.success(`Generated ${data.elements.length} elements`);
        setPrompt('');
        setOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const suggestions = getSuggestions();

  return (
    <>
      {/* Minimized edge tab — slides in on hover near right edge */}
      <AnimatePresence>
        {!open && (
          <motion.div
            ref={peekZoneRef}
            initial={{ x: 56 }}
            animate={{ x: peeking ? 0 : 52 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed right-0 z-[100] flex flex-col items-center"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
            onMouseEnter={() => {
              setPeeking(true);
              if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            }}
            onMouseLeave={() => {
              hideTimerRef.current = setTimeout(() => setPeeking(false), 800);
            }}
          >
            <motion.button
              onClick={() => { setOpen(true); setPeeking(false); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-l-xl overflow-hidden"
              style={{
                padding: peeking ? '10px 14px 10px 12px' : '10px 6px 10px 10px',
                background: 'linear-gradient(135deg, hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)))',
                boxShadow: '0 8px 32px rgba(124,58,237,0.4), -4px 0 20px rgba(124,58,237,0.15)',
                transition: 'padding 0.2s ease',
              }}
            >
              <motion.div
                animate={peeking ? { rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>
              <AnimatePresence>
                {peeking && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap"
                  >
                    <span className="text-[11px] font-semibold text-white">AI Copilot</span>
                    <span className="text-[8px] font-mono text-white/50">⌘J</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Glow pulse when minimized */}
            {!peeking && (
              <motion.div
                className="absolute inset-0 rounded-l-xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at right, rgba(124,58,237,0.15), transparent 70%)',
                }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200]"
              style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-[18%] left-1/2 -translate-x-1/2 z-[201] w-[560px] max-w-[90vw] rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'rgba(20,20,20,0.98)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 80px rgba(124,58,237,0.08)',
              }}
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-5 h-14" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)))', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <input
                  ref={inputRef}
                  value={prompt}
                  onChange={e => { setPrompt(e.target.value); setShowHistory(false); }}
                  onFocus={() => { if (!prompt.trim() && history.length > 0) setShowHistory(true); }}
                  onKeyDown={e => { if (e.key === 'Enter') generate(); if (e.key === 'Escape') setOpen(false); }}
                  placeholder={selectedElement ? `Edit ${selectedElement.type}…` : 'Describe what you want to build…'}
                  className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[hsl(var(--studio-hover))] outline-none"
                  disabled={loading}
                />
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--studio-ink-3))' }} />
                ) : prompt.trim() ? (
                  <button onClick={() => generate()} className="h-7 w-7 rounded-lg flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)))' }}>
                    <Send className="w-3 h-3" />
                  </button>
                ) : (
                  <kbd className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'hsl(var(--studio-raised))', color: 'hsl(var(--studio-ink-3))', border: '1px solid hsl(var(--studio-line))' }}>ESC</kbd>
                )}
              </div>

              {/* Context badge */}
              {selectedElement && (
                <div className="px-5 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium" style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.08)', color: 'hsl(var(--studio-accent))', border: '1px solid hsl(var(--studio-accent) / 0.1)' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(var(--studio-accent))' }} />
                    Editing: {selectedElement.name || selectedElement.type}
                  </div>
                </div>
              )}

              {/* History dropdown */}
              {showHistory && !loading && history.length > 0 && !prompt.trim() && (
                <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <div className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-hover))' }}>Recent</div>
                  {history.slice(0, 5).map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { setPrompt(h); setShowHistory(false); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[11px] hover:bg-white/[0.03] transition-colors"
                      style={{ color: 'hsl(var(--studio-ink-2))' }}
                    >
                      <Repeat className="h-2.5 w-2.5 shrink-0" style={{ color: 'hsl(var(--studio-hover))' }} />
                      <span className="truncate">{h}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {!loading && (
                <div className="p-2 max-h-[340px] overflow-auto">
                  <div className="px-3 py-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: 'hsl(var(--studio-hover))' }}>
                      {selectedElement ? 'Edit Suggestions' : state.elements.length === 0 ? 'Quick Start' : 'Add to Page'}
                    </span>
                  </div>
                  {suggestions.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => generate(s.prompt)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${s.color}08`; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                          style={{
                            backgroundColor: `${s.color}10`,
                            border: `1px solid ${s.color}15`,
                          }}
                        >
                          <Icon className="w-4 h-4" style={{ color: s.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-medium block" style={{ color: 'hsl(var(--studio-ink-2))' }}>{s.label}</span>
                          <span className="text-[10px] block mt-0.5" style={{ color: 'hsl(var(--studio-ink-3))' }}>{s.description}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: s.color }} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="p-8 flex flex-col items-center gap-4">
                  <div className="relative">
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.1))' }}
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6" style={{ color: 'hsl(var(--studio-ink-3))' }} />
                    </motion.div>
                    <motion.div
                      className="absolute -inset-2 rounded-3xl"
                      style={{ border: '2px solid rgba(124,58,237,0.15)' }}
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <span className="text-[12px] font-medium" style={{ color: 'hsl(var(--studio-ink-2))' }}>Generating your design…</span>
                  <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--studio-panel))' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)))', backgroundSize: '200% 100%' }}
                      initial={{ width: '0%' }}
                      animate={{ width: '85%', backgroundPosition: ['0% 0%', '100% 0%'] }}
                      transition={{ width: { duration: 10, ease: 'easeOut' }, backgroundPosition: { duration: 1.5, repeat: Infinity } }}
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-5 py-2.5 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <span className="text-[9px]" style={{ color: 'hsl(var(--studio-hover))' }}>Powered by Quooro AI</span>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] flex items-center gap-1" style={{ color: 'hsl(var(--studio-hover))' }}>
                    <kbd className="px-1 py-0.5 rounded text-[8px] font-mono" style={{ backgroundColor: 'hsl(var(--studio-panel))', color: 'hsl(var(--studio-ink-3))', border: '1px solid hsl(var(--studio-line))' }}>↵</kbd> Generate
                  </span>
                  <span className="text-[9px] flex items-center gap-1" style={{ color: 'hsl(var(--studio-hover))' }}>
                    <kbd className="px-1 py-0.5 rounded text-[8px] font-mono" style={{ backgroundColor: 'hsl(var(--studio-panel))', color: 'hsl(var(--studio-ink-3))', border: '1px solid hsl(var(--studio-line))' }}>ESC</kbd> Close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

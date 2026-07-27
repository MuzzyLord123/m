import { useState, useCallback, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Type, Maximize, Eye, Zap, Check, Sun, Moon, Shuffle, Copy, RotateCcw, Loader2 } from 'lucide-react';
import { useEditor } from '../EditorContext';
import { EditorElement } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ─── Types ─── */
interface DesignTokens {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: string;
  spacing: string;
}

/* ─── Presets ─── */
const PRESETS: { name: string; tokens: DesignTokens }[] = [
  {
    name: 'Obsidian',
    tokens: { primaryColor: '#ffffff', secondaryColor: '#888888', accentColor: '#6366f1', backgroundColor: '#000000', textColor: '#ffffff', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '0px', spacing: 'relaxed' },
  },
  {
    name: 'Moonlight',
    tokens: { primaryColor: '#e2e8f0', secondaryColor: '#64748b', accentColor: '#3b82f6', backgroundColor: '#0f172a', textColor: '#e2e8f0', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '8px', spacing: 'normal' },
  },
  {
    name: 'Pearl',
    tokens: { primaryColor: '#111111', secondaryColor: '#666666', accentColor: '#000000', backgroundColor: '#ffffff', textColor: '#111111', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '12px', spacing: 'normal' },
  },
  {
    name: 'Coral',
    tokens: { primaryColor: '#ffffff', secondaryColor: '#94a3b8', accentColor: '#f43f5e', backgroundColor: '#0a0a0a', textColor: '#ffffff', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '0px', spacing: 'compact' },
  },
  {
    name: 'Forest',
    tokens: { primaryColor: '#ffffff', secondaryColor: '#94a3b8', accentColor: '#10b981', backgroundColor: '#0a0a0a', textColor: '#ffffff', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '8px', spacing: 'relaxed' },
  },
  {
    name: 'Amethyst',
    tokens: { primaryColor: '#ffffff', secondaryColor: '#a78bfa', accentColor: '#8b5cf6', backgroundColor: '#09090b', textColor: '#ffffff', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '12px', spacing: 'normal' },
  },
  {
    name: 'Sunset',
    tokens: { primaryColor: '#1a1a2e', secondaryColor: '#4a4a6a', accentColor: '#e94560', backgroundColor: '#fefefe', textColor: '#1a1a2e', headingFont: 'Playfair Display', bodyFont: 'Inter', borderRadius: '16px', spacing: 'relaxed' },
  },
  {
    name: 'Minimal',
    tokens: { primaryColor: '#000000', secondaryColor: '#999999', accentColor: '#333333', backgroundColor: '#ffffff', textColor: '#000000', headingFont: 'system-ui', bodyFont: 'system-ui', borderRadius: '4px', spacing: 'compact' },
  },
];

const FONT_OPTIONS = [
  'Inter', 'Space Grotesk', 'system-ui', 'Georgia', 'Playfair Display',
  'DM Sans', 'Outfit', 'Manrope', 'Sora', 'Plus Jakarta Sans',
  'Urbanist', 'Poppins', 'Raleway', 'Montserrat', 'Lora',
];

const RADIUS_OPTIONS = ['0px', '4px', '8px', '12px', '16px', '24px', '9999px'];

const QUICK_SWATCHES = [
  '#000000', '#111111', '#0a0a0a', '#0f172a', '#09090b', '#ffffff', '#f8fafc', '#fafafa',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f43f5e', '#f97316', '#10b981',
  '#06b6d4', '#84cc16', '#14b8a6', '#a855f7',
];

const NEUTRAL_SHADES = ['#FAFAFA', '#F5F5F5', '#E5E5E5', '#D4D4D4', '#A3A3A3', '#737373', '#525252', '#404040', '#262626', '#171717'];

/* ─── Google Fonts loader ─── */
function loadGoogleFont(font: string) {
  if (font === 'system-ui' || font === 'Georgia') return;
  const id = `gf-${font.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

/* ─── Main Component ─── */
export function StyleGuideEditor({ siteId }: { siteId?: string }) {
  const { state, dispatch } = useEditor();
  const [tokens, setTokens] = useState<DesignTokens>(PRESETS[0].tokens);
  const [activeSection, setActiveSection] = useState<'presets' | 'colors' | 'typography' | 'spacing'>('presets');
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [editingColorKey, setEditingColorKey] = useState<keyof DesignTokens | null>(null);

  // Load fonts when tokens change
  useEffect(() => {
    loadGoogleFont(tokens.headingFont);
    loadGoogleFont(tokens.bodyFont);
  }, [tokens.headingFont, tokens.bodyFont]);

  const updateToken = <K extends keyof DesignTokens>(key: K, value: DesignTokens[K]) => {
    setTokens(prev => ({ ...prev, [key]: value }));
    setApplied(false);
  };

  function applyToElement(el: EditorElement): EditorElement {
    const newStyles = { ...el.styles };
    const desktop = { ...newStyles.desktop };
    if (['section', 'footer'].includes(el.type)) {
      desktop.backgroundColor = tokens.backgroundColor;
      desktop.color = tokens.textColor;
    }
    if (['heading'].includes(el.type)) {
      desktop.color = tokens.primaryColor;
      desktop.fontFamily = `'${tokens.headingFont}', sans-serif`;
    }
    if (['text', 'quote'].includes(el.type)) {
      desktop.color = tokens.secondaryColor;
      desktop.fontFamily = `'${tokens.bodyFont}', sans-serif`;
    }
    if (['button'].includes(el.type)) {
      desktop.backgroundColor = tokens.accentColor;
      desktop.borderRadius = tokens.borderRadius;
      desktop.color = '#fff';
    }
    if (['card'].includes(el.type)) {
      desktop.borderRadius = tokens.borderRadius;
    }
    if (['badge'].includes(el.type)) {
      desktop.backgroundColor = `${tokens.accentColor}15`;
      desktop.color = tokens.accentColor;
    }
    newStyles.desktop = desktop;
    return { ...el, styles: newStyles, children: el.children.map(applyToElement) };
  }

  const applyTokens = useCallback(async () => {
    if (!siteId) return;
    setApplying(true);

    try {
      // 1. Apply to current page in editor state
      const newElements = state.elements.map(applyToElement);
      dispatch({ type: 'SET_ELEMENTS', payload: newElements });
      setTimeout(() => dispatch({ type: 'SET_DIRTY', payload: true }), 50);

      // 2. Fetch ALL pages for this site and update them all
      const { data: allPages, error: fetchErr } = await supabase
        .from('designer_pages')
        .select('id, elements')
        .eq('site_id', siteId);

      if (fetchErr) throw fetchErr;

      if (allPages && allPages.length > 0) {
        const updates = allPages.map(page => {
          const pageElements = (page.elements || []) as unknown as EditorElement[];
          const updatedElements = pageElements.map(applyToElement);
          return supabase
            .from('designer_pages')
            .update({
              elements: JSON.parse(JSON.stringify(updatedElements)),
              updated_at: new Date().toISOString(),
            })
            .eq('id', page.id);
        });

        await Promise.all(updates);
      }

      setApplied(true);
      toast.success(`Style applied to all ${allPages?.length || 0} pages across your site`);
    } catch (err) {
      console.error('Failed to apply tokens:', err);
      toast.error('Failed to apply styles to all pages');
    } finally {
      setApplying(false);
    }
  }, [tokens, state.elements, dispatch, siteId]);

  const shufflePreset = () => {
    const current = PRESETS.findIndex(p => p.tokens.accentColor === tokens.accentColor && p.tokens.backgroundColor === tokens.backgroundColor);
    const next = (current + 1) % PRESETS.length;
    setTokens(PRESETS[next].tokens);
    setApplied(false);
  };

  const copyTokensCSS = () => {
    const css = `:root {
  --primary: ${tokens.primaryColor};
  --secondary: ${tokens.secondaryColor};
  --accent: ${tokens.accentColor};
  --background: ${tokens.backgroundColor};
  --text: ${tokens.textColor};
  --heading-font: '${tokens.headingFont}', sans-serif;
  --body-font: '${tokens.bodyFont}', sans-serif;
  --radius: ${tokens.borderRadius};
  --spacing: ${tokens.spacing};
}`;
    navigator.clipboard.writeText(css);
    toast.success('CSS variables copied to clipboard');
  };

  const previewBg = mode === 'dark' ? '#0a0a0a' : '#fafafa';
  const previewBorder = mode === 'dark' ? '#222' : '#e5e5e5';

  const sections = [
    { key: 'presets' as const, label: 'Presets', icon: Eye },
    { key: 'colors' as const, label: 'Colors', icon: Palette },
    { key: 'typography' as const, label: 'Typography', icon: Type },
    { key: 'spacing' as const, label: 'Layout', icon: Maximize },
  ];

  return (
    <div className="w-full h-full overflow-hidden flex" style={{ backgroundColor: '#181818' }}>
      {/* Left: Controls */}
      <div className="w-[360px] shrink-0 h-full flex flex-col" style={{ borderRight: '1px solid #2a2a2a' }}>
        <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <h2 className="text-[13px] font-bold text-[#e0e0e0]">Style Guide</h2>
          <div className="flex items-center gap-1.5">
            <button onClick={shufflePreset} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/[0.06] transition-colors" title="Next preset">
              <Shuffle className="h-3.5 w-3.5 text-[#888]" />
            </button>
            <button onClick={copyTokensCSS} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/[0.06] transition-colors" title="Copy CSS">
              <Copy className="h-3.5 w-3.5 text-[#888]" />
            </button>
            <button onClick={() => { setTokens(PRESETS[0].tokens); setApplied(false); }} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/[0.06] transition-colors" title="Reset">
              <RotateCcw className="h-3.5 w-3.5 text-[#888]" />
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="px-4 pt-3 pb-2 flex gap-1 shrink-0">
          {sections.map(sec => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.key}
                onClick={() => setActiveSection(sec.key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: activeSection === sec.key ? '#0073E6' : '#252525',
                  color: activeSection === sec.key ? '#fff' : '#888',
                  border: `1px solid ${activeSection === sec.key ? '#0073E6' : '#333'}`,
                }}
              >
                <Icon className="h-3 w-3" />
                {sec.label}
              </button>
            );
          })}
        </div>

        {/* Apply button */}
        <div className="px-4 py-2 shrink-0">
          <button
            onClick={applyTokens}
            disabled={applying}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-70"
            style={{
              background: applied ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #0073E6, #005bb5)',
              color: '#fff',
              boxShadow: '0 2px 12px rgba(0,115,230,0.25)',
            }}
          >
            {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : applied ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            {applying ? 'Applying to All Pages…' : applied ? 'Applied to All Pages!' : 'Apply to All Pages'}
          </button>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1">
          <div className="px-4 pb-6 space-y-4">
            {/* ─── PRESETS ─── */}
            {activeSection === 'presets' && (
              <div className="space-y-3">
                <SectionLabel>Style Presets</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map(preset => {
                    const isActive = tokens.accentColor === preset.tokens.accentColor && tokens.backgroundColor === preset.tokens.backgroundColor;
                    return (
                      <button
                        key={preset.name}
                        onClick={() => { setTokens(preset.tokens); setApplied(false); }}
                        className="rounded-xl p-3.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          backgroundColor: preset.tokens.backgroundColor,
                          border: isActive ? '2px solid #0073E6' : '1px solid rgba(128,128,128,0.2)',
                          boxShadow: isActive ? '0 0 20px rgba(0,115,230,0.15)' : 'none',
                        }}
                      >
                        <div className="flex gap-1.5 mb-2.5">
                          {[preset.tokens.primaryColor, preset.tokens.accentColor, preset.tokens.secondaryColor].map((c, i) => (
                            <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: c, border: '1px solid rgba(128,128,128,0.3)' }} />
                          ))}
                        </div>
                        <span className="text-[11px] font-semibold" style={{ color: preset.tokens.textColor }}>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── COLORS ─── */}
            {activeSection === 'colors' && (
              <div className="space-y-4">
                <SectionLabel>Color Palette</SectionLabel>
                {([
                  ['Primary', 'primaryColor'],
                  ['Secondary', 'secondaryColor'],
                  ['Accent', 'accentColor'],
                  ['Background', 'backgroundColor'],
                  ['Text', 'textColor'],
                ] as [string, keyof DesignTokens][]).map(([label, key]) => (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium" style={{ color: '#aaa' }}>{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="color"
                            value={tokens[key]}
                            onChange={e => updateToken(key, e.target.value)}
                            className="w-7 h-7 rounded-md cursor-pointer border-0"
                            style={{ backgroundColor: 'transparent' }}
                          />
                        </div>
                        <input
                          type="text"
                          value={tokens[key]}
                          onChange={e => updateToken(key, e.target.value)}
                          className="w-[90px] h-7 px-2 rounded-md text-[10px] font-mono outline-none"
                          style={{ backgroundColor: '#2d2d2d', border: '1px solid #444', color: '#ccc' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <SectionLabel>Quick Swatches</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SWATCHES.map(color => (
                    <button
                      key={color}
                      onClick={() => updateToken('accentColor', color)}
                      className="w-6 h-6 rounded-md transition-transform hover:scale-110 active:scale-95"
                      style={{ backgroundColor: color, border: tokens.accentColor === color ? '2px solid #0073E6' : '1px solid rgba(128,128,128,0.3)' }}
                      title={color}
                    />
                  ))}
                </div>

                <SectionLabel>Neutrals Scale</SectionLabel>
                <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #333' }}>
                  {NEUTRAL_SHADES.map((shade, i) => (
                    <button
                      key={i}
                      className="flex-1 h-8 transition-all hover:scale-y-125"
                      style={{ backgroundColor: shade }}
                      onClick={() => {
                        const isDark = i >= 5;
                        if (isDark) updateToken('backgroundColor', shade);
                        else updateToken('backgroundColor', shade);
                      }}
                      title={shade}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ─── TYPOGRAPHY ─── */}
            {activeSection === 'typography' && (
              <div className="space-y-4">
                <SectionLabel>Heading Font</SectionLabel>
                <select
                  value={tokens.headingFont}
                  onChange={e => { updateToken('headingFont', e.target.value); loadGoogleFont(e.target.value); }}
                  className="w-full h-9 px-3 rounded-lg text-[11px] outline-none cursor-pointer"
                  style={{ backgroundColor: '#252525', border: '1px solid #333', color: '#ccc' }}
                >
                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>

                <SectionLabel>Body Font</SectionLabel>
                <select
                  value={tokens.bodyFont}
                  onChange={e => { updateToken('bodyFont', e.target.value); loadGoogleFont(e.target.value); }}
                  className="w-full h-9 px-3 rounded-lg text-[11px] outline-none cursor-pointer"
                  style={{ backgroundColor: '#252525', border: '1px solid #333', color: '#ccc' }}
                >
                  {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>

                {/* Type scale preview */}
                <SectionLabel>Type Scale</SectionLabel>
                <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                  {[
                    { label: 'H1', size: '32px', weight: 700, font: tokens.headingFont },
                    { label: 'H2', size: '24px', weight: 700, font: tokens.headingFont },
                    { label: 'H3', size: '20px', weight: 600, font: tokens.headingFont },
                    { label: 'H4', size: '16px', weight: 600, font: tokens.headingFont },
                    { label: 'Body', size: '14px', weight: 400, font: tokens.bodyFont },
                    { label: 'Small', size: '12px', weight: 400, font: tokens.bodyFont },
                    { label: 'Caption', size: '10px', weight: 500, font: tokens.bodyFont },
                  ].map(level => (
                    <div key={level.label} className="flex items-baseline gap-3">
                      <span className="text-[9px] font-mono w-10 shrink-0" style={{ color: '#555' }}>{level.label}</span>
                      <span style={{ fontFamily: `'${level.font}', sans-serif`, fontSize: level.size, fontWeight: level.weight, color: '#e0e0e0', lineHeight: 1.2 }}>
                        The quick brown fox
                      </span>
                    </div>
                  ))}
                </div>

                {/* Font pairing */}
                <SectionLabel>Font Pairing</SectionLabel>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                    <span className="text-[9px] font-medium block mb-1.5" style={{ color: '#555' }}>Heading</span>
                    <span className="text-[20px] font-bold text-[#e0e0e0]" style={{ fontFamily: `'${tokens.headingFont}', sans-serif` }}>
                      {tokens.headingFont}
                    </span>
                    <span className="text-[9px] block mt-1" style={{ color: '#444' }}>Aa Bb Cc 123</span>
                  </div>
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                    <span className="text-[9px] font-medium block mb-1.5" style={{ color: '#555' }}>Body</span>
                    <span className="text-[20px] text-[#e0e0e0]" style={{ fontFamily: `'${tokens.bodyFont}', sans-serif` }}>
                      {tokens.bodyFont}
                    </span>
                    <span className="text-[9px] block mt-1" style={{ color: '#444' }}>Aa Bb Cc 123</span>
                  </div>
                </div>
              </div>
            )}

            {/* ─── SPACING & LAYOUT ─── */}
            {activeSection === 'spacing' && (
              <div className="space-y-4">
                <SectionLabel>Border Radius</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {RADIUS_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => updateToken('borderRadius', r)}
                      className="px-3 py-2 rounded-lg text-[10px] font-medium transition-all"
                      style={{
                        backgroundColor: tokens.borderRadius === r ? '#0073E6' : '#252525',
                        color: tokens.borderRadius === r ? '#fff' : '#888',
                        border: `1px solid ${tokens.borderRadius === r ? '#0073E6' : '#333'}`,
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 justify-center py-3">
                  {RADIUS_OPTIONS.slice(0, 5).map(r => (
                    <button
                      key={r}
                      onClick={() => updateToken('borderRadius', r)}
                      className="w-14 h-14 transition-all"
                      style={{
                        borderRadius: r,
                        backgroundColor: tokens.borderRadius === r ? '#0073E6' : '#333',
                        border: tokens.borderRadius === r ? '2px solid #0073E6' : '1px solid #444',
                      }}
                    />
                  ))}
                </div>

                <SectionLabel>Content Density</SectionLabel>
                <div className="flex gap-1.5">
                  {['compact', 'normal', 'relaxed'].map(sp => (
                    <button
                      key={sp}
                      onClick={() => updateToken('spacing', sp)}
                      className="flex-1 py-2.5 rounded-lg text-[10px] font-semibold capitalize transition-all"
                      style={{
                        backgroundColor: tokens.spacing === sp ? '#0073E6' : '#252525',
                        color: tokens.spacing === sp ? '#fff' : '#888',
                        border: `1px solid ${tokens.spacing === sp ? '#0073E6' : '#333'}`,
                      }}
                    >
                      {sp}
                    </button>
                  ))}
                </div>

                {/* Spacing preview */}
                <SectionLabel>Spacing Preview</SectionLabel>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                  {['compact', 'normal', 'relaxed'].map(sp => {
                    const gap = sp === 'compact' ? '8px' : sp === 'normal' ? '16px' : '24px';
                    return (
                      <div key={sp} className="mb-3 last:mb-0">
                        <span className="text-[9px] font-medium capitalize block mb-1.5" style={{ color: tokens.spacing === sp ? '#0073E6' : '#555' }}>{sp} ({gap})</span>
                        <div className="flex" style={{ gap }}>
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-6 flex-1 rounded" style={{ backgroundColor: tokens.spacing === sp ? '#0073E6' : '#333', opacity: tokens.spacing === sp ? 0.7 : 0.4 }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Live Preview */}
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
          <span className="text-[12px] font-semibold text-[#888]">Live Preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              className="h-7 px-3 flex items-center gap-1.5 rounded-lg text-[10px] font-medium transition-all hover:bg-white/[0.06]"
              style={{ backgroundColor: '#252525', color: '#888', border: '1px solid #333' }}
            >
              {mode === 'light' ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              {mode === 'light' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-6">
            {/* Full page preview */}
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${previewBorder}`, maxWidth: '720px', margin: '0 auto' }}>
              {/* Nav */}
              <div style={{ backgroundColor: tokens.backgroundColor, borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#eee'}`, padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: tokens.primaryColor, fontFamily: `'${tokens.headingFont}', sans-serif` }}>Brand</span>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {['About', 'Services', 'Work', 'Contact'].map(l => (
                    <span key={l} style={{ fontSize: '12px', color: tokens.secondaryColor, fontFamily: `'${tokens.bodyFont}', sans-serif`, cursor: 'pointer' }}>{l}</span>
                  ))}
                </div>
              </div>

              {/* Hero */}
              <div style={{ backgroundColor: tokens.backgroundColor, padding: '64px 28px', textAlign: 'center' }}>
                <div style={{
                  display: 'inline-block', padding: '4px 14px', marginBottom: '20px',
                  backgroundColor: `${tokens.accentColor}15`, color: tokens.accentColor,
                  fontSize: '10px', fontWeight: 600, borderRadius: '9999px', fontFamily: `'${tokens.bodyFont}', sans-serif`,
                }}>
                  NEW RELEASE
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: tokens.primaryColor, fontFamily: `'${tokens.headingFont}', sans-serif`, marginBottom: '16px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  Design that speaks<br />for itself
                </div>
                <div style={{ fontSize: '14px', color: tokens.secondaryColor, fontFamily: `'${tokens.bodyFont}', sans-serif`, marginBottom: '28px', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 28px' }}>
                  Craft beautiful, consistent interfaces with your custom design system. Every element, perfectly aligned.
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <div style={{
                    display: 'inline-block', padding: '10px 24px',
                    backgroundColor: tokens.accentColor, color: '#fff',
                    fontSize: '12px', fontWeight: 600, borderRadius: tokens.borderRadius, fontFamily: `'${tokens.bodyFont}', sans-serif`,
                  }}>
                    Get Started
                  </div>
                  <div style={{
                    display: 'inline-block', padding: '10px 24px',
                    backgroundColor: 'transparent', color: tokens.primaryColor,
                    fontSize: '12px', fontWeight: 600, borderRadius: tokens.borderRadius, fontFamily: `'${tokens.bodyFont}', sans-serif`,
                    border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.15)' : '#ddd'}`,
                  }}>
                    Learn More
                  </div>
                </div>
              </div>

              {/* Cards section */}
              <div style={{ backgroundColor: tokens.backgroundColor, padding: '48px 28px' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: tokens.primaryColor, fontFamily: `'${tokens.headingFont}', sans-serif`, marginBottom: '8px', textAlign: 'center' }}>
                  Features
                </div>
                <div style={{ fontSize: '13px', color: tokens.secondaryColor, fontFamily: `'${tokens.bodyFont}', sans-serif`, marginBottom: '32px', textAlign: 'center' }}>
                  Everything you need to build great products.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing === 'compact' ? '12px' : tokens.spacing === 'normal' ? '20px' : '28px' }}>
                  {['Design', 'Develop', 'Deploy'].map((title, i) => (
                    <div key={title} style={{
                      padding: tokens.spacing === 'compact' ? '16px' : tokens.spacing === 'normal' ? '24px' : '32px',
                      borderRadius: tokens.borderRadius,
                      border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e5e5e5'}`,
                      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: tokens.borderRadius, backgroundColor: `${tokens.accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: tokens.accentColor }} />
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: tokens.primaryColor, fontFamily: `'${tokens.headingFont}', sans-serif`, marginBottom: '8px' }}>
                        {title}
                      </div>
                      <div style={{ fontSize: '12px', color: tokens.secondaryColor, fontFamily: `'${tokens.bodyFont}', sans-serif`, lineHeight: 1.5 }}>
                        Build with confidence using our comprehensive toolkit.
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ backgroundColor: tokens.backgroundColor, borderTop: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#eee'}`, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: tokens.secondaryColor, fontFamily: `'${tokens.bodyFont}', sans-serif` }}>© 2026 Brand. All rights reserved.</span>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['Privacy', 'Terms'].map(l => (
                    <span key={l} style={{ fontSize: '11px', color: tokens.secondaryColor, fontFamily: `'${tokens.bodyFont}', sans-serif` }}>{l}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Component specimens */}
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] block mb-3" style={{ color: '#555' }}>UI Components</span>
              <div className="grid grid-cols-2 gap-4">
                {/* Buttons */}
                <div className="rounded-xl p-5" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                  <span className="text-[10px] font-medium block mb-4" style={{ color: '#555' }}>Buttons</span>
                  <div className="flex flex-wrap gap-2">
                    <button style={{ padding: '8px 20px', backgroundColor: tokens.accentColor, color: '#fff', fontSize: '11px', fontWeight: 600, borderRadius: tokens.borderRadius, fontFamily: `'${tokens.bodyFont}', sans-serif`, border: 'none' }}>Primary</button>
                    <button style={{ padding: '8px 20px', backgroundColor: 'transparent', color: tokens.accentColor, fontSize: '11px', fontWeight: 600, borderRadius: tokens.borderRadius, fontFamily: `'${tokens.bodyFont}', sans-serif`, border: `1px solid ${tokens.accentColor}` }}>Outline</button>
                    <button style={{ padding: '8px 20px', backgroundColor: `${tokens.accentColor}15`, color: tokens.accentColor, fontSize: '11px', fontWeight: 600, borderRadius: tokens.borderRadius, fontFamily: `'${tokens.bodyFont}', sans-serif`, border: 'none' }}>Ghost</button>
                  </div>
                </div>

                {/* Inputs */}
                <div className="rounded-xl p-5" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                  <span className="text-[10px] font-medium block mb-4" style={{ color: '#555' }}>Form Elements</span>
                  <div className="space-y-2">
                    <input
                      placeholder="Email address"
                      className="w-full h-9 px-3 text-[11px] bg-transparent outline-none"
                      style={{ border: '1px solid #444', borderRadius: tokens.borderRadius, color: '#999', fontFamily: `'${tokens.bodyFont}', sans-serif` }}
                      readOnly
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center" style={{ borderRadius: '4px', border: `2px solid ${tokens.accentColor}`, backgroundColor: tokens.accentColor }}>
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-[10px]" style={{ color: '#888', fontFamily: `'${tokens.bodyFont}', sans-serif` }}>Accept terms</span>
                    </div>
                  </div>
                </div>

                {/* Badge */}
                <div className="rounded-xl p-5" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                  <span className="text-[10px] font-medium block mb-4" style={{ color: '#555' }}>Badges</span>
                  <div className="flex flex-wrap gap-2">
                    {['New', 'Popular', 'Sale', 'Beta'].map(label => (
                      <span key={label} style={{ padding: '4px 12px', fontSize: '10px', fontWeight: 600, borderRadius: '9999px', backgroundColor: `${tokens.accentColor}15`, color: tokens.accentColor, fontFamily: `'${tokens.bodyFont}', sans-serif` }}>{label}</span>
                    ))}
                  </div>
                </div>

                {/* Card */}
                <div className="rounded-xl p-5" style={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }}>
                  <span className="text-[10px] font-medium block mb-4" style={{ color: '#555' }}>Card</span>
                  <div style={{ borderRadius: tokens.borderRadius, border: '1px solid #333', overflow: 'hidden' }}>
                    <div className="h-16 flex items-center justify-center" style={{ backgroundColor: '#252525' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="h-2 w-2/3 rounded-sm" style={{ backgroundColor: '#444' }} />
                      <div className="h-1.5 w-full rounded-sm" style={{ backgroundColor: '#333' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-semibold uppercase tracking-[0.12em] px-0.5" style={{ color: '#555' }}>
      {children}
    </div>
  );
}

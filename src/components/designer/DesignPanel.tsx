import { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Type, Maximize, Eye, Zap, Check, Sparkles, Copy, RotateCcw } from 'lucide-react';
import { useEditor } from './EditorContext';
import { EditorElement } from './types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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

const PRESETS: { name: string; tokens: DesignTokens; tag?: string }[] = [
  { name: 'Obsidian', tag: 'Dark', tokens: { primaryColor: 'hsl(var(--studio-ink))', secondaryColor: 'hsl(var(--studio-ink-2))', accentColor: 'hsl(var(--studio-ink-3))', backgroundColor: '#000000', textColor: 'hsl(var(--studio-ink))', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '0px', spacing: 'relaxed' } },
  { name: 'Moonlight', tag: 'Dark', tokens: { primaryColor: '#e2e8f0', secondaryColor: 'hsl(var(--studio-ink-3))', accentColor: 'hsl(var(--studio-accent))', backgroundColor: '#0f172a', textColor: '#e2e8f0', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '8px', spacing: 'normal' } },
  { name: 'Pearl', tag: 'Light', tokens: { primaryColor: 'hsl(var(--studio-sunken))', secondaryColor: 'hsl(var(--studio-ink-3))', accentColor: '#000000', backgroundColor: 'hsl(var(--studio-ink))', textColor: 'hsl(var(--studio-sunken))', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '12px', spacing: 'normal' } },
  { name: 'Coral', tag: 'Bold', tokens: { primaryColor: 'hsl(var(--studio-ink))', secondaryColor: 'hsl(var(--studio-ink-2))', accentColor: 'hsl(var(--studio-ink-3))', backgroundColor: 'hsl(var(--studio-sunken))', textColor: 'hsl(var(--studio-ink))', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '0px', spacing: 'compact' } },
  { name: 'Forest', tag: 'Nature', tokens: { primaryColor: 'hsl(var(--studio-ink))', secondaryColor: 'hsl(var(--studio-ink-2))', accentColor: 'hsl(var(--studio-ok))', backgroundColor: 'hsl(var(--studio-sunken))', textColor: 'hsl(var(--studio-ink))', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '8px', spacing: 'relaxed' } },
  { name: 'Amethyst', tag: 'Creative', tokens: { primaryColor: 'hsl(var(--studio-ink))', secondaryColor: 'hsl(var(--studio-ink-3))', accentColor: 'hsl(var(--studio-ink-3))', backgroundColor: '#09090b', textColor: 'hsl(var(--studio-ink))', headingFont: 'Inter', bodyFont: 'Inter', borderRadius: '12px', spacing: 'normal' } },
  { name: 'Sunset', tag: 'Warm', tokens: { primaryColor: '#1a1a2e', secondaryColor: '#4a4a6a', accentColor: '#e94560', backgroundColor: '#fefefe', textColor: '#1a1a2e', headingFont: 'Playfair Display', bodyFont: 'Inter', borderRadius: '16px', spacing: 'relaxed' } },
  { name: 'Minimal', tag: 'Clean', tokens: { primaryColor: '#000000', secondaryColor: 'hsl(var(--studio-ink-2))', accentColor: 'hsl(var(--studio-hover))', backgroundColor: 'hsl(var(--studio-ink))', textColor: '#000000', headingFont: 'system-ui', bodyFont: 'system-ui', borderRadius: '4px', spacing: 'compact' } },
  { name: 'Glacier', tag: 'Cool', tokens: { primaryColor: '#0f172a', secondaryColor: '#475569', accentColor: 'hsl(var(--studio-accent))', backgroundColor: '#f0f9ff', textColor: '#0f172a', headingFont: 'DM Sans', bodyFont: 'Inter', borderRadius: '8px', spacing: 'normal' } },
  { name: 'Ember', tag: 'Dark', tokens: { primaryColor: 'hsl(var(--studio-ink))', secondaryColor: 'hsl(var(--studio-ink-2))', accentColor: 'hsl(var(--studio-warn))', backgroundColor: '#18181b', textColor: 'hsl(var(--studio-ink))', headingFont: 'Space Grotesk', bodyFont: 'Inter', borderRadius: '6px', spacing: 'normal' } },
  { name: 'Rose Gold', tag: 'Elegant', tokens: { primaryColor: '#1c1917', secondaryColor: '#78716c', accentColor: 'hsl(var(--studio-risk))', backgroundColor: '#fef2f2', textColor: '#1c1917', headingFont: 'Playfair Display', bodyFont: 'DM Sans', borderRadius: '16px', spacing: 'relaxed' } },
  { name: 'Neon', tag: 'Bold', tokens: { primaryColor: '#f0fdf4', secondaryColor: '#86efac', accentColor: 'hsl(var(--studio-ok))', backgroundColor: '#020617', textColor: '#f0fdf4', headingFont: 'Space Grotesk', bodyFont: 'Inter', borderRadius: '0px', spacing: 'compact' } },
  { name: 'Lavender', tag: 'Soft', tokens: { primaryColor: '#1e1b4b', secondaryColor: 'hsl(var(--studio-ink-3))', accentColor: 'hsl(var(--studio-ink-3))', backgroundColor: '#faf5ff', textColor: '#1e1b4b', headingFont: 'Outfit', bodyFont: 'Inter', borderRadius: '12px', spacing: 'normal' } },
  { name: 'Carbon', tag: 'Tech', tokens: { primaryColor: '#d4d4d8', secondaryColor: '#52525b', accentColor: 'hsl(var(--studio-warn))', backgroundColor: '#09090b', textColor: '#d4d4d8', headingFont: 'JetBrains Mono', bodyFont: 'Inter', borderRadius: '4px', spacing: 'compact' } },
  { name: 'Ocean', tag: 'Deep', tokens: { primaryColor: 'hsl(var(--studio-ink))', secondaryColor: '#7dd3fc', accentColor: 'hsl(var(--studio-accent))', backgroundColor: '#082f49', textColor: '#f0f9ff', headingFont: 'Sora', bodyFont: 'Inter', borderRadius: '12px', spacing: 'relaxed' } },
  { name: 'Cream', tag: 'Warm', tokens: { primaryColor: '#292524', secondaryColor: '#78716c', accentColor: '#b45309', backgroundColor: '#fefce8', textColor: '#292524', headingFont: 'Georgia', bodyFont: 'system-ui', borderRadius: '8px', spacing: 'relaxed' } },
];

const FONT_OPTIONS = [
  'Inter', 'Space Grotesk', 'system-ui', 'Georgia', 'Playfair Display',
  'DM Sans', 'Outfit', 'Manrope', 'Sora', 'Plus Jakarta Sans',
  'JetBrains Mono', 'Poppins', 'Lora', 'Merriweather', 'Crimson Text',
  'Work Sans', 'Rubik', 'Nunito', 'Raleway', 'Fira Sans',
];

const RADIUS_OPTIONS = ['0px', '4px', '8px', '12px', '16px', '24px', '9999px'];

const TAG_COLORS: Record<string, string> = {
  Dark: 'hsl(var(--studio-ink-3))', Light: 'hsl(var(--studio-warn))', Bold: 'hsl(var(--studio-risk))', Nature: 'hsl(var(--studio-ok))',
  Creative: 'hsl(var(--studio-ink-3))', Warm: 'hsl(var(--studio-warn))', Clean: 'hsl(var(--studio-ink-3))', Cool: 'hsl(var(--studio-accent))',
  Elegant: 'hsl(var(--studio-ink-3))', Soft: 'hsl(var(--studio-ink-3))', Tech: 'hsl(var(--studio-warn))', Deep: 'hsl(var(--studio-accent))',
};

export function DesignPanel() {
  const { state, dispatch } = useEditor();
  const [tokens, setTokens] = useState<DesignTokens>(PRESETS[0].tokens);
  const [activeSection, setActiveSection] = useState<'presets' | 'colors' | 'typography' | 'spacing'>('presets');
  const [applied, setApplied] = useState(false);
  const [presetFilter, setPresetFilter] = useState<string>('all');

  const updateToken = <K extends keyof DesignTokens>(key: K, value: DesignTokens[K]) => {
    setTokens(prev => ({ ...prev, [key]: value }));
    setApplied(false);
  };

  const applyTokens = useCallback(() => {
    function applyToElement(el: EditorElement): EditorElement {
      const newStyles = { ...el.styles };
      const desktop = { ...newStyles.desktop };
      if (['section', 'footer'].includes(el.type)) { desktop.backgroundColor = tokens.backgroundColor; desktop.color = tokens.textColor; }
      if (['heading'].includes(el.type)) { desktop.color = tokens.primaryColor; desktop.fontFamily = `'${tokens.headingFont}', sans-serif`; }
      if (['text', 'quote'].includes(el.type)) { desktop.color = tokens.secondaryColor; desktop.fontFamily = `'${tokens.bodyFont}', sans-serif`; }
      if (['button'].includes(el.type)) { desktop.backgroundColor = tokens.accentColor; desktop.borderRadius = tokens.borderRadius; desktop.color = 'hsl(var(--studio-ink))'; }
      if (['card'].includes(el.type)) { desktop.borderRadius = tokens.borderRadius; }
      if (['badge'].includes(el.type)) { desktop.backgroundColor = `${tokens.accentColor}15`; desktop.color = tokens.accentColor; }
      newStyles.desktop = desktop;
      return { ...el, styles: newStyles, children: el.children.map(applyToElement) };
    }
    const newElements = state.elements.map(applyToElement);
    dispatch({ type: 'SET_ELEMENTS', payload: newElements });
    setApplied(true);
    toast.success('Design tokens applied to all elements');
  }, [tokens, state.elements, dispatch]);

  const sections = [
    { key: 'presets' as const, label: 'Presets', icon: Eye, color: 'hsl(var(--studio-ink-3))' },
    { key: 'colors' as const, label: 'Colors', icon: Palette, color: 'hsl(var(--studio-accent))' },
    { key: 'typography' as const, label: 'Type', icon: Type, color: 'hsl(var(--studio-warn))' },
    { key: 'spacing' as const, label: 'Layout', icon: Maximize, color: 'hsl(var(--studio-ok))' },
  ];

  const filteredPresets = presetFilter === 'all' ? PRESETS : PRESETS.filter(p => p.tag === presetFilter);
  const uniqueTags = [...new Set(PRESETS.map(p => p.tag).filter(Boolean))] as string[];

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-ink-3) / 0.1), hsl(var(--studio-accent) / 0.1))', border: '1px solid hsl(var(--studio-ink-3) / 0.15)' }}>
            <Sparkles className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-3))' }} />
          </div>
          <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--studio-ink-2))' }}>Design System</span>
        </div>

        {/* Section tabs */}
        <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
          {sections.map(sec => {
            const Icon = sec.icon;
            const active = activeSection === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => setActiveSection(sec.key)}
                className="relative flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[8px] font-semibold uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: active ? `${sec.color}10` : 'transparent',
                  color: active ? sec.color: 'hsl(var(--studio-ink-3))',
                }}
              >
                <Icon className="h-3 w-3" />
                {sec.label}
                {active && (
                  <motion.div layoutId="design-tab" className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ backgroundColor: sec.color }} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Apply button */}
        <button
          onClick={applyTokens}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-semibold transition-all"
          style={{
            background: applied ? 'linear-gradient(135deg, hsl(var(--studio-ok)), #059669)' : 'linear-gradient(135deg, hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)))',
            color: 'hsl(var(--studio-ink))',
            boxShadow: applied ? '0 2px 12px rgba(16,185,129,0.25)' : '0 2px 12px hsl(var(--studio-ink-3) / 0.25)',
          }}
        >
          {applied ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
          {applied ? 'Applied!' : 'Apply to All Elements'}
        </button>

        {/* Presets */}
        {activeSection === 'presets' && (
          <div className="space-y-3">
            {/* Preset filters */}
            <div className="flex flex-wrap gap-0.5">
              <button
                onClick={() => setPresetFilter('all')}
                className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider transition-all"
                style={{ backgroundColor: presetFilter === 'all' ? 'hsl(var(--studio-ink-3) / 0.12)' : 'transparent', color: presetFilter === 'all' ? 'hsl(var(--studio-ink-3))' : 'hsl(var(--studio-ink-3))' }}
              >All</button>
              {uniqueTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setPresetFilter(tag)}
                  className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider transition-all"
                  style={{ backgroundColor: presetFilter === tag ? `${TAG_COLORS[tag] || 'hsl(var(--studio-ink-3))'}15` : 'transparent', color: presetFilter === tag ? (TAG_COLORS[tag] || 'hsl(var(--studio-ink-3))') : 'hsl(var(--studio-ink-3))' }}
                >{tag}</button>
              ))}
            </div>

            <Label>Style Presets</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {filteredPresets.map(preset => {
                const isActive = tokens.primaryColor === preset.tokens.primaryColor && tokens.backgroundColor === preset.tokens.backgroundColor;
                const tagColor = TAG_COLORS[preset.tag || ''] || 'hsl(var(--studio-ink-3))';
                return (
                  <button
                    key={preset.name}
                    onClick={() => { setTokens(preset.tokens); setApplied(false); }}
                    className="rounded-lg p-2.5 text-left transition-all group/preset"
                    style={{
                      backgroundColor: preset.tokens.backgroundColor,
                      border: isActive ? `2px solid ${tagColor}` : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex gap-1">
                        {[preset.tokens.primaryColor, preset.tokens.accentColor, preset.tokens.secondaryColor].map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c, border: '1px solid rgba(128,128,128,0.2)' }} />
                        ))}
                      </div>
                      {preset.tag && (
                        <span className="text-[6px] font-bold uppercase tracking-wider px-1 py-0.5 rounded" style={{ backgroundColor: `${tagColor}15`, color: tagColor }}>{preset.tag}</span>
                      )}
                    </div>
                    {/* Mini preview bar */}
                    <div className="flex gap-px rounded overflow-hidden mb-1.5" style={{ height: '4px' }}>
                      <div style={{ flex: 3, backgroundColor: preset.tokens.backgroundColor }} />
                      <div style={{ flex: 2, backgroundColor: preset.tokens.primaryColor }} />
                      <div style={{ flex: 1, backgroundColor: preset.tokens.accentColor }} />
                      <div style={{ flex: 2, backgroundColor: preset.tokens.secondaryColor }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold" style={{ color: preset.tokens.textColor }}>{preset.name}</span>
                      <span className="text-[6px] font-mono" style={{ color: preset.tokens.secondaryColor, opacity: 0.6 }}>{preset.tokens.headingFont.split(' ')[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live preview */}
            <Label>Preview</Label>
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: tokens.backgroundColor, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${tokens.backgroundColor === '#000000' || tokens.backgroundColor === 'hsl(var(--studio-sunken))' ? 'rgba(255,255,255,0.06)' : 'hsl(var(--studio-ink))'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: tokens.primaryColor, fontFamily: tokens.headingFont }}>Brand</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['About', 'Work'].map(l => <span key={l} style={{ fontSize: '8px', color: tokens.secondaryColor, fontFamily: tokens.bodyFont }}>{l}</span>)}
                </div>
              </div>
              <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: tokens.primaryColor, fontFamily: tokens.headingFont, marginBottom: '6px', letterSpacing: '-0.02em' }}>Heading Text</div>
                <div style={{ fontSize: '8px', color: tokens.secondaryColor, fontFamily: tokens.bodyFont, marginBottom: '12px', lineHeight: '1.5' }}>Body text appears like this.</div>
                <div style={{ display: 'inline-block', padding: '5px 14px', backgroundColor: tokens.accentColor, color: 'hsl(var(--studio-ink))', fontSize: '7px', fontWeight: 700, borderRadius: tokens.borderRadius, letterSpacing: '0.06em' }}>BUTTON</div>
              </div>
            </div>
          </div>
        )}

        {/* Colors */}
        {activeSection === 'colors' && (
          <div className="space-y-2.5">
            <Label>Color Palette</Label>
            {([
              ['Primary', 'primaryColor', 'hsl(var(--studio-ink-3))'],
              ['Secondary', 'secondaryColor', 'hsl(var(--studio-ink-3))'],
              ['Accent', 'accentColor', 'hsl(var(--studio-accent))'],
              ['Background', 'backgroundColor', '#1e293b'],
              ['Text', 'textColor', 'hsl(var(--studio-warn))'],
            ] as [string, keyof DesignTokens, string][]).map(([label, key, dotColor]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                  <span className="text-[10px] font-medium" style={{ color: 'hsl(var(--studio-ink-2))' }}>{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <input type="color" value={tokens[key]} onChange={e => updateToken(key, e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="w-5 h-5 rounded-md border cursor-pointer" style={{ backgroundColor: tokens[key], borderColor: 'hsl(var(--studio-line))' }} />
                  </div>
                  <input
                    type="text" value={tokens[key]} onChange={e => updateToken(key, e.target.value)}
                    className="w-[72px] h-6 px-1.5 rounded text-[9px] font-mono outline-none"
                    style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
                  />
                </div>
              </div>
            ))}

            <Label>Quick Swatches</Label>
            <div className="flex flex-wrap gap-1">
              {['#000000', '#111111', 'hsl(var(--studio-sunken))', '#0f172a', '#09090b', 'hsl(var(--studio-ink))', '#f8fafc', '#fafafa',
                'hsl(var(--studio-accent))', 'hsl(var(--studio-ink-3))', 'hsl(var(--studio-ink-3))', 'hsl(var(--studio-ink-3))', 'hsl(var(--studio-risk))', 'hsl(var(--studio-ink-3))', 'hsl(var(--studio-warn))', 'hsl(var(--studio-ok))',
                'hsl(var(--studio-ink-3))', '#84cc16', 'hsl(var(--studio-ink-3))', 'hsl(var(--studio-ink-3))'].map(color => (
                <button
                  key={color}
                  onClick={() => updateToken('accentColor', color)}
                  className="w-4 h-4 rounded-sm transition-transform hover:scale-125"
                  style={{ backgroundColor: color, border: '1px solid rgba(128,128,128,0.2)' }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Typography */}
        {activeSection === 'typography' && (
          <div className="space-y-2.5">
            <Label>Heading Font</Label>
            <select
              value={tokens.headingFont} onChange={e => updateToken('headingFont', e.target.value)}
              className="w-full h-7 px-2 rounded-lg text-[10px] outline-none"
              style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
            >
              {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <Label>Body Font</Label>
            <select
              value={tokens.bodyFont} onChange={e => updateToken('bodyFont', e.target.value)}
              className="w-full h-7 px-2 rounded-lg text-[10px] outline-none"
              style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
            >
              {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <Label>Preview</Label>
            <div className="rounded-lg p-3" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
              <div style={{ fontFamily: tokens.headingFont, fontSize: '18px', fontWeight: 700, color: 'hsl(var(--studio-ink))', marginBottom: '6px', letterSpacing: '-0.02em' }}>Heading Font</div>
              <div style={{ fontFamily: tokens.bodyFont, fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
                This is how your body text will look. It should be readable and comfortable.
              </div>
            </div>

            {/* Font pairing suggestions */}
            <Label>Popular Pairings</Label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { heading: 'Playfair Display', body: 'Inter', label: 'Classic' },
                { heading: 'Space Grotesk', body: 'Inter', label: 'Modern' },
                { heading: 'Sora', body: 'DM Sans', label: 'Tech' },
                { heading: 'Outfit', body: 'Inter', label: 'Clean' },
              ].map(pair => (
                <button
                  key={pair.label}
                  onClick={() => { updateToken('headingFont', pair.heading); updateToken('bodyFont', pair.body); }}
                  className="p-2 rounded-lg text-left transition-all text-[8px]"
                  style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b30'; e.currentTarget.style.color = 'hsl(var(--studio-warn))'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-raised))'; e.currentTarget.style.color = 'hsl(var(--studio-ink-2))'; }}
                >
                  <div className="font-bold mb-0.5">{pair.label}</div>
                  <div className="text-[7px]" style={{ color: 'hsl(var(--studio-ink-3))' }}>{pair.heading} + {pair.body}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Spacing & Layout */}
        {activeSection === 'spacing' && (
          <div className="space-y-2.5">
            <Label>Border Radius</Label>
            <div className="flex flex-wrap gap-1">
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => updateToken('borderRadius', r)}
                  className="px-2 py-1 rounded text-[9px] font-medium transition-all"
                  style={{
                    backgroundColor: tokens.borderRadius === r ? 'rgba(34,197,94,0.12)' : 'transparent',
                    color: tokens.borderRadius === r ? 'hsl(var(--studio-ok))' : 'hsl(var(--studio-ink-2))',
                    border: `1px solid ${tokens.borderRadius === r ? 'rgba(34,197,94,0.3)' : 'transparent'}`,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-center py-3">
              {['4px', '8px', '16px'].map(r => (
                <div key={r} className="text-center">
                  <div className="w-10 h-10 mx-auto mb-1" style={{
                    borderRadius: r, backgroundColor: 'hsl(var(--studio-raised))',
                    border: r === tokens.borderRadius ? '2px solid hsl(var(--studio-ok))' : '1px solid hsl(var(--studio-line))',
                  }} />
                  <span className="text-[7px] tabular-nums" style={{ color: 'hsl(var(--studio-ink-3))' }}>{r}</span>
                </div>
              ))}
            </div>

            <Label>Content Density</Label>
            <div className="flex gap-1">
              {['compact', 'normal', 'relaxed'].map(sp => (
                <button
                  key={sp}
                  onClick={() => updateToken('spacing', sp)}
                  className="flex-1 py-1.5 rounded-lg text-[9px] font-semibold capitalize transition-all"
                  style={{
                    backgroundColor: tokens.spacing === sp ? 'rgba(34,197,94,0.12)' : 'hsl(var(--studio-panel))',
                    color: tokens.spacing === sp ? 'hsl(var(--studio-ok))' : 'hsl(var(--studio-ink-2))',
                    border: `1px solid ${tokens.spacing === sp ? 'rgba(34,197,94,0.3)' : 'hsl(var(--studio-raised))'}`,
                  }}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[8px] font-bold uppercase tracking-[0.12em] px-0.5" style={{ color: 'hsl(var(--studio-ink-3))' }}>
      {children}
    </div>
  );
}

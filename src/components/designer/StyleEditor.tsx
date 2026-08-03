import React, { CSSProperties, useRef, useState, useEffect } from 'react';
import { useEditor } from './EditorContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Upload, Loader2, Palette, Pipette, Copy, Check, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

type StyleKey = keyof CSSProperties;

/* ── Shared primitives ──────────────────────────────── */

function SectionHeader({ label, open, onClick, badge }: { label: string; open: boolean; onClick: () => void; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between h-8 px-0 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors group"
      style={{ color: 'hsl(var(--studio-ink-2))' }}
    >
      <span className="flex items-center gap-2">
        {label}
        {badge && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.15)', color: 'hsl(var(--studio-accent))' }}>
            {badge}
          </span>
        )}
      </span>
      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} style={{ color: 'hsl(var(--studio-ink-3))' }} />
    </button>
  );
}

function FieldRow({ label, value, onChange, placeholder, type = 'text', suffix }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2 h-7">
      <span className="text-[10px] w-16 shrink-0 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>{label}</span>
      <div className="flex-1 relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          className="w-full h-6 px-2 rounded text-[11px] outline-none transition-all"
          style={{
            backgroundColor: 'hsl(var(--studio-raised))',
            border: '1px solid hsl(var(--studio-line))',
            color: 'hsl(var(--studio-ink-2))',
            paddingRight: suffix ? '28px' : '8px',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; e.currentTarget.style.boxShadow = '0 0 0 2px hsl(var(--studio-accent) / 0.1)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-line))'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px]" style={{ color: 'hsl(var(--studio-ink-3))' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function SelectRow({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[];
}) {
  return (
    <div className="flex items-center gap-2 h-7">
      <span className="text-[10px] w-16 shrink-0 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-6 px-1.5 rounded text-[11px] outline-none appearance-none cursor-pointer transition-all"
        style={{
          backgroundColor: 'hsl(var(--studio-raised))',
          border: '1px solid hsl(var(--studio-line))',
          color: 'hsl(var(--studio-ink-2))',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; e.currentTarget.style.boxShadow = '0 0 0 2px hsl(var(--studio-accent) / 0.1)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-line))'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <option value="">—</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ── Visual color picker ────────────────────────────── */

function ColorPickerRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  // Track recent colors in localStorage
  const addRecentColor = (color: string) => {
    if (!color || color.length < 4) return;
    try {
      const stored = JSON.parse(localStorage.getItem('designer-recent-colors') || '[]') as string[];
      const updated = [color, ...stored.filter(c => c !== color)].slice(0, 8);
      localStorage.setItem('designer-recent-colors', JSON.stringify(updated));
    } catch {}
  };

  const recentColors = (() => {
    try { return JSON.parse(localStorage.getItem('designer-recent-colors') || '[]') as string[]; }
    catch { return []; }
  })();

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 h-7">
        <span className="text-[10px] w-16 shrink-0 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>{label}</span>
        <div className="flex-1 flex items-center gap-1.5">
          <div className="relative">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => { onChange(e.target.value); addRecentColor(e.target.value); }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="w-6 h-6 rounded-md border cursor-pointer"
              style={{
                backgroundColor: value || 'transparent',
                borderColor: 'hsl(var(--studio-line-strong))',
                backgroundImage: !value ? 'linear-gradient(45deg, hsl(var(--studio-line)) 25%, transparent 25%, transparent 75%, hsl(var(--studio-line)) 75%), linear-gradient(45deg, hsl(var(--studio-line)) 25%, transparent 25%, transparent 75%, hsl(var(--studio-line)) 75%)' : undefined,
                backgroundSize: !value ? '8px 8px' : undefined,
                backgroundPosition: !value ? '0 0, 4px 4px' : undefined,
              }}
            />
          </div>
          <input
            value={value}
            onChange={(e) => { onChange(e.target.value); if (e.target.value.match(/^#[0-9a-fA-F]{6}$/)) addRecentColor(e.target.value); }}
            placeholder="#000000"
            className="flex-1 h-6 px-2 rounded text-[11px] outline-none transition-all font-mono"
            style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-line))'; }}
          />
          <button onClick={handleCopy} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[hsl(var(--studio-hover))] transition-colors">
            {copied ? <Check className="h-3 w-3" style={{ color: 'hsl(var(--studio-ok))' }} /> : <Copy className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-3))' }} />}
          </button>
        </div>
      </div>
      {/* Recent colors row */}
      {recentColors.length > 0 && (
        <div className="flex items-center gap-1 pl-[72px]">
          <Pipette className="h-2 w-2 shrink-0" style={{ color: 'hsl(var(--studio-hover))' }} />
          {recentColors.slice(0, 8).map((c, i) => (
            <button
              key={`${c}-${i}`}
              onClick={() => { onChange(c); }}
              className="w-3.5 h-3.5 rounded-sm border transition-transform hover:scale-125"
              style={{
                backgroundColor: c,
                borderColor: c === value ? 'hsl(var(--studio-ink))' : 'hsl(var(--studio-line))',
                boxShadow: c === value ? `0 0 0 1px ${c}` : 'none',
              }}
              title={c}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Preset buttons row ─────────────────────────────── */

function PresetRow({ label, presets, onSelect, currentValue }: { label: string; presets: { label: string; value: string }[]; onSelect: (v: string) => void; currentValue?: string }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--studio-ink-3))' }}>{label}</span>
      <div className="flex flex-wrap gap-1">
        {presets.map(p => (
          <button
            key={p.value}
            onClick={() => onSelect(p.value)}
            className="h-6 px-2 rounded text-[10px] font-medium transition-all"
            style={{
              backgroundColor: currentValue === p.value ? 'hsl(var(--studio-accent) / 0.2)' : 'hsl(var(--studio-raised))',
              border: `1px solid ${currentValue === p.value ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line))'}`,
              color: currentValue === p.value ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-2))',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Gradient builder ───────────────────────────────── */

const GRADIENT_PRESETS = [
  { label: 'Sunset', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: 'Ocean', value: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)' },
  { label: 'Emerald', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { label: 'Fire', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: 'Night', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' },
  { label: 'Gold', value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
  { label: 'Rose', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { label: 'Arctic', value: 'linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)' },
  { label: 'Aurora', value: 'linear-gradient(135deg, #0a0015 0%, #1a0030 25%, #0d1b2a 50%, #0a192f 100%)' },
  { label: 'Neon', value: 'linear-gradient(135deg, hsl(var(--studio-ink-3)) 0%, hsl(var(--studio-ink-3)) 50%, hsl(var(--studio-ink-3)) 100%)' },
  { label: 'Cosmic', value: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f172a 100%)' },
  { label: 'Mint', value: 'linear-gradient(135deg, hsl(var(--studio-accent)) 0%, hsl(var(--studio-ok)) 100%)' },
  { label: 'Berry', value: 'linear-gradient(135deg, hsl(var(--studio-ink-3)) 0%, #db2777 100%)' },
  { label: 'Slate', value: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' },
  { label: 'Peach', value: 'linear-gradient(135deg, #fb923c 0%, hsl(var(--studio-ink-3)) 100%)' },
  { label: 'Ice', value: 'linear-gradient(135deg, #e0f2fe 0%, #c7d2fe 100%)' },
  // V3 Gradients
  { label: 'Indigo', value: 'linear-gradient(135deg, #4f46e5 0%, hsl(var(--studio-ink-3)) 50%, hsl(var(--studio-ink-3)) 100%)' },
  { label: 'Tropical', value: 'linear-gradient(135deg, hsl(var(--studio-warn)) 0%, hsl(var(--studio-ink-3)) 50%, hsl(var(--studio-ink-3)) 100%)' },
  { label: 'Northern', value: 'linear-gradient(165deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)' },
  { label: 'Lava', value: 'linear-gradient(135deg, hsl(var(--studio-risk)) 0%, hsl(var(--studio-warn)) 50%, hsl(var(--studio-warn)) 100%)' },
  { label: 'Sapphire', value: 'linear-gradient(135deg, #1e3a8a 0%, hsl(var(--studio-accent)) 100%)' },
  { label: 'Forest', value: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, hsl(var(--studio-ok)) 100%)' },
  { label: 'Candy', value: 'linear-gradient(135deg, hsl(var(--studio-ink-3)) 0%, hsl(var(--studio-ink-3)) 50%, hsl(var(--studio-accent)) 100%)' },
  { label: 'Carbon', value: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)' },
  { label: 'Hologram', value: 'linear-gradient(135deg, hsl(var(--studio-ink-3)) 0%, hsl(var(--studio-ink-3)) 33%, hsl(var(--studio-ink-3)) 66%, hsl(var(--studio-warn)) 100%)' },
  { label: 'Midnight', value: 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)' },
  { label: 'Warm', value: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, hsl(var(--studio-warn)) 100%)' },
  { label: 'Cool', value: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 50%, #6ee7b7 100%)' },
];

function GradientPresets({ onSelect }: { onSelect: (v: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {GRADIENT_PRESETS.map(g => (
        <button
          key={g.label}
          onClick={() => onSelect(g.value)}
          className="group relative h-8 rounded-md overflow-hidden transition-all hover:scale-105 active:scale-95"
          style={{ background: g.value, border: '1px solid rgba(255,255,255,0.06)' }}
          title={g.label}
        >
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {g.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Shadow presets ──────────────────────────────────── */

const SHADOW_PRESETS = [
  { label: 'None', value: 'none' },
  { label: 'Subtle', value: '0 1px 3px rgba(0,0,0,0.08)' },
  { label: 'Small', value: '0 2px 8px rgba(0,0,0,0.1)' },
  { label: 'Medium', value: '0 4px 16px rgba(0,0,0,0.12)' },
  { label: 'Large', value: '0 8px 32px rgba(0,0,0,0.15)' },
  { label: 'XL', value: '0 16px 48px rgba(0,0,0,0.2)' },
  { label: 'XXL', value: '0 24px 64px rgba(0,0,0,0.25)' },
  { label: 'Glow', value: '0 0 24px hsl(var(--studio-accent) / 0.3)' },
  { label: 'Indigo', value: '0 0 32px rgba(99,102,241,0.3)' },
  { label: 'Pink', value: '0 0 32px rgba(236,72,153,0.3)' },
  { label: 'Green', value: '0 0 32px rgba(16,185,129,0.3)' },
  { label: 'Sharp', value: '4px 4px 0 #000' },
  { label: 'Brutal', value: '8px 8px 0 #000' },
  { label: 'Inset', value: 'inset 0 2px 8px rgba(0,0,0,0.15)' },
  { label: 'Layered', value: '0 1px 2px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.1), 0 16px 48px rgba(0,0,0,0.12)' },
  { label: 'Dreamy', value: '0 8px 40px rgba(99,102,241,0.15), 0 0 80px rgba(139,92,246,0.08)' },
];

/* ── Typography presets ─────────────────────────────── */

const FONT_PRESETS = [
  { label: 'System', value: "system-ui, -apple-system, sans-serif" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Sora', value: "'Sora', sans-serif" },
  { label: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
  { label: 'DM Sans', value: "'DM Sans', sans-serif" },
  { label: 'Outfit', value: "'Outfit', sans-serif" },
  { label: 'Plus Jakarta', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Playfair', value: "'Playfair Display', serif" },
  { label: 'Lora', value: "'Lora', serif" },
  { label: 'Mono', value: "'JetBrains Mono', 'Fira Code', monospace" },
  { label: 'Geist', value: "'Geist', sans-serif" },
];

/* ── Image upload section ───────────────────────────── */

function ImageSection({ src, alt, onSrcChange, onAltChange }: {
  src: string; alt: string; onSrcChange: (v: string) => void; onAltChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('designer-uploads').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('designer-uploads').getPublicUrl(path);
      onSrcChange(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5 pb-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full h-8 flex items-center justify-center gap-2 rounded-lg text-[11px] font-medium transition-all"
        style={{
          backgroundColor: uploading ? 'hsl(var(--studio-panel))' : 'hsl(var(--studio-accent))',
          color: 'hsl(var(--studio-ink))',
          border: 'none',
          cursor: uploading ? 'wait' : 'pointer',
          opacity: uploading ? 0.7 : 1,
        }}
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? 'Uploading…' : 'Upload from PC'}
      </button>
      {src && (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--studio-line))' }}>
          <img src={src} alt={alt} style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '120px', objectFit: 'cover' }} />
        </div>
      )}
      <FieldRow label="URL" value={src} onChange={onSrcChange} placeholder="https://…" />
      <FieldRow label="Alt" value={alt} onChange={onAltChange} placeholder="Description" />
    </div>
  );
}

/* ── Slider row ─────────────────────────────────────── */

function SliderRow({ label, value, onChange, min = 0, max = 100, unit = '' }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2 h-7">
      <span className="text-[10px] w-16 shrink-0 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, hsl(var(--studio-accent)) 0%, hsl(var(--studio-accent)) ${((value - min) / (max - min)) * 100}%, hsl(var(--studio-line)) ${((value - min) / (max - min)) * 100}%, hsl(var(--studio-line)) 100%)`,
        }}
      />
      <span className="text-[10px] w-10 text-right tabular-nums" style={{ color: 'hsl(var(--studio-ink-2))' }}>{value}{unit}</span>
    </div>
  );
}

/* ── Page Link Selector (for linking any element to a page) ─── */

function PageLinkDropdown({ value, onChange, siteId }: { value: string; onChange: (v: string) => void; siteId?: string }) {
  const [pages, setPages] = useState<{ id: string; page_name: string; slug: string }[]>([]);
  useEffect(() => {
    if (!siteId) return;
    supabase.from('designer_pages').select('id, page_name, slug').eq('site_id', siteId).order('sort_order').then(({ data }) => {
      if (data) setPages(data);
    });
  }, [siteId]);

  if (!siteId || pages.length === 0) return null;

  const linkedPage = pages.find(p => value === `#${p.slug}`);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 h-7">
        <span className="text-[10px] w-16 shrink-0 text-right flex items-center justify-end gap-1" style={{ color: 'hsl(var(--studio-accent))' }}>
          <Link className="h-3 w-3" />
          Page
        </span>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 h-6 px-1.5 rounded text-[11px] outline-none appearance-none cursor-pointer transition-all"
          style={{ backgroundColor: 'hsl(var(--studio-raised))', border: `1px solid ${linkedPage ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line))'}`, color: 'hsl(var(--studio-ink-2))' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; }}
          onBlur={e => { e.currentTarget.style.borderColor = linkedPage ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line))'; }}
        >
          <option value="">— No page link —</option>
          {pages.map(p => (
            <option key={p.id} value={`#${p.slug}`}>📄 {p.page_name}</option>
          ))}
        </select>
      </div>
      {linkedPage && (
        <div className="flex items-center gap-1.5 ml-[72px] px-2 py-1 rounded" style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.08)', border: '1px solid hsl(var(--studio-accent) / 0.15)' }}>
          <span className="text-[9px] font-semibold" style={{ color: 'hsl(var(--studio-accent))' }}>✓ Linked to "{linkedPage.page_name}"</span>
          <button onClick={() => onChange('')} className="text-[9px] ml-auto hover:text-red-400 transition-colors" style={{ color: 'hsl(var(--studio-ink-3))' }}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ── Main StyleEditor ───────────────────────────────── */

export function StyleEditor({ siteId }: { siteId?: string }) {
  const { state, dispatch, selectedElement } = useEditor();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    content: true, position: true, layout: false, spacing: false, typography: false, background: false, border: false, effects: false, filters: false, transform: false, transition: false,
  });

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  // The panel above already says nothing is selected, and says it better -
  // with the shortcut to do something about it. A second empty state under
  // the first, complete with a pulsing icon, was the panel explaining the
  // same nothing twice.
  if (!selectedElement) return null;

  const bp = state.breakpoint;
  const currentStyles = { ...(selectedElement.styles.desktop ?? {}), ...(bp !== 'desktop' ? selectedElement.styles[bp] ?? {} : {}) };

  const updateStyle = (key: StyleKey, value: string) => {
    const newStyles = { ...selectedElement.styles };
    if (bp === 'desktop') {
      newStyles.desktop = { ...newStyles.desktop, [key]: value || undefined };
    } else {
      newStyles[bp] = { ...(newStyles[bp] ?? {}), [key]: value || undefined };
    }
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { styles: newStyles } } });
  };

  const updateProp = (key: string, value: unknown) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { props: { ...selectedElement.props, [key]: value } } } });
  };

  const s = (key: StyleKey) => (currentStyles[key] as string) ?? '';

  const sectionDivider = <div className="h-[1px] my-1" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-0.5">
        {/* Element selector badge */}
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))' }}>
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-accent)), hsl(var(--studio-accent)))', color: 'hsl(var(--studio-ink))' }}>
            {selectedElement.type.charAt(0).toUpperCase()}
          </div>
          <input
            value={selectedElement.name || ''}
            onChange={(e) => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { name: e.target.value } } })}
            placeholder={selectedElement.type}
            className="flex-1 bg-transparent text-[11px] font-medium outline-none"
            style={{ color: 'hsl(var(--studio-ink-2))' }}
          />
          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'hsl(var(--studio-hover))', color: 'hsl(var(--studio-ink-2))' }}>
            {bp === 'desktop' ? '🖥' : bp === 'tablet' ? '📱' : '📲'} {bp}
          </span>
        </div>

        {/* Content */}
        {['heading', 'text', 'button', 'badge', 'link', 'quote', 'code'].includes(selectedElement.type) && (
          <>
            <SectionHeader label="Content" open={openSections.content} onClick={() => toggle('content')} />
            <AnimatePresence>
              {openSections.content && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="space-y-1.5 pb-2">
                    <FieldRow label="Text" value={(selectedElement.props.text as string) || ''} onChange={(v) => updateProp('text', v)} />
                    {selectedElement.type === 'heading' && (
                      <SelectRow label="Level" value={(selectedElement.props.level as string) || 'h2'} onChange={(v) => updateProp('level', v)} options={[
                        { label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' },
                        { label: 'H4', value: 'h4' }, { label: 'H5', value: 'h5' }, { label: 'H6', value: 'h6' },
                      ]} />
                    )}
                    {(selectedElement.type === 'button' || selectedElement.type === 'link') && (
                      <>
                        <PageLinkDropdown
                          value={(selectedElement.props.href as string)?.startsWith('#') ? (selectedElement.props.href as string) : ''}
                          onChange={(v) => updateProp('href', v)}
                          siteId={siteId}
                        />
                        <FieldRow label="URL" value={(selectedElement.props.href as string) || ''} onChange={(v) => updateProp('href', v)} placeholder="https:// or select a page above" />
                      </>
                    )}
                    {selectedElement.type === 'code' && (
                      <FieldRow label="Code" value={(selectedElement.props.code as string) || ''} onChange={(v) => updateProp('code', v)} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {sectionDivider}
          </>
        )}

        {selectedElement.type === 'image' && (
          <>
            <SectionHeader label="Image" open={openSections.content} onClick={() => toggle('content')} />
            {openSections.content && (
              <ImageSection
                src={(selectedElement.props.src as string) || ''}
                alt={(selectedElement.props.alt as string) || ''}
                onSrcChange={(v) => updateProp('src', v)}
                onAltChange={(v) => updateProp('alt', v)}
              />
            )}
            {sectionDivider}
          </>
        )}

        {/* Layout */}
        <SectionHeader label="Layout" open={openSections.layout} onClick={() => toggle('layout')} />
        {openSections.layout && (
          <div className="space-y-1.5 pb-2">
            <SelectRow label="Display" value={s('display')} onChange={(v) => updateStyle('display', v)} options={[
              { label: 'Block', value: 'block' }, { label: 'Flex', value: 'flex' }, { label: 'Grid', value: 'grid' },
              { label: 'Inline', value: 'inline' }, { label: 'I-Block', value: 'inline-block' }, { label: 'I-Flex', value: 'inline-flex' }, { label: 'None', value: 'none' },
            ]} />
            {s('display') === 'flex' && (
              <>
                <SelectRow label="Direction" value={s('flexDirection')} onChange={(v) => updateStyle('flexDirection', v)} options={[
                  { label: 'Row', value: 'row' }, { label: 'Column', value: 'column' },
                  { label: 'Row Rev', value: 'row-reverse' }, { label: 'Col Rev', value: 'column-reverse' },
                ]} />
                <SelectRow label="Wrap" value={s('flexWrap')} onChange={(v) => updateStyle('flexWrap', v)} options={[
                  { label: 'No Wrap', value: 'nowrap' }, { label: 'Wrap', value: 'wrap' },
                ]} />
                <SelectRow label="Align" value={s('alignItems')} onChange={(v) => updateStyle('alignItems', v)} options={[
                  { label: 'Start', value: 'flex-start' }, { label: 'Center', value: 'center' },
                  { label: 'End', value: 'flex-end' }, { label: 'Stretch', value: 'stretch' }, { label: 'Baseline', value: 'baseline' },
                ]} />
                <SelectRow label="Justify" value={s('justifyContent')} onChange={(v) => updateStyle('justifyContent', v)} options={[
                  { label: 'Start', value: 'flex-start' }, { label: 'Center', value: 'center' },
                  { label: 'End', value: 'flex-end' }, { label: 'Between', value: 'space-between' }, { label: 'Around', value: 'space-around' }, { label: 'Evenly', value: 'space-evenly' },
                ]} />
                <FieldRow label="Gap" value={s('gap')} onChange={(v) => updateStyle('gap', v)} placeholder="16px" />
              </>
            )}
            {s('display') === 'grid' && (
              <>
                <FieldRow label="Columns" value={s('gridTemplateColumns')} onChange={(v) => updateStyle('gridTemplateColumns', v)} placeholder="repeat(3, 1fr)" />
                <FieldRow label="Rows" value={s('gridTemplateRows')} onChange={(v) => updateStyle('gridTemplateRows', v)} placeholder="auto" />
                <FieldRow label="Gap" value={s('gap')} onChange={(v) => updateStyle('gap', v)} placeholder="16px" />
                <PresetRow label="Grid Presets" presets={[
                  { label: '2 Col', value: 'repeat(2, 1fr)' }, { label: '3 Col', value: 'repeat(3, 1fr)' },
                  { label: '4 Col', value: 'repeat(4, 1fr)' }, { label: 'Auto Fill', value: 'repeat(auto-fill, minmax(250px, 1fr))' },
                  { label: 'Auto Fit', value: 'repeat(auto-fit, minmax(200px, 1fr))' }, { label: 'Sidebar', value: '280px 1fr' },
                ]} onSelect={(v) => updateStyle('gridTemplateColumns', v)} currentValue={s('gridTemplateColumns')} />
                <FieldRow label="Col Span" value={s('gridColumn')} onChange={(v) => updateStyle('gridColumn', v)} placeholder="span 2" />
                <FieldRow label="Row Span" value={s('gridRow')} onChange={(v) => updateStyle('gridRow', v)} placeholder="span 1" />
              </>
            )}
            {(s('display') === 'flex' || s('display') === 'inline-flex') && null}
            {/* Flex child controls — always shown */}
            <FieldRow label="Flex" value={s('flex')} onChange={(v) => updateStyle('flex', v)} placeholder="1" />
            <FieldRow label="Flex Grow" value={s('flexGrow')} onChange={(v) => updateStyle('flexGrow', v)} placeholder="0" />
            <FieldRow label="Flex Shrink" value={s('flexShrink')} onChange={(v) => updateStyle('flexShrink', v)} placeholder="1" />
            <FieldRow label="Flex Basis" value={s('flexBasis')} onChange={(v) => updateStyle('flexBasis', v)} placeholder="auto" />
            <SelectRow label="Align Self" value={s('alignSelf')} onChange={(v) => updateStyle('alignSelf', v)} options={[
              { label: 'Auto', value: 'auto' }, { label: 'Start', value: 'flex-start' }, { label: 'Center', value: 'center' },
              { label: 'End', value: 'flex-end' }, { label: 'Stretch', value: 'stretch' }, { label: 'Baseline', value: 'baseline' },
            ]} />
            <FieldRow label="Width" value={s('width')} onChange={(v) => updateStyle('width', v)} placeholder="100%" />
            <FieldRow label="Max W" value={s('maxWidth')} onChange={(v) => updateStyle('maxWidth', v)} placeholder="1200px" />
            <FieldRow label="Min W" value={s('minWidth')} onChange={(v) => updateStyle('minWidth', v)} placeholder="auto" />
            <FieldRow label="Height" value={s('height')} onChange={(v) => updateStyle('height', v)} placeholder="auto" />
            <FieldRow label="Min H" value={s('minHeight')} onChange={(v) => updateStyle('minHeight', v)} placeholder="auto" />
            <FieldRow label="Max H" value={s('maxHeight')} onChange={(v) => updateStyle('maxHeight', v)} placeholder="none" />
            <FieldRow label="Aspect" value={s('aspectRatio')} onChange={(v) => updateStyle('aspectRatio', v)} placeholder="16/9" />
            <PresetRow label="Aspect Ratio" presets={[
              { label: '1:1', value: '1' }, { label: '4:3', value: '4/3' }, { label: '16:9', value: '16/9' },
              { label: '21:9', value: '21/9' }, { label: '9:16', value: '9/16' }, { label: '3:2', value: '3/2' },
            ]} onSelect={(v) => updateStyle('aspectRatio', v)} currentValue={s('aspectRatio')} />
            <SelectRow label="Overflow" value={s('overflow')} onChange={(v) => updateStyle('overflow', v)} options={[
              { label: 'Visible', value: 'visible' }, { label: 'Hidden', value: 'hidden' },
              { label: 'Scroll', value: 'scroll' }, { label: 'Auto', value: 'auto' },
            ]} />
            <SelectRow label="Pointer" value={s('pointerEvents')} onChange={(v) => updateStyle('pointerEvents', v)} options={[
              { label: 'Auto', value: 'auto' }, { label: 'None', value: 'none' },
            ]} />
            <SelectRow label="User Select" value={s('userSelect')} onChange={(v) => updateStyle('userSelect', v)} options={[
              { label: 'Auto', value: 'auto' }, { label: 'None', value: 'none' }, { label: 'All', value: 'all' }, { label: 'Text', value: 'text' },
            ]} />
          </div>
        )}
        {sectionDivider}

        {/* Spacing */}
        <SectionHeader label="Spacing" open={openSections.spacing} onClick={() => toggle('spacing')} />
        {openSections.spacing && (
          <div className="space-y-1.5 pb-2">
            <FieldRow label="Padding" value={s('padding')} onChange={(v) => updateStyle('padding', v)} placeholder="16px" />
            <FieldRow label="P-Top" value={s('paddingTop')} onChange={(v) => updateStyle('paddingTop', v)} />
            <FieldRow label="P-Right" value={s('paddingRight')} onChange={(v) => updateStyle('paddingRight', v)} />
            <FieldRow label="P-Bottom" value={s('paddingBottom')} onChange={(v) => updateStyle('paddingBottom', v)} />
            <FieldRow label="P-Left" value={s('paddingLeft')} onChange={(v) => updateStyle('paddingLeft', v)} />
            <div className="h-1" />
            <FieldRow label="Margin" value={s('margin')} onChange={(v) => updateStyle('margin', v)} placeholder="0" />
            <FieldRow label="M-Top" value={s('marginTop')} onChange={(v) => updateStyle('marginTop', v)} />
            <FieldRow label="M-Right" value={s('marginRight')} onChange={(v) => updateStyle('marginRight', v)} />
            <FieldRow label="M-Bottom" value={s('marginBottom')} onChange={(v) => updateStyle('marginBottom', v)} />
            <FieldRow label="M-Left" value={s('marginLeft')} onChange={(v) => updateStyle('marginLeft', v)} />
          </div>
        )}
        {sectionDivider}

        {/* Typography */}
        <SectionHeader label="Typography" open={openSections.typography} onClick={() => toggle('typography')} />
        {openSections.typography && (
          <div className="space-y-1.5 pb-2">
            <PresetRow label="Font Family" presets={FONT_PRESETS.map(f => ({ label: f.label, value: f.value }))} onSelect={(v) => updateStyle('fontFamily', v)} currentValue={s('fontFamily')} />
            <FieldRow label="Family" value={s('fontFamily')} onChange={(v) => updateStyle('fontFamily', v)} placeholder="system-ui" />
            <FieldRow label="Size" value={s('fontSize')} onChange={(v) => updateStyle('fontSize', v)} placeholder="16px" />
            <SelectRow label="Weight" value={s('fontWeight')} onChange={(v) => updateStyle('fontWeight', v)} options={[
              { label: '100 Thin', value: '100' }, { label: '200 Extra Light', value: '200' },
              { label: '300 Light', value: '300' }, { label: '400 Regular', value: '400' }, { label: '500 Medium', value: '500' },
              { label: '600 Semi Bold', value: '600' }, { label: '700 Bold', value: '700' }, { label: '800 Extra Bold', value: '800' }, { label: '900 Black', value: '900' },
            ]} />
            <FieldRow label="Height" value={s('lineHeight')} onChange={(v) => updateStyle('lineHeight', v)} placeholder="1.5" />
            <FieldRow label="Spacing" value={s('letterSpacing')} onChange={(v) => updateStyle('letterSpacing', v)} placeholder="0" />
            <ColorPickerRow label="Color" value={s('color')} onChange={(v) => updateStyle('color', v)} />
            <SelectRow label="Align" value={s('textAlign')} onChange={(v) => updateStyle('textAlign', v)} options={[
              { label: 'Left', value: 'left' }, { label: 'Center', value: 'center' },
              { label: 'Right', value: 'right' }, { label: 'Justify', value: 'justify' },
            ]} />
            <SelectRow label="Transform" value={s('textTransform')} onChange={(v) => updateStyle('textTransform', v)} options={[
              { label: 'None', value: 'none' }, { label: 'Uppercase', value: 'uppercase' },
              { label: 'Lowercase', value: 'lowercase' }, { label: 'Capitalize', value: 'capitalize' },
            ]} />
            <SelectRow label="Decoration" value={s('textDecoration')} onChange={(v) => updateStyle('textDecoration', v)} options={[
              { label: 'None', value: 'none' }, { label: 'Underline', value: 'underline' },
              { label: 'Line-through', value: 'line-through' },
            ]} />
            <SelectRow label="Whitespace" value={s('whiteSpace')} onChange={(v) => updateStyle('whiteSpace', v)} options={[
              { label: 'Normal', value: 'normal' }, { label: 'Nowrap', value: 'nowrap' },
              { label: 'Pre', value: 'pre' }, { label: 'Pre-wrap', value: 'pre-wrap' },
            ]} />
          </div>
        )}
        {sectionDivider}

        {/* Background */}
        <SectionHeader label="Background" open={openSections.background} onClick={() => toggle('background')} />
        {openSections.background && (
          <div className="space-y-2 pb-2">
            <ColorPickerRow label="Color" value={s('backgroundColor')} onChange={(v) => updateStyle('backgroundColor', v)} />
            <div className="space-y-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--studio-ink-3))' }}>Gradient Presets</span>
              <GradientPresets onSelect={(v) => updateStyle('background', v)} />
            </div>
            <FieldRow label="Gradient" value={s('background')} onChange={(v) => updateStyle('background', v)} placeholder="linear-gradient(…)" />
            <FieldRow label="Image" value={s('backgroundImage')} onChange={(v) => updateStyle('backgroundImage', v)} placeholder="url(…)" />
            <SelectRow label="Size" value={s('backgroundSize')} onChange={(v) => updateStyle('backgroundSize', v)} options={[
              { label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' }, { label: 'Auto', value: 'auto' },
            ]} />
            <SelectRow label="Position" value={s('backgroundPosition')} onChange={(v) => updateStyle('backgroundPosition', v)} options={[
              { label: 'Center', value: 'center' }, { label: 'Top', value: 'top' },
              { label: 'Bottom', value: 'bottom' }, { label: 'Left', value: 'left' }, { label: 'Right', value: 'right' },
            ]} />
            <SelectRow label="Repeat" value={s('backgroundRepeat')} onChange={(v) => updateStyle('backgroundRepeat', v)} options={[
              { label: 'No Repeat', value: 'no-repeat' }, { label: 'Repeat', value: 'repeat' },
              { label: 'Repeat X', value: 'repeat-x' }, { label: 'Repeat Y', value: 'repeat-y' },
            ]} />
          </div>
        )}
        {sectionDivider}

        {/* Border */}
        <SectionHeader label="Border" open={openSections.border} onClick={() => toggle('border')} />
        {openSections.border && (
          <div className="space-y-1.5 pb-2">
            <FieldRow label="Border" value={s('border')} onChange={(v) => updateStyle('border', v)} placeholder="1px solid #e2e8f0" />
            <ColorPickerRow label="Color" value={s('borderColor')} onChange={(v) => updateStyle('borderColor', v)} />
            <SelectRow label="Style" value={s('borderStyle')} onChange={(v) => updateStyle('borderStyle', v)} options={[
              { label: 'Solid', value: 'solid' }, { label: 'Dashed', value: 'dashed' },
              { label: 'Dotted', value: 'dotted' }, { label: 'Double', value: 'double' }, { label: 'None', value: 'none' },
            ]} />
            <FieldRow label="Width" value={s('borderWidth')} onChange={(v) => updateStyle('borderWidth', v)} placeholder="1px" />
            <FieldRow label="Radius" value={s('borderRadius')} onChange={(v) => updateStyle('borderRadius', v)} placeholder="8px" />
            <PresetRow label="Radius Presets" presets={[
              { label: '0', value: '0' }, { label: '4px', value: '4px' }, { label: '8px', value: '8px' },
              { label: '12px', value: '12px' }, { label: '16px', value: '16px' }, { label: '24px', value: '24px' }, { label: '999px', value: '999px' },
            ]} onSelect={(v) => updateStyle('borderRadius', v)} currentValue={s('borderRadius')} />
            <FieldRow label="TL Radius" value={s('borderTopLeftRadius')} onChange={(v) => updateStyle('borderTopLeftRadius', v)} placeholder="0" />
            <FieldRow label="TR Radius" value={s('borderTopRightRadius')} onChange={(v) => updateStyle('borderTopRightRadius', v)} placeholder="0" />
            <FieldRow label="BL Radius" value={s('borderBottomLeftRadius')} onChange={(v) => updateStyle('borderBottomLeftRadius', v)} placeholder="0" />
            <FieldRow label="BR Radius" value={s('borderBottomRightRadius')} onChange={(v) => updateStyle('borderBottomRightRadius', v)} placeholder="0" />
          </div>
        )}
        {sectionDivider}

        {/* Effects */}
        <SectionHeader label="Effects" open={openSections.effects} onClick={() => toggle('effects')} badge="PRO" />
        {openSections.effects && (
          <div className="space-y-2 pb-2">
            <PresetRow label="Shadow Presets" presets={SHADOW_PRESETS} onSelect={(v) => updateStyle('boxShadow', v)} currentValue={s('boxShadow')} />
            <FieldRow label="Shadow" value={s('boxShadow')} onChange={(v) => updateStyle('boxShadow', v)} placeholder="0 2px 8px rgba(…)" />
            <SliderRow label="Opacity" value={Math.round(parseFloat(s('opacity') || '1') * 100)} onChange={(v) => updateStyle('opacity', String(v / 100))} min={0} max={100} unit="%" />
            <SelectRow label="Cursor" value={s('cursor')} onChange={(v) => updateStyle('cursor', v)} options={[
              { label: 'Default', value: 'default' }, { label: 'Pointer', value: 'pointer' },
              { label: 'Text', value: 'text' }, { label: 'Move', value: 'move' }, { label: 'Grab', value: 'grab' },
              { label: 'Crosshair', value: 'crosshair' }, { label: 'Col Resize', value: 'col-resize' },
              { label: 'Row Resize', value: 'row-resize' }, { label: 'Zoom In', value: 'zoom-in' },
              { label: 'Not Allowed', value: 'not-allowed' }, { label: 'None', value: 'none' },
            ]} />
            <SelectRow label="Mix Blend" value={s('mixBlendMode')} onChange={(v) => updateStyle('mixBlendMode', v)} options={[
              { label: 'Normal', value: 'normal' }, { label: 'Multiply', value: 'multiply' },
              { label: 'Screen', value: 'screen' }, { label: 'Overlay', value: 'overlay' }, { label: 'Darken', value: 'darken' }, { label: 'Lighten', value: 'lighten' },
              { label: 'Color Dodge', value: 'color-dodge' }, { label: 'Color Burn', value: 'color-burn' },
              { label: 'Hard Light', value: 'hard-light' }, { label: 'Soft Light', value: 'soft-light' },
              { label: 'Difference', value: 'difference' }, { label: 'Exclusion', value: 'exclusion' },
              { label: 'Hue', value: 'hue' }, { label: 'Saturation', value: 'saturation' },
              { label: 'Color', value: 'color' }, { label: 'Luminosity', value: 'luminosity' },
            ]} />
            <SelectRow label="Object Fit" value={s('objectFit')} onChange={(v) => updateStyle('objectFit', v)} options={[
              { label: 'Cover', value: 'cover' }, { label: 'Contain', value: 'contain' },
              { label: 'Fill', value: 'fill' }, { label: 'None', value: 'none' }, { label: 'Scale Down', value: 'scale-down' },
            ]} />
            <SelectRow label="Obj Pos" value={s('objectPosition')} onChange={(v) => updateStyle('objectPosition', v)} options={[
              { label: 'Center', value: 'center' }, { label: 'Top', value: 'top' }, { label: 'Bottom', value: 'bottom' },
              { label: 'Left', value: 'left' }, { label: 'Right', value: 'right' },
            ]} />
            <SelectRow label="Box Sizing" value={s('boxSizing')} onChange={(v) => updateStyle('boxSizing', v)} options={[
              { label: 'Border Box', value: 'border-box' }, { label: 'Content Box', value: 'content-box' },
            ]} />
            <SelectRow label="Overflow X" value={s('overflowX')} onChange={(v) => updateStyle('overflowX', v)} options={[
              { label: 'Visible', value: 'visible' }, { label: 'Hidden', value: 'hidden' },
              { label: 'Scroll', value: 'scroll' }, { label: 'Auto', value: 'auto' },
            ]} />
            <SelectRow label="Overflow Y" value={s('overflowY')} onChange={(v) => updateStyle('overflowY', v)} options={[
              { label: 'Visible', value: 'visible' }, { label: 'Hidden', value: 'hidden' },
              { label: 'Scroll', value: 'scroll' }, { label: 'Auto', value: 'auto' },
            ]} />
            <SelectRow label="Visibility" value={s('visibility')} onChange={(v) => updateStyle('visibility', v)} options={[
              { label: 'Visible', value: 'visible' }, { label: 'Hidden', value: 'hidden' },
            ]} />
            <FieldRow label="Clip Path" value={s('clipPath')} onChange={(v) => updateStyle('clipPath', v)} placeholder="circle(50%)" />
            <PresetRow label="Clip Path Presets" presets={[
              { label: 'Circle', value: 'circle(50%)' },
              { label: 'Ellipse', value: 'ellipse(50% 40%)' },
              { label: 'Triangle', value: 'polygon(50% 0%, 0% 100%, 100% 100%)' },
              { label: 'Diamond', value: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' },
              { label: 'Hexagon', value: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
              { label: 'Inset', value: 'inset(10%)' },
              { label: 'Arrow', value: 'polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)' },
              { label: 'Notch', value: 'polygon(0 0, 100% 0, 100% calc(100% - 24px), 50% 100%, 0 calc(100% - 24px))' },
            ]} onSelect={(v) => updateStyle('clipPath', v)} currentValue={s('clipPath')} />
            <FieldRow label="Outline" value={s('outline')} onChange={(v) => updateStyle('outline', v)} placeholder="2px solid hsl(var(--studio-accent))" />
            <FieldRow label="Outline Off" value={s('outlineOffset')} onChange={(v) => updateStyle('outlineOffset', v)} placeholder="2px" />
          </div>
        )}
        {sectionDivider}

        {/* Filters */}
        <SectionHeader label="Filters & Glass" open={openSections.filters} onClick={() => toggle('filters')} badge="PRO" />
        {openSections.filters && (
          <div className="space-y-1.5 pb-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--studio-ink-3))' }}>Individual Filters</span>
            <SliderRow label="Blur" value={parseFloat(s('filter')?.match(/blur\((\d+)/)?.[1] || '0')} onChange={(v) => {
              const current = s('filter') || '';
              const cleaned = current.replace(/blur\([^)]*\)\s*/g, '').trim();
              updateStyle('filter', v > 0 ? `blur(${v}px) ${cleaned}`.trim() : cleaned || '');
            }} min={0} max={30} unit="px" />
            <SliderRow label="Bright" value={Math.round(parseFloat(s('filter')?.match(/brightness\(([^)]+)\)/)?.[1] || '1') * 100)} onChange={(v) => {
              const current = s('filter') || '';
              const cleaned = current.replace(/brightness\([^)]*\)\s*/g, '').trim();
              updateStyle('filter', v !== 100 ? `brightness(${v / 100}) ${cleaned}`.trim() : cleaned || '');
            }} min={0} max={200} unit="%" />
            <SliderRow label="Contrast" value={Math.round(parseFloat(s('filter')?.match(/contrast\(([^)]+)\)/)?.[1] || '1') * 100)} onChange={(v) => {
              const current = s('filter') || '';
              const cleaned = current.replace(/contrast\([^)]*\)\s*/g, '').trim();
              updateStyle('filter', v !== 100 ? `contrast(${v / 100}) ${cleaned}`.trim() : cleaned || '');
            }} min={0} max={200} unit="%" />
            <SliderRow label="Saturate" value={Math.round(parseFloat(s('filter')?.match(/saturate\(([^)]+)\)/)?.[1] || '1') * 100)} onChange={(v) => {
              const current = s('filter') || '';
              const cleaned = current.replace(/saturate\([^)]*\)\s*/g, '').trim();
              updateStyle('filter', v !== 100 ? `saturate(${v / 100}) ${cleaned}`.trim() : cleaned || '');
            }} min={0} max={300} unit="%" />
            <SliderRow label="Hue" value={parseInt(s('filter')?.match(/hue-rotate\((\d+)/)?.[1] || '0')} onChange={(v) => {
              const current = s('filter') || '';
              const cleaned = current.replace(/hue-rotate\([^)]*\)\s*/g, '').trim();
              updateStyle('filter', v > 0 ? `hue-rotate(${v}deg) ${cleaned}`.trim() : cleaned || '');
            }} min={0} max={360} unit="°" />
            <SliderRow label="Grayscale" value={Math.round(parseFloat(s('filter')?.match(/grayscale\(([^)]+)\)/)?.[1] || '0') * 100)} onChange={(v) => {
              const current = s('filter') || '';
              const cleaned = current.replace(/grayscale\([^)]*\)\s*/g, '').trim();
              updateStyle('filter', v > 0 ? `grayscale(${v / 100}) ${cleaned}`.trim() : cleaned || '');
            }} min={0} max={100} unit="%" />
            <FieldRow label="Filter" value={s('filter')} onChange={(v) => updateStyle('filter', v)} placeholder="blur(4px)" />
            <PresetRow label="Quick Filters" presets={[
              { label: 'Blur 2', value: 'blur(2px)' }, { label: 'Blur 8', value: 'blur(8px)' },
              { label: 'Grayscale', value: 'grayscale(100%)' }, { label: 'Sepia', value: 'sepia(100%)' },
              { label: 'Invert', value: 'invert(100%)' }, { label: 'Brightness', value: 'brightness(1.2)' },
              { label: 'Contrast', value: 'contrast(1.3)' }, { label: 'Saturate', value: 'saturate(1.5)' },
              { label: 'Hue Rotate', value: 'hue-rotate(90deg)' }, { label: 'Drop Shadow', value: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' },
            ]} onSelect={(v) => updateStyle('filter', v)} currentValue={s('filter')} />
            <div className="h-2" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--studio-ink-3))' }}>Backdrop Filter</span>
            <SliderRow label="BG Blur" value={parseFloat(s('backdropFilter')?.match(/blur\((\d+)/)?.[1] || '0')} onChange={(v) => {
              const current = s('backdropFilter') || '';
              const cleaned = current.replace(/blur\([^)]*\)\s*/g, '').trim();
              updateStyle('backdropFilter', v > 0 ? `blur(${v}px) ${cleaned}`.trim() : cleaned || '');
            }} min={0} max={50} unit="px" />
            <SliderRow label="BG Bright" value={Math.round(parseFloat(s('backdropFilter')?.match(/brightness\(([^)]+)\)/)?.[1] || '1') * 100)} onChange={(v) => {
              const current = s('backdropFilter') || '';
              const cleaned = current.replace(/brightness\([^)]*\)\s*/g, '').trim();
              updateStyle('backdropFilter', v !== 100 ? `brightness(${v / 100}) ${cleaned}`.trim() : cleaned || '');
            }} min={0} max={200} unit="%" />
            <FieldRow label="Backdrop" value={s('backdropFilter')} onChange={(v) => updateStyle('backdropFilter', v)} placeholder="blur(12px)" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--studio-ink-3))' }}>Glassmorphism Presets</span>
            <PresetRow label="" presets={[
              { label: 'Light Glass', value: 'blur(12px) saturate(180%)' },
              { label: 'Heavy Glass', value: 'blur(24px) saturate(200%) brightness(1.1)' },
              { label: 'Frost', value: 'blur(16px) brightness(1.05)' },
              { label: 'Acrylic', value: 'blur(30px) saturate(125%)' },
            ]} onSelect={(v) => {
              updateStyle('backdropFilter', v);
              if (!s('backgroundColor')?.includes('rgba')) {
                updateStyle('backgroundColor', 'rgba(255,255,255,0.15)');
              }
            }} currentValue={s('backdropFilter')} />
          </div>
        )}
        {sectionDivider}

        {/* Transform */}
        <SectionHeader label="Transform & 3D" open={openSections.transform} onClick={() => toggle('transform')} badge="PRO" />
        {openSections.transform && (
          <div className="space-y-1.5 pb-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--studio-ink-3))' }}>Individual Controls</span>
            <FieldRow label="Move X" value={s('transform')?.match(/translateX\(([^)]+)\)/)?.[1] || ''} onChange={(v) => {
              const current = s('transform') || '';
              const cleaned = current.replace(/translateX\([^)]*\)\s*/g, '').trim();
              updateStyle('transform', v ? `translateX(${v}) ${cleaned}`.trim() : cleaned || '');
            }} placeholder="0px" />
            <FieldRow label="Move Y" value={s('transform')?.match(/translateY\(([^)]+)\)/)?.[1] || ''} onChange={(v) => {
              const current = s('transform') || '';
              const cleaned = current.replace(/translateY\([^)]*\)\s*/g, '').trim();
              updateStyle('transform', v ? `translateY(${v}) ${cleaned}`.trim() : cleaned || '');
            }} placeholder="0px" />
            <FieldRow label="Rotate" value={s('transform')?.match(/(?<!rotate[XYZ])rotate\(([^)]+)\)/)?.[1] || ''} onChange={(v) => {
              const current = s('transform') || '';
              const cleaned = current.replace(/(?<!rotate[XYZ])rotate\([^)]*\)\s*/g, '').trim();
              updateStyle('transform', v ? `rotate(${v}) ${cleaned}`.trim() : cleaned || '');
            }} placeholder="0deg" />
            <FieldRow label="Scale" value={s('transform')?.match(/scale\(([^)]+)\)/)?.[1] || ''} onChange={(v) => {
              const current = s('transform') || '';
              const cleaned = current.replace(/scale\([^)]*\)\s*/g, '').trim();
              updateStyle('transform', v ? `scale(${v}) ${cleaned}`.trim() : cleaned || '');
            }} placeholder="1" />
            <FieldRow label="Skew X" value={s('transform')?.match(/skewX\(([^)]+)\)/)?.[1] || ''} onChange={(v) => {
              const current = s('transform') || '';
              const cleaned = current.replace(/skewX\([^)]*\)\s*/g, '').trim();
              updateStyle('transform', v ? `skewX(${v}) ${cleaned}`.trim() : cleaned || '');
            }} placeholder="0deg" />
            <FieldRow label="Skew Y" value={s('transform')?.match(/skewY\(([^)]+)\)/)?.[1] || ''} onChange={(v) => {
              const current = s('transform') || '';
              const cleaned = current.replace(/skewY\([^)]*\)\s*/g, '').trim();
              updateStyle('transform', v ? `skewY(${v}) ${cleaned}`.trim() : cleaned || '');
            }} placeholder="0deg" />
            <div className="h-1" />
            <FieldRow label="Transform" value={s('transform')} onChange={(v) => updateStyle('transform', v)} placeholder="rotate(5deg)" />
            <PresetRow label="Quick Transforms" presets={[
              { label: 'Rotate 5°', value: 'rotate(5deg)' }, { label: 'Rotate -5°', value: 'rotate(-5deg)' },
              { label: 'Scale 1.1', value: 'scale(1.1)' }, { label: 'Scale 0.9', value: 'scale(0.9)' },
              { label: 'Skew X', value: 'skewX(5deg)' }, { label: 'Skew Y', value: 'skewY(5deg)' },
            ]} onSelect={(v) => updateStyle('transform', v)} currentValue={s('transform')} />
            <PresetRow label="3D Transforms" presets={[
              { label: 'Tilt X 10°', value: 'perspective(800px) rotateX(10deg)' },
              { label: 'Tilt Y 10°', value: 'perspective(800px) rotateY(10deg)' },
              { label: '3D Card', value: 'perspective(1000px) rotateX(5deg) rotateY(-5deg)' },
              { label: 'Flip X', value: 'perspective(800px) rotateX(180deg)' },
              { label: 'Flip Y', value: 'perspective(800px) rotateY(180deg)' },
              { label: 'Float Up', value: 'perspective(800px) translateZ(20px)' },
            ]} onSelect={(v) => updateStyle('transform', v)} currentValue={s('transform')} />
            <FieldRow label="Origin" value={s('transformOrigin')} onChange={(v) => updateStyle('transformOrigin', v)} placeholder="center" />
            <PresetRow label="Origin Presets" presets={[
              { label: 'Center', value: 'center' }, { label: 'Top Left', value: 'top left' },
              { label: 'Top Right', value: 'top right' }, { label: 'Bottom Left', value: 'bottom left' },
              { label: 'Bottom Right', value: 'bottom right' }, { label: 'Top', value: 'top center' },
            ]} onSelect={(v) => updateStyle('transformOrigin', v)} currentValue={s('transformOrigin')} />
            <FieldRow label="Perspective" value={s('perspective')} onChange={(v) => updateStyle('perspective', v)} placeholder="1000px" />
            <SelectRow label="Style" value={s('transformStyle')} onChange={(v) => updateStyle('transformStyle', v)} options={[
              { label: 'Flat', value: 'flat' }, { label: 'Preserve 3D', value: 'preserve-3d' },
            ]} />
            <SelectRow label="Backface" value={s('backfaceVisibility')} onChange={(v) => updateStyle('backfaceVisibility', v)} options={[
              { label: 'Visible', value: 'visible' }, { label: 'Hidden', value: 'hidden' },
            ]} />
          </div>
        )}
        {sectionDivider}

        {/* Transition */}
        <SectionHeader label="Transition" open={openSections.transition} onClick={() => toggle('transition')} />
        {openSections.transition && (
          <div className="space-y-1.5 pb-2">
            <FieldRow label="Transition" value={s('transition')} onChange={(v) => updateStyle('transition', v)} placeholder="all 0.3s ease" />
            <PresetRow label="Presets" presets={[
              { label: 'Fast', value: 'all 0.15s ease' }, { label: 'Normal', value: 'all 0.3s ease' },
              { label: 'Smooth', value: 'all 0.5s cubic-bezier(0.4,0,0.2,1)' }, { label: 'Spring', value: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' },
              { label: 'Slow', value: 'all 0.8s ease-in-out' },
            ]} onSelect={(v) => updateStyle('transition', v)} currentValue={s('transition')} />
          </div>
        )}
        {sectionDivider}

        {/* Position & Coordinates */}
        <SectionHeader label="Position" open={openSections.position} onClick={() => toggle('position')} badge="XY" />
        {openSections.position && (
          <div className="space-y-1.5 pb-2">
            <SelectRow label="Position" value={s('position') || 'absolute'} onChange={(v) => updateStyle('position', v)} options={[
              { label: 'Absolute', value: 'absolute' }, { label: 'Relative', value: 'relative' },
              { label: 'Fixed', value: 'fixed' }, { label: 'Sticky', value: 'sticky' }, { label: 'Static', value: 'static' },
            ]} />
            <div className="flex gap-1.5">
              <div className="flex-1">
                <FieldRow label="X" value={s('left')} onChange={(v) => updateStyle('left', v)} placeholder="0px" suffix="px" />
              </div>
              <div className="flex-1">
                <FieldRow label="Y" value={s('top')} onChange={(v) => updateStyle('top', v)} placeholder="0px" suffix="px" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="flex-1">
                <FieldRow label="W" value={s('width')} onChange={(v) => updateStyle('width', v)} placeholder="auto" />
              </div>
              <div className="flex-1">
                <FieldRow label="H" value={s('height')} onChange={(v) => updateStyle('height', v)} placeholder="auto" />
              </div>
            </div>
            <FieldRow label="Z-Index" value={s('zIndex')} onChange={(v) => updateStyle('zIndex', v)} placeholder="auto" />
            <FieldRow label="Rotation" value={s('transform')?.includes('rotate') ? s('transform') : ''} onChange={(v) => updateStyle('transform', v || '')} placeholder="rotate(0deg)" />
            <PresetRow label="Quick Rotation" presets={[
              { label: '0°', value: '' }, { label: '45°', value: 'rotate(45deg)' },
              { label: '90°', value: 'rotate(90deg)' }, { label: '180°', value: 'rotate(180deg)' },
              { label: '-45°', value: 'rotate(-45deg)' }, { label: '-90°', value: 'rotate(-90deg)' },
            ]} onSelect={(v) => updateStyle('transform', v)} currentValue={s('transform')} />
            <FieldRow label="Right" value={s('right')} onChange={(v) => updateStyle('right', v)} />
            <FieldRow label="Bottom" value={s('bottom')} onChange={(v) => updateStyle('bottom', v)} />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

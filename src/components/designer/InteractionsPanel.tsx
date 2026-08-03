import React, { useState, useCallback } from 'react';
import { useEditor } from './EditorContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ChevronRight, Play, Pause, Plus, Trash2, Copy, Eye, EyeOff,
  MousePointer2, Scroll, Timer, Zap, RotateCcw, Move, 
  Maximize2, Minimize2, ArrowUp, ArrowDown, RefreshCw,
  Sparkles, Layers, Settings,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Types ── */
interface InteractionStep {
  id: string; property: string; from: string; to: string;
  duration: number; delay: number; easing: string;
}

interface Interaction {
  id: string; name: string;
  trigger: 'scroll-into-view' | 'hover' | 'click' | 'page-load' | 'scroll-progress' | 'mouse-move';
  steps: InteractionStep[]; loop: boolean; enabled: boolean;
}

/* ── Constants ── */
const TRIGGER_CONFIG: Record<string, { icon: typeof Zap; color: string; label: string; desc: string }> = {
  'scroll-into-view': { icon: Eye, color: 'hsl(var(--studio-accent))', label: 'Scroll Into View', desc: 'When element enters viewport' },
  'hover': { icon: MousePointer2, color: 'hsl(var(--studio-ink-3))', label: 'Mouse Hover', desc: 'On mouse enter/leave' },
  'click': { icon: Zap, color: 'hsl(var(--studio-warn))', label: 'Click / Tap', desc: 'On click or tap' },
  'page-load': { icon: Timer, color: 'hsl(var(--studio-ok))', label: 'Page Load', desc: 'When page finishes loading' },
  'scroll-progress': { icon: Scroll, color: 'hsl(var(--studio-accent))', label: 'While Scrolling', desc: 'Tied to scroll position' },
  'mouse-move': { icon: Move, color: 'hsl(var(--studio-ink-3))', label: 'Mouse Move', desc: 'Parallax on cursor position' },
};

const PROPERTY_GROUPS = [
  { group: 'Transform', color: 'hsl(var(--studio-accent))', items: ['translateX', 'translateY', 'translateZ', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'skewX', 'skewY'] },
  { group: 'Appearance', color: 'hsl(var(--studio-ink-3))', items: ['opacity', 'blur', 'brightness', 'contrast', 'saturate', 'hue-rotate'] },
  { group: 'Size', color: 'hsl(var(--studio-ok))', items: ['width', 'height', 'max-width', 'max-height'] },
  { group: 'Spacing', color: 'hsl(var(--studio-warn))', items: ['margin-top', 'margin-bottom', 'padding-top', 'padding-bottom'] },
  { group: 'Color', color: 'hsl(var(--studio-ink-3))', items: ['background-color', 'color', 'border-color', 'box-shadow'] },
  { group: 'Border', color: 'hsl(var(--studio-accent))', items: ['border-width', 'border-radius'] },
  { group: 'Typography', color: 'hsl(var(--studio-warn))', items: ['font-size', 'letter-spacing', 'line-height'] },
];

const EASINGS = [
  { label: 'Linear', value: 'linear' },
  { label: 'Ease', value: 'ease' },
  { label: 'Ease In', value: 'ease-in' },
  { label: 'Ease Out', value: 'ease-out' },
  { label: 'Ease In Out', value: 'ease-in-out' },
  { label: 'Spring', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  { label: 'Bounce', value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  { label: 'Smooth', value: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
  { label: 'Snappy', value: 'cubic-bezier(0.5, 0, 0, 1)' },
  { label: 'Power3', value: 'cubic-bezier(0.65, 0, 0.35, 1)' },
];

const uid = () => Math.random().toString(36).slice(2, 10);

function getPropertyColor(property: string): string {
  for (const g of PROPERTY_GROUPS) {
    if (g.items.includes(property)) return g.color;
  }
  return 'hsl(var(--studio-ink-3))';
}

/* ── Section Header ── */
function Section({ label, open, onClick, count, color, icon }: { label: string; open: boolean; onClick: () => void; count?: number; color?: string; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between h-8 px-0 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors" style={{ color: 'hsl(var(--studio-ink-2))' }}>
      <div className="flex items-center gap-2">
        <ChevronRight className={`h-2.5 w-2.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} style={{ color: 'hsl(var(--studio-hover))' }} />
        {icon}
        {label}
        {count !== undefined && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold tabular-nums" style={{ backgroundColor: `${color || 'hsl(var(--studio-accent))'}12`, color: color || 'hsl(var(--studio-accent))' }}>{count}</span>
        )}
      </div>
    </button>
  );
}

/* ── Mini Inputs ── */
function MiniInput({ value, onChange, suffix, width = '100%' }: { value: string | number; onChange: (v: string) => void; suffix?: string; width?: string }) {
  return (
    <div className="relative" style={{ width }}>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-6 px-2 rounded text-[10px] outline-none"
        style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))', paddingRight: suffix ? '22px' : '8px' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-raised))'; }}
      />
      {suffix && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px]" style={{ color: 'hsl(var(--studio-ink-3))' }}>{suffix}</span>}
    </div>
  );
}

function MiniSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-6 px-1.5 rounded text-[10px] outline-none cursor-pointer"
      style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))', minWidth: 0 }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ── Easing Curve ── */
function EasingCurve({ easing }: { easing: string }) {
  const getPath = (e: string) => {
    if (e === 'linear') return 'M 4 28 L 28 4';
    if (e === 'ease') return 'M 4 28 C 8 28, 8 4, 28 4';
    if (e === 'ease-in') return 'M 4 28 C 14 28, 20 4, 28 4';
    if (e === 'ease-out') return 'M 4 28 C 4 14, 20 4, 28 4';
    if (e === 'ease-in-out') return 'M 4 28 C 14 28, 18 4, 28 4';
    return 'M 4 28 C 10 28, 22 4, 28 4';
  };
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="shrink-0">
      <rect x="2" y="2" width="28" height="28" rx="4" stroke="hsl(var(--studio-raised))" strokeWidth="0.5" />
      <path d={getPath(easing)} stroke="hsl(var(--studio-accent))" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ── Timeline Visual ── */
function TimelineBar({ steps, totalDuration }: { steps: InteractionStep[]; totalDuration: number }) {
  if (!steps.length || totalDuration <= 0) return null;
  return (
    <div className="mt-2 mb-1 px-1">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[7px] tabular-nums" style={{ color: 'hsl(var(--studio-hover))' }}>0s</span>
        <div className="flex-1 h-7 rounded-md overflow-hidden relative" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
          {steps.map((s, i) => {
            const left = (s.delay / totalDuration) * 100;
            const width = (s.duration / totalDuration) * 100;
            const color = getPropertyColor(s.property);
            return (
              <div key={s.id} className="absolute top-1 h-5 rounded-sm flex items-center justify-center"
                style={{ left: `${left}%`, width: `${Math.max(width, 3)}%`, backgroundColor: `${color}18`, border: `1px solid ${color}40` }}
                title={`${s.property}: ${s.delay}ms → ${s.delay + s.duration}ms`}>
                <span className="text-[6px] truncate px-0.5 font-bold" style={{ color }}>{s.property}</span>
              </div>
            );
          })}
        </div>
        <span className="text-[7px] tabular-nums" style={{ color: 'hsl(var(--studio-hover))' }}>{(totalDuration / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}

/* ── Step Editor ── */
function StepEditor({ step, onUpdate, onDelete }: { step: InteractionStep; onUpdate: (s: InteractionStep) => void; onDelete: () => void }) {
  const [propOpen, setPropOpen] = useState(false);
  const propColor = getPropertyColor(step.property);

  return (
    <motion.div layout className="rounded-lg p-2 mb-1" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: `1px solid ${propOpen ? `${propColor}25` : 'hsl(var(--studio-raised))'}`, transition: 'border-color 0.2s' }}>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setPropOpen(!propOpen)} className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: `${propColor}15`, border: `1px solid ${propColor}25` }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: propColor }} />
          </div>
          <span className="text-[9px] font-semibold" style={{ color: propColor }}>{step.property || 'Select'}</span>
          <ChevronDown className={`h-2 w-2 transition-transform ${propOpen ? '' : '-rotate-90'}`} style={{ color: 'hsl(var(--studio-hover))' }} />
        </button>
        <button onClick={onDelete} className="p-0.5 rounded hover:bg-red-500/10 transition-colors"><Trash2 className="h-2.5 w-2.5" style={{ color: 'hsl(var(--studio-ink-3))' }} /></button>
      </div>

      <AnimatePresence>
        {propOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
            <div className="mb-2 rounded-md p-1.5 space-y-1" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', maxHeight: 160, overflowY: 'auto' }}>
              {PROPERTY_GROUPS.map(g => (
                <div key={g.group}>
                  <div className="text-[7px] uppercase tracking-wider px-1 py-0.5 font-bold flex items-center gap-1" style={{ color: g.color }}>
                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: g.color }} />
                    {g.group}
                  </div>
                  <div className="flex flex-wrap gap-0.5 mb-1">
                    {g.items.map(p => (
                      <button key={p} onClick={() => { onUpdate({ ...step, property: p }); setPropOpen(false); }}
                        className="text-[8px] px-1.5 py-0.5 rounded transition-colors"
                        style={{ backgroundColor: step.property === p ? `${g.color}15` : 'hsl(var(--studio-raised))', color: step.property === p ? g.color: 'hsl(var(--studio-ink-2))', border: `1px solid ${step.property === p ? `${g.color}30` : 'hsl(var(--studio-raised))'}` }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-1.5">
        <div><div className="text-[7px] mb-0.5 font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>From</div><MiniInput value={step.from} onChange={v => onUpdate({ ...step, from: v })} /></div>
        <div><div className="text-[7px] mb-0.5 font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>To</div><MiniInput value={step.to} onChange={v => onUpdate({ ...step, to: v })} /></div>
        <div><div className="text-[7px] mb-0.5 font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Duration</div><MiniInput value={step.duration} onChange={v => onUpdate({ ...step, duration: parseInt(v) || 0 })} suffix="ms" /></div>
        <div><div className="text-[7px] mb-0.5 font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Delay</div><MiniInput value={step.delay} onChange={v => onUpdate({ ...step, delay: parseInt(v) || 0 })} suffix="ms" /></div>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex-1"><div className="text-[7px] mb-0.5 font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Easing</div>
          <MiniSelect value={step.easing} onChange={v => onUpdate({ ...step, easing: v })} options={EASINGS} />
        </div>
        <EasingCurve easing={step.easing} />
      </div>
    </motion.div>
  );
}

/* ── Quick Presets ── */
const QUICK_PRESETS: { name: string; trigger: Interaction['trigger']; steps: Omit<InteractionStep, 'id'>[] }[] = [
  { name: 'Fade In Up', trigger: 'scroll-into-view', steps: [
    { property: 'opacity', from: '0', to: '1', duration: 600, delay: 0, easing: 'ease-out' },
    { property: 'translateY', from: '40px', to: '0px', duration: 600, delay: 0, easing: 'ease-out' },
  ]},
  { name: 'Scale Pop', trigger: 'scroll-into-view', steps: [
    { property: 'scale', from: '0.8', to: '1', duration: 500, delay: 0, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    { property: 'opacity', from: '0', to: '1', duration: 400, delay: 0, easing: 'ease-out' },
  ]},
  { name: 'Hover Lift', trigger: 'hover', steps: [
    { property: 'translateY', from: '0px', to: '-8px', duration: 300, delay: 0, easing: 'ease-out' },
    { property: 'box-shadow', from: '0 2px 8px rgba(0,0,0,0.1)', to: '0 12px 32px rgba(0,0,0,0.15)', duration: 300, delay: 0, easing: 'ease-out' },
  ]},
  { name: 'Hover Glow', trigger: 'hover', steps: [
    { property: 'scale', from: '1', to: '1.02', duration: 250, delay: 0, easing: 'ease-out' },
    { property: 'brightness', from: '1', to: '1.1', duration: 250, delay: 0, easing: 'ease-out' },
  ]},
  { name: 'Click Shrink', trigger: 'click', steps: [
    { property: 'scale', from: '1', to: '0.95', duration: 100, delay: 0, easing: 'ease-in' },
  ]},
  { name: 'Parallax Float', trigger: 'scroll-progress', steps: [
    { property: 'translateY', from: '0px', to: '-60px', duration: 1000, delay: 0, easing: 'linear' },
  ]},
  { name: 'Slide In Left', trigger: 'scroll-into-view', steps: [
    { property: 'translateX', from: '-60px', to: '0px', duration: 700, delay: 0, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
    { property: 'opacity', from: '0', to: '1', duration: 500, delay: 0, easing: 'ease-out' },
  ]},
  { name: 'Blur Reveal', trigger: 'scroll-into-view', steps: [
    { property: 'blur', from: '12px', to: '0px', duration: 800, delay: 0, easing: 'ease-out' },
    { property: 'opacity', from: '0', to: '1', duration: 600, delay: 0, easing: 'ease-out' },
  ]},
  { name: 'Rotate Entrance', trigger: 'page-load', steps: [
    { property: 'rotate', from: '-10deg', to: '0deg', duration: 600, delay: 200, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    { property: 'opacity', from: '0', to: '1', duration: 400, delay: 200, easing: 'ease-out' },
  ]},
  { name: '3D Tilt Hover', trigger: 'hover', steps: [
    { property: 'rotateX', from: '0deg', to: '5deg', duration: 300, delay: 0, easing: 'ease-out' },
    { property: 'rotateY', from: '0deg', to: '-5deg', duration: 300, delay: 0, easing: 'ease-out' },
  ]},
  { name: 'Stagger Cascade', trigger: 'scroll-into-view', steps: [
    { property: 'translateY', from: '30px', to: '0px', duration: 500, delay: 0, easing: 'ease-out' },
    { property: 'opacity', from: '0', to: '1', duration: 500, delay: 100, easing: 'ease-out' },
  ]},
  { name: 'Cursor Parallax', trigger: 'mouse-move', steps: [
    { property: 'translateX', from: '-20px', to: '20px', duration: 0, delay: 0, easing: 'linear' },
    { property: 'translateY', from: '-20px', to: '20px', duration: 0, delay: 0, easing: 'linear' },
  ]},
];

/* ── Main Panel ── */
export function InteractionsPanel() {
  const { state } = useEditor();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [triggerOpen, setTriggerOpen] = useState(false);

  const selected = interactions.find(i => i.id === selectedId);

  const addInteraction = useCallback((preset?: typeof QUICK_PRESETS[0]) => {
    const newI: Interaction = {
      id: uid(), name: preset?.name || 'New Interaction',
      trigger: preset?.trigger || 'scroll-into-view',
      steps: preset?.steps.map(s => ({ ...s, id: uid() })) || [],
      loop: false, enabled: true,
    };
    setInteractions(p => [...p, newI]);
    setSelectedId(newI.id);
    toast.success(`Added: ${newI.name}`);
  }, []);

  const updateInteraction = useCallback((id: string, updates: Partial<Interaction>) => {
    setInteractions(p => p.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const deleteInteraction = useCallback((id: string) => {
    setInteractions(p => p.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast.success('Interaction removed');
  }, [selectedId]);

  const addStep = useCallback(() => {
    if (!selectedId) return;
    const step: InteractionStep = { id: uid(), property: 'opacity', from: '0', to: '1', duration: 500, delay: 0, easing: 'ease-out' };
    updateInteraction(selectedId, { steps: [...(selected?.steps || []), step] });
  }, [selectedId, selected, updateInteraction]);

  const duplicateInteraction = useCallback((interaction: Interaction) => {
    const dup: Interaction = { ...interaction, id: uid(), name: interaction.name + ' Copy', steps: interaction.steps.map(s => ({ ...s, id: uid() })) };
    setInteractions(p => [...p, dup]);
    setSelectedId(dup.id);
    toast.success('Duplicated');
  }, []);

  const totalDuration = selected ? Math.max(...selected.steps.map(s => s.delay + s.duration), 0) : 0;
  const selectedEl = state.selectedIds?.[0] ? state.elements.find(e => e.id === state.selectedIds[0]) : null;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(236,72,153,0.08))', border: '1px solid rgba(245,158,11,0.15)' }}>
              <Zap className="h-3 w-3" style={{ color: 'hsl(var(--studio-warn))' }} />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--studio-ink-2))' }}>Interactions</span>
          </div>
          <button onClick={() => addInteraction()} className="flex items-center gap-1 text-[8px] font-semibold px-2 py-1 rounded-lg transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--studio-warn)), hsl(var(--studio-warn)))', color: 'hsl(var(--studio-ink))' }}>
            <Plus className="h-3 w-3" /> New
          </button>
        </div>

        {/* Selected element */}
        {selectedEl && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(var(--studio-ok))' }} />
            <span className="text-[9px]" style={{ color: 'hsl(var(--studio-ink-2))' }}>Target: <span style={{ color: 'hsl(var(--studio-ink-2))' }}>{selectedEl.type}</span></span>
          </div>
        )}

        {/* Quick Presets */}
        <Section label="Presets" open={presetsOpen} onClick={() => setPresetsOpen(!presetsOpen)} count={QUICK_PRESETS.length} color="hsl(var(--studio-warn))"
          icon={<Sparkles className="h-3 w-3" style={{ color: 'hsl(var(--studio-warn))' }} />} />
        <AnimatePresence>
          {presetsOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
              <div className="grid grid-cols-2 gap-1">
                {QUICK_PRESETS.map(p => {
                  const tc = TRIGGER_CONFIG[p.trigger];
                  const TriggerIcon = tc?.icon || Zap;
                  const triggerColor = tc?.color || 'hsl(var(--studio-ink-3))';
                  return (
                    <button key={p.name} onClick={() => addInteraction(p)}
                      className="text-left p-2 rounded-lg transition-all group"
                      style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${triggerColor}40`; e.currentTarget.style.backgroundColor = `${triggerColor}05`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-raised))'; e.currentTarget.style.backgroundColor = 'hsl(var(--studio-panel))'; }}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: `${triggerColor}12`, border: `1px solid ${triggerColor}20` }}>
                          <TriggerIcon className="h-2.5 w-2.5" style={{ color: triggerColor }} />
                        </div>
                        <span className="text-[9px] font-medium truncate" style={{ color: 'hsl(var(--studio-ink-2))' }}>{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[7px] tabular-nums" style={{ color: 'hsl(var(--studio-ink-3))' }}>{p.steps.length} steps</span>
                        <span className="text-[7px]" style={{ color: triggerColor }}>{p.trigger}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Interactions */}
        {interactions.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Layers className="h-3 w-3" style={{ color: 'hsl(var(--studio-hover))' }} />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Active</span>
              <span className="text-[8px] tabular-nums px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: 'hsl(var(--studio-warn))' }}>{interactions.length}</span>
            </div>
            <div className="space-y-1">
              {interactions.map(i => {
                const tc = TRIGGER_CONFIG[i.trigger];
                const triggerColor = tc?.color || 'hsl(var(--studio-ink-3))';
                const TriggerIcon = tc?.icon || Zap;
                const isSelected = selectedId === i.id;
                return (
                  <div key={i.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group"
                    style={{ backgroundColor: isSelected ? `${triggerColor}06` : 'hsl(var(--studio-panel))', border: `1px solid ${isSelected ? `${triggerColor}25` : 'hsl(var(--studio-raised))'}` }}
                    onClick={() => setSelectedId(i.id)}>
                    <button onClick={e => { e.stopPropagation(); updateInteraction(i.id, { enabled: !i.enabled }); }} className="p-0.5">
                      {i.enabled ? <Eye className="h-3 w-3" style={{ color: 'hsl(var(--studio-ok))' }} /> : <EyeOff className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-3))' }} />}
                    </button>
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: `${triggerColor}12`, border: `1px solid ${triggerColor}20` }}>
                      <TriggerIcon className="h-2.5 w-2.5" style={{ color: triggerColor }} />
                    </div>
                    <span className="text-[10px] flex-1 truncate font-medium" style={{ color: isSelected ? 'hsl(var(--studio-ink-2))' : 'hsl(var(--studio-ink-2))' }}>{i.name}</span>
                    <span className="text-[7px] tabular-nums" style={{ color: 'hsl(var(--studio-hover))' }}>{i.steps.length}s</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); duplicateInteraction(i); }} className="p-0.5 rounded hover:bg-white/5">
                        <Copy className="h-2.5 w-2.5" style={{ color: 'hsl(var(--studio-ink-3))' }} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteInteraction(i.id); }} className="p-0.5 rounded hover:bg-red-500/10">
                        <Trash2 className="h-2.5 w-2.5" style={{ color: 'hsl(var(--studio-ink-3))' }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Editor */}
        {selected && (
          <div className="space-y-2">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
              <div className="mb-2">
                <div className="text-[7px] uppercase tracking-wider mb-0.5 font-bold" style={{ color: 'hsl(var(--studio-ink-3))' }}>Name</div>
                <MiniInput value={selected.name} onChange={v => updateInteraction(selected.id, { name: v })} />
              </div>

              {/* Trigger selector */}
              <div className="mb-2">
                <div className="text-[7px] uppercase tracking-wider mb-0.5 font-bold" style={{ color: 'hsl(var(--studio-ink-3))' }}>Trigger</div>
                <button onClick={() => setTriggerOpen(!triggerOpen)} className="w-full flex items-center justify-between p-1.5 rounded-md"
                  style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))' }}>
                  <div className="flex items-center gap-1.5">
                    {(() => { const tc = TRIGGER_CONFIG[selected.trigger]; const Icon = tc?.icon || Zap; return (
                      <>
                        <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: `${tc?.color || 'hsl(var(--studio-ink-3))'}12` }}>
                          <Icon className="h-2.5 w-2.5" style={{ color: tc?.color || 'hsl(var(--studio-ink-3))' }} />
                        </div>
                        <span className="text-[10px] font-medium" style={{ color: tc?.color || 'hsl(var(--studio-ink-2))' }}>{tc?.label || selected.trigger}</span>
                      </>
                    ); })()}
                  </div>
                  <ChevronDown className={`h-2.5 w-2.5 transition-transform ${triggerOpen ? '' : '-rotate-90'}`} style={{ color: 'hsl(var(--studio-hover))' }} />
                </button>
                <AnimatePresence>
                  {triggerOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
                      <div className="mt-1 rounded-lg p-1 space-y-0.5" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
                        {Object.entries(TRIGGER_CONFIG).map(([value, config]) => {
                          const Icon = config.icon;
                          const isActive = selected.trigger === value;
                          return (
                            <button key={value} onClick={() => { updateInteraction(selected.id, { trigger: value as Interaction['trigger'] }); setTriggerOpen(false); }}
                              className="w-full flex items-center gap-2 p-1.5 rounded-md transition-colors text-left"
                              style={{ backgroundColor: isActive ? `${config.color}08` : 'transparent' }}
                              onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'hsl(var(--studio-raised))'; }}
                              onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `${config.color}12`, border: `1px solid ${config.color}20` }}>
                                <Icon className="h-3 w-3" style={{ color: isActive ? config.color: 'hsl(var(--studio-ink-3))' }} />
                              </div>
                              <div>
                                <div className="text-[10px] font-medium" style={{ color: isActive ? config.color: 'hsl(var(--studio-ink-2))' }}>{config.label}</div>
                                <div className="text-[8px]" style={{ color: 'hsl(var(--studio-hover))' }}>{config.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Loop toggle */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="h-3 w-3" style={{ color: selected.loop ? 'hsl(var(--studio-ok))' : 'hsl(var(--studio-ink-3))' }} />
                  <span className="text-[9px]" style={{ color: 'hsl(var(--studio-ink-2))' }}>Loop animation</span>
                </div>
                <button onClick={() => updateInteraction(selected.id, { loop: !selected.loop })}
                  className="w-7 h-4 rounded-full transition-colors flex items-center"
                  style={{ backgroundColor: selected.loop ? 'hsl(var(--studio-ok))' : 'hsl(var(--studio-line))', padding: '2px' }}>
                  <div className="w-3 h-3 rounded-full bg-white transition-transform" style={{ transform: selected.loop ? 'translateX(12px)' : 'translateX(0)' }} />
                </button>
              </div>
            </div>

            {/* Timeline */}
            <TimelineBar steps={selected.steps} totalDuration={totalDuration} />

            {/* Steps */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Settings className="h-3 w-3" style={{ color: 'hsl(var(--studio-hover))' }} />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Steps</span>
              </div>
              <button onClick={addStep} className="flex items-center gap-1 text-[8px] px-2 py-1 rounded-md font-semibold"
                style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.08)', color: 'hsl(var(--studio-accent))', border: '1px solid hsl(var(--studio-accent) / 0.15)' }}>
                <Plus className="h-2.5 w-2.5" /> Add
              </button>
            </div>
            {selected.steps.map(step => (
              <StepEditor key={step.id} step={step}
                onUpdate={updated => updateInteraction(selected.id, { steps: selected.steps.map(s => s.id === updated.id ? updated : s) })}
                onDelete={() => updateInteraction(selected.id, { steps: selected.steps.filter(s => s.id !== step.id) })}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {interactions.length === 0 && !presetsOpen && (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.08)' }}>
              <Zap className="w-6 h-6" style={{ color: 'rgba(245,158,11,0.3)' }} />
            </div>
            <p className="text-[11px] font-medium" style={{ color: 'hsl(var(--studio-ink-3))' }}>No interactions yet</p>
            <p className="text-[9px] mt-1" style={{ color: 'hsl(var(--studio-hover))' }}>Select an element & add an interaction</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

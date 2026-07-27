import React, { useState } from 'react';
import { useEditor } from './EditorContext';
import { AnimationType, AnimationTrigger } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Play, RotateCcw, Zap, MousePointer2, Eye, Scroll, Timer, Plus, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GROUP_COLORS: Record<string, string> = {
  Basic: '#64748b', Fade: '#3b82f6', Slide: '#0ea5e9', Scale: '#8b5cf6',
  Rotate: '#f59e0b', Bounce: '#22c55e', '3D': '#ec4899', Blur: '#06b6d4',
  Cinematic: '#f43f5e', Scroll: '#a855f7', Loop: '#14b8a6', Text: '#f97316',
};

const ANIMATION_PRESETS: { label: string; group: string; value: AnimationType; preview: string }[] = [
  { label: 'None', group: 'Basic', value: 'none', preview: '' },
  { label: 'Fade In', group: 'Fade', value: 'fadeIn', preview: 'opacity: 0 → 1' },
  { label: 'Fade In Up', group: 'Fade', value: 'fadeInUp', preview: 'Slide up + fade' },
  { label: 'Fade In Down', group: 'Fade', value: 'fadeInDown', preview: 'Slide down + fade' },
  { label: 'Fade In Left', group: 'Fade', value: 'fadeInLeft', preview: 'Slide left + fade' },
  { label: 'Fade In Right', group: 'Fade', value: 'fadeInRight', preview: 'Slide right + fade' },
  { label: 'Slide Up', group: 'Slide', value: 'slideUp', preview: 'translateY(40px → 0)' },
  { label: 'Slide Down', group: 'Slide', value: 'slideDown', preview: 'translateY(-40px → 0)' },
  { label: 'Slide Left', group: 'Slide', value: 'slideLeft', preview: 'translateX(40px → 0)' },
  { label: 'Slide Right', group: 'Slide', value: 'slideRight', preview: 'translateX(-40px → 0)' },
  { label: 'Scale In', group: 'Scale', value: 'scaleIn', preview: 'scale(0.8 → 1)' },
  { label: 'Scale Up', group: 'Scale', value: 'scaleUp', preview: 'scale(0.5 → 1)' },
  { label: 'Scale Down', group: 'Scale', value: 'scaleDown', preview: 'scale(1.3 → 1)' },
  { label: 'Rotate In', group: 'Rotate', value: 'rotateIn', preview: 'rotate(-10deg → 0)' },
  { label: 'Flip In X', group: 'Rotate', value: 'flipInX', preview: 'rotateX(90 → 0)' },
  { label: 'Flip In Y', group: 'Rotate', value: 'flipInY', preview: 'rotateY(90 → 0)' },
  { label: 'Bounce In', group: 'Bounce', value: 'bounceIn', preview: 'Spring overshoot' },
  { label: 'Bounce In Up', group: 'Bounce', value: 'bounceInUp', preview: 'Spring from bottom' },
  { label: 'Elastic', group: 'Bounce', value: 'elastic', preview: 'Elastic spring' },
  { label: 'Rubber Band', group: 'Bounce', value: 'rubberBand', preview: 'Stretch & snap back' },
  { label: '3D Tilt In', group: '3D', value: 'tiltIn', preview: 'perspective + rotateX' },
  { label: '3D Flip', group: '3D', value: 'flip3d', preview: 'Full 3D flip entry' },
  { label: 'Zoom Rotate', group: '3D', value: 'zoomRotate', preview: 'scale(0) + rotate' },
  { label: 'Spiral In', group: '3D', value: 'spiralIn', preview: 'Spiral scale entry' },
  { label: 'Blur In', group: 'Blur', value: 'blurIn', preview: 'blur(10px → 0)' },
  { label: 'Blur Slide', group: 'Blur', value: 'blurSlide', preview: 'blur + slide up' },
  { label: 'Morph In', group: 'Cinematic', value: 'morphIn', preview: 'Morphing shape entry' },
  { label: 'Glitch In', group: 'Cinematic', value: 'glitchIn', preview: 'Digital glitch reveal' },
  { label: 'Split Reveal', group: 'Cinematic', value: 'splitReveal', preview: 'Split open reveal' },
  { label: 'Curtain Up', group: 'Cinematic', value: 'curtainUp', preview: 'Curtain rise reveal' },
  { label: 'Unfold', group: 'Cinematic', value: 'unfold', preview: '3D unfold entrance' },
  { label: 'Drop In', group: 'Cinematic', value: 'dropIn', preview: 'Drop with bounce' },
  { label: 'Swing In', group: 'Cinematic', value: 'swingIn', preview: 'Pendulum swing entry' },
  { label: 'Text Reveal', group: 'Cinematic', value: 'reveal', preview: 'Clip-path reveal' },
  { label: 'Parallax', group: 'Scroll', value: 'parallax', preview: 'Scroll-linked movement' },
  { label: 'Counter Scroll', group: 'Scroll', value: 'counterScroll', preview: 'Opposite scroll direction' },
  { label: 'Scroll Wipe', group: 'Scroll', value: 'scrollWipe', preview: 'Wipe on scroll' },
  { label: 'Scroll Zoom', group: 'Scroll', value: 'scrollZoom', preview: 'Scale on scroll' },
  { label: 'Scroll Rotate 3D', group: 'Scroll', value: 'scrollRotate3D', preview: '3D rotate on scroll' },
  { label: 'Horizontal Scroll', group: 'Scroll', value: 'horizontalScroll', preview: 'Move X on scroll' },
  { label: 'Pulse', group: 'Loop', value: 'pulse', preview: 'scale(1 → 1.05) loop' },
  { label: 'Float', group: 'Loop', value: 'float', preview: 'Y oscillation' },
  { label: 'Spin', group: 'Loop', value: 'spin', preview: 'rotate(0 → 360)' },
  { label: 'Glow', group: 'Loop', value: 'glow', preview: 'Shadow pulse' },
  { label: 'Shake', group: 'Loop', value: 'shake', preview: 'X oscillation' },
  { label: 'Wiggle', group: 'Loop', value: 'wiggle', preview: 'Rotate oscillation' },
  { label: 'Breathe', group: 'Loop', value: 'breathe', preview: 'Scale + opacity' },
  { label: 'Shimmer', group: 'Loop', value: 'shimmer', preview: 'Shine sweep effect' },
  { label: 'Aurora', group: 'Loop', value: 'aurora', preview: 'Color shift glow' },
  { label: 'Orbit', group: 'Loop', value: 'orbit', preview: 'Circular orbit path' },
  { label: 'Ripple', group: 'Loop', value: 'ripple', preview: 'Expanding ripple' },
  { label: 'Magnetic', group: 'Loop', value: 'magnetic', preview: 'Attract/repel motion' },
  { label: 'Typewriter', group: 'Text', value: 'typewriter', preview: 'Letter by letter' },
  { label: 'Gradient Shift', group: 'Loop', value: 'gradientShift', preview: 'BG position shift' },
];

const EASING_OPTIONS = [
  { label: 'Ease', value: 'ease' },
  { label: 'Ease In', value: 'easeIn' },
  { label: 'Ease Out', value: 'easeOut' },
  { label: 'Ease In Out', value: 'easeInOut' },
  { label: 'Linear', value: 'linear' },
  { label: 'Spring', value: 'spring' },
  { label: 'Bounce', value: 'bounce' },
  { label: 'Back In', value: 'backIn' },
  { label: 'Back Out', value: 'backOut' },
  { label: 'Elastic', value: 'elasticOut' },
];

const HOVER_PRESETS = [
  { label: 'Scale Up', transform: 'scale(1.05)', transition: '0.3s ease' },
  { label: 'Scale Down', transform: 'scale(0.95)', transition: '0.3s ease' },
  { label: 'Lift', transform: 'translateY(-4px)', transition: '0.3s ease' },
  { label: 'Tilt Right', transform: 'rotate(2deg)', transition: '0.3s ease' },
  { label: 'Tilt Left', transform: 'rotate(-2deg)', transition: '0.3s ease' },
  { label: '3D Tilt', transform: 'perspective(600px) rotateY(5deg)', transition: '0.4s ease' },
  { label: 'Grow Shadow', transform: 'translateY(-2px)', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', transition: '0.3s ease' },
  { label: 'Brighten', filter: 'brightness(1.1)', transition: '0.3s ease' },
  { label: 'Darken', filter: 'brightness(0.9)', transition: '0.3s ease' },
  { label: 'Saturate', filter: 'saturate(1.3)', transition: '0.3s ease' },
  { label: 'Blur Background', backdropFilter: 'blur(4px)', transition: '0.3s ease' },
  { label: 'Border Glow', boxShadow: '0 0 0 2px rgba(59,130,246,0.5)', transition: '0.3s ease' },
];

const TRIGGER_ITEMS = [
  { value: 'onLoad', label: 'Load', icon: Zap, color: '#f59e0b' },
  { value: 'onScroll', label: 'Scroll', icon: Scroll, color: '#a855f7' },
  { value: 'onHover', label: 'Hover', icon: MousePointer2, color: '#3b82f6' },
  { value: 'onClick', label: 'Click', icon: MousePointer2, color: '#22c55e' },
  { value: 'onView', label: 'In View', icon: Eye, color: '#0ea5e9' },
  { value: 'timed', label: 'Timed', icon: Timer, color: '#f43f5e' },
];

function SectionHeader({ label, icon, open, onClick, color, count }: { label: string; icon?: React.ReactNode; open: boolean; onClick: () => void; color?: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between h-9 px-0 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors group"
      style={{ color: '#888' }}
    >
      <div className="flex items-center gap-2">
        <ChevronRight
          className={`h-2.5 w-2.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          style={{ color: '#444' }}
        />
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color || '#555'}10`, border: `1px solid ${color || '#555'}15` }}>
          {icon}
        </div>
        {label}
        {count !== undefined && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full tabular-nums" style={{ backgroundColor: `${color || '#555'}12`, color: color || '#555' }}>
            {count}
          </span>
        )}
      </div>
    </button>
  );
}

export function AnimationEditor() {
  const { selectedElement, dispatch } = useEditor();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    entrance: true, hover: true, scroll: false, transition: false, transform: false, interactions: false,
  });
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const toggle = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleGroup = (g: string) => setCollapsedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  if (!selectedElement) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#555' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(168,85,247,0.02))', border: '1px solid rgba(168,85,247,0.1)' }}>
          <Zap className="h-6 w-6" style={{ color: 'rgba(168,85,247,0.4)' }} />
        </div>
        <span className="text-[12px] font-medium" style={{ color: '#888' }}>No element selected</span>
        <span className="text-[10px]" style={{ color: '#444' }}>Click an element to animate it</span>
        <div className="flex items-center gap-2 mt-2">
          <kbd className="text-[8px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: '#1e1e1e', color: '#555', border: '1px solid #252525' }}>A</kbd>
          <span className="text-[9px]" style={{ color: '#444' }}>to open animation panel</span>
        </div>
      </div>
    );
  }

  const anim = selectedElement.animations ?? { type: 'none' as AnimationType, duration: 0.6, delay: 0, trigger: 'onLoad' as AnimationTrigger, easing: 'ease', stagger: 0, loop: false, loopDelay: 0, intensity: 1 };

  const update = (updates: Partial<typeof anim>) => {
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: { id: selectedElement.id, updates: { animations: { ...anim, ...updates } } },
    });
  };

  const updateHover = (updates: Record<string, string>) => {
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: { id: selectedElement.id, updates: { hoverStyles: { ...selectedElement.hoverStyles, ...updates } } },
    });
  };

  const groups = ANIMATION_PRESETS.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {} as Record<string, typeof ANIMATION_PRESETS>);

  // Current animation info
  const currentPreset = ANIMATION_PRESETS.find(p => p.value === anim.type);
  const currentGroupColor = currentPreset ? (GROUP_COLORS[currentPreset.group] || '#555') : '#555';

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">

        {/* Current animation badge */}
        {anim.type !== 'none' && (
          <div className="flex items-center gap-2 p-2 rounded-lg mb-2" style={{ backgroundColor: `${currentGroupColor}08`, border: `1px solid ${currentGroupColor}15` }}>
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${currentGroupColor}15` }}>
              <Play className="h-3 w-3" style={{ color: currentGroupColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold block" style={{ color: currentGroupColor }}>{currentPreset?.label}</span>
              <span className="text-[8px] block" style={{ color: '#555' }}>{currentPreset?.preview}</span>
            </div>
            <button onClick={() => update({ type: 'none' as AnimationType })} className="h-5 w-5 rounded flex items-center justify-center hover:bg-white/[0.06]" title="Clear animation">
              <Trash2 className="h-2.5 w-2.5" style={{ color: '#555' }} />
            </button>
          </div>
        )}

        {/* ── Entrance Animation ── */}
        <SectionHeader label="Entrance" icon={<Play className="h-3 w-3" style={{ color: '#3b82f6' }} />} color="#3b82f6" open={openSections.entrance} onClick={() => toggle('entrance')} count={Object.keys(groups).length} />
        <AnimatePresence>
          {openSections.entrance && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
              <div className="space-y-3 pb-3">
                {Object.entries(groups).map(([group, presets]) => {
                  const groupColor = GROUP_COLORS[group] || '#555';
                  const isCollapsed = collapsedGroups.includes(group);
                  const hasActive = presets.some(p => p.value === anim.type);
                  return (
                    <div key={group}>
                      <button onClick={() => toggleGroup(group)} className="flex items-center gap-1.5 mb-1 w-full group/g">
                        <ChevronRight className={`h-2 w-2 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} style={{ color: '#444' }} />
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: groupColor }} />
                        <span className="text-[8px] font-bold uppercase tracking-[0.12em] flex-1 text-left" style={{ color: hasActive ? groupColor : '#555' }}>{group}</span>
                        <span className="text-[7px] tabular-nums opacity-0 group-hover/g:opacity-100 transition-opacity" style={{ color: '#444' }}>{presets.length}</span>
                      </button>
                      {!isCollapsed && (
                        <div className="grid grid-cols-2 gap-0.5 ml-3">
                          {presets.map(p => (
                            <button
                              key={p.value}
                              onClick={() => update({ type: p.value })}
                              className="text-left px-2 py-1 rounded transition-all text-[9px] group/btn"
                              style={{
                                backgroundColor: anim.type === p.value ? `${groupColor}15` : 'transparent',
                                border: `1px solid ${anim.type === p.value ? `${groupColor}30` : 'transparent'}`,
                                color: anim.type === p.value ? groupColor : '#888',
                                fontWeight: anim.type === p.value ? 600 : 400,
                              }}
                              onMouseEnter={e => { if (anim.type !== p.value) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = '#333'; } }}
                              onMouseLeave={e => { if (anim.type !== p.value) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; } }}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Trigger */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#666' }}>Trigger</div>
                  <div className="grid grid-cols-3 gap-1">
                    {TRIGGER_ITEMS.map(t => {
                      const Icon = t.icon;
                      const active = anim.trigger === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => update({ trigger: t.value as AnimationTrigger })}
                          className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all text-[8px] font-medium"
                          style={{
                            backgroundColor: active ? `${t.color}12` : '#2a2a2a',
                            border: `1px solid ${active ? `${t.color}30` : '#333'}`,
                            color: active ? t.color : '#888',
                          }}
                        >
                          <Icon className="h-3 w-3" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Timing controls */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#666' }}>Timing</div>
                  <ControlRow label="Duration" value={anim.duration || 0.6} onChange={v => update({ duration: v })} suffix="s" min={0} max={5} step={0.1} color="#3b82f6" />
                  <ControlRow label="Delay" value={anim.delay || 0} onChange={v => update({ delay: v })} suffix="s" min={0} max={5} step={0.1} color="#8b5cf6" />
                  <ControlRow label="Stagger" value={(anim as any).stagger || 0} onChange={v => update({ stagger: v } as any)} suffix="s" min={0} max={2} step={0.05} color="#0ea5e9" />
                  <ControlRow label="Intensity" value={(anim as any).intensity || 1} onChange={v => update({ intensity: v } as any)} suffix="x" min={0.1} max={3} step={0.1} color="#f59e0b" />
                </div>

                {/* Easing */}
                <div className="space-y-1">
                  <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#666' }}>Easing</div>
                  <div className="grid grid-cols-2 gap-0.5">
                    {EASING_OPTIONS.map(e => (
                      <button
                        key={e.value}
                        onClick={() => update({ easing: e.value } as any)}
                        className="px-2 py-1 rounded text-[9px] transition-all"
                        style={{
                          backgroundColor: (anim as any).easing === e.value ? 'rgba(0,115,230,0.12)' : 'transparent',
                          border: `1px solid ${(anim as any).easing === e.value ? '#0073E6' : 'transparent'}`,
                          color: (anim as any).easing === e.value ? '#4da3ff' : '#888',
                        }}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loop toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => update({ loop: !(anim as any).loop } as any)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all"
                    style={{
                      backgroundColor: (anim as any).loop ? 'rgba(20,184,166,0.12)' : '#2a2a2a',
                      border: `1px solid ${(anim as any).loop ? 'rgba(20,184,166,0.3)' : '#333'}`,
                      color: (anim as any).loop ? '#14b8a6' : '#888',
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Loop
                  </button>
                  {(anim as any).loop && (
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[9px]" style={{ color: '#666' }}>Delay:</span>
                      <input
                        type="number" step="0.1" min="0" value={(anim as any).loopDelay || 0}
                        onChange={e => update({ loopDelay: parseFloat(e.target.value) || 0 } as any)}
                        className="w-14 h-5 px-1 rounded text-[10px] outline-none"
                        style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#ddd' }}
                      />
                      <span className="text-[9px]" style={{ color: '#555' }}>s</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-[1px]" style={{ backgroundColor: '#222' }} />

        {/* ── Hover Effects ── */}
        <SectionHeader label="Hover Effects" icon={<MousePointer2 className="h-3 w-3" style={{ color: '#ec4899' }} />} color="#ec4899" open={openSections.hover} onClick={() => toggle('hover')} count={HOVER_PRESETS.length} />
        <AnimatePresence>
          {openSections.hover && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
              <div className="space-y-2 pb-3">
                <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#666' }}>Quick Presets</div>
                <div className="grid grid-cols-2 gap-0.5">
                  {HOVER_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => {
                        const styles: Record<string, string> = {};
                        if (preset.transform) styles.transform = preset.transform;
                        if (preset.transition) styles.transition = preset.transition;
                        if (preset.boxShadow) styles.boxShadow = preset.boxShadow;
                        if ((preset as any).filter) styles.filter = (preset as any).filter;
                        if ((preset as any).backdropFilter) styles.backdropFilter = (preset as any).backdropFilter;
                        updateHover(styles);
                      }}
                      className="px-2 py-1.5 rounded-lg text-[9px] text-left transition-all"
                      style={{ backgroundColor: 'transparent', border: '1px solid transparent', color: '#888' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(236,72,153,0.06)'; e.currentTarget.style.borderColor = 'rgba(236,72,153,0.15)'; e.currentTarget.style.color = '#ec4899'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#888'; }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="text-[9px] font-semibold uppercase tracking-wider mt-2" style={{ color: '#666' }}>Custom</div>
                <HoverField label="BG Color" value={(selectedElement.hoverStyles?.backgroundColor as string) || ''} onChange={v => updateHover({ backgroundColor: v })} placeholder="#3b82f6" />
                <HoverField label="Color" value={(selectedElement.hoverStyles?.color as string) || ''} onChange={v => updateHover({ color: v })} placeholder="#fff" />
                <HoverField label="Transform" value={(selectedElement.hoverStyles?.transform as string) || ''} onChange={v => updateHover({ transform: v })} placeholder="scale(1.05)" />
                <HoverField label="Shadow" value={(selectedElement.hoverStyles?.boxShadow as string) || ''} onChange={v => updateHover({ boxShadow: v })} placeholder="0 4px 20px rgba(…)" />
                <HoverField label="Border" value={(selectedElement.hoverStyles?.border as string) || ''} onChange={v => updateHover({ border: v })} placeholder="1px solid #0073E6" />
                <HoverField label="Opacity" value={(selectedElement.hoverStyles?.opacity as string) || ''} onChange={v => updateHover({ opacity: v })} placeholder="0.8" />
                <HoverField label="Filter" value={(selectedElement.hoverStyles?.filter as string) || ''} onChange={v => updateHover({ filter: v })} placeholder="brightness(1.1)" />
                <HoverField label="Transition" value={(selectedElement.hoverStyles?.transition as string) || ''} onChange={v => updateHover({ transition: v })} placeholder="all 0.3s ease" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-[1px]" style={{ backgroundColor: '#222' }} />

        {/* ── Scroll Effects ── */}
        <SectionHeader label="Scroll Effects" icon={<Scroll className="h-3 w-3" style={{ color: '#a855f7' }} />} color="#a855f7" open={openSections.scroll} onClick={() => toggle('scroll')} />
        <AnimatePresence>
          {openSections.scroll && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
              <div className="space-y-2 pb-3">
                <div className="text-[8px] px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(168,85,247,0.06)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.1)' }}>
                  Scroll-linked animations activate as the user scrolls the page.
                </div>
                {[
                  { label: 'Parallax', prop: 'scrollParallax', placeholder: '0.5', desc: 'Movement speed (0.1–2)' },
                  { label: 'Rotate', prop: 'scrollRotate', placeholder: '0', desc: 'Degrees per 100px scroll' },
                  { label: 'Scale', prop: 'scrollScale', placeholder: '1', desc: 'Scale factor (0.5–1.5)' },
                  { label: 'Opacity', prop: 'scrollOpacity', placeholder: '1', desc: 'Opacity at scroll end' },
                  { label: 'Blur', prop: 'scrollBlur', placeholder: '0', desc: 'Blur amount (px)' },
                  { label: 'Move X', prop: 'scrollX', placeholder: '0', desc: 'Horizontal movement (px)' },
                ].map(field => (
                  <div key={field.prop}>
                    <HoverField label={field.label} value={(anim as any)[field.prop] || ''} onChange={v => update({ [field.prop]: v } as any)} placeholder={field.placeholder} />
                    <div className="text-[7px] pl-[72px] mt-0.5" style={{ color: '#444' }}>{field.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-[1px]" style={{ backgroundColor: '#222' }} />

        {/* ── 3D Transform ── */}
        <SectionHeader label="3D Transform" icon={<Eye className="h-3 w-3" style={{ color: '#0ea5e9' }} />} color="#0ea5e9" open={openSections.transform} onClick={() => toggle('transform')} />
        <AnimatePresence>
          {openSections.transform && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
              <div className="space-y-2 pb-3">
                <HoverField label="Perspective" value={(anim as any).perspective || ''} onChange={v => update({ perspective: v } as any)} placeholder="1000px" />
                <HoverField label="RotateX" value={(anim as any).rotateX || ''} onChange={v => update({ rotateX: v } as any)} placeholder="0deg" />
                <HoverField label="RotateY" value={(anim as any).rotateY || ''} onChange={v => update({ rotateY: v } as any)} placeholder="0deg" />
                <HoverField label="RotateZ" value={(anim as any).rotateZ || ''} onChange={v => update({ rotateZ: v } as any)} placeholder="0deg" />
                <HoverField label="TranslateZ" value={(anim as any).translateZ || ''} onChange={v => update({ translateZ: v } as any)} placeholder="0px" />
                <HoverField label="Backface" value={(anim as any).backfaceVisibility || ''} onChange={v => update({ backfaceVisibility: v } as any)} placeholder="visible" />
                <HoverField label="Style" value={(anim as any).transformStyle || ''} onChange={v => update({ transformStyle: v } as any)} placeholder="preserve-3d" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-[1px]" style={{ backgroundColor: '#222' }} />

        {/* ── Transitions ── */}
        <SectionHeader label="Transitions" icon={<Timer className="h-3 w-3" style={{ color: '#f59e0b' }} />} color="#f59e0b" open={openSections.transition} onClick={() => toggle('transition')} />
        <AnimatePresence>
          {openSections.transition && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
              <div className="space-y-2 pb-3">
                <HoverField label="Property" value={(anim as any).transitionProperty || ''} onChange={v => update({ transitionProperty: v } as any)} placeholder="all" />
                <PresetRow presets={[
                  { label: 'All', value: 'all' }, { label: 'Transform', value: 'transform' },
                  { label: 'Opacity', value: 'opacity' }, { label: 'BG Color', value: 'background-color' },
                  { label: 'Color', value: 'color' }, { label: 'Shadow', value: 'box-shadow' },
                ]} onSelect={v => update({ transitionProperty: v } as any)} currentValue={(anim as any).transitionProperty} />
                <HoverField label="Duration" value={(anim as any).transitionDuration || ''} onChange={v => update({ transitionDuration: v } as any)} placeholder="0.3s" />
                <HoverField label="Timing" value={(anim as any).transitionTiming || ''} onChange={v => update({ transitionTiming: v } as any)} placeholder="ease" />
                <PresetRow presets={[
                  { label: 'Ease', value: 'ease' }, { label: 'Linear', value: 'linear' },
                  { label: 'Ease In', value: 'ease-in' }, { label: 'Ease Out', value: 'ease-out' },
                  { label: 'Bounce', value: 'cubic-bezier(0.34,1.56,0.64,1)' },
                  { label: 'Snap', value: 'cubic-bezier(0.5,0,0,1)' },
                  { label: 'Elastic', value: 'cubic-bezier(0.68,-0.55,0.265,1.55)' },
                ]} onSelect={v => update({ transitionTiming: v } as any)} currentValue={(anim as any).transitionTiming} />
                <HoverField label="Delay" value={(anim as any).transitionDelay || ''} onChange={v => update({ transitionDelay: v } as any)} placeholder="0s" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-[1px]" style={{ backgroundColor: '#222' }} />

        {/* ── Interaction Timeline ── */}
        <SectionHeader label="Interaction Timeline" icon={<Zap className="h-3 w-3" style={{ color: '#22c55e' }} />} color="#22c55e" open={openSections.interactions} onClick={() => toggle('interactions')} count={((selectedElement.props.interactionSteps as any[]) || []).length} />
        <AnimatePresence>
          {openSections.interactions && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
              <div className="space-y-2 pb-3">
                <div className="text-[8px] px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.06)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.1)' }}>
                  Build multi-step animations — like Webflow interactions.
                </div>

                {((selectedElement.props.interactionSteps as any[]) || []).map((step: any, i: number) => (
                  <div key={i} className="p-2 rounded-lg space-y-1" style={{ backgroundColor: '#1a1a1a', border: '1px solid #252525' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>{i + 1}</div>
                        <span className="text-[9px] font-semibold" style={{ color: '#22c55e' }}>Step {i + 1}</span>
                      </div>
                      <button
                        onClick={() => {
                          const steps = [...((selectedElement.props.interactionSteps as any[]) || [])];
                          steps.splice(i, 1);
                          dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { props: { ...selectedElement.props, interactionSteps: steps } } } });
                        }}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-2.5 w-2.5 text-red-400" />
                      </button>
                    </div>
                    <HoverField label="Property" value={step.property || ''} onChange={v => {
                      const steps = [...((selectedElement.props.interactionSteps as any[]) || [])];
                      steps[i] = { ...steps[i], property: v };
                      dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { props: { ...selectedElement.props, interactionSteps: steps } } } });
                    }} placeholder="transform, opacity…" />
                    <HoverField label="From" value={step.from || ''} onChange={v => {
                      const steps = [...((selectedElement.props.interactionSteps as any[]) || [])];
                      steps[i] = { ...steps[i], from: v };
                      dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { props: { ...selectedElement.props, interactionSteps: steps } } } });
                    }} placeholder="scale(1)" />
                    <HoverField label="To" value={step.to || ''} onChange={v => {
                      const steps = [...((selectedElement.props.interactionSteps as any[]) || [])];
                      steps[i] = { ...steps[i], to: v };
                      dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { props: { ...selectedElement.props, interactionSteps: steps } } } });
                    }} placeholder="scale(1.1)" />
                    <HoverField label="Duration" value={step.duration || ''} onChange={v => {
                      const steps = [...((selectedElement.props.interactionSteps as any[]) || [])];
                      steps[i] = { ...steps[i], duration: v };
                      dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { props: { ...selectedElement.props, interactionSteps: steps } } } });
                    }} placeholder="0.3s" />
                    <HoverField label="Delay" value={step.delay || ''} onChange={v => {
                      const steps = [...((selectedElement.props.interactionSteps as any[]) || [])];
                      steps[i] = { ...steps[i], delay: v };
                      dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { props: { ...selectedElement.props, interactionSteps: steps } } } });
                    }} placeholder="0s" />
                  </div>
                ))}

                <button
                  onClick={() => {
                    const steps = [...((selectedElement.props.interactionSteps as any[]) || []), { property: '', from: '', to: '', duration: '0.3s', delay: '0s' }];
                    dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { props: { ...selectedElement.props, interactionSteps: steps } } } });
                  }}
                  className="w-full h-7 rounded-lg text-[9px] font-medium transition-all flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: '#22c55e' }}
                >
                  <Plus className="h-3 w-3" /> Add Step
                </button>

                <div className="text-[9px] font-semibold uppercase tracking-wider mt-2" style={{ color: '#666' }}>Quick Sequences</div>
                <div className="grid grid-cols-2 gap-0.5">
                  {[
                    { label: 'Scale Bounce', steps: [{ property: 'transform', from: 'scale(1)', to: 'scale(1.1)', duration: '0.2s', delay: '0s' }, { property: 'transform', from: 'scale(1.1)', to: 'scale(1)', duration: '0.2s', delay: '0.2s' }] },
                    { label: 'Fade & Slide', steps: [{ property: 'opacity', from: '0', to: '1', duration: '0.4s', delay: '0s' }, { property: 'transform', from: 'translateY(20px)', to: 'translateY(0)', duration: '0.4s', delay: '0s' }] },
                    { label: 'Color Flash', steps: [{ property: 'background-color', from: '#3b82f6', to: '#ef4444', duration: '0.3s', delay: '0s' }, { property: 'background-color', from: '#ef4444', to: '#3b82f6', duration: '0.3s', delay: '0.3s' }] },
                    { label: 'Shake', steps: [{ property: 'transform', from: 'translateX(0)', to: 'translateX(-5px)', duration: '0.1s', delay: '0s' }, { property: 'transform', from: 'translateX(-5px)', to: 'translateX(5px)', duration: '0.1s', delay: '0.1s' }, { property: 'transform', from: 'translateX(5px)', to: 'translateX(0)', duration: '0.1s', delay: '0.2s' }] },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { props: { ...selectedElement.props, interactionSteps: preset.steps } } } })}
                      className="px-2 py-1.5 rounded-lg text-[9px] text-left transition-all"
                      style={{ backgroundColor: 'transparent', color: '#888' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(34,197,94,0.06)'; e.currentTarget.style.color = '#22c55e'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#888'; }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}

function ControlRow({ label, value, onChange, suffix, min, max, step, color }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; max?: number; step?: number; color?: string;
}) {
  return (
    <div className="flex items-center gap-2 h-7">
      <span className="text-[9px] w-16 shrink-0 text-right font-medium" style={{ color: '#666' }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1"
        style={{ accentColor: color || '#0073E6' }}
      />
      <input
        type="number" step={step} min={min} max={max} value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-11 h-5 px-1 rounded text-[9px] outline-none text-center tabular-nums"
        style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#ddd' }}
      />
      {suffix && <span className="text-[8px] w-2" style={{ color: '#555' }}>{suffix}</span>}
    </div>
  );
}

function HoverField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 h-6">
      <span className="text-[9px] w-16 shrink-0 text-right font-medium" style={{ color: '#666' }}>{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-5 px-2 rounded text-[10px] outline-none"
        style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#ddd' }}
        onFocus={e => { e.currentTarget.style.borderColor = '#0073E6'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#333'; }}
      />
    </div>
  );
}

function PresetRow({ presets, onSelect, currentValue }: { presets: { label: string; value: string }[]; onSelect: (v: string) => void; currentValue?: string }) {
  return (
    <div className="flex flex-wrap gap-0.5 ml-[72px]">
      {presets.map(p => (
        <button
          key={p.value}
          onClick={() => onSelect(p.value)}
          className="h-5 px-1.5 rounded text-[8px] font-medium transition-all"
          style={{
            backgroundColor: currentValue === p.value ? 'rgba(0,115,230,0.15)' : 'transparent',
            border: `1px solid ${currentValue === p.value ? 'rgba(0,115,230,0.3)' : 'transparent'}`,
            color: currentValue === p.value ? '#0073E6' : '#888',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

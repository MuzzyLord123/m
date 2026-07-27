import { useCAD } from './CADContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { MATERIAL_PRESETS, MaterialPreset, CADMaterial } from './cadTypes';
import { Paintbrush, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

const MATERIAL_CATEGORIES = [
  {
    label: 'Brick',
    presets: ['brick-red', 'brick-brown', 'brick-white'] as MaterialPreset[],
  },
  {
    label: 'Concrete',
    presets: ['concrete', 'concrete-smooth', 'concrete-rough'] as MaterialPreset[],
  },
  {
    label: 'Glass',
    presets: ['glass', 'glass-tinted', 'glass-frosted'] as MaterialPreset[],
  },
  {
    label: 'Wood',
    presets: ['wood-oak', 'wood-walnut', 'wood-pine', 'wood-cherry'] as MaterialPreset[],
  },
  {
    label: 'Metal',
    presets: ['metal-steel', 'metal-copper', 'metal-gold', 'metal-aluminium'] as MaterialPreset[],
  },
  {
    label: 'Marble',
    presets: ['marble-white', 'marble-black', 'marble-carrara'] as MaterialPreset[],
  },
  {
    label: 'Stone',
    presets: ['stone-grey', 'stone-sandstone', 'stone-slate'] as MaterialPreset[],
  },
  {
    label: 'Tile',
    presets: ['tile-ceramic', 'tile-terracotta'] as MaterialPreset[],
  },
  {
    label: 'Finish',
    presets: ['plaster-white', 'plaster-cream', 'paint-white', 'paint-custom'] as MaterialPreset[],
  },
];

function presetLabel(p: MaterialPreset): string {
  return p.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

export function CADMaterialEditor() {
  const { state, dispatch } = useCAD();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const selectedEntities = useMemo(
    () => state.entities.filter(e => state.selectedIds.includes(e.id)),
    [state.entities, state.selectedIds]
  );

  const hasSolids = selectedEntities.some(e =>
    ['wall', 'box3d', 'column', 'rectangle', 'window', 'door', 'slab'].includes(e.type)
  );

  if (selectedEntities.length === 0 || !hasSolids) return null;

  const currentMaterial: CADMaterial = selectedEntities[0].material || MATERIAL_PRESETS['default'];

  const applyMaterial = (mat: Partial<CADMaterial>) => {
    const newMat = { ...currentMaterial, ...mat };
    selectedEntities.forEach(e => {
      dispatch({ type: 'UPDATE_ENTITY', payload: { id: e.id, changes: { material: newMat } } });
    });
  };

  const applyPreset = (preset: MaterialPreset) => {
    const mat = { ...MATERIAL_PRESETS[preset] };
    selectedEntities.forEach(e => {
      dispatch({ type: 'UPDATE_ENTITY', payload: { id: e.id, changes: { material: mat } } });
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
        style={{ maxWidth: '640px', width: 'max-content' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <Paintbrush className="h-3.5 w-3.5 text-white/50" />
          <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Material</span>
          <span className="text-[10px] text-white/30 ml-1">
            {selectedEntities.length} object{selectedEntities.length > 1 ? 's' : ''}
          </span>
          <div className="flex-1" />
          {/* Current color swatch */}
          <div
            className="h-5 w-5 rounded-md border border-white/20 shadow-inner"
            style={{ backgroundColor: currentMaterial.color }}
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-0.5 px-2 py-1.5 border-b border-white/[0.06] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {MATERIAL_CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.label
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Material presets grid */}
        {activeCategory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 py-2 border-b border-white/[0.06]"
          >
            <div className="flex flex-wrap gap-1.5">
              {MATERIAL_CATEGORIES.find(c => c.label === activeCategory)?.presets.map(preset => {
                const mat = MATERIAL_PRESETS[preset];
                const isActive = currentMaterial.preset === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white/15 ring-1 ring-white/30'
                        : 'hover:bg-white/8'
                    }`}
                  >
                    <div
                      className="h-4 w-4 rounded-[4px] border border-white/10 shadow-sm"
                      style={{
                        backgroundColor: mat.color,
                        opacity: mat.opacity,
                        boxShadow: mat.metalness > 0.5 ? `inset 0 1px 2px rgba(255,255,255,0.3)` : undefined,
                      }}
                    />
                    <span className="text-[10px] text-white/60">{presetLabel(preset)}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Fine-tune controls */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          {/* Color picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-white/30 uppercase">Color</span>
            <div className="relative">
              <input
                type="color"
                value={currentMaterial.color}
                onChange={e => applyMaterial({ color: e.target.value, preset: 'paint-custom' })}
                className="h-6 w-6 rounded cursor-pointer border-0 bg-transparent"
                style={{ padding: 0 }}
              />
            </div>
          </div>

          {/* Opacity */}
          <div className="flex items-center gap-1.5 min-w-[100px]">
            <span className="text-[9px] text-white/30 uppercase">Opacity</span>
            <Slider
              value={[currentMaterial.opacity * 100]}
              onValueChange={([v]) => applyMaterial({ opacity: v / 100 })}
              max={100} min={5} step={5}
              className="w-14"
            />
            <span className="text-[9px] text-white/50 font-mono w-6">{Math.round(currentMaterial.opacity * 100)}%</span>
          </div>

          {/* Roughness */}
          <div className="flex items-center gap-1.5 min-w-[100px]">
            <span className="text-[9px] text-white/30 uppercase">Rough</span>
            <Slider
              value={[currentMaterial.roughness * 100]}
              onValueChange={([v]) => applyMaterial({ roughness: v / 100 })}
              max={100} step={5}
              className="w-14"
            />
          </div>

          {/* Metalness */}
          <div className="flex items-center gap-1.5 min-w-[100px]">
            <span className="text-[9px] text-white/30 uppercase">Metal</span>
            <Slider
              value={[currentMaterial.metalness * 100]}
              onValueChange={([v]) => applyMaterial({ metalness: v / 100 })}
              max={100} step={5}
              className="w-14"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

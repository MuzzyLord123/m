import { useState } from 'react';
import { RenderStyle } from './SketchUpEngine';
import { cn } from '@/lib/utils';
import { Eye, Box, Grid3X3, Layers2, Sparkles, X, Sun, Moon } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  currentStyle: RenderStyle;
  onStyleChange: (style: RenderStyle) => void;
  shadowsEnabled: boolean;
  onToggleShadows: () => void;
}

const styles: { key: RenderStyle; label: string; icon: any; desc: string }[] = [
  { key: 'shaded', label: 'Shaded', icon: Box, desc: 'Standard shaded view' },
  { key: 'wireframe', label: 'Wireframe', icon: Grid3X3, desc: 'Show edges only' },
  { key: 'hidden-line', label: 'Hidden Line', icon: Layers2, desc: 'Flat shaded, no textures' },
  { key: 'xray', label: 'X-Ray', icon: Eye, desc: 'See through all geometry' },
  { key: 'textured', label: 'Textured', icon: Sparkles, desc: 'Full materials & textures' },
];

export function SketchUpStylePanel({ open, onClose, currentStyle, onStyleChange, shadowsEnabled, onToggleShadows }: Props) {
  if (!open) return null;

  return (
    <div className="fixed z-[1050] bg-[#0f0f0f]/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60"
      style={{ top: '80px', right: '16px', width: '220px' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <Eye className="h-3 w-3 text-cyan-400" />
          <span className="text-[11px] font-semibold text-white/70">Styles</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 transition-all">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="p-2 space-y-1">
        {styles.map(s => {
          const Icon = s.icon;
          const isActive = currentStyle === s.key;
          return (
            <button key={s.key}
              onClick={() => onStyleChange(s.key)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left",
                isActive ? "bg-cyan-500/10 border border-cyan-500/20" : "hover:bg-white/[0.04] border border-transparent"
              )}>
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-cyan-400" : "text-white/30")} />
              <div>
                <div className={cn("text-[10px] font-medium", isActive ? "text-cyan-300" : "text-white/60")}>{s.label}</div>
                <div className="text-[8px] text-white/20">{s.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Shadows toggle */}
      <div className="px-3 py-2 border-t border-white/[0.04]">
        <button onClick={onToggleShadows}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-[10px]",
            shadowsEnabled ? "bg-amber-500/10 text-amber-400" : "text-white/30 hover:text-white/50"
          )}>
          <Sun className="h-3 w-3" />
          <span>Shadows {shadowsEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
}

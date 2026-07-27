import { useState } from 'react';
import { useCAD } from '../CADContext';
import { SectionPlane, createSectionPlane } from './SketchUpEngine';
import { cn } from '@/lib/utils';
import { Scissors, Eye, EyeOff, Trash2, Plus, X, Move } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  sectionPlanes: SectionPlane[];
  onUpdate: (planes: SectionPlane[]) => void;
}

export function SketchUpSectionPlanePanel({ open, onClose, sectionPlanes, onUpdate }: Props) {
  const { state, dispatch } = useCAD();

  const addPlane = (axis: 'x' | 'y' | 'z') => {
    const normals = {
      x: { x: 1, y: 0, z: 0 },
      y: { x: 0, y: 1, z: 0 },
      z: { x: 0, y: 0, z: 1 },
    };
    const wp = state.worldPos || { x: 0, y: 0, z: 0 };
    const plane = createSectionPlane(wp, normals[axis], `${axis.toUpperCase()} Section`);
    onUpdate([...sectionPlanes, plane]);
    toast.success(`Section plane created on ${axis.toUpperCase()} axis`);
  };

  const togglePlane = (id: string) => {
    onUpdate(sectionPlanes.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const removePlane = (id: string) => {
    onUpdate(sectionPlanes.filter(p => p.id !== id));
  };

  if (!open) return null;

  return (
    <div className="fixed z-[1050] bg-[#0f0f0f]/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60"
      style={{ top: '80px', right: '16px', width: '240px' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <Scissors className="h-3 w-3 text-orange-400" />
          <span className="text-[11px] font-semibold text-white/70">Section Planes</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 transition-all">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="p-2 space-y-1">
        {/* Add buttons */}
        <div className="flex items-center gap-1 mb-2">
          <button onClick={() => addPlane('x')} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-red-500/10 text-red-400 text-[9px] hover:bg-red-500/20 transition-all">
            <Plus className="h-2.5 w-2.5" /> X Plane
          </button>
          <button onClick={() => addPlane('y')} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-green-500/10 text-green-400 text-[9px] hover:bg-green-500/20 transition-all">
            <Plus className="h-2.5 w-2.5" /> Y Plane
          </button>
          <button onClick={() => addPlane('z')} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-blue-500/10 text-blue-400 text-[9px] hover:bg-blue-500/20 transition-all">
            <Plus className="h-2.5 w-2.5" /> Z Plane
          </button>
        </div>

        {/* Plane list */}
        {sectionPlanes.length === 0 ? (
          <div className="text-center py-4 text-white/20 text-[9px]">No section planes</div>
        ) : (
          sectionPlanes.map(plane => (
            <div key={plane.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/[0.02] border border-white/[0.04]">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: plane.color }} />
              <span className="flex-1 text-[9px] text-white/60 truncate">{plane.name}</span>
              <button onClick={() => togglePlane(plane.id)}
                className={cn("h-5 w-5 flex items-center justify-center rounded transition-all",
                  plane.enabled ? "text-white/50 hover:text-white/80" : "text-white/20 hover:text-white/40"
                )}>
                {plane.enabled ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
              </button>
              <button onClick={() => removePlane(plane.id)}
                className="h-5 w-5 flex items-center justify-center rounded text-white/20 hover:text-red-400 transition-all">
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

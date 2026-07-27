import { useState } from 'react';
import { useCAD } from './CADContext';
import { cn } from '@/lib/utils';
import { Camera, Plus, Trash2, Play, X } from 'lucide-react';

export interface CADScene {
  id: string;
  name: string;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  cameraRadius: number;
  cameraPhi: number;
  cameraTheta: number;
  layerVisibility: Record<string, boolean>;
  timestamp: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  scenes: CADScene[];
  onScenesChange: (scenes: CADScene[]) => void;
  onActivateScene: (scene: CADScene) => void;
  currentCamera: () => { radius: number; phi: number; theta: number; target: { x: number; y: number; z: number } };
}

export function CADSceneManager({ open, onClose, scenes, onScenesChange, onActivateScene, currentCamera }: Props) {
  const { state } = useCAD();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!open) return null;

  const addScene = () => {
    const cam = currentCamera();
    const scene: CADScene = {
      id: `scene_${Date.now()}`,
      name: `Scene ${scenes.length + 1}`,
      cameraPosition: { x: 0, y: 0, z: 0 },
      cameraTarget: cam.target,
      cameraRadius: cam.radius,
      cameraPhi: cam.phi,
      cameraTheta: cam.theta,
      layerVisibility: Object.fromEntries(state.layers.map(l => [l.id, l.visible])),
      timestamp: Date.now(),
    };
    onScenesChange([...scenes, scene]);
  };

  const deleteScene = (id: string) => {
    onScenesChange(scenes.filter(s => s.id !== id));
  };

  const renameScene = (id: string) => {
    onScenesChange(scenes.map(s => s.id === id ? { ...s, name: editName } : s));
    setEditingId(null);
  };

  return (
    <div className="fixed top-[68px] right-0 w-[260px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/[0.06] z-[998] flex flex-col" style={{ bottom: '28px' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Camera className="h-3.5 w-3.5 text-[#EC4899]" />
          <span className="text-[11px] font-semibold text-white/80">Scenes</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={addScene} className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
            <Plus className="h-3 w-3" />
          </button>
          <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {scenes.length === 0 && (
          <div className="text-center text-white/20 text-[10px] py-8">
            No scenes saved yet.<br />Click + to save current view.
          </div>
        )}
        {scenes.map(scene => (
          <div
            key={scene.id}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer"
            onClick={() => onActivateScene(scene)}
          >
            <Camera className="h-3 w-3 text-[#EC4899]/50 shrink-0" />
            {editingId === scene.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => renameScene(scene.id)}
                onKeyDown={e => e.key === 'Enter' && renameScene(scene.id)}
                className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded px-1 py-0.5 text-[10px] text-white/80 outline-none"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 text-[10px] text-white/60 group-hover:text-white/80 transition-colors"
                onDoubleClick={(e) => { e.stopPropagation(); setEditingId(scene.id); setEditName(scene.name); }}
              >
                {scene.name}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); deleteScene(scene.id); }}
              className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Scene tabs preview at bottom */}
      {scenes.length > 0 && (
        <div className="border-t border-white/[0.06] px-2 py-1.5 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {scenes.map(scene => (
            <button
              key={scene.id}
              onClick={() => onActivateScene(scene)}
              className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[9px] text-white/40 hover:text-white/70 transition-colors whitespace-nowrap"
            >
              {scene.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

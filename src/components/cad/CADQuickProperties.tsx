import { useCAD } from './CADContext';
import { cn } from '@/lib/utils';
import { X, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

/**
 * Quick Properties HUD — floating panel near viewport showing
 * selected entity properties at a glance
 */
export function CADQuickProperties() {
  const { state, dispatch } = useCAD();
  const selected = state.entities.filter(e => state.selectedIds.includes(e.id));
  
  if (selected.length === 0) return null;

  const single = selected.length === 1 ? selected[0] : null;
  const layer = single ? state.layers.find(l => l.id === single.layerId) : null;

  return (
    <div className="fixed z-[997] top-[80px] left-[60px] w-[220px] bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] bg-gradient-to-r from-[#3B82F6]/[0.06] to-transparent">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse" />
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
            {selected.length > 1 ? `${selected.length} Objects` : (single?.type || '').replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
          </span>
        </div>
        <button
          onClick={() => dispatch({ type: 'DESELECT_ALL' })}
          className="text-white/20 hover:text-white/60 transition-all"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="px-3 py-2 space-y-1.5 max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {/* Multiple selection summary */}
        {selected.length > 1 && (
          <>
            <QRow label="Types" value={[...new Set(selected.map(e => e.type))].join(', ')} />
            <QRow label="Layers" value={[...new Set(selected.map(e => state.layers.find(l => l.id === e.layerId)?.name || '?'))].join(', ')} />
            <div className="flex gap-1 mt-1">
              <QBtn label="Delete" color="red" onClick={() => dispatch({ type: 'DELETE_SELECTED' })} />
              <QBtn label="Hide" color="amber" onClick={() => dispatch({ type: 'HIDE_SELECTED' })} />
              <QBtn label="Group" color="blue" onClick={() => dispatch({ type: 'CREATE_GROUP', payload: { name: `Group ${state.groups.length + 1}`, entityIds: [...state.selectedIds] } })} />
            </div>
          </>
        )}

        {/* Single entity details */}
        {single && (
          <>
            {/* Layer info */}
            {layer && (
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: layer.color }} />
                <span className="text-[9px] text-white/50">{layer.name}</span>
              </div>
            )}

            {/* Type-specific properties */}
            {single.type === 'line' && (
              <>
                <QRow label="Start" value={`${single.data.start.x.toFixed(2)}, ${single.data.start.y.toFixed(2)}`} />
                <QRow label="End" value={`${single.data.end.x.toFixed(2)}, ${single.data.end.y.toFixed(2)}`} />
                <QRow label="Length" value={Math.sqrt((single.data.end.x - single.data.start.x) ** 2 + (single.data.end.y - single.data.start.y) ** 2).toFixed(3)} accent />
              </>
            )}
            {single.type === 'line3d' && (
              <>
                <QRow label="Start" value={`${single.data.start.x.toFixed(1)}, ${single.data.start.y.toFixed(1)}, ${single.data.start.z.toFixed(1)}`} />
                <QRow label="End" value={`${single.data.end.x.toFixed(1)}, ${single.data.end.y.toFixed(1)}, ${single.data.end.z.toFixed(1)}`} />
                <QRow label="Length" value={Math.sqrt((single.data.end.x - single.data.start.x) ** 2 + (single.data.end.y - single.data.start.y) ** 2 + (single.data.end.z - single.data.start.z) ** 2).toFixed(3)} accent />
              </>
            )}
            {single.type === 'circle' && (
              <>
                <QRow label="Center" value={`${single.data.center.x.toFixed(2)}, ${single.data.center.y.toFixed(2)}`} />
                <QRow label="Radius" value={single.data.radius.toFixed(3)} accent />
                <QRow label="Area" value={(Math.PI * single.data.radius ** 2).toFixed(2)} />
              </>
            )}
            {single.type === 'rectangle' && (
              <>
                <QRow label="Size" value={`${single.data.width.toFixed(1)} × ${single.data.height.toFixed(1)}`} accent />
                <QRow label="Area" value={(single.data.width * single.data.height).toFixed(2)} />
                {single.data.extrude && <QRow label="Extrude" value={single.data.extrude.toFixed(1)} />}
              </>
            )}
            {(single.type === 'wall' || single.type === 'box3d') && (
              <>
                <QRow label="Size" value={`${single.data.width.toFixed(1)} × ${single.data.depth.toFixed(1)} × ${single.data.height.toFixed(1)}`} accent />
                <QRow label="Volume" value={(single.data.width * single.data.depth * single.data.height).toFixed(1)} />
              </>
            )}
            {single.type === 'sphere' && (
              <>
                <QRow label="Radius" value={single.data.radius.toFixed(3)} accent />
                <QRow label="Volume" value={((4 / 3) * Math.PI * single.data.radius ** 3).toFixed(1)} />
              </>
            )}
            {(single.type === 'column' || single.type === 'cylinder') && (
              <>
                <QRow label="Radius" value={single.data.radius.toFixed(3)} />
                <QRow label="Height" value={single.data.height.toFixed(1)} accent />
                <QRow label="Volume" value={(Math.PI * single.data.radius ** 2 * single.data.height).toFixed(1)} />
              </>
            )}
            {single.type === 'polyline' && (
              <>
                <QRow label="Points" value={String(single.data.points.length)} />
                <QRow label="Closed" value={single.data.closed ? 'Yes' : 'No'} />
              </>
            )}

            {/* Material info */}
            {single.material && (
              <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-white/[0.04]">
                <div className="h-3 w-3 rounded border border-white/10" style={{ backgroundColor: single.material.color }} />
                <span className="text-[9px] text-white/40 capitalize">{single.material.preset.replace(/-/g, ' ')}</span>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-white/[0.04]">
              <QBtn label="Move" color="blue" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'move' })} />
              <QBtn label="Copy" color="green" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'copy' })} />
              <QBtn label="Del" color="red" onClick={() => dispatch({ type: 'DELETE_SELECTED' })} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-white/30 uppercase tracking-wider">{label}</span>
      <span className={cn("text-[10px] font-mono", accent ? "text-[#60A5FA]" : "text-white/70")}>{value}</span>
    </div>
  );
}

function QBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const colors: Record<string, string> = {
    blue: 'text-[#60A5FA] bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20',
    green: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20',
    red: 'text-red-400 bg-red-500/10 hover:bg-red-500/20',
    amber: 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20',
  };
  return (
    <button
      onClick={onClick}
      className={cn("flex-1 px-1.5 py-0.5 rounded text-[8px] font-semibold transition-all", colors[color] || colors.blue)}
    >
      {label}
    </button>
  );
}

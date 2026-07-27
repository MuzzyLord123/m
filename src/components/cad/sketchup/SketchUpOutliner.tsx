import { useState } from 'react';
import { useCAD } from '../CADContext';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock, Trash2, X, Search, Box, Layers } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SketchUpOutliner({ open, onClose }: Props) {
  const { state, dispatch } = useCAD();
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (!open) return null;

  const toggleExpand = (id: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Group entities by their group
  const grouped = new Map<string, typeof state.entities>();
  const ungrouped: typeof state.entities = [];
  state.entities.forEach(e => {
    if (e.groupId) {
      if (!grouped.has(e.groupId)) grouped.set(e.groupId, []);
      grouped.get(e.groupId)!.push(e);
    } else {
      ungrouped.push(e);
    }
  });

  const filtered = search
    ? state.entities.filter(e => e.type.toLowerCase().includes(search.toLowerCase()) || e.id.includes(search))
    : null;

  const entityLabel = (type: string) => {
    const labels: Record<string, string> = {
      box3d: '3D Box', line3d: '3D Line', wall: 'Wall', column: 'Column',
      sphere: 'Sphere', cylinder: 'Cylinder', cone: 'Cone', pyramid: 'Pyramid',
      rectangle: 'Rectangle', circle: 'Circle', polyline: 'Polyline',
      line: 'Line', text: 'Text', dimension: 'Dimension', window: 'Window',
      door: 'Door', slab: 'Slab', stairs: 'Stairs', torus: 'Torus',
    };
    return labels[type] || type;
  };

  const renderEntity = (e: typeof state.entities[0], indent = 0) => {
    const isSelected = state.selectedIds.includes(e.id);
    const isHidden = state.hiddenEntityIds.includes(e.id);
    const layer = state.layers.find(l => l.id === e.layerId);
    return (
      <button key={e.id}
        onClick={() => dispatch({ type: 'SELECT', payload: [e.id] })}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] transition-all text-left",
          isSelected ? "bg-[#3B82F6]/10 text-[#60A5FA]" : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
        )}
        style={{ paddingLeft: `${8 + indent * 12}px` }}
      >
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: layer?.color || '#fff', opacity: 0.5 }} />
        <span className="flex-1 truncate">{entityLabel(e.type)}</span>
        {isHidden && <EyeOff className="h-2.5 w-2.5 text-white/15" />}
        {e.locked && <Lock className="h-2.5 w-2.5 text-white/15" />}
      </button>
    );
  };

  return (
    <div className="fixed z-[998] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/[0.04] flex flex-col"
      style={{ top: '68px', right: 0, bottom: '28px', width: '220px' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-amber-400" />
          <span className="text-[11px] font-semibold text-white/70">Outliner</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 transition-all">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-white/20" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter..."
            className="w-full bg-white/[0.03] border border-white/[0.04] rounded-md pl-6 pr-2 py-1 text-[9px] text-white/60 outline-none focus:border-[#3B82F6]/20 placeholder:text-white/15"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
        {filtered ? (
          // Search results
          filtered.map(e => renderEntity(e))
        ) : (
          <>
            {/* Groups */}
            {Array.from(grouped.entries()).map(([groupId, entities]) => {
              const group = state.groups.find(g => g.id === groupId);
              const expanded = expandedGroups.has(groupId);
              return (
                <div key={groupId}>
                  <button onClick={() => toggleExpand(groupId)}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[9px] text-white/50 hover:text-white/70 rounded-md hover:bg-white/[0.03] transition-all">
                    {expanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                    <Box className="h-2.5 w-2.5 text-amber-400/50" />
                    <span className="flex-1 truncate">{group?.name || 'Group'}</span>
                    <span className="text-white/20">{entities.length}</span>
                  </button>
                  {expanded && entities.map(e => renderEntity(e, 1))}
                </div>
              );
            })}
            {/* Ungrouped */}
            {ungrouped.map(e => renderEntity(e))}
          </>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-white/[0.04] text-[8px] text-white/20 text-center">
        {state.entities.length} objects • {state.groups.length} groups
      </div>
    </div>
  );
}

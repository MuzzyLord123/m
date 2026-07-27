import { useState } from 'react';
import { useCAD } from './CADContext';
import { generateId } from './cadGeometry';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { X, Plus, Package, Trash2, Edit3, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockDefinition, AnyCADEntity, BlockRefEntity, Point3D } from './cadTypes';

export function CADBlockLibrary() {
  const { state, dispatch } = useCAD();
  const [newBlockName, setNewBlockName] = useState('');
  const [search, setSearch] = useState('');

  if (!state.blockLibraryOpen) return null;

  const filteredBlocks = state.blockDefinitions.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  const createBlockFromSelection = () => {
    if (state.selectedIds.length === 0 || !newBlockName.trim()) return;
    const selected = state.entities.filter(e => state.selectedIds.includes(e.id));
    // Compute centroid as base point
    let cx = 0, cy = 0, cz = 0, count = 0;
    selected.forEach(e => {
      const d = e.data as any;
      if (d.start) { cx += d.start.x; cy += d.start.y; cz += (d.start.z || 0); count++; }
      else if (d.center) { cx += d.center.x; cy += d.center.y; count++; }
      else if (d.origin) { cx += d.origin.x; cy += d.origin.y; cz += (d.origin.z || 0); count++; }
      else if (d.base) { cx += d.base.x; cy += d.base.y; cz += d.base.z; count++; }
    });
    if (count > 0) { cx /= count; cy /= count; cz /= count; }

    const blockDef: BlockDefinition = {
      id: generateId(),
      name: newBlockName.trim(),
      basePoint: { x: cx, y: cy, z: cz },
      entities: selected.map(e => ({ ...e, id: generateId() })),
      createdAt: Date.now(),
    };

    dispatch({ type: 'ADD_BLOCK_DEFINITION', payload: blockDef });
    // Replace selected entities with a block reference
    const blockRef: BlockRefEntity = {
      id: generateId(),
      type: 'block-ref',
      layerId: state.activeLayerId,
      data: { blockId: blockDef.id, insertPoint: { x: cx, y: cy, z: cz }, scaleX: 1, scaleY: 1, scaleZ: 1, rotation: 0 },
    };
    // Remove original entities, add block ref
    dispatch({ type: 'DELETE_SELECTED' });
    dispatch({ type: 'ADD_ENTITY', payload: blockRef });
    dispatch({ type: 'ADD_COMMAND', payload: `Block "${newBlockName}" created with ${selected.length} entities` });
    setNewBlockName('');
  };

  const insertBlock = (blockDef: BlockDefinition) => {
    const insertPoint: Point3D = state.worldPos || { x: 0, y: 0, z: 0 };
    const blockRef: BlockRefEntity = {
      id: generateId(),
      type: 'block-ref',
      layerId: state.activeLayerId,
      data: { blockId: blockDef.id, insertPoint, scaleX: 1, scaleY: 1, scaleZ: 1, rotation: 0 },
    };
    dispatch({ type: 'ADD_ENTITY', payload: blockRef });
    dispatch({ type: 'ADD_COMMAND', payload: `Block "${blockDef.name}" inserted` });
  };

  const getBlockRefCount = (blockId: string) =>
    state.entities.filter(e => e.type === 'block-ref' && e.data.blockId === blockId).length;

  return (
    <div className="fixed right-[308px] top-[68px] z-[1001] w-[260px] bg-[#111] border border-white/[0.08] rounded-l-lg flex flex-col shadow-2xl"
      style={{ bottom: '28px', right: state.propertiesPanelOpen ? '300px' : '0' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-[#3B82F6]" />
          <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Block Library</span>
        </div>
        <button onClick={() => dispatch({ type: 'SET_BLOCK_LIBRARY', payload: false })} className="text-white/30 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Create from selection */}
      {state.selectedIds.length > 0 && (
        <div className="px-3 py-2 border-b border-white/[0.06] space-y-1.5">
          <span className="text-[9px] uppercase text-white/30 tracking-wider">Create from selection ({state.selectedIds.length})</span>
          <div className="flex gap-1.5">
            <Input value={newBlockName} onChange={e => setNewBlockName(e.target.value)}
              placeholder="Block name..."
              className="h-6 text-[10px] bg-[#1a1a1a] border-white/10 text-white/80 flex-1" />
            <button onClick={createBlockFromSelection}
              disabled={!newBlockName.trim()}
              className="h-6 px-2 rounded bg-[#3B82F6]/20 text-[#3B82F6] text-[10px] hover:bg-[#3B82F6]/30 disabled:opacity-30 transition-all">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-3 py-1.5">
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search blocks..."
          className="h-6 text-[10px] bg-[#1a1a1a] border-white/10 text-white/80" />
      </div>

      {/* Block list */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-1 space-y-1">
          {filteredBlocks.length === 0 && (
            <div className="text-[10px] text-white/20 text-center py-8">
              No blocks defined yet.<br />Select objects and create a block.
            </div>
          )}
          {filteredBlocks.map(block => (
            <div key={block.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer"
              onClick={() => insertBlock(block)}
            >
              <div className="h-8 w-8 rounded bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-[#3B82F6]/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white/70 truncate">{block.name}</div>
                <div className="text-[9px] text-white/30">{block.entities.length} entities · {getBlockRefCount(block.id)} refs</div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                <button onClick={e => { e.stopPropagation(); dispatch({ type: 'SET_BLOCK_EDITING', payload: block.id }); }}
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-white/10">
                  <Edit3 className="h-2.5 w-2.5 text-white/40" />
                </button>
                <button onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_BLOCK_DEFINITION', payload: block.id }); }}
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-500/20">
                  <Trash2 className="h-2.5 w-2.5 text-red-400/40" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Stats */}
      <div className="px-3 py-2 border-t border-white/[0.06] text-[9px] text-white/20 flex justify-between">
        <span>{state.blockDefinitions.length} blocks</span>
        <span>{state.entities.filter(e => e.type === 'block-ref').length} instances</span>
      </div>
    </div>
  );
}

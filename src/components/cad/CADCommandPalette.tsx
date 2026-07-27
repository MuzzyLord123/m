import { useState, useEffect, useRef } from 'react';
import { useCAD } from './CADContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateId } from './cadGeometry';
import { cn } from '@/lib/utils';
import {
  Sparkles, Search, Loader2, Zap, Box, Circle, Square, Triangle,
  Columns3, ArrowRight, Hash, Pen, Minus, Type, Ruler
} from 'lucide-react';
import type { AnyCADEntity } from './cadTypes';

const QUICK_COMMANDS = [
  { label: 'Gear (12 teeth)', prompt: 'Draw a gear with 12 teeth, module 2, at origin', icon: Hash, category: 'Mechanical' },
  { label: 'Gear (24 teeth)', prompt: 'Draw a gear with 24 teeth, module 2, at origin', icon: Hash, category: 'Mechanical' },
  { label: 'L-Bracket', prompt: 'Draw an L-shaped bracket 50x50mm with 5mm thickness', icon: ArrowRight, category: 'Mechanical' },
  { label: 'Flange (6 bolt)', prompt: 'Draw a flange with 100mm OD, 40mm ID, 6 bolt holes at 70mm PCD', icon: Circle, category: 'Mechanical' },
  { label: 'Bearing housing', prompt: 'Draw a bearing housing for a 25mm shaft with mounting feet', icon: Box, category: 'Mechanical' },
  { label: 'House floor plan', prompt: 'Draw a simple house floor plan 10m x 8m with living room, kitchen, 2 bedrooms, bathroom, and hallway', icon: Square, category: 'Architecture' },
  { label: 'Room 4x3m', prompt: 'Draw 4 walls forming a 4m x 3m room with a door and window', icon: Columns3, category: 'Architecture' },
  { label: 'Staircase', prompt: 'Draw a straight staircase with 12 steps, 170mm rise, 280mm run', icon: ArrowRight, category: 'Architecture' },
  { label: 'Grid pattern', prompt: 'Draw a 4x4 grid of circles with 20mm diameter and 30mm spacing', icon: Hash, category: 'Pattern' },
  { label: 'Hexagonal pattern', prompt: 'Draw a honeycomb pattern of 7 hexagons with 15mm radius', icon: Triangle, category: 'Pattern' },
  { label: 'Bolt pattern', prompt: 'Draw 8 circles of 5mm radius evenly spaced on a 60mm radius circle', icon: Circle, category: 'Pattern' },
  { label: 'Cross section', prompt: 'Draw an I-beam cross section: 200mm height, 100mm flange width, 8mm web, 12mm flanges', icon: Minus, category: 'Structural' },
  { label: 'Warren truss', prompt: 'Draw a Warren truss 2000mm span, 300mm height, 5 bays', icon: Triangle, category: 'Structural' },
  { label: 'Title block', prompt: 'Draw an A3 title block at origin with company name, date, scale, and drawing number fields', icon: Type, category: 'Annotation' },
  { label: 'Dimension all', prompt: 'Auto-dimension all geometry in the drawing', icon: Ruler, category: 'Annotation' },
];

export function CADCommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useCAD();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveCategory(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const filteredCommands = QUICK_COMMANDS.filter(cmd => {
    const matchesQuery = !query || cmd.label.toLowerCase().includes(query.toLowerCase()) || cmd.prompt.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !activeCategory || cmd.category === activeCategory;
    return matchesQuery && matchesCategory;
  });

  const categories = [...new Set(QUICK_COMMANDS.map(c => c.category))];

  const applyCommands = (commands: any[]) => {
    const entities: AnyCADEntity[] = [];
    commands.forEach((cmd: any) => {
      const layerId = state.activeLayerId;
      let entity: AnyCADEntity | null = null;
      switch (cmd.tool) {
        case 'line': entity = { id: generateId(), type: 'line', layerId, data: { start: cmd.params.start, end: cmd.params.end } } as AnyCADEntity; break;
        case 'circle': entity = { id: generateId(), type: 'circle', layerId, data: { center: cmd.params.center, radius: cmd.params.radius } } as AnyCADEntity; break;
        case 'rectangle': entity = { id: generateId(), type: 'rectangle', layerId, data: { origin: cmd.params.origin, width: cmd.params.width, height: cmd.params.height } } as AnyCADEntity; break;
        case 'arc': entity = { id: generateId(), type: 'arc', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'polygon': entity = { id: generateId(), type: 'polygon', layerId, data: { center: cmd.params.center, radius: cmd.params.radius, sides: cmd.params.sides, inscribed: true } } as AnyCADEntity; break;
        case 'ellipse': entity = { id: generateId(), type: 'ellipse', layerId, data: { center: cmd.params.center, radiusX: cmd.params.radiusX, radiusY: cmd.params.radiusY } } as AnyCADEntity; break;
        case 'polyline': entity = { id: generateId(), type: 'polyline', layerId, data: { points: cmd.params.points, closed: cmd.params.closed ?? false } } as AnyCADEntity; break;
        case 'box3d': entity = { id: generateId(), type: 'box3d', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'wall': entity = { id: generateId(), type: 'wall', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'column': entity = { id: generateId(), type: 'column', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'window': entity = { id: generateId(), type: 'window', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'door': entity = { id: generateId(), type: 'door', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'slab': entity = { id: generateId(), type: 'slab', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'text': entity = { id: generateId(), type: 'text', layerId, data: { position: cmd.params.position, content: cmd.params.content, fontSize: cmd.params.fontSize || 5, fontFamily: 'monospace' } } as AnyCADEntity; break;
        case 'dim-linear': case 'dimension': entity = { id: generateId(), type: 'dimension', layerId: 'layer-dims', data: { start: cmd.params.start, end: cmd.params.end, offset: cmd.params.offset || 10, text: cmd.params.text, dimType: 'linear' } } as AnyCADEntity; break;
      }
      if (entity) entities.push(entity);
    });
    if (entities.length > 0) dispatch({ type: 'ADD_ENTITIES', payload: entities });
    return entities.length;
  };

  const executeCommand = async (prompt: string) => {
    setLoading(true);
    try {
      const context = `Drawing: ${state.entities.length} entities. Units: ${state.units}. Tool: ${state.activeTool}.`;
      const actionType = prompt.toLowerCase().includes('gear') || prompt.toLowerCase().includes('bracket') || prompt.toLowerCase().includes('flange') || prompt.toLowerCase().includes('truss') || prompt.toLowerCase().includes('bolt pattern') || prompt.toLowerCase().includes('honeycomb')
        ? 'parametric-pattern' : 'natural-language';

      const { data: result, error } = await supabase.functions.invoke('cad-ai', {
        body: { action: actionType, data: { messages: [{ role: 'user', content: `Context: ${context}\n\nRequest: ${prompt}` }] } }
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      const parseJSON = (text: string) => {
        try {
          const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
          return match ? JSON.parse(match[1]) : JSON.parse(text);
        } catch { return null; }
      };

      const parsed = parseJSON(result.content);
      if (parsed?.commands?.length > 0) {
        const count = applyCommands(parsed.commands);
        toast.success(`AI created ${count} entities`, { icon: <Sparkles className="h-4 w-4" /> });
        onClose();
      } else {
        toast.info(parsed?.explanation || 'No geometry generated');
      }
    } catch (e: any) {
      toast.error(e.message || 'Command failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (query.trim()) executeCommand(query.trim());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[560px] bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          {loading ? (
            <Loader2 className="h-4 w-4 text-purple-400 animate-spin shrink-0" />
          ) : (
            <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="Type a command or describe geometry..."
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/25"
            disabled={loading}
          />
          <kbd className="text-[9px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">⌘K</kbd>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.04]">
          <button onClick={() => setActiveCategory(null)}
            className={cn("text-[10px] px-2 py-0.5 rounded-full transition-all",
              !activeCategory ? "bg-purple-500/20 text-purple-300" : "text-white/30 hover:text-white/50"
            )}>All</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn("text-[10px] px-2 py-0.5 rounded-full transition-all",
                activeCategory === cat ? "bg-purple-500/20 text-purple-300" : "text-white/30 hover:text-white/50"
              )}>{cat}</button>
          ))}
        </div>

        {/* Commands list */}
        <div className="max-h-[320px] overflow-y-auto py-1">
          {query.trim() && !filteredCommands.some(c => c.label.toLowerCase() === query.toLowerCase()) && (
            <button onClick={handleSubmit} disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-all disabled:opacity-50">
              <Zap className="h-4 w-4 text-purple-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white/80 truncate">Generate: "{query}"</p>
                <p className="text-[10px] text-white/30">AI will interpret and create geometry</p>
              </div>
              <ArrowRight className="h-3 w-3 text-white/20" />
            </button>
          )}
          {filteredCommands.map((cmd, i) => (
            <button key={i} onClick={() => executeCommand(cmd.prompt)} disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/[0.04] transition-all disabled:opacity-50">
              <cmd.icon className="h-3.5 w-3.5 text-white/30 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-white/70">{cmd.label}</p>
                <p className="text-[10px] text-white/25 truncate">{cmd.prompt}</p>
              </div>
              <span className="text-[9px] text-white/15 shrink-0">{cmd.category}</span>
            </button>
          ))}
          {filteredCommands.length === 0 && !query.trim() && (
            <p className="text-[11px] text-white/20 text-center py-6">No matching commands</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <p className="text-[9px] text-white/15">Type freely or pick a template</p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-white/15">↵ Execute</span>
            <span className="text-[9px] text-white/15">Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

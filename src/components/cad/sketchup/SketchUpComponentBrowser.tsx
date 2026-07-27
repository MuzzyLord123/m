import { useState, useMemo } from 'react';
import { useCAD } from '../CADContext';
import { getComponentLibrary, SketchUpComponent } from './SketchUpEngine';
import { AnyCADEntity, Point3D, MATERIAL_PRESETS } from '../cadTypes';
import { generateId } from '../cadGeometry';
import { cn } from '@/lib/utils';
import { Search, Box, Home, Sofa, TreePine, Package, ChevronRight, Plus, Lock, Unlock, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const categoryIcons: Record<string, any> = {
  architectural: Home,
  furniture: Sofa,
  landscape: TreePine,
  custom: Package,
};

const categoryColors: Record<string, string> = {
  architectural: '#F59E0B',
  furniture: '#A78BFA',
  landscape: '#34D399',
  custom: '#60A5FA',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SketchUpComponentBrowser({ open, onClose }: Props) {
  const { state, dispatch, addEntity } = useCAD();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customComponents, setCustomComponents] = useState<SketchUpComponent[]>([]);

  const library = useMemo(() => getComponentLibrary(), []);
  const allComponents = useMemo(() => [...library, ...customComponents], [library, customComponents]);

  const filtered = useMemo(() => {
    let items = allComponents;
    if (activeCategory !== 'all') items = items.filter(c => c.category === activeCategory);
    if (search) items = items.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    return items;
  }, [allComponents, activeCategory, search]);

  const handleInsertComponent = (component: SketchUpComponent) => {
    const wp = state.worldPos || { x: 0, y: 0, z: 0 };
    component.entities.forEach(entity => {
      const clone = JSON.parse(JSON.stringify(entity)) as AnyCADEntity;
      clone.id = generateId();
      // Offset to cursor position
      const d = clone.data as any;
      if (d.origin) {
        d.origin.x += wp.x; d.origin.y += wp.y; d.origin.z += wp.z;
      } else if (d.base) {
        d.base.x += wp.x; d.base.y += wp.y; d.base.z += wp.z;
      } else if (d.center) {
        if (typeof d.center.z === 'number') {
          d.center.x += wp.x; d.center.y += wp.y; d.center.z += wp.z;
        }
      }
      dispatch({ type: 'ADD_ENTITY', payload: clone });
    });
    toast.success(`Inserted "${component.name}"`);
    dispatch({ type: 'ADD_COMMAND', payload: `Inserted component: ${component.name}` });
  };

  const handleMakeComponent = () => {
    if (state.selectedIds.length === 0) {
      toast.error('Select geometry first');
      return;
    }
    const name = prompt('Component name:');
    if (!name) return;
    const selected = state.entities.filter(e => state.selectedIds.includes(e.id));
    const newComp: SketchUpComponent = {
      id: generateId(),
      name,
      category: 'custom',
      entities: JSON.parse(JSON.stringify(selected)),
      origin: { x: 0, y: 0, z: 0 },
      boundingBox: { width: 10, height: 10, depth: 10 },
      instanceCount: 0,
      isLocked: false,
      tags: ['custom'],
    };
    setCustomComponents(prev => [...prev, newComp]);
    toast.success(`Component "${name}" created`);
    dispatch({ type: 'ADD_COMMAND', payload: `Created component: ${name}` });
  };

  if (!open) return null;

  const categories = [
    { key: 'all', label: 'All', icon: Box },
    { key: 'architectural', label: 'Architecture', icon: Home },
    { key: 'furniture', label: 'Furniture', icon: Sofa },
    { key: 'landscape', label: 'Landscape', icon: TreePine },
    { key: 'custom', label: 'Custom', icon: Package },
  ];

  return (
    <div className="fixed right-0 z-[998] w-[280px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/[0.04] flex flex-col"
      style={{ top: '68px', bottom: '28px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]">
        <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Components</span>
        <div className="flex items-center gap-1">
          <button onClick={handleMakeComponent}
            className="h-6 w-6 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
            title="Make Component from Selection">
            <Plus className="h-3 w-3" />
          </button>
          <button onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full bg-white/[0.04] border border-white/[0.06] rounded-md pl-7 pr-2 py-1.5 text-[10px] text-white/70 outline-none focus:border-[#3B82F6]/30 placeholder:text-white/20"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-0.5 px-2 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-[9px] whitespace-nowrap transition-all",
                isActive ? "bg-white/[0.08] text-white/80" : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]"
              )}
              style={isActive && cat.key !== 'all' ? { color: categoryColors[cat.key] } : undefined}
            >
              <Icon className="h-2.5 w-2.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-white/20 text-[10px]">No components found</div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {filtered.map(comp => {
              const Icon = categoryIcons[comp.category] || Box;
              const color = categoryColors[comp.category] || '#60A5FA';
              return (
                <button
                  key={comp.id}
                  onClick={() => handleInsertComponent(comp)}
                  className="group flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.08] transition-all text-left"
                >
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: color + '12', border: `1px solid ${color}20` }}>
                    <Icon className="h-5 w-5" style={{ color: color + '90' }} />
                  </div>
                  <div className="w-full">
                    <div className="text-[9px] font-medium text-white/60 group-hover:text-white/80 truncate text-center">
                      {comp.name}
                    </div>
                    <div className="text-[7px] text-white/20 text-center mt-0.5">
                      {comp.entities.length} part{comp.entities.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/[0.04] text-[8px] text-white/20 text-center">
        {allComponents.length} components • Click to insert at cursor
      </div>
    </div>
  );
}

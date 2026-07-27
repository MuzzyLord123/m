import { useState } from 'react';
import { useCAD } from './CADContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Minus, Pen, Circle, Square, Triangle, CornerDownRight, Type, Ruler,
  MousePointer2, RulerIcon, Package, Layers, Box, Cylinder, Globe2,
  Hexagon, Pyramid, Move, RotateCcw, Scaling, FlipHorizontal2, CopyPlus,
  Scissors, CornerUpRight, Columns3, ChevronDown, ChevronRight,
  Cuboid, Hash, Spline, DoorOpen, PanelTop, Footprints, Cone,
  ArrowUpDown, Paintbrush, Spline as FollowMe, RulerIcon as TapeMeasure,
  Component, Eye, Palette, ScanLine, ListTree, Info, Film, Paintbrush as PaintBucket
} from 'lucide-react';
import { CADTool } from './cadTypes';
import { cn } from '@/lib/utils';

interface ToolCategory {
  label: string;
  color: string;
  tools: { tool: CADTool; icon: any; label: string; shortcut?: string }[];
}

const categories: ToolCategory[] = [
  {
    label: 'Select',
    color: '#60A5FA',
    tools: [
      { tool: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
    ],
  },
  {
    label: '2D Draw',
    color: '#34D399',
    tools: [
      { tool: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
      { tool: 'polyline', icon: Pen, label: 'Polyline', shortcut: 'PL' },
      { tool: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
      { tool: 'arc', icon: CornerDownRight, label: 'Arc', shortcut: 'A' },
      { tool: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'REC' },
      { tool: 'polygon', icon: Triangle, label: 'Polygon', shortcut: 'POL' },
      { tool: 'ellipse', icon: Hash, label: 'Ellipse', shortcut: 'EL' },
      { tool: 'spline', icon: Spline, label: 'Spline' },
    ],
  },
  {
    label: '3D Solid',
    color: '#A78BFA',
    tools: [
      { tool: 'box3d', icon: Box, label: '3D Box', shortcut: 'BOX' },
      { tool: 'sphere', icon: Globe2, label: 'Sphere', shortcut: 'SPH' },
      { tool: 'cylinder', icon: Cylinder, label: 'Cylinder', shortcut: 'CYL' },
      { tool: 'cone', icon: Cone, label: 'Cone', shortcut: 'CONE' },
      { tool: 'torus', icon: Hexagon, label: 'Torus', shortcut: 'TOR' },
      { tool: 'pyramid', icon: Pyramid, label: 'Pyramid', shortcut: 'PYR' },
      { tool: 'tube', icon: Cylinder, label: 'Tube', shortcut: 'TUBE' },
    ],
  },
  {
    label: 'Arch',
    color: '#F59E0B',
    tools: [
      { tool: 'wall', icon: Columns3, label: 'Wall', shortcut: 'WALL' },
      { tool: 'column', icon: Cylinder, label: 'Column', shortcut: 'COL' },
      { tool: 'slab', icon: Cuboid, label: 'Slab', shortcut: 'SLAB' },
      { tool: 'window', icon: PanelTop, label: 'Window', shortcut: 'WIN' },
      { tool: 'door', icon: DoorOpen, label: 'Door', shortcut: 'DOOR' },
      { tool: 'stairs', icon: Footprints, label: 'Stairs', shortcut: 'STA' },
    ],
  },
  {
    label: 'Note',
    color: '#22D3EE',
    tools: [
      { tool: 'text', icon: Type, label: 'Text', shortcut: 'T' },
      { tool: 'dim-linear', icon: Ruler, label: 'Linear Dim', shortcut: 'DLI' },
      { tool: 'leader', icon: Ruler, label: 'Leader', shortcut: 'LE' },
      { tool: 'measure-distance', icon: RulerIcon, label: 'Measure', shortcut: 'DIST' },
    ],
  },
  {
    label: 'Modify',
    color: '#FB923C',
    tools: [
      { tool: 'move', icon: Move, label: 'Move (Ctrl=Copy)', shortcut: 'M' },
      { tool: 'copy', icon: CopyPlus, label: 'Copy (x3 = array)', shortcut: 'CO' },
      { tool: 'rotate', icon: RotateCcw, label: 'Rotate', shortcut: 'RO' },
      { tool: 'scale', icon: Scaling, label: 'Scale', shortcut: 'SC' },
      { tool: 'mirror', icon: FlipHorizontal2, label: 'Mirror', shortcut: 'MI' },
      { tool: 'offset', icon: CornerUpRight, label: 'Offset', shortcut: 'O' },
      { tool: 'trim', icon: Scissors, label: 'Trim', shortcut: 'TR' },
      { tool: 'extrude', icon: Cuboid, label: 'Extrude', shortcut: 'EXT' },
      { tool: 'push-pull', icon: ArrowUpDown, label: 'Push/Pull', shortcut: 'P' },
    ],
  },
  {
    label: 'SketchUp',
    color: '#EC4899',
    tools: [
      { tool: 'measure-distance', icon: TapeMeasure, label: 'Tape Measure', shortcut: 'T' },
    ],
  },
];

export function CADFloatingTools() {
  const { state, dispatch } = useCAD();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (label: string) => setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));

  return (
    <div className="fixed left-0 z-[999] flex flex-col bg-[#1a1a1a] border-r border-[#333] w-12"
      style={{ top: '68px', bottom: '28px' }}
    >
      <div className="flex flex-col items-center gap-0 py-1.5 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {categories.map((cat) => {
          const isCollapsed = collapsed[cat.label];
          const hasActive = cat.tools.some(t => state.activeTool === t.tool);
          return (
            <div key={cat.label} className="w-full">
              {/* Category header */}
              <button
                onClick={() => toggle(cat.label)}
                className={cn(
                  "w-full flex items-center justify-center gap-0.5 py-1 text-[6px] uppercase tracking-[0.15em] font-bold transition-all",
                  hasActive ? "text-[#e0e0e0]" : "text-[#666] hover:text-[#999]"
                )}
                style={hasActive ? { color: cat.color } : undefined}
              >
                {isCollapsed ? <ChevronRight className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
              </button>
              
              {!isCollapsed && (
                <div className="flex flex-col items-center gap-0.5 pb-0.5">
                  {cat.tools.map(({ tool, icon: Icon, label, shortcut }) => {
                    const isActive = state.activeTool === tool;
                    return (
                      <Tooltip key={tool} delayDuration={80}>
                        <TooltipTrigger asChild>
                      <button
                            className={cn(
                              "relative h-8 w-8 flex items-center justify-center rounded transition-all duration-150 group/tool",
                              isActive
                                ? "text-white shadow-sm"
                                : "text-[#aaa] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]"
                            )}
                            style={isActive ? { backgroundColor: cat.color, boxShadow: `0 0 12px ${cat.color}30` } : undefined}
                            onClick={() => dispatch({ type: 'SET_TOOL', payload: tool })}
                          >
                            <Icon className="h-3.5 w-3.5" style={isActive ? { color: '#ffffff' } : undefined} />
                            {isActive && (
                              <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            )}
                            {shortcut && !isActive && (
                              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[6px] text-[#444] font-mono opacity-0 group-hover/tool:opacity-100 transition-opacity">
                                {shortcut}
                              </div>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={6} className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0] shadow-lg px-2.5 py-1.5">
                          <div className="flex items-center gap-2">
                            <span>{label}</span>
                            {shortcut && <span className="text-[8px] font-mono bg-[#111] px-1.5 py-0.5 rounded text-[#666]">{shortcut}</span>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
              <div className="h-px w-5 mx-auto bg-[#333]/50" />
            </div>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1 py-2 border-t border-[#333]">
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <button onClick={() => dispatch({ type: 'TOGGLE_LAYER_MANAGER' })}
              className="h-7 w-7 flex items-center justify-center rounded text-[#666] hover:text-[#aaa] hover:bg-[#2a2a2a] transition-all">
              <Layers className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">Layers (LA)</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <button onClick={() => dispatch({ type: 'TOGGLE_BLOCK_LIBRARY' })}
              className={cn("h-7 w-7 flex items-center justify-center rounded transition-all",
                state.blockLibraryOpen ? "text-[#4A90D9] bg-[#4A90D9]/10" : "text-[#666] hover:text-[#aaa] hover:bg-[#2a2a2a]"
              )}>
              <Package className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">Blocks (BL)</TooltipContent>
        </Tooltip>

        {/* SketchUp panel toggles */}
        <div className="h-px w-5 mx-auto bg-[#333] my-0.5" />
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <button onClick={() => { const fn = (window as any).__cadOpenComponentBrowser; fn?.(); }}
              className="h-7 w-7 flex items-center justify-center rounded text-[#666] hover:text-[#4A90D9] hover:bg-[#2a2a2a] transition-all">
              <Box className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">Components</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <button onClick={() => { const fn = (window as any).__cadOpenOutliner; fn?.(); }}
              className="h-7 w-7 flex items-center justify-center rounded text-[#666] hover:text-[#4A90D9] hover:bg-[#2a2a2a] transition-all">
              <ListTree className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">Outliner</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <button onClick={() => { const fn = (window as any).__cadOpenEntityInfo; fn?.(); }}
              className="h-7 w-7 flex items-center justify-center rounded text-[#666] hover:text-[#4A90D9] hover:bg-[#2a2a2a] transition-all">
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">Entity Info</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <button onClick={() => { const fn = (window as any).__cadOpenStyles; fn?.(); }}
              className="h-7 w-7 flex items-center justify-center rounded text-[#666] hover:text-[#4A90D9] hover:bg-[#2a2a2a] transition-all">
              <Palette className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">Styles</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <button onClick={() => { const fn = (window as any).__cadOpenSectionPlanes; fn?.(); }}
              className="h-7 w-7 flex items-center justify-center rounded text-[#666] hover:text-[#4A90D9] hover:bg-[#2a2a2a] transition-all">
              <ScanLine className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">Section Planes</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <button onClick={() => { const fn = (window as any).__cadOpenMaterialEditor; fn?.(); }}
              className="h-7 w-7 flex items-center justify-center rounded text-[#666] hover:text-[#4A90D9] hover:bg-[#2a2a2a] transition-all">
              <PaintBucket className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">Materials</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={80}>
          <TooltipTrigger asChild>
            <button onClick={() => { const fn = (window as any).__cadOpenSceneManager; fn?.(); }}
              className="h-7 w-7 flex items-center justify-center rounded text-[#666] hover:text-[#4A90D9] hover:bg-[#2a2a2a] transition-all">
              <Film className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">Scenes</TooltipContent>
        </Tooltip>

        {/* Active layer color swatch */}
        <div className="h-4 w-4 rounded-full border-2 border-[#444] mt-1 ring-1 ring-offset-1 ring-offset-[#1a1a1a] ring-[#444]/30"
          style={{ backgroundColor: state.layers.find(l => l.id === state.activeLayerId)?.color || '#fff' }}
        />
      </div>
    </div>
  );
}

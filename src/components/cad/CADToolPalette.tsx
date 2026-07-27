import { useState } from 'react';
import { useCAD } from './CADContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Minus, Pen, Circle, Square, Triangle, Hash, CornerDownRight, Type, Ruler, Palette,
  Move, RotateCcw, Scaling, FlipHorizontal2, Scissors, Copy, CornerUpRight,
  MousePointer2, Hand, ChevronDown,
  Box, Cylinder, Cone
} from 'lucide-react';
import { CADTool } from './cadTypes';
import { cn } from '@/lib/utils';

interface ToolGroup {
  label: string;
  tools: { tool: CADTool; icon: any; label: string; shortcut?: string }[];
}

const toolGroups: ToolGroup[] = [
  {
    label: 'Select',
    tools: [
      { tool: 'select', icon: MousePointer2, label: 'Select', shortcut: 'Esc' },
      { tool: 'pan', icon: Hand, label: 'Pan', shortcut: 'MMB' },
    ],
  },
  {
    label: 'Draw',
    tools: [
      { tool: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
      { tool: 'polyline', icon: Pen, label: 'Polyline', shortcut: 'PL' },
      { tool: 'circle', icon: Circle, label: 'Circle', shortcut: 'C' },
      { tool: 'arc', icon: CornerDownRight, label: 'Arc', shortcut: 'A' },
      { tool: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'REC' },
      { tool: 'polygon', icon: Triangle, label: 'Polygon', shortcut: 'POL' },
      { tool: 'ellipse', icon: Hash, label: 'Ellipse', shortcut: 'EL' },
    ],
  },
  {
    label: 'Modify',
    tools: [
      { tool: 'move', icon: Move, label: 'Move', shortcut: 'M' },
      { tool: 'copy', icon: Copy, label: 'Copy', shortcut: 'CO' },
      { tool: 'rotate', icon: RotateCcw, label: 'Rotate', shortcut: 'RO' },
      { tool: 'scale', icon: Scaling, label: 'Scale', shortcut: 'SC' },
      { tool: 'mirror', icon: FlipHorizontal2, label: 'Mirror', shortcut: 'MI' },
      { tool: 'offset', icon: CornerUpRight, label: 'Offset', shortcut: 'O' },
      { tool: 'trim', icon: Scissors, label: 'Trim', shortcut: 'TR' },
    ],
  },
  {
    label: 'Annotate',
    tools: [
      { tool: 'text', icon: Type, label: 'Text', shortcut: 'T' },
      { tool: 'dimension', icon: Ruler, label: 'Dimension', shortcut: 'DIM' },
    ],
  },
  {
    label: '3D Solid',
    tools: [
      { tool: 'extrude', icon: Box, label: 'Extrude' },
      { tool: 'revolve', icon: Cylinder, label: 'Revolve' },
      { tool: 'sweep', icon: Cone, label: 'Sweep' },
    ],
  },
];

export function CADToolPalette() {
  const { state, dispatch } = useCAD();

  return (
    <div className="w-12 bg-card border-r border-border flex flex-col py-1 overflow-y-auto flex-shrink-0">
      {toolGroups.map(group => (
        <div key={group.label} className="mb-1">
          <div className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider text-center py-1">
            {group.label}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            {group.tools.map(({ tool, icon: Icon, label, shortcut }) => (
              <Tooltip key={tool} delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-md",
                      state.activeTool === tool && "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    )}
                    onClick={() => dispatch({ type: 'SET_TOOL', payload: tool })}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {label}{shortcut && <span className="ml-1 text-muted-foreground">({shortcut})</span>}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      ))}

      {/* Line properties quick access */}
      <div className="mt-auto border-t border-border pt-2 flex flex-col items-center gap-1 pb-2">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button className="h-6 w-6 rounded border border-border" style={{ backgroundColor: state.layers.find(l => l.id === state.activeLayerId)?.color || '#fff' }} />
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Layer Color</TooltipContent>
        </Tooltip>
        <div className="w-6 border-b-2 border-foreground" />
        <div className="w-6 border-b-2 border-foreground border-dashed" />
        <div className="w-6 border-b-2 border-foreground border-dotted" />
      </div>
    </div>
  );
}

import { useCAD } from './CADContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  FileText, FolderOpen, Save, Download, Undo2, Redo2, Copy, Clipboard, Trash2,
  ZoomIn, ZoomOut, Maximize2, Grid3X3, Magnet, MousePointer2,
  Minus, Square, Circle, Triangle, Pen, Type, Ruler, ArrowUpRight,
  Move, RotateCcw, Scaling, FlipHorizontal2, Scissors, CornerDownRight,
  Box, Cylinder, Sparkles, Eye, Layers, Palette,
  ChevronDown, Hash
} from 'lucide-react';
import { CADTool } from './cadTypes';
import { cn } from '@/lib/utils';

function ToolBtn({ tool, icon: Icon, label, active, onClick }: {
  tool?: CADTool; icon: any; label: string; active?: boolean;
  onClick?: () => void;
}) {
  const { state, dispatch } = useCAD();
  const isActive = active ?? (tool ? state.activeTool === tool : false);
  const handleClick = onClick ?? (() => tool && dispatch({ type: 'SET_TOOL', payload: tool }));

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", isActive && "bg-primary text-primary-foreground")}
          onClick={handleClick}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

export function CADToolbar() {
  const { state, dispatch } = useCAD();

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 bg-card border-b border-border overflow-x-auto flex-shrink-0">
      {/* File */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <FileText className="h-3 w-3" /> File <ChevronDown className="h-2.5 w-2.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => dispatch({ type: 'CLEAR_ALL' })}>
            <FileText className="h-3.5 w-3.5 mr-2" /> New Drawing
          </DropdownMenuItem>
          <DropdownMenuItem><FolderOpen className="h-3.5 w-3.5 mr-2" /> Open</DropdownMenuItem>
          <DropdownMenuItem><Save className="h-3.5 w-3.5 mr-2" /> Save</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem><Download className="h-3.5 w-3.5 mr-2" /> Export SVG</DropdownMenuItem>
          <DropdownMenuItem><Download className="h-3.5 w-3.5 mr-2" /> Export PDF</DropdownMenuItem>
          <DropdownMenuItem><Download className="h-3.5 w-3.5 mr-2" /> Export PNG</DropdownMenuItem>
          <DropdownMenuItem><Download className="h-3.5 w-3.5 mr-2" /> Export DXF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Undo/Redo */}
      <ToolBtn icon={Undo2} label="Undo (Ctrl+Z)" onClick={() => dispatch({ type: 'UNDO' })} />
      <ToolBtn icon={Redo2} label="Redo (Ctrl+Y)" onClick={() => dispatch({ type: 'REDO' })} />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* View */}
      <ToolBtn tool="select" icon={MousePointer2} label="Select (Esc)" />
      <ToolBtn tool="pan" icon={Move} label="Pan (MMB)" />
      <ToolBtn icon={ZoomIn} label="Zoom In" onClick={() => dispatch({ type: 'SET_ZOOM', payload: state.zoom * 1.2 })} />
      <ToolBtn icon={ZoomOut} label="Zoom Out" onClick={() => dispatch({ type: 'SET_ZOOM', payload: state.zoom / 1.2 })} />
      <ToolBtn icon={Maximize2} label="Zoom Extents" onClick={() => { dispatch({ type: 'SET_ZOOM', payload: 1 }); dispatch({ type: 'SET_PAN', payload: { x: 0, y: 0 } }); }} />
      <ToolBtn icon={Grid3X3} label="Grid (F7)" active={state.gridVisible} onClick={() => dispatch({ type: 'TOGGLE_GRID' })} />
      <ToolBtn icon={Magnet} label="Snap (F3)" active={state.snapEnabled} onClick={() => dispatch({ type: 'TOGGLE_SNAP' })} />
      <ToolBtn icon={ArrowUpRight} label="Ortho (F8)" active={state.orthoMode} onClick={() => dispatch({ type: 'TOGGLE_ORTHO' })} />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Draw */}
      <ToolBtn tool="line" icon={Minus} label="Line (L)" />
      <ToolBtn tool="polyline" icon={Pen} label="Polyline (PL)" />
      <ToolBtn tool="circle" icon={Circle} label="Circle (C)" />
      <ToolBtn tool="rectangle" icon={Square} label="Rectangle (REC)" />
      <ToolBtn tool="polygon" icon={Triangle} label="Polygon (POL)" />
      <ToolBtn tool="ellipse" icon={Hash} label="Ellipse (EL)" />
      <ToolBtn tool="arc" icon={CornerDownRight} label="Arc (A)" />
      <ToolBtn tool="text" icon={Type} label="Text (T)" />
      <ToolBtn tool="dimension" icon={Ruler} label="Dimension (DIM)" />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Modify */}
      <ToolBtn tool="move" icon={Move} label="Move (M)" />
      <ToolBtn tool="copy" icon={Copy} label="Copy (CO)" />
      <ToolBtn tool="rotate" icon={RotateCcw} label="Rotate (RO)" />
      <ToolBtn tool="scale" icon={Scaling} label="Scale (SC)" />
      <ToolBtn tool="mirror" icon={FlipHorizontal2} label="Mirror (MI)" />
      <ToolBtn tool="trim" icon={Scissors} label="Trim (TR)" />
      <ToolBtn icon={Trash2} label="Delete (Del)" onClick={() => dispatch({ type: 'DELETE_SELECTED' })} />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* 3D */}
      <ToolBtn icon={Box} label="3D Mode" active={state.viewMode === '3d'} onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: state.viewMode === '2d' ? '3d' : '2d' })} />
      <ToolBtn tool="extrude" icon={Cylinder} label="Extrude" />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Layers */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Layers className="h-3 w-3" />
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: state.layers.find(l => l.id === state.activeLayerId)?.color }} />
            <span className="max-w-20 truncate">{state.layers.find(l => l.id === state.activeLayerId)?.name}</span>
            <ChevronDown className="h-2.5 w-2.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {state.layers.map(layer => (
            <DropdownMenuItem key={layer.id} onClick={() => dispatch({ type: 'SET_ACTIVE_LAYER', payload: layer.id })}>
              <span className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: layer.color }} />
              {layer.name}
              {layer.id === state.activeLayerId && <span className="ml-auto text-xs text-primary">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      {/* AI */}
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
        <Sparkles className="h-3 w-3" /> AI Assist
      </Button>

      {/* View mode */}
      <div className="flex items-center gap-1 ml-2">
        {['top', 'front', 'side', 'isometric'].map(v => (
          <Button
            key={v}
            variant="ghost"
            size="sm"
            className={cn("h-6 text-[10px] px-2 capitalize", state.currentView === v && "bg-accent text-accent-foreground")}
            onClick={() => dispatch({ type: 'SET_VIEW', payload: v })}
          >
            {v}
          </Button>
        ))}
      </div>
    </div>
  );
}

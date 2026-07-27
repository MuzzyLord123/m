import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCAD } from './CADContext';
import { usePortalHome } from '@/hooks/usePortalHome';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import {
  FileText, FolderOpen, Save, SaveAll, Download, Printer, Undo2, Redo2, Brain,
  Scissors, Copy, Clipboard, Trash2, CheckSquare,
  ZoomIn, ZoomOut, Maximize2, Eye, Orbit, Hand, Focus,
  Grid3X3, Magnet, ArrowUpRight,
  Minus, Square, Circle, Triangle, Pen, Type, Ruler, Hash, CornerDownRight, Spline,
  Move, RotateCcw, Scaling, FlipHorizontal2, CopyPlus, CornerUpRight, Columns3, Layers,
  Box, Cylinder, Sparkles, MousePointer2, Cuboid,
  RulerIcon, Calculator, Settings2, Wrench,
  HelpCircle, Keyboard, Info, BookOpen, Upload,
  ChevronDown, ArrowLeft, Zap, MonitorSmartphone, LayoutGrid, Gauge, Home,
  ArrowUpDown, Paintbrush, ListTree, Palette, ScanLine
} from 'lucide-react';
import { CADTool, DrawingPlane } from './cadTypes';
import { cn } from '@/lib/utils';
import { stateToProjectData, exportDXF, exportSVG, exportSTL, exportOBJ, exportJSON, importDXF, importSVG, importJSON, downloadFile } from './CADFileOperations';
import { CADProjectManager } from './CADProjectManager';
import { toast } from 'sonner';

const planeLabels: Record<DrawingPlane, string> = { xy: 'XY Floor', xz: 'XZ Wall', yz: 'YZ Side', free: 'Free 3D' };

function ToolIcon({ tool, icon: Icon, label, active, onClick, state, dispatch, accent }: {
  tool?: CADTool; icon: any; label: string; active?: boolean; onClick?: () => void;
  state: ReturnType<typeof useCAD>['state']; dispatch: ReturnType<typeof useCAD>['dispatch'];
  accent?: string;
}) {
  const isActive = active ?? (tool ? state.activeTool === tool : false);
  const handleClick = onClick ?? (() => tool && dispatch({ type: 'SET_TOOL', payload: tool }));
  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "relative h-7 w-7 flex items-center justify-center rounded transition-all duration-150",
            isActive
              ? "bg-[#4A90D9] text-white shadow-sm"
              : "text-[#aaa] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]"
          )}
          onClick={handleClick}
        >
          <Icon className={cn("h-3.5 w-3.5", accent)} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4} className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0] shadow-lg px-2.5 py-1.5">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function MenuBtn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="px-2.5 py-1 text-[11px] font-medium text-[#aaa] hover:text-[#e0e0e0] hover:bg-[#2a2a2a] rounded transition-all duration-150">
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#222]/95 backdrop-blur-2xl border-[#444] text-[#e0e0e0] min-w-[220px] shadow-2xl shadow-black/40 rounded-lg" sideOffset={2}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MI({ icon: Icon, label, shortcut, onClick, danger }: { icon?: any; label: string; shortcut?: string; onClick?: () => void; danger?: boolean }) {
  return (
    <DropdownMenuItem onClick={onClick} className={cn("text-[11px] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-[#e0e0e0] gap-2.5 rounded-md mx-1 px-2 py-1.5", danger ? "text-red-500" : "text-[#ccc]")}>
      {Icon && <Icon className={cn("h-3.5 w-3.5", danger ? "text-red-500" : "text-[#666]")} />}
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[9px] text-[#555] font-mono ml-4 bg-[#1a1a1a] px-1.5 py-0.5 rounded">{shortcut}</span>}
    </DropdownMenuItem>
  );
}

export function CADFloatingToolbar({ onExit }: { onExit?: () => void } = {}) {
  const { state, dispatch } = useCAD();
  const navigate = useNavigate();
  const portalHome = usePortalHome();
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);

  const handleImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.dxf,.svg,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const ext = file.name.split('.').pop()?.toLowerCase();
      let imported: any[] = [];
      if (ext === 'dxf') imported = importDXF(text, state.activeLayerId);
      else if (ext === 'svg') imported = importSVG(text, state.activeLayerId);
      else if (ext === 'json') {
        const data = importJSON(text);
        if (data) { dispatch({ type: 'LOAD_PROJECT', payload: data }); toast.success(`Imported ${file.name}`); return; }
      }
      if (imported.length > 0) {
        dispatch({ type: 'ADD_ENTITIES', payload: imported });
        toast.success(`Imported ${imported.length} entities from ${file.name}`);
      } else {
        toast.error('No entities found in file');
      }
    };
    input.click();
  };

  const handleExport = (format: string) => {
    const data = stateToProjectData(state);
    switch (format) {
      case 'dxf': downloadFile(exportDXF(data), 'drawing.dxf'); break;
      case 'svg': downloadFile(exportSVG(data), 'drawing.svg', 'image/svg+xml'); break;
      case 'stl': downloadFile(exportSTL(data), 'drawing.stl'); break;
      case 'obj': downloadFile(exportOBJ(data), 'drawing.obj'); break;
      case 'json': downloadFile(exportJSON(data), 'drawing.json', 'application/json'); break;
    }
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'n') { e.preventDefault(); dispatch({ type: 'CLEAR_ALL' }); return; }
        if (e.key === 'o') { e.preventDefault(); setProjectManagerOpen(true); return; }
        if (e.key === 's') { e.preventDefault(); handleExport('json'); return; }
      }
      if (e.key === 'Escape' && document.activeElement?.tagName !== 'INPUT' && state.drawingInProgress.length === 0 && state.drawingInProgress3D.length === 0) {
        onExit ? onExit() : navigate(portalHome);
      } else if (e.key === 'Escape') {
        dispatch({ type: 'CLEAR_DRAWING' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, state.drawingInProgress, state.drawingInProgress3D]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] flex flex-col">
      {/* Menu Bar Row */}
      <div className="h-8 bg-[#1a1a1a] border-b border-[#333] flex items-center px-1 gap-0">
        {/* Back button */}
        <button onClick={() => onExit ? onExit() : navigate(portalHome)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[#aaa] text-[11px] hover:text-[#e0e0e0] hover:bg-[#2a2a2a] transition-all mr-1 group"
        >
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Exit</span>
        </button>

        <div className="h-4 w-px bg-[#333] mx-0.5" />

        {/* File Menu */}
        <MenuBtn label="File">
          <MI icon={FileText} label="New Drawing" shortcut="⌘N" onClick={() => dispatch({ type: 'CLEAR_ALL' })} />
          <MI icon={FolderOpen} label="Open / Projects..." shortcut="⌘O" onClick={() => setProjectManagerOpen(true)} />
          <MI icon={Save} label="Save" shortcut="⌘S" onClick={() => handleExport('json')} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Upload} label="Import (DXF/SVG/JSON)..." onClick={handleImportFile} />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-[11px] text-[#ccc] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] rounded-md mx-1 px-2">
              <Download className="h-3.5 w-3.5 text-[#666] mr-2" /> Export
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-[#222]/95 backdrop-blur-2xl border-[#444] shadow-2xl rounded-lg">
              <MI label="DXF (AutoCAD)" onClick={() => handleExport('dxf')} />
              <MI label="SVG (Vector)" onClick={() => handleExport('svg')} />
              <MI label="STL (3D Print)" onClick={() => handleExport('stl')} />
              <MI label="OBJ (3D Mesh)" onClick={() => handleExport('obj')} />
              <MI label="JSON (Project)" onClick={() => handleExport('json')} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Printer} label="Print / Plot..." shortcut="⌘P" onClick={() => { const fn = (window as any).__cadOpenPrintPrep; fn?.(); }} />
        </MenuBtn>

        <MenuBtn label="Edit">
          <MI icon={Undo2} label="Undo" shortcut="⌘Z" onClick={() => dispatch({ type: 'UNDO' })} />
          <MI icon={Redo2} label="Redo" shortcut="⌘⇧Z" onClick={() => dispatch({ type: 'REDO' })} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Scissors} label="Cut" shortcut="⌘X" />
          <MI icon={Copy} label="Copy" shortcut="⌘C" />
          <MI icon={Clipboard} label="Paste" shortcut="⌘V" />
          <MI icon={Trash2} label="Delete" shortcut="Del" onClick={() => dispatch({ type: 'DELETE_SELECTED' })} danger />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={CheckSquare} label="Select All" shortcut="⌘A" onClick={() => dispatch({ type: 'SELECT_ALL' })} />
        </MenuBtn>

        <MenuBtn label="View">
          <MI icon={Maximize2} label="Zoom Extents" shortcut="Z E" onClick={() => { const fn = (window as any).__cadZoomExtents; fn?.(); }} />
          <MI icon={Focus} label="Zoom Selected" onClick={() => { if (state.selectedIds.length > 0) { const fn = (window as any).__cadZoomExtents; fn?.(); } else { toast.info('Select entities first to zoom to them'); } }} />
          <MI icon={Hand} label="Pan" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'pan' })} />
          <MI icon={Orbit} label="Orbit" />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-[11px] text-[#ccc] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] rounded-md mx-1 px-2">
              <Eye className="h-3.5 w-3.5 text-[#666] mr-2" /> Viewpoints
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-[#222]/95 backdrop-blur-2xl border-[#444] shadow-2xl rounded-lg">
              {['top', 'front', 'side', 'isometric'].map(v => (
                <MI key={v} label={v.charAt(0).toUpperCase() + v.slice(1)} onClick={() => { const fn = (window as any).__cadSetView; fn?.(v); }} />
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Grid3X3} label={`Grid ${state.gridVisible ? '✓' : ''}`} shortcut="F7" onClick={() => dispatch({ type: 'TOGGLE_GRID' })} />
          <MI icon={Magnet} label={`Snap ${state.snapEnabled ? '✓' : ''}`} shortcut="F3" onClick={() => dispatch({ type: 'TOGGLE_SNAP' })} />
          <MI icon={ArrowUpRight} label={`Ortho ${state.orthoMode ? '✓' : ''}`} shortcut="F8" onClick={() => dispatch({ type: 'TOGGLE_ORTHO' })} />
        </MenuBtn>

        <MenuBtn label="Draw">
          <MI icon={Minus} label="Line" shortcut="L" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'line' })} />
          <MI icon={Pen} label="Polyline" shortcut="PL" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'polyline' })} />
          <MI icon={Circle} label="Circle" shortcut="C" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'circle' })} />
          <MI icon={CornerDownRight} label="Arc" shortcut="A" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'arc' })} />
          <MI icon={Square} label="Rectangle" shortcut="REC" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'rectangle' })} />
          <MI icon={Triangle} label="Polygon" shortcut="POL" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'polygon' })} />
          <MI icon={Hash} label="Ellipse" shortcut="EL" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'ellipse' })} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Type} label="Text" shortcut="T" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'text' })} />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-[11px] text-[#ccc] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] rounded-md mx-1 px-2">
              <Ruler className="h-3.5 w-3.5 text-[#666] mr-2" /> Dimensions
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-[#222]/95 backdrop-blur-2xl border-[#444] shadow-2xl rounded-lg">
              <MI label="Linear" shortcut="DLI" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'dim-linear' })} />
              <MI label="Aligned" shortcut="DAL" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'dim-aligned' })} />
              <MI label="Angular" shortcut="DAN" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'dim-angular' })} />
              <MI label="Radial" shortcut="DRA" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'dim-radial' })} />
              <MI label="Diameter" shortcut="DDI" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'dim-diameter' })} />
              <MI label="Ordinate" shortcut="DOR" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'dim-ordinate' })} />
              <DropdownMenuSeparator className="bg-[#333] mx-2" />
              <MI label="Leader" shortcut="LE" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'leader' })} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </MenuBtn>

        <MenuBtn label="Modify">
          <MI icon={Move} label="Move" shortcut="M" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'move' })} />
          <MI icon={CopyPlus} label="Copy" shortcut="CO" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'copy' })} />
          <MI icon={RotateCcw} label="Rotate" shortcut="RO" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'rotate' })} />
          <MI icon={Scaling} label="Scale" shortcut="SC" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'scale' })} />
          <MI icon={FlipHorizontal2} label="Mirror" shortcut="MI" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'mirror' })} />
          <MI icon={CornerUpRight} label="Offset" shortcut="O" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'offset' })} />
          <MI icon={Columns3} label="Array" shortcut="AR" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'array' })} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Scissors} label="Trim" shortcut="TR" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'trim' })} />
          <MI label="Extend" shortcut="EX" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'extend' })} />
          <MI label="Fillet" shortcut="F" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'fillet' })} />
          <MI label="Chamfer" shortcut="CHA" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'chamfer' })} />
          <MI label="Explode" shortcut="X" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'explode' })} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Cuboid} label="Extrude" shortcut="EXT" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'extrude' })} />
        </MenuBtn>

        <MenuBtn label="Specialize">
          <MI icon={Home} label="Floor Plan Generator..." onClick={() => { const fn = (window as any).__cadOpenFloorPlan; fn?.(); }} />
          <MI icon={Printer} label="3D Print Preparation..." onClick={() => { const fn = (window as any).__cadOpenPrintPrep; fn?.(); }} />
          <MI icon={Sparkles} label="Generative Design Studio..." onClick={() => { const fn = (window as any).__cadOpenGenDesign; fn?.(); }} />
        </MenuBtn>

        <MenuBtn label="SketchUp">
          <MI icon={ArrowUpDown} label="Push/Pull Tool" shortcut="P" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'push-pull' })} />
          <MI icon={Paintbrush} label="Paint Bucket" onClick={() => { const fn = (window as any).__cadOpenMaterialEditor; fn?.(); }} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Box} label="Component Browser" onClick={() => { const fn = (window as any).__cadOpenComponentBrowser; fn?.(); }} />
          <MI icon={ListTree} label="Outliner" onClick={() => { const fn = (window as any).__cadOpenOutliner; fn?.(); }} />
          <MI icon={Info} label="Entity Info" onClick={() => { const fn = (window as any).__cadOpenEntityInfo; fn?.(); }} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Palette} label="Styles" onClick={() => { const fn = (window as any).__cadOpenStyles; fn?.(); }} />
          <MI icon={ScanLine} label="Section Planes" onClick={() => { const fn = (window as any).__cadOpenSectionPlanes; fn?.(); }} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Eye} label="Walkthrough Mode" onClick={() => { dispatch({ type: 'ADD_COMMAND', payload: 'Walkthrough mode activated — Use WASD to move, mouse to look around. Press Escape to exit.' }); toast.success('Walkthrough mode: WASD to move, mouse to look'); }} />
        </MenuBtn>

        <MenuBtn label="Tools">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-[11px] text-[#ccc] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] rounded-md mx-1 px-2">
              <RulerIcon className="h-3.5 w-3.5 text-[#666] mr-2" /> Measure
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-[#222]/95 backdrop-blur-2xl border-[#444] shadow-2xl rounded-lg">
              <MI label="Distance" shortcut="DIST" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'measure-distance' })} />
              <MI label="Area" shortcut="AREA" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'measure-area' })} />
              <MI label="Volume" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'measure-area' })} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <MI icon={Layers} label="Layer Manager..." shortcut="LA" onClick={() => dispatch({ type: 'TOGGLE_LAYER_MANAGER' })} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI label="Block Library..." shortcut="BL" onClick={() => dispatch({ type: 'TOGGLE_BLOCK_LIBRARY' })} />
          <MI label="Create Block" shortcut="B" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'block-create' })} />
          <MI label="Insert Block" shortcut="I" onClick={() => dispatch({ type: 'SET_TOOL', payload: 'block-insert' })} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI label="Group" shortcut="G" onClick={() => { if (state.selectedIds.length > 1) dispatch({ type: 'CREATE_GROUP', payload: { name: `Group ${state.groups.length + 1}`, entityIds: [...state.selectedIds] } }); }} />
          <MI label="Ungroup" shortcut="UG" onClick={() => { const gids = [...new Set(state.entities.filter(e => state.selectedIds.includes(e.id) && e.groupId).map(e => e.groupId!))]; gids.forEach(gid => dispatch({ type: 'DELETE_GROUP', payload: gid })); }} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI label="Isolate" onClick={() => dispatch({ type: 'ISOLATE_SELECTED' })} />
          <MI label="Hide" onClick={() => dispatch({ type: 'HIDE_SELECTED' })} />
          <MI label="Show All" onClick={() => dispatch({ type: 'SHOW_ALL' })} />
        </MenuBtn>

        <MenuBtn label="Help">
          <MI icon={BookOpen} label="Documentation" onClick={() => dispatch({ type: 'ADD_COMMAND', payload: 'CAD Studio Documentation: Use L=Line, C=Circle, REC=Rectangle, M=Move, RO=Rotate, SC=Scale, EXT=Extrude, P=Push/Pull. F3=Snap, F7=Grid, F8=Ortho. ⌘K=Command Palette.' })} />
          <MI icon={Keyboard} label="Keyboard Shortcuts" shortcut="?" onClick={() => dispatch({ type: 'ADD_COMMAND', payload: 'Shortcuts: V=Select, L=Line, PL=Polyline, C=Circle, REC=Rect, A=Arc, T=Text, M=Move, CO=Copy, RO=Rotate, SC=Scale, MI=Mirror, O=Offset, TR=Trim, EX=Extend, F=Fillet, X=Explode, P=Push/Pull, G=Group, Del=Delete, ⌘Z=Undo, ⌘⇧Z=Redo, ⌘K=Commands, Esc=Cancel' })} />
          <DropdownMenuSeparator className="bg-[#333] mx-2" />
          <MI icon={Info} label="About CAD Studio v2.0" onClick={() => toast.info('CAD Studio v2.0 — Professional 2D/3D CAD with SketchUp-style modeling, inference engine, and AI design intelligence.')} />
        </MenuBtn>

        <div className="flex-1" />

        {/* Drawing plane indicator */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono text-[#aaa] hover:text-[#e0e0e0] hover:bg-[#2a2a2a] transition-all">
              <div className={cn("h-2 w-2 rounded-full ring-1 ring-[#444]",
                state.drawingPlane === 'xy' ? 'bg-blue-500' : state.drawingPlane === 'xz' ? 'bg-red-500' : state.drawingPlane === 'yz' ? 'bg-green-500' : 'bg-purple-500'
              )} />
              {planeLabels[state.drawingPlane]}
              <ChevronDown className="h-2.5 w-2.5 opacity-40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#222]/95 backdrop-blur-2xl border-[#444] shadow-2xl rounded-lg">
            {(['free', 'xy', 'xz', 'yz'] as DrawingPlane[]).map(p => (
              <DropdownMenuItem key={p} onClick={() => dispatch({ type: 'SET_DRAWING_PLANE', payload: p })} className="text-[11px] text-[#ccc] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] rounded mx-1 px-2">
                <div className={cn("h-2 w-2 rounded-full mr-2", p === 'xy' ? 'bg-blue-500' : p === 'xz' ? 'bg-red-500' : p === 'yz' ? 'bg-green-500' : 'bg-purple-500')} />
                {planeLabels[p]}
                {state.drawingPlane === p && <span className="ml-auto text-[#4A90D9]">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Performance indicator */}
        <div className="flex items-center gap-1 px-2 text-[9px] font-mono text-[#666]">
          <Gauge className="h-2.5 w-2.5" />
          <span>{state.entities.length}</span>
        </div>
      </div>

      {/* Icon Toolbar Row */}
      <div className="h-10 bg-[#222] border-b border-[#333] flex items-center justify-center px-2">
        <div className="flex items-center gap-0.5">
          {/* Undo/Redo */}
          <ToolIcon state={state} dispatch={dispatch} icon={Undo2} label="Undo (⌘Z)" onClick={() => dispatch({ type: 'UNDO' })} />
          <ToolIcon state={state} dispatch={dispatch} icon={Redo2} label="Redo (⌘⇧Z)" onClick={() => dispatch({ type: 'REDO' })} />

          <Separator />

          {/* Select/View */}
          <ToolIcon state={state} dispatch={dispatch} tool="select" icon={MousePointer2} label="Select (V)" />
          <ToolIcon state={state} dispatch={dispatch} tool="pan" icon={Hand} label="Pan (Middle Mouse)" />
          <ToolIcon state={state} dispatch={dispatch} icon={ZoomIn} label="Zoom In" onClick={() => dispatch({ type: 'SET_ZOOM', payload: state.zoom * 1.2 })} />
          <ToolIcon state={state} dispatch={dispatch} icon={ZoomOut} label="Zoom Out" onClick={() => dispatch({ type: 'SET_ZOOM', payload: state.zoom / 1.2 })} />
          <ToolIcon state={state} dispatch={dispatch} icon={Maximize2} label="Zoom Extents (Z E)" onClick={() => { const fn = (window as any).__cadZoomExtents; fn?.(); }} />

          <Separator />

          {/* Grid/Snap/Ortho */}
          <ToolIcon state={state} dispatch={dispatch} icon={Grid3X3} label="Grid (F7)" active={state.gridVisible} onClick={() => dispatch({ type: 'TOGGLE_GRID' })} />
          <ToolIcon state={state} dispatch={dispatch} icon={Magnet} label="Snap (F3)" active={state.snapEnabled} onClick={() => dispatch({ type: 'TOGGLE_SNAP' })} />
          <ToolIcon state={state} dispatch={dispatch} icon={ArrowUpRight} label="Ortho (F8)" active={state.orthoMode} onClick={() => dispatch({ type: 'TOGGLE_ORTHO' })} />

          <Separator />

          {/* Draw */}
          <ToolIcon state={state} dispatch={dispatch} tool="line" icon={Minus} label="Line (L)" />
          <ToolIcon state={state} dispatch={dispatch} tool="polyline" icon={Pen} label="Polyline (PL)" />
          <ToolIcon state={state} dispatch={dispatch} tool="circle" icon={Circle} label="Circle (C)" />
          <ToolIcon state={state} dispatch={dispatch} tool="rectangle" icon={Square} label="Rectangle (REC)" />
          <ToolIcon state={state} dispatch={dispatch} tool="polygon" icon={Triangle} label="Polygon (POL)" />

          <Separator />

          {/* 3D */}
          <ToolIcon state={state} dispatch={dispatch} tool="line3d" icon={Sparkles} label="Line 3D (L3)" />
          <ToolIcon state={state} dispatch={dispatch} tool="box3d" icon={Box} label="3D Box" />
          <ToolIcon state={state} dispatch={dispatch} tool="sphere" icon={Circle} label="Sphere (SPH)" />
          <ToolIcon state={state} dispatch={dispatch} tool="cylinder" icon={Cylinder} label="Cylinder (CYL)" />
          <ToolIcon state={state} dispatch={dispatch} tool="wall" icon={Columns3} label="Wall (W)" />

          <Separator />

          {/* Modify */}
          <ToolIcon state={state} dispatch={dispatch} tool="move" icon={Move} label="Move (M)" />
          <ToolIcon state={state} dispatch={dispatch} tool="copy" icon={CopyPlus} label="Copy (CO)" />
          <ToolIcon state={state} dispatch={dispatch} tool="rotate" icon={RotateCcw} label="Rotate (RO)" />
          <ToolIcon state={state} dispatch={dispatch} tool="scale" icon={Scaling} label="Scale (SC)" />
          <ToolIcon state={state} dispatch={dispatch} tool="mirror" icon={FlipHorizontal2} label="Mirror (MI)" />
          <ToolIcon state={state} dispatch={dispatch} tool="extrude" icon={Cuboid} label="Extrude (EXT)" />
          <ToolIcon state={state} dispatch={dispatch} tool="push-pull" icon={ArrowUpDown} label="Push/Pull (P)" />
          <ToolIcon state={state} dispatch={dispatch} icon={Trash2} label="Delete (Del)" onClick={() => dispatch({ type: 'DELETE_SELECTED' })} />

          <Separator />

          {/* Annotation */}
          <ToolIcon state={state} dispatch={dispatch} tool="text" icon={Type} label="Text (T)" />
          <ToolIcon state={state} dispatch={dispatch} tool="dim-linear" icon={Ruler} label="Dimension (DIM)" />

          <Separator />

          {/* AI Assist — premium */}
          <Tooltip delayDuration={80}>
            <TooltipTrigger asChild>
              <button
                className="h-7 px-2.5 flex items-center gap-1.5 rounded transition-all text-[10px] font-medium text-[#aaa] hover:text-[#e0e0e0] hover:bg-[#2a2a2a]"
                onClick={() => { const fn = (window as any).__cadOpenCommandPalette; fn?.(); }}
              >
                <Zap className="h-3 w-3 text-amber-500" />
                <span className="hidden sm:inline font-mono text-[9px]">⌘K</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">Command Palette</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={80}>
            <TooltipTrigger asChild>
              <button
                 className={cn(
                  "h-7 px-2.5 flex items-center gap-1.5 rounded transition-all text-[10px] font-medium",
                  (window as any).__cadAIPanelOpen
                    ? "bg-[#4A90D9] text-white shadow-sm"
                    : "text-[#aaa] hover:text-[#e0e0e0] hover:bg-[#2a2a2a] border border-[#444]"
                )}
                onClick={() => { const fn = (window as any).__cadToggleAI; fn?.(); }}
              >
                <Brain className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AI Engine</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px] bg-[#2a2a2a] border-[#444] text-[#e0e0e0]">AI Design Intelligence</TooltipContent>
          </Tooltip>

          <Separator />

          {/* SketchUp panels */}
          <ToolIcon state={state} dispatch={dispatch} icon={Box} label="Components" onClick={() => { const fn = (window as any).__cadOpenComponentBrowser; fn?.(); }} />
          <ToolIcon state={state} dispatch={dispatch} icon={ListTree} label="Outliner" onClick={() => { const fn = (window as any).__cadOpenOutliner; fn?.(); }} />
          <ToolIcon state={state} dispatch={dispatch} icon={Info} label="Entity Info" onClick={() => { const fn = (window as any).__cadOpenEntityInfo; fn?.(); }} />
          <ToolIcon state={state} dispatch={dispatch} icon={Palette} label="Styles" onClick={() => { const fn = (window as any).__cadOpenStyles; fn?.(); }} />
          <ToolIcon state={state} dispatch={dispatch} icon={ScanLine} label="Section Planes" onClick={() => { const fn = (window as any).__cadOpenSectionPlanes; fn?.(); }} />

          <Separator />

          {/* Layer quick access */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-[#aaa] hover:text-[#e0e0e0] hover:bg-[#2a2a2a] transition-all">
                <Layers className="h-3 w-3" />
                <span className="h-2 w-2 rounded-full ring-1 ring-[#444]" style={{ backgroundColor: state.layers.find(l => l.id === state.activeLayerId)?.color }} />
                <span className="max-w-14 truncate text-[9px] font-mono">{state.layers.find(l => l.id === state.activeLayerId)?.name}</span>
                <ChevronDown className="h-2 w-2 opacity-40" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#222]/95 backdrop-blur-2xl border-[#444] shadow-2xl rounded-lg">
              {state.layers.map(layer => (
                <DropdownMenuItem key={layer.id} onClick={() => dispatch({ type: 'SET_ACTIVE_LAYER', payload: layer.id })} className="text-[11px] text-[#ccc] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] rounded mx-1 px-2">
                  <span className="h-2.5 w-2.5 rounded-full mr-2 ring-1 ring-[#444]" style={{ backgroundColor: layer.color }} />
                  {layer.name}
                  {layer.id === state.activeLayerId && <span className="ml-auto text-[#4A90D9]">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CADProjectManager open={projectManagerOpen} onOpenChange={setProjectManagerOpen} />
    </div>
  );
}

function Separator() {
  return <div className="h-5 w-px bg-[#333] mx-0.5" />;
}

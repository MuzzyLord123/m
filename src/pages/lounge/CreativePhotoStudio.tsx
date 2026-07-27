import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MousePointer2, Move, Crop, Type, Eraser, Paintbrush, Pipette,
  Square, Circle, Minus, Pen, Wand2, ZoomIn, ZoomOut, Hand, RotateCcw,
  RotateCw, Eye, EyeOff, Lock, Unlock, Plus, Trash2, Copy, Layers,
  Image, Download, Upload, Settings, Filter, Sun, Contrast, Droplets,
  ChevronDown, ChevronRight, GripVertical, Blend, Palette, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Tool = 'select' | 'move' | 'crop' | 'brush' | 'eraser' | 'text' | 'eyedropper' | 'pen' | 'shape' | 'gradient' | 'wand' | 'zoom' | 'hand';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  thumbnail: string;
  type: 'pixel' | 'text' | 'adjustment' | 'shape';
}

const TOOLS: { id: Tool; icon: any; label: string; shortcut: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Move Tool', shortcut: 'V' },
  { id: 'crop', icon: Crop, label: 'Crop Tool', shortcut: 'C' },
  { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', shortcut: 'I' },
  { id: 'brush', icon: Paintbrush, label: 'Brush Tool', shortcut: 'B' },
  { id: 'eraser', icon: Eraser, label: 'Eraser Tool', shortcut: 'E' },
  { id: 'pen', icon: Pen, label: 'Pen Tool', shortcut: 'P' },
  { id: 'text', icon: Type, label: 'Type Tool', shortcut: 'T' },
  { id: 'shape', icon: Square, label: 'Shape Tool', shortcut: 'U' },
  { id: 'gradient', icon: Blend, label: 'Gradient Tool', shortcut: 'G' },
  { id: 'wand', icon: Wand2, label: 'Magic Wand', shortcut: 'W' },
  { id: 'zoom', icon: ZoomIn, label: 'Zoom Tool', shortcut: 'Z' },
  { id: 'hand', icon: Hand, label: 'Hand Tool', shortcut: 'H' },
];

const BLEND_MODES = ['Normal', 'Multiply', 'Screen', 'Overlay', 'Darken', 'Lighten', 'Color Dodge', 'Color Burn', 'Hard Light', 'Soft Light', 'Difference', 'Exclusion', 'Hue', 'Saturation', 'Color', 'Luminosity'];

const FILTERS = ['Blur', 'Gaussian Blur', 'Sharpen', 'Unsharp Mask', 'Noise', 'Pixelate', 'Emboss', 'Find Edges'];

export default function CreativePhotoStudio() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [zoom, setZoom] = useState(100);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(12);
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushHardness, setBrushHardness] = useState(100);
  const [rightPanel, setRightPanel] = useState<'layers' | 'adjustments' | 'properties'>('layers');
  const [showFilters, setShowFilters] = useState(false);

  const [layers, setLayers] = useState<Layer[]>([
    { id: '3', name: 'Text Layer', visible: true, locked: false, opacity: 100, blendMode: 'Normal', thumbnail: '', type: 'text' },
    { id: '2', name: 'Layer 1', visible: true, locked: false, opacity: 100, blendMode: 'Normal', thumbnail: '', type: 'pixel' },
    { id: '1', name: 'Background', visible: true, locked: true, opacity: 100, blendMode: 'Normal', thumbnail: '', type: 'pixel' },
  ]);
  const [selectedLayer, setSelectedLayer] = useState('2');

  // Canvas drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 1920;
    canvas.height = 1080;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Checkerboard pattern for transparency
    const size = 10;
    for (let x = 0; x < canvas.width; x += size) {
      for (let y = 0; y < canvas.height; y += size) {
        ctx.fillStyle = (x / size + y / size) % 2 === 0 ? '#f0f0f0' : '#ffffff';
        ctx.fillRect(x, y, size, size);
      }
    }
  }, []);

  const startDraw = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'brush' && activeTool !== 'eraser') return;
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = 1920 / rect.width;
    const scaleY = 1080 / rect.height;
    lastPos.current = { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, [activeTool]);

  const draw = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !lastPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1920 / rect.width;
    const scaleY = 1080 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = activeTool === 'eraser' ? '#ffffff' : foregroundColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = brushOpacity / 100;
    ctx.stroke();
    ctx.globalAlpha = 1;
    lastPos.current = { x, y };
  }, [isDrawing, activeTool, foregroundColor, brushSize, brushOpacity]);

  const endDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const tool = TOOLS.find(t => t.shortcut.toLowerCase() === e.key.toLowerCase());
      if (tool) setActiveTool(tool.id);
      if (e.key === '=' || e.key === '+') setZoom(z => Math.min(z + 10, 3200));
      if (e.key === '-') setZoom(z => Math.max(z - 10, 5));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addLayer = () => {
    const id = Date.now().toString();
    setLayers(prev => [{ id, name: `Layer ${prev.length}`, visible: true, locked: false, opacity: 100, blendMode: 'Normal', thumbnail: '', type: 'pixel' }, ...prev]);
    setSelectedLayer(id);
  };

  const deleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayer === id) setSelectedLayer(layers.find(l => l.id !== id)?.id || '');
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-[#cccccc] overflow-hidden select-none">
      {/* ─── Menu Bar ─── */}
      <div className="h-8 bg-[#2d2d2d] border-b border-[#1a1a1a] flex items-center px-2 gap-0.5 shrink-0">
        <button onClick={() => navigate('/lounge/office/design-studio')} className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] text-[#cccccc] hover:bg-[#3d3d3d] rounded">
          <ArrowLeft className="h-3 w-3" />
        </button>
        {['File', 'Edit', 'Image', 'Layer', 'Type', 'Select', 'Filter', 'View', 'Window', 'Help'].map(menu => (
          <button key={menu} className="px-2.5 py-0.5 text-[11px] text-[#cccccc] hover:bg-[#3d3d3d] rounded transition-colors">
            {menu}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[10px] text-[#888] mr-2">Quooro Photo Studio</span>
      </div>

      {/* ─── Options Bar ─── */}
      <div className="h-9 bg-[#2d2d2d] border-b border-[#1a1a1a] flex items-center px-3 gap-3 shrink-0">
        {activeTool === 'brush' || activeTool === 'eraser' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#888]">Size:</span>
              <div className="w-24">
                <Slider value={[brushSize]} onValueChange={v => setBrushSize(v[0])} min={1} max={200} step={1} className="h-4" />
              </div>
              <span className="text-[10px] text-[#aaa] w-6">{brushSize}</span>
            </div>
            <div className="w-px h-5 bg-[#444]" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#888]">Hardness:</span>
              <div className="w-20">
                <Slider value={[brushHardness]} onValueChange={v => setBrushHardness(v[0])} min={0} max={100} step={1} className="h-4" />
              </div>
              <span className="text-[10px] text-[#aaa] w-8">{brushHardness}%</span>
            </div>
            <div className="w-px h-5 bg-[#444]" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#888]">Opacity:</span>
              <div className="w-20">
                <Slider value={[brushOpacity]} onValueChange={v => setBrushOpacity(v[0])} min={1} max={100} step={1} className="h-4" />
              </div>
              <span className="text-[10px] text-[#aaa] w-8">{brushOpacity}%</span>
            </div>
          </>
        ) : (
          <span className="text-[10px] text-[#888]">{TOOLS.find(t => t.id === activeTool)?.label} — {TOOLS.find(t => t.id === activeTool)?.shortcut}</span>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ─── Tool Panel ─── */}
        <div className="w-10 bg-[#2d2d2d] border-r border-[#1a1a1a] flex flex-col items-center py-2 gap-0.5 shrink-0">
          {TOOLS.map(tool => (
            <Tooltip key={tool.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTool(tool.id)}
                  className={cn(
                    "w-7 h-7 rounded flex items-center justify-center transition-colors",
                    activeTool === tool.id ? "bg-[#4a90d9] text-white" : "text-[#aaa] hover:bg-[#3d3d3d]"
                  )}
                >
                  <tool.icon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px]">{tool.label} ({tool.shortcut})</TooltipContent>
            </Tooltip>
          ))}

          <div className="flex-1" />

          {/* Color swatches */}
          <div className="relative w-8 h-8 mb-1">
            <input type="color" value={foregroundColor} onChange={e => setForegroundColor(e.target.value)}
              className="absolute top-0 left-0 w-5 h-5 rounded-sm border border-[#555] cursor-pointer z-10" style={{ backgroundColor: foregroundColor }}
            />
            <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-sm border border-[#555] cursor-pointer" style={{ backgroundColor: backgroundColor }}
            />
          </div>
        </div>

        {/* ─── Canvas Area ─── */}
        <div className="flex-1 bg-[#535353] overflow-auto flex items-center justify-center relative">
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#2d2d2d] rounded px-2 py-1 z-10">
            <button onClick={() => setZoom(z => Math.max(z - 10, 5))} className="text-[#aaa] hover:text-white"><ZoomOut className="h-3 w-3" /></button>
            <span className="text-[10px] text-[#aaa] w-10 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 10, 3200))} className="text-[#aaa] hover:text-white"><ZoomIn className="h-3 w-3" /></button>
          </div>
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }} className="transition-transform">
            <canvas
              ref={canvasRef}
              className="shadow-2xl border border-[#333]"
              style={{ width: 960, height: 540, cursor: activeTool === 'brush' ? 'crosshair' : activeTool === 'hand' ? 'grab' : 'default' }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
            />
          </div>
        </div>

        {/* ─── Right Panels ─── */}
        <div className="w-72 bg-[#2d2d2d] border-l border-[#1a1a1a] flex flex-col shrink-0 overflow-hidden">
          {/* Panel Tabs */}
          <div className="flex border-b border-[#1a1a1a] shrink-0">
            {(['layers', 'adjustments', 'properties'] as const).map(tab => (
              <button key={tab} onClick={() => setRightPanel(tab)}
                className={cn("flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  rightPanel === tab ? "text-white border-b border-[#4a90d9]" : "text-[#888] hover:text-[#aaa]"
                )}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-none">
            {rightPanel === 'layers' && (
              <div className="flex flex-col h-full">
                {/* Blend mode + opacity */}
                <div className="p-2 border-b border-[#1a1a1a] space-y-2">
                  <select className="w-full bg-[#3d3d3d] border border-[#555] rounded text-[11px] text-[#ccc] px-2 py-1">
                    {BLEND_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#888] w-12">Opacity:</span>
                    <Slider value={[layers.find(l => l.id === selectedLayer)?.opacity || 100]}
                      onValueChange={v => setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, opacity: v[0] } : l))}
                      min={0} max={100} className="flex-1 h-3" />
                    <span className="text-[10px] text-[#aaa] w-8">{layers.find(l => l.id === selectedLayer)?.opacity || 100}%</span>
                  </div>
                </div>

                {/* Layer list */}
                <div className="flex-1 overflow-y-auto">
                  {layers.map(layer => (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer.id)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 border-b border-[#1a1a1a] cursor-pointer transition-colors",
                        selectedLayer === layer.id ? "bg-[#3d5a80]" : "hover:bg-[#353535]"
                      )}
                    >
                      <button onClick={e => { e.stopPropagation(); setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l)); }}>
                        {layer.visible ? <Eye className="h-3 w-3 text-[#aaa]" /> : <EyeOff className="h-3 w-3 text-[#555]" />}
                      </button>
                      <div className="w-8 h-8 rounded border border-[#444] bg-[#535353] flex items-center justify-center shrink-0">
                        {layer.type === 'text' ? <Type className="h-3 w-3 text-[#aaa]" /> :
                         layer.type === 'adjustment' ? <Sun className="h-3 w-3 text-[#aaa]" /> :
                         <Image className="h-3 w-3 text-[#666]" />}
                      </div>
                      <span className="text-[11px] text-[#ccc] flex-1 truncate">{layer.name}</span>
                      {layer.locked && <Lock className="h-3 w-3 text-[#666]" />}
                    </div>
                  ))}
                </div>

                {/* Layer actions */}
                <div className="flex items-center gap-0.5 p-1 border-t border-[#1a1a1a] shrink-0">
                  <Tooltip delayDuration={0}><TooltipTrigger asChild>
                    <button onClick={addLayer} className="h-6 w-6 flex items-center justify-center text-[#aaa] hover:text-white hover:bg-[#3d3d3d] rounded">
                      <Plus className="h-3 w-3" />
                    </button>
                  </TooltipTrigger><TooltipContent className="text-[10px]">New Layer</TooltipContent></Tooltip>
                  <Tooltip delayDuration={0}><TooltipTrigger asChild>
                    <button onClick={() => deleteLayer(selectedLayer)} className="h-6 w-6 flex items-center justify-center text-[#aaa] hover:text-white hover:bg-[#3d3d3d] rounded">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </TooltipTrigger><TooltipContent className="text-[10px]">Delete Layer</TooltipContent></Tooltip>
                  <Tooltip delayDuration={0}><TooltipTrigger asChild>
                    <button className="h-6 w-6 flex items-center justify-center text-[#aaa] hover:text-white hover:bg-[#3d3d3d] rounded">
                      <Copy className="h-3 w-3" />
                    </button>
                  </TooltipTrigger><TooltipContent className="text-[10px]">Duplicate Layer</TooltipContent></Tooltip>
                </div>
              </div>
            )}

            {rightPanel === 'adjustments' && (
              <div className="p-3 space-y-3">
                {[
                  { label: 'Brightness', icon: Sun, value: 0, min: -100, max: 100 },
                  { label: 'Contrast', icon: Contrast, value: 0, min: -100, max: 100 },
                  { label: 'Saturation', icon: Droplets, value: 0, min: -100, max: 100 },
                  { label: 'Exposure', icon: Sun, value: 0, min: -5, max: 5 },
                  { label: 'Highlights', icon: Sun, value: 0, min: -100, max: 100 },
                  { label: 'Shadows', icon: Sun, value: 0, min: -100, max: 100 },
                  { label: 'Temperature', icon: Sun, value: 0, min: -100, max: 100 },
                  { label: 'Tint', icon: Palette, value: 0, min: -100, max: 100 },
                ].map(adj => (
                  <div key={adj.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#888]">{adj.label}</span>
                      <span className="text-[10px] text-[#aaa]">{adj.value}</span>
                    </div>
                    <Slider defaultValue={[adj.value]} min={adj.min} max={adj.max} className="h-3" />
                  </div>
                ))}

                <div className="pt-2 border-t border-[#1a1a1a]">
                  <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-[11px] text-[#aaa] hover:text-white w-full py-1">
                    <Filter className="h-3 w-3" />
                    <span>Filters</span>
                    <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform", showFilters && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden">
                        <div className="space-y-0.5 pt-1">
                          {FILTERS.map(f => (
                            <button key={f} className="w-full text-left px-2 py-1 text-[11px] text-[#aaa] hover:text-white hover:bg-[#3d3d3d] rounded transition-colors">
                              {f}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {rightPanel === 'properties' && (
              <div className="p-3 space-y-3">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">Document</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-[9px] text-[#666]">Width</span><Input defaultValue="1920" className="h-6 text-[10px] bg-[#3d3d3d] border-[#555] text-[#ccc]" /></div>
                    <div><span className="text-[9px] text-[#666]">Height</span><Input defaultValue="1080" className="h-6 text-[10px] bg-[#3d3d3d] border-[#555] text-[#ccc]" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-[9px] text-[#666]">Resolution</span><Input defaultValue="72" className="h-6 text-[10px] bg-[#3d3d3d] border-[#555] text-[#ccc]" /></div>
                    <div><span className="text-[9px] text-[#666]">Color Mode</span><Input defaultValue="RGB" className="h-6 text-[10px] bg-[#3d3d3d] border-[#555] text-[#ccc]" readOnly /></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold text-[#888] uppercase tracking-wider">Color</h4>
                  <div className="w-full aspect-square bg-gradient-to-br from-white via-transparent to-black rounded border border-[#444] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" style={{ background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, ${foregroundColor})` }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#666]">Hex</span>
                    <Input value={foregroundColor} onChange={e => setForegroundColor(e.target.value)} className="h-6 text-[10px] bg-[#3d3d3d] border-[#555] text-[#ccc] flex-1" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Status Bar ─── */}
      <div className="h-6 bg-[#2d2d2d] border-t border-[#1a1a1a] flex items-center px-3 gap-4 shrink-0">
        <span className="text-[10px] text-[#888]">1920 × 1080 px</span>
        <span className="text-[10px] text-[#888]">72 ppi</span>
        <span className="text-[10px] text-[#888]">RGB/8</span>
        <div className="flex-1" />
        <span className="text-[10px] text-[#888]">{zoom}%</span>
      </div>
    </div>
  );
}

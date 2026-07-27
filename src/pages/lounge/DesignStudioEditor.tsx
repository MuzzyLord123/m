import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MousePointer2, Type, Square, Circle, Minus,
  Undo2, Redo2, ZoomIn, ZoomOut, Download, Trash2, Copy, Layers, Lock,
  Unlock, Eye, EyeOff, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline,
  Plus, RotateCw, FlipHorizontal, FlipVertical, Triangle,
  Star, ArrowRight, Grid3X3, Magnet, ChevronDown, ChevronRight,
  Sparkles, Settings2, Share2, MoreHorizontal, Save,
  Image, Upload, Search, Palette, PenTool, Hand, Hexagon,
  Heart, CloudLightning, Wand2, Frame, FileText, Folder,
  LayoutTemplate, Paintbrush, Sliders, AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter, AlignStartVertical, AlignEndVertical,
  AlignStartHorizontal, AlignEndHorizontal, GripVertical,
  ChevronLeft, X, Check, Maximize2, PanelLeft, PanelRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────
type ToolType = 'select' | 'text' | 'rect' | 'circle' | 'triangle' | 'star' | 'line' | 'arrow' | 'hand' | 'pen';
type LeftPanel = 'none' | 'templates' | 'elements' | 'uploads' | 'text' | 'brand' | 'more';
type RightTab = 'design' | 'layers' | 'animate';

interface DesignElement {
  id: string;
  type: 'rect' | 'circle' | 'triangle' | 'star' | 'text' | 'image' | 'line' | 'arrow';
  x: number; y: number; width: number; height: number;
  rotation: number; fill: string; stroke: string; strokeWidth: number; opacity: number;
  text?: string; fontSize?: number; fontFamily?: string; fontWeight?: string;
  fontStyle?: string; textDecoration?: string; textAlign?: string;
  lineHeight?: number; letterSpacing?: number; borderRadius?: number;
  locked?: boolean; visible?: boolean; name: string;
  shadow?: { x: number; y: number; blur: number; color: string };
  blur?: number;
  imageUrl?: string;
}

interface Page {
  id: string;
  name: string;
  elements: DesignElement[];
  bgColor: string;
}

const PALETTE = [
  '#000000', '#3C3C43', '#636366', '#8E8E93', '#AEAEB2', '#C7C7CC', '#D1D1D6', '#E5E5EA', '#F2F2F7', '#FFFFFF',
  '#FF3B30', '#FF6482', '#FF2D55', '#FF9500', '#FFCC00', '#34C759', '#30D158', '#00C7BE', '#007AFF', '#5856D6',
  '#AF52DE', '#BF5AF2', '#AC8E68', '#8E8E93',
];

const EXTENDED_FONTS = [
  'Inter', 'Space Grotesk', 'SF Pro Display', 'Georgia', 'Courier New', 'Arial', 'Helvetica',
  'Times New Roman', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Palatino',
  'Garamond', 'Bookman', 'Avant Garde', 'Gill Sans',
];

const CANVAS_PRESETS = [
  { label: 'Instagram Post', w: 1080, h: 1080, icon: '◻', cat: 'Social' },
  { label: 'Instagram Story', w: 1080, h: 1920, icon: '▯', cat: 'Social' },
  { label: 'Facebook Cover', w: 820, h: 312, icon: '▬', cat: 'Social' },
  { label: 'Facebook Post', w: 940, h: 788, icon: '◻', cat: 'Social' },
  { label: 'YouTube Thumbnail', w: 1280, h: 720, icon: '▭', cat: 'Video' },
  { label: 'Presentation 16:9', w: 1920, h: 1080, icon: '▭', cat: 'Present' },
  { label: 'Presentation 4:3', w: 1024, h: 768, icon: '▭', cat: 'Present' },
  { label: 'A4 Portrait', w: 794, h: 1123, icon: '▯', cat: 'Print' },
  { label: 'A4 Landscape', w: 1123, h: 794, icon: '▭', cat: 'Print' },
  { label: 'Letter', w: 816, h: 1056, icon: '▯', cat: 'Print' },
  { label: 'Business Card', w: 1050, h: 600, icon: '▬', cat: 'Print' },
  { label: 'Twitter / X Post', w: 1200, h: 675, icon: '▭', cat: 'Social' },
  { label: 'LinkedIn Banner', w: 1584, h: 396, icon: '▬', cat: 'Social' },
  { label: 'Pinterest Pin', w: 1000, h: 1500, icon: '▯', cat: 'Social' },
  { label: 'Logo', w: 500, h: 500, icon: '◻', cat: 'Other' },
  { label: 'Email Header', w: 600, h: 200, icon: '▬', cat: 'Other' },
];

const TEMPLATE_ITEMS = [
  { name: 'Minimal Pitch', cat: 'Presentation', color: 'from-slate-200 to-slate-100' },
  { name: 'Bold Social', cat: 'Social Media', color: 'from-pink-200 to-rose-100' },
  { name: 'Modern Resume', cat: 'Resume', color: 'from-blue-200 to-indigo-100' },
  { name: 'Event Poster', cat: 'Poster', color: 'from-orange-200 to-amber-100' },
  { name: 'Business Flyer', cat: 'Flyer', color: 'from-green-200 to-emerald-100' },
  { name: 'Newsletter', cat: 'Email', color: 'from-cyan-200 to-sky-100' },
  { name: 'Brand Identity', cat: 'Branding', color: 'from-violet-200 to-purple-100' },
  { name: 'YouTube Cover', cat: 'Video', color: 'from-red-200 to-rose-100' },
  { name: 'Thank You Card', cat: 'Card', color: 'from-amber-200 to-yellow-100' },
  { name: 'Menu Design', cat: 'Print', color: 'from-teal-200 to-emerald-100' },
  { name: 'Infographic', cat: 'Presentation', color: 'from-indigo-200 to-blue-100' },
  { name: 'Photo Collage', cat: 'Photo', color: 'from-fuchsia-200 to-pink-100' },
];

const SHAPE_ELEMENTS = [
  { type: 'rect' as const, label: 'Rectangle', icon: Square },
  { type: 'circle' as const, label: 'Circle', icon: Circle },
  { type: 'triangle' as const, label: 'Triangle', icon: Triangle },
  { type: 'star' as const, label: 'Star', icon: Star },
  { type: 'line' as const, label: 'Line', icon: Minus },
  { type: 'arrow' as const, label: 'Arrow', icon: ArrowRight },
];

const TEXT_PRESETS = [
  { label: 'Add a heading', fontSize: 48, fontWeight: '700', fontFamily: 'Inter' },
  { label: 'Add a subheading', fontSize: 28, fontWeight: '600', fontFamily: 'Inter' },
  { label: 'Add body text', fontSize: 16, fontWeight: '400', fontFamily: 'Inter' },
  { label: 'Add a caption', fontSize: 12, fontWeight: '400', fontFamily: 'Inter' },
];

let _c = 0;
const uid = () => `e${++_c}_${Date.now()}`;
let _pc = 0;
const pageId = () => `p${++_pc}_${Date.now()}`;

export default function DesignStudio() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Canvas
  const [canvasW, setCanvasW] = useState(1080);
  const [canvasH, setCanvasH] = useState(1080);
  const [zoom, setZoom] = useState(0.45);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);

  // Tools & selection
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leftPanel, setLeftPanel] = useState<LeftPanel>('none');
  const [rightTab, setRightTab] = useState<RightTab>('design');
  const [showPages, setShowPages] = useState(true);

  // Pages
  const [pages, setPages] = useState<Page[]>([{
    id: pageId(), name: 'Page 1', elements: [], bgColor: '#FFFFFF'
  }]);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const activePage = pages[activePageIdx];
  const elements = activePage.elements;

  // History per page
  const [history, setHistory] = useState<DesignElement[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragElementStart, setDragElementStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, ex: 0, ey: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, px: 0, py: 0 });
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [designName, setDesignName] = useState('Untitled Design');
  const [snapLines, setSnapLines] = useState<{x?: number; y?: number}[]>([]);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  const selectedId = selectedIds[0] || null;
  const selected = useMemo(() => elements.find(e => e.id === selectedId) || null, [elements, selectedId]);

  const setElements = useCallback((newEls: DesignElement[] | ((prev: DesignElement[]) => DesignElement[])) => {
    setPages(prev => prev.map((p, i) => i === activePageIdx
      ? { ...p, elements: typeof newEls === 'function' ? newEls(p.elements) : newEls }
      : p
    ));
  }, [activePageIdx]);

  // ─── History ────────────────────────────────────────
  const pushHistory = useCallback((newEls: DesignElement[]) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), newEls]);
    setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx > 0) { setHistoryIdx(historyIdx - 1); setElements(history[historyIdx - 1]); }
  }, [historyIdx, history, setElements]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) { setHistoryIdx(historyIdx + 1); setElements(history[historyIdx + 1]); }
  }, [historyIdx, history, setElements]);

  // ─── Keys ─────────────────────────────────────────
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spaceHeld) { e.preventDefault(); setSpaceHeld(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); toast.success('Design saved!'); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName || '')) { e.preventDefault(); deleteSelected(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
      if (e.key === 'v' && !e.metaKey && !e.ctrlKey) setActiveTool('select');
      if (e.key === 't' && !e.metaKey && !e.ctrlKey) setActiveTool('text');
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) setActiveTool('rect');
      if (e.key === 'o' && !e.metaKey && !e.ctrlKey) setActiveTool('circle');
      if (e.key === 'l' && !e.metaKey && !e.ctrlKey) setActiveTool('line');
      if (e.key === 'h' && !e.metaKey && !e.ctrlKey) setActiveTool('hand');
    };
    const ku = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceHeld(false); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [spaceHeld, selectedId, undo, redo]);

  // ─── URL params ────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = parseInt(params.get('w') || ''); const h = parseInt(params.get('h') || '');
    if (w > 0) setCanvasW(w); if (h > 0) setCanvasH(h);
  }, []);

  // ─── Element Ops ───────────────────────────────
  const addElement = useCallback((type: DesignElement['type'], overrides?: Partial<DesignElement>) => {
    const id = uid();
    const base = { x: canvasW / 2 - 75, y: canvasH / 2 - 75, width: 150, height: 150, rotation: 0, opacity: 1, stroke: 'transparent', strokeWidth: 0, borderRadius: 0 };
    const defs: Record<string, Partial<DesignElement>> = {
      rect: { fill: '#007AFF', name: 'Rectangle', width: 200, height: 150, borderRadius: 12 },
      circle: { fill: '#AF52DE', name: 'Ellipse', width: 150, height: 150, borderRadius: 9999 },
      triangle: { fill: '#FF9500', name: 'Triangle' },
      star: { fill: '#FF3B30', name: 'Star' },
      text: { fill: '#000000', name: 'Text', width: 280, height: 52, text: 'Add heading', fontSize: 36, fontFamily: 'Inter', fontWeight: '600', fontStyle: 'normal', textDecoration: 'none', textAlign: 'left', lineHeight: 1.3, letterSpacing: -0.5 },
      line: { fill: 'transparent', stroke: '#3C3C43', strokeWidth: 2, name: 'Line', width: 200, height: 4 },
      arrow: { fill: 'transparent', stroke: '#3C3C43', strokeWidth: 2, name: 'Arrow', width: 200, height: 4 },
    };
    const el = { ...base, ...defs[type], ...overrides, id, type } as DesignElement;
    const next = [...elements, el];
    setElements(next); pushHistory(next); setSelectedIds([id]); setActiveTool('select');
  }, [elements, canvasW, canvasH, pushHistory, setElements]);

  const updateElement = useCallback((id: string, u: Partial<DesignElement>) => {
    setElements(els => els.map(e => e.id === id ? { ...e, ...u } : e));
  }, [setElements]);

  const commitUpdate = useCallback(() => pushHistory(elements), [elements, pushHistory]);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const next = elements.filter(e => !selectedIds.includes(e.id));
    setElements(next); pushHistory(next); setSelectedIds([]);
  }, [selectedIds, elements, pushHistory, setElements]);

  const duplicateSelected = useCallback(() => {
    if (!selected) return;
    const dup = { ...selected, id: uid(), x: selected.x + 20, y: selected.y + 20, name: selected.name + ' copy' };
    const next = [...elements, dup];
    setElements(next); pushHistory(next); setSelectedIds([dup.id]);
  }, [selected, elements, pushHistory, setElements]);

  const moveLayer = useCallback((id: string, dir: 'up' | 'down' | 'top' | 'bottom') => {
    const idx = elements.findIndex(e => e.id === id);
    if (idx === -1) return;
    const next = [...elements]; const [el] = next.splice(idx, 1);
    if (dir === 'top') next.push(el);
    else if (dir === 'bottom') next.unshift(el);
    else if (dir === 'up' && idx < next.length) next.splice(idx + 1, 0, el);
    else if (dir === 'down' && idx > 0) next.splice(idx - 1, 0, el);
    else next.splice(idx, 0, el);
    setElements(next); pushHistory(next);
  }, [elements, pushHistory, setElements]);

  // ─── Alignment ──────────────────────────────
  const alignElements = useCallback((alignment: string) => {
    if (!selected) return;
    let update: Partial<DesignElement> = {};
    if (alignment === 'left') update = { x: 0 };
    if (alignment === 'center-h') update = { x: (canvasW - selected.width) / 2 };
    if (alignment === 'right') update = { x: canvasW - selected.width };
    if (alignment === 'top') update = { y: 0 };
    if (alignment === 'center-v') update = { y: (canvasH - selected.height) / 2 };
    if (alignment === 'bottom') update = { y: canvasH - selected.height };
    updateElement(selected.id, update); commitUpdate();
  }, [selected, canvasW, canvasH, updateElement, commitUpdate]);

  // ─── Smart Snap Lines ──────────────────────
  const computeSnapLines = useCallback((el: DesignElement) => {
    const lines: {x?: number; y?: number}[] = [];
    const cx = el.x + el.width / 2; const cy = el.y + el.height / 2;
    // Canvas center
    if (Math.abs(cx - canvasW / 2) < 5) lines.push({ x: canvasW / 2 });
    if (Math.abs(cy - canvasH / 2) < 5) lines.push({ y: canvasH / 2 });
    // Other elements
    elements.filter(e => e.id !== el.id).forEach(other => {
      const ocx = other.x + other.width / 2; const ocy = other.y + other.height / 2;
      if (Math.abs(cx - ocx) < 5) lines.push({ x: ocx });
      if (Math.abs(cy - ocy) < 5) lines.push({ y: ocy });
      if (Math.abs(el.x - other.x) < 5) lines.push({ x: other.x });
      if (Math.abs(el.y - other.y) < 5) lines.push({ y: other.y });
      if (Math.abs(el.x + el.width - other.x - other.width) < 5) lines.push({ x: other.x + other.width });
    });
    return lines;
  }, [elements, canvasW, canvasH]);

  // ─── Pages ──────────────────────────────────
  const addPage = useCallback(() => {
    const newPage: Page = { id: pageId(), name: `Page ${pages.length + 1}`, elements: [], bgColor: '#FFFFFF' };
    setPages(prev => [...prev, newPage]);
    setActivePageIdx(pages.length);
    setHistory([[]]); setHistoryIdx(0);
  }, [pages]);

  const duplicatePage = useCallback((idx: number) => {
    const src = pages[idx];
    const newPage: Page = { ...src, id: pageId(), name: src.name + ' copy', elements: src.elements.map(e => ({ ...e, id: uid() })) };
    const next = [...pages]; next.splice(idx + 1, 0, newPage);
    setPages(next); setActivePageIdx(idx + 1);
  }, [pages]);

  const deletePage = useCallback((idx: number) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter((_, i) => i !== idx));
    setActivePageIdx(Math.min(idx, pages.length - 2));
  }, [pages]);

  // ─── Mouse ────────────────────────
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (spaceHeld || e.button === 1 || activeTool === 'hand') {
      setIsPanning(true); setPanStart({ x: e.clientX, y: e.clientY, px: panX, py: panY }); return;
    }
    if (activeTool !== 'select') {
      const map: Record<string, DesignElement['type']> = { rect:'rect', circle:'circle', triangle:'triangle', star:'star', text:'text', line:'line', arrow:'arrow' };
      if (map[activeTool]) addElement(map[activeTool]); return;
    }
    if ((e.target as HTMLElement).dataset.canvas === 'true') setSelectedIds([]);
  }, [activeTool, spaceHeld, panX, panY, addElement]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) { setPanX(panStart.px + (e.clientX - panStart.x)); setPanY(panStart.py + (e.clientY - panStart.y)); return; }
    if (isDragging && selectedId) {
      const dx = (e.clientX - dragStart.x) / zoom, dy = (e.clientY - dragStart.y) / zoom;
      let nx = dragElementStart.x + dx, ny = dragElementStart.y + dy;
      if (snapToGrid) { nx = Math.round(nx / 10) * 10; ny = Math.round(ny / 10) * 10; }
      updateElement(selectedId, { x: nx, y: ny });
      // Compute snap lines
      const el = elements.find(e => e.id === selectedId);
      if (el) setSnapLines(computeSnapLines({ ...el, x: nx, y: ny }));
    }
    if (isResizing && selectedId) {
      const dx = (e.clientX - resizeStart.x) / zoom, dy = (e.clientY - resizeStart.y) / zoom;
      let { w, h, ex, ey } = resizeStart;
      let nw = w, nh = h, nx = ex, ny = ey;
      if (resizeHandle.includes('e')) nw = Math.max(20, w + dx);
      if (resizeHandle.includes('w')) { nw = Math.max(20, w - dx); nx = ex + (w - nw); }
      if (resizeHandle.includes('s')) nh = Math.max(20, h + dy);
      if (resizeHandle.includes('n')) { nh = Math.max(20, h - dy); ny = ey + (h - nh); }
      if (snapToGrid) { nw = Math.round(nw / 10) * 10; nh = Math.round(nh / 10) * 10; }
      updateElement(selectedId, { width: nw, height: nh, x: nx, y: ny });
    }
  }, [isPanning, isDragging, isResizing, selectedId, dragStart, dragElementStart, resizeStart, resizeHandle, zoom, snapToGrid, panStart, updateElement, elements, computeSnapLines]);

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) commitUpdate();
    setIsDragging(false); setIsResizing(false); setIsPanning(false); setSnapLines([]);
  }, [isDragging, isResizing, commitUpdate]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(z => Math.min(5, Math.max(0.05, z - e.deltaY * 0.001))); }
    else { setPanX(px => px - e.deltaX); setPanY(py => py - e.deltaY); }
  }, []);

  const startDrag = useCallback((e: React.MouseEvent, el: DesignElement) => {
    if (el.locked) return;
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]);
    } else {
      if (!selectedIds.includes(el.id)) setSelectedIds([el.id]);
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY }); setDragElementStart({ x: el.x, y: el.y }); setActiveTool('select');
  }, [selectedIds]);

  const startResize = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation(); if (!selected) return;
    setIsResizing(true); setResizeHandle(handle);
    setResizeStart({ x: e.clientX, y: e.clientY, w: selected.width, h: selected.height, ex: selected.x, ey: selected.y });
  }, [selected]);

  // Zoom helpers
  const zoomToFit = useCallback(() => {
    const maxZoomW = (window.innerWidth - 400) / canvasW;
    const maxZoomH = (window.innerHeight - 100) / canvasH;
    setZoom(Math.min(maxZoomW, maxZoomH, 1) * 0.85);
    setPanX(0); setPanY(0);
  }, [canvasW, canvasH]);

  // ─── Render Element ───────────────────────────────────
  const renderElement = (el: DesignElement) => {
    if (el.visible === false) return null;
    const isSel = selectedIds.includes(el.id);
    const style: React.CSSProperties = {
      position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
      opacity: el.opacity, transform: `rotate(${el.rotation}deg)`,
      cursor: el.locked ? 'default' : activeTool === 'select' ? 'move' : 'crosshair',
      zIndex: isSel ? 999 : undefined,
      filter: el.blur ? `blur(${el.blur}px)` : undefined,
    };

    const shapeStyle: React.CSSProperties = {
      width: '100%', height: '100%', backgroundColor: el.fill,
      border: el.strokeWidth > 0 ? `${el.strokeWidth}px solid ${el.stroke}` : 'none',
      borderRadius: el.type === 'circle' ? '50%' : (el.borderRadius || 0),
      boxShadow: el.shadow ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color}` : undefined,
    };

    return (
      <div key={el.id} style={style} onMouseDown={e => startDrag(e, el)} className="select-none group/el">
        {el.type === 'text' ? (
          <div
            style={{ ...shapeStyle, backgroundColor: 'transparent', color: el.fill, fontSize: el.fontSize, fontFamily: el.fontFamily, fontWeight: el.fontWeight as any, fontStyle: el.fontStyle, textDecoration: el.textDecoration, textAlign: el.textAlign as any, lineHeight: el.lineHeight, letterSpacing: el.letterSpacing, display: 'flex', alignItems: 'center', padding: 4, overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            onDoubleClick={e => { e.stopPropagation(); const t = prompt('Edit text:', el.text); if (t !== null) { updateElement(el.id, { text: t }); commitUpdate(); } }}
          >{el.text}</div>
        ) : el.type === 'triangle' ? (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,5 95,95 5,95" fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} /></svg>
        ) : el.type === 'star' ? (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35" fill={el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth} /></svg>
        ) : el.type === 'line' || el.type === 'arrow' ? (
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            {el.type === 'arrow' && <defs><marker id={`ah-${el.id}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill={el.stroke} /></marker></defs>}
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke={el.stroke} strokeWidth={el.strokeWidth} markerEnd={el.type === 'arrow' ? `url(#ah-${el.id})` : undefined} />
          </svg>
        ) : <div style={shapeStyle} />}

        {isSel && (
          <div className="absolute -inset-px pointer-events-none" style={{ border: '2px solid hsl(211, 100%, 50%)', borderRadius: el.type === 'circle' ? '50%' : (el.borderRadius || 0) }} />
        )}

        {isSel && !el.locked && ['nw','ne','sw','se','n','s','e','w'].map(h => {
          const p: React.CSSProperties = {};
          if (h.includes('n')) p.top = -5; if (h.includes('s')) p.bottom = -5;
          if (h.includes('w')) p.left = -5; if (h.includes('e')) p.right = -5;
          if (h === 'n' || h === 's') { p.left = '50%'; p.marginLeft = -5; }
          if (h === 'e' || h === 'w') { p.top = '50%'; p.marginTop = -5; }
          const cur = { nw:'nwse',ne:'nesw',sw:'nesw',se:'nwse',n:'ns',s:'ns',e:'ew',w:'ew' }[h] + '-resize';
          return (
            <div key={h} onMouseDown={e => startResize(e, h)}
              className="absolute bg-white rounded-full shadow-md"
              style={{ ...p, width: 10, height: 10, cursor: cur, zIndex: 1000, border: '2px solid hsl(211, 100%, 50%)' }}
            />
          );
        })}

        {/* Rotation handle */}
        {isSel && !el.locked && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white shadow-md border-2 border-primary flex items-center justify-center cursor-grab" style={{ zIndex: 1001 }}>
            <RotateCw className="h-2.5 w-2.5 text-primary" />
          </div>
        )}
      </div>
    );
  };

  // ─── Left Panel Nav ──────────────────
  const leftNavItems = [
    { id: 'templates' as LeftPanel, icon: LayoutTemplate, label: 'Templates' },
    { id: 'elements' as LeftPanel, icon: Square, label: 'Elements' },
    { id: 'text' as LeftPanel, icon: Type, label: 'Text' },
    { id: 'uploads' as LeftPanel, icon: Upload, label: 'Uploads' },
    { id: 'brand' as LeftPanel, icon: Palette, label: 'Brand' },
    { id: 'more' as LeftPanel, icon: MoreHorizontal, label: 'More' },
  ];

  // ─── Helper Components ───────────────────
  const SectionLabel = ({ children }: { children: string }) => (
    <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.08em] block mb-2">{children}</span>
  );

  const PropInput = ({ label, value, onChange, type = 'number', min, max, step, className: cx }: { label: string; value: any; onChange: (v: any) => void; type?: string; min?: number; max?: number; step?: number; className?: string }) => (
    <div className={cn("flex flex-col gap-0.5", cx)}>
      <span className="text-[9px] text-muted-foreground/50 font-medium">{label}</span>
      <Input type={type} value={value} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        className="h-7 text-[11px] bg-muted/30 border-border/40 text-foreground font-mono rounded-lg" min={min} max={max} step={step} />
    </div>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="h-screen w-screen flex flex-col bg-muted/30 text-foreground overflow-hidden select-none" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>

        {/* ═══════ Top Bar ═══════ */}
        <header className="h-12 bg-background/95 backdrop-blur-xl border-b border-border/50 flex items-center px-3 gap-1.5 shrink-0 z-50">
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => navigate('/lounge/office/design-studio')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom" className="text-xs">Back to Home</TooltipContent></Tooltip>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Design name */}
          <div className="flex items-center gap-2 mr-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-sm">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <input value={designName} onChange={e => setDesignName(e.target.value)}
              className="text-[11px] font-semibold text-foreground bg-transparent border-none outline-none w-32 hover:bg-muted/50 focus:bg-muted/50 rounded px-1 py-0.5 transition-colors" />
          </div>

          {/* File menu */}
          <div className="flex items-center gap-0.5">
            {['File', 'Edit', 'View'].map(m => (
              <button key={m} className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors">{m}</button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Center: Undo/Redo */}
          <div className="flex items-center gap-0.5 bg-muted/40 rounded-lg p-0.5">
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={undo} disabled={historyIdx <= 0}>
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom" className="text-xs">Undo ⌘Z</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={redo} disabled={historyIdx >= history.length - 1}>
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent side="bottom" className="text-xs">Redo ⌘⇧Z</TooltipContent></Tooltip>
          </div>

          <div className="flex-1" />

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Zoom controls */}
            <div className="flex items-center gap-0.5 bg-muted/40 rounded-lg px-1.5 h-7">
              <Button variant="ghost" size="icon" className="h-5 w-5 rounded text-muted-foreground hover:text-foreground" onClick={() => setZoom(z => Math.max(0.05, z - 0.1))}><ZoomOut className="h-3 w-3" /></Button>
              <button onClick={zoomToFit} className="text-[10px] text-muted-foreground w-10 text-center font-mono tabular-nums hover:text-foreground transition-colors">{Math.round(zoom * 100)}%</button>
              <Button variant="ghost" size="icon" className="h-5 w-5 rounded text-muted-foreground hover:text-foreground" onClick={() => setZoom(z => Math.min(5, z + 0.1))}><ZoomIn className="h-3 w-3" /></Button>
            </div>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-lg", showGrid ? "bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setShowGrid(!showGrid)}><Grid3X3 className="h-3.5 w-3.5" /></Button>
            </TooltipTrigger><TooltipContent side="bottom" className="text-xs">Toggle Grid</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-lg", snapToGrid ? "bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setSnapToGrid(!snapToGrid)}><Magnet className="h-3.5 w-3.5" /></Button>
            </TooltipTrigger><TooltipContent side="bottom" className="text-xs">Snap to Grid</TooltipContent></Tooltip>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground" onClick={() => setShowLeftPanel(!showLeftPanel)}><PanelLeft className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground" onClick={() => setShowRightPanel(!showRightPanel)}><PanelRight className="h-3.5 w-3.5" /></Button>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground"><Share2 className="h-3.5 w-3.5" /></Button>

            <Button variant="outline" className="h-7 px-3 text-[11px] font-semibold rounded-lg gap-1.5" onClick={() => toast.success('Design saved!')}>
              <Save className="h-3 w-3" /> Save
            </Button>

            <Button className="h-7 px-3.5 text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm">
              <Download className="h-3 w-3 mr-1.5" /> Export
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* ═══════ Left Nav Rail ═══════ */}
          {showLeftPanel && (
            <aside className="w-[68px] bg-background border-r border-border/30 flex flex-col items-center py-2 gap-0.5 shrink-0">
              {leftNavItems.map(item => (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button onClick={() => setLeftPanel(leftPanel === item.id ? 'none' : item.id)}
                      className={cn("w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150",
                        leftPanel === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}>
                      <item.icon className="h-[18px] w-[18px]" />
                      <span className="text-[8px] font-medium leading-none">{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                </Tooltip>
              ))}

              <div className="flex-1" />

              {/* Tool shortcuts */}
              <div className="flex flex-col gap-0.5">
                {([
                  { id: 'select' as ToolType, icon: MousePointer2, label: 'V' },
                  { id: 'hand' as ToolType, icon: Hand, label: 'H' },
                ] as const).map(t => (
                  <Tooltip key={t.id}>
                    <TooltipTrigger asChild>
                      <button onClick={() => setActiveTool(t.id)}
                        className={cn("w-9 h-9 rounded-lg flex items-center justify-center mx-auto transition-all",
                          activeTool === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}>
                        <t.icon className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">{t.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </aside>
          )}

          {/* ═══════ Left Expanding Panel ═══════ */}
          {showLeftPanel && leftPanel !== 'none' && (
            <aside className="w-72 bg-background border-r border-border/30 flex flex-col shrink-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                <h3 className="text-sm font-semibold text-foreground capitalize">{leftPanel}</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground" onClick={() => setLeftPanel('none')}><X className="h-3.5 w-3.5" /></Button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-none p-3">
                {leftPanel === 'templates' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Search templates..." className="pl-8 h-8 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPLATE_ITEMS.map(t => (
                        <button key={t.name} onClick={() => {}} className="group rounded-xl overflow-hidden text-left">
                          <div className={cn("aspect-[3/4] bg-gradient-to-br flex items-center justify-center", t.color)}>
                            <FileText className="h-6 w-6 text-foreground/20" />
                          </div>
                          <p className="text-[10px] font-medium text-foreground mt-1.5 truncate px-0.5">{t.name}</p>
                          <p className="text-[9px] text-muted-foreground px-0.5">{t.cat}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {leftPanel === 'elements' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Search elements..." className="pl-8 h-8 text-xs" />
                    </div>
                    <div>
                      <SectionLabel>Shapes</SectionLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {SHAPE_ELEMENTS.map(s => (
                          <button key={s.type} onClick={() => addElement(s.type)}
                            className="aspect-square rounded-xl bg-muted/30 border border-border/20 flex flex-col items-center justify-center gap-1 hover:bg-muted/50 hover:border-primary/30 transition-all">
                            <s.icon className="h-5 w-5 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <SectionLabel>Lines & Connectors</SectionLabel>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => addElement('line')} className="h-12 rounded-xl bg-muted/30 border border-border/20 flex items-center justify-center hover:bg-muted/50 transition-all">
                          <div className="w-12 h-0.5 bg-muted-foreground rounded-full" />
                        </button>
                        <button onClick={() => addElement('arrow')} className="h-12 rounded-xl bg-muted/30 border border-border/20 flex items-center justify-center hover:bg-muted/50 transition-all">
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <SectionLabel>Frames</SectionLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {['1:1', '4:5', '16:9'].map(ratio => (
                          <button key={ratio} onClick={() => addElement('rect', { fill: 'transparent', stroke: '#8E8E93', strokeWidth: 2, name: `Frame ${ratio}` })}
                            className="h-12 rounded-xl bg-muted/30 border border-border/20 flex items-center justify-center hover:bg-muted/50 transition-all">
                            <span className="text-[10px] text-muted-foreground font-medium">{ratio}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {leftPanel === 'text' && (
                  <div className="space-y-4">
                    <Button onClick={() => addElement('text')} className="w-full h-10 gap-2"><Plus className="h-4 w-4" /> Add text box</Button>
                    <div className="space-y-2">
                      {TEXT_PRESETS.map(preset => (
                        <button key={preset.label}
                          onClick={() => addElement('text', { text: preset.label, fontSize: preset.fontSize, fontWeight: preset.fontWeight, fontFamily: preset.fontFamily, name: preset.label, width: 300, height: preset.fontSize * 1.5 })}
                          className="w-full p-3 rounded-xl bg-muted/20 border border-border/20 text-left hover:bg-muted/40 hover:border-primary/20 transition-all">
                          <span style={{ fontSize: Math.min(preset.fontSize * 0.5, 24), fontWeight: preset.fontWeight as any, fontFamily: preset.fontFamily }} className="text-foreground">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <Separator />
                    <SectionLabel>Font Combinations</SectionLabel>
                    <div className="space-y-2">
                      {[
                        { heading: 'Space Grotesk', body: 'Inter' },
                        { heading: 'Georgia', body: 'Arial' },
                        { heading: 'Palatino', body: 'Helvetica' },
                      ].map(combo => (
                        <button key={combo.heading} className="w-full p-3 rounded-xl bg-muted/20 border border-border/20 text-left hover:bg-muted/40 transition-all">
                          <p style={{ fontFamily: combo.heading }} className="text-sm font-bold text-foreground">{combo.heading}</p>
                          <p style={{ fontFamily: combo.body }} className="text-xs text-muted-foreground">{combo.body}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {leftPanel === 'uploads' && (
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full h-24 border-dashed border-2 flex-col gap-2 hover:bg-muted/30">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload images or videos</span>
                    </Button>
                    <div className="text-center py-8">
                      <Image className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground/40">No uploads yet</p>
                    </div>
                  </div>
                )}

                {leftPanel === 'brand' && (
                  <div className="space-y-4">
                    <div>
                      <SectionLabel>Brand Colors</SectionLabel>
                      <div className="flex flex-wrap gap-2">
                        {PALETTE.slice(0, 12).map(c => (
                          <button key={c} className="h-8 w-8 rounded-lg shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <SectionLabel>Brand Fonts</SectionLabel>
                      <div className="space-y-1">
                        {['Inter', 'Space Grotesk', 'Georgia'].map(f => (
                          <button key={f} className="w-full px-3 py-2 rounded-lg hover:bg-muted/50 text-left">
                            <span style={{ fontFamily: f }} className="text-sm text-foreground">{f}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" className="w-full text-xs gap-2"><Settings2 className="h-3 w-3" /> Manage Brand Kit</Button>
                  </div>
                )}

                {leftPanel === 'more' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Wand2, label: 'AI Magic', desc: 'AI-powered tools' },
                      { icon: Image, label: 'Photos', desc: 'Stock images' },
                      { icon: Hexagon, label: 'Graphics', desc: 'Illustrations' },
                      { icon: CloudLightning, label: 'Effects', desc: 'Visual effects' },
                      { icon: Frame, label: 'Frames', desc: 'Photo frames' },
                      { icon: Paintbrush, label: 'Draw', desc: 'Freehand draw' },
                    ].map(item => (
                      <button key={item.label} className="p-3 rounded-xl bg-muted/20 border border-border/20 text-left hover:bg-muted/40 transition-all">
                        <item.icon className="h-5 w-5 text-muted-foreground mb-1.5" />
                        <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
                        <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* ═══════ Canvas Area ═══════ */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Contextual toolbar */}
            {selected && (
              <div className="h-10 bg-background/90 backdrop-blur border-b border-border/30 flex items-center px-3 gap-1 shrink-0">
                <span className="text-[10px] text-muted-foreground font-medium mr-2">{selected.name}</span>

                {/* Position inputs */}
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-muted-foreground/50">X</span>
                  <Input type="number" value={Math.round(selected.x)} onChange={e => { updateElement(selected.id, { x: Number(e.target.value) }); commitUpdate(); }}
                    className="h-6 w-14 text-[10px] bg-muted/30 border-border/30 font-mono rounded-md" />
                  <span className="text-muted-foreground/50 ml-1">Y</span>
                  <Input type="number" value={Math.round(selected.y)} onChange={e => { updateElement(selected.id, { y: Number(e.target.value) }); commitUpdate(); }}
                    className="h-6 w-14 text-[10px] bg-muted/30 border-border/30 font-mono rounded-md" />
                  <span className="text-muted-foreground/50 ml-1">W</span>
                  <Input type="number" value={Math.round(selected.width)} onChange={e => { updateElement(selected.id, { width: Number(e.target.value) }); commitUpdate(); }}
                    className="h-6 w-14 text-[10px] bg-muted/30 border-border/30 font-mono rounded-md" />
                  <span className="text-muted-foreground/50 ml-1">H</span>
                  <Input type="number" value={Math.round(selected.height)} onChange={e => { updateElement(selected.id, { height: Number(e.target.value) }); commitUpdate(); }}
                    className="h-6 w-14 text-[10px] bg-muted/30 border-border/30 font-mono rounded-md" />
                </div>

                <Separator orientation="vertical" className="h-5 mx-2" />

                {/* Alignment */}
                <div className="flex gap-0.5">
                  {[
                    { id: 'left', icon: AlignStartVertical },
                    { id: 'center-h', icon: AlignHorizontalJustifyCenter },
                    { id: 'right', icon: AlignEndVertical },
                    { id: 'top', icon: AlignStartHorizontal },
                    { id: 'center-v', icon: AlignVerticalJustifyCenter },
                    { id: 'bottom', icon: AlignEndHorizontal },
                  ].map(a => (
                    <Tooltip key={a.id}><TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground" onClick={() => alignElements(a.id)}>
                        <a.icon className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger><TooltipContent side="bottom" className="text-xs">Align {a.id}</TooltipContent></Tooltip>
                  ))}
                </div>

                <Separator orientation="vertical" className="h-5 mx-2" />

                {/* Quick color */}
                <div className="flex items-center gap-1">
                  <div className="h-5 w-5 rounded border border-border/40 cursor-pointer" style={{ backgroundColor: selected.fill }} />
                  <Input type="color" value={selected.fill} onChange={e => { updateElement(selected.id, { fill: e.target.value }); commitUpdate(); }}
                    className="h-5 w-5 p-0 border-none bg-transparent cursor-pointer opacity-0 -ml-5" />
                </div>

                <div className="flex-1" />

                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground" onClick={duplicateSelected}><Copy className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive" onClick={deleteSelected}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            )}

            <main
              className="flex-1 overflow-hidden relative"
              style={{
                cursor: spaceHeld || activeTool === 'hand' ? (isPanning ? 'grabbing' : 'grab') : activeTool === 'select' ? 'default' : 'crosshair',
                backgroundColor: 'hsl(var(--muted) / 0.15)',
              }}
              onMouseDown={handleCanvasMouseDown}
              onWheel={handleWheel}
            >
              {/* Rulers */}
              {showRulers && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-5 bg-background/80 backdrop-blur border-b border-border/20 z-30 flex items-end overflow-hidden">
                    {Array.from({ length: Math.ceil((window.innerWidth) / (50 * zoom)) + 10 }, (_, i) => {
                      const pos = (i * 50 * zoom) + panX + window.innerWidth / 2 - canvasW * zoom / 2;
                      return pos > -50 && pos < window.innerWidth + 50 ? (
                        <div key={i} className="absolute" style={{ left: pos }}>
                          <span className="text-[8px] text-muted-foreground/40 font-mono">{i * 50}</span>
                          <div className="h-1.5 w-px bg-border/40 mt-0.5" />
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="absolute top-5 left-0 bottom-0 w-5 bg-background/80 backdrop-blur border-r border-border/20 z-30 flex flex-col items-end overflow-hidden">
                    {Array.from({ length: Math.ceil((window.innerHeight) / (50 * zoom)) + 10 }, (_, i) => {
                      const pos = (i * 50 * zoom) + panY + window.innerHeight / 2 - canvasH * zoom / 2;
                      return pos > -50 && pos < window.innerHeight + 50 ? (
                        <div key={i} className="absolute" style={{ top: pos }}>
                          <span className="text-[8px] text-muted-foreground/40 font-mono rotate-90 origin-left inline-block">{i * 50}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </>
              )}

              {/* Canvas */}
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(${panX}px, ${panY}px) translate(-50%, -50%) scale(${zoom})`, transformOrigin: 'center center' }}>
                <div className="absolute -inset-2 bg-foreground/[0.04] rounded-xl blur-2xl" />
                <div ref={canvasRef} data-canvas="true" className="relative rounded-sm"
                  style={{
                    width: canvasW, height: canvasH,
                    backgroundColor: activePage.bgColor,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06), 0 25px 60px rgba(0,0,0,0.04)',
                    backgroundImage: showGrid ? 'radial-gradient(circle, #d1d5db 0.5px, transparent 0.5px)' : undefined,
                    backgroundSize: showGrid ? '20px 20px' : undefined,
                  }}
                >
                  {elements.map(renderElement)}

                  {/* Snap lines */}
                  {snapLines.map((line, i) => (
                    <div key={i} className="absolute pointer-events-none" style={{
                      ...(line.x !== undefined ? { left: line.x, top: 0, width: 1, height: '100%', backgroundColor: '#FF00FF' } : {}),
                      ...(line.y !== undefined ? { left: 0, top: line.y, width: '100%', height: 1, backgroundColor: '#FF00FF' } : {}),
                      zIndex: 9999, opacity: 0.6,
                    }} />
                  ))}
                </div>
              </div>

              {/* Status pill */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-xl text-muted-foreground text-[10px] font-mono px-3 py-1 rounded-full border border-border/40 shadow-sm z-20">
                Page {activePageIdx + 1}/{pages.length} · {canvasW}×{canvasH} · {elements.length} element{elements.length !== 1 ? 's' : ''} · {Math.round(zoom * 100)}%
              </div>
            </main>

            {/* ═══════ Page Thumbnails Bar ═══════ */}
            {showPages && (
              <div className="h-24 bg-background/95 border-t border-border/30 flex items-center px-4 gap-3 shrink-0 overflow-x-auto scrollbar-none">
                {pages.map((page, idx) => (
                  <button key={page.id} onClick={() => { setActivePageIdx(idx); setSelectedIds([]); setHistory([[]]); setHistoryIdx(0); }}
                    className={cn("group relative shrink-0 rounded-lg overflow-hidden transition-all",
                      idx === activePageIdx ? "ring-2 ring-primary shadow-md" : "ring-1 ring-border/30 hover:ring-border"
                    )}>
                    <div className="w-20 h-14 flex items-center justify-center" style={{ backgroundColor: page.bgColor }}>
                      {page.elements.length > 0 ? (
                        <div className="relative" style={{ width: 60, height: 42 }}>
                          {page.elements.slice(0, 5).map(el => (
                            <div key={el.id} className="absolute rounded-sm" style={{
                              left: (el.x / canvasW) * 60, top: (el.y / canvasH) * 42,
                              width: Math.max(4, (el.width / canvasW) * 60), height: Math.max(3, (el.height / canvasH) * 42),
                              backgroundColor: el.fill, opacity: 0.7,
                            }} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[8px] text-muted-foreground/30">Empty</span>
                      )}
                    </div>
                    <span className="block text-[8px] text-muted-foreground text-center py-0.5 bg-muted/30">{idx + 1}</span>

                    {/* Page actions on hover */}
                    <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <button onClick={e => { e.stopPropagation(); duplicatePage(idx); }} className="h-4 w-4 rounded bg-background/90 flex items-center justify-center shadow-sm"><Copy className="h-2 w-2 text-muted-foreground" /></button>
                      {pages.length > 1 && <button onClick={e => { e.stopPropagation(); deletePage(idx); }} className="h-4 w-4 rounded bg-background/90 flex items-center justify-center shadow-sm"><Trash2 className="h-2 w-2 text-destructive" /></button>}
                    </div>
                  </button>
                ))}

                <button onClick={addPage}
                  className="w-20 h-14 rounded-lg border-2 border-dashed border-border/40 flex items-center justify-center hover:border-primary/40 hover:bg-muted/20 transition-all shrink-0">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* ═══════ Right Panel ═══════ */}
          {showRightPanel && (
            <aside className="w-72 bg-background border-l border-border/30 flex flex-col shrink-0">
              <div className="flex border-b border-border/30">
                {(['design', 'layers', 'animate'] as const).map(tab => (
                  <button key={tab} onClick={() => setRightTab(tab)}
                    className={cn("flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                      rightTab === tab ? "text-foreground border-b-2 border-primary" : "text-muted-foreground/50 hover:text-muted-foreground"
                    )}
                  >{tab}</button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-none">
                {rightTab === 'layers' ? (
                  <div className="p-3 space-y-1">
                    {[...elements].reverse().map(el => (
                      <button key={el.id} onClick={() => { setSelectedIds([el.id]); setRightTab('design'); }}
                        className={cn("w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-150",
                          selectedIds.includes(el.id) ? "bg-primary/8 ring-1 ring-primary/20" : "hover:bg-muted/50"
                        )}
                      >
                        <div className="h-5 w-5 rounded border border-border/60 shrink-0" style={{ backgroundColor: el.fill }} />
                        <span className="text-[11px] truncate flex-1 text-foreground/80">{el.name}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                          <button onClick={e => { e.stopPropagation(); updateElement(el.id, { visible: el.visible === false ? true : false }); }}>
                            {el.visible === false ? <EyeOff className="h-3 w-3 text-muted-foreground/40" /> : <Eye className="h-3 w-3 text-muted-foreground/30" />}
                          </button>
                        </div>
                        {el.locked && <Lock className="h-3 w-3 text-muted-foreground/40" />}
                      </button>
                    ))}
                    {elements.length === 0 && (
                      <div className="text-center py-12">
                        <Layers className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground/40">No elements yet</p>
                        <p className="text-[10px] text-muted-foreground/30 mt-1">Add elements from the left panel</p>
                      </div>
                    )}
                  </div>
                ) : rightTab === 'animate' ? (
                  <div className="p-4 text-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">Animations</p>
                    <p className="text-xs text-muted-foreground/60">Select an element and add entrance, exit, or emphasis animations.</p>
                    {selected && (
                      <div className="mt-4 space-y-2">
                        {['Fade In', 'Slide Up', 'Scale', 'Bounce', 'Rotate In', 'Typewriter'].map(anim => (
                          <button key={anim} className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/20 text-left text-xs text-foreground hover:bg-muted/50 transition-colors">{anim}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : selected ? (
                  <div className="p-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-foreground truncate">{selected.name}</span>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground" onClick={() => updateElement(selected.id, { locked: !selected.locked })}>
                          {selected.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground" onClick={() => updateElement(selected.id, { visible: selected.visible === false ? true : false })}>
                          {selected.visible === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive" onClick={deleteSelected}><Trash2 className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-muted-foreground" onClick={duplicateSelected}><Copy className="h-3 w-3" /></Button>
                      </div>
                    </div>

                    <Separator className="!my-2" />

                    {/* Position & Size */}
                    <div>
                      <SectionLabel>Transform</SectionLabel>
                      <div className="grid grid-cols-2 gap-1.5">
                        <PropInput label="X" value={Math.round(selected.x)} onChange={v => { updateElement(selected.id, { x: v }); commitUpdate(); }} />
                        <PropInput label="Y" value={Math.round(selected.y)} onChange={v => { updateElement(selected.id, { y: v }); commitUpdate(); }} />
                        <PropInput label="W" value={Math.round(selected.width)} onChange={v => { updateElement(selected.id, { width: v }); commitUpdate(); }} min={1} />
                        <PropInput label="H" value={Math.round(selected.height)} onChange={v => { updateElement(selected.id, { height: v }); commitUpdate(); }} min={1} />
                      </div>
                    </div>

                    {/* Rotation */}
                    <div>
                      <SectionLabel>Rotation</SectionLabel>
                      <div className="flex items-center gap-2">
                        <RotateCw className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                        <Slider value={[selected.rotation]} min={0} max={360} step={1} onValueChange={([v]) => updateElement(selected.id, { rotation: v })} onValueCommit={() => commitUpdate()} className="flex-1" />
                        <span className="text-[10px] text-muted-foreground font-mono w-8 text-right tabular-nums">{selected.rotation}°</span>
                      </div>
                    </div>

                    <Separator className="!my-2" />

                    {/* Fill */}
                    <div>
                      <SectionLabel>Fill</SectionLabel>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative h-7 w-7">
                          <div className="h-7 w-7 rounded-lg border border-border/60 shadow-inner" style={{ backgroundColor: selected.fill }} />
                          <input type="color" value={selected.fill} onChange={e => { updateElement(selected.id, { fill: e.target.value }); commitUpdate(); }}
                            className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <Input value={selected.fill} onChange={e => { updateElement(selected.id, { fill: e.target.value }); commitUpdate(); }}
                          className="h-7 text-[10px] bg-muted/30 border-border/40 text-foreground font-mono flex-1 rounded-lg" />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {PALETTE.map(c => (
                          <button key={c} onClick={() => { updateElement(selected.id, { fill: c }); commitUpdate(); }}
                            className={cn("h-5 w-5 rounded-md transition-all duration-150",
                              selected.fill === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110' : 'hover:scale-110 border border-border/20'
                            )}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>

                    {/* Border */}
                    <div>
                      <SectionLabel>Border</SectionLabel>
                      <div className="flex items-center gap-1.5">
                        <div className="relative h-6 w-6">
                          <div className="h-6 w-6 rounded-md border border-border/60" style={{ backgroundColor: selected.stroke === 'transparent' ? '#fff' : selected.stroke }} />
                          <input type="color" value={selected.stroke === 'transparent' ? '#000000' : selected.stroke} onChange={e => { updateElement(selected.id, { stroke: e.target.value }); commitUpdate(); }}
                            className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <Input type="number" value={selected.strokeWidth} onChange={e => { updateElement(selected.id, { strokeWidth: Number(e.target.value) }); commitUpdate(); }}
                          className="h-6 w-14 text-[10px] bg-muted/30 border-border/40 font-mono rounded-md" min={0} />
                      </div>
                    </div>

                    {/* Opacity */}
                    <div>
                      <SectionLabel>Opacity</SectionLabel>
                      <div className="flex items-center gap-2">
                        <Slider value={[selected.opacity * 100]} min={0} max={100} step={1} onValueChange={([v]) => updateElement(selected.id, { opacity: v / 100 })} onValueCommit={() => commitUpdate()} className="flex-1" />
                        <span className="text-[10px] text-muted-foreground font-mono w-8 text-right tabular-nums">{Math.round(selected.opacity * 100)}%</span>
                      </div>
                    </div>

                    {/* Corner Radius */}
                    {!['circle','triangle','star','line','arrow'].includes(selected.type) && (
                      <div>
                        <SectionLabel>Corner Radius</SectionLabel>
                        <div className="flex items-center gap-2">
                          <Slider value={[selected.borderRadius || 0]} min={0} max={200} step={1} onValueChange={([v]) => updateElement(selected.id, { borderRadius: v })} onValueCommit={() => commitUpdate()} className="flex-1" />
                          <span className="text-[10px] text-muted-foreground font-mono w-6 text-right tabular-nums">{selected.borderRadius || 0}</span>
                        </div>
                      </div>
                    )}

                    {/* Shadow */}
                    <div>
                      <SectionLabel>Shadow</SectionLabel>
                      <div className="grid grid-cols-3 gap-1.5">
                        <PropInput label="X" value={selected.shadow?.x || 0} onChange={v => { updateElement(selected.id, { shadow: { x: v, y: selected.shadow?.y || 4, blur: selected.shadow?.blur || 12, color: selected.shadow?.color || 'rgba(0,0,0,0.15)' } }); commitUpdate(); }} />
                        <PropInput label="Y" value={selected.shadow?.y || 0} onChange={v => { updateElement(selected.id, { shadow: { x: selected.shadow?.x || 0, y: v, blur: selected.shadow?.blur || 12, color: selected.shadow?.color || 'rgba(0,0,0,0.15)' } }); commitUpdate(); }} />
                        <PropInput label="Blur" value={selected.shadow?.blur || 0} onChange={v => { updateElement(selected.id, { shadow: { x: selected.shadow?.x || 0, y: selected.shadow?.y || 4, blur: v, color: selected.shadow?.color || 'rgba(0,0,0,0.15)' } }); commitUpdate(); }} />
                      </div>
                    </div>

                    {/* Text props */}
                    {selected.type === 'text' && (
                      <>
                        <Separator className="!my-2" />
                        <div>
                          <SectionLabel>Typography</SectionLabel>
                          <select value={selected.fontFamily} onChange={e => { updateElement(selected.id, { fontFamily: e.target.value }); commitUpdate(); }}
                            className="w-full h-8 text-[11px] bg-muted/30 border border-border/40 text-foreground rounded-lg px-2 mb-2 outline-none">
                            {EXTENDED_FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                          </select>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Input type="number" value={selected.fontSize} onChange={e => { updateElement(selected.id, { fontSize: Number(e.target.value) }); commitUpdate(); }}
                              className="h-7 w-16 text-[11px] bg-muted/30 border-border/40 font-mono rounded-lg" min={8} max={1000} />
                            <select value={selected.fontWeight || '400'} onChange={e => { updateElement(selected.id, { fontWeight: e.target.value }); commitUpdate(); }}
                              className="h-7 text-[11px] bg-muted/30 border border-border/40 text-foreground rounded-lg px-2 flex-1 outline-none">
                              {['100','200','300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w === '400' ? 'Regular' : w === '700' ? 'Bold' : w === '600' ? 'Semibold' : w === '300' ? 'Light' : w}</option>)}
                            </select>
                          </div>
                          <div className="flex gap-0.5 bg-muted/30 rounded-lg p-0.5 mb-2">
                            {[
                              { key: 'fontStyle', val: 'italic', icon: Italic },
                              { key: 'textDecoration', val: 'underline', icon: Underline },
                            ].map(({ key, val, icon: Ic }) => (
                              <button key={key} onClick={() => { updateElement(selected.id, { [key]: (selected as any)[key] === val ? 'normal' : val }); commitUpdate(); }}
                                className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", (selected as any)[key] === val ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>
                                <Ic className="h-3.5 w-3.5" />
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-0.5 bg-muted/30 rounded-lg p-0.5 mb-2">
                            {(['left','center','right'] as const).map(a => (
                              <button key={a} onClick={() => { updateElement(selected.id, { textAlign: a }); commitUpdate(); }}
                                className={cn("h-7 flex-1 rounded-md flex items-center justify-center transition-colors", selected.textAlign === a ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>
                                {a === 'left' ? <AlignLeft className="h-3 w-3" /> : a === 'center' ? <AlignCenter className="h-3 w-3" /> : <AlignRight className="h-3 w-3" />}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <PropInput label="Line Height" value={selected.lineHeight} onChange={v => { updateElement(selected.id, { lineHeight: v }); commitUpdate(); }} min={0.5} max={5} step={0.1} />
                            <PropInput label="Letter Spacing" value={selected.letterSpacing} onChange={v => { updateElement(selected.id, { letterSpacing: v }); commitUpdate(); }} min={-5} max={50} step={0.5} />
                          </div>
                        </div>
                      </>
                    )}

                    <Separator className="!my-2" />

                    {/* Arrange */}
                    <div>
                      <SectionLabel>Arrange</SectionLabel>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: 'Back', dir: 'bottom' as const },
                          { label: '↓', dir: 'down' as const },
                          { label: '↑', dir: 'up' as const },
                          { label: 'Front', dir: 'top' as const },
                        ].map(l => (
                          <Button key={l.dir} variant="outline" size="sm" className="h-6 text-[9px] rounded-md border-border/40" onClick={() => moveLayer(selected.id, l.dir)}>{l.label}</Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Canvas Settings */
                  <div className="p-3 space-y-4">
                    <div>
                      <SectionLabel>Page Background</SectionLabel>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="relative h-8 w-8">
                          <div className="h-8 w-8 rounded-lg border border-border/60" style={{ backgroundColor: activePage.bgColor }} />
                          <input type="color" value={activePage.bgColor} onChange={e => setPages(prev => prev.map((p, i) => i === activePageIdx ? { ...p, bgColor: e.target.value } : p))}
                            className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <Input value={activePage.bgColor} onChange={e => setPages(prev => prev.map((p, i) => i === activePageIdx ? { ...p, bgColor: e.target.value } : p))}
                          className="h-7 text-[10px] bg-muted/30 border-border/40 font-mono flex-1 rounded-lg" />
                      </div>
                    </div>
                    <Separator className="!my-2" />
                    <div>
                      <SectionLabel>Canvas Size</SectionLabel>
                      <div className="space-y-0.5 max-h-64 overflow-y-auto scrollbar-none">
                        {CANVAS_PRESETS.map(p => (
                          <button key={p.label} onClick={() => { setCanvasW(p.w); setCanvasH(p.h); }}
                            className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150",
                              canvasW === p.w && canvasH === p.h ? "bg-primary/8 text-foreground ring-1 ring-primary/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}>
                            <span className="text-[11px] font-medium flex-1">{p.label}</span>
                            <span className="text-[9px] text-muted-foreground/50 font-mono tabular-nums">{p.w}×{p.h}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Separator className="!my-2" />
                    <div>
                      <SectionLabel>Custom Size</SectionLabel>
                      <div className="grid grid-cols-2 gap-1.5">
                        <PropInput label="Width" value={canvasW} onChange={setCanvasW} min={50} />
                        <PropInput label="Height" value={canvasH} onChange={setCanvasH} min={50} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

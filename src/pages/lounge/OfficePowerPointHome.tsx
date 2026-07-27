import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Presentation, ArrowLeft, Plus, ChevronDown,
  FileText, X, Copy, Trash2, GripVertical,
  Upload, Link2, ImagePlus, FileUp, Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Slide, SlideElement, SLIDE_LAYOUTS, THEMES, uid, SlideTheme,
} from '@/components/slides/types';
import { ScaledSlide } from '@/components/slides/ScaledSlide';
import { SlideToolbar } from '@/components/slides/SlideToolbar';
import { PresentMode } from '@/components/slides/PresentMode';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function createSlide(layoutId: string = 'title', theme?: SlideTheme): Slide {
  const layout = SLIDE_LAYOUTS.find(l => l.id === layoutId) || SLIDE_LAYOUTS[0];
  const t = theme || THEMES[0];
  return {
    id: uid(),
    bg: t.bg,
    bgGradient: t.bgGradient,
    notes: '',
    transition: 'fade',
    elements: layout.elements.map((el, i) => ({
      id: uid(),
      type: el.type || 'text',
      content: el.content || '',
      x: el.x || 0,
      y: el.y || 0,
      w: el.w || 400,
      h: el.h || 100,
      fontSize: el.fontSize,
      fontWeight: el.fontWeight,
      fontStyle: el.fontStyle,
      fontFamily: t.fontFamily,
      textAlign: el.textAlign,
      lineHeight: el.lineHeight,
      color: i === 0 ? t.titleColor : el.type === 'shape' ? undefined : t.textColor,
      shape: el.shape,
      fill: el.fill || t.accentColor,
      opacity: el.opacity,
      zIndex: i,
    } as SlideElement)),
  };
}

export default function OfficePowerPointHome() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Untitled Presentation');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([createSlide('title')]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<SlideTheme>(THEMES[0]);
  const [zoom, setZoom] = useState(100);
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [history, setHistory] = useState<Slide[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const pushHistory = useCallback((newSlides: Slide[]) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newSlides].slice(-40));
    setHistoryIndex(prev => Math.min(prev + 1, 39));
  }, [historyIndex]);

  const slide = slides[currentSlide];

  const updateSlides = useCallback((newSlides: Slide[]) => {
    setSlides(newSlides);
    pushHistory(newSlides);
  }, [pushHistory]);

  const addSlide = (layoutId?: string) => {
    const newSlide = createSlide(layoutId || 'blank', currentTheme);
    const newSlides = [...slides];
    newSlides.splice(currentSlide + 1, 0, newSlide);
    updateSlides(newSlides);
    setCurrentSlide(currentSlide + 1);
    setSelectedElement(null);
  };

  const duplicateSlide = () => {
    const dup: Slide = { ...slide, id: uid(), elements: slide.elements.map(e => ({ ...e, id: uid() })) };
    const newSlides = [...slides];
    newSlides.splice(currentSlide + 1, 0, dup);
    updateSlides(newSlides);
    setCurrentSlide(currentSlide + 1);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== currentSlide);
    updateSlides(newSlides);
    setCurrentSlide(Math.min(currentSlide, newSlides.length - 1));
    setSelectedElement(null);
  };

  const addElement = (type: 'text' | 'shape' | 'image', shape?: string) => {
    let el: SlideElement;
    if (type === 'text') {
      el = { id: uid(), type: 'text', content: 'Click to edit', x: 400, y: 400, w: 600, h: 120, fontSize: 36, color: currentTheme.textColor, fontFamily: currentTheme.fontFamily, zIndex: slide.elements.length };
    } else if (type === 'image') {
      // Open the image dialog instead of adding empty placeholder
      setShowImageDialog(true);
      return;
    } else {
      el = { id: uid(), type: 'shape', content: '', x: 600, y: 300, w: 300, h: 300, shape: (shape as any) || 'rect', fill: currentTheme.accentColor, zIndex: slide.elements.length };
    }
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...slide, elements: [...slide.elements, el] };
    updateSlides(newSlides);
    setSelectedElement(el.id);
  };

  const addImageElement = (src: string) => {
    const el: SlideElement = { id: uid(), type: 'image', content: '', x: 400, y: 200, w: 600, h: 400, imageUrl: src, imageFit: 'cover', zIndex: slide.elements.length };
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...slide, elements: [...slide.elements, el] };
    updateSlides(newSlides);
    setSelectedElement(el.id);
  };

  const updateElement = useCallback((elId: string, updates: Partial<SlideElement>) => {
    setSlides(prev => {
      const newSlides = [...prev];
      const s = newSlides[currentSlide];
      newSlides[currentSlide] = { ...s, elements: s.elements.map(e => e.id === elId ? { ...e, ...updates } : e) };
      return newSlides;
    });
  }, [currentSlide]);

  const deleteElement = () => {
    if (!selectedElement) return;
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...slide, elements: slide.elements.filter(e => e.id !== selectedElement) };
    updateSlides(newSlides);
    setSelectedElement(null);
  };

  const duplicateElement = () => {
    const el = slide.elements.find(e => e.id === selectedElement);
    if (!el) return;
    const dup = { ...el, id: uid(), x: el.x + 40, y: el.y + 40 };
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...slide, elements: [...slide.elements, dup] };
    updateSlides(newSlides);
    setSelectedElement(dup.id);
  };

  const bringForward = () => {
    if (!selectedElement) return;
    const idx = slide.elements.findIndex(e => e.id === selectedElement);
    if (idx >= slide.elements.length - 1) return;
    const newEls = [...slide.elements];
    [newEls[idx], newEls[idx + 1]] = [newEls[idx + 1], newEls[idx]];
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...slide, elements: newEls };
    updateSlides(newSlides);
  };

  const sendBackward = () => {
    if (!selectedElement) return;
    const idx = slide.elements.findIndex(e => e.id === selectedElement);
    if (idx <= 0) return;
    const newEls = [...slide.elements];
    [newEls[idx], newEls[idx - 1]] = [newEls[idx - 1], newEls[idx]];
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...slide, elements: newEls };
    updateSlides(newSlides);
  };

  const updateSelectedElement = (updates: Partial<SlideElement>) => {
    if (!selectedElement) return;
    updateElement(selectedElement, updates);
  };

  const applyTheme = (theme: SlideTheme) => {
    setCurrentTheme(theme);
    const newSlides = slides.map(s => ({
      ...s,
      bg: theme.bg,
      bgGradient: theme.bgGradient,
      elements: s.elements.map((el, i) => {
        if (el.type === 'text') {
          const isTitle = i === 0 || (el.fontSize && el.fontSize >= 40);
          return { ...el, color: isTitle ? theme.titleColor : theme.textColor, fontFamily: theme.fontFamily };
        }
        if (el.type === 'shape') return { ...el, fill: theme.accentColor };
        return el;
      }),
    }));
    updateSlides(newSlides);
  };

  const updateNotes = (notes: string) => {
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...slide, notes };
    setSlides(newSlides);
  };

  const updateSlideTransition = (transition: Slide['transition']) => {
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...slide, transition };
    updateSlides(newSlides);
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    setHistoryIndex(prev => prev - 1);
    setSlides(history[historyIndex - 1]);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex(prev => prev + 1);
    setSlides(history[historyIndex + 1]);
  };

  const handleReorder = (newOrder: Slide[]) => {
    setSlides(newOrder);
    const idx = newOrder.findIndex(s => s.id === slide?.id);
    if (idx >= 0) setCurrentSlide(idx);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (presenting) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement && !editingElement) { e.preventDefault(); deleteElement(); }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); duplicateElement(); }
      if (e.key === 'Escape') { setSelectedElement(null); setEditingElement(null); setShowGrid(false); }
      if (e.key === 'g' && !editingElement) { e.preventDefault(); setShowGrid(g => !g); }
      if (e.key === 't' && !editingElement) { e.preventDefault(); addElement('text'); }
      if (e.key === 'F5') { e.preventDefault(); setPresenting(true); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedElement, editingElement, presenting]);

  const selectedEl = slide?.elements.find(e => e.id === selectedElement) || null;

  if (presenting) {
    return <PresentMode slides={slides} startIndex={currentSlide} onExit={() => setPresenting(false)} />;
  }

  // Grid View
  if (showGrid) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-background">
        <div className="flex items-center gap-2 px-4 h-12 bg-card/90 backdrop-blur-xl border-b border-border/20 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setShowGrid(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Presentation className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">Slide Overview</span>
          <span className="text-xs text-muted-foreground ml-1">— {slides.length} slides</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="h-8 text-xs rounded-xl" onClick={() => setShowGrid(false)}>
            <X className="h-3.5 w-3.5 mr-1" /> Close
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {slides.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => { setCurrentSlide(i); setShowGrid(false); }}
                className={cn(
                  "rounded-xl overflow-hidden border-2 transition-all hover:shadow-xl hover:-translate-y-1 group text-left",
                  i === currentSlide ? "border-orange-500 shadow-lg shadow-orange-500/20" : "border-border/30 hover:border-border/60"
                )}
              >
                <ScaledSlide slide={s} className="aspect-video w-full" />
                <div className="px-3 py-2 bg-card/90 border-t border-border/10 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-foreground">Slide {i + 1}</span>
                  <div className="hidden sm:flex items-center gap-1.5">
                    {s.notes && <FileText className="h-3 w-3 text-muted-foreground/40" />}
                    <span className="text-[9px] text-muted-foreground/40">{s.transition || 'fade'}</span>
                  </div>
                </div>
              </motion.button>
            ))}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => { addSlide('blank'); setShowGrid(false); }}
              className="aspect-video rounded-xl border-2 border-dashed border-border/30 hover:border-border/60 flex flex-col items-center justify-center gap-2 transition-all hover:bg-card/40"
            >
              <Plus className="h-6 w-6 text-muted-foreground/30" />
              <span className="text-[10px] text-muted-foreground/40 font-medium">Add Slide</span>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Title Bar */}
      <div className="flex items-center gap-2 px-3 h-11 bg-card/90 backdrop-blur-xl border-b border-border/20 shrink-0 select-none">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => navigate('/lounge/office/powerpoint-home')}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
          <Presentation className="h-4 w-4 text-white" />
        </div>

        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            autoFocus
            className="h-7 text-xs font-medium w-64 rounded-lg bg-secondary/60 border-border/40"
          />
        ) : (
          <button onClick={() => setIsEditingTitle(true)} className="text-xs font-semibold text-foreground hover:bg-secondary/60 transition-colors truncate max-w-sm px-2 py-1 rounded-lg">
            {title}
          </button>
        )}
        <span className="text-[10px] text-muted-foreground">— Slides</span>
        <div className="flex-1" />

        {/* Transition picker */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Transition:</span>
          <Select value={slide?.transition || 'fade'} onValueChange={(v) => updateSlideTransition(v as Slide['transition'])}>
            <SelectTrigger className="h-6 w-20 text-[10px] rounded-lg border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {['none', 'fade', 'slide', 'zoom', 'flip', 'blur'].map(t => (
                <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="hidden sm:block text-[10px] text-muted-foreground tabular-nums ml-3">Slide {currentSlide + 1} of {slides.length}</span>
      </div>

      {/* Toolbar */}
      <SlideToolbar
        onAddSlide={addSlide}
        onAddElement={addElement}
        onDeleteSlide={deleteSlide}
        onPresent={() => setPresenting(true)}
        onToggleGrid={() => setShowGrid(g => !g)}
        onToggleNotes={() => setShowNotes(n => !n)}
        showGrid={showGrid}
        showNotes={showNotes}
        slideCount={slides.length}
        currentSlide={currentSlide}
        selectedElement={selectedEl}
        onUpdateElement={updateSelectedElement}
        onDeleteElement={deleteElement}
        onDuplicateElement={duplicateElement}
        onBringForward={bringForward}
        onSendBackward={sendBackward}
        onApplyTheme={applyTheme}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={undo}
        onRedo={redo}
        onDuplicateSlide={duplicateSlide}
        onToggleGuides={() => setShowGuides(g => !g)}
        showGuides={showGuides}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thumbnail Sidebar */}
        <div className="hidden md:flex md:flex-col w-52 border-r border-border/20 bg-card/30 backdrop-blur-sm overflow-y-auto shrink-0 p-2 space-y-1.5">
          <Reorder.Group axis="y" values={slides} onReorder={handleReorder} className="space-y-1.5">
            {slides.map((s, i) => (
              <Reorder.Item key={s.id} value={s}>
                <motion.div layout className="group relative">
                  <button
                    onClick={() => { setCurrentSlide(i); setSelectedElement(null); }}
                    className={cn(
                      "w-full rounded-xl overflow-hidden border-2 transition-all relative",
                      i === currentSlide
                        ? "border-orange-500 shadow-lg shadow-orange-500/15"
                        : "border-border/20 hover:border-border/50"
                    )}
                  >
                    <ScaledSlide slide={s} className="aspect-video w-full" />
                  </button>
                  <div className="absolute bottom-1.5 left-2 flex items-center gap-1">
                    <span className="text-[8px] font-bold text-foreground/50 bg-card/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                      {i + 1}
                    </span>
                    {s.notes && <FileText className="h-2.5 w-2.5 text-muted-foreground/40" />}
                  </div>
                  {/* Quick actions on hover */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); const dup: Slide = { ...s, id: uid(), elements: s.elements.map(e => ({ ...e, id: uid() })) }; const ns = [...slides]; ns.splice(i + 1, 0, dup); updateSlides(ns); }}
                      className="h-5 w-5 rounded-md bg-card/90 backdrop-blur-sm border border-border/30 flex items-center justify-center hover:bg-card">
                      <Copy className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                    {slides.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); const ns = slides.filter((_, j) => j !== i); updateSlides(ns); if (currentSlide >= ns.length) setCurrentSlide(ns.length - 1); }}
                        className="h-5 w-5 rounded-md bg-card/90 backdrop-blur-sm border border-border/30 flex items-center justify-center hover:bg-destructive/20">
                        <Trash2 className="h-2.5 w-2.5 text-destructive" />
                      </button>
                    )}
                  </div>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <button
            onClick={() => addSlide('blank')}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-border/20 hover:border-border/50 flex items-center justify-center transition-all hover:bg-card/40"
          >
            <Plus className="h-5 w-5 text-muted-foreground/30" />
          </button>
        </div>

        {/* Canvas + Notes */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 bg-muted/10 overflow-hidden relative" style={{ transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined, transformOrigin: 'center center' }}>
            <ScaledSlide
              slide={slide}
              className="w-full h-full"
              interactive
              selectedElement={selectedElement}
              editingElement={editingElement}
              onSelectElement={setSelectedElement}
              onEditElement={setEditingElement}
              onUpdateElement={updateElement}
              onDeselectAll={() => { setSelectedElement(null); setEditingElement(null); }}
              showGuides={showGuides}
            />
          </div>

          {/* Notes Panel */}
          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 160, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 border-t border-border/20 bg-card/60 backdrop-blur-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 h-8 border-b border-border/10">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Speaker Notes</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md" onClick={() => setShowNotes(false)}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                <Textarea
                  value={slide.notes}
                  onChange={(e) => updateNotes(e.target.value)}
                  placeholder="Add presenter notes for this slide…"
                  className="h-[128px] border-none bg-transparent resize-none text-xs text-muted-foreground focus:ring-0 focus-visible:ring-0 px-4 py-2"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Image Upload Dialog */}
      <SlideImageDialog
        open={showImageDialog}
        onOpenChange={setShowImageDialog}
        onInsert={(src) => addImageElement(src)}
      />
    </div>
  );
}

// --- Slide Image Upload Dialog ---
function SlideImageDialog({ open, onOpenChange, onInsert }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (src: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleInsert = () => {
    const src = preview || url;
    if (src) {
      onInsert(src);
      reset();
      onOpenChange(false);
    }
  };

  const reset = () => { setUrl(''); setPreview(null); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-orange-500" />
            Insert Image to Slide
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload" className="mt-1">
          <TabsList className="grid w-full grid-cols-2 h-8 rounded-lg">
            <TabsTrigger value="upload" className="text-[11px] rounded-md gap-1.5">
              <Upload className="h-3 w-3" /> From Computer
            </TabsTrigger>
            <TabsTrigger value="url" className="text-[11px] rounded-md gap-1.5">
              <Link2 className="h-3 w-3" /> From URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
                dragOver ? "border-orange-500 bg-orange-500/5 scale-[1.01]" : "border-border/40 hover:border-orange-500/40 hover:bg-muted/30",
                preview && "border-orange-500/30 bg-orange-500/5"
              )}
            >
              {preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow-md" />
                  <p className="text-[10px] text-muted-foreground">Click or drag to replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-10 w-10 mx-auto rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <FileUp className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Drop an image here or click to browse</p>
                  <p className="text-[10px] text-muted-foreground">PNG, JPG, GIF, WebP, SVG up to 10MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </TabsContent>
          <TabsContent value="url" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium">Image URL</Label>
              <Input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setPreview(null); }}
                placeholder="https://example.com/image.png"
                className="text-xs rounded-lg"
              />
            </div>
            {url && (
              <div className="rounded-lg overflow-hidden border border-border/30 bg-muted/20 p-2">
                <img src={url} alt="Preview" className="max-h-32 mx-auto rounded-md" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }} className="rounded-lg text-xs">Cancel</Button>
          <Button onClick={handleInsert} disabled={!preview && !url} className="rounded-lg text-xs gap-1.5 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700">
            <ImageIcon className="h-3 w-3" /> Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

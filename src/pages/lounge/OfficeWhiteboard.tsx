import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MousePointer2, Pencil, Square, Circle, Type, Minus, Eraser, Download, Undo2, Redo2, ZoomIn, ZoomOut, Palette, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type Tool = 'select' | 'pen' | 'rect' | 'ellipse' | 'text' | 'line' | 'eraser' | 'hand';

const TOOLS: { id: Tool; icon: any; label: string }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'hand', icon: Hand, label: 'Pan' },
  { id: 'pen', icon: Pencil, label: 'Pen' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'ellipse', icon: Circle, label: 'Ellipse' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

const COLORS = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];

export default function OfficeWhiteboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [activeColor, setActiveColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(imageData);
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const newIndex = historyIndex - 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const newIndex = historyIndex + 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  }, [history, historyIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.offsetWidth; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.offsetHeight); ctx.stroke();
    }
    for (let y = 0; y < canvas.offsetHeight; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.offsetWidth, y); ctx.stroke();
    }
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([imageData]);
    setHistoryIndex(0);
  }, []);

  // Helper to get position from mouse or touch event
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool !== 'pen' && activeTool !== 'eraser') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = activeTool === 'eraser' ? '#ffffff' : activeColor;
    ctx.lineWidth = activeTool === 'eraser' ? 20 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  // Prevent default touch behaviors (scroll/zoom) on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevent = (e: TouchEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };
    canvas.addEventListener('touchstart', prevent, { passive: false });
    canvas.addEventListener('touchmove', prevent, { passive: false });
    canvas.addEventListener('touchend', prevent, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', prevent);
      canvas.removeEventListener('touchmove', prevent);
      canvas.removeEventListener('touchend', prevent);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafa] dark:bg-[#1a1a1a] flex flex-col touch-none">
      {/* Top bar */}
      <header className="h-12 border-b border-border/30 bg-background/90 backdrop-blur-2xl flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0 overflow-hidden">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={() => navigate('/lounge/office/whiteboard-home', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm font-semibold text-foreground tracking-tight whitespace-nowrap">Untitled Whiteboard</span>

        <div className="flex-1 min-w-0" />

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setZoom(z => Math.max(25, z - 25))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-10 text-center font-mono">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setZoom(z => Math.min(400, z + 25))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={undo} disabled={historyIndex <= 0}>
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={redo} disabled={historyIndex >= history.length - 1}>
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0">
          <Download className="h-3.5 w-3.5" />
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Tool Rail — vertical on desktop, horizontal bottom bar on mobile */}
        {isMobile ? (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/30 flex items-center px-2 py-2 gap-1 overflow-x-auto scrollbar-none" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
            {TOOLS.map(tool => (
              <button key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-all shrink-0",
                  activeTool === tool.id ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground/60 active:bg-accent/40"
                )}>
                <tool.icon className="h-[18px] w-[18px]" />
              </button>
            ))}

            <div className="h-6 w-px bg-border/30 mx-1 shrink-0" />

            {COLORS.map(c => (
              <button key={c} onClick={() => setActiveColor(c)}
                className={cn("h-9 w-9 rounded-full border-2 transition-all shrink-0",
                  activeColor === c ? "border-foreground scale-110" : "border-transparent"
                )} style={{ background: c }} />
            ))}
          </div>
        ) : (
          <div className="w-12 border-r border-border/20 bg-background/60 backdrop-blur-xl flex flex-col items-center py-3 gap-1 shrink-0">
            {TOOLS.map(tool => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveTool(tool.id)}
                    className={cn("h-9 w-9 rounded-xl flex items-center justify-center transition-all", activeTool === tool.id ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground/60 hover:text-foreground hover:bg-accent/40")}
                  >
                    <tool.icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{tool.label}</TooltipContent>
              </Tooltip>
            ))}

            <div className="h-px w-6 bg-border/30 my-2" />

            <div className="flex flex-col gap-1">
              {COLORS.slice(0, 5).map(c => (
                <button key={c} onClick={() => setActiveColor(c)} className={cn("h-5 w-5 rounded-full border-2 transition-all", activeColor === c ? "border-foreground scale-110" : "border-transparent hover:scale-105")} style={{ background: c }} />
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className={cn("flex-1 overflow-hidden relative", isMobile && "pb-14")}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileCheck, Upload, Download, ZoomIn, ZoomOut, Type, Pen, Square, Highlighter, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type Tool = 'select' | 'text' | 'draw' | 'highlight' | 'rect';

interface Annotation {
  id: string;
  type: 'text' | 'draw' | 'highlight' | 'rect';
  page: number;
  x: number;
  y: number;
  content?: string;
  width?: number;
  height?: number;
  color: string;
  points?: { x: number; y: number }[];
}

const TOOLS: { id: Tool; icon: any; label: string }[] = [
  { id: 'text', icon: Type, label: 'Add Text' },
  { id: 'draw', icon: Pen, label: 'Draw' },
  { id: 'highlight', icon: Highlighter, label: 'Highlight' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
];

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000'];

export default function OfficePDF() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [zoom, setZoom] = useState(100);
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDraw, setCurrentDraw] = useState<{ x: number; y: number }[]>([]);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [textItems, setTextItems] = useState<{ str: string; x: number; y: number; width: number; height: number; fontSize: number; fontFamily: string; idx: number }[]>([]);
  const [editingPdfText, setEditingPdfText] = useState<number | null>(null);
  const [textEdits, setTextEdits] = useState<Record<string, Record<number, string>>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Render current page to canvas + overlay edits
  const renderPageRef = useRef<() => void>();
  
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const scale = (zoom / 100) * 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setPageSize({ width: viewport.width, height: viewport.height });

      const ctx = canvas.getContext('2d')!;
      if (!cancelled) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }

      // Extract text with positions
      const textContent = await page.getTextContent();
      const items: typeof textItems = [];
      textContent.items.forEach((item: any, idx: number) => {
        if (!item.str || !item.str.trim()) return;
        const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
        const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
        const x = tx[4];
        const y = tx[5] - fontSize;
        const width = item.width * scale;
        const height = fontSize * 1.2;
        items.push({ str: item.str, x, y, width: Math.max(width, fontSize * item.str.length * 0.6), height, fontSize, fontFamily: item.fontName || 'sans-serif', idx });
      });
      if (!cancelled) {
        setTextItems(items);
        // Paint edits over canvas
        const pk = `${currentPage}`;
        const edits = textEdits[pk];
        if (edits) {
          Object.entries(edits).forEach(([idxStr, newText]) => {
            const idx = parseInt(idxStr);
            const item = items.find(i => i.idx === idx);
            if (!item) return;
            // White-out original text
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(item.x - 1, item.y, item.width + 6, item.height + 2);
            // Draw new text
            if (newText.trim()) {
              ctx.fillStyle = '#000000';
              ctx.font = `${item.fontSize}px sans-serif`;
              ctx.textBaseline = 'top';
              ctx.fillText(newText, item.x, item.y + 1);
            }
          });
        }
      }
    };

    renderPageRef.current = renderPage;
    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, zoom, textEdits]);

  const pageKey = `${currentPage}`;
  const getEditedText = (idx: number, original: string) => textEdits[pageKey]?.[idx] ?? original;

  const loadPDF = async (f: File) => {
    const arrayBuffer = await f.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    setFile(f);
    setPdfDoc(doc);
    setTotalPages(doc.numPages);
    setCurrentPage(1);
    setAnnotations([]);
    toast.success(`PDF loaded — ${doc.numPages} page${doc.numPages > 1 ? 's' : ''}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === 'application/pdf') {
      loadPDF(f);
    } else {
      toast.error('Please upload a valid PDF file');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'application/pdf') loadPDF(f);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!containerRef.current || editingPdfText !== null) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'text') {
      const id = Date.now().toString();
      setAnnotations(prev => [...prev, { id, type: 'text', page: currentPage, x, y, content: '', color: activeColor }]);
      setEditingText(id);
    } else if (activeTool === 'rect') {
      setAnnotations(prev => [...prev, { id: Date.now().toString(), type: 'rect', page: currentPage, x: x - 50, y: y - 25, width: 100, height: 50, color: activeColor }]);
    } else if (activeTool === 'highlight') {
      setAnnotations(prev => [...prev, { id: Date.now().toString(), type: 'highlight', page: currentPage, x: x - 75, y: y - 10, width: 150, height: 20, color: '#fbbf24' }]);
    }
  };

  const handlePdfTextEdit = (idx: number, newText: string) => {
    setTextEdits(prev => ({
      ...prev,
      [pageKey]: { ...prev[pageKey], [idx]: newText }
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'draw' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setIsDrawing(true);
    setCurrentDraw([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCurrentDraw(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top }]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || currentDraw.length < 2) { setIsDrawing(false); return; }
    setAnnotations(prev => [...prev, { id: Date.now().toString(), type: 'draw', page: currentPage, x: 0, y: 0, color: activeColor, points: currentDraw }]);
    setCurrentDraw([]);
    setIsDrawing(false);
  };

  const removeAnnotation = (id: string) => setAnnotations(prev => prev.filter(a => a.id !== id));

  const pageAnnotations = annotations.filter(a => a.page === currentPage);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(10);
    doc.text(`Exported from Quooro PDF Studio — ${file?.name || 'Document'}`, 10, 10);

    annotations.forEach(ann => {
      if (ann.type === 'text' && ann.content) {
        doc.setTextColor(ann.color);
        doc.text(ann.content, ann.x * 0.35, ann.y * 0.35);
      } else if (ann.type === 'rect') {
        doc.setDrawColor(ann.color);
        doc.rect(ann.x * 0.35, ann.y * 0.35, (ann.width || 100) * 0.35, (ann.height || 50) * 0.35);
      } else if (ann.type === 'draw' && ann.points) {
        doc.setDrawColor(ann.color);
        for (let i = 1; i < ann.points.length; i++) {
          doc.line(ann.points[i - 1].x * 0.35, ann.points[i - 1].y * 0.35, ann.points[i].x * 0.35, ann.points[i].y * 0.35);
        }
      }
    });

    doc.save(`${file?.name?.replace('.pdf', '') || 'annotated'}-edited.pdf`);
    toast.success('PDF exported successfully');
  };

  // ─── Upload View ───
  if (!pdfDoc) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="h-[52px] border-b border-border/30 bg-background/80 backdrop- flex items-center px-5 gap-3 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to Office</span>
          </Button>
          <div className="h-4 w-px bg-border/40" />
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold tracking-tight">PDF Studio</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6"
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full p-10 rounded-3xl border-2 border-dashed border-border/30 bg-card/30 flex flex-col items-center gap-4 hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <div className="h-16 w-16 rounded-[14px] bg-destructive/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground mb-1">Upload a PDF</h2>
              <p className="text-sm text-muted-foreground/60">Drag & drop or click to browse. Supports PDF files up to 50MB.</p>
            </div>
            <Button variant="outline" className="rounded-xl mt-2">Choose File</Button>
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Editor View ───
  return (
    <div className="fixed inset-0 z-50 bg-muted flex flex-col">
      {/* Toolbar */}
      <header className="min-h-[52px] border-b border-border/30 bg-background/90 backdrop- flex flex-wrap items-center px-3 sm:px-4 gap-1.5 sm:gap-2 py-2 shrink-0">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => { setPdfDoc(null); setFile(null); setAnnotations([]); }}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs font-semibold text-foreground truncate max-w-[100px] sm:max-w-[200px]">{file?.name}</span>
        <div className="flex-1" />

        {/* Tools */}
        <div className="flex items-center gap-0.5 bg-muted/50 p-0.5 rounded-xl">
          {TOOLS.map(tool => (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)}
              className={cn("h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center transition-all", activeTool === tool.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground/60 hover:text-foreground")}>
              <tool.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Colors - hidden on very small screens, shown in second row */}
        <div className="hidden sm:flex gap-0.5">
          {COLORS.map(c => (
            <button key={c} onClick={() => setActiveColor(c)}
              className={cn("h-5 w-5 rounded-full border-2 transition-all", activeColor === c ? "border-foreground scale-110" : "border-transparent")}
              style={{ background: c }} />
          ))}
        </div>

        {/* Page nav */}
        {totalPages > 1 && (
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] text-muted-foreground font-mono w-10 text-center">{currentPage}/{totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Zoom - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setZoom(z => Math.max(50, z - 25))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-8 text-center font-mono">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setZoom(z => Math.min(200, z + 25))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setAnnotations([])}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={exportPDF}>
          <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
        </Button>

        {/* Mobile color row */}
        <div className="flex sm:hidden gap-1 w-full pt-1">
          {COLORS.map(c => (
            <button key={c} onClick={() => setActiveColor(c)}
              className={cn("h-6 w-6 rounded-full border-2 transition-all", activeColor === c ? "border-foreground scale-110" : "border-transparent")}
              style={{ background: c }} />
          ))}
        </div>
      </header>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-2 sm:p-6">
        <div
          ref={containerRef}
          className="relative shadow-lg rounded-lg"
          style={{ width: pageSize.width, height: pageSize.height }}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* PDF rendered to canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 rounded-lg" style={{ width: pageSize.width, height: pageSize.height }} />

          {/* Annotations SVG layer */}
          <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 10, width: pageSize.width, height: pageSize.height }}>
            {pageAnnotations.filter(a => a.type === 'draw').map(a => (
              <polyline key={a.id} points={a.points?.map(p => `${p.x},${p.y}`).join(' ') || ''} fill="none" stroke={a.color} strokeWidth="2" strokeLinecap="round" />
            ))}
            {isDrawing && currentDraw.length > 1 && (
              <polyline points={currentDraw.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={activeColor} strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>

          {/* PDF Text Layer - clickable/editable */}
          {activeTool === 'select' && textItems.map(item => {
            const edited = getEditedText(item.idx, item.str);
            const isEditing = editingPdfText === item.idx;
            return (
              <div
                key={`pdftext-${item.idx}`}
                className="absolute"
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width + 4,
                  height: item.height,
                  zIndex: 15,
                }}
              >
                {isEditing ? (
                  <input
                    autoFocus
                    defaultValue={edited}
                    onBlur={e => { handlePdfTextEdit(item.idx, e.target.value); setEditingPdfText(null); }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handlePdfTextEdit(item.idx, (e.target as HTMLInputElement).value); setEditingPdfText(null); } if (e.key === 'Escape') { setEditingPdfText(null); } e.stopPropagation(); }}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                    className="w-full h-full border-2 border-primary rounded-sm bg-white outline-none px-0.5"
                    style={{ fontSize: item.fontSize, fontFamily: 'sans-serif', lineHeight: `${item.height}px`, color: '#000' }}
                  />
                ) : (
                  <div
                    className="w-full h-full cursor-text rounded-sm hover:bg-primary/10 hover:outline hover:outline-1 hover:outline-primary/30 transition-colors"
                    onClick={e => { e.stopPropagation(); setEditingPdfText(item.idx); }}
                    onMouseDown={e => e.stopPropagation()}
                    style={{ fontSize: item.fontSize, fontFamily: 'sans-serif', lineHeight: `${item.height}px`, color: 'transparent' }}
                  >
                    {edited}
                  </div>
                )}
              </div>
            );
          })}

          {/* Text, highlight, rect annotations */}
          {pageAnnotations.filter(a => a.type !== 'draw').map(a => (
            <div key={a.id} className="absolute group" style={{ left: a.x, top: a.y, zIndex: 20 }}>
              {a.type === 'text' ? (
                <div className="relative">
                  {editingText === a.id ? (
                    <input autoFocus value={a.content || ''} onChange={e => setAnnotations(prev => prev.map(an => an.id === a.id ? { ...an, content: e.target.value } : an))}
                      onBlur={() => setEditingText(null)} onKeyDown={e => e.key === 'Enter' && setEditingText(null)}
                      className="min-w-[100px] px-1 py-0.5 text-sm border border-primary rounded bg-white outline-none" style={{ color: a.color }} />
                  ) : (
                    <span className="text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-accent" style={{ color: a.color }}
                      onClick={e => { e.stopPropagation(); setEditingText(a.id); }}>
                      {a.content || 'Click to type…'}
                    </span>
                  )}
                  <button onClick={e => { e.stopPropagation(); removeAnnotation(a.id); }}
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ) : a.type === 'highlight' ? (
                <div className="relative">
                  <div style={{ width: a.width, height: a.height, background: `${a.color}40` }} className="rounded" />
                  <button onClick={e => { e.stopPropagation(); removeAnnotation(a.id); }}
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ) : a.type === 'rect' ? (
                <div className="relative">
                  <div style={{ width: a.width, height: a.height, border: `2px solid ${a.color}` }} className="rounded" />
                  <button onClick={e => { e.stopPropagation(); removeAnnotation(a.id); }}
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Slide, SlideElement, SLIDE_WIDTH, SLIDE_HEIGHT } from './types';

interface ScaledSlideProps {
  slide: Slide;
  className?: string;
  interactive?: boolean;
  selectedElement?: string | null;
  editingElement?: string | null;
  onSelectElement?: (id: string | null) => void;
  onEditElement?: (id: string | null) => void;
  onUpdateElement?: (id: string, updates: Partial<SlideElement>) => void;
  onDeselectAll?: () => void;
  showGuides?: boolean;
}

export function ScaledSlide({
  slide,
  className,
  interactive = false,
  selectedElement,
  editingElement,
  onSelectElement,
  onEditElement,
  onUpdateElement,
  onDeselectAll,
  showGuides,
}: ScaledSlideProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: string; startX: number; startY: number; elX: number; elY: number; elW: number; elH: number } | null>(null);
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }>({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      setScale(Math.min(width / SLIDE_WIDTH, height / SLIDE_HEIGHT));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Smart snap guides
  const computeSnap = useCallback((id: string, x: number, y: number, w: number, h: number) => {
    const snap: { x?: number; y?: number } = {};
    const threshold = 10;
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Center guides
    if (Math.abs(cx - SLIDE_WIDTH / 2) < threshold) { snap.x = SLIDE_WIDTH / 2; }
    if (Math.abs(cy - SLIDE_HEIGHT / 2) < threshold) { snap.y = SLIDE_HEIGHT / 2; }

    // Edge guides
    for (const el of slide.elements) {
      if (el.id === id) continue;
      const ecx = el.x + el.w / 2;
      const ecy = el.y + el.h / 2;
      if (Math.abs(cx - ecx) < threshold) snap.x = ecx;
      if (Math.abs(cy - ecy) < threshold) snap.y = ecy;
      if (Math.abs(x - el.x) < threshold) snap.x = el.x + w / 2;
      if (Math.abs(x + w - (el.x + el.w)) < threshold) snap.x = el.x + el.w - w / 2;
    }

    setSnapLines(snap);
    return snap;
  }, [slide.elements]);

  const handleMouseDown = useCallback((e: React.MouseEvent, el: SlideElement) => {
    if (!interactive || editingElement === el.id || el.locked) return;
    e.stopPropagation();
    e.preventDefault();
    onSelectElement?.(el.id);
    setDragging({ id: el.id, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
  }, [interactive, editingElement, onSelectElement]);

  const handleResizeStart = useCallback((e: React.MouseEvent, el: SlideElement, handle: string) => {
    if (!interactive || el.locked) return;
    e.stopPropagation();
    e.preventDefault();
    setResizing({ id: el.id, handle, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y, elW: el.w, elH: el.h });
  }, [interactive]);

  // Drag handler
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragging.startX) / scale;
      const dy = (e.clientY - dragging.startY) / scale;
      const el = slide.elements.find(el => el.id === dragging.id);
      if (!el) return;
      const newX = Math.round(dragging.elX + dx);
      const newY = Math.round(dragging.elY + dy);
      computeSnap(dragging.id, newX, newY, el.w, el.h);
      onUpdateElement?.(dragging.id, { x: newX, y: newY });
    };
    const handleUp = () => { setDragging(null); setSnapLines({}); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [dragging, scale, onUpdateElement, computeSnap, slide.elements]);

  // Resize handler
  useEffect(() => {
    if (!resizing) return;
    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - resizing.startX) / scale;
      const dy = (e.clientY - resizing.startY) / scale;
      let { elX, elY, elW, elH } = resizing;
      const h = resizing.handle;

      if (h.includes('right')) elW = Math.max(40, elW + dx);
      if (h.includes('bottom')) elH = Math.max(40, elH + dy);
      if (h.includes('left')) { const nw = Math.max(40, elW - dx); elX = elX + (elW - nw); elW = nw; }
      if (h.includes('top')) { const nh = Math.max(40, elH - dy); elY = elY + (elH - nh); elH = nh; }

      onUpdateElement?.(resizing.id, { x: Math.round(elX), y: Math.round(elY), w: Math.round(elW), h: Math.round(elH) });
    };
    const handleUp = () => setResizing(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [resizing, scale, onUpdateElement]);

  const slideStyle: React.CSSProperties = {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    background: slide.bgImage ? `url(${slide.bgImage}) center/cover no-repeat` : (slide.bgGradient || slide.bg),
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -SLIDE_WIDTH / 2,
    marginTop: -SLIDE_HEIGHT / 2,
    transform: `scale(${scale})`,
    transformOrigin: 'center center',
  };

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)} onClick={() => onDeselectAll?.()}>
      <div style={slideStyle} className="slide-content shadow-2xl">
        {/* Snap guides */}
        {showGuides && snapLines.x != null && (
          <div className="absolute top-0 bottom-0 w-px bg-cyan-400/60 pointer-events-none z-[999]" style={{ left: snapLines.x }} />
        )}
        {showGuides && snapLines.y != null && (
          <div className="absolute left-0 right-0 h-px bg-cyan-400/60 pointer-events-none z-[999]" style={{ top: snapLines.y }} />
        )}

        {slide.elements.map((el) => (
          !el.hidden && (
            <SlideElementRenderer
              key={el.id}
              element={el}
              interactive={interactive}
              isSelected={selectedElement === el.id}
              isEditing={editingElement === el.id}
              onMouseDown={(e) => handleMouseDown(e, el)}
              onDoubleClick={() => { if (el.type === 'text') onEditElement?.(el.id); }}
              onUpdateContent={(content) => onUpdateElement?.(el.id, { content })}
              onUpdateImageUrl={(imageUrl) => onUpdateElement?.(el.id, { imageUrl })}
              onBlur={() => onEditElement?.(null)}
              onResizeStart={(e, handle) => handleResizeStart(e, el, handle)}
            />
          )
        ))}
      </div>
    </div>
  );
}

const RESIZE_HANDLES = [
  { id: 'top-left', cursor: 'nwse-resize', pos: '-top-[5px] -left-[5px]' },
  { id: 'top-right', cursor: 'nesw-resize', pos: '-top-[5px] -right-[5px]' },
  { id: 'bottom-left', cursor: 'nesw-resize', pos: '-bottom-[5px] -left-[5px]' },
  { id: 'bottom-right', cursor: 'nwse-resize', pos: '-bottom-[5px] -right-[5px]' },
  { id: 'top', cursor: 'ns-resize', pos: '-top-[4px] left-1/2 -translate-x-1/2 !w-6 !h-[8px] !rounded-full' },
  { id: 'bottom', cursor: 'ns-resize', pos: '-bottom-[4px] left-1/2 -translate-x-1/2 !w-6 !h-[8px] !rounded-full' },
  { id: 'left', cursor: 'ew-resize', pos: 'top-1/2 -left-[4px] -translate-y-1/2 !w-[8px] !h-6 !rounded-full' },
  { id: 'right', cursor: 'ew-resize', pos: 'top-1/2 -right-[4px] -translate-y-1/2 !w-[8px] !h-6 !rounded-full' },
];

function SelectionFrame({ editing, onResizeStart }: { editing?: boolean; onResizeStart?: (e: React.MouseEvent, handle: string) => void }) {
  return (
    <div className={cn(
      "absolute -inset-[3px] border-2 pointer-events-none rounded-sm",
      editing ? "border-orange-400" : "border-blue-500"
    )}>
      {!editing && RESIZE_HANDLES.map(h => (
        <div
          key={h.id}
          className={cn(
            "absolute w-[10px] h-[10px] bg-white border-2 border-blue-500 rounded-sm pointer-events-auto",
            h.pos
          )}
          style={{ cursor: h.cursor }}
          onMouseDown={(e) => onResizeStart?.(e, h.id)}
        />
      ))}
    </div>
  );
}

function renderShape(el: SlideElement) {
  const s = el.shape;
  if (s === 'triangle') return <svg viewBox="0 0 100 100" className="w-full h-full"><polygon points="50,5 95,95 5,95" fill={el.fill || '#3b82f6'} stroke={el.stroke} strokeWidth={el.strokeWidth || 0} /></svg>;
  if (s === 'diamond') return <svg viewBox="0 0 100 100" className="w-full h-full"><polygon points="50,2 98,50 50,98 2,50" fill={el.fill || '#3b82f6'} stroke={el.stroke} strokeWidth={el.strokeWidth || 0} /></svg>;
  if (s === 'star') return <svg viewBox="0 0 100 100" className="w-full h-full"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill={el.fill || '#3b82f6'} stroke={el.stroke} strokeWidth={el.strokeWidth || 0} /></svg>;
  if (s === 'hexagon') return <svg viewBox="0 0 100 100" className="w-full h-full"><polygon points="50,3 93,25 93,75 50,97 7,75 7,25" fill={el.fill || '#3b82f6'} stroke={el.stroke} strokeWidth={el.strokeWidth || 0} /></svg>;
  if (s === 'arrow') return <svg viewBox="0 0 100 60" className="w-full h-full" preserveAspectRatio="none"><polygon points="0,20 70,20 70,0 100,30 70,60 70,40 0,40" fill={el.fill || '#3b82f6'} stroke={el.stroke} strokeWidth={el.strokeWidth || 0} /></svg>;
  return null;
}

function SlideElementRenderer({
  element: el, interactive, isSelected, isEditing,
  onMouseDown, onDoubleClick, onUpdateContent, onUpdateImageUrl, onBlur, onResizeStart,
}: {
  element: SlideElement; interactive: boolean; isSelected: boolean; isEditing: boolean;
  onMouseDown: (e: React.MouseEvent) => void; onDoubleClick: () => void;
  onUpdateContent: (content: string) => void; onUpdateImageUrl: (url: string) => void; onBlur: () => void;
  onResizeStart: (e: React.MouseEvent, handle: string) => void;
}) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    opacity: el.opacity ?? 1,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    zIndex: el.zIndex ?? 0,
    filter: el.blur ? `blur(${el.blur}px)` : undefined,
  };

  // Image element
  if (el.type === 'image') {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleImageFile = (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === 'string') onUpdateImageUrl(result);
      };
      reader.readAsDataURL(file);
    };
    return (
      <div
        style={{ ...baseStyle, cursor: interactive ? 'move' : 'default', borderRadius: el.borderRadius || 0, overflow: 'hidden' }}
        onMouseDown={onMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        {el.imageUrl ? (
          <img src={el.imageUrl} alt="" className="w-full h-full" style={{ objectFit: el.imageFit || 'cover' }} draggable={false} />
        ) : (
          <div
            className="w-full h-full bg-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); if (interactive) fileInputRef.current?.click(); }}
          >
            <span className="text-[28px]">🖼️</span>
            {interactive && <span className="text-[14px] mt-2 font-medium">Click to add image</span>}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFile(file);
          }}
        />
        {isSelected && interactive && <SelectionFrame onResizeStart={onResizeStart} />}
      </div>
    );
  }

  if (el.type === 'shape') {
    const isSvgShape = ['triangle', 'diamond', 'star', 'hexagon', 'arrow'].includes(el.shape || '');
    if (isSvgShape) {
      return (
        <div style={{ ...baseStyle, cursor: interactive ? 'move' : 'default' }} onMouseDown={onMouseDown} onClick={(e) => e.stopPropagation()}>
          {renderShape(el)}
          {isSelected && interactive && <SelectionFrame onResizeStart={onResizeStart} />}
        </div>
      );
    }

    const shapeStyle: React.CSSProperties = {
      ...baseStyle,
      background: el.gradient || el.fill || '#3b82f6',
      border: el.stroke ? `${el.strokeWidth || 2}px solid ${el.stroke}` : undefined,
      borderRadius: el.shape === 'circle' ? '50%' : el.shape === 'rounded' ? 24 : el.borderRadius || 0,
      boxShadow: el.shadow ? '0 10px 40px rgba(0,0,0,0.2)' : undefined,
    };

    return (
      <div style={{ ...shapeStyle, cursor: interactive ? 'move' : 'default' }} onMouseDown={onMouseDown} onClick={(e) => e.stopPropagation()}>
        {isSelected && interactive && <SelectionFrame onResizeStart={onResizeStart} />}
      </div>
    );
  }

  // Text element
  const textStyle: React.CSSProperties = {
    ...baseStyle,
    fontSize: el.fontSize || 24,
    fontFamily: el.fontFamily || 'Inter, sans-serif',
    fontWeight: el.fontWeight || 'normal',
    fontStyle: el.fontStyle || 'normal',
    textDecoration: el.textDecoration || 'none',
    textAlign: el.textAlign || 'left',
    lineHeight: el.lineHeight || 1.3,
    color: el.color || '#0f172a',
    letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
    cursor: interactive ? (isEditing ? 'text' : 'move') : 'default',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'hidden',
    textShadow: el.shadow ? '0 2px 8px rgba(0,0,0,0.3)' : undefined,
  };

  if (isEditing) {
    return (
      <div style={textStyle} onClick={(e) => e.stopPropagation()}>
        <textarea
          autoFocus
          value={el.content}
          onChange={(e) => onUpdateContent(e.target.value)}
          onBlur={onBlur}
          className="w-full h-full bg-transparent border-none outline-none resize-none p-0 m-0"
          style={{ fontSize: 'inherit', fontFamily: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', textAlign: el.textAlign || 'left', lineHeight: 'inherit', color: 'inherit', letterSpacing: 'inherit' }}
        />
        <SelectionFrame editing onResizeStart={onResizeStart} />
      </div>
    );
  }

  return (
    <div style={textStyle} onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onClick={(e) => e.stopPropagation()}>
      {el.content}
      {isSelected && interactive && <SelectionFrame onResizeStart={onResizeStart} />}
    </div>
  );
}

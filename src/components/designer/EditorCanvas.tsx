import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEditor } from './EditorContext';
import { CanvasElement } from './CanvasElement';
import { DragGhost } from './DragGhost';
import { FloatingToolbar } from './FloatingToolbar';
import { QuickStartPanel } from './QuickStartPanel';
import { AddSectionButton } from './AddSectionButton';
import { createElement } from './utils/elementFactory';
import { ElementType } from './types';
import { CanvasRulers } from './CanvasRulers';
import { Monitor, Tablet, Smartphone, Move, ZoomIn, RotateCcw, Hand, MousePointer2 } from 'lucide-react';

const BREAKPOINT_CONFIGS = {
  desktop: { width: 1280, color: 'hsl(var(--studio-accent))', icon: Monitor, label: 'Desktop' },
  tablet: { width: 768, color: 'hsl(var(--studio-ink-3))', icon: Tablet, label: 'Tablet' },
  mobile: { width: 375, color: 'hsl(var(--studio-ok))', icon: Smartphone, label: 'Mobile' },
} as const;

export function EditorCanvas() {
  const { state, dispatch } = useEditor();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  // Written to directly on pointer move. React never re-renders for this.
  const cursorXRef = useRef<HTMLSpanElement>(null);
  const cursorYRef = useRef<HTMLSpanElement>(null);
  const [cursorInside, setCursorInside] = useState(false);
  // The wrapper's rect only changes when the pane resizes, not when the
  // pointer moves, so it is measured once and re-measured on resize.
  const wrapperRect = useRef<DOMRect | null>(null);
  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Grid & Snap State
  const [showGrid, setShowGrid] = useState(false);
  const SNAP_THRESHOLD = 8;
  const GRID_SIZE = 20;

  // Zoom animation
  const [zoomAnimating, setZoomAnimating] = useState(false);

  const bp = BREAKPOINT_CONFIGS[state.breakpoint];
  const breakpointWidth = bp.width;
  const zoom = state.zoom;
  const CANVAS_SIZE = 4000;
  const BreakpointIcon = bp.icon;
  const bpColor = bp.color;

  // Spacebar detection for panning
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.code === 'Space' && !e.repeat) { e.preventDefault(); setSpaceHeld(true); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') { setSpaceHeld(false); setIsPanning(false); }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Pan with mouse while space held
  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
    };
    const onUp = () => setIsPanning(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isPanning]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (spaceHeld) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: panOffset.x, panY: panOffset.y };
    }
  };

  // Zoom via Ctrl+wheel with cursor-relative zoom, pan otherwise
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newZoom = Math.min(3, Math.max(0.1, state.zoom + delta));
      
      // Zoom toward cursor position
      const wrapper = wrapperRef.current;
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const zoomRatio = newZoom / state.zoom;
        setPanOffset(prev => ({
          x: cx - zoomRatio * (cx - prev.x),
          y: cy - zoomRatio * (cy - prev.y),
        }));
      }
      
      dispatch({ type: 'SET_ZOOM', payload: newZoom });
    } else {
      setPanOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, [dispatch, state.zoom]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.canvas) {
      dispatch({ type: 'SELECT', payload: null });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.canvas) {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const fitZoom = Math.min(
        (rect.width - 80) / breakpointWidth,
        (rect.height - 120) / 800,
        1.5
      );
      dispatch({ type: 'SET_ZOOM', payload: Math.round(fitZoom * 20) / 20 });
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const newType = e.dataTransfer.getData('component-type') as ElementType;
    if (newType) {
      const wrapper = wrapperRef.current;
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const x = (e.clientX - rect.left - panOffset.x) / zoom - (CANVAS_SIZE - breakpointWidth) / 2;
        const y = (e.clientY - rect.top - panOffset.y) / zoom;
        const el = createElement(newType);
        el.styles.desktop = {
          ...el.styles.desktop,
          position: 'absolute',
          left: `${Math.round(Math.max(0, x))}px`,
          top: `${Math.round(Math.max(0, y))}px`,
        };
        dispatch({ type: 'ADD_ELEMENT', payload: { element: el } });
      } else {
        dispatch({ type: 'ADD_ELEMENT', payload: { element: createElement(newType) } });
      }
    }
    dispatch({ type: 'SET_DRAG', payload: null });
  };

  // Reset view handler
  const resetView = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
    dispatch({ type: 'SET_ZOOM', payload: 1 });
  }, [dispatch]);

  // Measure the canvas pane once, and again only when it actually changes
  // size. Reading it inside the pointer handler forced a synchronous layout
  // on every single mouse move.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const measure = () => { wrapperRect.current = wrapper.getBoundingClientRect(); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrapper);
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('scroll', measure, { passive: true, capture: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, { capture: true } as EventListenerOptions);
    };
  }, []);

  // Element count for canvas info
  const elementCount = useMemo(() => {
    let count = 0;
    const walk = (els: any[]) => { for (const e of els) { count++; if (e.children?.length) walk(e.children); } };
    walk(state.elements);
    return count;
  }, [state.elements]);

  return (
    <div
      ref={wrapperRef}
      /* A quiet 32px grid, so the page being built reads as an object
         sitting on a surface rather than a div on a flat colour. It is the
         cheapest thing that makes a canvas feel like a canvas. */
      className="studio-canvas-plane flex-1"
      style={{
        overflow: 'hidden',
        position: 'relative',
        minHeight: 0,
        cursor: spaceHeld ? (isPanning ? 'grabbing' : 'grab') : 'default',
        userSelect: isPanning ? 'none' : undefined,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseMove={e => {
        const rect = wrapperRect.current;
        if (!rect) return;
        const rawX = (e.clientX - rect.left - panOffset.x) / zoom;
        const rawY = (e.clientY - rect.top - panOffset.y) / zoom;
        const artboardLeft = CANVAS_SIZE / 2 - breakpointWidth / 2;
        const x = Math.round(rawX - artboardLeft);
        const y = Math.round(rawY - 60);
        const inside = x >= 0 && x <= breakpointWidth && y >= 0;
        if (inside) {
          if (cursorXRef.current) cursorXRef.current.textContent = `X:${x}`;
          if (cursorYRef.current) cursorYRef.current.textContent = `Y:${y}`;
        }
        // State changes only when crossing the artboard edge, not per pixel.
        if (inside !== cursorInside) setCursorInside(inside);
      }}
      onMouseLeave={() => setCursorInside(false)}
      data-canvas="true"
    >
      {/* A floating readout used to sit here repeating the viewport, the
          width, the zoom and the element count - all four of which are
          already on the top bar, the zoom control and the status bar. Four
          duplicated facts covering the artboard is exactly what made the
          canvas feel cluttered rather than considered. Only the transient
          pan hint survives, because nothing else reports that. */}
      {spaceHeld && (
        <div
          className="pointer-events-none absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-[7px] border border-[hsl(var(--studio-line))] bg-[hsl(var(--studio-panel))]/95 px-2.5 py-1 backdrop-blur"
          role="status"
        >
          <Hand className="h-3 w-3 text-[hsl(var(--studio-ink-2))]" />
          <span className="text-[10.5px] font-medium text-[hsl(var(--studio-ink-2))]">Panning</span>
        </div>
      )}

      {/* Canvas controls — bottom right — premium glass panel */}
      <div style={{
        position: 'absolute', bottom: '16px', right: '16px', zIndex: 20,
        display: 'flex', flexDirection: 'column', gap: '1px',
        borderRadius: '14px', overflow: 'hidden',
        backgroundColor: 'rgba(14,14,14,0.96)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Zoom in */}
        <button
          onClick={() => dispatch({ type: 'SET_ZOOM', payload: Math.min(3, state.zoom + 0.15) })}
          className="h-8 w-8 flex items-center justify-center transition-all duration-150"
          style={{ color: 'hsl(var(--studio-ink-3))' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--studio-ink))'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--studio-ink-3))'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          title="Zoom in (⌘+)"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>

        {/* Zoom percentage button — click cycles through preset zoom levels */}
        <button
          onClick={() => {
            const presets = [0.5, 0.75, 1, 1.5, 2];
            const current = Math.round(state.zoom * 100) / 100;
            const next = presets.find(p => p > current + 0.01) || presets[0];
            dispatch({ type: 'SET_ZOOM', payload: next });
          }}
          className="h-6 flex items-center justify-center transition-all duration-150"
          style={{ color: Math.round(zoom * 100) !== 100 ? bpColor: 'hsl(var(--studio-hover))', fontSize: '9px', fontWeight: 700, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--studio-ink))'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = Math.round(zoom * 100) !== 100 ? bpColor: 'hsl(var(--studio-hover))'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          title="Click to cycle zoom presets"
        >
          {Math.round(zoom * 100)}%
        </button>

        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.04)', margin: '0 6px' }} />

        {/* Grid toggle */}
        <button
          onClick={() => setShowGrid(g => !g)}
          className="h-8 w-8 flex items-center justify-center transition-all duration-150"
          style={{ color: showGrid ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line-strong))', backgroundColor: showGrid ? 'hsl(var(--studio-accent) / 0.08)' : 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.color = showGrid ? '#3B9AFF' : 'hsl(var(--studio-ink))'; e.currentTarget.style.backgroundColor = showGrid ? 'hsl(var(--studio-accent) / 0.12)' : 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = showGrid ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line-strong))'; e.currentTarget.style.backgroundColor = showGrid ? 'hsl(var(--studio-accent) / 0.08)' : 'transparent'; }}
          title={showGrid ? 'Hide grid (G)' : 'Show grid (G)'}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="4" y1="0" x2="4" y2="16" /><line x1="8" y1="0" x2="8" y2="16" /><line x1="12" y1="0" x2="12" y2="16" />
            <line x1="0" y1="4" x2="16" y2="4" /><line x1="0" y1="8" x2="16" y2="8" /><line x1="0" y1="12" x2="16" y2="12" />
          </svg>
        </button>

        <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.04)', margin: '0 6px' }} />

        {/* Reset */}
        <button
          onClick={resetView}
          className="h-8 w-8 flex items-center justify-center transition-all duration-150"
          style={{ color: Math.round(zoom * 100) !== 100 || panOffset.x !== 0 || panOffset.y !== 0 ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line))' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--studio-ink))'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = Math.round(zoom * 100) !== 100 || panOffset.x !== 0 || panOffset.y !== 0 ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-line))'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          title="Reset view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <CanvasRulers />

      {/* Pannable + zoomable layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          willChange: 'transform',
        }}
      >
        {/* Dot grid background — with optional snap grid overlay */}
        <div
          style={{
            position: 'absolute',
            top: -CANVAS_SIZE,
            left: -CANVAS_SIZE,
            width: CANVAS_SIZE * 3,
            height: CANVAS_SIZE * 3,
            backgroundImage: showGrid
              ? `
                linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
              `
              : `
                radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px),
                radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)
              `,
            backgroundSize: showGrid
              ? `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px, ${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px, ${GRID_SIZE * 5 * zoom}px ${GRID_SIZE * 5 * zoom}px, ${GRID_SIZE * 5 * zoom}px ${GRID_SIZE * 5 * zoom}px`
              : `${20 * zoom}px ${20 * zoom}px, ${100 * zoom}px ${100 * zoom}px`,
            pointerEvents: 'none',
            transition: 'opacity 0.2s',
          }}
          data-canvas="true"
        />

        {/* Artboard */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: '50%',
            marginLeft: -(breakpointWidth * zoom) / 2,
            width: breakpointWidth * zoom,
            minHeight: 800 * zoom,
            backgroundColor: 'hsl(var(--studio-ink))',
            borderRadius: `${8 * zoom}px`,
            boxShadow: isDragOver
              ? `0 0 0 2px ${bpColor}, 0 0 60px ${bpColor}22, 0 24px 80px rgba(0,0,0,0.5)`
              : `0 0 0 1px rgba(255,255,255,0.04), 0 40px 120px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.25)`,
            transition: 'box-shadow 0.3s ease',
            overflow: 'visible',
          }}
        >
          {/* Artboard label — enhanced with ruler ticks */}
          <div style={{
            position: 'absolute',
            top: -42 * zoom,
            left: 0,
            right: 0,
          }}>
            {/* Ruler tick marks along top of artboard */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${6 * zoom}px`,
              overflow: 'hidden',
            }}>
              {Array.from({ length: Math.floor(breakpointWidth / 100) + 1 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${(i * 100 / breakpointWidth) * 100}%`,
                    bottom: 0,
                    width: 1,
                    height: `${(i % 5 === 0 ? 6 : 3) * zoom}px`,
                    backgroundColor: i % 5 === 0 ? 'hsl(var(--studio-line))' : 'hsl(var(--studio-raised))',
                  }}
                />
              ))}
            </div>
            {/* Labels row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: `${6 * zoom}px`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * zoom}px` }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${6 * zoom}px`,
                  padding: `${3 * zoom}px ${10 * zoom}px`,
                  borderRadius: `${8 * zoom}px`,
                  backgroundColor: 'rgba(14,14,14,0.9)',
                  border: `1px solid ${bpColor}25`,
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                }}>
                  <BreakpointIcon style={{ width: `${12 * zoom}px`, height: `${12 * zoom}px`, color: bpColor }} />
                  <span style={{
                    fontSize: `${11 * zoom}px`,
                    color: bpColor,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>
                    {bp.label}
                  </span>
                  <span style={{
                    fontSize: `${10 * zoom}px`,
                    color: 'hsl(var(--studio-ink-3))',
                    fontWeight: 500,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}>
                    {breakpointWidth}px
                  </span>
                </div>
              </div>
              {state.elements.length > 0 && (
                <div style={{
                  padding: `${3 * zoom}px ${8 * zoom}px`,
                  borderRadius: `${6 * zoom}px`,
                  backgroundColor: 'rgba(14,14,14,0.8)',
                  fontSize: `${9 * zoom}px`,
                  color: 'hsl(var(--studio-hover))',
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  border: '1px solid hsl(var(--studio-line))',
                }}>
                  {elementCount} element{elementCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Inner content area */}
          <div
            style={{
              position: 'relative',
              width: breakpointWidth,
              minHeight: 800,
              transformOrigin: 'top left',
              transform: `scale(${zoom})`,
            }}
            data-canvas="true"
          >
            {state.elements.length === 0 ? (
              <QuickStartPanel />
            ) : (
              <AnimatePresence mode="sync">
                {state.elements.map(el => (
                  <CanvasElement key={el.id} element={el} canvasZoom={zoom} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Drag ghost overlay */}
      <DragGhost />

      {/* Floating toolbar for selected elements */}
      <FloatingToolbar />

      {/* Add section button */}
      <AddSectionButton />

      {/* Cursor coordinate readout + mode indicator */}
      <AnimatePresence>
        {(cursorInside || spaceHeld) && !isPanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              border: '1px solid hsl(var(--studio-line))',
              backdropFilter: 'blur(8px)',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            {/* Mode badge */}
            <span style={{
              fontSize: '7px', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.08em', padding: '1px 4px', borderRadius: '3px',
              backgroundColor: spaceHeld ? 'hsl(var(--studio-ink-3) / 0.15)' : 'hsl(var(--studio-accent) / 0.1)',
              color: spaceHeld ? 'hsl(var(--studio-ink-3))' : 'hsl(var(--studio-accent))',
              border: `1px solid ${spaceHeld ? 'hsl(var(--studio-ink-3) / 0.25)' : 'hsl(var(--studio-accent) / 0.15)'}`,
            }}>
              {spaceHeld ? 'PAN' : 'SELECT'}
            </span>
            {cursorInside && (
              <>
                <span ref={cursorXRef} style={{ fontSize: '10px', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: 'hsl(var(--studio-ink-2))' }} />
                <span ref={cursorYRef} style={{ fontSize: '10px', fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: 'hsl(var(--studio-ink-2))' }} />
              </>
            )}
            {showGrid && (
              <span style={{ fontSize: '7px', fontWeight: 700, color: 'hsl(var(--studio-warn))', padding: '1px 3px', borderRadius: '2px', backgroundColor: 'rgba(245,158,11,0.1)' }}>
                GRID
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Structure minimap */}
      {/* The structure minimap used to float here permanently, drawing the
          page as stacked coloured bars over the bottom-right of the
          artboard - decoration that obscured the work it described. The
          layers panel already shows structure, properly, and can be
          scrolled and clicked. */}

      {/* Drag over indicator */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              border: `2px dashed ${bpColor}`,
              borderRadius: '12px',
              pointerEvents: 'none',
              zIndex: 5,
              background: `radial-gradient(circle at center, ${bpColor}08 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

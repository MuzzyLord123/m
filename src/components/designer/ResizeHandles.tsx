import React, { useCallback, useRef, useState, memo } from 'react';
import { useEditor } from './EditorContext';

interface ResizeHandlesProps {
  elementId: string;
}

const HANDLE_SIZE = 7;

type HandleDef = {
  cursor: string;
  pos: string;
  dx: number;
  dy: number;
  type: 'corner' | 'edge';
};

const HANDLES: HandleDef[] = [
  { cursor: 'nw-resize', pos: 'top-left', dx: -1, dy: -1, type: 'corner' },
  { cursor: 'n-resize', pos: 'top-center', dx: 0, dy: -1, type: 'edge' },
  { cursor: 'ne-resize', pos: 'top-right', dx: 1, dy: -1, type: 'corner' },
  { cursor: 'e-resize', pos: 'right', dx: 1, dy: 0, type: 'edge' },
  { cursor: 'se-resize', pos: 'bottom-right', dx: 1, dy: 1, type: 'corner' },
  { cursor: 's-resize', pos: 'bottom-center', dx: 0, dy: 1, type: 'edge' },
  { cursor: 'sw-resize', pos: 'bottom-left', dx: -1, dy: 1, type: 'corner' },
  { cursor: 'w-resize', pos: 'left', dx: -1, dy: 0, type: 'edge' },
];

function getHandleStyle(pos: string, type: 'corner' | 'edge'): React.CSSProperties {
  const half = -HANDLE_SIZE / 2;
  const base: React.CSSProperties = {
    position: 'absolute',
    zIndex: 60,
  };

  if (type === 'corner') {
    base.width = HANDLE_SIZE;
    base.height = HANDLE_SIZE;
    base.borderRadius = '2px';
  } else {
    // Edge handles are thinner bars
    if (pos === 'top-center' || pos === 'bottom-center') {
      base.width = '24px';
      base.height = '4px';
      base.borderRadius = '2px';
    } else {
      base.width = '4px';
      base.height = '24px';
      base.borderRadius = '2px';
    }
  }

  switch (pos) {
    case 'top-left': return { ...base, top: half, left: half };
    case 'top-center': return { ...base, top: -2, left: '50%', marginLeft: -12 };
    case 'top-right': return { ...base, top: half, right: half };
    case 'right': return { ...base, top: '50%', right: -2, marginTop: -12 };
    case 'bottom-right': return { ...base, bottom: half, right: half };
    case 'bottom-center': return { ...base, bottom: -2, left: '50%', marginLeft: -12 };
    case 'bottom-left': return { ...base, bottom: half, left: half };
    case 'left': return { ...base, top: '50%', left: -2, marginTop: -12 };
    default: return base;
  }
}

export const ResizeHandles = memo(function ResizeHandles({ elementId }: ResizeHandlesProps) {
  const { state, dispatch } = useEditor();
  const startRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [snappedWidth, setSnappedWidth] = useState<number | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, dx: number, dy: number, pos: string) => {
    e.preventDefault();
    e.stopPropagation();

    const el = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const zoom = state.zoom;
    startRef.current = { x: e.clientX, y: e.clientY, width: rect.width / zoom, height: rect.height / zoom };
    setActiveHandle(pos);
    setDimensions({ w: Math.round(rect.width / zoom), h: Math.round(rect.height / zoom) });

    const onMove = (ev: MouseEvent) => {
      if (!startRef.current) return;
      const deltaX = (ev.clientX - startRef.current.x) / zoom;
      const deltaY = (ev.clientY - startRef.current.y) / zoom;

      const updates: Record<string, string> = {};
      let newW = startRef.current.width;
      let newH = startRef.current.height;

      if (dx !== 0) {
        newW = Math.max(20, startRef.current.width + deltaX * dx);
        // Snap to common widths
        const snapPoints = [100, 200, 300, 400, 500, 600, 800, 1000, 1200];
        let snapped = false;
        for (const snap of snapPoints) {
          if (Math.abs(newW - snap) < 6) { newW = snap; snapped = true; break; }
        }
        setSnappedWidth(snapped ? newW : null);
        updates.width = `${Math.round(newW)}px`;
      }
      if (dy !== 0) {
        newH = Math.max(20, startRef.current.height + deltaY * dy);
        updates.height = `${Math.round(newH)}px`;
      }

      setDimensions({ w: Math.round(newW), h: Math.round(newH) });

      const element = state.elements.reduce<any>((acc, el) => acc || findEl(el, elementId), null);
      if (!element) return;

      const bp = state.breakpoint;
      const newStyles = { ...element.styles };
      if (bp === 'desktop') {
        newStyles.desktop = { ...newStyles.desktop, ...updates };
      } else {
        newStyles[bp] = { ...(newStyles[bp] ?? {}), ...updates };
      }
      dispatch({ type: 'UPDATE_ELEMENT', payload: { id: elementId, updates: { styles: newStyles } } });
    };

    const onUp = () => {
      startRef.current = null;
      setActiveHandle(null);
      setDimensions(null);
      setSnappedWidth(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [elementId, state.zoom, state.breakpoint, state.elements, dispatch]);

  return (
    <>
      {HANDLES.map(h => (
        <div
          key={h.pos}
          onMouseDown={e => handleMouseDown(e, h.dx, h.dy, h.pos)}
          style={{
            ...getHandleStyle(h.pos, h.type),
            backgroundColor: activeHandle === h.pos ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink))',
            border: `1.5px solid ${activeHandle === h.pos ? '#004d99' : 'hsl(var(--studio-accent))'}`,
            cursor: h.cursor,
            boxShadow: activeHandle === h.pos
              ? '0 0 8px hsl(var(--studio-accent) / 0.5)'
              : '0 1px 4px rgba(0,0,0,0.25)',
            transition: 'background-color 0.1s, box-shadow 0.15s, transform 0.1s',
            opacity: h.type === 'edge' ? 0.7 : 1,
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.transform = 'scale(1.25)';
            (e.target as HTMLElement).style.opacity = '1';
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.transform = 'scale(1)';
            (e.target as HTMLElement).style.opacity = h.type === 'edge' ? '0.7' : '1';
          }}
        />
      ))}

      {/* Live dimension tooltip */}
      {activeHandle && dimensions && (
        <div
          style={{
            position: 'absolute',
            bottom: -32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '6px',
            backgroundColor: 'hsl(var(--studio-accent) / 0.95)',
            color: 'hsl(var(--studio-ink))',
            fontSize: '10px',
            fontWeight: 600,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <span>{dimensions.w} × {dimensions.h}</span>
          {snappedWidth && (
            <span style={{
              fontSize: '7px',
              fontWeight: 700,
              padding: '1px 4px',
              borderRadius: '3px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.05em',
            }}>
              SNAP {snappedWidth}px
            </span>
          )}
        </div>
      )}
    </>
  );
});

function findEl(el: any, id: string): any {
  if (el.id === id) return el;
  for (const c of el.children || []) {
    const found = findEl(c, id);
    if (found) return found;
  }
  return null;
}

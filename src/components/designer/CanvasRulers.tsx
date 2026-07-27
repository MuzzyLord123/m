import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useEditor } from './EditorContext';

interface GuidelineData {
  id: string;
  position: number; // in design pixels
  axis: 'x' | 'y';
}

export const CanvasRulers = memo(function CanvasRulers() {
  const { state } = useEditor();
  const bpWidth = state.breakpoint === 'desktop' ? 1280 : state.breakpoint === 'tablet' ? 768 : 375;
  const zoom = state.zoom;
  const pixelWidth = bpWidth * zoom;

  const [guidelines, setGuidelines] = useState<GuidelineData[]>([]);
  const [draggingGuide, setDraggingGuide] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<number | null>(null);
  const hRulerRef = useRef<HTMLDivElement>(null);

  const majorInterval = bpWidth <= 375 ? 50 : 100;
  const minorInterval = bpWidth <= 375 ? 10 : 25;
  const subMinorInterval = bpWidth <= 375 ? 5 : 10;

  // Horizontal ticks
  const hTicks = useMemo(() => {
    const t: { pos: number; label?: string; type: 'major' | 'minor' | 'sub' }[] = [];
    for (let px = 0; px <= bpWidth; px += subMinorInterval) {
      const isMajor = px % majorInterval === 0;
      const isMinor = !isMajor && px % minorInterval === 0;
      t.push({
        pos: px * zoom,
        label: isMajor ? String(px) : undefined,
        type: isMajor ? 'major' : isMinor ? 'minor' : 'sub',
      });
    }
    return t;
  }, [bpWidth, zoom, majorInterval, minorInterval, subMinorInterval]);

  // Track cursor position on ruler for tooltip
  const handleRulerMouseMove = useCallback((e: React.MouseEvent) => {
    if (!hRulerRef.current) return;
    const rect = hRulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverPos(Math.round(x / zoom));
  }, [zoom]);

  const handleRulerMouseLeave = useCallback(() => setHoverPos(null), []);

  // Create guide on click
  const handleRulerClick = useCallback((e: React.MouseEvent) => {
    if (!hRulerRef.current) return;
    const rect = hRulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const designPx = Math.round(x / zoom);
    if (designPx >= 0 && designPx <= bpWidth) {
      setGuidelines(prev => [...prev, {
        id: `guide-${Date.now()}`,
        position: designPx,
        axis: 'x',
      }]);
    }
  }, [zoom, bpWidth]);

  // Remove guide on double click
  const handleGuideDoubleClick = useCallback((id: string) => {
    setGuidelines(prev => prev.filter(g => g.id !== id));
  }, []);

  const tickHeights = { major: 14, minor: 8, sub: 4 };
  const tickColors = {
    major: 'rgba(255,255,255,0.3)',
    minor: 'rgba(255,255,255,0.12)',
    sub: 'rgba(255,255,255,0.05)',
  };

  return (
    <>
      {/* Horizontal ruler */}
      <div
        ref={hRulerRef}
        onMouseMove={handleRulerMouseMove}
        onMouseLeave={handleRulerMouseLeave}
        onClick={handleRulerClick}
        style={{
          position: 'absolute',
          top: '28px',
          left: '50%',
          transform: `translateX(-${pixelWidth / 2}px)`,
          width: pixelWidth,
          height: '22px',
          zIndex: 15,
          cursor: 'col-resize',
          overflow: 'visible',
        }}
      >
        {/* Ruler body */}
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(16,16,16,0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0 0 4px 4px',
          position: 'relative',
          backdropFilter: 'blur(8px)',
        }}>
          {/* Guide count badge */}
          {guidelines.length > 0 && (
            <div style={{
              position: 'absolute', right: '4px', top: '2px', zIndex: 2,
              display: 'flex', alignItems: 'center', gap: '2px',
              padding: '0 4px', height: '12px', borderRadius: '6px',
              backgroundColor: 'rgba(0,115,230,0.12)',
              border: '1px solid rgba(0,115,230,0.2)',
            }}>
              <span style={{ fontSize: '7px', fontWeight: 800, color: '#0073E6', fontFamily: 'ui-monospace, monospace' }}>
                {guidelines.length} {guidelines.length === 1 ? 'guide' : 'guides'}
              </span>
            </div>
          )}
          {/* Tick marks */}
          {hTicks.map((t, i) => (
            <div key={i} style={{ position: 'absolute', left: t.pos, bottom: 0 }}>
              <div style={{
                width: '1px',
                height: `${tickHeights[t.type]}px`,
                backgroundColor: tickColors[t.type],
                transition: 'height 0.1s ease',
              }} />
              {t.label && (
                <span style={{
                  position: 'absolute',
                  bottom: `${tickHeights.major + 2}px`,
                  left: '2px',
                  fontSize: '7px',
                  color: 'rgba(255,255,255,0.3)',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}>
                  {t.label}
                </span>
              )}
            </div>
          ))}

          {/* Center line */}
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: 0,
            width: '1px',
            height: '18px',
            backgroundColor: 'rgba(0,115,230,0.5)',
          }} />

          {/* Half marks */}
          <div style={{
            position: 'absolute',
            left: '25%',
            bottom: 0,
            width: '1px',
            height: '12px',
            backgroundColor: 'rgba(0,115,230,0.15)',
          }} />
          <div style={{
            position: 'absolute',
            left: '75%',
            bottom: 0,
            width: '1px',
            height: '12px',
            backgroundColor: 'rgba(0,115,230,0.15)',
          }} />

          {/* Hover cursor position indicator */}
          {hoverPos !== null && hoverPos >= 0 && hoverPos <= bpWidth && (
            <>
              <div style={{
                position: 'absolute',
                left: hoverPos * zoom,
                bottom: 0,
                width: '1px',
                height: '22px',
                backgroundColor: 'rgba(0,115,230,0.8)',
                pointerEvents: 'none',
                transition: 'left 0.02s linear',
              }} />
              <div style={{
                position: 'absolute',
                left: hoverPos * zoom + 4,
                top: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '8px',
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                color: '#0073E6',
                fontWeight: 700,
                backgroundColor: 'rgba(0,10,20,0.95)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(0,115,230,0.2)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}>
                <span>{hoverPos}px</span>
                <span style={{ color: '#444' }}>·</span>
                <span style={{ color: '#8b5cf6', fontWeight: 600 }}>
                  {Math.round((hoverPos / bpWidth) * 100)}%
                </span>
                {Math.abs(hoverPos - bpWidth / 2) < 3 && (
                  <span style={{ color: '#22c55e', fontSize: '7px', fontWeight: 700 }}>CENTER</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Guidelines rendered on canvas */}
      {guidelines.map(guide => (
        <div
          key={guide.id}
          onDoubleClick={() => handleGuideDoubleClick(guide.id)}
          style={{
            position: 'absolute',
            top: '50px',
            left: '50%',
            transform: `translateX(${-pixelWidth / 2 + guide.position * zoom}px)`,
            width: '1px',
            height: 'calc(100% - 50px)',
            backgroundColor: 'rgba(236,72,153,0.5)',
            zIndex: 14,
            cursor: 'col-resize',
            pointerEvents: 'auto',
          }}
        >
          {/* Guide label */}
          <div style={{
            position: 'absolute',
            top: '-18px',
            left: '4px',
            fontSize: '8px',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            color: '#ec4899',
            fontWeight: 600,
            backgroundColor: 'rgba(236,72,153,0.12)',
            padding: '1px 4px',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
          }}>
            {guide.position}px
          </div>
          {/* Handle diamond */}
          <div style={{
            position: 'absolute',
            top: '-4px',
            left: '-3px',
            width: '7px',
            height: '7px',
            backgroundColor: '#ec4899',
            transform: 'rotate(45deg)',
            borderRadius: '1px',
          }} />
        </div>
      ))}

      {/* Corner origin badge with crosshair indicator */}
      <div style={{
        position: 'absolute',
        top: '28px',
        left: '50%',
        transform: `translateX(-${pixelWidth / 2 + 18}px)`,
        width: '18px',
        height: '22px',
        backgroundColor: 'rgba(16,16,16,0.92)',
        zIndex: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '0 0 0 4px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
      }}
      title="Origin (0, 0)"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" style={{ opacity: 0.3 }}>
          <line x1="0" y1="0" x2="0" y2="8" stroke="white" strokeWidth="1" />
          <line x1="0" y1="0" x2="8" y2="0" stroke="white" strokeWidth="1" />
          <circle cx="0" cy="0" r="1.5" fill="white" />
        </svg>
      </div>

      {/* Cursor crosshair extending from ruler */}
      {hoverPos !== null && hoverPos >= 0 && hoverPos <= bpWidth && (
        <div
          style={{
            position: 'absolute',
            top: '50px',
            left: '50%',
            transform: `translateX(${-pixelWidth / 2 + hoverPos * zoom}px)`,
            width: '1px',
            height: 'calc(100% - 50px)',
            background: 'linear-gradient(180deg, rgba(0,115,230,0.15) 0%, rgba(0,115,230,0.03) 50%, transparent 100%)',
            zIndex: 13,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
});

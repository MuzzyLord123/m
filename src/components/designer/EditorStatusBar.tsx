import { useEditor } from './EditorContext';
import { findElement, findParent } from './utils/treeUtils';
import { ChevronRight, Layers, MousePointer2, Command, Save, HardDrive, Gauge, Keyboard, Clock, Zap } from 'lucide-react';
import { useMemo, useState, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function countElements(elements: any[]): number {
  let count = 0;
  for (const el of elements) {
    count++;
    if (el.children?.length) count += countElements(el.children);
  }
  return count;
}

function getBreadcrumb(elements: any[], id: string): { name: string; id: string; type: string }[] {
  const path: { name: string; id: string; type: string }[] = [];
  let current: any = findElement(elements, id);
  if (!current) return path;
  path.unshift({ name: current.name || current.type, id: current.id, type: current.type });
  let parent = findParent(elements, id);
  while (parent) {
    path.unshift({ name: parent.name || parent.type, id: parent.id, type: parent.type });
    parent = findParent(elements, parent.id);
  }
  return path;
}

const TYPE_COLORS: Record<string, string> = {
  section: '#8b5cf6', container: '#6366f1', columns: '#3b82f6', grid: '#0ea5e9',
  heading: '#f59e0b', text: '#a3a3a3', button: '#22c55e', image: '#ec4899',
  video: '#f43f5e', card: '#a855f7', form: '#14b8a6', navbar: '#06b6d4',
  footer: '#64748b', input: '#f59e0b',
};

const BREAKPOINT_COLORS: Record<string, string> = {
  desktop: '#0073E6', tablet: '#8b5cf6', mobile: '#22c55e',
};

export const EditorStatusBar = memo(function EditorStatusBar() {
  const { state, selectedElement, dispatch } = useEditor();
  const totalElements = useMemo(() => countElements(state.elements), [state.elements]);
  const breadcrumb = useMemo(
    () => selectedElement ? getBreadcrumb(state.elements, selectedElement.id) : [],
    [selectedElement, state.elements]
  );

  // FPS with sparkline history
  const [fps, setFps] = useState(60);
  const [fpsHistory, setFpsHistory] = useState<number[]>(() => new Array(24).fill(60));
  const fpsHistoryRef = useRef<number[]>(new Array(24).fill(60));

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf: number;
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        const currentFps = frames;
        setFps(currentFps);
        fpsHistoryRef.current = [...fpsHistoryRef.current.slice(1), currentFps];
        setFpsHistory([...fpsHistoryRef.current]);
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Uptime timer & streak
  const [uptime, setUptime] = useState(0);
  const actionCountRef = useRef(0);
  const [actionsPerMin, setActionsPerMin] = useState(0);
  const lastActionTime = useRef(Date.now());
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);

  // Track actions via history changes — also update streak
  useEffect(() => {
    actionCountRef.current = state.historyIndex;
    const now = Date.now();
    if (now - lastActionTime.current < 5000) {
      streakRef.current++;
    } else {
      streakRef.current = 1;
    }
    lastActionTime.current = now;
    setStreak(streakRef.current);
  }, [state.historyIndex]);

  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setUptime(elapsed);
      const mins = elapsed / 60;
      if (mins > 0) setActionsPerMin(Math.round(actionCountRef.current / mins));
      // Decay streak if idle
      if (Date.now() - lastActionTime.current > 8000 && streakRef.current > 0) {
        streakRef.current = 0;
        setStreak(0);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const formatUptime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec.toString().padStart(2, '0')}s` : `${sec}s`;
  };

  const fpsColor = fps >= 50 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444';
  const bpColor = BREAKPOINT_COLORS[state.breakpoint] || '#0073E6';

  const memoryEstimate = useMemo(() => {
    const bytes = JSON.stringify(state.elements).length;
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }, [state.elements]);

  const selectedInfo = useMemo(() => {
    if (!selectedElement) return null;
    const s = selectedElement.styles.desktop || {};
    const dims: string[] = [];
    if (s.width) dims.push(`W:${(s.width as string).replace('px', '')}`);
    if (s.height) dims.push(`H:${(s.height as string).replace('px', '')}`);
    if (s.padding) dims.push(`P:${(s.padding as string).replace(/px/g, '')}`);
    if (s.gap) dims.push(`G:${(s.gap as string).replace('px', '')}`);
    return dims.join(' ');
  }, [selectedElement]);

  const [showShortcutHints, setShowShortcutHints] = useState(false);

  return (
    <div
      className="h-7 flex items-center justify-between px-3 shrink-0 select-none"
      style={{ backgroundColor: '#0c0c0c', borderTop: '1px solid #1a1a1a' }}
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {selectedElement ? (
          <div className="flex items-center gap-0.5 overflow-hidden">
            {breadcrumb.map((item, i) => {
              const itemColor = TYPE_COLORS[item.type] || '#0073E6';
              const isLast = i === breadcrumb.length - 1;
              return (
                <span key={item.id} className="flex items-center gap-0.5 shrink-0">
                  {i > 0 && <ChevronRight className="h-2.5 w-2.5" style={{ color: '#222' }} />}
                  <button
                    onClick={() => dispatch({ type: 'SELECT', payload: item.id })}
                    className="flex items-center gap-1 text-[10px] truncate transition-all rounded px-1 py-0.5"
                    style={{
                      color: isLast ? itemColor : '#444',
                      fontWeight: isLast ? 700 : 400,
                      backgroundColor: isLast ? `${itemColor}08` : 'transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = itemColor; e.currentTarget.style.backgroundColor = `${itemColor}0d`; }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = isLast ? itemColor : '#444';
                      e.currentTarget.style.backgroundColor = isLast ? `${itemColor}08` : 'transparent';
                    }}
                  >
                    {isLast && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
                    )}
                    {item.name}
                  </button>
                </span>
              );
            })}
            {selectedInfo && (
              <span className="ml-2 text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#444', backgroundColor: '#141414', border: '1px solid #1a1a1a' }}>
                {selectedInfo}
              </span>
            )}
            <span className="ml-1 text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded" style={{
              backgroundColor: `${TYPE_COLORS[selectedElement.type] || '#555'}08`,
              color: TYPE_COLORS[selectedElement.type] || '#555',
            }}>
              {selectedElement.type}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MousePointer2 className="h-3 w-3" style={{ color: '#222' }} />
            <span className="text-[10px]" style={{ color: '#333' }}>Click element to edit</span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#333', backgroundColor: '#141414', border: '1px solid #1a1a1a' }}>Tab</span>
            <span className="text-[10px]" style={{ color: '#282828' }}>cycle</span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#333', backgroundColor: '#141414', border: '1px solid #1a1a1a' }}>Enter</span>
            <span className="text-[10px]" style={{ color: '#282828' }}>drill in</span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#333', backgroundColor: '#141414', border: '1px solid #1a1a1a' }}>⌘J</span>
            <span className="text-[10px]" style={{ color: '#282828' }}>AI</span>
          </div>
        )}
      </div>

      {/* Right: stats */}
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {state.saveStatus === 'saving' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1"
            >
              <Save className="h-2.5 w-2.5 animate-pulse" style={{ color: '#3b82f6' }} />
              <span className="text-[8px] font-medium" style={{ color: '#3b82f6' }}>Saving</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FPS with sparkline */}
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded" style={{ backgroundColor: `${fpsColor}06` }} title={`${fps} FPS`}>
          <Gauge className="h-2.5 w-2.5" style={{ color: fpsColor }} />
          <span className="text-[9px] tabular-nums font-mono font-semibold" style={{ color: fpsColor }}>{fps}</span>
          <svg width="36" height="10" className="opacity-50">
            <polyline
              fill="none"
              stroke={fpsColor}
              strokeWidth="1"
              strokeLinejoin="round"
              points={fpsHistory.map((v, i) => `${i * (36 / 23)},${10 - Math.min(v / 60 * 10, 10)}`).join(' ')}
            />
          </svg>
        </div>

        {/* Performance grade */}
        {(() => {
          const grade = fps >= 55 && totalElements < 200 ? 'A' : fps >= 40 && totalElements < 500 ? 'B' : fps >= 25 ? 'C' : 'D';
          const gradeColor = grade === 'A' ? '#22c55e' : grade === 'B' ? '#3b82f6' : grade === 'C' ? '#f59e0b' : '#ef4444';
          return (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${gradeColor}08`, border: `1px solid ${gradeColor}0a` }}
              title={`Performance: ${grade} (${fps} FPS, ${totalElements} elements)`}
            >
              <span style={{ fontSize: '9px', fontWeight: 800, color: gradeColor, fontFamily: 'ui-monospace, monospace' }}>{grade}</span>
            </div>
          );
        })()}

        {/* Uptime, APM & Streak */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(6,182,212,0.04)' }} title={`Session: ${formatUptime(uptime)} | ${actionsPerMin} actions/min`}>
          <Clock className="h-2.5 w-2.5" style={{ color: '#06b6d4' }} />
          <span className="text-[8px] tabular-nums font-mono" style={{ color: '#06b6d4' }}>{formatUptime(uptime)}</span>
          <Zap className="h-2 w-2" style={{ color: actionsPerMin > 10 ? '#f59e0b' : '#333' }} />
          <span className="text-[7px] tabular-nums font-mono" style={{ color: actionsPerMin > 10 ? '#f59e0b' : '#444' }}>{actionsPerMin}/m</span>
        </div>
        {streak >= 3 && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: streak >= 10 ? 'rgba(239,68,68,0.06)' : streak >= 5 ? 'rgba(245,158,11,0.06)' : 'rgba(34,197,94,0.06)',
              border: `1px solid ${streak >= 10 ? 'rgba(239,68,68,0.12)' : streak >= 5 ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)'}`,
            }}
            title={`${streak} actions in a row!`}
          >
            <span style={{ fontSize: '9px' }}>🔥</span>
            <span className="text-[8px] font-bold tabular-nums font-mono" style={{
              color: streak >= 10 ? '#ef4444' : streak >= 5 ? '#f59e0b' : '#22c55e',
            }}>{streak}</span>
          </motion.div>
        )}

        <div className="w-px h-3" style={{ backgroundColor: '#1a1a1a' }} />

        <div className="flex items-center gap-1" title="State size">
          <HardDrive className="h-2.5 w-2.5" style={{ color: '#333' }} />
          <span className="text-[8px] tabular-nums font-mono" style={{ color: '#444' }}>{memoryEstimate}</span>
        </div>

        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3" style={{ color: '#252525' }} />
          <span className="text-[10px] tabular-nums font-semibold" style={{ color: '#444' }}>{totalElements}</span>
        </div>

        <button
          onClick={() => dispatch({ type: 'SET_ZOOM', payload: 1 })}
          className="text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded transition-colors"
          style={{
            color: Math.round(state.zoom * 100) !== 100 ? '#0073E6' : '#444',
            backgroundColor: Math.round(state.zoom * 100) !== 100 ? 'rgba(0,115,230,0.06)' : 'transparent',
          }}
          title="Reset zoom"
        >
          {Math.round(state.zoom * 100)}%
        </button>

        <span
          className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
          style={{ color: bpColor, backgroundColor: `${bpColor}08`, border: `1px solid ${bpColor}0a` }}
        >
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: bpColor }} />
          {state.breakpoint}
        </span>

        <AnimatePresence>
          {state.isDirty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.08)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#f59e0b' }} />
              <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: '#f59e0b' }}>unsaved</span>
            </motion.div>
          )}
        </AnimatePresence>

        <span className="text-[8px] tabular-nums font-mono" style={{ color: '#252525' }} title="History position">
          {state.historyIndex}/{state.history.length - 1}
        </span>

        {/* Shortcuts panel */}
        <button
          onClick={() => setShowShortcutHints(v => !v)}
          className="flex items-center gap-1 text-[9px] transition-all rounded px-1.5 py-0.5 relative"
          style={{ color: showShortcutHints ? '#0073E6' : '#333', backgroundColor: showShortcutHints ? 'rgba(0,115,230,0.06)' : 'transparent' }}
          onMouseEnter={e => { if (!showShortcutHints) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#888'; } }}
          onMouseLeave={e => { if (!showShortcutHints) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#333'; } }}
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-2.5 w-2.5" />
          <span className="font-mono text-[8px]">⌘K</span>

          {showShortcutHints && (
            <div
              className="absolute bottom-full right-0 mb-2 w-52 p-2.5 rounded-xl z-[1100]"
              style={{ backgroundColor: '#111', border: '1px solid #2a2a2a', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-[8px] font-bold uppercase tracking-widest mb-2" style={{ color: '#444' }}>Quick Shortcuts</div>
              {[
                ['⌘D', 'Duplicate'],
                ['⌘G', 'Group / Wrap'],
                ['Del', 'Delete'],
                ['⌘Z', 'Undo'],
                ['⌘⇧Z', 'Redo'],
                ['⌘⌥C', 'Copy style'],
                ['⌘⌥V', 'Paste style'],
                ['Space', 'Pan canvas'],
                ['⌘+Scroll', 'Zoom'],
                ['Tab', 'Cycle elements'],
                ['Enter', 'Drill into child'],
                ['Esc', 'Select parent'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-0.5">
                  <span className="text-[9px]" style={{ color: '#888' }}>{desc}</span>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#666', backgroundColor: '#1a1a1a' }}>{key}</span>
                </div>
              ))}
            </div>
          )}
        </button>
      </div>
    </div>
  );
});
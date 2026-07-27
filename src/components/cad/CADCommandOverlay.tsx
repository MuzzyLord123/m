import { useState, useRef, useEffect, useMemo } from 'react';
import { useCAD } from './CADContext';
import { cn } from '@/lib/utils';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';

const COMMANDS = [
  'LINE', 'CIRCLE', 'RECTANGLE', 'POLYGON', 'ELLIPSE', 'POLYLINE', 'ARC', 'SPLINE',
  'WALL', 'COLUMN', 'BOX', 'WINDOW', 'DOOR', 'SLAB',
  'SPHERE', 'CONE', 'CYLINDER', 'TORUS', 'PYRAMID', 'STAIRS', 'TUBE',
  'MOVE', 'COPY', 'ROTATE', 'SCALE', 'MIRROR', 'TRIM', 'EXTEND', 'EXTRUDE',
  'FILLET', 'CHAMFER', 'OFFSET', 'ARRAY', 'EXPLODE',
  'UNDO', 'REDO', 'ERASE', 'DELETE',
  'GRID', 'SNAP', 'ORTHO', 'POLAR',
  'XY', 'XZ', 'YZ', 'FREE',
  'SELECT', 'PAN', 'DIST', 'AREA',
  'ZOOM', 'ISOLATE', 'HIDE', 'SHOWALL',
  'GROUP', 'UNGROUP', 'BLOCK', 'INSERT',
];

function getPrompt(tool: string, pts3D: number, pts2D: number): string {
  const pts = pts3D || pts2D;
  switch (tool) {
    case 'select': return 'Select objects or type command:';
    case 'pan': return 'Pan view — middle mouse or right drag';
    case 'line': case 'line3d':
      return pts === 0 ? 'Specify first point:' : 'Specify next point or [Enter to finish]:';
    case 'circle':
      return pts === 0 ? 'Specify center point:' : 'Specify radius or type value:';
    case 'rectangle':
      return pts === 0 ? 'Specify first corner:' : 'Specify opposite corner:';
    case 'polygon':
      return pts === 0 ? 'Specify center point:' : 'Specify radius:';
    case 'ellipse':
      return pts === 0 ? 'Specify center:' : 'Drag to set radii:';
    case 'polyline':
      return pts === 0 ? 'Specify first point:' : `${pts} pts — click next or double-click to finish`;
    case 'wall':
      return pts === 0 ? 'Specify wall start point:' : 'Specify wall end point:';
    case 'box3d':
      return pts === 0 ? 'Specify first corner:' : pts === 1 ? 'Specify opposite corner:' : 'Specify height:';
    case 'sphere':
      return pts === 0 ? 'Specify center:' : 'Specify radius:';
    case 'cone': case 'cylinder':
      return pts === 0 ? 'Specify base center:' : 'Drag for radius/height:';
    case 'torus':
      return pts === 0 ? 'Specify center:' : 'Drag for major radius:';
    case 'pyramid':
      return pts === 0 ? 'Specify base center:' : 'Drag for size/height:';
    case 'stairs':
      return pts === 0 ? 'Specify start point:' : 'Specify width:';
    case 'column':
      return pts === 0 ? 'Specify base point:' : 'Drag for radius:';
    case 'move':
      return pts === 0 ? 'Specify base point:' : 'Specify displacement:';
    case 'copy':
      return pts === 0 ? 'Specify base point:' : 'Specify second point:';
    case 'rotate':
      return pts === 0 ? 'Specify base point:' : 'Specify rotation angle:';
    case 'scale':
      return pts === 0 ? 'Specify base point:' : 'Specify scale factor:';
    case 'extrude':
      return 'Specify extrusion height:';
    default:
      return `${tool.toUpperCase()} — click to place`;
  }
}

type LogEntry = { text: string; type: 'command' | 'prompt' | 'error' | 'info' };

export function CADCommandOverlay() {
  const { state, executeCommand } = useCAD();
  const [input, setInput] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    { text: 'CAD Studio v2.0 initialized. Type commands or use tools.', type: 'info' },
    { text: 'Press / or ` to focus command line. ⌘K for command palette.', type: 'info' },
  ]);
  const [height, setHeight] = useState(100);
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startY: number; startH: number } | null>(null);

  const prompt = getPrompt(state.activeTool, state.drawingInProgress3D.length, state.drawingInProgress.length);

  const suggestions = useMemo(() => {
    if (!input.trim() || input.length < 1) return [];
    const upper = input.toUpperCase();
    return COMMANDS.filter(c => c.startsWith(upper)).slice(0, 8);
  }, [input]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logEntries, state.commandHistory]);

  useEffect(() => {
    if (state.commandHistory.length > 0) {
      const last = state.commandHistory[state.commandHistory.length - 1];
      setLogEntries(prev => [...prev.slice(-98), { text: last, type: 'command' }]);
    }
  }, [state.commandHistory.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' || e.key === '`') {
        if (document.activeElement !== inputRef.current) {
          e.preventDefault();
          setIsMinimized(false);
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (resizeRef.current) {
        const delta = resizeRef.current.startY - e.clientY;
        setHeight(Math.max(60, Math.min(300, resizeRef.current.startH + delta)));
      }
    };
    const onMouseUp = () => { resizeRef.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    executeCommand(input.trim());
    setInput('');
    setHistoryIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, state.commandHistory.length - 1);
      setHistoryIdx(newIdx);
      if (newIdx >= 0) setInput(state.commandHistory[state.commandHistory.length - 1 - newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInput(newIdx >= 0 ? state.commandHistory[state.commandHistory.length - 1 - newIdx] : '');
    } else if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      setInput(suggestions[0]);
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const propertiesOpen = state.propertiesPanelOpen;
  const aiPanelOpen = (window as any).__cadAIPanelOpen;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-[28px] left-[48px] z-[999] h-7 px-3 bg-[#080808]/95 backdrop-blur-xl border border-white/[0.06] rounded-t-md flex items-center gap-2 text-white/30 hover:text-white/60 transition-all"
      >
        <Terminal className="h-3 w-3" />
        <span className="text-[9px] font-mono">Command Line</span>
        <ChevronUp className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-[28px] left-[48px] z-[999] flex flex-col"
      style={{ right: propertiesOpen ? '300px' : aiPanelOpen ? '400px' : '0', height: `${height}px` }}
    >
      {/* Resize handle */}
      <div className="flex items-center justify-between h-5 bg-[#080808] border-t border-white/[0.04] px-2">
        <div
          className="flex-1 h-full cursor-ns-resize group flex items-center justify-center"
          onMouseDown={e => { resizeRef.current = { startY: e.clientY, startH: height }; }}
        >
          <div className="w-8 h-0.5 rounded-full bg-white/[0.06] group-hover:bg-[#3B82F6]/30 transition-colors" />
        </div>
        <button onClick={() => setIsMinimized(true)} className="text-white/20 hover:text-white/50 transition-all">
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Command log */}
      <div className="flex-1 bg-[#060606] overflow-hidden flex flex-col">
        <div
          ref={logRef}
          className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[11px]"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}
        >
          {logEntries.map((entry, i) => (
            <div key={i} className={cn(
              "py-0.5",
              entry.type === 'command' && 'text-emerald-400/80',
              entry.type === 'prompt' && 'text-white/60',
              entry.type === 'error' && 'text-amber-400/80',
              entry.type === 'info' && 'text-white/25',
            )}>
              {entry.type === 'command' && <span className="text-emerald-500/60 mr-1">›</span>}
              {entry.text}
            </div>
          ))}
        </div>

        {/* Autocomplete */}
        {suggestions.length > 0 && input.length > 0 && (
          <div className="flex gap-1 px-3 py-1 border-t border-white/[0.03]">
            {suggestions.map(cmd => (
              <button
                key={cmd}
                onClick={() => { setInput(cmd); inputRef.current?.focus(); }}
                className="px-2 py-0.5 rounded-md bg-white/[0.03] text-[9px] font-mono text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors border border-white/[0.04]"
              >
                {cmd}
              </button>
            ))}
          </div>
        )}

        {/* Prompt line */}
        <div className="px-3 py-0.5 text-[10px] font-mono text-[#60A5FA]/60 border-t border-white/[0.03]">
          {prompt}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-1.5 border-t border-white/[0.05] bg-[#050505]">
          <span className="text-emerald-500/60 text-xs font-mono flex-shrink-0">›</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-emerald-400/90 font-mono text-[12px] outline-none placeholder:text-white/10 caret-emerald-400"
            placeholder="Type command..."
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex items-center gap-2 text-[8px] font-mono text-white/20">
            <span className="capitalize bg-white/[0.03] px-1.5 py-0.5 rounded">{state.activeTool}</span>
            {state.drawingInProgress3D.length > 0 && (
              <span className="text-cyan-400/60 bg-cyan-400/[0.06] px-1.5 py-0.5 rounded">{state.drawingInProgress3D.length} pts</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

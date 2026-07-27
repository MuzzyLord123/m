import { useState, useRef, useEffect, useCallback } from 'react';
import { useCAD } from './CADContext';
import { cn } from '@/lib/utils';
import { Crosshair, Grip, CornerUpRight, Compass, Activity, Cpu, HardDrive, Layers, Grid3X3, Columns, Ruler, Gauge } from 'lucide-react';

const GRID_PRESETS = [0.1, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100];

function getToolHint(tool: string): string {
  switch (tool) {
    case 'select': return 'Click to select, drag for box';
    case 'line': case 'line3d': return 'Click start, click end, type length';
    case 'rectangle': return 'Click corner, click/type w,h';
    case 'circle': return 'Click center, click/type radius';
    case 'wall': return 'Click corners to chain walls';
    case 'push-pull': return 'Click face, drag or type distance';
    case 'move': return 'Base pt → target, Ctrl=copy';
    case 'copy': return 'Base pt → target, x3 for array';
    case 'rotate': return 'Center → ref → angle, type deg';
    case 'scale': return 'Base → drag grip, type factor';
    case 'offset': return 'Select face, type distance';
    case 'measure-distance': return 'Click 2 pts, Ctrl=guide';
    case 'trim': return 'Click to erase, drag for multi';
    case 'spline': return 'Click control points, Enter to finish';
    case 'polyline': return 'Click points, close near start or dbl-click';
    case 'arc': return 'Click center, radius pt, end angle';
    case 'polygon': return 'Click center, drag radius';
    case 'ellipse': return 'Click center, drag radii';
    case 'box3d': return 'Click 2 corners, then height';
    case 'sphere': return 'Click center, drag radius';
    case 'cylinder': return 'Click center, drag radius & height';
    case 'cone': return 'Click base, drag radius & height';
    case 'text': return 'Click to place text';
    case 'dim-linear': return 'Click 2 points to dimension';
    default: return '';
  }
}

export function CADStatusBar() {
  const { state, dispatch } = useCAD();
  const wp = state.worldPos || { x: 0, y: 0, z: 0 };
  const [gridMenuOpen, setGridMenuOpen] = useState(false);
  const [customGrid, setCustomGrid] = useState('');
  const gridMenuRef = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState(60);
  const [memUsage, setMemUsage] = useState(0);
  const [fpsHistory, setFpsHistory] = useState<number[]>(() => new Array(40).fill(60));
  const [showPerfGraph, setShowPerfGraph] = useState(false);
  const fpsHistoryRef = useRef<number[]>(new Array(40).fill(60));

  // FPS counter with history
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    const measure = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        const currentFps = frames;
        setFps(currentFps);
        fpsHistoryRef.current = [...fpsHistoryRef.current.slice(1), currentFps];
        setFpsHistory([...fpsHistoryRef.current]);
        frames = 0;
        last = now;
        if ((performance as any).memory) {
          setMemUsage(Math.round((performance as any).memory.usedJSHeapSize / 1048576));
        }
      }
      requestAnimationFrame(measure);
    };
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target as Node)) {
        setGridMenuOpen(false);
      }
    };
    if (gridMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [gridMenuOpen]);

  const toggles = [
    { label: 'GRID', active: state.gridVisible, action: 'TOGGLE_GRID', key: 'F7' },
    { label: 'SNAP', active: state.snapEnabled, action: 'TOGGLE_SNAP', key: 'F3' },
    { label: 'ORTHO', active: state.orthoMode, action: 'TOGGLE_ORTHO', key: 'F8' },
    { label: 'POLAR', active: state.polarTracking, action: 'TOGGLE_POLAR', key: 'F10' },
  ];

  const setGrid = (size: number) => {
    dispatch({ type: 'SET_GRID_SIZE', payload: size });
    setGridMenuOpen(false);
  };

  const handleCustomGrid = () => {
    const val = parseFloat(customGrid);
    if (!isNaN(val) && val > 0 && val <= 1000) {
      setGrid(val);
      setCustomGrid('');
    }
  };

  const drawPts = state.drawingInProgress3D.length || state.drawingInProgress.length;
  const activeLayer = state.layers.find(l => l.id === state.activeLayerId);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-7 bg-[#1a1a1a] border-t border-[#333] flex items-center px-3 gap-2 z-[1000] text-[10px] font-mono select-none">
      {/* Active tool badge with hint */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#4A90D9]/10 border border-[#4A90D9]/20">
        <div className="h-1.5 w-1.5 rounded-full bg-[#4A90D9] animate-pulse" />
        <span className="text-[#4A90D9] capitalize font-semibold text-[10px]">{state.activeTool}</span>
        {state.copyMode && <span className="text-amber-600 text-[8px] font-bold ml-0.5">COPY</span>}
        <span className="text-[#666] text-[8px] ml-1">{getToolHint(state.activeTool)}</span>
      </div>

      {/* Inference lock indicator */}
      {state.inferenceLockedAxis && (
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border",
          state.inferenceLockedAxis === 'x' && "text-red-400 bg-red-500/10 border-red-500/20",
          state.inferenceLockedAxis === 'y' && "text-green-400 bg-green-500/10 border-green-500/20",
          state.inferenceLockedAxis === 'z' && "text-blue-400 bg-blue-500/10 border-blue-500/20",
        )}>
          ⇧ {state.inferenceLockedAxis}-Lock
        </div>
      )}

      <div className="h-3 w-px bg-[#333]" />

      {/* Active layer indicator */}
      {activeLayer && (
        <>
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[#222]">
            <div className="h-2 w-2 rounded-full border border-[#444]" style={{ backgroundColor: activeLayer.color }} />
            <span className="text-[#aaa] text-[9px]">{activeLayer.name}</span>
          </div>
          <div className="h-3 w-px bg-[#333]" />
        </>
      )}

      {/* Drawing plane indicator */}
      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#222]">
        <span className="text-[#666] text-[9px]">{state.drawingPlane.toUpperCase()}</span>
      </div>

      <div className="h-3 w-px bg-[#333]" />

      {/* Coordinates — colored per axis */}
      <div className="flex items-center gap-2 bg-[#111] border border-[#333] rounded px-2 py-0.5">
        <span className="text-red-500">X</span><span className="text-[#ccc]">{wp.x.toFixed(state.precision)}</span>
        <span className="text-green-500">Y</span><span className="text-[#ccc]">{wp.y.toFixed(state.precision)}</span>
        <span className="text-blue-500">Z</span><span className="text-[#ccc]">{wp.z.toFixed(state.precision)}</span>
      </div>

      <div className="h-3 w-px bg-[#333]" />

      {/* LED toggle buttons */}
      <div className="flex items-center gap-1">
        {toggles.map(t => (
          <button
            key={t.label}
            onClick={() => dispatch({ type: t.action })}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded transition-all text-[9px]",
              t.active ? "text-[#e0e0e0] bg-[#2a2a2a]" : "text-[#666] hover:text-[#aaa]"
            )}
          >
            <div className={cn(
              "h-1.5 w-1.5 rounded-full transition-all",
              t.active ? "bg-[#4A90D9] shadow-[0_0_4px_rgba(74,144,217,0.5)]" : "bg-[#444]"
            )} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="h-3 w-px bg-[#333]" />

      {/* Floor / Vertical grid toggles */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_FLOOR_GRID' })}
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded transition-all text-[9px]",
            state.floorGridVisible ? "text-[#e0e0e0] bg-[#2a2a2a]" : "text-[#666] hover:text-[#aaa]"
          )}
          title="Floor Grid"
        >
          <Grid3X3 className="h-2.5 w-2.5" />
          FLOOR
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_VERTICAL_GRID' })}
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded transition-all text-[9px]",
            state.verticalGridVisible ? "text-[#e0e0e0] bg-[#2a2a2a]" : "text-[#666] hover:text-[#aaa]"
          )}
          title="Vertical Grid"
        >
          <Columns className="h-2.5 w-2.5" />
          VERT
        </button>
      </div>

      {/* Grid size selector */}
      <div className="relative" ref={gridMenuRef}>
        <button
          onClick={() => setGridMenuOpen(v => !v)}
          className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded transition-all text-[9px]",
            gridMenuOpen ? "text-[#4A90D9] bg-[#2a2a2a]" : "text-[#666] hover:text-[#aaa]"
          )}
        >
          <Grip className="h-2.5 w-2.5 opacity-50" />
          <span>{state.gridSize}</span>
        </button>
        {gridMenuOpen && (
          <div className="absolute bottom-full left-0 mb-1.5 bg-[#222] border border-[#444] rounded-lg shadow-xl py-1.5 min-w-[150px] z-[1100]">
            <div className="px-3 py-1 text-[8px] text-[#666] uppercase tracking-widest font-bold">Grid Spacing</div>
            <div className="max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {GRID_PRESETS.map(size => (
                <button
                  key={size}
                  onClick={() => setGrid(size)}
                  className={cn(
                    "w-full text-left px-3 py-1 text-[10px] hover:bg-[#2a2a2a] transition-colors flex items-center justify-between rounded mx-0.5",
                    state.gridSize === size ? "text-[#4A90D9]" : "text-[#aaa]"
                  )}
                >
                  <span>{size}</span>
                  {state.gridSize === size && <div className="h-1 w-1 rounded-full bg-[#4A90D9]" />}
                </button>
              ))}
            </div>
            <div className="border-t border-[#444] mt-1 pt-1.5 px-2.5">
              <div className="text-[8px] text-[#666] mb-1 uppercase">Custom</div>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="any" min="0.01" max="1000"
                  value={customGrid}
                  onChange={e => setCustomGrid(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustomGrid()}
                  placeholder="0.5"
                  className="flex-1 bg-[#111] border border-[#444] rounded px-2 py-0.5 text-[10px] text-[#e0e0e0] outline-none focus:border-[#4A90D9] w-16"
                />
                <button onClick={handleCustomGrid} className="px-2 py-0.5 bg-[#4A90D9]/10 text-[#4A90D9] rounded text-[9px] hover:bg-[#4A90D9]/20 transition-colors">Set</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Construction guides count */}
      {state.constructionGuides.length > 0 && (
        <>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#222] text-[#aaa] text-[9px]">
            <Ruler className="h-2.5 w-2.5 opacity-60" />
            {state.constructionGuides.length} guides
          </div>
          <div className="h-3 w-px bg-[#333]" />
        </>
      )}

      {/* Drawing progress */}
      {drawPts > 0 && (
        <>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#4A90D9]/10 border border-[#4A90D9]/20">
            <Crosshair className="h-2.5 w-2.5 text-[#4A90D9]" />
            <span className="text-[#4A90D9] text-[9px]">{drawPts} pts</span>
          </div>
          <div className="h-3 w-px bg-[#333]" />
        </>
      )}

      {/* Axis constraint */}
      {state.axisConstraint !== 'none' && (
        <>
          <div className={cn(
            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
            state.axisConstraint === 'x' && "text-red-400 bg-red-500/10",
            state.axisConstraint === 'y' && "text-green-400 bg-green-500/10",
            state.axisConstraint === 'z' && "text-blue-400 bg-blue-500/10",
          )}>
            {state.axisConstraint}-Lock
          </div>
          <div className="h-3 w-px bg-[#333]" />
        </>
      )}

      {/* Selection indicator */}
      {state.selectedIds.length > 0 && (
        <>
          <div className="flex items-center gap-1 text-[9px] text-[#4A90D9]">
            <span>{state.selectedIds.length} sel</span>
          </div>
          <div className="h-3 w-px bg-[#333]" />
        </>
      )}

      <span className="text-[#666] uppercase text-[9px]">{state.units}</span>
      <div className="h-3 w-px bg-[#333]" />
      <span className="text-[#666] text-[9px]">{state.entities.length} obj</span>
      <div className="h-3 w-px bg-[#333]" />

      {/* Layers count */}
      <div className="flex items-center gap-1">
        <Layers className="h-2.5 w-2.5 text-[#555]" />
        <span className="text-[#666] text-[9px]">{state.layers.length}</span>
      </div>
      <div className="h-3 w-px bg-[#333]" />

      {/* Memory usage */}
      {memUsage > 0 && (
        <>
          <div className="flex items-center gap-1">
            <HardDrive className="h-2.5 w-2.5 text-[#555]" />
            <span className="text-[#666] text-[9px]">{memUsage}MB</span>
          </div>
          <div className="h-3 w-px bg-[#333]" />
        </>
      )}

      {/* FPS counter with sparkline */}
      <div
        className="flex items-center gap-1 cursor-pointer relative"
        onClick={() => setShowPerfGraph(v => !v)}
        title="Click for performance graph"
      >
        <Activity className={cn("h-2.5 w-2.5", fps >= 50 ? "text-green-600/50" : fps >= 30 ? "text-amber-600/50" : "text-red-600/50")} />
        <span className={cn("text-[9px] tabular-nums", fps >= 50 ? "text-green-600/50" : fps >= 30 ? "text-amber-600/50" : "text-red-600/50")}>{fps}</span>
        
        {/* Mini sparkline */}
        <svg width="32" height="10" className="opacity-40">
          <polyline
            fill="none"
            stroke={fps >= 50 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444'}
            strokeWidth="1"
            points={fpsHistory.slice(-16).map((v, i) => `${i * 2},${10 - Math.min(v / 60 * 10, 10)}`).join(' ')}
          />
        </svg>

        {/* Performance overlay */}
        {showPerfGraph && (
          <div className="absolute bottom-full right-0 mb-2 bg-[#111] border border-[#333] rounded-lg p-3 shadow-2xl w-[220px] z-[1100]">
            <div className="text-[8px] text-[#666] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
              <Gauge className="h-2.5 w-2.5" /> Performance Monitor
            </div>
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] text-[#888]">FPS</span>
                <span className={cn("text-[10px] font-bold tabular-nums", fps >= 50 ? "text-green-500" : fps >= 30 ? "text-amber-500" : "text-red-500")}>{fps}</span>
              </div>
              <svg width="194" height="40" className="block">
                <line x1="0" y1="0" x2="194" y2="0" stroke="#222" strokeWidth="0.5" />
                <line x1="0" y1="13" x2="194" y2="13" stroke="#222" strokeWidth="0.5" />
                <line x1="0" y1="26" x2="194" y2="26" stroke="#222" strokeWidth="0.5" />
                <line x1="0" y1="39" x2="194" y2="39" stroke="#222" strokeWidth="0.5" />
                <polygon
                  fill="url(#fpsGrad)"
                  opacity="0.15"
                  points={`0,40 ${fpsHistory.map((v, i) => `${i * (194 / 39)},${40 - Math.min(v / 60 * 40, 40)}`).join(' ')} 194,40`}
                />
                <polyline
                  fill="none"
                  stroke={fps >= 50 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  points={fpsHistory.map((v, i) => `${i * (194 / 39)},${40 - Math.min(v / 60 * 40, 40)}`).join(' ')}
                />
                <defs>
                  <linearGradient id="fpsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fps >= 50 ? '#22c55e' : '#f59e0b'} />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex justify-between text-[7px] text-[#444] mt-0.5">
                <span>40s ago</span>
                <span>now</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="bg-[#1a1a1a] rounded px-1.5 py-1 text-center">
                <div className="text-[7px] text-[#555]">AVG</div>
                <div className="text-[9px] text-[#aaa] font-bold tabular-nums">{Math.round(fpsHistory.reduce((a,b) => a+b, 0) / fpsHistory.length)}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded px-1.5 py-1 text-center">
                <div className="text-[7px] text-[#555]">MIN</div>
                <div className="text-[9px] text-[#aaa] font-bold tabular-nums">{Math.min(...fpsHistory)}</div>
              </div>
              <div className="bg-[#1a1a1a] rounded px-1.5 py-1 text-center">
                <div className="text-[7px] text-[#555]">OBJ</div>
                <div className="text-[9px] text-[#aaa] font-bold tabular-nums">{state.entities.length}</div>
              </div>
            </div>
            {memUsage > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <HardDrive className="h-2.5 w-2.5 text-[#555]" />
                <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(memUsage / 512 * 100, 100)}%`, backgroundColor: memUsage > 400 ? '#ef4444' : memUsage > 200 ? '#f59e0b' : '#22c55e' }}
                  />
                </div>
                <span className="text-[8px] text-[#666] tabular-nums">{memUsage}MB</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-3 w-px bg-[#333]" />
      <span className="text-[#666] text-[9px] tabular-nums">{Math.round(state.zoom * 100)}%</span>
    </div>
  );
}

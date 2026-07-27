import { useState, useRef, useEffect } from 'react';
import { useCAD } from './CADContext';
import { generateId } from './cadGeometry';
import { cn } from '@/lib/utils';
import { copyEntity } from './cadTransforms';

/**
 * SketchUp-style Value Control Box (VCB) — Enterprise Edition
 * Bottom-right input that accepts typed values during any operation.
 * Supports: dimensions, distances, angles, array notation (x3, /3), wall params
 */
export function CADValueControlBox() {
  const { state, dispatch, addEntity } = useCAD();
  const [value, setValue] = useState('');
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastPushPullRef = useRef<number>(0);

  const isDrawing = state.drawingInProgress3D.length > 0 || state.drawingInProgress.length > 0;
  const isTransforming = state.transformOp?.phase === 'awaiting-target';
  const isPushPull = state.activeTool === 'push-pull';
  const isCopyMode = (window as any).__cadCopyMode;
  const isActive = isDrawing || isTransforming || isPushPull;

  // Listen for number key presses to auto-activate VCB
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!isActive) return;

      // Number, decimal, comma, minus, x, /, h, s activates VCB
      if (/^[0-9.,\-xX/hHsS]$/.test(e.key)) {
        e.preventDefault();
        setActive(true);
        setValue(prev => prev + e.key);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const raw = value.trim();

    // Array notation: x3 = 3 copies at same spacing, /3 = 3 evenly spaced
    if (/^[xX]\d+$/.test(raw)) {
      const count = parseInt(raw.slice(1));
      if (count > 0 && count <= 100) {
        // Repeat last transform operation
        const lastCmd = state.commandHistory[state.commandHistory.length - 1];
        dispatch({ type: 'ADD_COMMAND', payload: `Array: ${count} copies (×${count})` });
        (window as any).__cadArrayCount = count;
        (window as any).__cadArrayMode = 'repeat';
      }
      setValue('');
      setActive(false);
      return;
    }

    if (/^\/\d+$/.test(raw)) {
      const count = parseInt(raw.slice(1));
      if (count > 1 && count <= 100) {
        dispatch({ type: 'ADD_COMMAND', payload: `Array: ${count} divisions (/${count})` });
        (window as any).__cadArrayCount = count;
        (window as any).__cadArrayMode = 'divide';
      }
      setValue('');
      setActive(false);
      return;
    }

    // Wall height: h30 = set wall height to 30
    if (/^[hH]\d+\.?\d*$/.test(raw)) {
      const h = parseFloat(raw.slice(1));
      if (!isNaN(h) && h > 0) {
        (window as any).__cadWallHeight = h;
        dispatch({ type: 'ADD_COMMAND', payload: `Wall height set: ${h}` });
      }
      setValue('');
      setActive(false);
      return;
    }

    // Circle segments: s24 = 24 segments
    if (/^[sS]\d+$/.test(raw)) {
      const segments = parseInt(raw.slice(1));
      if (segments >= 3 && segments <= 128) {
        (window as any).__cadCircleSegments = segments;
        dispatch({ type: 'ADD_COMMAND', payload: `Circle segments: ${segments}` });
      }
      setValue('');
      setActive(false);
      return;
    }

    // Check for width,height format (e.g., "100,50")
    const parts = raw.split(',').map(s => parseFloat(s.trim()));

    if (state.activeTool === 'rectangle' && parts.length === 2 && parts.every(p => !isNaN(p))) {
      if (state.drawingInProgress3D.length >= 1) {
        const start = state.drawingInProgress3D[0];
        addEntity({
          id: generateId(),
          type: 'rectangle',
          layerId: state.activeLayerId,
          data: { origin: { x: start.x, y: start.z }, width: parts[0], height: parts[1] },
        } as any);
        dispatch({ type: 'ADD_COMMAND', payload: `Rectangle: ${parts[0]} × ${parts[1]}` });
        dispatch({ type: 'CLEAR_DRAWING' });
      }
    } else if (state.activeTool === 'circle' && parts.length === 1 && !isNaN(parts[0])) {
      if (state.drawingInProgress3D.length >= 1) {
        const center = state.drawingInProgress3D[0];
        addEntity({
          id: generateId(),
          type: 'circle',
          layerId: state.activeLayerId,
          data: { center: { x: center.x, y: center.z }, radius: parts[0] },
        } as any);
        dispatch({ type: 'ADD_COMMAND', payload: `Circle: R=${parts[0]}` });
        dispatch({ type: 'CLEAR_DRAWING' });
      }
    } else if ((state.activeTool === 'line' || state.activeTool === 'line3d') && parts.length === 1 && !isNaN(parts[0])) {
      const dist = parts[0];
      if (state.drawingInProgress3D.length >= 1) {
        const lastPt = state.drawingInProgress3D[state.drawingInProgress3D.length - 1];
        const wp = state.worldPos;
        if (wp) {
          const dx = wp.x - lastPt.x, dy = wp.y - lastPt.y, dz = wp.z - lastPt.z;
          const curDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (curDist > 0.001) {
            const nx = dx / curDist, ny = dy / curDist, nz = dz / curDist;
            const endPt = { x: lastPt.x + nx * dist, y: lastPt.y + ny * dist, z: lastPt.z + nz * dist };
            dispatch({ type: 'ADD_ENTITY_CONTINUE', payload: { id: generateId(), type: 'line3d', layerId: state.activeLayerId, data: { start: lastPt, end: endPt } } });
            dispatch({ type: 'SET_DRAWING_3D', payload: [endPt] });
            dispatch({ type: 'ADD_COMMAND', payload: `Line: L=${dist}` });
          }
        }
      }
    } else if (state.activeTool === 'push-pull' && parts.length === 1 && !isNaN(parts[0])) {
      lastPushPullRef.current = parts[0];
      (window as any).__cadVCBPushPullDistance = parts[0];
      dispatch({ type: 'ADD_COMMAND', payload: `Push/Pull distance: ${parts[0]}` });
    } else if (state.activeTool === 'wall' && parts.length === 1 && !isNaN(parts[0])) {
      // Wall with exact length in current direction
      if (state.drawingInProgress3D.length >= 1) {
        const base = state.drawingInProgress3D[state.drawingInProgress3D.length - 1];
        const wp = state.worldPos;
        if (wp) {
          const dx = wp.x - base.x, dz = wp.z - base.z;
          const dir = Math.abs(dx) > Math.abs(dz) ? 'x' : 'z';
          const wallThickness = (window as any).__cadWallThickness || 3;
          const wallHeight = (window as any).__cadWallHeight || 30;
          const len = parts[0];
          const sign = dir === 'x' ? Math.sign(dx || 1) : Math.sign(dz || 1);
          
          const wallData = dir === 'x'
            ? { base: { x: base.x + (sign < 0 ? -len : 0), y: base.y, z: base.z - wallThickness / 2 }, width: len, depth: wallThickness, height: wallHeight }
            : { base: { x: base.x - wallThickness / 2, y: base.y, z: base.z + (sign < 0 ? -len : 0) }, width: wallThickness, depth: len, height: wallHeight };

          addEntity({ id: generateId(), type: 'wall', layerId: state.activeLayerId, data: wallData } as any);
          const endPt = dir === 'x'
            ? { x: base.x + sign * len, y: base.y, z: base.z }
            : { x: base.x, y: base.y, z: base.z + sign * len };
          dispatch({ type: 'SET_DRAWING_3D', payload: [endPt] });
          dispatch({ type: 'ADD_COMMAND', payload: `Wall: L=${len}` });
        }
      }
    } else if (state.activeTool === 'box3d' && parts.length >= 2) {
      if (state.drawingInProgress3D.length >= 1) {
        const start = state.drawingInProgress3D[0];
        const w = parts[0], d = parts.length > 1 ? parts[1] : parts[0], h = parts.length > 2 ? parts[2] : 10;
        addEntity({
          id: generateId(),
          type: 'box3d',
          layerId: state.activeLayerId,
          data: { origin: start, width: w, depth: d, height: h },
        } as any);
        dispatch({ type: 'ADD_COMMAND', payload: `Box: ${w} × ${d} × ${h}` });
        dispatch({ type: 'CLEAR_DRAWING' });
      }
    } else if (state.activeTool === 'rotate' && parts.length === 1 && !isNaN(parts[0])) {
      dispatch({ type: 'ADD_COMMAND', payload: `Rotate: ${parts[0]}°` });
    } else if (state.activeTool === 'scale' && parts.length === 1 && !isNaN(parts[0])) {
      dispatch({ type: 'ADD_COMMAND', payload: `Scale: ${parts[0]}x` });
    } else if (state.activeTool === 'offset' && parts.length === 1 && !isNaN(parts[0])) {
      dispatch({ type: 'ADD_COMMAND', payload: `Offset: ${parts[0]}` });
    } else if ((state.activeTool === 'move' || state.activeTool === 'copy') && parts.length === 1 && !isNaN(parts[0])) {
      // Move/copy with exact distance in current direction
      dispatch({ type: 'ADD_COMMAND', payload: `${state.activeTool === 'copy' ? 'Copy' : 'Move'} distance: ${parts[0]}` });
    } else if (parts.length === 1 && !isNaN(parts[0])) {
      dispatch({ type: 'ADD_COMMAND', payload: `Value: ${parts[0]}` });
    }

    setValue('');
    setActive(false);
    inputRef.current?.blur();
  };

  // Tool-specific labels
  const getLabel = () => {
    switch (state.activeTool) {
      case 'line': case 'line3d': return 'Length';
      case 'rectangle': return 'Dimensions';
      case 'circle': return 'Radius';
      case 'push-pull': return 'Distance';
      case 'rotate': return 'Angle';
      case 'scale': return 'Factor';
      case 'move': return isCopyMode ? 'Copy Dist' : 'Distance';
      case 'copy': return 'Distance';
      case 'offset': return 'Offset';
      case 'wall': return 'Length';
      case 'box3d': return 'W,D,H';
      default: return 'Value';
    }
  };

  const getPlaceholder = () => {
    switch (state.activeTool) {
      case 'rectangle': return 'w,h';
      case 'circle': return 'radius';
      case 'push-pull': return 'dist';
      case 'rotate': return 'deg';
      case 'scale': return '1.0';
      case 'box3d': return 'w,d,h';
      case 'wall': return 'length';
      case 'offset': return 'dist';
      default: return 'value';
    }
  };

  const getHint = () => {
    switch (state.activeTool) {
      case 'rectangle': return 'w,h or single value';
      case 'circle': return 'radius | s24 for segments';
      case 'wall': return 'length | h30 for height';
      case 'move': case 'copy': return 'dist | x3 for array | /3 for divide';
      case 'push-pull': return 'exact distance';
      case 'box3d': return 'w,d,h (3 values)';
      default: return '';
    }
  };

  return (
    <div className="fixed bottom-8 right-3 z-[1001] flex flex-col items-end gap-1">
      {isActive && (
        <>
          {/* Hint text */}
          {getHint() && !active && (
            <div className="text-[8px] font-mono text-white/15 px-1">{getHint()}</div>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider">{getLabel()}:</span>
            <input
              ref={inputRef}
              value={value}
              onChange={e => setValue(e.target.value)}
              onFocus={() => setActive(true)}
              onBlur={() => { if (!value) setActive(false); }}
              onKeyDown={e => { if (e.key === 'Escape') { setValue(''); setActive(false); e.currentTarget.blur(); } }}
              placeholder={getPlaceholder()}
              className={cn(
                "w-28 bg-[#0a0a0a]/90 border rounded px-2 py-1 text-[12px] font-mono text-white/90 outline-none transition-all",
                active ? "border-[#3B82F6]/50 shadow-[0_0_8px_rgba(59,130,246,0.2)]" : "border-white/10"
              )}
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        </>
      )}
    </div>
  );
}
